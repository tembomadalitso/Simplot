/**
 * auth.js  —  Zambia Rentals
 * Handles: Login · Role-first Signup (Tenant / Landlord) · Email 2FA · Forgot Password
 * Password rules: 8+ chars, upper, lower, digit, special character
 */

// ─────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────
let currentRole   = null;   // 'TENANT' | 'LANDLORD'
let currentStep   = 'login'; // 'login' | 1 | 2 | 3 | 'forgot'
let resendTimerId = null;
let signupEmail   = null;
let signupPassword = null;

// ─────────────────────────────────────────────────────────────────
// PANEL VISIBILITY
// ─────────────────────────────────────────────────────────────────
const panels = {
  login    : document.getElementById('loginForm'),
  step1    : document.getElementById('signupStep1'),
  step2    : document.getElementById('signupStep2'),
  step3    : document.getElementById('signupStep3'),
  forgot   : document.getElementById('forgotPasswordPanel'),
};
const stepIndicator = document.getElementById('stepIndicator');
const toggleWrap    = document.getElementById('toggleWrap');
const toggleBtn     = document.getElementById('toggleAuth');

function showOnly(key) {
  Object.values(panels).forEach(p => p && p.classList.add('hidden'));
  if (panels[key]) panels[key].classList.remove('hidden');
  clearMessage();
}

function showLogin() {
  showOnly('login');
  currentStep = 'login';
  stepIndicator.classList.add('hidden');
  toggleWrap.classList.remove('hidden');
  toggleBtn.textContent = "Don't have an account? Sign Up";
  setAuthHeader('Welcome Back', 'Sign in to manage your property journey');
}

function showSignup() {
  showOnly('step1');
  currentStep = 1;
  stepIndicator.classList.remove('hidden');
  toggleWrap.classList.remove('hidden');
  toggleBtn.textContent = 'Already have an account? Sign In';
  setDotStep(1);
  setAuthHeader('Create Account', 'Join the Zambia Rentals platform');
}

function showForgotPassword() {
  showOnly('forgot');
  currentStep = 'forgot';
  stepIndicator.classList.add('hidden');
  toggleWrap.classList.add('hidden');
  setAuthHeader('Reset Password', 'We\'ll send a link to your email');
}

// Toggle handler (top-level button)
document.getElementById('toggleAuth').addEventListener('click', () => {
  if (currentStep === 'login') {
    showSignup();
  } else {
    showLogin();
  }
});

// ─────────────────────────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────────────────────────
function setDotStep(n) {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`step${i}Dot`);
    el.classList.toggle('active',    i === n);
    el.classList.toggle('complete',  i < n);
  });
}

// ─────────────────────────────────────────────────────────────────
// HEADER TEXT
// ─────────────────────────────────────────────────────────────────
function setAuthHeader(title, subtitle) {
  document.getElementById('authTitle').textContent    = title;
  document.getElementById('authSubtitle').textContent = subtitle;
}

// ─────────────────────────────────────────────────────────────────
// STEP NAVIGATION
// ─────────────────────────────────────────────────────────────────
function goToStep(n) {
  showOnly(`step${n}`);
  currentStep = n;
  setDotStep(n);
  if (n === 1) setAuthHeader('Create Account', 'Join the Zambia Rentals platform');
  if (n === 2) setAuthHeader('Your Details',   'Fill in your account information');
  if (n === 3) setAuthHeader('Verify Email',   'Enter the code we sent you');
}

// ─────────────────────────────────────────────────────────────────
// ROLE SELECTION  (Step 1)
// ─────────────────────────────────────────────────────────────────
function selectRole(role, cardEl) {
  currentRole = role;

  // Highlight selected card
  document.querySelectorAll('.auth-role-card').forEach(c => c.classList.remove('selected'));
  if (cardEl) cardEl.classList.add('selected');

  // Show / hide landlord-only fields
  const landlordFields = document.getElementById('landlordOnlyFields');
  if (role === 'LANDLORD') {
    landlordFields.classList.remove('hidden');
  } else {
    landlordFields.classList.add('hidden');
  }

  // Slight delay so the user sees the selection, then proceed
  setTimeout(() => goToStep(2), 300);
}

