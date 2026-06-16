const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyAdmin } = require('../middleware/auth');

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

router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { id_dzialki, imie_nazwisko_najemcy, email_najemcy, numer_umowy, url, data_rozpoczecia, data_zakonczenia, wartosc_czynszu } = req.body;

        if (new Date(data_zakonczenia) <= new Date(data_rozpoczecia)) {
            return res.status(400).json({ error: 'Data zakończenia musi być późniejsza niż data rozpoczęcia!' });
        }

        const query = `
            INSERT INTO Umowy (id_dzialki, imie_nazwisko_najemcy, email_najemcy, numer_umowy, url, data_rozpoczecia, data_zakonczenia, wartosc_czynszu)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
        `;
        const values = [id_dzialki, imie_nazwisko_najemcy, email_najemcy || null, numer_umowy, url || null, data_rozpoczecia, data_zakonczenia, wartosc_czynszu];
        
        const result = await pool.query(query, values);
        res.status(201).json({ wiadomosc: 'Umowa wygenerowana pomyślnie!', umowa: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd serwera. Sprawdź, czy przesłane dane i ID działki są poprawne.' });
    }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM Umowy WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Nie znaleziono umowy o podanym ID.' });
        }
        res.status(200).json({ success: true, wiadomosc: 'Umowa została pomyślnie usunięta.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd podczas usuwania umowy z bazy danych.' });
    }
});

router.patch('/:id/podpisz', verifyAdmin, async (req, res) => {
    try {
        const { czyPodpisana } = req.body;
        const result = await pool.query('UPDATE Umowy SET czy_podpisana = $1 WHERE id = $2 RETURNING *', [czyPodpisana, req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Nie znaleziono umowy.' });
        }
        res.status(200).json({ success: true, umowa: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd podczas zmiany statusu podpisu.' });
    }
});

module.exports = router;