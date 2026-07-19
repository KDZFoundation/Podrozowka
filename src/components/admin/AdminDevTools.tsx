import { useState } from "react";
import { Database, Globe, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MOCK_COUNTRIES = [
  { name_pl: "Japonia", iso2: "JP", iso3: "JPN", slug: "japonia" },
  { name_pl: "Włochy", iso2: "IT", iso3: "ITA", slug: "wlochy" },
];

const MOCK_BUYERS = [
  { name: "Jan Kowalski", address: "ul. Kwiatowa 12", city: "Warszawa", postal: "00-001", country: "PL" },
  { name: "Anna Nowak", address: "ul. Lipowa 5", city: "Kraków", postal: "30-100", country: "PL" },
  { name: "Piotr Wiśniewski", address: "ul. Słoneczna 8", city: "Wrocław", postal: "50-200", country: "PL" },
];

const MOCK_RECIPIENTS = [
  { name: "Yuki Tanaka", message: "Thank you for the card! Greetings from Tokyo!", email: "yuki@test.jp" },
  { name: "Marco Rossi", message: "Bellissima cartolina! Grazie mille!", email: "marco@test.it" },
  { name: "Katarzyna Zielińska", message: "Piękna kartka, dziękuję bardzo!", email: "kasia@test.pl" },
  { name: "Hiroshi Sato", message: "素晴らしいカード！ありがとう！ Beautiful card from Poland!", email: "hiroshi@test.jp" },
  { name: "Giulia Bianchi", message: "Che bella! La Polonia è fantastica!", email: "giulia@test.it" },
];

const randomHex = (len: number) => {
  const bytes = new Uint8Array(Math.ceil(len / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
};

const GLOBAL_LOCATIONS = [
  { city: "Tokio", country_name: "Japonia", iso2: "JP", iso3: "JPN", lat: 35.68, lng: 139.69, name: "Yuki", message: "Arigato! Niesamowita inicjatywa! 🎌" },
  { city: "Sydney", country_name: "Australia", iso2: "AU", iso3: "AUS", lat: -33.86, lng: 151.20, name: "Oliver", message: "G'day mate! Kartka dotarła aż tutaj! 🦘" },
  { city: "Nowy Jork", country_name: "Stany Zjednoczone", iso2: "US", iso3: "USA", lat: 40.71, lng: -74.00, name: "Sarah", message: "Love from NYC! 🗽" },
  { city: "Rio de Janeiro", country_name: "Brazylia", iso2: "BR", iso3: "BRA", lat: -22.90, lng: -43.17, name: "Carlos", message: "Obrigado! Pozdrowienia z plaży Copacabana 🏖️" },
  { city: "Rzym", country_name: "Włochy", iso2: "IT", iso3: "ITA", lat: 41.90, lng: 12.49, name: "Luigi", message: "Mamma mia, co za piękna kartka z Polski! 🍕" },
  { city: "Kapsztad", country_name: "Republika Południowej Afryki", iso2: "ZA", iso3: "ZAF", lat: -33.92, lng: 18.42, name: "Nelson", message: "Wow, to najdalsza podróż tej kartki! 🦁" },
  { city: "Paryż", country_name: "Francja", iso2: "FR", iso3: "FRA", lat: 48.85, lng: 2.35, name: "Amelie", message: "Merci beaucoup! 🥐" },
  { city: "Bangkok", country_name: "Tajlandia", iso2: "TH", iso3: "THA", lat: 13.75, lng: 100.50, name: "Somchai", message: "Sawadee krap! Kartka z Polski w Bangkoku! 🏯" },
  { city: "Buenos Aires", country_name: "Argentyna", iso2: "AR", iso3: "ARG", lat: -34.60, lng: -58.38, name: "Mateo", message: "¡Increíble! Saludos desde Argentina! 🧉" },
  { city: "Reykjavik", country_name: "Islandia", iso2: "IS", iso3: "ISL", lat: 64.13, lng: -21.90, name: "Björk", message: "Hæ! Kartka dotarła na koniec świata! 🌋" },
  { city: "Seul", country_name: "Korea Południowa", iso2: "KR", iso3: "KOR", lat: 37.56, lng: 126.97, name: "Min-jun", message: "감사합니다! Piękna kartka! 🇰🇷" },
  { city: "Marrakesz", country_name: "Maroko", iso2: "MA", iso3: "MAR", lat: 31.63, lng: -7.98, name: "Fatima", message: "Shukran! Pozdrowienia z medyny! 🕌" },
  { city: "Vancouver", country_name: "Kanada", iso2: "CA", iso3: "CAN", lat: 49.28, lng: -123.12, name: "Liam", message: "Thanks eh! Love from the mountains! 🏔️" },
];

const AdminDevTools = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const generateMockData = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      // --- 1. Countries (upsert by iso2) ---
      const countryIds: string[] = [];
      for (const c of MOCK_COUNTRIES) {
        const { data: existing } = await supabase
          .from("countries")
          .select("id")
          .eq("iso2", c.iso2)
          .maybeSingle();

        if (existing) {
          countryIds.push(existing.id);
        } else {
          const { data, error } = await supabase
            .from("countries")
            .insert({ name_pl: c.name_pl, iso2: c.iso2, iso3: c.iso3, slug: c.slug, active: true })
            .select("id")
            .single();
          if (error) throw new Error(`Country insert error: ${error.message}`);
          countryIds.push(data.id);
        }
      }

      // --- 2. Card Designs (one per country) ---
      const designIds: string[] = [];
      for (let i = 0; i < countryIds.length; i++) {
        const countryId = countryIds[i];
        const { data: existing } = await supabase
          .from("card_designs")
          .select("id")
          .eq("country_id", countryId)
          .limit(1)
          .maybeSingle();

        if (existing) {
          designIds.push(existing.id);
        } else {
          const { data, error } = await supabase
            .from("card_designs")
            .insert({
              country_id: countryId,
              view_no: i + 1,
              title: `Test Design ${MOCK_COUNTRIES[i].name_pl}`,
              language_code: "pl",
              active: true,
            })
            .select("id")
            .single();
          if (error) throw new Error(`Design insert error: ${error.message}`);
          designIds.push(data.id);
        }
      }

      // --- 3. Stock Batches (one per design) ---
      const batchIds: string[] = [];
      for (let i = 0; i < designIds.length; i++) {
        const { data, error } = await supabase
          .from("stock_batches")
          .insert({
            card_design_id: designIds[i],
            name: `Test Batch ${MOCK_COUNTRIES[i].name_pl} ${Date.now()}`,
            quantity: 5,
          })
          .select("id")
          .single();
        if (error) throw new Error(`Batch insert error: ${error.message}`);
        batchIds.push(data.id);
      }

      // --- 4. Orders (3 orders, status paid) ---
      const orderIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const buyer = MOCK_BUYERS[i];
        const { data, error } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            status: "paid" as const,
            payment_status: "paid" as const,
            total_amount: (i + 1) * 29.99,
            paid_at: new Date().toISOString(),
            shipping_name: buyer.name,
            shipping_address: buyer.address,
            shipping_city: buyer.city,
            shipping_postal_code: buyer.postal,
            shipping_country: buyer.country,
          })
          .select("id")
          .single();
        if (error) throw new Error(`Order insert error: ${error.message}`);
        orderIds.push(data.id);
      }

      // --- 5. Order Items ---
      for (let i = 0; i < 3; i++) {
        const designId = designIds[i % designIds.length];
        const qty = i < 2 ? 3 : 4; // 3+3+4 = 10 units total
        const { error } = await supabase.from("order_items").insert({
          order_id: orderIds[i],
          card_design_id: designId,
          quantity: qty,
          unit_price: 9.99,
          total_price: qty * 9.99,
        });
        if (error) throw new Error(`Order item insert error: ${error.message}`);
      }

      // --- 6. Inventory Units (10 total, 5 purchased + 5 registered) ---
      const unitIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const orderIdx = i < 3 ? 0 : i < 6 ? 1 : 2;
        const designIdx = i % designIds.length;
        const batchIdx = designIdx;
        const isRegistered = i >= 5;
        const code = `INV-${MOCK_COUNTRIES[designIdx].iso2}-V01-${String(i + 1).padStart(3, "0")}T`;

        const { data, error } = await supabase
          .from("inventory_units")
          .insert({
            stock_batch_id: batchIds[batchIdx],
            card_design_id: designIds[designIdx],
            internal_inventory_code: code + randomHex(4),
            fulfillment_status: "shipped" as const,
            business_status: isRegistered ? ("registered" as const) : ("purchased" as const),
            traveler_user_id: user.id,
            order_id: orderIds[orderIdx],
            shipped_at: new Date().toISOString(),
            public_claim_code: `PDZ-${randomHex(4).toUpperCase()}-${randomHex(4).toUpperCase()}`,
            public_claim_token_hash: randomHex(32),
            registered_at: isRegistered ? new Date().toISOString() : null,
          })
          .select("id")
          .single();
        if (error) throw new Error(`Unit insert error: ${error.message}`);
        unitIds.push(data.id);
      }

      // --- 7. Recipient Registrations (for the 5 registered units) ---
      const registeredUnitIds = unitIds.slice(5);
      for (let i = 0; i < registeredUnitIds.length; i++) {
        const r = MOCK_RECIPIENTS[i];
        const { error } = await supabase.from("recipient_registrations").insert({
          inventory_unit_id: registeredUnitIds[i],
          recipient_name: r.name,
          recipient_message: r.message,
          recipient_email: r.email,
          contact_opt_in: Math.random() > 0.5,
        });
        if (error) throw new Error(`Registration insert error: ${error.message}`);
      }

      // --- Done ---
      toast.success(`Wygenerowano pomyślnie 3 zamówienia i 10 kartek!`);
      queryClient.invalidateQueries();
    } catch (err) {
      console.error("Mock data error:", err);
      const errorMsg = err instanceof Error ? err.message : "Nieznany błąd";
      toast.error("Błąd generowania danych: " + errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const seedGlobalData = async () => {
    if (!user) return;
    setIsSeeding(true);

    try {
      for (let i = 0; i < GLOBAL_LOCATIONS.length; i++) {
        const loc = GLOBAL_LOCATIONS[i];
        const daysAgo = GLOBAL_LOCATIONS.length - i;
        const createdDate = new Date(Date.now() - daysAgo * 3 * 24 * 60 * 60 * 1000).toISOString();
        const registeredDate = new Date(Date.now() - daysAgo * 1.5 * 24 * 60 * 60 * 1000).toISOString();

        // Country upsert
        let countryId: string;
        const { data: existing } = await supabase
          .from("countries")
          .select("id")
          .eq("iso2", loc.iso2)
          .maybeSingle();

        if (existing) {
          countryId = existing.id;
        } else {
          const { data, error } = await supabase
            .from("countries")
            .insert({ name_pl: loc.country_name, iso2: loc.iso2, iso3: loc.iso3, slug: loc.country_name.toLowerCase().replace(/\s+/g, "-"), active: true })
            .select("id")
            .single();
          if (error) throw new Error(`Country: ${error.message}`);
          countryId = data.id;
        }

        // Design upsert
        let designId: string;
        const { data: existingDesign } = await supabase
          .from("card_designs")
          .select("id")
          .eq("country_id", countryId)
          .limit(1)
          .maybeSingle();

        if (existingDesign) {
          designId = existingDesign.id;
        } else {
          const { data, error } = await supabase
            .from("card_designs")
            .insert({ country_id: countryId, view_no: 1, title: `Widok ${loc.city}`, language_code: "pl", active: true })
            .select("id")
            .single();
          if (error) throw new Error(`Design: ${error.message}`);
          designId = data.id;
        }

        // Stock batch
        const { data: batch, error: batchErr } = await supabase
          .from("stock_batches")
          .insert({ card_design_id: designId, name: `Seed ${loc.city} ${Date.now()}`, quantity: 1 })
          .select("id")
          .single();
        if (batchErr) throw new Error(`Batch: ${batchErr.message}`);

        // Inventory unit
        const code = `INV-${loc.iso2}-V01-SEED${String(i).padStart(3, "0")}${randomHex(4)}`;
        const { data: unit, error: unitErr } = await supabase
          .from("inventory_units")
          .insert({
            stock_batch_id: batch.id,
            card_design_id: designId,
            internal_inventory_code: code,
            fulfillment_status: "shipped" as const,
            business_status: "registered" as const,
            traveler_user_id: user.id,
            shipped_at: createdDate,
            registered_at: registeredDate,
            public_claim_code: `PDZ-${randomHex(4).toUpperCase()}-${randomHex(4).toUpperCase()}`,
            public_claim_token_hash: randomHex(32),
          })
          .select("id")
          .single();
        if (unitErr) throw new Error(`Unit: ${unitErr.message}`);

        // Registration
        const { error: regErr } = await supabase.from("recipient_registrations").insert({
          inventory_unit_id: unit.id,
          recipient_name: loc.name,
          recipient_message: loc.message,
          latitude: loc.lat,
          longitude: loc.lng,
          contact_opt_in: true,
          registered_at: registeredDate,
        });
        if (regErr) throw new Error(`Registration: ${regErr.message}`);
      }

      toast.success(`Rozsiano ${GLOBAL_LOCATIONS.length} pocztówek po świecie!`);
      queryClient.invalidateQueries();
    } catch (err) {
      console.error("Seed global error:", err);
      const errorMsg = err instanceof Error ? err.message : "Nieznany błąd";
      toast.error("Błąd: " + errorMsg);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Narzędzia Dev</h2>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Generowanie danych testowych
          </CardTitle>
          <CardDescription>
            Symuluj ruch w aplikacji — wygeneruj testowe zamówienia, kartki pocztowe i rejestracje odbiorców.
            Tworzy 2 kraje, 2 wzory, 3 zamówienia, 10 jednostek inwentarzowych i 5 rejestracji.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateMockData} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {isGenerating ? "Generowanie…" : "Wygeneruj paczkę testową (Mock Data)"}
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Generator Danych Mapy
          </CardTitle>
          <CardDescription>
            Rozsiej {GLOBAL_LOCATIONS.length} pocztówek po całym świecie z realistycznymi lokacjami i wiadomościami.
            Dane pojawią się na mapie, w Dzienniku Ambasadora i w Misjach Kulturowych.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={seedGlobalData} disabled={isSeeding}>
            {isSeeding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            {isSeeding ? "Rozsiewanie…" : "Rozsiej pocztówki po świecie"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDevTools;