// ─────────────────────────────────────────────────────────────────
// NRC AUTO-FORMAT  (XXXXXX/XX/X)
// ─────────────────────────────────────────────────────────────────
document.getElementById('regNrc').addEventListener('input', function (e) {
  // Strip everything that isn't a digit
  let digits = e.target.value.replace(/\D/g, '').slice(0, 9);
  let formatted = digits;
  if (digits.length > 6) formatted = digits.slice(0, 6) + '/' + digits.slice(6);
  if (digits.length > 8) formatted = digits.slice(0, 6) + '/' + digits.slice(6, 8) + '/' + digits.slice(8);
  e.target.value = formatted;
});

// TPIN — digits only
document.getElementById('regTpin').addEventListener('input', function (e) {
  e.target.value = e.target.value.replace(/\D/g, '');
});

// ─────────────────────────────────────────────────────────────────
// PASSWORD STRENGTH
// ─────────────────────────────────────────────────────────────────
const PW_RULES = {
  'rule-len':   v => v.length >= 8,
  'rule-upper': v => /[A-Z]/.test(v),
  'rule-lower': v => /[a-z]/.test(v),
  'rule-num':   v => /[0-9]/.test(v),
  'rule-spec':  v => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v),
};

function checkPasswordStrength(val) {
  let passed = 0;
  Object.entries(PW_RULES).forEach(([id, fn]) => {
    const ok = fn(val);
    const el = document.getElementById(id);
    el.classList.toggle('passed', ok);
    if (ok) passed++;
  });

  const bar   = document.getElementById('pwBar');
  const pct   = (passed / 5) * 100;
  bar.style.width = pct + '%';
  bar.className = 'pw-bar-fill';
  if (passed <= 2) bar.classList.add('weak');
  else if (passed <= 3) bar.classList.add('fair');
  else if (passed <= 4) bar.classList.add('good');
  else bar.classList.add('strong');
}

function validatePassword(pw) {
  return Object.values(PW_RULES).every(fn => fn(pw));
}

// ─────────────────────────────────────────────────────────────────
// TOGGLE PASSWORD VISIBILITY
// ─────────────────────────────────────────────────────────────────
function togglePassword(inputId, btn) {
  const inp = document.getElementById(inputId);
  const icon = btn.querySelector('i');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    inp.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

// ─────────────────────────────────────────────────────────────────
// SIGNUP STEP 2 SUBMIT  →  POST to create user + send OTP
// ─────────────────────────────────────────────────────────────────
document.getElementById('signupStep2').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const username  = document.getElementById('regUsername').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const phone     = document.getElementById('regPhone').value.trim();
  const password  = document.getElementById('regPassword').value;
  const password2 = document.getElementById('regPassword2').value;

  // ── Client-side validation ──
  if (!validatePassword(password)) {
    showMessage('Password must be at least 8 characters with uppercase, lowercase, a number and a special character.', 'error');
    return;
  }
  if (password !== password2) {
    document.getElementById('pwMatchError').classList.remove('hidden');
    return;
  }
  document.getElementById('pwMatchError').classList.add('hidden');

  const payload = { username, email, password, user_type: currentRole, phone_number: phone };

  if (currentRole === 'LANDLORD') {
    const nrcRaw = document.getElementById('regNrc').value;
    const tpin   = document.getElementById('regTpin').value;

    const nrcDigits = nrcRaw.replace(/\D/g, '');
    if (nrcDigits.length !== 9) {
      document.getElementById('nrcError').classList.remove('hidden');
      return;
    }
    document.getElementById('nrcError').classList.add('hidden');

    if (!tpin || isNaN(Number(tpin))) {
      document.getElementById('tpinError').classList.remove('hidden');
      return;
    }
    document.getElementById('tpinError').classList.add('hidden');

    payload.nrc_number  = nrcDigits;       // Store raw digits  e.g. "233456641"
    payload.tpin_number = parseInt(tpin, 10);
  }

  setBtnLoading('signupStep2', true);
  try {
    const res  = await fetch(window.URLS.authRegister, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      // Store credentials for auto-login after verification
      signupEmail = email;
      signupPassword = password;
      document.getElementById('verifyEmailDisplay').textContent = email;
      goToStep(3);
      startOtpInputs();
    } else {
      showMessage('Error: ' + formatErrors(data), 'error');
    }
  } catch {
    showMessage('Connection failed. Please try again.', 'error');
  } finally {
    setBtnLoading('signupStep2', false);
  }
});

