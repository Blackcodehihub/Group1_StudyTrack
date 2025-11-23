document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signupForm');
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('signup-confirm-password');

    // Function to check if password meets policy
    function validatePassword(password) {
        const errors = [];
        
        // 1. Minimum 8 characters
        if (password.length < 8) {
            errors.push("• Must be at least 8 characters.");
        }
        // 2. Capital letter
        if (!/[A-Z]/.test(password)) {
            errors.push("• Must contain at least one capital letter (A-Z).");
        }
        // 3. Number
        if (!/[0-9]/.test(password)) {
            errors.push("• Must contain at least one number (0-9).");
        }
        // 4. Special character (non-alphanumeric, excluding spaces/emojis)
        // This regex checks for anything that isn't a letter or a number.
        if (!/[^a-zA-Z0-9\s]/.test(password)) {
            errors.push("• Must contain at least one special character.");
        }

        return errors;
    }
    

    // Attach listener to the form submission
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Stop the default form submission

        let isValid = true;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Clear previous error messages
        document.querySelectorAll('.error-message').forEach(e => e.remove());

        // --- 1. Basic Field Validation (check for emptiness) ---
        // For brevity, we'll only check the password fields here. 
        // In a full app, you would check all fields.

        if (password === "" || confirmPassword === "") {
             displayError(passwordInput.parentNode, "Password fields cannot be empty.");
             isValid = false;
        }

        // --- 2. Password Policy Validation ---
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            // Display all password errors
            const errorContainer = passwordInput.parentNode;
            let errorHtml = '<ul class="error-message" style="color: red; list-style: none; margin-top: 5px; padding-left: 0;">';
            passwordErrors.forEach(err => {
                errorHtml += `<li>${err}</li>`;
            });
            errorHtml += '</ul>';
            errorContainer.insertAdjacentHTML('afterend', errorHtml);
            isValid = false;
        }

        // --- 3. Confirmation Match Check ---
        if (password !== confirmPassword) {
            displayError(confirmPasswordInput.parentNode, "Passwords do not match.");
            isValid = false;
        }


        if (isValid) {
            // If all validation passes, submit the form to the PHP backend
            form.submit();
        }
    });

    // Helper function to display errors neatly
    function displayError(inputGroup, message) {
        const errorElement = document.createElement('p');
        errorElement.className = 'error-message';
        errorElement.style.color = 'red';
        errorElement.textContent = message;
        inputGroup.insertAdjacentElement('afterend', errorElement);
    }
});