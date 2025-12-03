document.addEventListener('DOMContentLoaded', function() {
    // --- 1. DOM Element Selectors (FIXED: Added emailInput) ---
    const form = document.getElementById('signupForm');
    const createAccountBtn = document.getElementById('create-account-btn');
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('signup-confirm-password');
    // 👇 FIX 1: Add the selector for the email input
    const emailInput = document.getElementById('signup-email'); 
    const toggleIcons = document.querySelectorAll('.toggle-password');
    const requiredInputs = form.querySelectorAll('input[required]');
    
    // New Selectors for Feedback Control
    const feedbackContainer = document.getElementById('password-policy-feedback');
    const feedbackMessage = document.getElementById('feedback-message');
    const rulesList = document.getElementById('password-rules');

    // --- NEW STATE VARIABLE ---
    let emailIsRegistered = false;
    
    // --- INITIAL STATE ---
    confirmPasswordInput.disabled = true; // Disable confirm password initially


    // --- 2. Password Toggle Function (No Change) ---
    toggleIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);

            const type = targetInput.getAttribute('type') === 'password' ? 'text' : 'password';
            targetInput.setAttribute('type', type);

            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // --- 3. Focus/Blur Listeners (No Change) ---
    passwordInput.addEventListener('focus', function() {
        feedbackContainer.style.display = 'block';
        setTimeout(() => feedbackContainer.classList.add('show'), 10);
    });
    
    passwordInput.addEventListener('blur', function() {
        if (passwordInput.value.length === 0) {
            feedbackContainer.classList.remove('show');
            setTimeout(() => feedbackContainer.style.display = 'none', 300);
        }
    });

    // --- NEW: Email Validation Logic ---
    let emailCheckTimeout;

    function checkEmailExistence() {
        clearTimeout(emailCheckTimeout);
        const email = emailInput.value.trim();
        const emailGroup = emailInput.parentNode;
        
        // Remove existing custom error messages
        // Ensure error is removed from the correct location
        const existingError = emailGroup.parentNode.querySelector('.email-error-message'); 
        if (existingError) existingError.remove();

        // Check format first (using the browser's/existing validation)
        if (!emailInput.checkValidity()) {
            emailIsRegistered = false; // Reset state if format is bad
            checkFormValidity();
            return;
        }

        // Only check server if email is not empty and valid format
        if (email.length > 0) {
            // Debounce the request to avoid spamming the server
            emailCheckTimeout = setTimeout(() => {
                fetch(`check_email.php?email=${encodeURIComponent(email)}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Server response not OK');
                        }
                        return response.json();
                    })
                    .then(data => {
                        emailIsRegistered = data.exists;
                        
                        // Display error message if email exists
                        if (emailIsRegistered) {
                            // Use a distinct class for the email error
                            displayError(emailGroup, "This email is already registered.", 'email-error-message');
                        }
                        
                        // Re-check form validity
                        checkFormValidity();
                    })
                    .catch(error => {
                        console.error('Error checking email:', error);
                        // Treat a check error as "not registered" but keep button disabled if other fields fail
                        emailIsRegistered = false; 
                        checkFormValidity();
                    });
            }, 500); // 500ms delay
        } else {
            emailIsRegistered = false;
            checkFormValidity();
        }
    }

    // --- 4. Validation Logic ---

    function validatePassword(password) {
        return {
            length: (password.length >= 8),
            capital: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^a-zA-Z0-9\s]/.test(password)
        };
    }

    // Function to update the live visual feedback (No Change)
    function updatePasswordFeedback() {
        const password = passwordInput.value;
        const rulesMet = validatePassword(password);
        const allRulesMet = Object.values(rulesMet).every(status => status === true);
        
        // --- NEW: Enable/Disable Confirm Password ---
        if (allRulesMet) {
            confirmPasswordInput.disabled = false;
        } else {
            confirmPasswordInput.disabled = true;
            confirmPasswordInput.value = ''; // Clear if policy is broken
        }
        
        // Dynamic content update based on validation status
        if (allRulesMet) {
            feedbackMessage.innerHTML = '<i class="fa-solid fa-check" style="color: lime; margin-right: 5px;"></i> Valid password';
            feedbackMessage.style.color = 'white';
            rulesList.style.display = 'none';
        } else {
            feedbackMessage.innerHTML = 'Password Requirements:';
            feedbackMessage.style.color = 'white';
            rulesList.style.display = 'block';
        }
        
        // Update all individual rule items
        rulesList.querySelectorAll('li').forEach(li => {
            const ruleName = li.getAttribute('data-rule');
            const icon = li.querySelector('i');
            
            if (rulesMet[ruleName]) {
                icon.className = 'fa-solid fa-check';
                icon.style.color = 'lime';
            } else {
                icon.className = 'fa-solid fa-xmark';
                icon.style.color = '#ff4d4d';
            }
        });

        checkFormValidity();
    }

    // Function to check overall form validity and enable/disable button (FIXED: Added emailIsRegistered check)
    function checkFormValidity() {
        let allRequiredFilled = true;
        
        requiredInputs.forEach(input => {
            if (input.value.trim() === '') {
                allRequiredFilled = false;
            }
        });

        const password = passwordInput.value;
        const rulesMet = validatePassword(password);
        const allRulesMet = Object.values(rulesMet).every(status => status === true);
        
        // --- Strict Password Match Check ---
        const passwordsMatch = password === confirmPasswordInput.value && password !== '';

        // 👇 FIX 2: Added the crucial check: !emailIsRegistered
        const formIsValid = allRequiredFilled && allRulesMet && passwordsMatch && !emailIsRegistered;

        createAccountBtn.disabled = !formIsValid;
        
        // Display a mismatch error for better UX
        const mismatchGroup = confirmPasswordInput.parentNode;
        const existingError = mismatchGroup.parentNode.querySelector('.password-error-message');
        
        if (existingError) existingError.remove();

        if (password.length > 0 && confirmPasswordInput.value.length > 0 && !passwordsMatch) {
             displayError(mismatchGroup, "Passwords do not match.", 'password-error-message');
        }
    }

    // --- 5. Event Listeners ---
    // Added listener for email input
    emailInput.addEventListener('input', checkEmailExistence); 
    emailInput.addEventListener('input', checkFormValidity);

    passwordInput.addEventListener('input', updatePasswordFeedback);
    passwordInput.addEventListener('input', checkFormValidity);
    confirmPasswordInput.addEventListener('input', checkFormValidity);
    
    requiredInputs.forEach(input => {
        // Only attach listeners to non-email inputs
        if (input.id !== 'signup-email') { 
            input.addEventListener('input', checkFormValidity);
        }
    });

    // Initial check
    checkFormValidity();


    // --- 6. Final Form Submission Handling (No Change) ---
    form.addEventListener('submit', function(event) {
        // This is the final safety net check that will prevent the page from moving
        // if the button is somehow enabled when it shouldn't be.
        if (createAccountBtn.disabled) {
            event.preventDefault();
            return;
        }
        // If the button is NOT disabled, the form is submitted to process_signup.php
    });

    // Helper function to display errors neatly (FIXED: Better element insertion logic)
    function displayError(inputGroup, message, className = 'error-message') {
        const errorElement = document.createElement('p');
        errorElement.className = className;
        errorElement.style.color = '#ff4d4d';
        errorElement.style.fontSize = '0.9em'; // Slightly smaller font for errors
        errorElement.style.marginTop = '-10px'; // Move it closer to the input
        errorElement.style.marginBottom = '15px'; // Add space below
        errorElement.textContent = message;
        
        // 👇 FIX 3: Insert after the parent element's group (input-row or float-group)
        // This ensures the error appears correctly below the input box.
        inputGroup.parentNode.insertBefore(errorElement, inputGroup.nextSibling);
    }
});