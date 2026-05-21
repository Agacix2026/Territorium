# Territorium
Territorium: Zarządzanie Nieruchomościami

1. Wizja, Cel i Użytkownicy Systemu
   Territorium to cyfrowe repozytorium mienia publicznego, ujednolicające procesy związane z planowaniem
   przestrzennym, ewidencją umów dzierżawy i aukcjami.
   Gość: Przegląda mapy i oferty przetargów z poziomu telefonu, tabletu lub komputera.
   Zalogowany (Obywatel RP): Rejestracja z wymogiem potwierdzenia obywatelstwa. Może deklarować
   chęć udziału w licytacjach.
   Licytant: Rola nadawana obywatelowi po ręcznym zatwierdzeniu wpłaty wadium przez Urzędnika,
   uprawniająca do udziału w aukcji.
   Urzędnik / Administrator: Zarządza systemem z poziomu komputera (Desktop), akceptuje płatności,
   dodaje dokumenty techniczne.

3. Stos Technologiczny i Optymalizacja
   Warstwa Prezentacji (Frontend)
   Aplikacja oparta na czystym języku JavaScript, HTML, CSS oraz bibliotece Bootstrap. Podejście "Smart
   RWD" dzieli interfejs na w pełni responsywne widoki publiczne oraz zaawansowane, desktopowe panele
   urzędnicze. System w pełni respektuje wymogi WCAG 2.1 AA (kontrast, nawigacja klawiaturą Tab).

   Warstwa Logiki (Backend Node.js) i Bezpieczeństwo
   Bezstanowe API chronione systemem tokenów autoryzacyjnych. Wszystkie hasła w bazie danych są
   solone i hashowane przy użyciu algorytmu SHA256.
   
   Baza Danych (PostgreSQL) i Pliki PDF
   Architektura zoptymalizowana pod kątem wydajności: ciężkie pliki PDF z dokumentacją techniczną są
   przechowywane bezpośrednio na dysku kontenera (wolumeny), a baza danych zawiera jedynie lekkie
   referencje (ścieżki do plików). Baza zintegrowana z mapami z wykorzystaniem GIS.

3. Architektura Docker
   System jest w pełni skonteneryzowany i podzielony na 3 segmenty: frontend, backend oraz bazę danych,
   komunikujące się wewnątrz bezpiecznej sieci wirtualnej.
