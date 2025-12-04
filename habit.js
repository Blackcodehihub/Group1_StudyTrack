// ==============================
// habit.js – FULLY RESTORED + COMPLETION LOGIC + ERROR HANDLING
// ==============================

document.addEventListener('DOMContentLoaded', () => {
    console.log('habit.js loaded successfully');

    // ===== THEME TOGGLE
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');

    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.src = 'images_icons/moon.png';
    } else {
        themeIcon.src = 'images_icons/sun.png';
    }

    themeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        themeIcon.src = isLight ? 'images_icons/moon.png' : 'images_icons/Sun.png';
    });

    // HAMBURGER MENU
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');

    hamburgerBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('shift');
    });

    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== hamburgerBtn) {
            sidebar.classList.remove('active');
            mainContent.classList.remove('shift');
        }
    });

    // OPEN ADD HABIT MODAL
    document.getElementById('openModalBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('addClassModal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Reset form
        document.getElementById('habitName').value = '';
        document.querySelectorAll('.day-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('startTime').value = '09:00';
        document.getElementById('endTime').value = '09:30';
        document.getElementById('reminderOption').value = 'None';
    });

    // Add global event listener for closing modals
    document.addEventListener('click', (e) => {
        // Close on X button click
        if (e.target.classList.contains('close-modal')) {
            const modal = e.target.closest('.modal-overlay');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
        
        // Close on Cancel button click
        if (e.target.classList.contains('btn-cancel')) {
            const modal = e.target.closest('.modal-overlay');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
        
        // Close on overlay click (except success modal)
        if (e.target.classList.contains('modal-overlay')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // SUCCESS MODAL BUTTONS
    document.getElementById('addAnotherClassBtn')?.addEventListener('click', () => {
        document.getElementById('successModal').style.display = 'none';
        document.getElementById('addClassModal').style.display = 'flex';
    });

    document.getElementById('viewClassBtn')?.addEventListener('click', () => {
        document.getElementById('successModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // SAVE HABIT BUTTON
    document.getElementById('saveHabitBtn')?.addEventListener('click', () => {
        const name = document.getElementById('habitName').value.trim();
        const activeDays = document.querySelectorAll('.day-btn.active');
        const repeatDays = Array.from(activeDays)
            .map(btn => btn.dataset.day)
            .join(',') || 'Mon';
        const startTime = document.getElementById('startTime').value + ':00';
        const endTime = document.getElementById('endTime').value + ':00';
        const reminder = document.getElementById('reminderOption').value;

        // Validation
        // WITH THIS (add this function first if not already defined):
        function showValidationError(message) {
            document.getElementById('validationMessage').textContent = message;
            document.getElementById('validationModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        // Then use it in your save button:
        if (!name) {
            showValidationError('Habit name is required.');
            return;
        }
        if (activeDays.length === 0) {
            showValidationError('Please select at least one day to repeat the habit.');
            return;
        }
        fetch('habit.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                habit_name: name,
                repeat_days: repeatDays,
                start_time: startTime,
                end_time: endTime,
                reminder_option: reminder
            })
        })
        .then(r => {
            if (!r.ok) {
                throw new Error(`HTTP error! status: ${r.status}`);
            }
            return r.json();
        })
        .then(data => {
            console.log('Saved successfully:', data);
            document.getElementById('addClassModal').style.display = 'none';
            document.getElementById('successModal').style.display = 'flex';
            loadHabits();
        })
        .catch(err => {
            console.error('Save failed:', err);
            alert('Failed to save habit. Check browser console (F12) for details.');
        });
        // ✅ VALIDATION MODAL HANDLERS (ADD THESE TO YOUR HABIT.JS)
        document.getElementById('closeValidationModal').addEventListener('click', () => {
            document.getElementById('validationModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        document.getElementById('cancelValidationBtn').addEventListener('click', () => {
            document.getElementById('validationModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        document.getElementById('tryAgainBtn').addEventListener('click', () => {
            document.getElementById('validationModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            // Optionally focus back on the first invalid field, e.g., habit name
            document.getElementById('habitName')?.focus();
        });
        // Add this to your existing event listeners in habit.js
        document.getElementById('cancelValidationBtn')?.addEventListener('click', () => {
            document.getElementById('validationModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });

    // LOAD HABITS ON PAGE LOAD
    loadHabits();

    // CREATE EDIT & DELETE MODALS
    createEditAndDeleteModals();
});

// CREATE EDIT & DELETE MODALS
function createEditAndDeleteModals() {
    const editModalHTML = `
    <div class="modal-overlay" id="editHabitModal" style="display:none;">
        <div class="modal">
            <div class="modal-header">
                <h3>Edit Habit</h3>
                <button class="close-modal">✕</button>
            </div>
            <input type="hidden" id="editHabitId">
            <label>Habit Name</label>
            <input type="text" id="editHabitName" placeholder="e.g. Morning Reading">
            <label>Repeat</label>
            <div class="repeat-days" id="editRepeatDays">
                ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => 
                    `<button type="button" class="day-btn" data-day="${day}">${day}</button>`
                ).join('')}
            </div>
            <div class="time-row">
                <div><label>Start Time</label><input type="time" id="editStartTime"></div>
                <div><label>End Time</label><input type="time" id="editEndTime"></div>
            </div>
            <label>Remind me</label>
            <div class="reminder-row">
                <select id="editReminder">
                    <option>15 mins before</option>
                    <option>30 mins before</option>
                    <option>1 hour before</option>
                    <option>None</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel">Cancel</button>
                <button class="btn-save" id="saveEditHabitBtn">Save Changes</button>
            </div>
        </div>
    </div>`;

    // Replace this part in createEditAndDeleteModals() function
    const deleteModalHTML = `
    <div class="modal-overlay" id="deleteHabitModal" style="display:none;">
        <div class="modal delete-modal">
            <div class="modal-header">
                <button class="close-modal" id="closeDeleteModal">✕</button>
            </div>
            <!-- YOUR EXACT SVG (triangle warning sign with !) -->
            <div class="warning-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            </div>
            <h3>Delete Habit?</h3>
            <p id="deleteHabitMessage">Are you sure you want to delete <strong id="deleteHabitName"></strong>?<br>This action cannot be undone.</p>
            <div class="modal-actions">
                <button class="btn-cancel" id="cancelDeleteBtn">Cancel</button>
                <button class="btn-save" id="confirmDeleteBtn">Delete Permanently</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', editModalHTML + deleteModalHTML);

    // Add event listeners for the newly created modals
    addModalEventListeners();
}

function addModalEventListeners() {
    // Add Modal - Day buttons toggle (now matches edit modal styling)
    document.querySelectorAll('.repeat-days .day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });

    // Edit Modal - Day buttons toggle (FIXED: Yellow when active, gray when inactive)
    document.querySelectorAll('#editRepeatDays .day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });

    // Edit Modal - Save button
    document.getElementById('saveEditHabitBtn')?.addEventListener('click', () => {
        const id = document.getElementById('editHabitId').value;
        const name = document.getElementById('editHabitName').value.trim();
        const activeDays = document.querySelectorAll('#editRepeatDays .day-btn.active');
        const repeatDays = Array.from(activeDays)
            .map(btn => btn.dataset.day)
            .join(',') || 'Mon';
        const startTime = document.getElementById('editStartTime').value + ':00';
        const endTime = document.getElementById('editEndTime').value + ':00';
        const reminder = document.getElementById('editReminder').value;

        // Validation
        // WITH THIS (add this function first if not already defined):
        function showValidationError(message) {
            document.getElementById('validationMessage').textContent = message;
            document.getElementById('validationModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        // Then use it in your save button:
        if (!name) {
            showValidationError('Habit name is required.');
            return;
        }
        if (activeDays.length === 0) {
            showValidationError('Please select at least one day to repeat the habit.');
            return;
        }

        fetch('habit.php?id=' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                habit_name: name,
                repeat_days: repeatDays,
                start_time: startTime,
                end_time: endTime,
                reminder_option: reminder
            })
        })
        .then(r => {
            if (!r.ok) {
                throw new Error(`HTTP error! status: ${r.status}`);
            }
            return r.json();
        })
        .then(data => {
            console.log('Updated successfully:', data);
            document.getElementById('editHabitModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            loadHabits();
        })
        .catch(err => {
            console.error('Update failed:', err);
            alert('Failed to update habit. Check console for details.');
        });
    });

    // DELETE MODAL HANDLERS - MATCHES REMINDER.HTML EXACTLY
        document.getElementById('closeDeleteModal')?.addEventListener('click', () => {
            document.getElementById('deleteHabitModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            window.currentDeleteId = null; // Reset the global variable
        });

        document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
            document.getElementById('deleteHabitModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            window.currentDeleteId = null; // Reset the global variable
        });

        document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
            const id = window.currentDeleteId;
            if (!id) return;

            fetch('habit.php?id=' + id, { method: 'DELETE' })
                .then(r => {
                    if (r.ok) {
                        document.getElementById('deleteHabitModal').style.display = 'none';
                        document.body.style.overflow = 'auto';
                        window.currentDeleteId = null; // Reset the global variable
                        loadHabits();
                    } else {
                        throw new Error('Delete failed');
                    }
                })
                .catch(err => {
                    console.error('Delete failed:', err);
                    // Show validation error instead of alert
                    showValidationError('Failed to delete habit. Check console for details.');
                    document.getElementById('deleteHabitModal').style.display = 'none';
                    document.body.style.overflow = 'auto';
                    window.currentDeleteId = null; // Reset the global variable
                });
        });

    // Apply glow effects to all buttons
    applyGlowEffects();
}

// Apply glow hover effects to all buttons
function applyGlowEffects() {
    // Add glow effect to Add Habit button (same as assignment page)
    const addHabitBtn = document.getElementById('openModalBtn');
    if (addHabitBtn) {
        addHabitBtn.addEventListener('mouseenter', () => {
            addHabitBtn.style.transform = 'translateY(-2px)';
            addHabitBtn.style.boxShadow = '0 4px 15px rgba(243, 194, 41, 0.4)';
        });
        addHabitBtn.addEventListener('mouseleave', () => {
            addHabitBtn.style.transform = '';
            addHabitBtn.style.boxShadow = '';
        });
    }

    // Add glow effect to Save Changes button (same as assignment page)
    const saveChangesBtn = document.getElementById('saveEditHabitBtn');
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('mouseenter', () => {
            saveChangesBtn.style.transform = 'translateY(-2px)';
            saveChangesBtn.style.boxShadow = '0 4px 15px rgba(243, 194, 41, 0.4)';
        });
        saveChangesBtn.addEventListener('mouseleave', () => {
            saveChangesBtn.style.transform = '';
            saveChangesBtn.style.boxShadow = '';
        });
    }

    // Add glow effect to Cancel buttons (same as assignment page)
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 4px 15px rgba(243, 194, 41, 0.4)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.boxShadow = '';
        });
    });

    // Add glow effect to Delete Permanently button (same as assignment page)
    const deletePermanentlyBtn = document.getElementById('confirmDeleteBtn');
    if (deletePermanentlyBtn) {
        deletePermanentlyBtn.addEventListener('mouseenter', () => {
            deletePermanentlyBtn.style.transform = 'translateY(-2px)';
            deletePermanentlyBtn.style.boxShadow = '0 4px 15px rgba(255, 77, 79, 0.4)';
        });
        deletePermanentlyBtn.addEventListener('mouseleave', () => {
            deletePermanentlyBtn.style.transform = '';
            deletePermanentlyBtn.style.boxShadow = '';
        });
    }

    // Add glow effect to Edit and Delete buttons in habit list
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.boxShadow = '';
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.boxShadow = '';
        });
    });
}

// OPEN EDIT MODAL
function openEditModal(habit) {
    document.getElementById('editHabitId').value = habit.habit_id;
    document.getElementById('editHabitName').value = habit.habit_name;
    document.getElementById('editStartTime').value = habit.start_time.substring(0, 5);
    document.getElementById('editEndTime').value = habit.end_time.substring(0, 5);
    document.getElementById('editReminder').value = habit.reminder_option || 'None';

    // Update the repeat day buttons in edit modal
    document.querySelectorAll('#editRepeatDays .day-btn').forEach(btn => {
        const day = btn.dataset.day;
        // Check if this day is in the habit's repeat days
        const repeatDays = habit.repeat_days.split(',').map(d => d.trim());
        btn.classList.toggle('active', repeatDays.includes(day));
    });

    // Apply the same styling as the add modal
    updateEditModalRepeatButtons();

    document.getElementById('editHabitModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// NEW FUNCTION: Update edit modal repeat buttons to match add modal
function updateEditModalRepeatButtons() {
    const editRepeatDaysContainer = document.getElementById('editRepeatDays');
    if (!editRepeatDaysContainer) return;

    // Apply the same styling as the add modal
    editRepeatDaysContainer.querySelectorAll('.day-btn').forEach(btn => {
        // Apply base styling
        btn.style.background = 'var(--border)';
        btn.style.color = 'var(--text)';
        btn.style.border = '1px solid var(--border)';
        btn.style.borderRadius = '35%';
        btn.style.minWidth = '50px';
        btn.style.height = '48px';
        btn.style.fontWeight = '600';
        btn.style.fontSize = '14px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'all 0.2s';
        
        // Handle active state
        const clickHandler = () => {
            btn.classList.toggle('active');
            if (btn.classList.contains('active')) {
                btn.style.background = 'var(--accent)';
                btn.style.color = '#000';
                btn.style.borderColor = 'var(--accent)';
            } else {
                btn.style.background = 'var(--border)';
                btn.style.color = 'var(--text)';
                btn.style.borderColor = 'var(--border)';
            }
        };

        // Remove existing listeners to avoid duplicates
        const oldListener = btn._clickHandler;
        if (oldListener) {
            btn.removeEventListener('click', oldListener);
        }
        btn.addEventListener('click', clickHandler);
        btn._clickHandler = clickHandler;

        // Set initial state based on classList
        if (btn.classList.contains('active')) {
            btn.style.background = 'var(--accent)';
            btn.style.color = '#000';
            btn.style.borderColor = 'var(--accent)';
        } else {
            btn.style.background = 'var(--border)';
            btn.style.color = 'var(--text)';
            btn.style.borderColor = 'var(--border)';
        }
    });
}

// OPEN DELETE MODAL
function openDeleteModal(habit) {
    document.getElementById('deleteHabitName').textContent = habit.habit_name;
    window.currentDeleteId = habit.habit_id;
    document.getElementById('deleteHabitModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// LOAD & RENDER HABITS
function loadHabits() {
    fetch('habit.php?action=list')
        .then(r => {
            if (!r.ok) {
                throw new Error(`HTTP error! status: ${r.status}`);
            }
            return r.text(); // Get as text first
        })
        .then(text => {
            console.log('Raw API Response:', text);
            
            if (!text.trim()) {
                throw new Error('Empty response from server');
            }
            
            try {
                const data = JSON.parse(text);
                console.log('Parsed API Response:', data);
                
                // Render streak dashboard with proper error handling
                if (data.streak) {
                    renderStreakDashboard(data.streak);
                } else {
                    console.warn('No streak data in response');
                    renderDefaultStreakDashboard();
                }
                
                renderTodayHabits(data.today || []);
                renderHistoryHabits(data.history || []);
            } catch (e) {
                console.error('Failed to parse JSON:', e);
                throw new Error('Invalid JSON response');
            }
        })
        .catch(err => {
            console.error('Failed to load habits:', err);
            const todayContainer = document.getElementById('todayHabitsContainer');
            const historyContainer = document.getElementById('historyHabitsContainer');
            
            if (todayContainer) {
                todayContainer.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#ff4d4f;font-size:16px;">Error loading habits. Check console for details.</div>`;
            }
            if (historyContainer) {
                historyContainer.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#ff4d4f;font-size:16px;">Error loading habits. Check console for details.</div>`;
            }
            
            // Also render default streak dashboard on error
            renderDefaultStreakDashboard();
        });
}

// CORRECTED STREAK DASHBOARD RENDERING
function renderStreakDashboard(streak) {
    if (!streak) {
        console.warn('No streak data provided');
        renderDefaultStreakDashboard();
        return;
    }

    // Update Current Streak
    const currentStreakCard = document.querySelector('.streak-mini-card:first-child');
    if (currentStreakCard) {
        const currentValue = currentStreakCard.querySelector('.streak-value');
        const currentSubtitle = currentStreakCard.querySelector('.streak-subtitle');
        
        if (currentValue) {
            currentValue.innerHTML = `${streak.current || 0} <small>days</small>`;
        }
        if (currentSubtitle) {
            currentSubtitle.textContent = streak.current > 0 ? "You're on fire!🔥" : "Start building your streak";
        }
    }

    // Update Best Streak
    const bestStreakCard = document.querySelectorAll('.streak-mini-card')[1];
    if (bestStreakCard) {
        const bestValue = bestStreakCard.querySelector('.streak-value');
        const bestSubtitle = bestStreakCard.querySelector('.streak-subtitle');
        
        if (bestValue) {
            bestValue.innerHTML = `${streak.best || 0} <small>days</small>`;
        }
        if (bestSubtitle) {
            bestSubtitle.textContent = streak.best > 0 ? `Beat your record by ${Math.max(0, streak.best - streak.current)} days` : "No record yet";
        }
    }

    // Update Weekly Activity
    const weeklyCard = document.querySelector('.weekly-activity-card');
    if (weeklyCard) {
        const completionElement = weeklyCard.querySelector('.completion');
        if (completionElement) {
            completionElement.innerHTML = `${streak.completionRate || 0}% <div class="streak-subtitle">Completion rate</div>`;
        }

        // Update day indicators
        const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayItems = weeklyCard.querySelectorAll('.day-item');
        
        dayItems.forEach((item, i) => {
            if (i < daysOrder.length) {
                const dayDiv = item.querySelector('.day');
                const dayName = daysOrder[i];
                
                if (dayDiv) {
                    const isDone = streak.days && streak.days[dayName] === true;
                    dayDiv.className = isDone ? 'day done' : 'day missed';
                    dayDiv.innerHTML = isDone
                        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4"><path d="M20 6 L9 17 L4 12"></path></svg>`
                        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4"><path d="M18 6 L6 18 M6 6 L18 18"></path></svg>`;
                }
            }
        });
    }
}

// DEFAULT STREAK DASHBOARD FOR ERROR CASES
function renderDefaultStreakDashboard() {
    // Update Current Streak
    const currentStreakCard = document.querySelector('.streak-mini-card:first-child');
    if (currentStreakCard) {
        const currentValue = currentStreakCard.querySelector('.streak-value');
        const currentSubtitle = currentStreakCard.querySelector('.streak-subtitle');
        
        if (currentValue) currentValue.innerHTML = `0 <small>days</small>`;
        if (currentSubtitle) currentSubtitle.textContent = "Start building your streak";
    }

    // Update Best Streak
    const bestStreakCard = document.querySelectorAll('.streak-mini-card')[1];
    if (bestStreakCard) {
        const bestValue = bestStreakCard.querySelector('.streak-value');
        const bestSubtitle = bestStreakCard.querySelector('.streak-subtitle');
        
        if (bestValue) bestValue.innerHTML = `0 <small>days</small>`;
        if (bestSubtitle) bestSubtitle.textContent = "No record yet";
    }

    // Update Weekly Activity
    const weeklyCard = document.querySelector('.weekly-activity-card');
    if (weeklyCard) {
        const completionElement = weeklyCard.querySelector('.completion');
        if (completionElement) {
            completionElement.innerHTML = `0% <div class="streak-subtitle">Completion rate</div>`;
        }

        // Reset all day indicators to missed
        const dayItems = weeklyCard.querySelectorAll('.day-item');
        dayItems.forEach(item => {
            const dayDiv = item.querySelector('.day');
            if (dayDiv) {
                dayDiv.className = 'day missed';
                dayDiv.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4"><path d="M18 6 L6 18 M6 6 L18 18"></path></svg>`;
            }
        });
    }
}

function renderTodayHabits(habits) {
    const container = document.getElementById('todayHabitsContainer');
    if (!container) return;

    if (habits.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-dim);font-size:16px;">No habits scheduled for today</div>`;
        return;
    }

    container.innerHTML = habits.map(h => `
        <div class="class-item" data-habit-id="${h.habit_id}">
            <div class="class-info">
                <img src="images_icons/book.png" alt="book">
                <div>
                    <h4>${escapeHtml(h.habit_name)}</h4>
                    <p>${h.repeat_days.replace(/,/g, ', ')} • ${formatTime(h.start_time)}</p>
                </div>
            </div>
            <div class="today-habit-buttons">
                <button class="edit-btn" title="Edit" data-id="${h.habit_id}">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"/><path d="M16.5 3.5l4 4L7 21l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                </button>
                <button class="priority-label ${h.completed_today ? 'active' : ''}" 
                        title="Mark as done" 
                        data-id="${h.habit_id}">
                    <svg width="18" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4">
                        <path d="M20 6 L9 17 L4 12"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');

    // Edit buttons
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const habitId = btn.dataset.id;
            const habit = habits.find(x => x.habit_id == habitId);
            if (habit) openEditModal(habit);
        });
    });
    
    // ✅ UPDATED: Move habit to history when marked as done (green checkmark)
    container.querySelectorAll('.priority-label').forEach(btn => {
        btn.addEventListener('click', async () => {
            const habitId = parseInt(btn.dataset.id);
            const willBeActive = !btn.classList.contains('active');
            
            if (willBeActive) {
                // Marking as done - move to history
                btn.classList.add('active');
                
                const habitElement = btn.closest('.class-item');
                const habitData = habits.find(h => h.habit_id == habitId);
                
                if (habitElement && habitData) {
                    // Remove from today's habits
                    habitElement.remove();
                    
                    // Check if today's habits section is empty
                    if (container.children.length === 0) {
                        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-dim);font-size:16px;">No habits scheduled for today</div>`;
                    }
                    
                    // Add to history section
                    addToHistorySection(habitData);
                    
                    // Send completion to server
                    try {
                        const res = await fetch('habit.php?action=complete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ habit_id: habitId, completed: true })
                        });

                        if (!res.ok) {
                            throw new Error(`HTTP error! status: ${res.status}`);
                        }
                        
                        const result = await res.json();
                        if (result.error) {
                            throw new Error(result.error);
                        }
                        
                        console.log('Habit marked as completed successfully');
                        
                        // Reload streak dashboard to update stats
                        loadHabits();
                    } catch (err) {
                        console.error('Complete failed:', err);
                        // If server update fails, revert the UI changes
                        btn.classList.remove('active');
                        container.appendChild(habitElement);
                        alert('Failed to update completion status. Please try again.');
                    }
                }
            } else {
                // Unmarking as done - just update server, don't move
                btn.classList.remove('active');
                
                try {
                    const res = await fetch('habit.php?action=complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ habit_id: habitId, completed: false })
                    });

                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    
                    const result = await res.json();
                    if (result.error) {
                        throw new Error(result.error);
                    }
                    
                    console.log('Habit marked as incomplete successfully');
                    
                    // Reload streak dashboard to update stats
                    loadHabits();
                } catch (err) {
                    console.error('Uncomplete failed:', err);
                    btn.classList.add('active'); // Revert if failed
                    alert('Failed to update completion status. Please try again.');
                }
            }
        });
    });
}

// Function to add habit to history section
function addToHistorySection(habitData) {
    const historyContainer = document.getElementById('historyHabitsContainer');
    if (!historyContainer) return;
    
    // Check if habit already exists in history
    const existingHabit = historyContainer.querySelector(`[data-habit-id="${habitData.habit_id}"]`);
    if (existingHabit) return; // Don't add if already exists
    
    // Check if history section has the empty state message
    const hasEmptyState = historyContainer.querySelector('div[style*="text-align:center"]') !== null;
    
    // Create habit element for history
    const historyHabitElement = document.createElement('div');
    historyHabitElement.className = 'class-item';
    historyHabitElement.setAttribute('data-habit-id', habitData.habit_id);
    historyHabitElement.innerHTML = `
        <div class="class-info">
            <img src="images_icons/book.png" alt="book">
            <div>
                <h4>${escapeHtml(habitData.habit_name)}</h4>
                <p>${habitData.repeat_days.replace(/,/g, ', ')} • ${formatTime(habitData.start_time)}</p>
            </div>
        </div>
        <div style="position:relative;">
            <button class="delete-btn" title="Delete" data-id="${habitData.habit_id}" style="position: absolute; top: -15px; right: -2px; background: #ff4d4f; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: background 0.3s;">
                ×
            </button>
        </div>
    `;
    
    // Remove empty state if it exists and add the new habit
    if (hasEmptyState) {
        historyContainer.innerHTML = '';
    }
    
    // Add to the beginning of history container (most recent first)
    historyContainer.insertBefore(historyHabitElement, historyContainer.firstChild || null);
    
    // Add event listener to the delete button in the new history item
    const deleteBtn = historyHabitElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        openDeleteModal(habitData);
    });
}

