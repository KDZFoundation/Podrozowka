// Issues a sales document (invoice or receipt) in 360 Księgowość / Merit Aktiva
// after an order has been paid. Never blocks the order flow: on any error we
// mark fiscal_document_status='failed' and return 200 so the webhook does not
// retry. Idempotent — if the order already has an issued document, we no-op.

import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MERIT_API_ID = Deno.env.get("MERIT_API_ID") || "";
const MERIT_API_KEY = Deno.env.get("MERIT_API_KEY") || "";
const MERIT_RETAIL_CUSTOMER_NAME =
  Deno.env.get("MERIT_RETAIL_CUSTOMER_NAME") || "Klient detaliczny";
const MERIT_BASE = "https://program.360ksiegowosc.pl/api/v1";
const VAT_RATE = 23;

function meritTimestamp(d = new Date()): string {
  const pad = (n: number, w = 2) => n.toString().padStart(w, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

function ymd(d = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

async function hmacSha256Base64(key: string, data: string): Promise<string> {
  const keyBuf = new TextEncoder().encode(key);
  const dataBuf = new TextEncoder().encode(data);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
  const bytes = new Uint8Array(sig);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function meritCall<T = unknown>(endpoint: string, body: unknown): Promise<T> {
  if (!MERIT_API_ID || !MERIT_API_KEY) {
    throw new Error("Merit credentials missing");
  }
  const bodyStr = JSON.stringify(body);
  const ts = meritTimestamp();
  const signature = await hmacSha256Base64(MERIT_API_KEY, MERIT_API_ID + ts + bodyStr);
  const qs = new URLSearchParams({
    ApiId: MERIT_API_ID,
    timestamp: ts,
    signature,
  }).toString();
  const url = `${MERIT_BASE}/${endpoint}?${qs}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyStr,
  });
  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`Merit ${endpoint} HTTP ${res.status}: ${txt.slice(0, 400)}`);
  }
  try {
    return JSON.parse(txt) as T;
  } catch {
    return txt as unknown as T;
  }
}

interface Tax { Id: string; Code: string; TaxPct?: number }
let cachedTaxId: string | null = null;

async function getVatTaxId(): Promise<string> {
  if (cachedTaxId) return cachedTaxId;
  const taxes = await meritCall<Tax[]>("gettaxes", {});
  if (!Array.isArray(taxes)) throw new Error("gettaxes: unexpected response");
  const exact = taxes.find((t) => (t.Code || "").trim() === `${VAT_RATE}%`);
  const fallback = taxes.find(
    (t) =>
      typeof t.TaxPct === "number" &&
      t.TaxPct === VAT_RATE &&
      !/^(OO|ZW|EU|Import|Marża)/i.test(t.Code || ""),
  );
  const found = exact || fallback;
  if (!found) throw new Error(`No VAT ${VAT_RATE}% rate found in Merit`);
  cachedTaxId = found.Id;
  return cachedTaxId;
}

function grossToNet(gross: number): number {
  return Math.round((gross / (1 + VAT_RATE / 100)) * 100) / 100;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  function jsonResp(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResp({ error: "method_not_allowed" }, 405);

  // Gate 1: shared-secret header. Rejects any external caller.
  const expectedSecret = Deno.env.get("INTERNAL_FN_SECRET") || "";
  const providedSecret = req.headers.get("x-internal-secret") || "";
  const enc = new TextEncoder();
  const a = enc.encode(expectedSecret);
  const b = enc.encode(providedSecret);
  const ok = a.length === b.length && a.length > 0;
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  if (diff !== 0 || !ok) {
    return jsonResp({ error: "unauthorized" }, 401);
  }

  let orderId: string | null = null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || typeof body.order_id !== "string") {
      return jsonResp({ error: "invalid_body" }, 400);
    }
    orderId = body.order_id;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        "id, user_id, order_number, total_amount, shipping_cost, invoice_requested, company_name, company_nip, company_address, fiscal_document_status, payment_status",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      console.error("issue-fiscal-document: order not found", orderId, orderErr?.message);
      return jsonResp({ error: "order_not_found" }, 404);
    }

    // Idempotency
    if (order.fiscal_document_status === "issued" || order.fiscal_document_status === "issued_manual") {
      return jsonResp({ ok: true, skipped: "already_issued" });
    }

    // Gate 2: defense-in-depth. Independent of the secret gate — never issue
    // a fiscal document for an order that is not paid, even if the caller
    // presented a valid INTERNAL_FN_SECRET.
    if (order.payment_status !== "paid") {
      console.warn(
        `issue-fiscal-document: refused for order ${order.order_number} — payment_status=${order.payment_status}`,
      );
      return jsonResp(
        { error: "order_not_paid", payment_status: order.payment_status },
        409,
      );
    }

    // Kill-switch: in DEV/UAT skip Merit entirely. Only PROD sets FISCAL_ENABLED="true".
    if (Deno.env.get("FISCAL_ENABLED") !== "true") {
      console.log(
        `[issue-fiscal-document] FISCAL_ENABLED != 'true' — skipping Merit call for order ${order.order_number}`,
      );
      await supabase
        .from("orders")
        .update({
          fiscal_document_status: "skipped_test_mode",
          fiscal_document_number: `TEST-${order.order_number}`,
          fiscal_document_issued_at: new Date().toISOString(),
          fiscal_document_error: null,
        })
        .eq("id", orderId);
      return jsonResp({ ok: true, skipped: "test_mode" });
    }

    // Mark pending
    await supabase
      .from("orders")
      .update({ fiscal_document_status: "pending", fiscal_document_error: null })
      .eq("id", orderId);

    // Order lines
    const { data: itemsRaw, error: itemsErr } = await supabase
      .from("order_items")
      .select("quantity, unit_price, total_price, card_designs(title)")
      .eq("order_id", orderId);
    if (itemsErr || !itemsRaw || itemsRaw.length === 0) {
      throw new Error(`Order items load failed: ${itemsErr?.message || "empty"}`);
    }

    // Recipient email
    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(order.user_id);
    if (userErr) throw new Error(`Buyer lookup failed: ${userErr.message}`);
    const buyerEmail = userData?.user?.email || "";

    const taxId = await getVatTaxId();

    // Build invoice rows (net prices per unit)
    type Row = { Description: string; Quantity: number; Price: number; TaxId: string };
    const rows: Row[] = [];
    let runningGross = 0;
    for (const it of itemsRaw as Array<{
      quantity: number;
      unit_price: number;
      total_price: number;
      card_designs: { title: string } | null;
    }>) {
      const netUnit = grossToNet(Number(it.unit_price));
      rows.push({
        Description: (it.card_designs?.title || "Podróżówka").slice(0, 200),
        Quantity: it.quantity,
        Price: netUnit,
        TaxId: taxId,
      });
      runningGross += Math.round(netUnit * (1 + VAT_RATE / 100) * 100) / 100 * it.quantity;
    }

    const shippingGross = Number(order.shipping_cost || 0);
    if (shippingGross > 0) {
      const shippingNet = grossToNet(shippingGross);
      rows.push({
        Description: "Dostawa (InPost Paczkomaty)",
        Quantity: 1,
        Price: shippingNet,
        TaxId: taxId,
      });
      runningGross += Math.round(shippingNet * (1 + VAT_RATE / 100) * 100) / 100;
    }

    // Correct rounding drift against total_amount (adjust last row)
    const target = Math.round(Number(order.total_amount) * 100) / 100;
    const drift = Math.round((target - runningGross) * 100) / 100;
    if (Math.abs(drift) >= 0.01 && rows.length > 0) {
      const last = rows[rows.length - 1];
      const adjustedNetTotal =
        Math.round((last.Price * last.Quantity + drift / (1 + VAT_RATE / 100)) * 100) / 100;
      last.Price = Math.round((adjustedNetTotal / last.Quantity) * 100) / 100;
    }

    const customer = order.invoice_requested
      ? {
          Name: (order.company_name || "").slice(0, 200),
          RegNo: order.company_nip || "",
          Address: (order.company_address || "").slice(0, 500),
          NotTDCustomer: false,
          EmailAddress: buyerEmail || null,
        }
      : {
          Name: MERIT_RETAIL_CUSTOMER_NAME,
          NotTDCustomer: true,
          EmailAddress: buyerEmail || null,
        };

    const today = ymd();
    const invoicePayload = {
      Customer: customer,
      DocumentDate: today,
      TransactionDate: today,
      DueDate: today,
      InvoiceNo: order.order_number,
      CurrencyCode: "PLN",
      InvoiceRow: rows,
    };

    const created = await meritCall<{ InvoiceId: string; InvoiceNo?: string }>(
      "sendinvoice",
      invoicePayload,
    );
    const invoiceId = created?.InvoiceId;
    const invoiceNo = created?.InvoiceNo || order.order_number;
    if (!invoiceId) throw new Error("Merit did not return InvoiceId");

    // Best-effort email delivery (does not fail the whole operation)
    if (buyerEmail) {
      try {
        await meritCall("sendinvoicebyemail", {
          InvoiceId: invoiceId,
          ToEmail: buyerEmail,
          Subject: `Podróżówka – dokument sprzedaży ${invoiceNo}`,
          Message: "W załączniku dokument sprzedaży. Dziękujemy za zamówienie w Podróżówce.",
        });
      } catch (e) {
        console.warn("sendinvoicebyemail failed:", (e as Error).message);
      }
    }

    await supabase
      .from("orders")
      .update({
        fiscal_document_status: "issued",
        fiscal_document_external_id: invoiceId,
        fiscal_document_number: invoiceNo,
        fiscal_document_url: `/functions/v1/fiscal-document-pdf?order=${encodeURIComponent(order.order_number)}`,
        fiscal_document_issued_at: new Date().toISOString(),
        fiscal_document_error: null,
      })
      .eq("id", orderId);

    return jsonResp({ ok: true, invoice_id: invoiceId, invoice_no: invoiceNo });
  } catch (e) {
    const msg = (e as Error).message || String(e);
    console.error("issue-fiscal-document error:", msg);
    if (orderId) {
      await supabase
        .from("orders")
        .update({
          fiscal_document_status: "failed",
          fiscal_document_error: msg.slice(0, 500),
        })
        .eq("id", orderId);
    }
    // Always 200 so the caller does not retry — retry is a manual admin action.
    return jsonResp({ ok: false, error: msg.slice(0, 500) });
  }
});
