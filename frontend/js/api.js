const API_BASE_URL = 'http://149.156.194.192:8303/api';
const API = {
    async request(endpoint, method = 'GET', data = null) {
        const options = { method: method, headers: { 'Content-Type': 'application/json' } };
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
