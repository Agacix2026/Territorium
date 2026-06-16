require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const connectWithRetry = () => {
    pool.connect()
        .then(() => console.log('✅ Połączono z bazą PostgreSQL!'))
        .catch(err => {
            console.error('❌ Baza nie jest jeszcze gotowa, ponawiam próbę za 3 sekundy...', err.message);
            setTimeout(connectWithRetry, 3000);
        });
};

connectWithRetry();

module.exports = pool;