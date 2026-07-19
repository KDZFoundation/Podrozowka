import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Globe2,
  QrCode,
  BarChart3,
  ArrowLeft,
  Loader2,
  CheckCircle,
  ShoppingBag,
  Box,
  Image,
  ShoppingCart,
  Truck,
  UserCheck,
  Clock,
  Wrench,
  Map as MapIcon,
  FlaskConical,
  Trophy,
  Receipt,
  Tags,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdminCountries from "@/components/admin/AdminCountries";
import AdminCardDesigns from "@/components/admin/AdminCardDesigns";
import AdminInventory from "@/components/admin/AdminInventory";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminQrJobs from "@/components/admin/AdminQrJobs";
import AdminShipments from "@/components/admin/AdminShipments";
import AdminRegistrations from "@/components/admin/AdminRegistrations";
import AdminEventLog from "@/components/admin/AdminEventLog";
import AdminDevTools from "@/components/admin/AdminDevTools";
import AdminGlobalMap from "@/components/admin/AdminGlobalMap";
import AdminLab from "@/components/admin/AdminLab";
import AdminGamification from "@/components/admin/AdminGamification";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminFiscalFailures from "@/components/admin/AdminFiscalFailures";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminPaymentSettings from "@/components/admin/AdminPaymentSettings";

type TabId =
  | "overview"
  | "map"
  | "countries"
  | "card-designs"
  | "products"
  | "categories"
  | "inventory"
  | "orders"
  | "shipments"
  | "qr-jobs"
  | "registrations"
  | "event-log"
  | "dev-tools"
  | "lab"
  | "gamification"
  | "fiscal"
  | "payments";

interface AdminStats {
  totalUnits: number;
  inStock: number;
  reserved: number;
  shipped: number;
  registered: number;
  voided: number;
  countries: number;
  designs: number;
}

const AdminPanel = () => {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [stats, setStats] = useState<AdminStats>({
    totalUnits: 0,
    inStock: 0,
    reserved: 0,
    shipped: 0,
    registered: 0,
    voided: 0,
    countries: 0,
    designs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const [
      { count: totalUnits },
      { count: inStock },
      { count: reserved },
      { count: shipped },
      { count: registered },
      { count: voided },
      { count: countries },
      { count: designs },
    ] = await Promise.all([
      supabase.from("inventory_units").select("*", { count: "exact", head: true }),
      supabase.from("inventory_units").select("*", { count: "exact", head: true }).eq("fulfillment_status", "in_stock"),
      supabase.from("inventory_units").select("*", { count: "exact", head: true }).eq("fulfillment_status", "reserved"),
      supabase.from("inventory_units").select("*", { count: "exact", head: true }).eq("fulfillment_status", "shipped"),
      supabase.from("inventory_units").select("*", { count: "exact", head: true }).eq("business_status", "registered"),
      supabase
        .from("inventory_units")
        .select("*", { count: "exact", head: true })
        .in("fulfillment_status", ["voided", "damaged"]),
      supabase.from("countries").select("*", { count: "exact", head: true }),
      supabase.from("card_designs").select("*", { count: "exact", head: true }),
    ]);

    setStats({
      totalUnits: totalUnits || 0,
      inStock: inStock || 0,
      reserved: reserved || 0,
      shipped: shipped || 0,
      registered: registered || 0,
      voided: voided || 0,
      countries: countries || 0,
      designs: designs || 0,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/dashboard");
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchStats();
  }, [isAdmin, fetchStats]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs: { id: TabId; label: string; icon: typeof Package }[] = [
    { id: "overview", label: "Przegląd", icon: BarChart3 },
    { id: "map", label: "Mapa Globalna", icon: MapIcon },
    { id: "countries", label: "Kraje", icon: Globe2 },
    { id: "card-designs", label: "Wzory kartek", icon: Image },
    { id: "products", label: "Produkty", icon: ShoppingBag },
    { id: "categories", label: "Kategorie", icon: Tags },
    { id: "inventory", label: "Magazyn", icon: Box },
    { id: "orders", label: "Zamówienia", icon: ShoppingCart },
    { id: "shipments", label: "Wysyłki", icon: Truck },
    { id: "qr-jobs", label: "Druk QR", icon: QrCode },
    { id: "registrations", label: "Rejestracje", icon: UserCheck },
    { id: "event-log", label: "Log zdarzeń", icon: Clock },
    { id: "dev-tools", label: "Narzędzia Dev", icon: Wrench },
    { id: "gamification", label: "Grywalizacja", icon: Trophy },
    { id: "fiscal", label: "Fiskalizacja", icon: Receipt },
    { id: "payments", label: "Płatności", icon: CreditCard },
    { id: "lab", label: "Laboratorium", icon: FlaskConical },
  ];

  const overviewCards = [
    { icon: Box, label: "Wszystkie sztuki", value: stats.totalUnits, color: "text-foreground" },
    { icon: Package, label: "W magazynie", value: stats.inStock, color: "text-muted-foreground" },
    { icon: ShoppingBag, label: "Zarezerwowane", value: stats.reserved, color: "text-[hsl(var(--gold))]" },
    { icon: Truck, label: "Wysłane", value: stats.shipped, color: "text-primary" },
    { icon: CheckCircle, label: "Zarejestrowane", value: stats.registered, color: "text-accent" },
    { icon: Package, label: "Unieważ./Uszk.", value: stats.voided, color: "text-destructive" },
    { icon: Globe2, label: "Krajów", value: stats.countries, color: "text-primary" },
    { icon: Image, label: "Wzorów", value: stats.designs, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </a>
              <span className="font-display text-xl font-semibold text-primary">Panel Admina</span>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Statystyki platformy</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {overviewCards.map((s) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-4 shadow-soft"
                >
                  <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                  <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "map" && <AdminGlobalMap />}
        {activeTab === "countries" && <AdminCountries />}
        {activeTab === "card-designs" && <AdminCardDesigns />}
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "categories" && <AdminCategories />}
        {activeTab === "inventory" && <AdminInventory />}
        {activeTab === "orders" && <AdminOrders />}
        {activeTab === "shipments" && <AdminShipments />}
        {activeTab === "qr-jobs" && <AdminQrJobs />}
        {activeTab === "registrations" && <AdminRegistrations />}
        {activeTab === "event-log" && <AdminEventLog />}
        {activeTab === "dev-tools" && <AdminDevTools />}
        {activeTab === "gamification" && <AdminGamification />}
        {activeTab === "fiscal" && <AdminFiscalFailures />}
        {activeTab === "payments" && <AdminPaymentSettings />}
        {activeTab === "lab" && <AdminLab />}
      </main>
    </div>
  );
};

export default AdminPanel;
