const API_BASE_URL = 'http://localhost:3100/api';

const API = {
    async request(endpoint, method = 'GET', data = null) {
        const options = { method: method, headers: { 'Content-Type': 'application/json' } };
        
        const token = localStorage.getItem('jwt_token');

        if (token && !endpoint.includes('/login') && !endpoint.includes('/register')) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (data) options.body = JSON.stringify(data);
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Błąd serwera: ${response.status}`);
            return result;
        } catch (error) {
            console.error(`[API Error] ${method} ${endpoint}:`, error);
            throw error;
        }
    }
};
