document.addEventListener('DOMContentLoaded', function() {
    // --- 1. DOM Element Selectors ---
    const addClassModal = document.getElementById('addClassModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelBtn');
    const addClassForm = document.getElementById('add-class-form');
    const saveClassBtn = document.getElementById('save-class-btn');
    
    // Form Inputs & Feedback
    const subjectNameInput = document.getElementById('subject_name');
    const startTimeInput = document.getElementById('start_time');
    const endTimeInput = document.getElementById('end_time');
    const dayButtons = document.querySelectorAll('.day-btn');
    const formMessages = document.getElementById('form-messages');
    const classesListContainer = document.getElementById('classes-list-container'); 

    // EDIT Modal Selectors
    const editClassModal = document.getElementById('editClassModal');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editClassForm = document.getElementById('edit-class-form');
    const saveEditClassBtn = document.getElementById('save-edit-class-btn');
    const editClassTitle = document.getElementById('editClassTitle');
    const editSubjectNameInput = document.getElementById('edit_subject_name');
    const editStartTimeInput = document.getElementById('edit_start_time');
    const editEndTimeInput = document.getElementById('edit_end_time');
    const editDayButtons = document.querySelectorAll('#editClassModal .day-btn');
    const editFormMessages = document.getElementById('edit-form-messages');

    // Success Modal Elements
    const successModal = document.getElementById('successModal');
    const addAnotherClassBtn = document.getElementById('addAnotherClassBtn');
    const viewClassBtn = document.getElementById('viewClassBtn'); 
    
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
            
            const formattedStartTime = formatTime(cls.start_time);
            const formattedEndTime = formatTime(cls.end_time);
            
            return `
                <div class="class-item" data-class-id="${cls.class_id}">
                    <div class="class-info">
                        <img src="images_icons/book.png" alt="Book">
                        <div>
                            <h4>${cls.subject_name}${instructorText}</h4>
                            <p>${days} ${formattedStartTime} - ${formattedEndTime}${locationText}</p>
                        </div>
                    </div>
                    <div class="class-time">${formattedStartTime}</div>

                    <button class="edit-btn" title="Edit Class" data-class-id="${cls.class_id}" data-subject-name="${cls.subject_name}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5l4 4L7 21l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                    </button>
                    <button class="delete-btn" data-class-id="${cls.class_id}" data-subject-name="${cls.subject_name}">x</button>
                </div>
            `;
        }).join('');

        classesListContainer.innerHTML = html;
        
        attachDeleteListeners(); 
        attachEditListeners(classes); 
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
        
        startTimeInput.value = "09:00";
        endTimeInput.value = "10:15";
    }

    // Attach listeners - ADD CLASS MODAL
    openModalBtn.addEventListener('click', function() {
        openModal(addClassModal);
        resetForm();
        checkFormValidity();
    });
    closeModalBtn.addEventListener('click', () => closeModal(addClassModal));
    cancelModalBtn.addEventListener('click', () => closeModal(addClassModal));

    // Attach listeners - EDIT CLASS MODAL
    closeEditModalBtn.addEventListener('click', () => closeModal(editClassModal));
    cancelEditBtn.addEventListener('click', () => closeModal(editClassModal));

    // Attach listeners - DELETE CONFIRMATION MODAL
    deleteCloseBtn.addEventListener('click', () => closeModal(deleteConfirmationModal));
    cancelDeleteBtn.addEventListener('click', () => closeModal(deleteConfirmationModal)); 

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
            closeModal(deleteConfirmationModal); 
        });
    });

    addAnotherClassBtn.addEventListener('click', function() {
        closeModal(successModal);
        openModal(addClassModal);
    });
    
    if (viewClassBtn) {
        viewClassBtn.addEventListener('click', function() {
            closeModal(successModal);
        });
    }

    // --- 3. Client-side Validation ---

    function checkFormValidity() {
        let isValid = true;
        
        if (subjectNameInput.value.trim() === '' || startTimeInput.value.trim() === '' || endTimeInput.value.trim() === '') {
            isValid = false;
        }

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

    // --- Helper function for edit validation ---
    function checkEditFormValidity() {
        let isValid = true;
        
        if (editSubjectNameInput.value.trim() === '' || editStartTimeInput.value.trim() === '' || editEndTimeInput.value.trim() === '') {
            isValid = false;
        }

        if (isValid && editStartTimeInput.value && editEndTimeInput.value) {
            if (editStartTimeInput.value >= editEndTimeInput.value) { 
                isValid = false;
            }
        }
        
        saveEditClassBtn.disabled = !isValid;
        return isValid;
    }

    // --- 7. EDIT WORKFLOW LISTENERS & FUNCTIONS ---
    
    let currentEditClass = null; 

    function attachEditListeners(classes) {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-class-id');
                const classData = classes.find(c => c.class_id === id); 
                
                if (classData) {
                    openEditModal(classData);
                }
            });
        });
    }

    function openEditModal(cls) {
        currentEditClass = cls;
        
        // 1. Populate fields
        document.getElementById('edit_class_id').value = cls.class_id;
        editClassTitle.textContent = cls.subject_name;
        editSubjectNameInput.value = cls.subject_name || '';
        document.getElementById('edit_instructor').value = cls.instructor || '';
        document.getElementById('edit_location').value = cls.location || '';
        editStartTimeInput.value = cls.start_time || '09:00';
        editEndTimeInput.value = cls.end_time || '10:15';
        document.getElementById('edit_reminder_time').value = cls.reminder_time_minutes ? String(cls.reminder_time_minutes) : ''; 
        
        // 2. Set Repeat Days buttons and initialize the state
        const daysArray = cls.repeat_days ? cls.repeat_days.split(',') : [];
        const editSelectedDays = new Set(daysArray); 

        editDayButtons.forEach(button => {
            const day = button.getAttribute('data-day');
            
            // Reset/set the visual state based on existing days
            button.classList.remove('active');
            if (editSelectedDays.has(day)) {
                button.classList.add('active');
            }
            
            // Setup click handler for toggling days
            button.onclick = function(e) {
                e.preventDefault(); 
                if (editSelectedDays.has(day)) {
                    editSelectedDays.delete(day);
                    this.classList.remove('active');
                } else {
                    editSelectedDays.add(day);
                    this.classList.add('active');
                }
                checkEditFormValidity(); 
            };
        });
        
        // CRITICAL FIX: Store the Set directly on the form element for easy access in the submit handler
        editClassForm.editSelectedDays = editSelectedDays; 

        // 3. Attach live validation listeners for edit fields
        editSubjectNameInput.oninput = checkEditFormValidity;
        editStartTimeInput.oninput = checkEditFormValidity;
        editEndTimeInput.oninput = checkEditFormValidity;
        
        // 4. Validate and open
        checkEditFormValidity();
        editFormMessages.textContent = '';
        openModal(editClassModal);
    }
    
    // Form submission handler for EDIT
    editClassForm.addEventListener('submit', handleEditFormSubmission);
    
    function handleEditFormSubmission(event) {
        event.preventDefault();

        if (!checkEditFormValidity()) {
            editFormMessages.textContent = 'Please fill in required fields and ensure End Time is after Start Time.';
            editFormMessages.style.color = 'red';
            return;
        }

        editFormMessages.textContent = ''; 

        // --- CRITICAL FIX START: Defensive Time Cleaning ---
        
        // Helper function to extract ONLY HH:MM using a robust regex.
        function cleanTimeValue(timeString) {
            if (!timeString) return '';
            
            // Regex to find and capture HH:MM, even if followed by AM/PM or other text.
            // (\d{1,2}:\d{2}) captures the time format.
            const match = timeString.match(/(\d{1,2}:\d{2})/);
            
            // If the time is found, return the captured group (HH:MM).
            if (match) {
                return match[1];
            }
            
            // If the time string is already clean (e.g., '13:00'), return it.
            // If it's empty or invalid, this ensures we don't send extra text.
            return timeString.trim();
        }

        // Get the current values from the inputs
        const currentStartTime = editStartTimeInput.value;
        const currentEndTime = editEndTimeInput.value;

        // Temporarily overwrite the input values with the cleaned 24hr version.
        // This ensures FormData captures the correct HH:MM format for *both* fields.
        editStartTimeInput.value = cleanTimeValue(currentStartTime);
        editEndTimeInput.value = cleanTimeValue(currentEndTime);
        
        // --- CRITICAL FIX END ---

        const formData = new FormData(editClassForm);
        
        // CRITICAL FIX: Check the state stored in openEditModal and append days
        if (editClassForm.editSelectedDays) {
            editClassForm.editSelectedDays.forEach(day => {
                formData.append('repeat_days[]', day); 
            });
        }
        
        fetch('update_class.php', { 
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            // Restore original, formatted values immediately after the fetch attempt.
            // This is crucial for the UI display if the update fails or the modal remains open.
            editStartTimeInput.value = currentStartTime;
            editEndTimeInput.value = currentEndTime;

            // Check the HTTP status first
            return response.json().then(data => {
                if (!response.ok) {
                    throw new Error(data.message || 'Server error occurred.');
                }
                return data;
            });
        })
        .then(data => {
            if (data.success) {
                closeModal(editClassModal);
                openModal(successModal); 
                fetchAndRenderClasses(); 
            } else {
                editFormMessages.textContent = data.message || 'Failed to update class.';
                if (data.errors) {
                    editFormMessages.innerHTML += '<ul style="margin-left: 20px; text-align: left;">' + data.errors.map(err => `<li>${err}</li>`).join('') + '</ul>';
                }
                editFormMessages.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            editFormMessages.textContent = `Error: ${error.message}`;
            editFormMessages.style.color = 'red';
        });
    }
    
    // --- 8. DELETE WORKFLOW LISTENERS ---

    function attachDeleteListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-class-id');
                const name = this.getAttribute('data-subject-name');
                
                currentClassIdToDelete = id;
                classToDeleteName.textContent = name;

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
                closeModal(deleteConfirmationModal);
                fetchAndRenderClasses(); 
            } else {
                // Display the server message from PHP 
                alert('Deletion Failed: ' + data.message);
                closeModal(deleteConfirmationModal);
            }
        })
        .catch(error => {
            console.error('Deletion error:', error);
            alert('An unexpected network error or server error occurred. Please check server logs.'); 
            closeModal(deleteConfirmationModal); 
        })
        .finally(() => {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete Permanently';
            currentClassIdToDelete = null;
        });
    });
    
    // --- Initial Load ---
    fetchAndRenderClasses(); 
});