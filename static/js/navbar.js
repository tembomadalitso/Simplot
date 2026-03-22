document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    const authBtn = document.getElementById('authBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfileBadge = document.getElementById('userProfileBadge');
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRoleBadge');
    const userInitialsEl = document.getElementById('userInitials');

    if (!token) return;

    try {
        const response = await fetch(window.URLS.authMe, {
            headers: { 'Authorization': `Token ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem('auth_token');
            window.location.reload();
            return;
        }

        const userData = await response.json();

        // ── Hide login, show logout ──
        if (authBtn) authBtn.style.display = 'none';

        if (logoutBtn) {
            // Use style.display — overrides any inline style or class
            logoutBtn.style.display = 'inline-flex';
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof handleLogout === 'function') {
                    handleLogout();
                } else {
                    localStorage.removeItem('auth_token');
                    document.cookie = 'auth_token=; path=/; max-age=0';
                    window.location.href = window.URLS.login;
                }
            });
        }

        // ── Profile badge ──
        if (userProfileBadge) {
            userProfileBadge.style.display = 'flex';
            userProfileBadge.style.alignItems = 'center';

            const fullName = userData.full_name || userData.username;
            if (userNameEl) userNameEl.textContent = fullName;

            if (userInitialsEl) {
                let initials = 'U';
                if (fullName && fullName.trim().length > 0) {
                    const parts = fullName.trim().split(' ');
                    initials = parts.length > 1
                        ? parts[0][0] + parts[parts.length - 1][0]
                        : parts[0].substring(0, 2);
                }
                userInitialsEl.textContent = initials.toUpperCase();
            }

            if (userRoleEl) {
                const roleLabels = {
                    'TENANT':   'Property Seeker',
                    'LANDLORD': 'Property Owner',
                    'ZRA':      'ZRA Official',
                    'MINISTRY': 'Ministry Official',
                };
                userRoleEl.textContent = roleLabels[userData.user_type] || 'User';
            }
        }

        // ── Dashboard button ──
        if (dashboardBtn) {
            const configs = {
                'LANDLORD': {
                    label: 'My Dashboard',
                    url: window.URLS.dashboard,
                    icon: 'fa-columns',
                    bg: '#f59e0b',
                    bgHover: '#d97706',
                },
                'ZRA': {
                    label: 'ZRA Portal',
                    url: window.URLS.zraDashboard,
                    icon: 'fa-file-invoice-dollar',
                    bg: '#10b981',
                    bgHover: '#059669',
                },
                'MINISTRY': {
                    label: 'Ministry Portal',
                    url: window.URLS.occupancyDashboard,
                    icon: 'fa-users',
                    bg: '#4f46e5',
                    bgHover: '#4338ca',
                },
            };

            const config = configs[userData.user_type];

            if (config) {
                dashboardBtn.href = config.url;

                // Build content
                dashboardBtn.textContent = '';
                const ico = document.createElement('i');
                ico.className = `fas ${config.icon}`;
                ico.style.fontSize = '12px';
                dashboardBtn.appendChild(ico);
                dashboardBtn.appendChild(document.createTextNode(' ' + config.label));

                // Apply styles directly — no class conflicts
                dashboardBtn.className = 'nav-btn';
                dashboardBtn.style.display = 'flex';
                dashboardBtn.style.background = config.bg;

                dashboardBtn.addEventListener('mouseenter', () => {
                    dashboardBtn.style.background = config.bgHover;
                });
                dashboardBtn.addEventListener('mouseleave', () => {
                    dashboardBtn.style.background = config.bg;
                });

            } else {
                // TENANT — no dashboard button
                dashboardBtn.style.display = 'none';
            }
        }

    } catch (error) {
        console.error("Navbar auth error:", error);
    }
});