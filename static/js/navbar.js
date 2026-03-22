document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    const authBtn = document.getElementById('authBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfileBadge = document.getElementById('userProfileBadge');
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRoleBadge');
    const userInitialsEl = document.getElementById('userInitials');

    // Check if user is logged in
    if (token) {
        try {
            const response = await fetch(window.URLS.authMe, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();

                // Show logout button
                if (logoutBtn) {
                    logoutBtn.classList.remove('hidden');
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

                if (userProfileBadge) {
                    userProfileBadge.classList.remove('hidden');
                    userProfileBadge.classList.add('flex');

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
                            'TENANT': { text: 'Tenant', class: 'bg-blue-100 text-blue-700' },
                            'LANDLORD': { text: 'Landlord', class: 'bg-amber-100 text-amber-700' },
                            'ZRA': { text: 'ZRA Official', class: 'bg-emerald-100 text-emerald-700' },
                            'MINISTRY': { text: 'Ministry Official', class: 'bg-indigo-100 text-indigo-700' }
                        };
                        const roleData = roles[userData.user_type] || { text: 'User', class: 'bg-slate-100 text-slate-700' };
                        userRoleEl.textContent = roleData.text;
                        userRoleEl.className = `text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded mt-0.5 inline-block w-max ${roleData.class}`;
                    }
                }

                // Hide login button if logged in
                if (authBtn) authBtn.classList.add('hidden');

                // Role-based dashboard button logic
                if (dashboardBtn) {
                    const dashboardConfigs = {
                        'LANDLORD': {
                            label: 'My Dashboard',
                            url: window.URLS.dashboard,
                            icon: 'fa-columns',
                            class: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                        },
                        'ZRA': {
                            label: 'ZRA Portal',
                            url: window.URLS.zraDashboard,
                            icon: 'fa-file-invoice-dollar',
                            class: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                        },
                        'MINISTRY': {
                            label: 'Ministry Portal',
                            url: window.URLS.occupancyDashboard,
                            icon: 'fa-users',
                            class: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                        }
                    };

                    const config = dashboardConfigs[userData.user_type];
                    if (config) {
                        dashboardBtn.href = config.url;
                        dashboardBtn.className = `flex px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all hover:-translate-y-0.5 items-center gap-2 ${config.class}`;
                        
                        dashboardBtn.textContent = ''; // Clear previous content
                        const icon = document.createElement('i');
                        icon.className = `fas ${config.icon}`;
                        dashboardBtn.appendChild(icon);
                        dashboardBtn.appendChild(document.createTextNode(config.label));
                    } else {
                        dashboardBtn.classList.add('hidden');
                    }
                }
            } else {
                localStorage.removeItem('auth_token');
                window.location.reload();
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }
});