document.addEventListener('DOMContentLoaded', function() {
    // ... (Existing Selectors) ...
    const subjectNameInput = document.getElementById('subject_name');
    const startTimeInput = document.getElementById('start_time');
    const endTimeInput = document.getElementById('end_time');
    const dayButtons = document.querySelectorAll('.day-btn');
    const formMessages = document.getElementById('form-messages');
    
    // NEW Selector for the Repeater Container
    const classesListContainer = document.getElementById('classes-list-container'); 

    // Success Modal Elements (No change)
    const successModal = document.getElementById('successModal');
    const successCloseBtn = document.getElementById('successCloseBtn');
    const addAnotherClassBtn = document.getElementById('addAnotherClassBtn');
    const viewClassBtn = document.getElementById('viewClassBtn');


    // --- Helper Function: Time Formatting (NEW) ---
    function formatTime(time24) {
        if (!time24) return '';
        const [hour, minute] = time24.split(':');
        const h = parseInt(hour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedH = h % 12 || 12; // Converts 0 to 12
        return `${formattedH}:${minute} ${ampm}`;
    }

    // --- RENDERER Function: Creates the HTML for the Repeater (NEW) ---
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

            return `
                <div class="class-item">
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


    // --- FETCH Function: Calls PHP and Renders (NEW) ---
    function fetchAndRenderClasses() {
        // Display a loading message
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


    // ... (rest of the existing modal control and validation logic) ...
    // Note: The form submission success handler needs a small update:
    
    // --- Update Form Submission Success (Step 5) ---
    addClassForm.addEventListener('submit', function(event) {
        // ... (previous validation code) ...
        
        // Send data via AJAX
        fetch('add_class.php', {
            // ... (previous fetch details) ...
        })
        .then(response => {
            // ... (previous JSON parsing and error handling) ...
        })
        .then(data => {
            if (data.success) {
                // SUCCESS: Close main modal, show success modal, AND REFRESH LIST
                closeModal(addClassModal);
                openModal(successModal);
                
                // *** IMPORTANT: REFRESH THE CLASS LIST ***
                fetchAndRenderClasses(); 

            } else {
                // ... (previous error display) ...
            }
        })
        .catch(error => {
            // ... (previous catch handler) ...
        });
    });
    
    // ... (rest of the existing event listeners and helper functions) ...
});