import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Polityka prywatności — Podróżówka</title>
        <meta name="description" content="Polityka prywatności Podróżówki — zasady przetwarzania danych osobowych zgodne z RODO i polskimi przepisami o ochronie danych." />
        <link rel="canonical" href="https://podrozowka.lovable.app/polityka-prywatnosci" />
        <meta property="og:title" content="Polityka prywatności — Podróżówka" />
        <meta property="og:description" content="Zasady przetwarzania danych osobowych w projekcie Podróżówka zgodne z RODO." />
        <meta property="og:url" content="https://podrozowka.lovable.app/polityka-prywatnosci" />
      </Helmet>
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
            Polityka prywatności
          </h1>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <p className="text-sm text-muted-foreground/70">Ostatnia aktualizacja: 13 marca 2026</p>

            <p>
              Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych 
              użytkowników serwisu Podróżówka (dalej: „Serwis"), dostępnego pod adresem podrozowka.lovable.app, 
              zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. 
              w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie 
              swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie 
              o ochronie danych, dalej: „RODO") oraz ustawą z dnia 10 maja 2018 r. o ochronie danych osobowych.
            </p>

            {/* 1. Administrator danych */}
            <h2 className="text-xl font-semibold text-foreground mt-8">1. Administrator danych osobowych</h2>
            <p>
              Administratorem Twoich danych osobowych jest projekt Podróżówka z siedzibą w Polsce 
              (dalej: „Administrator").
            </p>
            <p>
              Kontakt z Administratorem możliwy jest za pośrednictwem poczty elektronicznej: {" "}
              <a href="mailto:kontakt@podrozowka.pl" className="text-primary hover:underline">
                kontakt@podrozowka.pl
              </a>.
            </p>
            <p>
              Administrator dokłada szczególnej staranności w celu ochrony interesów osób, których dane dotyczą, 
              a w szczególności zapewnia, że zbierane przez niego dane są przetwarzane zgodnie z prawem, 
              zbierane dla oznaczonych i zgodnych z prawem celów oraz niepoddawane dalszemu przetwarzaniu 
              niezgodnemu z tymi celami.
            </p>

            {/* 2. Podstawa prawna */}
            <h2 className="text-xl font-semibold text-foreground mt-8">2. Podstawa prawna przetwarzania danych</h2>
            <p>Dane osobowe przetwarzane są na podstawie:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Art. 6 ust. 1 lit. a RODO</strong> — zgoda osoby, której dane dotyczą 
                (np. zgoda na otrzymywanie newslettera, zgoda na przetwarzanie danych w celach marketingowych).
              </li>
              <li>
                <strong>Art. 6 ust. 1 lit. b RODO</strong> — przetwarzanie jest niezbędne do wykonania umowy, 
                której stroną jest osoba, której dane dotyczą, lub do podjęcia działań na żądanie osoby, 
                której dane dotyczą, przed zawarciem umowy (np. realizacja zamówienia pocztówek, 
                prowadzenie konta użytkownika).
              </li>
              <li>
                <strong>Art. 6 ust. 1 lit. c RODO</strong> — przetwarzanie jest niezbędne do wypełnienia 
                obowiązku prawnego ciążącego na Administratorze (np. obowiązki podatkowe i rachunkowe).
              </li>
              <li>
                <strong>Art. 6 ust. 1 lit. f RODO</strong> — przetwarzanie jest niezbędne do celów wynikających 
                z prawnie uzasadnionych interesów realizowanych przez Administratora (np. analityka, 
                zapewnienie bezpieczeństwa, dochodzenie roszczeń).
              </li>
            </ul>

            {/* 3. Jakie dane zbieramy */}
            <h2 className="text-xl font-semibold text-foreground mt-8">3. Zakres zbieranych danych</h2>
            <p>
              Administrator zbiera i przetwarza następujące kategorie danych osobowych:
            </p>
            <h3 className="text-lg font-medium text-foreground mt-4">a) Dane konta użytkownika</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Adres e-mail</li>
              <li>Imię i nazwisko</li>
              <li>Nazwa wyświetlana (pseudonim)</li>
              <li>Zdjęcie profilowe (awatar)</li>
              <li>Miasto i kraj zamieszkania (opcjonalnie)</li>
              <li>Opis profilu (bio)</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">b) Dane zamówień</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Imię i nazwisko odbiorcy przesyłki</li>
              <li>Adres dostawy (ulica, miasto, kod pocztowy, kraj)</li>
              <li>Historia zamówień i płatności</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">c) Dane rejestracji pocztówek</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Imię osoby rejestrującej pocztówkę</li>
              <li>Opcjonalna wiadomość tekstowa</li>
              <li>Adres e-mail (opcjonalnie, za zgodą)</li>
              <li>Dane geolokalizacyjne — współrzędne GPS (opcjonalnie, za wyraźną zgodą użytkownika)</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">d) Dane techniczne</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Adres IP</li>
              <li>Typ i wersja przeglądarki internetowej</li>
              <li>System operacyjny</li>
              <li>Data i godzina odwiedzin</li>
              <li>Odwiedzane podstrony i czas spędzony na stronie</li>
              <li>Źródło odesłania (referrer)</li>
              <li>Informacje zawarte w plikach cookies</li>
            </ul>

            {/* 4. Cele przetwarzania */}
            <h2 className="text-xl font-semibold text-foreground mt-8">4. Cele przetwarzania danych</h2>
            <p>Twoje dane osobowe przetwarzamy w następujących celach:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Realizacja zamówień</strong> — przetwarzanie danych niezbędnych do przyjęcia, 
                opłacenia, skompletowania i wysyłki zamówienia pocztówek 
                (podstawa: art. 6 ust. 1 lit. b RODO).
              </li>
              <li>
                <strong>Prowadzenie konta użytkownika</strong> — umożliwienie rejestracji, logowania, 
                zarządzania profilem i korzystania z funkcji Serwisu 
                (podstawa: art. 6 ust. 1 lit. b RODO).
              </li>
              <li>
                <strong>Obsługa systemu grywalizacji</strong> — naliczanie punktów, przyznawanie rang, 
                prowadzenie rankingów podróżników 
                (podstawa: art. 6 ust. 1 lit. b RODO).
              </li>
              <li>
                <strong>Rejestracja pocztówek</strong> — obsługa procesu rejestracji pocztówek przez 
                odbiorców za pomocą kodu QR 
                (podstawa: art. 6 ust. 1 lit. a RODO — zgoda).
              </li>
              <li>
                <strong>Komunikacja</strong> — odpowiadanie na zapytania, powiadomienia systemowe, 
                informacje o statusie zamówienia 
                (podstawa: art. 6 ust. 1 lit. f RODO).
              </li>
              <li>
                <strong>Analityka i ulepszanie Serwisu</strong> — analiza sposobu korzystania z Serwisu 
                w celu jego ulepszania i optymalizacji 
                (podstawa: art. 6 ust. 1 lit. f RODO).
              </li>
              <li>
                <strong>Obowiązki prawne</strong> — wypełnianie obowiązków wynikających z przepisów prawa, 
                w tym przepisów podatkowych i rachunkowych 
                (podstawa: art. 6 ust. 1 lit. c RODO).
              </li>
            </ul>

            {/* 5. Przekazywanie danych */}
            <h2 className="text-xl font-semibold text-foreground mt-8">5. Odbiorcy danych osobowych</h2>
            <p>
              Twoje dane osobowe mogą być przekazywane następującym kategoriom odbiorców:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Dostawcy usług hostingowych i infrastruktury IT</strong> — podmioty zapewniające 
                serwery, bazę danych i infrastrukturę techniczną Serwisu.
              </li>
              <li>
                <strong>Dostawcy usług płatniczych</strong> — podmioty obsługujące transakcje płatnicze 
                (w zakresie niezbędnym do realizacji płatności).
              </li>
              <li>
                <strong>Firmy kurierskie i pocztowe</strong> — podmioty realizujące dostawę zamówionych 
                pocztówek (w zakresie danych adresowych).
              </li>
              <li>
                <strong>Dostawcy narzędzi analitycznych</strong> — podmioty dostarczające narzędzia 
                do analizy ruchu na stronie.
              </li>
              <li>
                <strong>Organy publiczne</strong> — w przypadkach przewidzianych przepisami prawa 
                (np. organy podatkowe, organy ścigania).
              </li>
            </ul>
            <p>
              Administrator nie sprzedaje danych osobowych podmiotom trzecim. Dane przekazywane są 
              wyłącznie w zakresie niezbędnym do realizacji wskazanych celów, na podstawie stosownych 
              umów powierzenia przetwarzania danych osobowych (art. 28 RODO).
            </p>

            {/* 6. Bezpieczeństwo danych */}
            <h2 className="text-xl font-semibold text-foreground mt-8">6. Bezpieczeństwo danych</h2>
            <p>
              Administrator stosuje odpowiednie środki techniczne i organizacyjne zapewniające 
              bezpieczeństwo przetwarzanych danych osobowych, w szczególności:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Szyfrowanie połączenia za pomocą certyfikatu SSL/TLS.</li>
              <li>Ograniczony dostęp do danych osobowych wyłącznie dla upoważnionych osób.</li>
              <li>Regularne tworzenie kopii zapasowych danych.</li>
              <li>Stosowanie silnych mechanizmów uwierzytelniania użytkowników.</li>
              <li>Monitorowanie i audytowanie dostępu do systemów informatycznych.</li>
              <li>Hashowanie haseł i tokenów uwierzytelniających.</li>
            </ul>

            {/* 7. Prawa użytkownika */}
            <h2 className="text-xl font-semibold text-foreground mt-8">7. Twoje prawa wynikające z RODO</h2>
            <p>
              W związku z przetwarzaniem Twoich danych osobowych przysługują Ci następujące prawa:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong>Prawo dostępu do danych (art. 15 RODO)</strong> — masz prawo uzyskać od Administratora 
                potwierdzenie, czy przetwarzane są Twoje dane osobowe, a jeśli ma to miejsce, uzyskać 
                dostęp do nich oraz informacje o celach przetwarzania, kategoriach danych, odbiorcach 
                i planowanym okresie przechowywania.
              </li>
              <li>
                <strong>Prawo do sprostowania danych (art. 16 RODO)</strong> — masz prawo żądać niezwłocznego 
                sprostowania nieprawidłowych danych osobowych lub uzupełnienia niekompletnych danych.
              </li>
              <li>
                <strong>Prawo do usunięcia danych — „prawo do bycia zapomnianym" (art. 17 RODO)</strong> — 
                masz prawo żądać usunięcia swoich danych osobowych, gdy dane nie są już niezbędne do celów, 
                w których zostały zebrane, cofniesz zgodę, wniesiesz sprzeciw wobec przetwarzania 
                lub dane były przetwarzane niezgodnie z prawem.
              </li>
              <li>
                <strong>Prawo do ograniczenia przetwarzania (art. 18 RODO)</strong> — masz prawo żądać 
                ograniczenia przetwarzania danych w określonych przypadkach, np. gdy kwestionujesz 
                prawidłowość danych lub wniosłeś sprzeciw wobec przetwarzania.
              </li>
              <li>
                <strong>Prawo do przenoszenia danych (art. 20 RODO)</strong> — masz prawo otrzymać swoje 
                dane osobowe w ustrukturyzowanym, powszechnie używanym formacie nadającym się do 
                odczytu maszynowego oraz przesłać je innemu administratorowi.
              </li>
              <li>
                <strong>Prawo do sprzeciwu (art. 21 RODO)</strong> — masz prawo w dowolnym momencie wnieść 
                sprzeciw wobec przetwarzania danych opartego na prawnie uzasadnionym interesie Administratora 
                (art. 6 ust. 1 lit. f RODO), w tym wobec profilowania.
              </li>
              <li>
                <strong>Prawo do cofnięcia zgody</strong> — w przypadku przetwarzania danych na podstawie 
                zgody (art. 6 ust. 1 lit. a RODO), masz prawo do cofnięcia zgody w dowolnym momencie. 
                Cofnięcie zgody nie wpływa na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem.
              </li>
              <li>
                <strong>Prawo do wniesienia skargi do organu nadzorczego (art. 77 RODO)</strong> — 
                jeśli uważasz, że przetwarzanie Twoich danych osobowych narusza przepisy RODO, masz prawo 
                wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 
                00-193 Warszawa, strona: {" "}
                <a href="https://uodo.gov.pl" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  uodo.gov.pl
                </a>.
              </li>
            </ul>
            <p>
              W celu skorzystania z powyższych praw, skontaktuj się z Administratorem pod adresem: {" "}
              <a href="mailto:kontakt@podrozowka.pl" className="text-primary hover:underline">
                kontakt@podrozowka.pl
              </a>.
            </p>

            {/* 8. Czas przechowywania */}
            <h2 className="text-xl font-semibold text-foreground mt-8">8. Okres przechowywania danych</h2>
            <p>Dane osobowe przechowywane są przez okres:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Dane konta użytkownika</strong> — przez czas posiadania konta w Serwisie. 
                Po usunięciu konta dane są usuwane lub anonimizowane, chyba że ich dalsze przechowywanie 
                jest wymagane przepisami prawa.
              </li>
              <li>
                <strong>Dane zamówień</strong> — przez okres wymagany przepisami prawa podatkowego 
                i rachunkowego (co do zasady 5 lat od końca roku podatkowego).
              </li>
              <li>
                <strong>Dane rejestracji pocztówek</strong> — przez czas niezbędny do realizacji celów 
                Serwisu (śledzenie podróży pocztówek) lub do momentu cofnięcia zgody.
              </li>
              <li>
                <strong>Dane techniczne i cookies</strong> — przez okres wskazany w sekcji dotyczącej 
                plików cookies (sesyjne — do zamknięcia przeglądarki; stałe — zgodnie z ustawionym 
                czasem ważności).
              </li>
              <li>
                <strong>Dane przetwarzane na podstawie zgody</strong> — do momentu cofnięcia zgody.
              </li>
            </ul>

            {/* 9. Przekazywanie do państw trzecich */}
            <h2 className="text-xl font-semibold text-foreground mt-8">9. Przekazywanie danych do państw trzecich</h2>
            <p>
              W związku z korzystaniem z usług dostawców infrastruktury IT, Twoje dane osobowe mogą być 
              przekazywane do państw trzecich (tj. poza Europejski Obszar Gospodarczy). W takim przypadku 
              transfer danych odbywa się na podstawie:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony (art. 45 RODO).</li>
              <li>Standardowych klauzul umownych przyjętych przez Komisję Europejską (art. 46 ust. 2 lit. c RODO).</li>
              <li>Innych odpowiednich zabezpieczeń przewidzianych w RODO.</li>
            </ul>

            {/* 10. Profilowanie */}
            <h2 className="text-xl font-semibold text-foreground mt-8">10. Zautomatyzowane podejmowanie decyzji i profilowanie</h2>
            <p>
              Administrator nie podejmuje decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, 
              w tym profilowaniu, które wywoływałyby skutki prawne lub w podobny sposób istotnie wpływały 
              na użytkownika (art. 22 RODO).
            </p>
            <p>
              System grywalizacji (punkty, rangi, rankingi) opiera się na obiektywnych danych dotyczących 
              aktywności użytkownika w Serwisie i nie stanowi profilowania w rozumieniu RODO.
            </p>

            {/* 11. Pliki cookies */}
            <h2 className="text-xl font-semibold text-foreground mt-8">11. Pliki cookies</h2>
            <p>
              Serwis wykorzystuje pliki cookies (ciasteczka), czyli niewielkie pliki tekstowe zapisywane 
              na urządzeniu końcowym użytkownika. Pliki cookies stosowane są w celu:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Zapewnienia prawidłowego działania Serwisu</strong> — cookies niezbędne do logowania, 
                utrzymania sesji użytkownika i zapewnienia bezpieczeństwa.
              </li>
              <li>
                <strong>Analityki</strong> — cookies analityczne pozwalające na analizę sposobu korzystania 
                z Serwisu i jego optymalizację.
              </li>
              <li>
                <strong>Preferencji użytkownika</strong> — cookies przechowujące ustawienia użytkownika 
                (np. preferencje językowe, motyw kolorystyczny).
              </li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">Rodzaje plików cookies</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Cookies sesyjne</strong> — tymczasowe pliki przechowywane na urządzeniu użytkownika 
                do momentu zamknięcia przeglądarki. Niezbędne do prawidłowego funkcjonowania Serwisu.
              </li>
              <li>
                <strong>Cookies stałe</strong> — pliki przechowywane na urządzeniu użytkownika przez 
                określony czas lub do momentu ich ręcznego usunięcia. Służą do zapamiętywania preferencji 
                użytkownika.
              </li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">Zarządzanie plikami cookies</h3>
            <p>
              Użytkownik może w każdej chwili zmienić ustawienia dotyczące plików cookies w swojej przeglądarce 
              internetowej, w tym zablokować obsługę plików cookies lub usunąć istniejące cookies. 
              Szczegółowe informacje o zarządzaniu cookies dostępne są w ustawieniach przeglądarki.
            </p>
            <p>
              Ograniczenie stosowania plików cookies może wpłynąć na niektóre funkcjonalności Serwisu.
            </p>

            {/* 12. Postanowienia końcowe */}
            <h2 className="text-xl font-semibold text-foreground mt-8">12. Postanowienia końcowe</h2>
            <p>
              Administrator zastrzega sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności. 
              O wszelkich zmianach użytkownicy zostaną poinformowani poprzez zamieszczenie zaktualizowanej 
              wersji na stronie Serwisu z podaniem daty ostatniej aktualizacji.
            </p>
            <p>
              Niniejsza Polityka Prywatności ma charakter informacyjny i nie stanowi źródła obowiązków 
              dla użytkowników Serwisu. W przypadku pytań lub wątpliwości dotyczących przetwarzania 
              danych osobowych prosimy o kontakt: {" "}
              <a href="mailto:kontakt@podrozowka.pl" className="text-primary hover:underline">
                kontakt@podrozowka.pl
              </a>.
            </p>
            <p>
              W sprawach nieuregulowanych niniejszą Polityką Prywatności zastosowanie mają przepisy RODO 
              oraz odpowiednie przepisy prawa polskiego.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
