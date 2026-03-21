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

// Utility to safely escape HTML strings and prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Utility to create elements safely without innerHTML
function ce(tag, classes = '', content = '', attributes = {}) {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    if (content) el.textContent = content;
    Object.keys(attributes).forEach(key => {
        if (key === 'onclick') {
            el.onclick = attributes[key];
        } else {
            el.setAttribute(key, attributes[key]);
        }
    });
    return el;
}

// Utility to create icons safely
function icon(classes) {
    return ce('i', classes);
}

// Splash Screen Handler
document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        // Hide after a short delay to allow fonts/assets to load
        setTimeout(() => {
            splash.style.opacity = '0';
            splash.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500); // Wait for fade-out to complete
        }, 1200); // Show splash for 1.2 seconds
    }
});
