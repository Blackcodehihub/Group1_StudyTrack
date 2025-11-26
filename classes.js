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
    
    // Repeater Container
    const classesListContainer = document.getElementById('classes-list-container'); 

    // Success Modal Elements
    const successModal = document.getElementById('successModal');
    const successCloseBtn = document.getElementById('successCloseBtn');
    const addAnotherClassBtn = document.getElementById('addAnotherClassBtn');
    const viewClassBtn = document.getElementById('viewClassBtn');


    // --- Helper Function: Time Formatting (24hr to 12hr AM/PM) ---
    function formatTime(time24) {
        if (!time24) return '';
        const [hour, minute] = time24.split(':');
        const h = parseInt(hour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedH = h % 12 || 12; 
        return `${formattedH}:${minute} ${ampm}`;
    }

    // --- RENDERER Function: Creates the HTML for the Repeater (No change in logic) ---
    function renderClassItems(classes) {
        if (classes.length === 0) {
            classesListContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--text-dim); border: 1px dashed var(--border); border-radius: 12px; margin-top: 20px;">
                    <p>No classes added yet. Click "+ Add Class" to start building your schedule!</p>
                </div>
            `;
            return;
        }

        const html = classes.map(cls => {
            const days = cls.repeat_days ? cls.repeat_days.split(',').join(' & ') : 'N/A';
            const locationText = cls.location ? `, ${cls.location}` : '';
            const instructorText = cls.instructor ? ` by ${cls.instructor}` : '';
            
            const formattedStartTime = formatTime(cls.start_time);
            const formattedEndTime = formatTime(cls.end_time);
            
            return `
                <div class="class-item" data-class-id="${cls.class_id}">
                    <div class="class-info">
                        <img src="book.png" alt="Book">
                        <div>
                            <h4>${cls.subject_name}${instructorText}</h4>
                            <p>${days} ${formattedStartTime} - ${formattedEndTime}${locationText}</p>
                        </div>
                    </div>
                    <div class="class-time">${formattedStartTime}</div>
                    <button class="delete-btn" data-class-id="${cls.class_id}">×</button>
                </div>
            `;
        }).join('');

        classesListContainer.innerHTML = html;
    }


    // --- FETCH Function: Calls PHP and Renders ---
    function fetchAndRenderClasses() {
        classesListContainer.innerHTML = '<p style="text-align: center; color: var(--text-dim); margin-top: 20px;">Loading classes...</p>';
        
        fetch('fetch_classes.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderClassItems(data.classes);
                } else {
                    classesListContainer.innerHTML = `<p style="text-align: center; color: red; margin-top: 20px;">Error loading classes: ${data.message}</p>`;
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                classesListContainer.innerHTML = '<p style="text-align: center; color: red; margin-top: 20px;">Network error. Could not connect to the server.</p>';
            });
    }

    // --- Initial Load ---
    fetchAndRenderClasses();


    // --- 3. Modal Open/Close Logic (No change) ---

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
        dayButtons.forEach(button => button.classList.remove('active'));
        formMessages.textContent = '';
        saveClassBtn.disabled = true; 
        
        closeModal(successModal);
        
        // Ensure time fields have default values upon reset/open
        startTimeInput.value = "09:00";
        endTimeInput.value = "10:15";
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


    // Success Modal Handlers (No change)
    successCloseBtn.addEventListener('click', () => closeModal(successModal));
    addAnotherClassBtn.addEventListener('click', function() {
        closeModal(successModal);
        openModal(addClassModal);
    });
    viewClassBtn.addEventListener('click', () => {
        closeModal(successModal);
    });


    // --- 4. Client-side Validation and Button Enabling (CRITICAL UPDATE) ---

    function checkFormValidity() {
        let isValid = true;

        // 1. Required field check (Subject Name)
        if (subjectNameInput.value.trim() === '') {
            isValid = false;
        }

        // 2. Required time checks
        if (startTimeInput.value.trim() === '' || endTimeInput.value.trim() === '') {
            isValid = false;
        }

        // 3. Time comparison check
        if (isValid && startTimeInput.value && endTimeInput.value) {
            // Compare time strings (HH:MM format). Must be strictly greater.
            if (startTimeInput.value >= endTimeInput.value) {
                isValid = false;
            }
        }
        
        // 4. Update the button status
        saveClassBtn.disabled = !isValid;
        return isValid;
    }

    // --- 5. Repeat Days Toggle Logic (UPDATED) ---
    let selectedDays = new Set(); 

    dayButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // <--- PREVENT DEFAULT FORM SUBMISSION/RELOAD
            
            const day = this.getAttribute('data-day');
            if (selectedDays.has(day)) {
                selectedDays.delete(day);
                this.classList.remove('active');
            } else {
                selectedDays.add(day);
                this.classList.add('active');
            }
            checkFormValidity(); 
        });
    });

    // Attach listeners for live validation on form inputs
    subjectNameInput.addEventListener('input', checkFormValidity);
    startTimeInput.addEventListener('input', checkFormValidity);
    endTimeInput.addEventListener('input', checkFormValidity);


    // --- 6. Form Submission Handling (AJAX) ---
    addClassForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Final check before sending data
        if (!checkFormValidity()) {
            formMessages.textContent = 'Please fill in required fields and ensure End Time is after Start Time.';
            formMessages.style.color = 'red';
            return;
        }
        // If validation passed, clear messages
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
                    // This catches HTTP 400 (Client error) or 500 (Server error)
                    throw new Error(data.message || 'Server error occurred.');
                }
                return data;
            });
        })
        .then(data => {
            if (data.success) {
                // SUCCESS: Close main modal, show success modal, AND REFRESH LIST
                closeModal(addClassModal);
                openModal(successModal);
                
                fetchAndRenderClasses(); 

            } else {
                // This path should ideally be covered by the throw above, but is a safe fallback
                formMessages.textContent = data.message || 'Failed to add class.';
                if (data.errors) {
                    formMessages.innerHTML += '<ul style="margin-left: 20px; text-align: left;">' + data.errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
                }
                formMessages.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            // Display error from PHP (e.g., "User not logged in" or "Database connection failed")
            formMessages.textContent = `Error: ${error.message}`;
            formMessages.style.color = 'red';
        });
    });
    
    // Initial check when script loads
    checkFormValidity();
});