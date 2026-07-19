import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, CreditCard } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type SecretStatus = {
  name: string;
  set: boolean;
  length: number;
  preview: string;
};

type StatusResponse = {
  p24_mode: "sandbox" | "production";
  p24_mode_updated_at: string | null;
  secrets: SecretStatus[];
  all_secrets_set: boolean;
};

const AdminPaymentSettings = () => {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: res, error } = await supabase.functions.invoke<StatusResponse>(
      "admin-payment-status",
      { method: "GET" },
    );
    if (error) {
      toast.error("Nie udało się pobrać statusu płatności");
    } else if (res) {
      setData(res);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleMode = async (nextIsProduction: boolean) => {
    if (!data) return;
    const nextMode = nextIsProduction ? "production" : "sandbox";
    setSaving(true);
    const { data: res, error } = await supabase.functions.invoke<StatusResponse>(
      "admin-payment-status",
      { method: "POST", body: { p24_mode: nextMode } },
    );
    setSaving(false);
    if (error || !res) {
      toast.error("Nie udało się zmienić trybu");
      return;
    }
    setData(res);
    toast.success(
      nextMode === "production"
        ? "Przełączono na PRODUKCJĘ"
        : "Przełączono na SANDBOX",
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const isProduction = data.p24_mode === "production";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          Ustawienia płatności
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Zarządzanie trybem bramki Przelewy24 oraz weryfikacja skonfigurowanych sekretów.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Środowisko Przelewy24
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isProduction
                ? "Aktywne: PRODUKCJA — realne transakcje."
                : "Aktywne: SANDBOX — środowisko testowe."}
            </p>
            {data.p24_mode_updated_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Ostatnia zmiana: {new Date(data.p24_mode_updated_at).toLocaleString("pl-PL")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                isProduction
                  ? "bg-primary/10 text-primary"
                  : "bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]"
              }`}
            >
              {isProduction ? "PRODUKCJA" : "SANDBOX"}
            </span>
            <Switch
              checked={isProduction}
              onCheckedChange={toggleMode}
              disabled={saving}
              aria-label="Przełącznik środowiska P24"
            />
          </div>
        </div>

        {isProduction && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Tryb produkcyjny — użytkownicy będą obciążani realnymi kwotami. Upewnij się, że sekrety P24 pochodzą z konta produkcyjnego.
            </span>
          </div>
        )}
      </div>

      {/* Secrets status */}
      <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Sekrety P24
          </h3>
          {data.all_secrets_set ? (
            <span className="text-xs font-semibold px-2 py-1 rounded bg-accent/10 text-accent flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Komplet
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-1 rounded bg-destructive/10 text-destructive flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Brakuje wartości
            </span>
          )}
        </div>

        <div className="space-y-2">
          {data.secrets.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background border border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                {s.set ? (
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                )}
                <span className="font-mono text-sm text-foreground truncate">{s.name}</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono shrink-0">
                {s.set ? (
                  <>
                    <span className="tracking-wider">{s.preview || "•••"}</span>
                    <span className="ml-2 text-muted-foreground/70">({s.length} zn.)</span>
                  </>
                ) : (
                  <span className="text-destructive">nie ustawiono</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Wartości sekretów nie są widoczne — pokazujemy jedynie ostatnie znaki i długość. Aktualizacja sekretów odbywa się bezpiecznie po stronie backendu.
        </p>
      </div>
    </div>
  );
};

export default AdminPaymentSettings;
