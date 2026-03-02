async function handleLogout() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        window.location.href = '/auth/login/';
        return;
    }

    try {
        // 1. Tell Django to destroy the token
        const response = await fetch('/auth/token/logout/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 2. Clear local storage regardless of server response
        localStorage.removeItem('auth_token');
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        
        // 3. Redirect to home
        window.location.href = '/';
        
    } catch (error) {
        console.error('Logout failed:', error);
        // Fallback cleanup
        localStorage.removeItem('auth_token');
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = '/';
    }
}