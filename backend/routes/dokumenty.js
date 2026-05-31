const express = require('express');
const router = express.Router();
const pool = require('../db'); // Naprawiona ścieżka do globalnej bazy Oliwii

// GET DOCUMENTS
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dokumenty ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd pobierania dokumentów' });
  }
});

// ADD DOCUMENT
router.post('/', async (req, res) => {
  try {
    const { nazwa, typ_pliku, obiekt_id, obiekt_typ } = req.body;

    if (!nazwa || !obiekt_id || !obiekt_typ) {
      return res.status(400).json({ error: 'Brak wymaganych danych' });
    }

    const result = await pool.query(
      `INSERT INTO dokumenty (nazwa, typ_pliku, obiekt_id, obiekt_typ)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nazwa, typ_pliku || 'PDF', obiekt_id, obiekt_typ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Błąd dodawania dokumentu' });
  }
});

module.exports = router;