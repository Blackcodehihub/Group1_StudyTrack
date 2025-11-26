document.addEventListener('DOMContentLoaded', function() {
    // --- 1. DOM Element Selectors ---
    const addClassModal = document.getElementById('addClassModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelBtn');
    const addClassForm = document.getElementById('add-class-form');
    const saveClassBtn = document.getElementById('save-class-btn');
    
    // Form Inputs
    const subjectNameInput = document.getElementById('subject_name');
    const startTimeInput = document.getElementById('start_time');
    const endTimeInput = document.getElementById('end_time');
    const dayButtons = document.querySelectorAll('.day-btn');
    
    // Feedback
    const formMessages = document.getElementById('form-messages');

    // Success Modal Elements
    const successModal = document.getElementById('successModal');
    const successCloseBtn = document.getElementById('successCloseBtn');
    const addAnotherClassBtn = document.getElementById('addAnotherClassBtn');
    const viewClassBtn = document.getElementById('viewClassBtn');


    // --- 2. Modal Open/Close Logic ---

    function openModal(modalToOpen) {
        modalToOpen.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalToClose) {
        modalToClose.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function resetForm() {
        addClassForm.reset();
        selectedDays.clear();
        dayButtons.forEach(button => button.classList.remove('active')); // Use 'active' class from your CSS
        formMessages.textContent = '';
        saveClassBtn.disabled = true; 
        
        // Hide the success modal if open
        closeModal(successModal);
    }

    // Attach listeners
    openModalBtn.addEventListener('click', function() {
        openModal(addClassModal);
        resetForm();
        checkFormValidity();
    });
    closeModalBtn.addEventListener('click', () => closeModal(addClassModal));
    cancelModalBtn.addEventListener('click', () => closeModal(addClassModal));

    // Close on overlay click
    addClassModal.addEventListener('click', function(event) {
        if (event.target === addClassModal) {
            closeModal(addClassModal);
        }
    });


    // Success Modal Handlers
    successCloseBtn.addEventListener('click', () => closeModal(successModal));
    addAnotherClassBtn.addEventListener('click', function() {
        closeModal(successModal);
        openModal(addClassModal); // Opens main modal again
    });
    viewClassBtn.addEventListener('click', () => {
        closeModal(successModal);
        // Future: Logic to navigate or scroll to the new class
    });


    // --- 3. Client-side Validation and Button Enabling ---

    function checkFormValidity() {
        let isValid = true;

        // Check required fields: Subject Name, Start Time, End Time
        if (subjectNameInput.value.trim() === '' || startTimeInput.value.trim() === '' || endTimeInput.value.trim() === '') {
            isValid = false;
        }

        // Time comparison (End Time must be after Start Time)
        if (startTimeInput.value && endTimeInput.value) {
            // Compare time strings (HH:MM format)
            if (startTimeInput.value >= endTimeInput.value) {
                isValid = false;
            }
        }
        
        saveClassBtn.disabled = !isValid;
        return isValid;
    }

    // --- 4. Repeat Days Toggle Logic ---
    let selectedDays = new Set(); 

    dayButtons.forEach(button => {
        button.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            if (selectedDays.has(day)) {
                selectedDays.delete(day);
                this.classList.remove('active'); // Use 'active' from your CSS
            } else {
                selectedDays.add(day);
                this.classList.add('active');
            }
            checkFormValidity(); 
        });
    });

    // Attach listeners for live validation
    subjectNameInput.addEventListener('input', checkFormValidity);
    startTimeInput.addEventListener('input', checkFormValidity);
    endTimeInput.addEventListener('input', checkFormValidity);
    // Other optional inputs (instructor, location) do not affect button state, so no listeners needed.


    // --- 5. Form Submission Handling (AJAX) ---
    addClassForm.addEventListener('submit', function(event) {
        event.preventDefault();

        if (!checkFormValidity()) {
            formMessages.textContent = 'Please fill in required fields and ensure End Time is after Start Time.';
            formMessages.style.color = 'red';
            return;
        }

        formMessages.textContent = ''; 

        // Collect all form data
        const formData = new FormData(addClassForm);
        
        // Add selected repeat days array
        selectedDays.forEach(day => {
            formData.append('repeat_days[]', day); 
        });

        // Send data via AJAX
        fetch('add_class.php', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            return response.json().then(data => {
                if (!response.ok) {
                    throw new Error(data.message || 'Server error occurred.');
                }
                return data;
            });
        })
        .then(data => {
            if (data.success) {
                // SUCCESS: Close main modal and show success modal
                closeModal(addClassModal);
                openModal(successModal);
            } else {
                // Validation failed on server-side (PHP)
                formMessages.textContent = data.message || 'Failed to add class.';
                if (data.errors) {
                    formMessages.innerHTML += '<ul style="margin-left: 20px; text-align: left;">' + data.errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
                }
                formMessages.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            formMessages.textContent = `An unexpected error occurred: ${error.message}`;
            formMessages.style.color = 'red';
        });
    });

    // Initial check when script loads
    checkFormValidity();
});