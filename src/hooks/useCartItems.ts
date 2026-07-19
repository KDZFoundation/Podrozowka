import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";

export interface EnrichedCartItem {
  id: string;
  title: string | null;
  image: string | null;
  price_grosze: number;
  currency: string;
  quantity: number;
  stock: number;
  unavailable: boolean;
  country_name: string | null;
}

interface StockRow {
  card_design_id: string;
  in_stock: number;
}

interface CardDesignRow {
  id: string;
  title: string | null;
  image_front_url: string | null;
  price_grosze: number;
  currency: string;
  active: boolean;
  countries: { name_pl: string | null } | null;
}

export const useCartItems = () => {
  const { items } = useCart();
  const ids = items.map((i) => i.card_design_id).sort();
  const key = ids.join(",");

  const query = useQuery({
    queryKey: ["cart-items", key],
    enabled: items.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const [{ data: designs }, { data: stockRows }] = await Promise.all([
        supabase
          .from("card_designs")
          .select("id, title, image_front_url, price_grosze, currency, active, countries(name_pl)")
          .in("id", ids),
        supabase.rpc("get_products_stock"),
      ]);

      const stockMap: Record<string, number> = {};
      ((stockRows as unknown as StockRow[]) || []).forEach((r) => {
        stockMap[r.card_design_id] = r.in_stock;
      });

      const designMap = new Map<string, CardDesignRow>();
      ((designs as unknown as CardDesignRow[]) || []).forEach((d) => designMap.set(d.id, d));

      const enriched: EnrichedCartItem[] = items.map((item) => {
        const d = designMap.get(item.card_design_id);
        const unavailable = !d || !d.active || d.price_grosze === 0;
        return {
          id: item.card_design_id,
          title: d?.title ?? null,
          image: d?.image_front_url ?? null,
          price_grosze: d?.price_grosze ?? 0,
          currency: d?.currency ?? "PLN",
          quantity: item.quantity,
          stock: stockMap[item.card_design_id] || 0,
          unavailable,
          country_name: d?.countries?.name_pl ?? null,
        };
      });

      return enriched;
    },
  });

  const enriched = query.data || [];
  const subtotalGrosze = enriched
    .filter((e) => !e.unavailable)
    .reduce((s, e) => s + e.price_grosze * e.quantity, 0);

  return {
    items: enriched,
    subtotalGrosze,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};