// ─────────────────────────────────────────────────────────────────
// OTP — Request code from backend
// ─────────────────────────────────────────────────────────────────
async function requestVerificationCode(email) {
  try {
    await fetch(window.URLS.authSendCode, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ email }),
    });
  } catch {
    // non-fatal — we still show the step
  }
}

// ─────────────────────────────────────────────────────────────────
// OTP — Input box auto-advance
// ─────────────────────────────────────────────────────────────────
function startOtpInputs() {
  const inputs = document.querySelectorAll('.auth-otp-input');
  inputs.forEach((inp, i) => {
    inp.value = '';
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
      if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i - 1].focus();
    });
    inp.addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      [...text].slice(0, 6).forEach((ch, j) => { if (inputs[i + j]) inputs[i + j].value = ch; });
      e.preventDefault();
    });
  });
  inputs[0].focus();
  startResendTimer(60);
}

function getOtpValue() {
  return [...document.querySelectorAll('.auth-otp-input')].map(i => i.value).join('');
}

// ─────────────────────────────────────────────────────────────────
// OTP VERIFICATION SUBMIT
// ─────────────────────────────────────────────────────────────────
async function submitVerification() {
  const code  = getOtpValue();
  const email = document.getElementById('verifyEmailDisplay').textContent.trim().toLowerCase();
  if (code.length !== 6) {
    showMessage('Please enter all 6 digits.', 'error');
    return;
  }
  clearMessage();

  setBtnLoading('signupStep3', true);
  try {
    const res  = await fetch(window.URLS.authVerify, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ email, code }),
    });
    const data = await res.json();

    if (res.ok) {
      showMessage('✓ Email verified! Signing you in…', 'success');
      // Auto-login after verification
      setTimeout(async () => {
        await performLogin(signupEmail, signupPassword);
      }, 1500);
    } else {
      showMessage(data.error || 'Invalid code. Please try again.', 'error');
    }
  } catch {
    showMessage('Connection failed. Please try again.', 'error');
  } finally {
    setBtnLoading('signupStep3', false);
  }
}

// ─────────────────────────────────────────────────────────────────
// AUTO LOGIN AFTER VERIFICATION
// ─────────────────────────────────────────────────────────────────
async function performLogin(email, password) {
  clearMessage();

  const payload = {
    username: email,
    password: password,
  };

  try {
    const res  = await fetch(window.URLS.authLogin, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('auth_token', data.auth_token);
      document.cookie = `auth_token=${data.auth_token}; path=/; max-age=86400; SameSite=Lax`;
      showMessage('✓ Welcome! Redirecting…', 'success');

      // Fetch user info for role-based redirect
      try {
        const meRes = await fetch(window.URLS.authMe, {
          headers: { 'Authorization': `Token ${data.auth_token}` },
        });
        if (meRes.ok) {
          const user = await meRes.json();

          let redirectUrl = window.URLS.index;
          if (user.user_type === 'LANDLORD')  redirectUrl = window.URLS.dashboard;
          if (user.user_type === 'ZRA')        redirectUrl = window.URLS.zraDashboard;
          if (user.user_type === 'MINISTRY')   redirectUrl = window.URLS.occupancyDashboard;
          setTimeout(() => window.location.href = redirectUrl, 1000);
          return;
        }
      } catch {}
      setTimeout(() => window.location.href = window.URLS.index, 1000);
    } else {
      // If auto-login fails, show login form
      showMessage('Verification successful. Please sign in.', 'success');
      setTimeout(() => showLogin(), 1500);
    }
  } catch {
    // If auto-login fails, show login form
    showMessage('Verification successful. Please sign in.', 'success');
    setTimeout(() => showLogin(), 1500);
  }
}

