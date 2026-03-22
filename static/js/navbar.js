document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    const authBtn = document.getElementById('authBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfileBadge = document.getElementById('userProfileBadge');
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRoleBadge');
    const userInitialsEl = document.getElementById('userInitials');

    if (!token) return; // Not logged in — leave defaults (Login visible, dashboard hidden)

    try {
        const response = await fetch(window.URLS.authMe, {
            headers: { 'Authorization': `Token ${token}` }
        });

        if (!response.ok) {
            // Token invalid — clear and reload
            localStorage.removeItem('auth_token');
            window.location.reload();
            return;
        }

        const userData = await response.json();

        // --- Hide Login, Show Logout ---
        if (authBtn) authBtn.style.display = 'none';
        if (logoutBtn) {
            logoutBtn.style.display = 'flex';
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (typeof handleLogout === "function") {
                    await handleLogout();
                } else {
                    localStorage.removeItem('auth_token');
                    window.location.href = window.URLS.login;
                }
            });
        }

        // --- Profile Badge ---
        if (userProfileBadge) {
            userProfileBadge.style.display = 'flex';

            const fullName = userData.full_name || userData.username;
            if (userNameEl) userNameEl.textContent = fullName;

            if (userInitialsEl) {
                let initials = 'U';
                if (fullName && fullName.trim().length > 0) {
                    const nameParts = fullName.trim().split(' ');
                    initials = nameParts.length > 1
                        ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
                        : nameParts[0].substring(0, 2);
                } else if (userData.username) {
                    initials = userData.username.substring(0, 2);
                }
                userInitialsEl.textContent = initials.toUpperCase();
            }

            if (userRoleEl) {
                const roles = {
                    'TENANT':   { text: 'Tenant',            cls: 'bg-blue-100 text-blue-700' },
                    'LANDLORD': { text: 'Landlord',          cls: 'bg-amber-100 text-amber-700' },
                    'ZRA':      { text: 'ZRA Official',      cls: 'bg-emerald-100 text-emerald-700' },
                    'MINISTRY': { text: 'Ministry Official', cls: 'bg-indigo-100 text-indigo-700' },
                };
                const roleData = roles[userData.user_type] || { text: 'User', cls: 'bg-slate-100 text-slate-700' };
                userRoleEl.textContent = roleData.text;
                userRoleEl.className = `text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded mt-0.5 inline-block w-max ${roleData.cls}`;
            }
        }

        // --- Dashboard Button ---
        // Use style.display directly to avoid any Tailwind class conflicts
        if (dashboardBtn) {
            const configs = {
                'LANDLORD': {
                    label: 'My Dashboard',
                    url: window.URLS.dashboard,
                    icon: 'fa-columns',
                    bg: '#f59e0b',       // amber-500
                    bgHover: '#d97706',  // amber-600
                },
                'ZRA': {
                    label: 'ZRA Portal',
                    url: window.URLS.zraDashboard,
                    icon: 'fa-file-invoice-dollar',
                    bg: '#10b981',       // emerald-500
                    bgHover: '#059669',  // emerald-600
                },
                'MINISTRY': {
                    label: 'Ministry Portal',
                    url: window.URLS.occupancyDashboard,
                    icon: 'fa-users',
                    bg: '#4f46e5',       // indigo-600
                    bgHover: '#4338ca',  // indigo-700
                },
            };

            const config = configs[userData.user_type];

            if (config) {
                // Set href
                dashboardBtn.href = config.url;

                // Set content
                dashboardBtn.textContent = '';
                const ico = document.createElement('i');
                ico.className = `fas ${config.icon}`;
                dashboardBtn.appendChild(ico);
                dashboardBtn.appendChild(document.createTextNode(' ' + config.label));

                // Apply styles directly — bypasses any Tailwind hidden/display issues
                dashboardBtn.style.display = 'flex';
                dashboardBtn.style.alignItems = 'center';
                dashboardBtn.style.gap = '8px';
                dashboardBtn.style.padding = '10px 20px';
                dashboardBtn.style.borderRadius = '12px';
                dashboardBtn.style.fontSize = '14px';
                dashboardBtn.style.fontWeight = '600';
                dashboardBtn.style.color = 'white';
                dashboardBtn.style.backgroundColor = config.bg;
                dashboardBtn.style.textDecoration = 'none';
                dashboardBtn.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                dashboardBtn.style.transition = 'all 0.2s';

                dashboardBtn.addEventListener('mouseenter', () => {
                    dashboardBtn.style.backgroundColor = config.bgHover;
                    dashboardBtn.style.transform = 'translateY(-2px)';
                });
                dashboardBtn.addEventListener('mouseleave', () => {
                    dashboardBtn.style.backgroundColor = config.bg;
                    dashboardBtn.style.transform = 'translateY(0)';
                });

            } else {
                // TENANT or unknown: keep hidden
                dashboardBtn.style.display = 'none';
            }
        }

    } catch (error) {
        console.error("Navbar auth error:", error);
    }
});