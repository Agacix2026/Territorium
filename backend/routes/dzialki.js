const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        await pool.query("UPDATE Aukcje SET status = 'zakończona' WHERE status = 'aktywna' AND data_zakonczenia <= NOW()");
        
        await pool.query(`
            UPDATE Nieruchomosci n 
            SET status = 'Zakończona licytacja' 
            WHERE status = 'Aktywna licytacja' 
            AND EXISTS (SELECT 1 FROM Aukcje a WHERE a.id_nieruchomosci = n.ID AND a.status = 'zakończona')
            AND NOT EXISTS (SELECT 1 FROM Aukcje a WHERE a.id_nieruchomosci = n.ID AND a.status = 'aktywna')
        `);

        const query = `
            SELECT ID, nazwa, powierzchnia, status, przeznaczenie, cena, ST_AsGeoJSON(wspolrzedne)::json AS wspolrzedne 
            FROM Nieruchomosci ORDER BY ID ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd pobierania działek.' });
    }
});

router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { nazwa, geometriaGeoJSON, powierzchnia, status, przeznaczenie, cena } = req.body;
        const query = `
            INSERT INTO Nieruchomosci (nazwa, wspolrzedne, powierzchnia, status, przeznaczenie, cena) 
            VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), $3, $4, $5, $6) RETURNING id;
        `;
        const result = await pool.query(query, [nazwa || 'Nowa Działka', JSON.stringify(geometriaGeoJSON), powierzchnia, status, przeznaczenie, cena || 0]);
        res.status(201).json({ wiadomosc: 'Działka dodana!', noweId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: 'Błąd zapisu: ' + err.message });
    }
});

router.patch('/:id/status', verifyAdmin, async (req, res) => {
    try {
        const idDzialki = req.params.id;
        const nowyStatus = req.body.nowyStatus;
        const dataZakonczenia = req.body.dataZakonczenia;

        await pool.query('UPDATE Nieruchomosci SET status = $1 WHERE ID = $2', [nowyStatus, idDzialki]);

        if (nowyStatus === 'Aktywna licytacja') {
            const checkAukcja = await pool.query("SELECT id FROM Aukcje WHERE id_nieruchomosci = $1 AND status = 'aktywna'", [idDzialki]);
            if (checkAukcja.rows.length === 0) {
                const dzialka = await pool.query('SELECT cena, nazwa FROM Nieruchomosci WHERE ID = $1', [idDzialki]);
                const cena = dzialka.rows[0].cena || 0;
                const nazwa = dzialka.rows[0].nazwa || `Zasób N/${idDzialki}`;

                let dataKoncaQuery = "NOW() + INTERVAL '7 days'";
                let queryParams = [idDzialki, `Aukcja: ${nazwa}`, 'Licytacja nieruchomości z zasobu samorządu.', cena, cena, cena * 0.05];

                if (dataZakonczenia) {
                    dataKoncaQuery = "$7";
                    queryParams.push(dataZakonczenia);
                }

                await pool.query(
                    `INSERT INTO Aukcje (id_nieruchomosci, tytul, opis, cena_wywolawcza, aktualna_cena, kwota_wadium, data_rozpoczecia, data_zakonczenia, status)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW(), ${dataKoncaQuery}, 'aktywna')`,
                    queryParams
                );
            }
        } else {
            // Wycofanie = 'anulowana'. Pousuwa wszystkie wcześniejsze wpisy tej działki z widoku aukcji publicznych!
            await pool.query("UPDATE Aukcje SET status = 'anulowana' WHERE id_nieruchomosci = $1 AND status IN ('aktywna', 'zakończona')", [idDzialki]);
        }

        res.status(200).json({ wiadomosc: 'Status zaktualizowany' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Błąd zmiany statusu.' });
    }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM Nieruchomosci WHERE ID = $1', [req.params.id]);
        res.status(200).json({ wiadomosc: 'Usunięto.' });
    } catch (err) {
        res.status(500).json({ error: 'Błąd usuwania.' });
    }
});

module.exports = router;