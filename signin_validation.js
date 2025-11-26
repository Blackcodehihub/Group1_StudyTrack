document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('signin-password');
    const toggleIcon = document.querySelector('.toggle-password');
    const loginMessages = document.getElementById('login-messages');

    // --- 1. Password Toggle Functionality ---
    if (toggleIcon) {
        toggleIcon.addEventListener('click', function() {
            const targetInput = passwordInput;

            // Toggle the type attribute
            const type = targetInput.getAttribute('type') === 'password' ? 'text' : 'password';
            targetInput.setAttribute('type', type);

            // Toggle the icon (eye open/closed)
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // --- 2. AJAX Form Submission ---
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Stop default form submission
        loginMessages.textContent = ''; // Clear previous messages
        
        const formData = new FormData(loginForm);
        
        // Show a loading state
        loginMessages.textContent = 'Logging in...';

        fetch('process_login.php', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            // Check if the response status is OK (2xx), otherwise assume an error
            return response.json().then(data => {
                if (!response.ok) {
                    // Throw the error data to be caught below
                    throw new Error(data.message || 'Login failed.');
                }
                return data; // Return success data
            });
        })
        .then(data => {
            if (data.success) {
                loginMessages.textContent = 'Login successful! Redirecting...';
                loginMessages.style.color = 'lime'; 
                
                // --- SUCCESS: Redirect to the Classes Page ---
                window.location.href = 'Classes.html'; 
            } else {
                // This path is usually not hit, as errors are thrown above.
                loginMessages.textContent = data.message || 'Login failed. Please try again.';
                loginMessages.style.color = '#ff4d4d';
            }
        })
        .catch(error => {
            // Display error messages from the PHP script
            console.error('Login error:', error);
            loginMessages.textContent = error.message || 'An unexpected error occurred during login.';
            loginMessages.style.color = '#ff4d4d';
        });
    });
});