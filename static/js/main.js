// Global UI Logic
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSplash();
    initSidebar();
    fetchUserContext(); // Sync user role with sidebar/nav
});

function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;

    if (!themeToggle || !themeIcon) return;

    const applyTheme = (theme) => {
        body.setAttribute('data-theme', theme);
        themeIcon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('theme', theme);
    };

    themeToggle.addEventListener('click', () => {
        const current = body.getAttribute('data-theme');
        applyTheme(current === 'light' ? 'dark' : 'light');
    });
}

function initSplash() {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;
    setTimeout(() => {
        splash.classList.add('hidden-splash');
        setTimeout(() => splash.style.display = 'none', 600);
    }, 1200);
}

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const collapseIcon = document.getElementById('collapseIcon');

    if (!collapseBtn) return;

    // Check saved state
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed) {
        toggleSidebar(true);
    }

    collapseBtn.addEventListener('click', () => {
        const current = sidebar.classList.contains('collapsed');
        toggleSidebar(!current);
    });

    function toggleSidebar(collapsed) {
        if (collapsed) {
            sidebar.classList.add('collapsed');
            mainContent.style.paddingLeft = 'var(--sidebar-collapsed-width)';
            collapseIcon.style.transform = 'rotate(180deg)';
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.style.paddingLeft = 'var(--sidebar-width)';
            collapseIcon.style.transform = 'rotate(0deg)';
        }
        localStorage.setItem('sidebar-collapsed', collapsed);
    }
}

async function fetchUserContext() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        updateGuestUI();
        return;
    }

    try {
        const resp = await fetch(window.URLS.authMe, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (resp.ok) {
            const user = await resp.json();
            updateAuthUI(user);
        } else {
            updateGuestUI();
        }
    } catch (e) {
        updateGuestUI();
    }
}

function updateAuthUI(user) {
    // Top Nav
    document.getElementById('userProfileBadge').style.display = 'flex';
    document.getElementById('authBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'flex';
    document.getElementById('userName').textContent = user.full_name || user.username;
    document.getElementById('userRoleBadge').textContent = user.user_type;
    document.getElementById('userInitials').textContent = (user.full_name || user.username).substring(0, 2).toUpperCase();

    // Sidebar Logic
    const sidebarDashboard = document.getElementById('sidebarDashboardLink');
    const sidebarProps = document.getElementById('sidebarPropertiesLink');
    const sidebarApps = document.getElementById('sidebarApplicationsLink');
    const sidebarFinance = document.getElementById('sidebarFinanceLink');
    const sidebarAnalytics = document.getElementById('sidebarAnalyticsLink');

    sidebarDashboard.style.display = 'flex';

    if (user.user_type === 'LANDLORD') {
        sidebarDashboard.href = window.URLS.dashboard;
        sidebarProps.style.display = 'flex';
        sidebarApps.style.display = 'flex';
        sidebarFinance.style.display = 'flex';
        sidebarAnalytics.style.display = 'flex';
        sidebarAnalytics.href = window.URLS.dashboard + '#analytics-section';
    } else if (user.user_type === 'ZRA') {
        sidebarDashboard.href = window.URLS.zraDashboard;
        sidebarAnalytics.style.display = 'flex';
        sidebarAnalytics.href = window.URLS.zraDashboard + '#analytics-section';
    } else if (user.user_type === 'MINISTRY') {
        sidebarDashboard.href = window.URLS.occupancyDashboard;
        sidebarAnalytics.style.display = 'flex';
        sidebarAnalytics.href = window.URLS.occupancyDashboard + '#analytics-section';
    }
}

function updateGuestUI() {
    document.getElementById('userProfileBadge').style.display = 'none';
    document.getElementById('authBtn').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'none';
}
