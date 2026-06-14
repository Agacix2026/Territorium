// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-tajny-klucz-territorium';

// Weryfikacja czy użytkownik jest w ogóle zalogowany
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Brak tokena dostępu. Zaloguj się.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Nieprawidłowy lub wygasły token.' });
        req.user = user;
        next();
    });
}

// Weryfikacja czy użytkownik ma uprawnienia Urzędnika (Admin)
function verifyAdmin(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user.rola !== 'Admin') {
            return res.status(403).json({ error: 'Odmowa dostępu. Akcja wymaga uprawnień administratora.' });
        }
        next();
    });
}

module.exports = { verifyToken, verifyAdmin };