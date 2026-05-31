// Zmienione z localhost:3100 na adres serwera i port 8303
const API_BASE_URL = 'http://149.156.194.192:8303/api';
const API = {
   async request(endpoint, method = 'GET', data = null) {
        const options = { method: method, headers: { 'Content-Type': 'application/json' } };
        
        // --- ZADANIE OLIWII: AUTOMATYCZNA AUTORYZACJA ---
        // Wyciągamy token z pamięci przeglądarki (zapisany wcześniej podczas logowania)
        const token = localStorage.getItem('token');

        // Automatyczne doklejanie nagłówka autoryzacji (z pominięciem logowania i rejestracji)
        if (token && !endpoint.includes('/login') && !endpoint.includes('/register')) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        // -------------------------------------------------

        if (data) options.body = JSON.stringify(data);
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`[API Error] ${method} ${endpoint}:`, error);
            throw error;
        }
    }
};