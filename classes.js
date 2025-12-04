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
    // Removed old formMessages selector
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
    // Removed old editFormMessages selector

    // Success Modals
    const successModal = document.getElementById('successModal');
    const deleteSuccessModal = document.getElementById('deleteSuccessModal'); // NEW
    const validationModal = document.getElementById('validationModal');       // NEW
    
    const addAnotherClassBtn = document.getElementById('addAnotherClassBtn');
    const viewClassBtn = document.getElementById('viewClassBtn'); 
    
    // Validation Modal Elements
    const validationErrorList = document.getElementById('validationErrorList'); // NEW

    // DELETE Modal Selectors
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const deleteCloseBtn = document.getElementById('deleteCloseBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn'); 
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const classToDeleteName = document.getElementById('class-to-delete-name');
    
    // State to track the ID of the class pending deletion
    let currentClassIdToDelete = null; 
    let currentClassToDeleteName = ''; // To show in the success modal

    // --- NEW: Modal Helper Functions ---

    function openModal(modalToOpen) {
        modalToOpen.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalToClose) {
        modalToClose.style.display = 'none';
        // Only reset overflow if no other modal is open
        if (validationModal.style.display === 'none' && successModal.style.display === 'none' && deleteSuccessModal.style.display === 'none') {
             document.body.style.overflow = 'auto';
        }
    }

    // NEW: Function to show the validation error modal
    function showValidationError(errorMessages, contextModalId) {
        validationErrorList.innerHTML = '';
        errorMessages.forEach(msg => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color:#ff4d4f; margin-right: 8px;"></i>${msg}`;
            validationErrorList.appendChild(li);
        });

        // Set the 'Try Again' button to focus on the correct input after closing
        document.getElementById('tryAgainBtn').onclick = () => {
             closeModal(validationModal);
             document.getElementById(contextModalId).style.display = 'flex'; // Re-open original modal
        };
        
        openModal(validationModal);
    }

    // NEW: Function to show the delete success modal
    function showDeleteSuccess(name) {
        document.getElementById('deleteSuccessTitle').textContent = 'Class Deleted';
        document.getElementById('deleteSuccessMessage').innerHTML = `The class "<strong>${name}</strong>" has been permanently removed.`;
        openModal(deleteSuccessModal);
    }
    
    // --- Existing Helper Functions ---
    
    function formatTime(time24) {
        if (!time24) return '';
        const [hour, minute] = time24.split(':');
        const h = parseInt(hour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedH = h % 12 || 12; 
        return `${formattedH}:${minute} ${ampm}`;
    }

    // --- RENDERER Function ---
    function renderClassItems(classes) {
        // ... (Renderer logic remains the same) ...
        if (classes.length === 0) {
            classesListContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--text-dim); border: 1px dashed var(--border); border-radius: 12px; margin-top: 20px;">
                    <p>No classes added yet. Click "+ Add Class" to start building your schedule!</p>
                </div>
            `;
            return;
        }
        // ... (Map and loop logic remains the same) ...
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


    // --- FETCH Function ---
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

    // --- 2. Modal Open/Close Logic & Handlers ---

    function resetForm(form) {
        form.reset();
        if (form.id === 'add-class-form') {
            selectedDays.clear();
            dayButtons.forEach(button => button.classList.remove('active'));
            // Removed formMessages usage
            saveClassBtn.disabled = true; 
            startTimeInput.value = "09:00";
            endTimeInput.value = "10:15";
        }
        closeModal(successModal);
        closeModal(deleteSuccessModal); // Close the new success modal too
        closeModal(validationModal); // Close validation modal
    }

    // Attach listeners - ADD CLASS MODAL
    openModalBtn.addEventListener('click', function() {
        openModal(addClassModal);
        resetForm(addClassForm);
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

    // NEW: VALIDATION MODAL HANDLER (close button only)
    document.getElementById('closeValidationModal').addEventListener('click', () => {
        closeModal(validationModal);
    });
    
    // NEW: DELETE SUCCESS MODAL HANDLERS
    document.getElementById('deleteSuccessCloseBtn').addEventListener('click', () => closeModal(deleteSuccessModal));
    document.getElementById('deleteViewClassesBtn').addEventListener('click', () => closeModal(deleteSuccessModal));


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

    // --- 3. Client-side Validation (for Add Form) ---

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

    // ... (day button logic remains the same) ...
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
    // ... (input listeners for validation remain the same) ...
    subjectNameInput.addEventListener('input', checkFormValidity);
    startTimeInput.addEventListener('input', checkFormValidity);
    endTimeInput.addEventListener('input', checkFormValidity);


    // --- 5. Add Class Form Submission (AJAX) ---
    addClassForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // ❌ OLD: Removed inline form message logic

        // 1. Client-side Validation check
        if (!checkFormValidity()) {
            const errors = [];
            if (subjectNameInput.value.trim() === '') errors.push("Subject name is required.");
            if (startTimeInput.value.trim() === '') errors.push("Start Time is required.");
            if (endTimeInput.value.trim() === '') errors.push("End Time is required.");
            if (startTimeInput.value && endTimeInput.value && startTimeInput.value >= endTimeInput.value) {
                errors.push("End Time must be after Start Time.");
            }
            showValidationError(errors, 'addClassModal'); // Show validation modal
            return;
        }
        
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
                    throw { status: response.status, data: data };
                }
                return data;
            });
        })
        .then(data => {
            if (data.success) {
                closeModal(addClassModal);
                // Update success modal content for Add Class
                document.getElementById('classSuccessTitle').textContent = 'Class Added!';
                document.getElementById('classSuccessMessage').innerHTML = `The class "<strong>${subjectNameInput.value.trim()}</strong>" has been added to your schedule.`;
                openModal(successModal);
                fetchAndRenderClasses(); 
            } else {
                // If success: false is returned (e.g., failed server-side validation/logic)
                const serverErrors = data.errors || [data.message || 'Failed to add class due to server issue.'];
                showValidationError(serverErrors, 'addClassModal');
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            const errorMessages = error.data && error.data.errors ? error.data.errors : [(error.data && error.data.message) || 'Network error or unhandled exception.'];
            showValidationError(errorMessages, 'addClassModal');
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
        
        editClassForm.editSelectedDays = editSelectedDays; 

        // 3. Attach live validation listeners for edit fields
        editSubjectNameInput.oninput = checkEditFormValidity;
        editStartTimeInput.oninput = checkEditFormValidity;
        editEndTimeInput.oninput = checkEditFormValidity;
        
        // 4. Validate and open
        checkEditFormValidity();
        // Removed inline message element usage
        openModal(editClassModal);
    }
    
    // Form submission handler for EDIT
    editClassForm.addEventListener('submit', handleEditFormSubmission);
    
    function handleEditFormSubmission(event) {
        event.preventDefault();

        // 1. Client-side Validation check
        if (!checkEditFormValidity()) {
            const errors = [];
            if (editSubjectNameInput.value.trim() === '') errors.push("Subject name is required.");
            if (editStartTimeInput.value.trim() === '') errors.push("Start Time is required.");
            if (editEndTimeInput.value.trim() === '') errors.push("End Time is required.");
            if (editStartTimeInput.value && editEndTimeInput.value && editStartTimeInput.value >= editEndTimeInput.value) {
                errors.push("End Time must be after Start Time.");
            }
            showValidationError(errors, 'editClassModal'); // Show validation modal
            return;
        }

        // --- CRITICAL TIME CLEANING FIX START ---
        function cleanTimeValue(timeString) {
            if (!timeString) return '';
            const match = timeString.match(/(\d{1,2}:\d{2})/);
            if (match) { return match[1]; }
            return timeString.trim();
        }

        const currentStartTime = editStartTimeInput.value;
        const currentEndTime = editEndTimeInput.value;

        // Temporarily overwrite the input values with the cleaned 24hr version.
        editStartTimeInput.value = cleanTimeValue(currentStartTime);
        editEndTimeInput.value = cleanTimeValue(currentEndTime);
        // --- CRITICAL TIME CLEANING FIX END ---

        const formData = new FormData(editClassForm);
        
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
            editStartTimeInput.value = currentStartTime;
            editEndTimeInput.value = currentEndTime;

            return response.json().then(data => {
                if (!response.ok) {
                    throw { status: response.status, data: data };
                }
                return data;
            });
        })
        .then(data => {
            if (data.success) {
                closeModal(editClassModal);
                // Update success modal content for Edit Class
                document.getElementById('classSuccessTitle').textContent = 'Changes Saved!';
                document.getElementById('classSuccessMessage').innerHTML = `The class "<strong>${editSubjectNameInput.value.trim()}</strong>" has been successfully updated.`;
                openModal(successModal); 
                fetchAndRenderClasses(); 
            } else {
                // If success: false is returned (e.g., no changes detected)
                const serverErrors = [data.message || 'Failed to update class.'];
                showValidationError(serverErrors, 'editClassModal');
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            const errorMessages = error.data && error.data.errors ? error.data.errors : [(error.data && error.data.message) || 'Network error or unhandled exception.'];
            showValidationError(errorMessages, 'editClassModal');
        });
    }
    
    // --- 8. DELETE WORKFLOW LISTENERS ---

    function attachDeleteListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-class-id');
                const name = this.getAttribute('data-subject-name');
                
                currentClassIdToDelete = id;
                currentClassToDeleteName = name; // Store name for success modal
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
        .then(response => {
            return response.json().then(data => {
                if (!response.ok) {
                    throw { status: response.status, data: data };
                }
                return data;
            });
        })
        .then(data => {
            if (data.success) {
                closeModal(deleteConfirmationModal);
                showDeleteSuccess(currentClassToDeleteName); // Show NEW success modal
                fetchAndRenderClasses(); 
            } else {
                // Display the server message from PHP (e.g., 'Class not found' or 'Failed to delete')
                const serverErrors = [data.message || 'Deletion failed.'];
                showValidationError(serverErrors, 'deleteConfirmationModal');
            }
        })
        .catch(error => {
            console.error('Deletion error:', error);
            const errorMessages = error.data && error.data.errors ? error.data.errors : [(error.data && error.data.message) || 'Network error or unhandled exception.'];
            showValidationError(errorMessages, 'deleteConfirmationModal');
        })
        .finally(() => {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete Permanently';
            currentClassIdToDelete = null;
            currentClassToDeleteName = '';
        });
    });
    
    // --- Initial Load ---
    fetchAndRenderClasses(); 
});