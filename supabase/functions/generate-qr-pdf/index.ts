import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode@1.5.4";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";
import { buildCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Verify admin
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false }
      }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { print_job_id } = body;

    if (!print_job_id) {
      return new Response(JSON.stringify({ error: 'print_job_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch print job
    const { data: job, error: jobError } = await supabase
      .from('qr_print_jobs')
      .select('*')
      .eq('id', print_job_id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Print job not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch print job items with inventory and design info
    const { data: items, error: itemsError } = await supabase
      .from('qr_print_job_items')
      .select(`
        id, public_claim_code, qr_url, generated_at,
        inventory_units!inner(
          internal_inventory_code,
          card_designs!inner(
            title, view_no,
            countries!inner(name_pl)
          )
        )
      `)
      .eq('print_job_id', print_job_id)
      .order('generated_at', { ascending: true });

    if (itemsError || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items found for this print job' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const colWidth = (pageWidth - 2 * margin) / 2;
    const rowHeight = 55;
    const qrSize = 35;
    const itemsPerPage = Math.floor((pageHeight - 2 * margin) / rowHeight) * 2;

interface PrintJobItem {
  id: string;
  public_claim_code: string;
  qr_url: string;
  generated_at: string;
  inventory_units: {
    internal_inventory_code: string;
    card_designs: {
      title: string | null;
      view_no: number;
      countries: {
        name_pl: string | null;
      } | null;
    } | null;
  } | null;
}

    // Title page
    doc.setFontSize(18);
    doc.text(`Druk QR — ${job.name}`, margin, 25);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pl-PL')}`, margin, 33);
    doc.text(`Liczba sztuk: ${items.length}`, margin, 39);
    if (job.shipment_id) doc.text(`Wysyłka: ${job.shipment_id}`, margin, 45);
    doc.text(`ID zadania: ${job.id}`, margin, 51);

    // Generate QR cards - 2 columns layout
    let currentPage = 1;
    doc.addPage();

    const castItems = items as unknown as PrintJobItem[];
    for (let i = 0; i < castItems.length; i++) {
      const item = castItems[i];
      const posOnPage = i % itemsPerPage;
      const col = posOnPage % 2;
      const row = Math.floor(posOnPage / 2);

      if (i > 0 && posOnPage === 0) {
        doc.addPage();
        currentPage++;
      }

      const x = margin + col * colWidth;
      const y = margin + row * rowHeight;

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(item.qr_url, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'M',
      });

      // Draw card border
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, y, colWidth - 5, rowHeight - 3);

      // QR code image
      doc.addImage(qrDataUrl, 'PNG', x + 2, y + 2, qrSize, qrSize);

      // Text info next to QR
      const textX = x + qrSize + 5;
      const textY = y + 6;

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`#${i + 1}`, textX, textY);

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(item.public_claim_code, textX, textY + 6);

      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const country = item.inventory_units?.card_designs?.countries?.name_pl || '—';
      const viewNo = item.inventory_units?.card_designs?.view_no || '?';
      const title = item.inventory_units?.card_designs?.title || '';
      const invCode = item.inventory_units?.internal_inventory_code || '';

      doc.text(`${country} — Widok ${viewNo}`, textX, textY + 12);
      if (title) doc.text(title, textX, textY + 17);
      
      doc.setFontSize(6);
      doc.setTextColor(130, 130, 130);
      doc.text(invCode, textX, textY + 23);

      // Footer with claim code under QR
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text(item.public_claim_code, x + 2, y + qrSize + 6);
    }

    // Page numbers
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(`Strona ${p} / ${totalPages}`, pageWidth - margin - 25, pageHeight - 5);
    }

    // Output PDF as base64
    const pdfBase64 = doc.output('datauristring');

    return new Response(JSON.stringify({
      success: true,
      pdf: pdfBase64,
      items_count: items.length,
      job_name: job.name,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unhandled error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
