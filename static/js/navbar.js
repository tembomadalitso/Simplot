document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    const authBtn = document.getElementById('authBtn');
    const adminLink = document.getElementById('adminLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfileBadge = document.getElementById('userProfileBadge');
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRoleBadge');
    const userInitialsEl = document.getElementById('userInitials');

    // Check if user is logged in
    if (token && authBtn) {
        // Show logout button immediately
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

        try {
            const response = await fetch(window.URLS.authMe, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();

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
                            'OFFICIAL': { text: 'Gov Official', class: 'bg-emerald-100 text-emerald-700' }
                        };
                        const roleData = roles[userData.user_type] || { text: 'User', class: 'bg-slate-100 text-slate-700' };
                        userRoleEl.textContent = roleData.text;
                        userRoleEl.className = `text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded mt-0.5 inline-block w-max ${roleData.class}`;
                    }
                }

                // Update Auth button based strictly on role
                if (userData.user_type === 'OFFICIAL') {
                    authBtn.innerHTML = '<i class="fas fa-columns"></i> Gov Portal';
                    authBtn.href = window.URLS.govDashboard;
                    authBtn.className = "bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5 flex items-center gap-2";

                    if (adminLink) {
                        adminLink.href = window.URLS.govDashboard;
                        adminLink.textContent = "Official Portal";
                        adminLink.classList.remove('hidden');
                    }
                } else if (userData.user_type === 'LANDLORD') {
                    authBtn.innerHTML = '<i class="fas fa-columns"></i> Dashboard';
                    authBtn.href = window.URLS.dashboard;
                    authBtn.className = "bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 flex items-center gap-2";

                    if (adminLink) {
                        adminLink.href = window.URLS.dashboard;
                        adminLink.textContent = "My Dashboard";
                        adminLink.classList.remove('hidden');
                    }
                } else {
                    // Tenant: hide dashboard button and admin link
                    authBtn.classList.add('hidden');
                    if (adminLink) adminLink.classList.add('hidden');
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