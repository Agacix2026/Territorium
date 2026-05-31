const express = require('express');
const router = express.Router();
const pool = require('../db'); // Dostęp do centralnej bazy danych
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Sekret do tokenów JWT (najlepiej trzymać go w pliku .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super-tajny-klucz-territorium';

// Funkcja pomocnicza do hashowania haseł (Zgodnie z wymogiem SHA256)
function hashPasswordSHA256(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// --- ENDPOINT REJESTRACJI ---
router.post('/register', async (req, res) => {
    const { login, haslo, czyObywatelRP, rola } = req.body;

    // 1. Walidacja obywatelstwa po stronie serwera
    if (!czyObywatelRP) {
        return res.status(403).json({ error: 'Rejestracja jest możliwa wyłącznie dla obywateli polskich.' });
    }

    if (!login || !haslo) {
        return res.status(400).json({ error: 'Login i hasło są wymagane.' });
    }

    try {
        // 2. Sprawdzenie, czy użytkownik już istnieje
        const userExists = await pool.query('SELECT id FROM Uzytkownicy WHERE login = $1', [login]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ error: 'Użytkownik o podanym adresie email już istnieje.' });
        }

        // 3. Hashowanie hasła algorytmem SHA256
        const hasloHash = hashPasswordSHA256(haslo);
        
        // Domyślna rola to Mieszkaniec, chyba że podano inaczej
        const r = rola || 'Mieszkaniec';

        // 4. Zapis do bazy danych
        const newUser = await pool.query(
            'INSERT INTO Uzytkownicy (login, haslo_hash, rola) VALUES ($1, $2, $3) RETURNING id, login, rola',
            [login, hasloHash, r]
        );

        res.status(201).json({ 
            message: 'Konto zostało utworzone pomyślnie!', 
            user: newUser.rows[0] 
        });

    } catch (error) {
        console.error('Błąd podczas rejestracji:', error);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
    }
});

// --- ENDPOINT LOGOWANIA ---
router.post('/login', async (req, res) => {
    const { login, haslo } = req.body;

    if (!login || !haslo) {
        return res.status(400).json({ error: 'Login i hasło są wymagane.' });
    }

    try {
        // 1. Pobranie użytkownika z bazy
        const userResult = await pool.query('SELECT * FROM Uzytkownicy WHERE login = $1', [login]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Nieprawidłowy login lub hasło.' });
        }

        // 2. Weryfikacja hasła (SHA256)
        const hasloHash = hashPasswordSHA256(haslo);
        if (hasloHash !== user.haslo_hash) {
            return res.status(401).json({ error: 'Nieprawidłowy login lub hasło.' });
        }

        // 3. Generowanie tokena (ochrona punktów końcowych)
        const token = jwt.sign(
            { id: user.id, rola: user.rola }, 
            JWT_SECRET, 
            { expiresIn: '2h' }
        );

        res.status(200).json({ 
            message: 'Zalogowano pomyślnie', 
            token: token,
            user: { id: user.id, login: user.login, rola: user.rola }
        });

    } catch (error) {
        console.error('Błąd podczas logowania:', error);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
    }
});

router.patch('/:id/rola', async (req, res) => {
    try {
        const { nowaRola } = req.body;
        const targetUserId = req.params.id;
        
        // Tutaj docelowo w Tygodniu 7 dodasz weryfikację tokena Admina
        await pool.query('UPDATE Uzytkownicy SET rola = $1 WHERE id = $2', [nowaRola, targetUserId]);
        
        res.status(200).json({ message: `Rola użytkownika ${targetUserId} została zmieniona na ${nowaRola}.` });
    } catch (error) {
        res.status(500).json({ error: 'Błąd podczas zmiany roli.' });
    }
});

module.exports = router;