const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. POBIERANIE DANYCH O AUKCJI
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
  
// 2. SKŁADANIE OFERTY LICYTACJI (z walidacją ról i transakcjami Weroniki)
router.post('/:id/bid', async (req, res) => {
    try {
        const auctionId = req.params.id;
        const { id_licytanta, kwota_oferowana } = req.body;
  
        // Sprawdzenie roli w tabeli Uzytkownicy
        const userCheck = await pool.query('SELECT rola FROM Uzytkownicy WHERE id = $1', [id_licytanta]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Użytkownik nie istnieje.' });
        }
        if (userCheck.rows[0].rola !== 'Licytant') {
            return res.status(403).json({ success: false, message: 'Nie posiadasz statusu Licytanta.' });
        }
  
        // Sprawdzenie ceny aukcji
        const auctionCheck = await pool.query('SELECT aktualna_cena, status FROM Aukcje WHERE id = $1', [auctionId]);
        if (auctionCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Aukcja nie istnieje.' });
        }
  
        const currentPrice = parseFloat(auctionCheck.rows[0].aktualna_cena);
        const userBid = parseFloat(kwota_oferowana);
  
        if (isNaN(userBid) || userBid <= currentPrice) {
            return res.status(400).json({ success: false, message: `Oferta musi być wyższa niż ${currentPrice} PLN.` });
        }
  
        // --- Transakcja SQL Weroniki ---
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
        console.error('Błąd transakcji:', error);
        return res.status(500).json({ success: false, message: 'Błąd przetwarzania transakcji.' });
    }
});

module.exports = router;