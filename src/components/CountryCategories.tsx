import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface CountryCategory {
  id: string;
  iso2: string;
  name: string;
  nameLocal: string;
  flag: string;
  thankYou: string;
  greetings: string;
  sold: number;
  available: number;
}

const countries: CountryCategory[] = [
  // Według dokumentacji projektu - 16 krajów językowych, 2 wzory na kraj
  { id: "germany", iso2: "DE", name: "Niemcy", nameLocal: "Deutschland", flag: "🇩🇪", thankYou: "Danke", greetings: "Grüße", sold: 256, available: 2 },
  { id: "italy", iso2: "IT", name: "Włochy", nameLocal: "Italia", flag: "🇮🇹", thankYou: "Grazie", greetings: "Saluti", sold: 287, available: 2 },
  { id: "spain", iso2: "ES", name: "Hiszpania", nameLocal: "España", flag: "🇪🇸", thankYou: "Gracias", greetings: "Saludos", sold: 189, available: 2 },
  { id: "uk", iso2: "GB", name: "Anglia", nameLocal: "England", flag: "🇬🇧", thankYou: "Thank you", greetings: "Greetings", sold: 298, available: 2 },
  { id: "france", iso2: "FR", name: "Francja", nameLocal: "France", flag: "🇫🇷", thankYou: "Merci", greetings: "Salutations", sold: 234, available: 2 },
  { id: "ukraine", iso2: "UA", name: "Ukraina", nameLocal: "Україна", flag: "🇺🇦", thankYou: "Дякую", greetings: "Вітання", sold: 178, available: 2 },
  { id: "thailand", iso2: "TH", name: "Tajlandia", nameLocal: "ประเทศไทย", flag: "🇹🇭", thankYou: "ขอบคุณ", greetings: "สวัสดี", sold: 198, available: 2 },
  { id: "india", iso2: "IN", name: "Indie", nameLocal: "भारत", flag: "🇮🇳", thankYou: "धन्यवाद", greetings: "नमस्ते", sold: 145, available: 2 },
  { id: "turkey", iso2: "TR", name: "Turcja", nameLocal: "Türkiye", flag: "🇹🇷", thankYou: "Teşekkürler", greetings: "Selamlar", sold: 167, available: 2 },
  { id: "usa", iso2: "US", name: "USA", nameLocal: "United States", flag: "🇺🇸", thankYou: "Thank you", greetings: "Greetings", sold: 421, available: 2 },
  { id: "czech", iso2: "CZ", name: "Czechy", nameLocal: "Česko", flag: "🇨🇿", thankYou: "Děkuji", greetings: "Pozdravy", sold: 134, available: 2 },
  { id: "croatia", iso2: "HR", name: "Chorwacja", nameLocal: "Hrvatska", flag: "🇭🇷", thankYou: "Hvala", greetings: "Pozdrav", sold: 112, available: 2 },
  { id: "greece", iso2: "GR", name: "Grecja", nameLocal: "Ελλάδα", flag: "🇬🇷", thankYou: "Ευχαριστώ", greetings: "Χαιρετισμούς", sold: 156, available: 2 },
  { id: "hungary", iso2: "HU", name: "Węgry", nameLocal: "Magyarország", flag: "🇭🇺", thankYou: "Köszönöm", greetings: "Üdvözlet", sold: 98, available: 2 },
  { id: "china", iso2: "CN", name: "Chiny", nameLocal: "中国", flag: "🇨🇳", thankYou: "谢谢", greetings: "问候", sold: 342, available: 2 },
  { id: "norway", iso2: "NO", name: "Norwegia", nameLocal: "Norge", flag: "🇳🇴", thankYou: "Takk", greetings: "Hilsen", sold: 89, available: 2 },
];

const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
};

const CountryCategories = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalSold = countries.reduce((acc, country) => acc + country.sold, 0);

  return (
    <section id="shop" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Sklep Podróżówka
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Wybierz język podziękowania
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Każda Podróżówka zawiera piękne zdjęcie Polski i napis "Dziękuję" lub "Pozdrowienia" 
            w wybranym języku. Idealna pamiątka dla osób, które spotkasz w podróży.
          </p>

          {/* Total counter */}
          <div className="inline-flex items-center gap-3 bg-accent/10 px-6 py-3 rounded-full">
            <TrendingUp className="w-5 h-5 text-accent" />
            <span className="text-foreground font-medium">
              Łącznie sprzedano: <span className="font-display font-bold text-accent"><AnimatedCounter value={totalSold} /></span> Podróżówek
            </span>
          </div>
        </div>

        {/* Country grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
          {countries.map((country, index) => (
            <Link
              key={country.id}
              to={`/sklep?country_iso=${country.iso2}`}
              className="block transition-transform duration-300 hover:-translate-y-1 text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                onMouseEnter={() => setHoveredId(country.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative bg-card rounded-xl p-5 shadow-soft hover:shadow-card transition-all duration-300 cursor-pointer border border-transparent hover:border-primary/20 h-full"
              >
                {/* Flag and name */}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{country.flag}</span>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">
                    {country.available} wzorów
                  </span>
                </div>

                <h3 className="font-display font-bold text-foreground text-lg mb-1">
                  {country.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {country.nameLocal}
                </p>

                {/* Thank you and Greetings in local language */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-secondary rounded-lg px-2 py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Dziękuję:</p>
                    <p className="font-display text-sm text-foreground font-medium truncate">
                      {country.thankYou}
                    </p>
                  </div>
                  <div className="bg-secondary rounded-lg px-2 py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Pozdrowienia:</p>
                    <p className="font-display text-sm text-foreground font-medium truncate">
                      {country.greetings}
                    </p>
                  </div>
                </div>

                {/* Sales counter */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min((country.sold / 500) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      viewport={{ once: true }}
                    />
                  </div>
                  <span className="text-muted-foreground font-medium whitespace-nowrap">
                    {country.sold} sprzedanych
                  </span>
                </div>

                {/* Hover overlay */}
                <div className={`absolute inset-0 bg-primary/5 rounded-xl transition-opacity duration-300 ${hoveredId === country.id ? "opacity-100" : "opacity-0"}`} />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link 
            to="/sklep"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-soft hover:shadow-card"
          >
            Zamów pakiet Podróżówek
          </Link>
          <p className="text-sm text-muted-foreground mt-3">
            Dostawa na całą Polskę • Pakiety od 10 sztuk
          </p>
        </div>
      </div>
    </section>
  );
};

export default CountryCategories;
