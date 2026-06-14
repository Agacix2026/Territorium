const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyAdmin } = require('../middleware/auth'); // Pobranie middleware zabezpieczającego

// =========================================================================
// 1. ŚCIEŻKI STATYCZNE URZĘDNIKA (Muszą być ZAWSZE ZDEFINIOWANE PRZED /:id)
// =========================================================================

// POBIERANIE WNIOSKÓW O WADIUM (Tylko Admin)
router.get('/wnioski/wadium', verifyAdmin, async (req, res) => {
    try {
        const query = `
            SELECT w.id as wniosek_id, w.status, u.id as user_id, u.login, a.id as aukcja_id, a.tytul
            FROM Wnioski_Wadium w
            JOIN Uzytkownicy u ON w.id_uzytkownika = u.id
            JOIN Aukcje a ON w.id_aukcji = a.id
            WHERE w.status = 'Oczekuje'
        `;
        const result = await pool.query(query);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd bazy danych (wnioski):', error);
        return res.status(500).json({ error: 'Błąd pobierania wniosków' });
    }
});

// ZATWIERDZANIE WNIOSKU (Tylko Admin)
router.patch('/wnioski/:id/zatwierdz', verifyAdmin, async (req, res) => {
    try {
        const wniosekId = req.params.id;
        await pool.query('UPDATE Wnioski_Wadium SET status = $1 WHERE id = $2', ['Zatwierdzone', wniosekId]);
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'Błąd aktualizacji wniosku' });
    }
});


// =========================================================================
// 2. ŚCIEŻKI DYNAMICZNE (Zmienne /:id podawane w adresie)
// =========================================================================

// POBIERANIE DANYCH O AUKCJI (Publiczne)
router.get('/:id', async (req, res) => {
    try {
        const auctionId = req.params.id;
        const auctionQuery = await pool.query('SELECT * FROM Aukcje WHERE id = $1', [auctionId]);
        if (auctionQuery.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Nie znaleziono podanej aukcji.' });
        }
        return res.status(200).json({ success: true, data: auctionQuery.rows[0] });
    } catch (error) {
        console.error('Błąd pobierania aukcji:', error);
        return res.status(500).json({ success: false, message: 'Błąd serwera.' });
    }
});

// WYSYŁANIE WNIOSKU O WADIUM (Przez Użytkownika)
router.post('/:id/zglos-wadium', async (req, res) => {
    try {
        const { id_uzytkownika } = req.body;
        const id_aukcji = req.params.id;

        const check = await pool.query('SELECT * FROM Wnioski_Wadium WHERE id_uzytkownika = $1 AND id_aukcji = $2', [id_uzytkownika, id_aukcji]);
        if (check.rows.length > 0) {
            await pool.query('UPDATE Wnioski_Wadium SET status = $1 WHERE id = $2', ['Oczekuje', check.rows[0].id]);
            return res.status(200).json({ success: true });
        }

        await pool.query(
            'INSERT INTO Wnioski_Wadium (id_uzytkownika, id_aukcji, status) VALUES ($1, $2, $3)',
            [id_uzytkownika, id_aukcji, 'Oczekuje']
        );
        return res.status(201).json({ success: true });
    } catch (error) {
        console.error('Błąd zapisu wadium:', error);
        return res.status(500).json({ error: 'Błąd zapisywania wniosku' });
    }
});

// SKŁADANIE OFERTY LICYTACJI (Po uzyskaniu roli Licytanta)
router.post('/:id/bid', async (req, res) => {
    try {
        const auctionId = req.params.id;
        const { id_licytanta, kwota_oferowana } = req.body;

        const userCheck = await pool.query('SELECT rola FROM Uzytkownicy WHERE id = $1', [id_licytanta]);
        if (userCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Użytkownik nie istnieje.' });
        if (userCheck.rows[0].rola !== 'Licytant') return res.status(403).json({ success: false, message: 'Nie posiadasz statusu Licytanta.' });

        const auctionCheck = await pool.query('SELECT aktualna_cena, status FROM Aukcje WHERE id = $1', [auctionId]);
        if (auctionCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Aukcja nie istnieje.' });

        const currentPrice = parseFloat(auctionCheck.rows[0].aktualna_cena);
        const userBid = parseFloat(kwota_oferowana);

        if (isNaN(userBid) || userBid <= currentPrice) {
            return res.status(400).json({ success: false, message: `Oferta musi być wyższa niż ${currentPrice} PLN.` });
        }

        await pool.query('BEGIN');
        await pool.query('UPDATE Aukcje SET aktualna_cena = $1 WHERE id = $2', [userBid, auctionId]);
        const logInsertion = await pool.query(
            'INSERT INTO Licytacje_Log (id_aukcji, id_licytanta, kwota_oferowana) VALUES ($1, $2, $3) RETURNING *',
            [auctionId, id_licytanta, userBid]
        );
        await pool.query('COMMIT');
        return res.status(201).json({ success: true, message: 'Oferta zapisana!', data: logInsertion.rows[0] });
    } catch (error) {
        await pool.query('ROLLBACK').catch(() => {});
        return res.status(500).json({ success: false, message: 'Błąd przetwarzania transakcji.' });
    }
});

module.exports = router;