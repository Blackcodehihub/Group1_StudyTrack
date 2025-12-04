// Generate falling golden dots
document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("fallingDots");
    const dotCount = 40; // Adjust for more/less density

    const sizes = ["small", "medium", "large"];
    const drifts = ["", "drift-left", "drift-right"];

    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement("div");
        dot.classList.add("dot");

        // Random size
        dot.classList.add(sizes[Math.floor(Math.random() * sizes.length)]);

        // Random drift (30% chance)
        if (Math.random() < 0.3) {
            dot.classList.add(drifts[Math.floor(Math.random() * drifts.length + 1)]);
        }

        // Random horizontal position
        dot.style.left = Math.random() * 100 + "vw";

        // Random delay so they don't all fall at once
        dot.style.animationDelay = Math.random() * 20 + "s";

        container.appendChild(dot);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // --- 1. DOM Element Selectors ---
    const form = document.getElementById('signupForm');
    const createAccountBtn = document.getElementById('create-account-btn');
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('signup-confirm-password');
    const emailInput = document.getElementById('signup-email'); 
    const toggleIcons = document.querySelectorAll('.toggle-password');
    const requiredInputs = form.querySelectorAll('input[required]');
    
    // New Selectors for Feedback Control
    const feedbackContainer = document.getElementById('password-policy-feedback');
    const feedbackMessage = document.getElementById('feedback-message');
    const rulesList = document.getElementById('password-rules');

    // 🔑 NEW Selectors for Modals
    const openTosModalBtn = document.getElementById('openTosModal');
    const closeTosModalBtn = document.getElementById('closeTosModal');
    const tosModal = document.getElementById('tosModal');

    const openPrivacyModalBtn = document.getElementById('openPrivacyModal');
    const closePrivacyModalBtn = document.getElementById('closePrivacyModal');
    const privacyModal = document.getElementById('privacyModal');
    
    // --- NEW STATE VARIABLE ---
    let emailIsRegistered = false;
    let isCheckingEmail = false; 
    
    // --- INITIAL STATE ---
    confirmPasswordInput.disabled = true; // Disable confirm password initially

    
    // 🔑 NEW: Modal Control Functions
    function openModal(modalElement) {
        modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalElement) {
        modalElement.classList.remove('active');
        // Delay overflow reset to allow the transition to finish
        setTimeout(() => {
            if (!tosModal.classList.contains('active') && !privacyModal.classList.contains('active')) {
                document.body.style.overflow = 'auto';
            }
        }, 300); 
    }
    
    // 🔑 NEW: Modal Event Listeners
    if (openTosModalBtn) {
        openTosModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(tosModal);
        });
        closeTosModalBtn.addEventListener('click', function() {
            closeModal(tosModal);
        });
        tosModal.addEventListener('click', function(e) {
            if (e.target === tosModal) {
                closeModal(tosModal);
            }
        });
    }

    if (openPrivacyModalBtn) {
        openPrivacyModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(privacyModal);
        });
        closePrivacyModalBtn.addEventListener('click', function() {
            closeModal(privacyModal);
        });
        privacyModal.addEventListener('click', function(e) {
            if (e.target === privacyModal) {
                closeModal(privacyModal);
            }
        });
    }

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
        const existingError = emailGroup.parentNode.querySelector('.email-error-message'); 
        if (existingError) existingError.remove();
        
        // Check format first
        if (!emailInput.checkValidity()) {
            emailIsRegistered = false; 
            isCheckingEmail = false; 
            checkFormValidity();
            return;
        }

        if (email.length > 0) {
            // Set checking state and disable button temporarily
            isCheckingEmail = true;
            checkFormValidity();
            
            // Debounce the request
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
                        
                        if (emailIsRegistered) {
                            displayError(emailGroup, "This email is already registered.", 'email-error-message');
                        }
                        
                        isCheckingEmail = false;
                        checkFormValidity();
                    })
                    .catch(error => {
                        console.error('Error checking email:', error);
                        emailIsRegistered = false; 
                        isCheckingEmail = false;
                        checkFormValidity();
                    });
            }, 500); // 500ms delay
        } else {
            emailIsRegistered = false;
            isCheckingEmail = false; 
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
        
        const passwordsMatch = password === confirmPasswordInput.value && password !== '';

        const formIsValid = allRequiredFilled && allRulesMet && passwordsMatch && !emailIsRegistered && !isCheckingEmail;

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


    // --- 6. Final Form Submission Handling ---
   
    form.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission

        // Final client-side validation (safety)
        if (createAccountBtn.disabled) {
            return;
        }

        // Optional: Show loading state
        createAccountBtn.disabled = true;
        createAccountBtn.textContent = "Creating Account...";

        try {
            const formData = new FormData(form);

            const response = await fetch('process_signup.php', {
                method: 'POST',
                body: formData
            });

            // Even if PHP does header redirect, we handle it here via JS for better UX
            if (response.redirected && response.url.includes('HomeF.html')) {
                // Success! But we don't want to go to HomeF.html
                // Instead: redirect to Sign-in.html with success message
                window.location.href = 'Sign-in.html?signup=success';
                return;
            }

            // If not redirected (e.g., error output from PHP)
            const text = await response.text();
            console.log('Server response:', text); // For debugging

            // You can enhance this later with a toast/notification
            if (response.ok) {
                // Final success path
                window.location.href = 'Sign-in.html?signup=success';
            } else {
                alert('Signup failed. Please check your information and try again.');
                createAccountBtn.disabled = false;
                createAccountBtn.textContent = "Create Account";
            }

        } catch (error) {
            console.error('Submission error:', error);
            alert('Network error. Please try again.');
            createAccountBtn.disabled = false;
            createAccountBtn.textContent = "Create Account";
        }
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
        
        // Insert after the parent element's group (input-row or float-group)
        inputGroup.parentNode.insertBefore(errorElement, inputGroup.nextSibling);
    }
});