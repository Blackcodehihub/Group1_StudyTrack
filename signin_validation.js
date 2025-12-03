document.addEventListener('DOMContentLoaded', function () {
    // ====================== LOGIN FORM ======================
    const loginForm = document.getElementById('loginForm');
    const loginMessages = document.getElementById('login-messages');
    
    // --- REVERTED: Removed all button validity selectors and functions ---
    // (EmailInput, PasswordInput, LoginButton, checkLoginValidity, and listeners are removed)
    // ---------------------------------------------------------------------

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            // Safety net: Since the button is always enabled, we don't need the check.
            
            // Clear previous error state
            loginMessages.textContent = '';
            loginMessages.classList.remove('active-error'); 
            
            // Show loading state
            loginMessages.textContent = 'Logging in...';
            loginMessages.style.color = '#fff';

            const formData = new FormData(loginForm);

            try {
                const res = await fetch('process_login.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();

                if (data.success) {
                    // Success state
                    loginMessages.textContent = 'Login successful! Redirecting...';
                    loginMessages.style.color = 'lime';
                    setTimeout(() => window.location.href = 'HomeF.html', 1000);
                } else {
                    // Failure state
                    loginMessages.textContent = data.message || 'Login failed. Please try again.';
                    loginMessages.style.color = '#ff4d4d';
                    loginMessages.classList.add('active-error'); // Keep this class for alignment/fade
                }
            } catch (err) {
                // Network error state
                loginMessages.textContent = 'Network error. Please try again.';
                loginMessages.style.color = '#ff4d4d';
                loginMessages.classList.add('active-error'); // Keep this class for alignment/fade
            }
        });
    }

    // ====================== PASSWORD TOGGLE (No Change) ======================
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', () => {
            const target = document.getElementById(icon.dataset.target);
            if (target.type === 'password') {
                target.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                target.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

   // ====================== FORGOT PASSWORD MODAL (No Change) ======================
const modal = document.getElementById('forgotModal');
const openBtn = document.getElementById('openForgotModal');
const closeBtn = document.getElementById('closeModal');

let resetToken = ''; 

openBtn.onclick = () => {
    modal.classList.add('active');
    resetModal(); 
};

closeBtn.onclick = () => closeModal();

modal.onclick = (e) => {
    if (e.target === modal) closeModal();
};

document.getElementById('backToLoginBtn').onclick = () => closeModal();

// ====================== REUSABLE RESET FUNCTION (No Change) ======================
function resetModal() {
    showStep(1);

    document.getElementById('forgot-email').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    document.querySelectorAll('.pin-digit').forEach(input => input.value = '');

    resetToken = '';

    document.getElementById('forgot-email').focus();
}

function closeModal() {
    modal.classList.remove('active');
    resetModal(); 
}

function showStep(n) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${n}`).classList.add('active');
}

    // Step 1 → Send Code (No Change)
    document.getElementById('sendCodeBtn').onclick = async () => {
        const email = document.getElementById('forgot-email').value.trim();
        if (!email || !email.includes('@')) {
            return alert('Please enter a valid email');
        }

        const btn = document.getElementById('sendCodeBtn');
        btn.disabled = true;
        btn.textContent = 'Sending...';

        try {
            const res = await fetch('send_code.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ email })
            });

            const data = await res.json();

            if (data.success) {
                resetToken = data.token;   
                console.log('Token saved:', resetToken); 

                document.getElementById('emailDisplay').textContent = email;
                showStep(2);
                document.querySelector('.pin-digit').focus();

             
            } else {
                alert(data.message || 'Failed to send code');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Send Code';
        }
    };

    // Auto-move between PIN digits (No Change)
    document.querySelectorAll('.pin-digit').forEach((input, idx, inputs) => {
        input.addEventListener('input', () => {
            if (input.value.length === 1 && idx < inputs.length - 1) {
                inputs[idx + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.value === '' && idx > 0) {
                inputs[idx - 1].focus();
            }
        });
    });

    // Step 2 → Verify PIN (No Change)
    document.getElementById('verifyCodeBtn').onclick = async () => {
        const code = Array.from(document.querySelectorAll('.pin-digit'))
            .map(i => i.value)
            .join('');

        if (code.length !== 4 || !/^\d+$/.test(code)) {
            return alert('Please enter a valid 4-digit code');
        }

        const btn = document.getElementById('verifyCodeBtn');
        btn.disabled = true;
        btn.textContent = 'Verifying...';

        try {
            console.log('Sending token:', resetToken); 
            console.log('Sending PIN:', code);

            const res = await fetch('verify_pin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    token: resetToken,    
                    pin: code
                })
            });

            const data = await res.json();

            if (data.success) {
                showStep(3);
            } else {
                alert(data.message || 'Invalid or expired code');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Verify Code';
        }
    };

    // Step 3 → Set New Password (No Change)
    document.getElementById('submitNewPassword').onclick = async () => {
        const pw = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-password').value;

        if (pw.length < 8) return alert('Password must be at least 8 characters');
        if (pw !== confirm) return alert('Passwords do not match');

        const btn = document.getElementById('submitNewPassword');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
            const res = await fetch('reset_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    token: resetToken,    
                    password: pw
                })
            });

            const data = await res.json();

            if (data.success) {
                showStep(4);
            } else {
                alert(data.message || 'Failed to reset password');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Password';
        }
    };

    // Step 4 → Back to Login (No Change)
    document.getElementById('backToLoginBtn').onclick = () => {
        modal.classList.remove('active');
        document.querySelectorAll('#forgotModal input').forEach(i => i.value = '');
        document.querySelectorAll('.pin-digit').forEach(i => i.value = '');
        showStep(1);
        resetToken = '';  // Clear token
    };
});