// ─────────────────────────────────────────────────────────────────
// RESEND CODE TIMER
// ─────────────────────────────────────────────────────────────────
function startResendTimer(seconds) {
  const btn   = document.getElementById('resendBtn');
  const timer = document.getElementById('resendTimer');
  btn.classList.add('hidden');
  timer.classList.remove('hidden');
  let remaining = seconds;
  timer.textContent = `Resend in ${remaining}s`;
  clearInterval(resendTimerId);
  resendTimerId = setInterval(() => {
    remaining--;
    timer.textContent = `Resend in ${remaining}s`;
    if (remaining <= 0) {
      clearInterval(resendTimerId);
      timer.classList.add('hidden');
      btn.classList.remove('hidden');
    }
  }, 1000);
}

async function resendCode() {
  const email = document.getElementById('verifyEmailDisplay').textContent;
  await requestVerificationCode(email);
  startResendTimer(60);
  showMessage('A new code has been sent.', 'success');
}

// ─────────────────────────────────────────────────────────────────
// LOGIN SUBMIT
// ─────────────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const payload = {
    username: document.getElementById('loginUsername').value.trim(),
    password: document.getElementById('loginPassword').value,
  };

  setBtnLoading('loginForm', true);
  try {
    const res  = await fetch(window.URLS.authLogin, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('auth_token', data.auth_token);
      document.cookie = `auth_token=${data.auth_token}; path=/; max-age=86400; SameSite=Lax`;
      showMessage('✓ Success! Redirecting…', 'success');

      // Fetch user info for role-based redirect
      try {
        const meRes = await fetch(window.URLS.authMe, {
          headers: { 'Authorization': `Token ${data.auth_token}` },
        });
        if (meRes.ok) {
          const user = await meRes.json();

          // Block unverified users
          if (user.is_verified === false) {
            localStorage.removeItem('auth_token');
            document.cookie = 'auth_token=; max-age=0';
            showMessage('Please verify your email before signing in.', 'error');
            return;
          }

          let redirectUrl = window.URLS.index;
          if (user.user_type === 'LANDLORD')  redirectUrl = window.URLS.dashboard;
          if (user.user_type === 'ZRA')        redirectUrl = window.URLS.zraDashboard;
          if (user.user_type === 'MINISTRY')   redirectUrl = window.URLS.occupancyDashboard;
          setTimeout(() => window.location.href = redirectUrl, 500);
          return;
        }
      } catch {}
      setTimeout(() => window.location.href = window.URLS.index, 500);
    } else {
      showMessage('Invalid username or password.', 'error');
    }
  } catch {
    showMessage('Connection failed. Please try again.', 'error');
  } finally {
    setBtnLoading('loginForm', false);
  }
});

// ─────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────
async function submitForgotPassword() {
  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) { showMessage('Please enter your email address.', 'error'); return; }
  clearMessage();

  try {
    const res = await fetch(window.URLS.authPasswordReset, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ email }),
    });

    // Always show success to avoid email enumeration
    showMessage('If that email exists, a reset link has been sent.', 'success');
  } catch {
    showMessage('Connection failed. Please try again.', 'error');
  }
}

// ─────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────
function showMessage(text, type) {
  const el = document.getElementById('authMessage');
  el.textContent  = text;
  el.className    = type === 'success' ? 'auth-alert auth-alert-success' : 'auth-alert auth-alert-error';
  el.style.display = 'block';
}

function clearMessage() {
  const el = document.getElementById('authMessage');
  el.style.display = 'none';
  el.textContent   = '';
}

function setBtnLoading(formId, loading) {
  const btn = document.querySelector(`#${formId} .auth-btn`);
  if (!btn) return;
  btn.disabled = loading;
  btn.style.opacity = loading ? '0.7' : '1';
}

function formatErrors(data) {
  if (typeof data === 'string') return data;
  return Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join(' | ');
}