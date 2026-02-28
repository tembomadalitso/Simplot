// Global Configuration
const API_BASE = '/api';
const AUTH_BASE = '/auth';

// Helper to get Auth Headers
function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Token ${token}` : ''
    };
}
