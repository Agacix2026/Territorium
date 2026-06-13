const express = require('express');
const router = express.Router();
const pool = require('../db');

// ENDPOINT: POBIERANIE DZIAŁEK (GET)
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                n.ID, 
                n.powierzchnia, 
                n.status, 
                n.przeznaczenie, 
                n.cena,
                ST_AsGeoJSON(n.wspolrzedne)::json AS wspolrzedne 
            FROM Nieruchomosci n
            LEFT JOIN Aukcje a ON n.ID = a.id_nieruchomosci;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania danych.' });
    }
});

// ENDPOINT: DODAWANIE NOWEJ DZIAŁKI (POST)
router.post('/', async (req, res) => {
    try {
        const { geometriaGeoJSON, powierzchnia, status, przeznaczenie, cena } = req.body;
        if (!geometriaGeoJSON || !powierzchnia || !status || !przeznaczenie) {
            return res.status(400).json({ error: 'Błąd walidacji: Brakujące dane.' });
        }

        const query = `
            INSERT INTO Nieruchomosci (wspolrzedne, powierzchnia, status, przeznaczenie, cena)
            VALUES (ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), $2, $3, $4, $5)
            RETURNING id;
        `;
        const values = [JSON.stringify(geometriaGeoJSON), powierzchnia, status, przeznaczenie, cena || 0];
        const result = await pool.query(query, values);

        res.status(201).json({ wiadomosc: 'Nieruchomość dodana!', noweId: result.rows[0].id });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Błąd podczas dodawania działki.' });
    }
});

// ENDPOINT: USUWANIE DZIAŁKI (DELETE)
router.delete('/:id', async (req, res) => {
    try {
        const idDzialki = req.params.id;
        const query = 'DELETE FROM Nieruchomosci WHERE ID = $1 RETURNING id;';
        const result = await pool.query(query, [idDzialki]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Nie znaleziono działki.' });
        }
        res.status(200).json({ wiadomosc: `Działka #${idDzialki} została usunięta.` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Wystąpił błąd usuwania.' });
    }
});

module.exports = router;