const express = require('express');
const router = express.Router();
const pool = require('../db'); // Używamy centralnego połączenia od Oliwii

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
            LEFT JOIN Aukcje a ON n.ID = a.id_wlasciciela; -- Zakładając relację połączenia (dostosuj warunek ON pod Wasz klucz obcy, jeśli a.id_dzialki istnieje)
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania danych z katastru.' });
    }
});

// ENDPOINT: DODAWANIE NOWEJ DZIAŁKI (POST /api/dzialki)
router.post('/', async (req, res) => {
    try {
        const { geometriaGeoJSON, powierzchnia, status, przeznaczenie,cena } = req.body;

        // Walidacja po stronie serwera
        if (!geometriaGeoJSON || !powierzchnia || !status || !przeznaczenie) {
            return res.status(400).json({ 
                error: 'Błąd walidacji: Brakujące dane. Upewnij się, że narysowano działkę i wypełniono wszystkie pola.' 
            });
        }

        const query = `
            INSERT INTO Nieruchomosci (wspolrzedne, powierzchnia, status, przeznaczenie, cena)
            VALUES (
                ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), 
                $2, 
                $3, 
                $4,
                $5
            )
            RETURNING id;
        `;

        const values = [JSON.stringify(geometriaGeoJSON), powierzchnia, status, przeznaczenie,cena];
        const result = await pool.query(query, values);

        res.status(201).json({ 
            wiadomosc: 'Nieruchomość została pomyślnie dodana!',
            noweId: result.rows[0].id 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Błąd podczas dodawania działki do bazy.' });
    }
});

module.exports = router;