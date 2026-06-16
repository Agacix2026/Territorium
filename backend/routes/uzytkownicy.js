const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { verifyAdmin } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'super-tajny-klucz-territorium';

function hashPasswordSHA256(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

router.post('/register', async (req, res) => {
    const { login, haslo, czyObywatelRP, rola } = req.body;
    if (!czyObywatelRP) return res.status(403).json({ error: 'Rejestracja jest możliwa wyłącznie dla obywateli polskich.' });
    if (!login || !haslo) return res.status(400).json({ error: 'Login i hasło są wymagane.' });

    try {
        const userExists = await pool.query('SELECT id FROM Uzytkownicy WHERE login = $1', [login]);
        if (userExists.rows.length > 0) return res.status(409).json({ error: 'Użytkownik już istnieje.' });

        const hasloHash = hashPasswordSHA256(haslo);
        const r = rola || 'Mieszkaniec';
        
        const newUser = await pool.query(
            'INSERT INTO Uzytkownicy (login, haslo_hash, rola) VALUES ($1, $2, $3) RETURNING id, login, rola',
            [login, hasloHash, r]
        );
        res.status(201).json({ message: 'Utworzono konto!', user: newUser.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
    }
});

router.post('/login', async (req, res) => {
    const { login, haslo } = req.body;
    if (!login || !haslo) return res.status(400).json({ error: 'Wymagane dane.' });

    try {
        const userResult = await pool.query('SELECT * FROM Uzytkownicy WHERE login = $1', [login]);
        const user = userResult.rows[0];
        
        if (!user) {
            return res.status(404).json({ error: 'Nie znaleziono użytkownika o podanym adresie e-mail.' });
        }

        const hasloHash = hashPasswordSHA256(haslo);
        
        if (hasloHash !== user.haslo_hash) {
            return res.status(401).json({ error: 'Podano nieprawidłowe hasło.' });
        }
        const token = jwt.sign({ id: user.id, rola: user.rola }, JWT_SECRET, { expiresIn: '2h' });
        res.status(200).json({ message: 'Zalogowano', token, user: { id: user.id, login: user.login, rola: user.rola } });
    } catch (error) {
        res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
    }
});

router.patch('/:id/rola', verifyAdmin, async (req, res) => {
    try {
        const { nowaRola } = req.body;
        const targetUserId = req.params.id;
        await pool.query('UPDATE Uzytkownicy SET rola = $1 WHERE id = $2', [nowaRola, targetUserId]);
        res.status(200).json({ message: `Rola zmieniona na ${nowaRola}.` });
    } catch (error) {
        res.status(500).json({ error: 'Błąd podczas zmiany roli.' });
    }
});

module.exports = router;