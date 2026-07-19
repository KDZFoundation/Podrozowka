# Podróżówka 🗺️📮

Podróżówka to innowacyjna platforma łącząca tradycyjne, fizyczne kartki pocztowe z cyfrowym dziennikiem podróży. Klienci mogą kupować unikalne, designerskie pocztówki wyposażone w dedykowane kody QR oraz kody aktywacyjne. Po zeskanowaniu kodu przez podróżnika, kartka zostaje zarejestrowana w jego profilu, co pozwala na odblokowanie interaktywnego dziennika podróży, zbieranie wirtualnych pieczątek, śledzenie statystyk oraz dzielenie się swoimi przygodami.

---

## 🏗️ Architektura projektu

Projekt opiera się na architekturze typu **Serverless Cloud** oraz **JAMstack**:

### 1. Frontend (Aplikacja kliencka)
- **Framework:** React 18 z bundlerem **Vite** i językiem **TypeScript**.
- **Stylizowanie:** **Tailwind CSS** zapewniający pełną responsywność i nowoczesną estetykę.
- **Komponenty:** **Shadcn UI** oraz ikony z biblioteki **Lucide React**.
- **Nawigacja i stan:** React Router do obsługi widoków oraz dedykowane konteksty (np. koszyk, autoryzacja).

### 2. Backend i Baza Danych (Supabase)
- **Baza danych:** **PostgreSQL** z włączonym mechanizmem **RLS (Row-Level Security)**, widokami, procedurami składowanymi (RPC) oraz wyzwalaczami (Triggers) zapewniającymi integralność danych bezpośrednio na poziomie bazy.
- **Autentykacja:** Supabase Auth (logowanie e-mail / hasło, linki rejestracyjne).
- **Przechowywanie plików:** Supabase Storage do hostowania grafik kartek pocztowych oraz generowanych dokumentów PDF.

### 3. Supabase Edge Functions (Logika serwerowa / Mikroserwisy)
- `create-payment` — Inicjalizacja płatności za zamówienia, integracja z bramką płatniczą Przelewy24.
- `p24-webhook` — Odbiór i przetwarzanie powiadomień o statusie transakcji z bramki Przelewy24.
- `confirm-cod-payment` — Potwierdzanie i obsługa płatności przy odbiorze (Cash on Delivery).
- `register-postcard` — API służące do bezpiecznej rejestracji fizycznej kartki w profilu podróżnika.
- `generate-qr-pdf` — Generowanie arkuszy PDF z kodami QR i kodami aktywacyjnymi dla drukarni.
- `issue-fiscal-document` — Automatyczne wystawianie dokumentów fiskalnych za pośrednictwem systemu Merit ERP.
- `admin-payment-status` — Narzędzia administracyjne do weryfikacji i modyfikacji stanów płatności.

---

## ⚙️ Zmienne środowiskowe

### Frontend (.env)
Zmienne wymagane do poprawnej komunikacji aplikacji React z instancją Supabase:

```env
VITE_SUPABASE_PROJECT_ID=twoj_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=twoj_anon_key
VITE_SUPABASE_URL=https://twoja_instancja.supabase.co
```

### Supabase Secrets (Edge Functions)
Zmienne konfigurowane bezpośrednio w Supabase CLI lub w panelu administracyjnym Supabase:
- `P24_MERCHANT_ID`, `P24_POS_ID`, `P24_CRC`, `P24_API_KEY` — Dane uwierzytelniające integracji z bramką Przelewy24.
- `MERIT_API_KEY` — Klucz autoryzacyjny do integracji fakturowania Merit.
- `APP_ADMIN_SECRET` — Tajny token dla wywołań webhooków i akcji administracyjnych.

---

## 🚀 Sposób uruchamiania lokalnego

### Wymagania wstępne
- Zainstalowane środowisko **Node.js** (rekomendowana wersja v18 lub nowsza).
- Menadżer pakietów **npm** (zalecany, po usunięciu konfliktowych lockfile'ów).

### Instalacja i uruchomienie krok po kroku:

1. **Sklonuj repozytorium projektu:**
   ```bash
   git clone <url_repozytorium>
   cd podrozowka
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Skonfiguruj zmienne środowiskowe:**
   Skopiuj plik `.env.example` jako `.env` i uzupełnij brakujące wartości kluczy:
   ```bash
   cp .env.example .env
   ```

4. **Uruchom serwer deweloperski:**
   ```bash
   npm run dev
   ```
   Aplikacja będzie dostępna pod adresem: `http://localhost:3000` (lub innym wskazanym w terminalu).

---

## 📦 Proces deployu

### 1. Frontend
Aplikacja jest w pełni statyczna po zbudowaniu. Aby przygotować produkcyjną wersję kodu:
```bash
npm run build
```
Zbudowane pliki trafią do katalogu `dist/`, skąd mogą zostać umieszczone na dowolnym hostingu statycznym (np. Netlify, Vercel, Firebase Hosting, Cloud Run).

### 2. Baza danych i Edge Functions (Supabase)
Aby wdrożyć zmiany w schemacie bazy danych oraz funkcjach Edge Functions na produkcję:

1. **Wdrożenie schematu bazy danych (migracje):**
   ```bash
   supabase db push
   ```

2. **Wdrożenie wszystkich funkcji Edge Functions:**
   ```bash
   supabase functions deploy --all
   ```

3. **Ustawienie sekretów produkcyjnych:**
   ```bash
   supabase secrets set NAZWA_ZMIENNEJ=wartosc
   ```
