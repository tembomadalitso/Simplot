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

// Unified login status and UI management
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('auth_token');
    const authBtn = document.getElementById('authBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (token && authBtn && navLinks) {
        // 1. Update the Login button to Dashboard
        authBtn.textContent = 'Dashboard';
        authBtn.href = '/dashboard/';
        authBtn.classList.replace('bg-indigo-600', 'bg-emerald-600');

        // 2. Create and Add the Logout Link if it doesn't exist
        if (!document.getElementById('manualLogout')) {
            const logoutLink = document.createElement('a');
            logoutLink.id = 'manualLogout';
            logoutLink.href = '#';
            logoutLink.textContent = 'Logout';
            logoutLink.className = 'text-sm font-semibold text-red-500 ml-4';
            
            // Attach the click event
            logoutLink.onclick = (e) => {
                e.preventDefault();
                if (typeof handleLogout === "function") {
                    handleLogout();
                } else {
                    console.error("Logout function not loaded yet.");
                }
            };
            navLinks.appendChild(logoutLink);
        }
    }
});