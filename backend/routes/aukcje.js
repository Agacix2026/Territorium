const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyAdmin } = require('../middleware/auth');

router.get('/wnioski/wadium', verifyAdmin, async (req, res) => {
    try {
        const query = `
            SELECT w.id as wniosek_id, w.status, u.id as user_id, u.login, a.id as aukcja_id, a.tytul
            FROM Wnioski_Wadium w JOIN Uzytkownicy u ON w.id_uzytkownika = u.id JOIN Aukcje a ON w.id_aukcji = a.id
            WHERE w.status = 'Oczekuje'
        `;
        const result = await pool.query(query);
        return res.status(200).json(result.rows);
    } catch (error) {
        return res.status(500).json({ error: 'Błąd pobierania wniosków' });
    }
});

router.patch('/wnioski/:id/zatwierdz', verifyAdmin, async (req, res) => {
    try {
        await pool.query('UPDATE Wnioski_Wadium SET status = $1 WHERE id = $2', ['Zatwierdzone', req.params.id]);
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'Błąd aktualizacji wniosku' });
    }
});

router.delete('/wnioski/:id', verifyAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM Wnioski_Wadium WHERE id = $1', [req.params.id]);
        return res.status(200).json({ success: true, message: 'Wniosek odrzucony.' });
    } catch (error) {
        return res.status(500).json({ error: 'Błąd odrzucania wniosku' });
    }
});

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

        const userId = req.query.userId || null;
        let query = `
            SELECT a.*, n.nazwa as nazwa_dzialki, n.powierzchnia, n.przeznaczenie,
            (SELECT id_licytanta FROM Licytacje_Log WHERE id_aukcji = a.id ORDER BY kwota_oferowana DESC LIMIT 1) as zwyciezca_id
            FROM Aukcje a JOIN Nieruchomosci n ON a.id_nieruchomosci = n.ID
            WHERE a.status IN ('aktywna', 'zakończona')
            ORDER BY a.status ASC, a.id DESC
        `;
        const result = await pool.query(query);
        let aukcje = result.rows;

        if (userId) {
            const wadiumQuery = await pool.query(`SELECT id_aukcji, status FROM Wnioski_Wadium WHERE id_uzytkownika = $1`, [userId]);
            const wadiumMap = {};
            wadiumQuery.rows.forEach(r => wadiumMap[r.id_aukcji] = r.status);
            aukcje = aukcje.map(a => ({ ...a, wadium_status: wadiumMap[a.id] || 'Brak' }));
        }
        return res.status(200).json({ success: true, data: aukcje });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Błąd pobierania aukcji' });
    }
});

router.post('/:id/zglos-wadium', async (req, res) => {
    try {
        const { id_uzytkownika } = req.body;
        const check = await pool.query('SELECT * FROM Wnioski_Wadium WHERE id_uzytkownika = $1 AND id_aukcji = $2', [id_uzytkownika, req.params.id]);
        if (check.rows.length > 0) {
            await pool.query('UPDATE Wnioski_Wadium SET status = $1 WHERE id = $2', ['Oczekuje', check.rows[0].id]);
        } else {
            await pool.query('INSERT INTO Wnioski_Wadium (id_uzytkownika, id_aukcji, status) VALUES ($1, $2, $3)', [id_uzytkownika, req.params.id, 'Oczekuje']);
        }
        return res.status(201).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'Błąd zapisywania wniosku' });
    }
});

router.post('/:id/bid', async (req, res) => {
    try {
        const auctionId = req.params.id;
        const { id_licytanta, kwota_oferowana } = req.body;

        const wadiumCheck = await pool.query("SELECT id FROM Wnioski_Wadium WHERE id_uzytkownika = $1 AND id_aukcji = $2 AND status = 'Zatwierdzone'", [id_licytanta, auctionId]);
        const userRole = await pool.query('SELECT rola FROM Uzytkownicy WHERE id = $1', [id_licytanta]);

        if (wadiumCheck.rows.length === 0 && userRole.rows[0].rola !== 'Licytant' && userRole.rows[0].rola !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Brak zatwierdzonego wadium dla tej konkretnej aukcji!' });
        }

        const auctionCheck = await pool.query('SELECT aktualna_cena, status, data_zakonczenia FROM Aukcje WHERE id = $1', [auctionId]);
        if (auctionCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Nie znaleziono aukcji.' });

        const aukcjaInfo = auctionCheck.rows[0];
        
        if (aukcjaInfo.status !== 'aktywna' || new Date(aukcjaInfo.data_zakonczenia) <= new Date()) {
            return res.status(400).json({ success: false, message: 'Licytacja została już zakończona. Nie można składać nowych ofert.' });
        }

        const currentPrice = parseFloat(aukcjaInfo.aktualna_cena);
        const userBid = parseFloat(kwota_oferowana);

        if (isNaN(userBid) || userBid <= currentPrice) {
            return res.status(400).json({ success: false, message: `Oferta musi być wyższa niż ${currentPrice} PLN.` });
        }

        await pool.query('BEGIN');
        await pool.query('UPDATE Aukcje SET aktualna_cena = $1 WHERE id = $2', [userBid, auctionId]);
        await pool.query('INSERT INTO Licytacje_Log (id_aukcji, id_licytanta, kwota_oferowana) VALUES ($1, $2, $3)', [auctionId, id_licytanta, userBid]);
        await pool.query('COMMIT');

        return res.status(201).json({ success: true, message: 'Oferta zapisana!' });
    } catch (error) {
        await pool.query('ROLLBACK').catch(() => {});
        return res.status(500).json({ success: false, message: 'Błąd przetwarzania transakcji.' });
    }
});

module.exports = router;