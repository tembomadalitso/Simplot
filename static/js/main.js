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

// Theme Toggle Handler
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;

    if (!themeToggle || !themeIcon) return;

    // Apply saved theme or default
    const currentTheme = body.getAttribute('data-theme') || 'dark';
    updateThemeUI(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeUI(newTheme);
    });

    function updateThemeUI(theme) {
        if (theme === 'light') {
            themeIcon.className = 'fas fa-sun';
            themeToggle.title = 'Switch to Dark Mode';
        } else {
            themeIcon.className = 'fas fa-moon';
            themeToggle.title = 'Switch to Light Mode';
        }
    }
}

// Splash Screen Handler
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    const splash = document.getElementById('splash-screen');
    if (splash) {
        // Hide after a short delay to allow fonts/assets to load
        setTimeout(() => {
            splash.classList.add('hidden-splash');
            setTimeout(() => {
                splash.style.display = 'none';
            }, 600);
        }, 800);
    }
});
