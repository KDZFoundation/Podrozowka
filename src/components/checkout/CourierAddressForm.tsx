import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type CourierAddress,
  validateCourierAddress,
} from "@/lib/constants";

interface Props {
  value: CourierAddress;
  onChange: (v: CourierAddress) => void;
}

const CourierAddressForm = ({ value, onChange }: Props) => {
  const [touched, setTouched] = useState<Record<keyof CourierAddress, boolean>>({
    name: false,
    street: false,
    postal_code: false,
    city: false,
    phone: false,
  });
  const errors = validateCourierAddress(value);

  const set = (k: keyof CourierAddress, v: string) => onChange({ ...value, [k]: v });
  const touch = (k: keyof CourierAddress) => setTouched((s) => ({ ...s, [k]: true }));
  const err = (k: keyof CourierAddress) => (touched[k] ? errors[k] : undefined);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ship_name">Imię i nazwisko odbiorcy</Label>
        <Input
          id="ship_name"
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={() => touch("name")}
          maxLength={200}
          placeholder="Jan Kowalski"
          aria-invalid={!!err("name")}
        />
        {err("name") && <p className="text-xs text-destructive">{err("name")}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ship_street">Ulica i numer</Label>
        <Input
          id="ship_street"
          value={value.street}
          onChange={(e) => set("street", e.target.value)}
          onBlur={() => touch("street")}
          maxLength={300}
          placeholder="ul. Przykładowa 1/2"
          aria-invalid={!!err("street")}
        />
        {err("street") && <p className="text-xs text-destructive">{err("street")}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ship_postal">Kod pocztowy</Label>
          <Input
            id="ship_postal"
            value={value.postal_code}
            onChange={(e) => set("postal_code", e.target.value)}
            onBlur={() => touch("postal_code")}
            maxLength={6}
            inputMode="numeric"
            placeholder="00-000"
            aria-invalid={!!err("postal_code")}
          />
          {err("postal_code") && (
            <p className="text-xs text-destructive">{err("postal_code")}</p>
          )}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ship_city">Miejscowość</Label>
          <Input
            id="ship_city"
            value={value.city}
            onChange={(e) => set("city", e.target.value)}
            onBlur={() => touch("city")}
            maxLength={100}
            placeholder="Warszawa"
            aria-invalid={!!err("city")}
          />
          {err("city") && <p className="text-xs text-destructive">{err("city")}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ship_phone">Numer telefonu</Label>
        <Input
          id="ship_phone"
          value={value.phone}
          onChange={(e) => set("phone", e.target.value)}
          onBlur={() => touch("phone")}
          inputMode="tel"
          maxLength={20}
          placeholder="+48 600 000 000"
          aria-invalid={!!err("phone")}
        />
        {err("phone") && <p className="text-xs text-destructive">{err("phone")}</p>}
        <p className="text-xs text-muted-foreground">
          Kurier zadzwoni przed dostawą.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Dostawa realizowana wyłącznie na terenie Polski.
      </p>
    </div>
  );
};

export default CourierAddressForm;
