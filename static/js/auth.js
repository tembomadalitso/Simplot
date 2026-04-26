const authForm = document.getElementById('authForm');
const toggleBtn = document.getElementById('toggleAuth');
const extraFields = document.getElementById('extraFields');
let isLogin = true;

// Toggle between Login and Register
toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    document.getElementById('authTitle').innerText = isLogin ? 'Welcome Back' : 'Create Account';
    document.getElementById('btnText').innerText = isLogin ? 'Sign In' : 'Sign Up';
    toggleBtn.innerText = isLogin ? "Don't have an account? Create one" : "Already have an account? Sign In";
    extraFields.classList.toggle('hidden', isLogin);
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageDiv = document.getElementById('authMessage');
    messageDiv.classList.remove('hidden', 'text-red-500', 'text-emerald-500');
    
    const payload = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    if (!isLogin) {
        payload.email = document.getElementById('email').value;
        payload.user_type = document.getElementById('user_type').value;
    }

    try {
        const endpoint = isLogin ? window.URLS.authLogin : window.URLS.authUsers;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            if (isLogin) {
                // Save token and set cookie for Django views to use
                localStorage.setItem('auth_token', data.auth_token);
                document.cookie = `auth_token=${data.auth_token}; path=/; max-age=86400; SameSite=Lax`;

                messageDiv.innerText = "Success! Redirecting...";
                messageDiv.classList.add('text-emerald-500');

                // Fetch user data to determine where to redirect
                try {
                    const meRes = await fetch(window.URLS.authMe, {
                        headers: { 'Authorization': `Token ${data.auth_token}` }
                    });
                    if (meRes.ok) {
                        const userData = await meRes.json();
                        let redirectUrl = window.URLS.index;
                        
                        if (userData.user_type === 'LANDLORD') {
                            redirectUrl = window.URLS.dashboard;
                        } else if (userData.user_type === 'ZRA') {
                            redirectUrl = window.URLS.zraDashboard;
                        } else if (userData.user_type === 'MINISTRY') {
                            redirectUrl = window.URLS.occupancyDashboard;
                        }

                        setTimeout(() => window.location.href = redirectUrl, 500);
                        return;
                    }
                } catch (e) {
                    console.error("Failed to fetch user role for redirection");
                }
                setTimeout(() => window.location.href = window.URLS.index, 500);
            } else {
                messageDiv.innerText = "Account created! Please sign in.";
                messageDiv.classList.add('text-emerald-500');
                toggleBtn.click(); // Switch back to login mode
            }
        } else {
            messageDiv.innerText = "Error: " + JSON.stringify(data);
            messageDiv.classList.add('text-red-500');
        }
    } catch (err) {
        messageDiv.innerText = "Connection failed.";
        messageDiv.classList.add('text-red-500');
    }
});