# Territorium: Zarządzanie Nieruchomościami

Aplikacja **Territorium** to cyfrowe repozytorium mienia publicznego, ujednolicające procesy związane z planowaniem przestrzennym, ewidencją umów dzierżawy i obsługą aukcji. Projekt rozwiązuje problem rozproszonych i trudno dostępnych danych o mieniu samorządowym.

## 1. Wizja, Cel i Użytkownicy
Celem systemu jest zapewnienie pełnej transparentności w gospodarce przestrzennej oraz ułatwienie kontaktu obywateli z urzędem.

### Role w systemie (Aktorzy)
* **Gość:** Przegląda ogólnodostępne mapy GIS oraz aktualne oferty przetargów z poziomu dowolnego urządzenia (telefon, tablet, komputer).
* **Zalogowany (Obywatel RP):** Po rejestracji z potwierdzeniem obywatelstwa może zgłaszać chęć udziału w aukcjach i opłacać wadium online.
* **Licytant:** Status nadawany przez urzędnika po zaksięgowaniu wpłaty wadium, uprawniający do aktywnej licytacji.
* **Urzędnik / Administrator:** Zarządza systemem z poziomu komputera (Desktop): edytuje mapy, dodaje umowy dzierżawy, akceptuje płatności i dokumentację techniczną.

## 2. Przewodnik po funkcjonalnościach
System umożliwia realizację następujących ścieżek użytkownika:
* **Ewidencja na mapie:** Przeglądanie nieruchomości z podziałem na typy (Mieszkalne, Usługowe, Przemysłowe). Informacje o działce uzyskasz zarówno poprzez kliknięcie w wielokąt (poligon) bezpośrednio na mapie GIS, jak i wybierając zasób z listy bocznej. W obu przypadkach otworzy się okno modalne ze szczegółami katastralnymi. 
* **Proces Aukcyjny:** Mieszkaniec może zgłosić wadium do wybranej aukcji. Urzędnik w panelu weryfikuje zgłoszenia i zatwierdza je, zmieniając status użytkownika na "Licytanta", po akceptacji możliwość licytacji zostaje użytkownikowi udostępniona.
* **Rejestr Umów:** Zarządzanie najmem i dzierżawą (podgląd sygnatur, statusów podpisu oraz czynszów, z możliwością pobrania umowy.
* **Repozytorium Dokumentów:** Dostęp do dokumentacji technicznej powiązanej z konkretnymi zasobami.

## 3. Stos Technologiczny i Optymalizacja
### Warstwa Prezentacji (Frontend)
Aplikacja oparta na czystym języku JavaScript, HTML5 oraz bibliotece Bootstrap 5. Podejście „Smart RWD” dzieli interfejs na w pełni responsywne widoki publiczne oraz zaawansowane, desktopowe panele urzędnicze. System spełnia wymogi **WCAG 2.1 AA** (kontrast, dostępność nawigacji klawiszowej).

### Warstwa Logiki (Backend Node.js)
Bezstanowe REST API chronione systemem tokenów autoryzacyjnych (JWT). Wszystkie hasła w bazie danych są solone i hashowane algorytmem **SHA256**. Każdy punkt końcowy (endpoint) jest zabezpieczony na poziomie autoryzacji ról (RBAC).

### Baza Danych (PostgreSQL)
Architektura zoptymalizowana pod kątem wydajności. Integracja z systemami mapowymi odbywa się za pomocą rozszerzenia **PostGIS**. Dokumentacja techniczna (PDF) jest przechowywana na dysku, a baza danych przechowuje jedynie lekkie referencje (linki do plików).

## 4. Architektura Docker i Uruchomienie
System jest w pełni skonteneryzowany i podzielony na 3 segmenty (frontend, backend, baza danych), które komunikują się wewnątrz bezpiecznej sieci wirtualnej.
Po uruchomieniu kontenerów aplikacja jest dostępna pod następującymi adresami:
* **Frontend (Interfejs użytkownika):**  http://localhost:3200
* **Backend (API):**  http://localhost:3100

### Konfiguracja (WAŻNE)
Z powodów bezpieczeństwa plik `.env` z rzeczywistymi hasłami nie znajduje się w repozytorium.
1. Skopiuj plik wzorcowy: `cp .env.example .env`
2. Uzupełnij w pliku `.env` zmienne m.in.: `DATABASE_URL` oraz `JWT_SECRET`.

## Dane testowe (Dostęp do panelu Administratora)
Po uruchomieniu projektu za pomocą `docker-compose up`, w bazie danych automatycznie tworzone jest konto administratora z pełnymi uprawnieniami do zarządzania systemem (w tym akceptacji wadium i edycji mapy).

* **Login (E-mail):** `admin@urzad.pl`
* **Hasło:** `admin123`

*Uwaga: Hasło jest hashowane w bazie danych zgodnie z algorytmem SHA256. Powyższe dane służą wyłącznie do celów testowych.*

### Uruchomienie projektu
Aby uruchomić system, upewnij się, że masz zainstalowany Docker i Docker Compose:
```bash
docker-compose build
docker-compose up