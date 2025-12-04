// ==============================
// ASSIGN.JS — Assignment Manager (v3.1 - No Class ID FK)
// ==============================

// Global state
let assignmentsList, emptyState;
let addModal, editModal, deleteModal, validationModal, successModal;
let assignmentTitle, assignmentClass, assignmentNotes, assignmentDueDate, assignmentDueTime, saveAssignmentBtn;
let editAssignmentId, editAssignmentTitle, editAssignmentClass, editAssignmentNotes, editAssignmentDueDate, editAssignmentDueTime, saveEditAssignmentBtn;
let deleteAssignmentTitle, deleteModalMessage;
let validationMessageEl;
let pendingDeleteId = null;

// ======================
// INITIALIZATION
// ======================
document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
        initializeElements();
    });
});

function initializeElements() {
    // DOM elements
    assignmentsList = document.getElementById('assignmentsList');
    emptyState = document.getElementById('emptyState');
    addModal = document.getElementById('addAssignmentModal');
    editModal = document.getElementById('editAssignmentModal');
    deleteModal = document.getElementById('deleteConfirmationModal');
    validationModal = document.getElementById('validationModal');
    successModal = document.getElementById('successModal'); 

    // Add form
    assignmentTitle = document.getElementById('assignmentTitle');
    assignmentClass = document.getElementById('assignmentClass');
    assignmentNotes = document.getElementById('assignmentNotes');
    assignmentDueDate = document.getElementById('assignmentDueDate');
    assignmentDueTime = document.getElementById('assignmentDueTime');
    saveAssignmentBtn = document.getElementById('saveAssignmentBtn');

    // Edit form
    editAssignmentId = document.getElementById('editAssignmentId');
    editAssignmentTitle = document.getElementById('editAssignmentTitle');
    editAssignmentClass = document.getElementById('editAssignmentClass');
    editAssignmentNotes = document.getElementById('editAssignmentNotes');
    editAssignmentDueDate = document.getElementById('editAssignmentDueDate');
    editAssignmentDueTime = document.getElementById('editAssignmentDueTime');
    saveEditAssignmentBtn = document.getElementById('saveEditAssignmentBtn');

    // Delete modal
    deleteAssignmentTitle = document.getElementById('deleteAssignmentTitle');
    deleteModalMessage = document.getElementById('deleteModalMessage');

    // Validation modal
    validationMessageEl = document.getElementById('validationMessage');

    // Validate critical elements
    if (!deleteAssignmentTitle || !validationMessageEl || !successModal) {
        console.error('❌ Critical elements missing. Check HTML.');
        return; 
    }

    // Set default due date/time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    assignmentDueDate.value = today;
    assignmentDueTime.value = '23:59';
    updateMinTimeForToday();
    assignmentDueDate.addEventListener('change', updateMinTimeForToday);

    loadAssignments();
    setupEventListeners();
    setupButtonGroups();
}

// Auto-set min time for today
function updateMinTimeForToday() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (assignmentDueDate.value === today) {
        now.setMinutes(now.getMinutes() + 1);
        assignmentDueTime.value = now.toTimeString().slice(0, 5);
        assignmentDueTime.min = now.toTimeString().slice(0, 5);
    } else {
        assignmentDueTime.min = '';
    }
}

// ======================
// EVENT LISTENERS
// ======================
function setupEventListeners() {
    // Add modal
    document.getElementById('openModalBtn')?.addEventListener('click', openAddModal);
    saveAssignmentBtn.addEventListener('click', handleSaveAssignment);
    document.getElementById('closeModalBtn').addEventListener('click', () => closeAddModal());
    document.getElementById('cancelBtn').addEventListener('click', () => closeAddModal());

    // Edit modal
    saveEditAssignmentBtn.addEventListener('click', handleSaveEdit);
    document.getElementById('closeEditModalBtn').addEventListener('click', () => closeEditModal());
    document.getElementById('cancelEditBtn').addEventListener('click', () => closeEditModal());

    // Delete modal
    document.getElementById('deleteCloseBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', handleConfirmDelete);

    // Validation modal
    document.getElementById('closeValidationModal').addEventListener('click', closeValidationModal);
    // Note: The Assignment.html provided has 'cancelValidationBtn' which is not used here.
    document.getElementById('tryAgainBtn').addEventListener('click', closeValidationModal);

    // Success modal
    document.getElementById('successCloseBtn').addEventListener('click', () => closeSuccessModal());
    document.getElementById('addAnotherBtn').addEventListener('click', () => {
        closeSuccessModal();
        openAddModal();
    });
    document.getElementById('viewAssignmentsBtn').addEventListener('click', () => closeSuccessModal());

    // Close on overlay
    addModal.addEventListener('click', e => { if (e.target === addModal) closeAddModal(); });
    editModal.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });
    deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });
    validationModal.addEventListener('click', e => { if (e.target === validationModal) closeValidationModal(); });
    successModal.addEventListener('click', e => { if (e.target === successModal) closeSuccessModal(); });
}

