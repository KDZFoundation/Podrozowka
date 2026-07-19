import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, QrCode, Printer, ArrowLeft, Eye, Plus, Download, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrintJob {
  id: string;
  name: string;
  status: string;
  total_items: number;
  generated_items: number;
  shipment_id: string | null;
  order_id: string | null;
  created_at: string;
}

interface PrintJobItem {
  id: string;
  inventory_unit_id: string;
  public_claim_code: string;
  qr_url: string;
  generated_at: string;
  unit_code: string | null;
  design_title: string | null;
  country_name: string | null;
  view_no: number | null;
}

interface QrPrintJobItemJoin {
  id: string;
  inventory_unit_id: string;
  public_claim_code: string;
  qr_url: string;
  generated_at: string;
  inventory_units: {
    internal_inventory_code: string;
    card_designs: {
      title: string | null;
      view_no: number;
      countries: {
        name_pl: string;
      } | null;
    } | null;
  } | null;
}

interface ReservedUnitJoin {
  id: string;
  internal_inventory_code: string;
  card_designs: {
    title: string | null;
    view_no: number;
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Oczekuje", className: "bg-muted text-muted-foreground" },
  generating: { label: "Generowanie...", className: "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]" },
  ready: { label: "Gotowe", className: "bg-accent/15 text-accent" },
  printed: { label: "Wydrukowane", className: "bg-primary/15 text-primary" },
  failed: { label: "Błąd", className: "bg-destructive/15 text-destructive" },
};

const AdminQrJobs = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [jobItems, setJobItems] = useState<PrintJobItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // New job form
  const [showNewJob, setShowNewJob] = useState(false);
  const [jobName, setJobName] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reservedUnits, setReservedUnits] = useState<{ id: string; code: string; design: string }[]>([]);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("qr_print_jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setJobs(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const fetchJobItems = async (jobId: string) => {
    setItemsLoading(true);
    const { data } = await supabase
      .from("qr_print_job_items")
      .select(`
        id, inventory_unit_id, public_claim_code, qr_url, generated_at,
        inventory_units!inner(internal_inventory_code, card_designs!inner(title, view_no, countries!inner(name_pl)))
      `)
      .eq("print_job_id", jobId);

    if (data) {
      const typedData = data as unknown as QrPrintJobItemJoin[];
      setJobItems(
        typedData.map((i: QrPrintJobItemJoin) => ({
          id: i.id,
          inventory_unit_id: i.inventory_unit_id,
          public_claim_code: i.public_claim_code,
          qr_url: i.qr_url,
          generated_at: i.generated_at,
          unit_code: i.inventory_units?.internal_inventory_code || null,
          design_title: i.inventory_units?.card_designs?.title || null,
          country_name: i.inventory_units?.card_designs?.countries?.name_pl || null,
          view_no: i.inventory_units?.card_designs?.view_no || null,
        }))
      );
    }
    setItemsLoading(false);
  };

  const openJob = (job: PrintJob) => {
    setSelectedJob(job);
    fetchJobItems(job.id);
  };

  const loadReservedUnits = async () => {
    // Get reserved units that don't have QR generated yet
    const { data } = await supabase
      .from("inventory_units")
      .select("id, internal_inventory_code, card_designs!inner(title, view_no)")
      .eq("fulfillment_status", "reserved")
      .order("created_at", { ascending: true })
      .limit(500);

    if (data) {
      const typedData = data as unknown as ReservedUnitJoin[];
      setReservedUnits(
        typedData.map((u: ReservedUnitJoin) => ({
          id: u.id,
          code: u.internal_inventory_code,
          design: `V${u.card_designs?.view_no} ${u.card_designs?.title || ""}`,
        }))
      );
    }
  };

  const openNewJob = () => {
    setShowNewJob(true);
    setJobName("");
    setSelectedOrderId("");
    loadReservedUnits();
  };

  const generateQr = async () => {
    if (!jobName) {
      toast({ title: "Podaj nazwę zadania druku", variant: "destructive" });
      return;
    }
    if (reservedUnits.length === 0) {
      toast({ title: "Brak zarezerwowanych sztuk do wygenerowania QR", variant: "destructive" });
      return;
    }

    setIsGenerating(true);

    const { data, error } = await supabase.functions.invoke("generate-qr", {
      body: {
        inventory_unit_ids: reservedUnits.map((u) => u.id),
        print_job_name: jobName,
        order_id: selectedOrderId || undefined,
      },
    });

    if (error) {
      toast({ title: "Błąd generowania QR", description: error.message, variant: "destructive" });
    } else if (data?.error) {
      toast({ title: "Błąd", description: data.error, variant: "destructive" });
    } else {
      toast({ title: `Wygenerowano QR dla ${data.generated} sztuk` });
      setShowNewJob(false);
      fetchJobs();
    }
    setIsGenerating(false);
  };

  const markAsPrinted = async (jobId: string) => {
    const { error } = await supabase
      .from("qr_print_jobs")
      .update({ status: "printed" as Database["public"]["Enums"]["qr_print_job_status"] })
      .eq("id", jobId);
    if (!error) {
      toast({ title: "Oznaczono jako wydrukowane" });
      fetchJobs();
      if (selectedJob?.id === jobId) setSelectedJob({ ...selectedJob, status: "printed" });
    }
  };

  const markAsApplied = async (jobId: string) => {
    // Update print job status
    await supabase.from("qr_print_jobs").update({ status: "printed" as Database["public"]["Enums"]["qr_print_job_status"] }).eq("id", jobId);

    // Update all inventory units in this job to qr_applied
    const { data: jobItemsList } = await supabase
      .from("qr_print_job_items")
      .select("inventory_unit_id")
      .eq("print_job_id", jobId);

    if (jobItemsList) {
      const unitIds = jobItemsList.map((i) => i.inventory_unit_id);
      await supabase
        .from("inventory_units")
        .update({
          fulfillment_status: "qr_applied" as Database["public"]["Enums"]["fulfillment_status"],
          qr_applied_at: new Date().toISOString(),
        })
        .in("id", unitIds);
    }

    toast({ title: "Oznaczono jako naklejone (qr_applied)" });
    fetchJobs();
    if (selectedJob?.id === jobId) setSelectedJob({ ...selectedJob, status: "printed" });
  };

  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPdf = async (jobId: string, jobName: string) => {
    setPdfLoading(true);
    const { data, error } = await supabase.functions.invoke("generate-qr-pdf", {
      body: { print_job_id: jobId },
    });

    if (error || data?.error) {
      toast({ title: "Błąd generowania PDF", description: error?.message || data?.error, variant: "destructive" });
      setPdfLoading(false);
      return;
    }

    if (data?.pdf) {
      // data.pdf is a data URI string
      const link = document.createElement("a");
      link.href = data.pdf;
      link.download = `QR-${jobName.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "PDF pobrany" });
    }
    setPdfLoading(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const statusBadge = (status: string) => {
    const s = STATUS_LABELS[status] || STATUS_LABELS.pending;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>;
  };

  // Job detail view
  if (selectedJob) {
    return (
      <div className="space-y-6">
        <button onClick={() => { setSelectedJob(null); setJobItems([]); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Wróć do listy
        </button>

        <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-display text-xl font-bold">{selectedJob.name}</h3>
            <div className="flex gap-2 items-center flex-wrap">
              {statusBadge(selectedJob.status)}
              {(selectedJob.status === "ready" || selectedJob.status === "printed") && (
                <Button size="sm" variant="outline" onClick={() => downloadPdf(selectedJob.id, selectedJob.name)} disabled={pdfLoading} className="gap-2">
                  {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Pobierz PDF
                </Button>
              )}
              {selectedJob.status === "ready" && (
                <Button size="sm" variant="outline" onClick={() => markAsPrinted(selectedJob.id)} className="gap-2">
                  <Printer className="w-4 h-4" /> Wydrukowane
                </Button>
              )}
              {(selectedJob.status === "ready" || selectedJob.status === "printed") && (
                <Button size="sm" variant="outline" onClick={() => markAsApplied(selectedJob.id)} className="gap-2">
                  <CheckCheck className="w-4 h-4" /> Naklejone (applied)
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Sztuk:</span><p className="font-bold">{selectedJob.generated_items} / {selectedJob.total_items}</p></div>
            <div><span className="text-muted-foreground">Data:</span><p>{formatDate(selectedJob.created_at)}</p></div>
            <div><span className="text-muted-foreground">Wysyłka:</span><p>{selectedJob.shipment_id || "—"}</p></div>
            <div><span className="text-muted-foreground">Zamówienie:</span><p className="font-mono text-xs">{selectedJob.order_id?.slice(0, 8) || "—"}</p></div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-soft overflow-hidden">
          {itemsLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Kod inwentarza</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Kraj</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Wzór</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Claim code</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">QR URL</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Data gen.</th>
                  </tr>
                </thead>
                <tbody>
                  {jobItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{item.unit_code}</td>
                      <td className="p-3">{item.country_name}</td>
                      <td className="p-3 text-muted-foreground">{item.design_title ? `V${item.view_no} ${item.design_title}` : `V${item.view_no}`}</td>
                      <td className="p-3 font-mono text-xs font-bold">{item.public_claim_code}</td>
                      <td className="p-3 font-mono text-xs text-primary break-all max-w-[200px]">{item.qr_url}</td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDate(item.generated_at)}</td>
                    </tr>
                  ))}
                  {jobItems.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Brak elementów</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // New job form
  if (showNewJob) {
    return (
      <div className="space-y-6">
        <button onClick={() => setShowNewJob(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Wróć do listy
        </button>

        <div className="bg-card rounded-xl p-6 shadow-soft space-y-4">
          <h3 className="font-display text-lg font-semibold">Nowe zadanie druku QR</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nazwa zadania</label>
              <Input value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="np. Druk QR - Partia PL-01" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">ID zamówienia (opcjonalne)</label>
              <Input value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} placeholder="UUID zamówienia" />
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Zarezerwowane sztuki ({reservedUnits.length}) — zostaną przypisane do tego zadania druku:</p>
            {reservedUnits.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Brak zarezerwowanych sztuk w magazynie. Najpierw zarezerwuj sztuki dla zamówienia.</p>
            ) : (
              <div className="max-h-[300px] overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-medium text-muted-foreground">Kod</th>
                      <th className="text-left p-2 font-medium text-muted-foreground">Wzór</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservedUnits.map((u) => (
                      <tr key={u.id} className="border-b border-border/30">
                        <td className="p-2 font-mono">{u.code}</td>
                        <td className="p-2">{u.design}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={generateQr} disabled={isGenerating || reservedUnits.length === 0} className="gap-2">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              Generuj QR ({reservedUnits.length} szt.)
            </Button>
            <Button variant="outline" onClick={() => setShowNewJob(false)} disabled={isGenerating}>Anuluj</Button>
          </div>
        </div>
      </div>
    );
  }

  // Jobs list
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Zadania druku QR</h2>
        <Button onClick={openNewJob} size="sm" className="gap-2"><Plus className="w-4 h-4" /> Nowe zadanie</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : jobs.length === 0 ? (
        <div className="bg-card rounded-xl p-12 text-center shadow-soft">
          <QrCode className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Brak zadań druku QR</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">Nazwa</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Sztuk</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => openJob(job)}>
                  <td className="p-3 font-medium">{job.name}</td>
                  <td className="p-3">{statusBadge(job.status)}</td>
                  <td className="p-3 text-right">{job.generated_items} / {job.total_items}</td>
                  <td className="p-3 text-xs text-muted-foreground">{formatDate(job.created_at)}</td>
                  <td className="p-3 text-xs text-primary">Szczegóły →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminQrJobs;
