document.addEventListener('DOMContentLoaded', function() {
    // --- 1. DOM Element Selectors ---
    const form = document.getElementById('signupForm');
    const createAccountBtn = document.getElementById('create-account-btn');
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('signup-confirm-password');
    const toggleIcons = document.querySelectorAll('.toggle-password');
    const requiredInputs = form.querySelectorAll('input[required]');
    
    // New Selectors for Feedback Control
    const feedbackContainer = document.getElementById('password-policy-feedback');
    const feedbackMessage = document.getElementById('feedback-message');
    const rulesList = document.getElementById('password-rules');

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


    // --- 4. Validation Logic ---

    function validatePassword(password) {
        return {
            length: (password.length >= 8),
            capital: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^a-zA-Z0-9\s]/.test(password)
        };
    }

    // Function to update the live visual feedback
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

    // Function to check overall form validity and enable/disable button (UPDATED)
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
        
        // --- NEW: Strict Password Match Check ---
        const passwordsMatch = password === confirmPasswordInput.value && password !== '';

        // Form is only valid if ALL required fields are filled, ALL rules are met, AND passwords match.
        const formIsValid = allRequiredFilled && allRulesMet && passwordsMatch;

        createAccountBtn.disabled = !formIsValid;
        
        // Display a mismatch error for better UX
        const mismatchGroup = confirmPasswordInput.parentNode;
        const existingError = mismatchGroup.parentNode.querySelector('.error-message');
        
        if (existingError) existingError.remove();

        if (password.length > 0 && confirmPasswordInput.value.length > 0 && !passwordsMatch) {
             displayError(mismatchGroup, "Passwords do not match.");
        }
    }

    // --- 5. Event Listeners (No Change) ---
    passwordInput.addEventListener('input', updatePasswordFeedback);
    passwordInput.addEventListener('input', checkFormValidity);
    confirmPasswordInput.addEventListener('input', checkFormValidity);
    
    requiredInputs.forEach(input => {
        input.addEventListener('input', checkFormValidity);
    });

    checkFormValidity();


    // --- 6. Final Form Submission Handling (Cleaned up - less needed now) ---
    form.addEventListener('submit', function(event) {
        // Since button is disabled if invalid, this is mostly a final safety net
        if (createAccountBtn.disabled) {
            event.preventDefault();
            return;
        }
        // No need for redundant password checking here, as checkFormValidity
        // already ensured a match before enabling the button.
    });

    // Helper function to display errors neatly
    function displayError(inputGroup, message) {
        const errorElement = document.createElement('p');
        errorElement.className = 'error-message';
        errorElement.style.color = '#ff4d4d';
        errorElement.textContent = message;
        inputGroup.insertAdjacentElement('afterend', errorElement);
    }
});