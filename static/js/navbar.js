// Navigation & Auth Logic
document.addEventListener('DOMContentLoaded', () => {
    // Shared navbar logic
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Theme icon update logic is already in main.js
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    await fetch(window.URLS.authLogout, {
                        method: 'POST',
                        headers: { 'Authorization': `Token ${token}` }
                    });
                } catch (e) {}
            }
            localStorage.removeItem('auth_token');
            window.location.href = window.URLS.login;
        });
    }

    // Handle active state in sidebar
    const currentPath = window.location.pathname;
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href !== '#' && (currentPath === href || (href !== '/' && currentPath.startsWith(href)))) {
            item.classList.add('active');
        }
    });
});
