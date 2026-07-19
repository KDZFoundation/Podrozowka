import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Regulamin — Podróżówka</title>
        <meta name="description" content="Regulamin platformy Podróżówka — zasady korzystania z serwisu, zamówień pocztówek i systemu grywalizacji." />
        <link rel="canonical" href="https://podrozowka.lovable.app/regulamin" />
        <meta property="og:title" content="Regulamin — Podróżówka" />
        <meta property="og:description" content="Zasady korzystania z platformy Podróżówka." />
        <meta property="og:url" content="https://podrozowka.lovable.app/regulamin" />
      </Helmet>
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            Regulamin
          </h1>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p className="text-sm text-muted-foreground/70">Ostatnia aktualizacja: 13 marca 2026</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">1. Postanowienia ogólne</h2>
            <p>
              Niniejszy regulamin określa zasady korzystania z platformy Podróżówka, 
              dostępnej pod adresem podrozowka.lovable.app.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8">2. Definicje</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Podróżówka</strong> — pocztówka z Polski wręczana osobom spotkanym w podróży.</li>
              <li><strong>Podróżnik</strong> — zarejestrowany użytkownik, który kupuje i wręcza Podróżówki.</li>
              <li><strong>Odbiorca</strong> — osoba, która otrzymała Podróżówkę i rejestruje ją przez kod QR.</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8">3. Rejestracja i konto</h2>
            <p>
              Korzystanie z pełnej funkcjonalności wymaga założenia konta. Użytkownik zobowiązuje 
              się podać prawdziwe dane i chronić swoje hasło.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8">4. Zamówienia i płatności</h2>
            <p>
              Zamówienia realizowane są po zaksięgowaniu płatności. Ceny podane na stronie są 
              cenami brutto. Szczegóły dostawy określane są w procesie zamówienia.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8">5. System grywalizacji</h2>
            <p>
              Użytkownicy zdobywają punkty za zakup pocztówek, wręczanie ich w różnych krajach 
              oraz rejestracje przez odbiorców. Punkty przekładają się na rangi widoczne w profilu.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8">6. Odpowiedzialność</h2>
            <p>
              Podróżówka dokłada starań, aby platforma działała bez zakłóceń, jednak nie ponosi 
              odpowiedzialności za przerwy techniczne ani za treści zamieszczane przez użytkowników.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8">7. Kontakt</h2>
            <p>
              W sprawach dotyczących regulaminu prosimy o kontakt: 
              <a href="mailto:kontakt@podrozowka.pl" className="text-primary hover:underline">kontakt@podrozowka.pl</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
