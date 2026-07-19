import { Package, Truck } from "lucide-react";
import type { ShippingMethod } from "@/lib/constants";

interface Props {
  value: ShippingMethod;
  onChange: (v: ShippingMethod) => void;
}

const options: { value: ShippingMethod; label: string; description: string; icon: typeof Package }[] = [
  {
    value: "inpost",
    label: "Paczkomat InPost",
    description: "Odbiór w wybranym paczkomacie.",
    icon: Package,
  },
  {
    value: "courier",
    label: "Kurier — adres domowy",
    description: "Dostawa na wskazany adres.",
    icon: Truck,
  },
];

const ShippingMethodPicker = ({ value, onChange }: Props) => {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
              active
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input
              type="radio"
              name="shipping_method"
              value={opt.value}
              checked={active}
              onChange={() => onChange(opt.value)}
              className="mt-1 accent-primary"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-foreground">{opt.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{opt.description}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
};

export default ShippingMethodPicker;
