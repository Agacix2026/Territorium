const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM dokumenty ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd pobierania dokumentów' });
    }
});

router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { nazwa, url, typ_pliku, obiekt_id, obiekt_typ } = req.body;
        if (!nazwa || !url || !obiekt_id || !obiekt_typ) {
            return res.status(400).json({ error: 'Brak wymaganych danych (w tym URL)' });
        }
        const result = await pool.query(
            `INSERT INTO dokumenty (nazwa, url, typ_pliku, obiekt_id, obiekt_typ)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nazwa, url, typ_pliku || 'PDF', obiekt_id, obiekt_typ]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd dodawania dokumentu' });
    }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const docId = req.params.id;
        const result = await pool.query('DELETE FROM dokumenty WHERE id = $1 RETURNING id', [docId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Nie znaleziono dokumentu.' });
        }
        res.status(200).json({ success: true, message: 'Dokument został usunięty.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Błąd podczas usuwania dokumentu.' });
    }
});

module.exports = router;