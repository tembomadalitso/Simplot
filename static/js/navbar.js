document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    const authBtn = document.getElementById('authBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfileBadge = document.getElementById('userProfileBadge');
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRoleBadge');
    const userInitialsEl = document.getElementById('userInitials');
    const navDashboardLink = document.getElementById('navDashboardLink');

    // Check if user is logged in
    if (token) {
        // Hide login button
        if (authBtn) authBtn.classList.add('hidden');

        // Show dashboard link in main nav and logout button
        if (navDashboardLink) navDashboardLink.classList.remove('hidden');

        if (logoutBtn) {
            logoutBtn.classList.remove('hidden');
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (typeof handleLogout === "function") {
                    await handleLogout();
                } else {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/auth/login/';
                }
            });
        }

        // Fetch User Info
        try {
            const response = await fetch('/auth/users/me/', {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();

                // Show the profile badge
                if (userProfileBadge) {
                    userProfileBadge.classList.remove('hidden');
                    userProfileBadge.classList.add('flex');

                    // Set Name
                    const fullName = userData.full_name || userData.username;
                    if (userNameEl) userNameEl.textContent = fullName;

                    // Set Initials
                    if (userInitialsEl) {
                        let initials = 'U';
                        if (fullName && fullName.trim().length > 0) {
                            const nameParts = fullName.trim().split(' ');
                            if (nameParts.length > 1) {
                                initials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
                            } else {
                                initials = nameParts[0].substring(0, 2);
                            }
                        } else if (userData.username) {
                            initials = userData.username.substring(0, 2);
                        }
                        userInitialsEl.textContent = initials.toUpperCase();
                    }

                    // Set Role Badge
                    if (userRoleEl) {
                        const roles = {
                            'TENANT': { text: 'Tenant/Seeker', class: 'bg-blue-100 text-blue-700' },
                            'LANDLORD': { text: 'Landlord', class: 'bg-amber-100 text-amber-700' },
                            'ZRA': { text: 'ZRA Official', class: 'bg-emerald-100 text-emerald-700' },
                            'MINISTRY': { text: 'Ministry Official', class: 'bg-indigo-100 text-indigo-700' }
                        };

                        const roleData = roles[userData.user_type] || { text: 'User', class: 'bg-slate-100 text-slate-700' };
                        userRoleEl.textContent = roleData.text;
                        userRoleEl.className = `text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded mt-0.5 inline-block w-max ${roleData.class}`;
                    }
                }

                // Update Dashboard link based on role
                if (navDashboardLink) {
                    if (userData.user_type === 'ZRA') {
                        navDashboardLink.href = '/gov/zra/';
                    } else if (userData.user_type === 'MINISTRY') {
                        navDashboardLink.href = '/gov/occupancy/';
                    } else if (userData.user_type === 'LANDLORD') {
                        navDashboardLink.href = '/dashboard/';
                    } else {
                        // Tenant dashboard doesn't exist yet
                        navDashboardLink.href = '/';
                    }
                }
            } else {
                // Token invalid, clear it
                localStorage.removeItem('auth_token');
                window.location.reload();
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }
});
