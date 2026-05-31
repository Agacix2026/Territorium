const express = require('express');
const router = express.Router();
const pool = require('../db');

// POBIERANIE WSZYSTKICH UMÓW
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM Umowy ORDER BY id DESC;';
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania umów' });
    }
});

// DODAWANIE NOWEJ UMOWY
router.post('/', async (req, res) => {
    try {
        const { id_dzialki, id_najemcy, numer_umowy, data_rozpoczecia, data_zakonczenia, wartosc_czynszu } = req.body;

        if (!id_dzialki || !id_najemcy || !numer_umowy || !data_rozpoczecia || !data_zakonczenia || !wartosc_czynszu) {
            return res.status(400).json({ error: 'Wszystkie pola są wymagane.' });
        }

        // Twarda walidacja logiczna po stronie serwera (Zadanie Ani)
        if (new Date(data_zakonczenia) <= new Date(data_rozpoczecia)) {
            return res.status(400).json({ error: 'Data zakończenia musi być późniejsza niż data rozpoczęcia!' });
        }

        const query = `
            INSERT INTO Umowy (id_dzialki, id_najemcy, numer_umowy, data_rozpoczecia, data_zakonczenia, wartosc_czynszu)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const values = [id_dzialki, id_najemcy, numer_umowy, data_rozpoczecia, data_zakonczenia, wartosc_czynszu];
        
        const result = await pool.query(query, values);
        res.status(201).json({ wiadomosc: 'Umowa wygenerowana pomyślnie!', umowa: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd serwera. Sprawdź, czy ID najemcy i działki istnieją.' });
    }
});

module.exports = router;