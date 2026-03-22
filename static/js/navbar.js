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

        if (authBtn) authBtn.style.display = 'none';

        if (logoutBtn) {
            logoutBtn.classList.remove('hidden');
            logoutBtn.classList.add('flex');
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                localStorage.removeItem('auth_token');
                window.location.href = window.URLS.login;
            });
        }

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
                }
                userInitialsEl.textContent = initials.toUpperCase();
            }

            if (userRoleEl) {
                const roleLabels = {
                    'TENANT': 'Property Seeker',
                    'LANDLORD': 'Property Owner',
                    'ZRA': 'ZRA Official',
                    'MINISTRY': 'Ministry Official',
                };
                userRoleEl.textContent = roleLabels[userData.user_type] || 'User';
            }
        }

        if (dashboardBtn) {
            const configs = {
                'LANDLORD': {
                    label: 'Owner Hub',
                    url: window.URLS.dashboard,
                    icon: 'fa-layer-group',
                    cls: 'btn btn-primary btn-sm'
                },
                'ZRA': {
                    label: 'Tax Portal',
                    url: window.URLS.zraDashboard,
                    icon: 'fa-shield-halved',
                    cls: 'btn btn-ghost btn-sm border-slate-200'
                },
                'MINISTRY': {
                    label: 'Occupancy Portal',
                    url: window.URLS.occupancyDashboard,
                    icon: 'fa-building-columns',
                    cls: 'btn btn-ghost btn-sm border-slate-200'
                },
            };

            const config = configs[userData.user_type];

            if (config) {
                dashboardBtn.href = config.url;
                dashboardBtn.className = `hidden sm:flex items-center gap-2 ${config.cls}`;
                dashboardBtn.innerHTML = `<i class="fas ${config.icon} text-[14px]"></i> <span>${config.label}</span>`;
            } else {
                dashboardBtn.style.display = 'none';
            }
        }

    } catch (error) {
        console.error("Navbar auth error:", error);
    }
});