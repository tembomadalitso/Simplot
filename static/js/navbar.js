document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
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
});
