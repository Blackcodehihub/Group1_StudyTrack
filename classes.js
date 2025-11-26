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
    
    // Feedback & Repeater
    const formMessages = document.getElementById('form-messages');
    const classesListContainer = document.getElementById('classes-list-container'); 

    // Success Modal Elements
    const successModal = document.getElementById('successModal');
    
    // DELETE Modal Selectors
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const deleteCloseBtn = document.getElementById('deleteCloseBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const classToDeleteName = document.getElementById('class-to-delete-name');
    
    // State to track the ID of the class pending deletion
    let currentClassIdToDelete = null; 


    // --- Helper Function: Time Formatting (24hr to 12hr AM/PM) ---
    function formatTime(time24) {
        if (!time24) return '';
        const [hour, minute] = time24.split(':');
        const h = parseInt(hour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedH = h % 12 || 12; 
        return `${formattedH}:${minute} ${ampm}`;
    }

    // --- RENDERER Function: Creates the HTML for the Repeater ---
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
            
            // Format times for display
            const formattedStartTime = formatTime(cls.start_time);
            const formattedEndTime = formatTime(cls.end_time);
            
            // Ensure class_id is available for the delete button
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
                    <button class="delete-btn" data-class-id="${cls.class_id}" data-subject-name="${cls.subject_name}">×</button>
                </div>
            `;
        }).join('');

        classesListContainer.innerHTML = html;
        
        // CRITICAL: Attach listeners *after* rendering the new buttons
        attachDeleteListeners(); 
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


    // Success Modal Handlers
    document.querySelectorAll('.success-modal .close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(successModal);
            closeModal(deleteConfirmationModal); // Ensure both can be closed by the X
        });
    });

    addAnotherClassBtn.addEventListener('click', function() {
        closeModal(successModal);
        openModal(addClassModal);
    });

    // --- 3. Client-side Validation and Button Enabling ---

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
        button.addEventListener('click', function(e) {
            e.preventDefault(); 
            
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

    // Attach listeners for live validation
    subjectNameInput.addEventListener('input', checkFormValidity);
    startTimeInput.addEventListener('input', checkFormValidity);
    endTimeInput.addEventListener('input', checkFormValidity);


    // --- 5. Add Class Form Submission (AJAX) ---
    addClassForm.addEventListener('submit', function(event) {
        event.preventDefault();

        if (!checkFormValidity()) {
            formMessages.textContent = 'Please fill in required fields and ensure End Time is after Start Time.';
            formMessages.style.color = 'red';
            return;
        }

        formMessages.textContent = ''; 

        const formData = new FormData(addClassForm);
        
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
                // SUCCESS: Close main modal, show success modal, AND REFRESH LIST
                closeModal(addClassModal);
                openModal(successModal);
                fetchAndRenderClasses(); 
            } else {
                formMessages.textContent = data.message || 'Failed to add class.';
                if (data.errors) {
                    formMessages.innerHTML += '<ul style="margin-left: 20px; text-align: left;">' + data.errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
                }
                formMessages.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            formMessages.textContent = `Error: ${error.message}`;
            formMessages.style.color = 'red';
        });
    });
    
    // --- 6. DELETE WORKFLOW LISTENERS (NEW) ---

    function attachDeleteListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-class-id');
                const name = this.getAttribute('data-subject-name');
                
                // Store the ID in the global state
                currentClassIdToDelete = id;

                // Update the modal text
                classToDeleteName.textContent = name;

                // Show the confirmation modal
                openModal(deleteConfirmationModal);
            });
        });
    }

    // AJAX Delete Execution
    confirmDeleteBtn.addEventListener('click', function() {
        if (!currentClassIdToDelete) return; 

        const formData = new FormData();
        formData.append('class_id', currentClassIdToDelete);
        
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Deleting...';

        fetch('delete_class.php', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Successful deletion: Close modal and refresh list
                closeModal(deleteConfirmationModal);
                fetchAndRenderClasses(); 
            } else {
                // Display error (e.g., "Class not found or access denied")
                alert('Deletion Failed: ' + data.message);
                closeModal(deleteConfirmationModal);
            }
        })
        .catch(error => {
            console.error('Deletion error:', error);
            alert('An unexpected network error occurred.');
        })
        .finally(() => {
            // Reset button and state
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete Permanently';
            currentClassIdToDelete = null;
        });
    });
});