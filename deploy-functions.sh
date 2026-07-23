#!/bin/bash

# Skrypt do automatycznego wdrożenia funkcji Supabase Edge Functions
# Autor: AI Coding Agent
# Projekt: Podróżówka

PROJECT_ID="xiqhaiyieisgemqopxfw"

# Kolory dla konsoli
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   Skrypt Wdrożeniowy Supabase Edge Functions       ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Sprawdzenie czy Supabase CLI jest zainstalowane
if ! command -v supabase &> /dev/null
then
    echo -e "${YELLOW}Supabase CLI nie jest zainstalowane globalnie. Próba instalacji za pomocą npm...${NC}"
    npm install -g supabase
    if [ $? -ne 0 ]; then
        echo -e "${RED}Nie udało się zainstalować Supabase CLI. Zainstaluj je ręcznie za pomocą: npm install -g supabase${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Supabase CLI jest zainstalowane.${NC}"

# 2. Sprawdzenie statusu zalogowania
echo -e "\n${BLUE}[1/3] Logowanie do Supabase...${NC}"
echo -e "${YELLOW}Jeśli nie jesteś zalogowany, zostaniesz poproszony o podanie tokenu dostępu Supabase (Access Token).${NC}"
echo -e "${YELLOW}Token możesz wygenerować na stronie: https://supabase.com/dashboard/account/tokens${NC}"

supabase login

if [ $? -ne 0 ]; then
    echo -e "${RED}Błąd logowania do Supabase. Upewnij się, że podajesz prawidłowy token.${NC}"
    exit 1
fi

# 3. Lista funkcji do wdrożenia
FUNCTIONS=(
    "admin-payment-status"
    "confirm-cod-payment"
    "create-payment"
    "fiscal-document-pdf"
    "generate-qr"
    "generate-qr-pdf"
    "issue-fiscal-document"
    "p24-webhook"
    "register-postcard"
)

echo -e "\n${BLUE}[2/3] Wdrażanie Edge Functions do projektu: ${PROJECT_ID}...${NC}"

for func in "${FUNCTIONS[@]}"
do
    echo -e "\nWdrażanie funkcji: ${YELLOW}${func}${NC}..."
    supabase functions deploy "$func" --project-ref "$PROJECT_ID" --no-verify-jwt
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Funkcja ${func} wdrożona pomyślnie.${NC}"
    else
        echo -e "${RED}✗ Błąd podczas wdrażania funkcji ${func}.${NC}"
    fi
done

# 4. Konfiguracja zmiennych środowiskowych
echo -e "\n${BLUE}[3/3] Konfiguracja zmiennych środowiskowych w Supabase...${NC}"
echo -e "${YELLOW}Edge Functions do działania wymagają ustawienia kluczy i zmiennych (np. Przelewy24).${NC}"
echo -e "Możesz ustawić je za pomocą następującej komendy:"
echo -e "${BLUE}supabase secrets set --project-ref ${PROJECT_ID} P24_MERCHANT_ID=twój_id P24_CRC_KEY=twój_klucz P24_API_KEY=twój_api_key INTERNAL_FN_SECRET=super_sekretny_klucz${NC}"

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN} Wdrożenie zakończone! Sprawdź powyższe logi.       ${NC}"
echo -e "${GREEN}====================================================${NC}"
