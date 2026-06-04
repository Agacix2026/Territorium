-- 1. KOD BEATY: Rozszerzenie PostGIS (wymagane przed wszystkim!)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. KOD AGATY (Twój): Użytkownicy (Tabela nadrzędna)
CREATE TABLE Uzytkownicy (
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) UNIQUE NOT NULL,
    haslo_hash VARCHAR(255) NOT NULL,
    rola VARCHAR(50) DEFAULT 'Mieszkaniec'
);

-- Skrypt inicjalizujący Admina (hasło: admin123)
INSERT INTO Uzytkownicy (login, haslo_hash, rola) 
VALUES (
    'admin@urzad.pl', 
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 
    'Admin'
) 
ON CONFLICT (login) 
DO UPDATE SET rola = 'Admin';

-- 3. KOD BEATY: Nieruchomości (Tabela nadrzędna)
CREATE TABLE Nieruchomosci (
    ID SERIAL PRIMARY KEY,
    wspolrzedne GEOMETRY(Polygon, 4326) NOT NULL, 
    powierzchnia NUMERIC NOT NULL,
    status VARCHAR(50) NOT NULL,
    przeznaczenie VARCHAR(100) NOT NULL,
    cena NUMERIC(12, 2) DEFAULT 0
);

-- 4. KOD ANI: Umowy (Klucze obce do Użytkowników i Nieruchomości)
CREATE TABLE Umowy (
    id SERIAL PRIMARY KEY,
    id_dzialki INTEGER NOT NULL REFERENCES Nieruchomosci(ID) ON DELETE CASCADE,
    id_najemcy INTEGER NOT NULL REFERENCES Uzytkownicy(id) ON DELETE RESTRICT,
    numer_umowy VARCHAR(100) UNIQUE NOT NULL,
    data_rozpoczecia DATE NOT NULL,
    data_zakonczenia DATE NOT NULL,
    wartosc_czynszu NUMERIC(12, 2) NOT NULL CHECK (wartosc_czynszu >= 0),
    status VARCHAR(50) DEFAULT 'Aktywna' CHECK (status IN ('Aktywna', 'Zakończona', 'Anulowana')),
    utworzono TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_daty_chronologia CHECK (data_zakonczenia > data_rozpoczecia)
);

CREATE INDEX idx_umowy_id_najemcy ON Umowy(id_najemcy);
CREATE INDEX idx_umowy_id_dzialki ON Umowy(id_dzialki);

-- 5. KOD MADZI: Dokumenty
CREATE TABLE dokumenty (
    id SERIAL PRIMARY KEY,
    nazwa VARCHAR(255) NOT NULL,
    typ_pliku VARCHAR(50) DEFAULT 'PDF',
    obiekt_id INTEGER NOT NULL,
    obiekt_typ VARCHAR(100) NOT NULL,
    data_dodania TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. KOD WERONIKI: Aukcje i Logi Licytacji
CREATE TABLE Aukcje (
    id SERIAL PRIMARY KEY,
    id_nieruchomosci INTEGER NOT NULL REFERENCES Nieruchomosci(ID) ON DELETE CASCADE,
    id_wlasciciela INTEGER REFERENCES Uzytkownicy(id) ON DELETE RESTRICT,
    tytul VARCHAR(255) NOT NULL,
    opis TEXT NOT NULL,
    cena_wywolawcza NUMERIC(12, 2) NOT NULL CHECK (cena_wywolawcza > 0),
    aktualna_cena NUMERIC(12, 2) NOT NULL,
    kwota_wadium NUMERIC(12, 2) NOT NULL CHECK (kwota_wadium >= 0),
    data_rozpoczecia TIMESTAMP WITH TIME ZONE NOT NULL,
    data_zakonczenia TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'planowana',
    CONSTRAINT check_ceny CHECK (aktualna_cena >= cena_wywolawcza),
    CONSTRAINT check_daty CHECK (data_zakonczenia > data_rozpoczecia)
);

CREATE TABLE Licytacje_Log (
    id SERIAL PRIMARY KEY,
    id_aukcji INTEGER REFERENCES Aukcje(id) ON DELETE CASCADE,
    id_licytanta INTEGER REFERENCES Uzytkownicy(id) ON DELETE RESTRICT,
    kwota_oferowana NUMERIC(12, 2) NOT NULL,
    data_zlozenia TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status_weryfikacji BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_aukcje_status ON Aukcje(status);
CREATE INDEX idx_licytacje_aukcja_kwota ON Licytacje_Log(id_aukcji, kwota_oferowana DESC);