function renderHistoryHabits(habits) {
    const container = document.getElementById('historyHabitsContainer');
    if (!container) return;

    if (habits.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px 20px;color:var(--text-dim);font-size:15px;">No habits completed yet</div>';
        return;
    }

    container.innerHTML = habits.map(h => `
        <div class="class-item" data-habit-id="${h.habit_id}">
            <div class="class-info">
                <img src="images_icons/book.png" alt="book">
                <div>
                    <h4>${escapeHtml(h.habit_name)}</h4>
                    <p>${h.repeat_days.replace(/,/g, ', ')} • ${formatTime(h.start_time)}</p>
                </div>
            </div>
            <div style="position:relative;">
                <button class="delete-btn" title="Delete" data-id="${h.habit_id}" style="position: absolute; top: -15px; right: -2px; background: #ff4d4f; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: background 0.3s;">
                    ×
                </button>
            </div>
        </div>
    `).join('');

    // Delete buttons only
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const habitId = btn.dataset.id;
            const habit = habits.find(x => x.habit_id == habitId);
            if (habit) openDeleteModal(habit);
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').slice(0, 2); // Take only HH and MM
    const hour = parseInt(h);
    const displayHour = hour % 12 || 12;
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${m} ${period}`;
}
//Logout Modal
    const logoutTrigger = document.querySelector('.bot-nav a[href="#"]');

   
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const confirmLogoutBtn = document.getElementById('confirmLogout');

 
    logoutTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        logoutModal.style.display = "flex";
    });


    cancelLogoutBtn.addEventListener('click', () => {
        logoutModal.style.display = "none";
    });

  
    confirmLogoutBtn.addEventListener('click', () => {
        window.location.href = "Sign-in.html"; 
    });

  
    window.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.style.display = "none";
        }
    });