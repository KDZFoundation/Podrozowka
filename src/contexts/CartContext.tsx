import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export interface CartItem {
  card_design_id: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  getQuantity: (id: string) => number;
  addItem: (id: string, qty?: number, maxQuantity?: number) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clear: () => void;
}

const STORAGE_KEY = "podrozowka_cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

const readInitial = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (it: unknown): it is CartItem =>
          !!it &&
          typeof it === "object" &&
          typeof (it as CartItem).card_design_id === "string" &&
          typeof (it as CartItem).quantity === "number" &&
          (it as CartItem).quantity > 0,
      )
      .map((it) => ({ card_design_id: it.card_design_id, quantity: Math.floor(it.quantity) }));
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(readInitial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items]);

  const getQuantity = useCallback(
    (id: string) => items.find((i) => i.card_design_id === id)?.quantity ?? 0,
    [items],
  );

  const addItem = useCallback((id: string, qty: number = 1, maxQuantity?: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.card_design_id === id);
      if (existing) {
        const next = existing.quantity + qty;
        const clamped = maxQuantity !== undefined ? Math.min(next, maxQuantity) : next;
        return prev.map((i) => (i.card_design_id === id ? { ...i, quantity: clamped } : i));
      }
      const clamped = maxQuantity !== undefined ? Math.min(qty, maxQuantity) : qty;
      return [...prev, { card_design_id: id, quantity: Math.max(1, clamped) }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.card_design_id !== id));
  }, []);

  const setQuantity = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.card_design_id !== id);
      return prev.map((i) => (i.card_design_id === id ? { ...i, quantity: Math.floor(qty) } : i));
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, totalCount, getQuantity, addItem, removeItem, setQuantity, clear }),
    [items, totalCount, getQuantity, addItem, removeItem, setQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
