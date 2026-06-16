require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uzytkownicyRoutes = require('./routes/uzytkownicy');
const dzialkiRoutes = require('./routes/dzialki');
const umowyRoutes = require('./routes/umowy');
const dokumentyRoutes = require('./routes/dokumenty');
const aukcjeRoutes = require('./routes/aukcje');

app.use('/api/uzytkownicy', uzytkownicyRoutes);
app.use('/api/dzialki', dzialkiRoutes);
app.use('/api/umowy', umowyRoutes);
app.use('/api/dokumenty', dokumentyRoutes);
app.use('/api/aukcje', aukcjeRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`🚀 Serwer uruchomiony na porcie ${PORT}`);
});