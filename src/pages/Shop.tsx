import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingBag, Package, Tags } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface Country {
  id: string;
  iso2: string;
  name_pl: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  sort_order: number;
}

interface Product {
  id: string;
  title: string | null;
  image_front_url: string | null;
  price_grosze: number;
  country_id: string;
  category_id: string | null;
  countries: Country | null;
  categories: Category | null;
}

const formatPln = (grosze: number) =>
  (grosze / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";

const Shop = () => {
  const [searchParams] = useSearchParams();
  const countryIso = searchParams.get("country_iso");

  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Sklep – Podróżówka";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Kartki pocztowe promujące polską kulturę na świecie. Wybierz z katalogu i wyślij za granicę.");
  }, []);

  useEffect(() => {
    const load = async () => {
      const [{ data: designs }, { data: cats }, { data: stock }] = await Promise.all([
        supabase
          .from("card_designs")
          .select("id, title, image_front_url, price_grosze, country_id, category_id, countries!inner(id, iso2, name_pl), categories(id, name, slug, icon_url, sort_order)")
          .eq("active", true)
          .gt("price_grosze", 0)
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name, slug, icon_url, sort_order").order("sort_order").order("name"),
        supabase.rpc("get_products_stock"),
      ]);

      setProducts((designs as unknown as Product[]) || []);
      setAllCategories((cats as Category[]) || []);
      const map: Record<string, number> = {};
      const stockData = (stock as unknown as { card_design_id: string; in_stock: number }[]) || [];
      stockData.forEach((s) => {
        map[s.card_design_id] = s.in_stock;
      });
      setStockMap(map);

      if (countryIso && designs) {
        const found = (designs as unknown as Product[]).find(
          (d) => d.countries?.iso2?.toLowerCase() === countryIso.toLowerCase()
        );
        if (found) {
          setCountryFilter(found.country_id);
        }
      }

      setIsLoading(false);
    };
    load();
  }, [countryIso]);

  const countries = useMemo(() => {
    const map = new Map<string, Country>();
    products.forEach((p) => {
      if (p.countries) map.set(p.countries.id, p.countries);
    });
    return Array.from(map.values()).sort((a, b) => a.name_pl.localeCompare(b.name_pl, "pl"));
  }, [products]);

  const visible = useMemo(
    () =>
      products.filter(
        (p) =>
          (countryFilter === "all" || p.country_id === countryFilter) &&
          (categoryFilter === "all" || p.category_id === categoryFilter),
      ),
    [products, countryFilter, categoryFilter],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Katalog</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Sklep</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Wybierz kartkę pocztową i zabierz kawałek polskiej kultury w podróż.
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Filtruj po kraju</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-lg text-sm min-w-48"
            >
              <option value="all">Wszystkie kraje</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_pl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {allCategories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Tags className="w-3.5 h-3.5" />
              <span>Kategoria</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  categoryFilter === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                Wszystkie
              </button>
              {allCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    categoryFilter === c.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {c.icon_url && (
                    <img src={c.icon_url} alt="" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                  )}
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl shadow-soft overflow-hidden animate-pulse">
                <div className="aspect-[3/2] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-5 bg-muted rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Brak dostępnych produktów</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((p) => {
              const stock = stockMap[p.id] || 0;
              return (
                <Link
                  key={p.id}
                  to={`/sklep/${p.id}`}
                  className="group bg-card rounded-xl shadow-soft overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-[3/2] bg-muted overflow-hidden relative">
                    {p.image_front_url ? (
                      <img
                        src={p.image_front_url}
                        alt={p.title || ""}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                      {stock === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          Niedostępne
                        </span>
                      )}
                      {p.categories && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-background/85 backdrop-blur-sm text-foreground border border-border/60">
                          {p.categories.icon_url && (
                            <img src={p.categories.icon_url} alt="" className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                          )}
                          {p.categories.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{p.countries?.name_pl}</p>
                    <h2 className="font-display font-semibold text-foreground line-clamp-2">
                      {p.title || "Bez tytułu"}
                    </h2>
                    <p className="mt-2 font-display text-lg font-bold text-primary">{formatPln(p.price_grosze)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