// ======================
// BUTTON GROUPS
// ======================
function setupButtonGroups() {
    // Handles both Add and Edit priority buttons
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const container = this.closest('.priority-row');
            container.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Handles both Add and Edit reminder buttons
    document.querySelectorAll('.reminder-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const container = this.closest('.reminder-row');
            container.querySelectorAll('.reminder-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ======================
// MODAL CONTROLS
// ======================
function openAddModal() {
    resetAddForm();
    addModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAddModal() {
    addModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function closeEditModal() {
    editModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    pendingDeleteId = null;
}

function closeValidationModal() {
    validationModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function closeSuccessModal() {
    successModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ✅ RESET FORM
function resetAddForm() {
    assignmentTitle.value = '';
    assignmentClass.value = '';
    assignmentNotes.value = '';
    const now = new Date();
    assignmentDueDate.value = now.toISOString().split('T')[0];
    assignmentDueTime.value = '23:59';
    
    // Reset priority to Low
    document.querySelectorAll('#addAssignmentModal .priority-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('#addAssignmentModal .priority-btn[data-priority="low"]').classList.add('active');
    
    // Reset reminder to 1_day
    document.querySelectorAll('#addAssignmentModal .reminder-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('#addAssignmentModal .reminder-btn[data-reminder="1_day"]').classList.add('active');
}

function showValidationError(message) {
    validationMessageEl.textContent = message;
    validationModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function showSuccess(title, message) {
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    successModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ======================
// VALIDATION
// ======================
function validateAssignment(title, className, notes, dueDate, dueTime) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inputDate = new Date(dueDate);
    
    // Check Date format validity and existence
    if (!dueDate) return 'Due date is required.';
    if (isNaN(inputDate.getTime())) return 'Invalid due date format.';
    
    // Convert time to DateTime object for precise comparison
    const inputDateTime = new Date(dueDate + 'T' + (dueTime || '00:00'));

    if (!title.trim()) return 'Title cannot be empty.';
    if (!className.trim()) return 'Class name cannot be empty.';
    
    // Check past date
    if (inputDate < today) return 'Due date cannot be in the past.';

    // Check past time if the date is today
    if (inputDate.toDateString() === today.toDateString()) {
        if (!dueTime) return 'Due time is required for today’s assignments.';
        
        // Use current timestamp for comparison
        if (inputDateTime <= now) {
            const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `Due time must be later than the current time (${currentTime}).`;
        }
    }

    return null;
}

// ======================
// DATA & RENDER
// ======================
function loadAssignments() {
    fetch('assign.php?action=list')
        .then(res => {
            if (res.status === 403) {
                 return { error: 'Authentication required. Please log in.' };
            }
            return res.json();
        })
        .then(data => {
            if (data.error) {
                console.error('❌ API Error:', data.error);
                assignmentsList.innerHTML = `<div style="color:#ff4d4f;padding:20px;text-align:center;">Error loading assignments: ${data.error}</div>`;
                assignmentsList.style.display = 'block';
                emptyState.style.display = 'none';
            } else {
                 renderAssignments(data);
            }
        })
        .catch(err => {
            console.error('❌ Load failed:', err);
            assignmentsList.innerHTML = `<div style="color:#ff4d4f;padding:20px;text-align:center;">Network error. Could not connect to the server.</div>`;
            assignmentsList.style.display = 'block';
            emptyState.style.display = 'none';
        });
}

function renderAssignments(assignments) {
    if (assignments.length === 0) {
        assignmentsList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    assignmentsList.style.display = 'block';
    emptyState.style.display = 'none';
    assignmentsList.innerHTML = '';

    assignments.forEach(ass => {
        const item = createAssignmentItem(ass);
        assignmentsList.appendChild(item);
    });
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function createAssignmentItem(ass) {
    const dueDateObj = new Date(ass.DueDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    dueDateObj.setHours(0,0,0,0);

    let dueStr = '';
    const diffTime = dueDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        dueStr = 'Due Today';
    } else if (diffDays === 1) {
        dueStr = 'Due Tomorrow';
    } else if (diffDays < 0) {
        dueStr = 'Overdue';
    } else if (diffDays <= 7) {
        dueStr = `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else {
        dueStr = dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (ass.DueTime) {
        const [h, m] = ass.DueTime.split(':');
        const timeStr = new Date(0,0,0,h,m).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dueStr += `, ${timeStr}`;
    }

    // Use lowercase for CSS class lookup
    let priorityClass = ass.Priority.toLowerCase();
    
    // Display Class • Notes in the list view
    const notesDisplay = ass.Notes && ass.Notes.trim() ? ` • ${escapeHtml(ass.Notes)}` : '';
    
    const div = document.createElement('div');
    div.className = 'assignment-item';
    div.innerHTML = `
        <div class="assignment-info">
            <img src="images_icons/book.png" alt="Book">
            <div>
                <h4>${escapeHtml(ass.Title)}</h4>
                <p>${escapeHtml(ass.ClassName)}${notesDisplay}</p>
            </div>
        </div>
        <div class="due-time">
            <h3>${escapeHtml(dueStr)}</h3> 
            <span class="priority-label ${priorityClass}">${ass.Priority} Priority</span>
        </div>
        <button class="edit-btn" title="Edit Assignment" data-id="${ass.AssignmentID}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"/><path d="M16.5 3.5l4 4L7 21l-4 1 1-4L16.5 3.5z"/>
            </svg>
        </button>
        <button class="delete-btn" data-id="${ass.AssignmentID}">×</button>
    `;

    div.querySelector('.edit-btn').addEventListener('click', () => openEditModal(ass));
    div.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(ass));

    return div;
}

function openEditModal(ass) {
    editAssignmentId.value = ass.AssignmentID;
    editAssignmentTitle.value = ass.Title || '';
    editAssignmentClass.value = ass.ClassName || '';
    editAssignmentNotes.value = ass.Notes || '';
    editAssignmentDueDate.value = ass.DueDate || '';
    editAssignmentDueTime.value = ass.DueTime || '23:59';

    document.querySelectorAll('#editAssignmentModal .priority-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#editAssignmentModal .reminder-btn').forEach(b => b.classList.remove('active'));

    const priorityBtn = document.querySelector(`#editAssignmentModal .priority-btn[data-priority="${ass.Priority.toLowerCase()}"]`);
    (priorityBtn || document.querySelector('#editAssignmentModal .priority-btn[data-priority="medium"]')).classList.add('active');

    const reminderBtn = document.querySelector(`#editAssignmentModal .reminder-btn[data-reminder="${ass.Reminder}"]`);
    (reminderBtn || document.querySelector('#editAssignmentModal .reminder-btn[data-reminder="1_day"]')).classList.add('active');

    closeValidationModal();
    editModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function openDeleteModal(ass) {
    pendingDeleteId = ass.AssignmentID;
    deleteAssignmentTitle.textContent = ass.Title;
    deleteModalMessage.innerHTML = `Are you sure you want to delete the assignment: <strong>${escapeHtml(ass.Title)}</strong>?<br>This action cannot be undone.`;
    closeValidationModal();
    deleteModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ======================
// FORM HANDLERS
// ======================
function handleSaveAssignment(e) {
    e.preventDefault();

    const title = assignmentTitle.value.trim();
    const className = assignmentClass.value.trim();
    const notes = assignmentNotes.value.trim();
    const dueDate = assignmentDueDate.value;
    const dueTime = assignmentDueTime.value;

    const priorityBtn = document.querySelector('#addAssignmentModal .priority-btn.active');
    const reminderBtn = document.querySelector('#addAssignmentModal .reminder-btn.active');
    
    // PHP expects "Low", "Medium", "High"
    const priority = priorityBtn 
        ? priorityBtn.dataset.priority.charAt(0).toUpperCase() + priorityBtn.dataset.priority.slice(1) 
        : 'Medium';
    const reminder = reminderBtn ? reminderBtn.dataset.reminder : null;

    const error = validateAssignment(title, className, notes, dueDate, dueTime);
    if (error) {
        showValidationError(error);
        return;
    }

    const data = { Title: title, ClassName: className, Notes: notes, DueDate: dueDate, DueTime: dueTime, Priority: priority, Reminder: reminder };

    fetch('assign.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.error) throw new Error(result.error);
        closeAddModal();
        showSuccess('Assignment Saved!', 'Your timetable and reminders have been updated for this assignment.');
        loadAssignments();
    })
    .catch(err => {
        console.error('❌ Save failed:', err);
        showValidationError(err.message || 'Failed to save. Check server logs.');
    });
}

function handleSaveEdit(e) {
    e.preventDefault();

    const id = editAssignmentId.value;
    if (!id) {
        showValidationError('Invalid assignment ID.');
        return;
    }

    const title = editAssignmentTitle.value.trim();
    const className = editAssignmentClass.value.trim();
    const notes = editAssignmentNotes.value.trim();
    const dueDate = editAssignmentDueDate.value;
    const dueTime = editAssignmentDueTime.value;

    const priorityBtn = document.querySelector('#editAssignmentModal .priority-btn.active');
    const reminderBtn = document.querySelector('#editAssignmentModal .reminder-btn.active');
    
    const priority = priorityBtn 
        ? priorityBtn.dataset.priority.charAt(0).toUpperCase() + priorityBtn.dataset.priority.slice(1) 
        : 'Medium';
    const reminder = reminderBtn ? reminderBtn.dataset.reminder : null;

    const error = validateAssignment(title, className, notes, dueDate, dueTime);
    if (error) {
        showValidationError(error);
        return;
    }

    const data = { Title: title, ClassName: className, Notes: notes, DueDate: dueDate, DueTime: dueTime, Priority: priority, Reminder: reminder };

    fetch(`assign.php?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.error) throw new Error(result.error);
        closeEditModal();
        showSuccess('Assignment Updated!', 'Changes have been saved.');
        loadAssignments();
    })
    .catch(err => {
        console.error('❌ Update failed:', err);
        showValidationError(err.message || 'Failed to update. Check server logs.');
    });
}

function handleConfirmDelete() {
    if (!pendingDeleteId) return;

    fetch(`assign.php?id=${pendingDeleteId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(result => {
            if (!result.success) throw new Error(result.error || 'Failed to delete.');
            closeDeleteModal();
            showSuccess('Deleted', `Assignment has been permanently removed.`);
            loadAssignments();
        })
        .catch(err => {
            console.error('❌ Delete failed:', err);
            showValidationError(err.message || 'Network error. Try again.');
            closeDeleteModal();
        });
}


// ===== THEME TOGGLE (Existing functionality) =====
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
    themeIcon.src = isLight ? 'images_icons/moon.png' : 'images_icons/sun.png';
});

// ===== HAMBURGER MENU (Existing functionality) =====
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('.main-content');

hamburgerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('shift');
});

document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && 
        e.target !== hamburgerBtn) {
        sidebar.classList.remove('active');
        mainContent.classList.remove('shift');
    }
});


// ===== LOGOUT MODAL (Existing functionality) =====
const logoutTrigger = document.querySelector('.bot-nav a[href="#"]');
const logoutModal = document.getElementById('logoutModal');
const cancelLogoutBtn = document.getElementById('cancelLogout');
const confirmLogoutBtn = document.getElementById('confirmLogout');

logoutTrigger?.addEventListener('click', (e) => {
    e.preventDefault();
    if (logoutModal) logoutModal.style.display = "flex";
});

cancelLogoutBtn?.addEventListener('click', () => {
    if (logoutModal) logoutModal.style.display = "none";
});

confirmLogoutBtn?.addEventListener('click', () => {
    window.location.href = "Sign-in.html"; 
});

window.addEventListener('click', (e) => {
    if (logoutModal && e.target === logoutModal) {
        logoutModal.style.display = "none";
    }
});