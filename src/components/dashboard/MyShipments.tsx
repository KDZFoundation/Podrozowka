import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Truck } from "lucide-react";

interface Shipment {
  id: string;
  order_id: string;
  order_number: string | null;
  status: string;
  tracking_number: string | null;
  carrier: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Przygotowywana", className: "bg-muted text-muted-foreground" },
  packed: { label: "Spakowana", className: "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]" },
  shipped: { label: "Wysłana", className: "bg-primary/15 text-primary" },
  delivered: { label: "Dostarczona", className: "bg-accent/15 text-accent" },
  returned: { label: "Zwrócona", className: "bg-destructive/15 text-destructive" },
};

const MyShipments = ({ userId }: { userId: string }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShipments = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("shipments")
      .select("id, order_id, status, tracking_number, carrier, shipped_at, delivered_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      const orderIds = [...new Set(data.map(s => s.order_id))];
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number")
        .in("id", orderIds);

      const orderMap = new Map(orders?.map(o => [o.id, o.order_number]) || []);

      setShipments(data.map(s => ({
        ...s,
        order_number: orderMap.get(s.order_id) || null,
      })));
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const statusBadge = (status: string) => {
    const s = STATUS_LABELS[status] || STATUS_LABELS.pending;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>;
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (shipments.length === 0) {
    return (
      <div className="bg-card rounded-xl p-12 text-center shadow-soft">
        <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Brak wysyłek</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">Moje wysyłki</h2>
      <div className="bg-card rounded-xl shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-medium text-muted-foreground">Zamówienie</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Przewoźnik</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Nr śledzenia</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Wysłano</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Dostarczono</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{s.order_number || s.order_id.slice(0, 8)}</td>
                <td className="p-3">{statusBadge(s.status)}</td>
                <td className="p-3 text-muted-foreground">{s.carrier || "—"}</td>
                <td className="p-3 font-mono text-xs">
                  {s.tracking_number ? (
                    <span className="text-primary">{s.tracking_number}</span>
                  ) : "—"}
                </td>
                <td className="p-3 text-xs text-muted-foreground">{formatDate(s.shipped_at)}</td>
                <td className="p-3 text-xs text-muted-foreground">{formatDate(s.delivered_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyShipments;
