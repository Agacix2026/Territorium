-- 1. ROZSZERZENIE POSTGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. UŻYTKOWNICY
CREATE TABLE Uzytkownicy (
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) UNIQUE NOT NULL,
    haslo_hash VARCHAR(255) NOT NULL,
    rola VARCHAR(50) DEFAULT 'Mieszkaniec'
);

INSERT INTO Uzytkownicy (login, haslo_hash, rola)
VALUES ('admin@urzad.pl', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Admin')
ON CONFLICT (login) DO UPDATE SET rola = 'Admin';

-- 3. NIERUCHOMOŚCI
CREATE TABLE Nieruchomosci (
    ID SERIAL PRIMARY KEY,
    nazwa VARCHAR(255) DEFAULT 'Działka bez nazwy',
    wspolrzedne GEOMETRY(Polygon, 4326) NOT NULL,
    powierzchnia NUMERIC NOT NULL,
    status VARCHAR(50) NOT NULL,
    przeznaczenie VARCHAR(100) NOT NULL,
    cena NUMERIC(15, 2) DEFAULT 0.00
);

-- 4. UMOWY (ZMIANA: ZAMIAST ID NAJEMCY JEST IMIE/NAZWISKO I EMAIL)
CREATE TABLE Umowy (
    id SERIAL PRIMARY KEY,
    id_dzialki INTEGER NOT NULL REFERENCES Nieruchomosci(ID) ON DELETE CASCADE,
    imie_nazwisko_najemcy VARCHAR(255) NOT NULL,
    email_najemcy VARCHAR(255),
    numer_umowy VARCHAR(100) UNIQUE NOT NULL,
    url VARCHAR(2048),
    czy_podpisana BOOLEAN DEFAULT FALSE,
    data_rozpoczecia DATE NOT NULL,
    data_zakonczenia DATE NOT NULL,
    wartosc_czynszu NUMERIC(12, 2) NOT NULL CHECK (wartosc_czynszu >= 0),
    status VARCHAR(50) DEFAULT 'Aktywna' CHECK (status IN ('Aktywna', 'Zakończona', 'Anulowana')),
    utworzono TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_daty_chronologia CHECK (data_zakonczenia > data_rozpoczecia)
);

-- 5. DOKUMENTY
CREATE TABLE dokumenty (
    id SERIAL PRIMARY KEY,
    nazwa VARCHAR(255) NOT NULL,
    opis TEXT,
    url VARCHAR(2048) NOT NULL,
    typ_pliku VARCHAR(50) DEFAULT 'PDF',
    obiekt_id INTEGER NOT NULL,
    obiekt_typ VARCHAR(100) NOT NULL,
    data_dodania TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. AUKCJE
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
    status VARCHAR(50) DEFAULT 'aktywna',
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

-- 7. WNIOSKI WADIUM
CREATE TABLE Wnioski_Wadium (
    id SERIAL PRIMARY KEY,
    id_uzytkownika INTEGER REFERENCES Uzytkownicy(id) ON DELETE CASCADE,
    id_aukcji INTEGER REFERENCES Aukcje(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Oczekuje',
    data_zgloszenia TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);