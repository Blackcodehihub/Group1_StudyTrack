// ==============================
// ASSIGN.JS — Assignment Manager (v2.0)
// ==============================

// Global state
let assignmentsList, emptyState, addModal, editModal, deleteModal, errorModal;
let assignmentTitle, assignmentClass, assignmentDueDate, assignmentDueTime, assignmentNotes, saveAssignmentBtn;
let editAssignmentId, editAssignmentTitle, editAssignmentClass, editAssignmentDueDate, editAssignmentDueTime, editAssignmentNotes, saveEditAssignmentBtn;
let deleteAssignmentTitle, cancelDeleteBtn, confirmDeleteBtn;
let errorMessageEl, errorCloseBtn;
let currentDeleteId = null;

// ======================
// INITIALIZATION (Safe DOM Access)
// ======================
document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
        initializeModals();
    });
});

function initializeModals() {
    // Re-get all elements
    assignmentsList = document.getElementById('assignmentsList');
    emptyState = document.getElementById('emptyState');
    addModal = document.getElementById('addAssignmentModal');
    editModal = document.getElementById('editAssignmentModal');
    deleteModal = document.getElementById('deleteConfirmationModal');
    errorModal = document.getElementById('errorModal');

    // Form fields (Add)
    assignmentTitle = document.getElementById('assignmentTitle');
    assignmentClass = document.getElementById('assignmentClass');
    assignmentDueDate = document.getElementById('assignmentDueDate');
    assignmentDueTime = document.getElementById('assignmentDueTime');
    assignmentNotes = document.getElementById('assignmentNotes');
    saveAssignmentBtn = document.getElementById('saveAssignmentBtn');

    // Form fields (Edit)
    editAssignmentId = document.getElementById('editAssignmentId');
    editAssignmentTitle = document.getElementById('editAssignmentTitle');
    editAssignmentClass = document.getElementById('editAssignmentClass');
    editAssignmentDueDate = document.getElementById('editAssignmentDueDate');
    editAssignmentDueTime = document.getElementById('editAssignmentDueTime');
    editAssignmentNotes = document.getElementById('editAssignmentNotes');
    saveEditAssignmentBtn = document.getElementById('saveEditAssignmentBtn');

    // Delete modal fields
    deleteAssignmentTitle = document.getElementById('deleteAssignmentTitle');
    cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Error modal
    errorMessageEl = document.getElementById('errorMessage');
    errorCloseBtn = document.getElementById('errorCloseBtn');

    // Validate critical elements
    if (!editAssignmentId || !deleteAssignmentTitle || !errorMessageEl) {
        console.error('❌ Critical elements missing. Retrying in 500ms...');
        setTimeout(initializeModals, 500);
        return;
    }

    // Set default due date/time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    assignmentDueDate.value = today;
    assignmentDueTime.value = '23:59';

    // Set min time for today
    updateMinTimeForToday();

    // Event listeners
    assignmentDueDate.addEventListener('change', updateMinTimeForToday);

    loadAssignments();
    setupEventListeners();
    setupButtonGroups();
}

// Auto-set min time when "today" is selected
function updateMinTimeForToday() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (assignmentDueDate.value === today) {
        now.setMinutes(now.getMinutes() + 1); // +1 min for safety
        const minTime = now.toTimeString().slice(0, 5);
        assignmentDueTime.value = minTime;
        assignmentDueTime.min = minTime;
    } else {
        assignmentDueTime.min = '';
    }
}

// ======================
// EVENT LISTENERS
// ======================
function setupEventListeners() {
    // === Add Modal ===
    saveAssignmentBtn.addEventListener('click', handleSaveAssignment);
    document.getElementById('closeModalBtn').addEventListener('click', () => addModal.style.display = 'none');
    document.getElementById('cancelBtn').addEventListener('click', () => addModal.style.display = 'none');

    // === Edit Modal ===
    saveEditAssignmentBtn.addEventListener('click', handleSaveEdit);
    document.getElementById('closeEditModalBtn').addEventListener('click', () => editModal.style.display = 'none');
    document.getElementById('cancelEditBtn').addEventListener('click', () => editModal.style.display = 'none');

    // === Delete Modal ===
    // Close via Cancel button
    cancelDeleteBtn?.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        currentDeleteId = null;
    });

    // Close via × button (new!)
    const deleteCloseBtn = document.getElementById('deleteCloseBtn');
    deleteCloseBtn?.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        currentDeleteId = null;
    });

    // Confirm deletion
    confirmDeleteBtn?.addEventListener('click', handleConfirmDelete);
    

    // === Error Modal ===
    errorCloseBtn.addEventListener('click', hideError);
    errorModal.addEventListener('click', e => { if (e.target === errorModal) hideError(); });

    // Close modals on overlay click
    addModal.addEventListener('click', e => { if (e.target === addModal) addModal.style.display = 'none'; });
    editModal.addEventListener('click', e => { if (e.target === editModal) editModal.style.display = 'none'; });
    deleteModal.addEventListener('click', e => { if (e.target === deleteModal) deleteModal.style.display = 'none'; });
}

// ======================
// BUTTON GROUPS (Priority & Reminder)
// ======================
function setupButtonGroups() {
    // Priority buttons
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const container = this.closest('.priority-row');
            container.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Reminder buttons
    document.querySelectorAll('.reminder-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const container = this.closest('.reminder-row');
            container.querySelectorAll('.reminder-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ======================
// ERROR MODAL
// ======================
function showError(message) {
    errorMessageEl.textContent = message;
    errorModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideError() {
    errorModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ======================
// VALIDATION
// ======================
function validateAssignment(title, className, dueDate, dueTime) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inputDate = new Date(dueDate);
    const inputDateTime = new Date(dueDate + 'T' + (dueTime || '00:00'));

    // Required fields
    if (!title.trim()) return 'Title cannot be empty.';
    if (!className.trim()) return 'Class name cannot be empty.';
    if (!dueDate) return 'Due date is required.';

    // Invalid date
    if (isNaN(inputDate.getTime())) return 'Invalid due date format.';

    // Past date
    if (inputDate < today) return 'Due date cannot be in the past.';

    // Same day: time must be future
    if (inputDate.toDateString() === today.toDateString()) {
        if (!dueTime) return 'Due time is required for today’s assignments.';
        if (inputDateTime <= now) {
            const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `Due time must be later than ${currentTime}.`;
        }
    }

    return null; // ✅ Valid
}

function focusFirstInvalidField(title, className, dueDate, dueTime) {
    if (!title.trim()) return assignmentTitle.focus();
    if (!className.trim()) return assignmentClass.focus();
    if (!dueDate) return assignmentDueDate.focus();
    const now = new Date();
    const today = now.toDateString();
    if (new Date(dueDate).toDateString() === today && (!dueTime || new Date(dueDate + 'T' + dueTime) <= now)) {
        return assignmentDueTime.focus();
    }
}

// ======================
// DATA LOADING & RENDERING
// ======================
function loadAssignments() {
    fetch('assign.php?action=list')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(assignments => {
            renderAssignments(assignments);
        })
        .catch(err => {
            console.error('❌ Failed to load assignments:', err);
            assignmentsList.innerHTML = `<div style="color: #ff4d4f; padding:20px; text-align:center;">Error loading assignments. Check console.</div>`;
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

function createAssignmentItem(ass) {
    // Format due display
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

    // Priority styling (dynamic)
    let priorityClass = 'medium';
    if (ass.Priority === 'High') priorityClass = 'high';
    else if (ass.Priority === 'Low') priorityClass = 'low';

    const div = document.createElement('div');
    div.className = 'assignment-item';
    div.innerHTML = `
        <div class="assignment-info">
            <img src="images_icons/book.png" alt="Book">
            <div>
                <h4>${escapeHtml(ass.Title)}</h4>
                <p>${escapeHtml(ass.ClassName)}</p>
            </div>
        </div>
        <div class="due-time">
            <h3>${escapeHtml(dueStr)}</h3> 
            <span class="priority-level ${priorityClass}">${ass.Priority} Priority</span>
        </div>
        <button class="edit-btn" title="Edit Assignment" data-id="${ass.AssignmentID}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5l4 4L7 21l-4 1 1-4L16.5 3.5z"></path>
            </svg>
        </button>
        <button class="delete-btn" data-id="${ass.AssignmentID}">×</button>
    `;

    // Attach listeners
    div.querySelector('.edit-btn').addEventListener('click', () => openEditModal(ass));
    div.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(ass));

    return div;
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[m]);
}

// ======================
// MODAL HANDLERS
// ======================
function openEditModal(ass) {
    if (!editAssignmentId) {
        console.error('❌ editAssignmentId not found!');
        return;
    }
    editAssignmentId.value = ass.AssignmentID;
    editAssignmentTitle.value = ass.Title || '';
    editAssignmentClass.value = ass.ClassName || '';
    editAssignmentDueDate.value = ass.DueDate || '';
    editAssignmentDueTime.value = ass.DueTime || '23:59';
    editAssignmentNotes.value = ass.Notes || '';

    // Clear active states
    document.querySelectorAll('#editAssignmentModal .priority-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#editAssignmentModal .reminder-btn').forEach(btn => btn.classList.remove('active'));

    // Set priority
    const priorityBtn = document.querySelector(`#editAssignmentModal .priority-btn[data-priority="${ass.Priority}"]`);
    if (priorityBtn) priorityBtn.classList.add('active');
    else document.querySelector('#editAssignmentModal .priority-btn[data-priority="Medium"]').classList.add('active');

    // Set reminder
    if (ass.Reminder) {
        const reminderBtn = document.querySelector(`#editAssignmentModal .reminder-btn[data-reminder="${ass.Reminder}"]`);
        if (reminderBtn) reminderBtn.classList.add('active');
    } else {
        document.querySelector('#editAssignmentModal .reminder-btn[data-reminder="1_day"]').classList.add('active');
    }

    editModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function openDeleteModal(ass) {
    const titleEl = document.getElementById('deleteAssignmentTitle');
    if (!titleEl) {
        console.error('❌ deleteAssignmentTitle element not found');
        return;
    }

    currentDeleteId = ass.AssignmentID;
    titleEl.textContent = ass.Title;
    deleteModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ======================
// FORM SUBMISSIONS
// ======================
function handleSaveAssignment(e) {
    e.preventDefault();

    const title = assignmentTitle.value.trim();
    const className = assignmentClass.value.trim();
    const dueDate = assignmentDueDate.value;
    const dueTime = assignmentDueTime.value;
    const notes = assignmentNotes.value.trim();

    const priorityBtn = document.querySelector('#addAssignmentModal .priority-btn.active');
    const reminderBtn = document.querySelector('#addAssignmentModal .reminder-btn.active');
    const priority = priorityBtn ? priorityBtn.dataset.priority : 'Medium';
    const reminder = reminderBtn ? reminderBtn.dataset.reminder : null;

    // ✅ VALIDATE
    const error = validateAssignment(title, className, dueDate, dueTime);
    if (error) {
        showError(error);
        focusFirstInvalidField(title, className, dueDate, dueTime);
        return;
    }

    const data = {
        Title: title,
        ClassName: className,
        DueDate: dueDate,
        DueTime: dueTime,
        Priority: priority,
        Notes: notes,
        Reminder: reminder
    };

    fetch('assign.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.error) {
            showError(result.error);
            return;
        }

        addModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('successModal').style.display = 'flex';
        loadAssignments();

        // Reset form
        assignmentTitle.value = '';
        assignmentClass.value = '';
        const now = new Date();
        assignmentDueDate.value = now.toISOString().split('T')[0];
        assignmentDueTime.value = '23:59';
        document.querySelectorAll('#addAssignmentModal .priority-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#addAssignmentModal .priority-btn[data-priority="Medium"]').classList.add('active');
        document.querySelectorAll('#addAssignmentModal .reminder-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#addAssignmentModal .reminder-btn[data-reminder="1_day"]').classList.add('active');
    })
    .catch(err => {
        console.error('❌ Save failed:', err);
        showError('Failed to save. Check your internet connection.');
    });
}

function handleSaveEdit(e) {
    e.preventDefault();

    const id = editAssignmentId.value;
    const title = editAssignmentTitle.value.trim();
    const className = editAssignmentClass.value.trim();
    const dueDate = editAssignmentDueDate.value;
    const dueTime = editAssignmentDueTime.value;
    const notes = editAssignmentNotes.value.trim();

    const priorityBtn = document.querySelector('#editAssignmentModal .priority-btn.active');
    const reminderBtn = document.querySelector('#editAssignmentModal .reminder-btn.active');
    const priority = priorityBtn ? priorityBtn.dataset.priority : 'Medium';
    const reminder = reminderBtn ? reminderBtn.dataset.reminder : null;

    // ✅ VALIDATE
    const error = validateAssignment(title, className, dueDate, dueTime);
    if (error) {
        showError(error);
        focusFirstInvalidField(title, className, dueDate, dueTime);
        return;
    }

    if (!id) {
        showError('Invalid assignment ID.');
        return;
    }

    const data = {
        Title: title,
        ClassName: className,
        DueDate: dueDate,
        DueTime: dueTime,
        Priority: priority,
        Notes: notes,
        Reminder: reminder
    };

    fetch(`assign.php?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.error) {
            showError(result.error);
            return;
        }

        editModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('successModal').style.display = 'flex';
        loadAssignments();
    })
    .catch(err => {
        console.error('❌ Update failed:', err);
        showError('Failed to update. Check your internet connection.');
    });
}

function handleConfirmDelete() {
    if (!currentDeleteId) return;

    fetch(`assign.php?id=${currentDeleteId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                deleteModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                currentDeleteId = null;
                loadAssignments();
            } else {
                showError(result.error || 'Failed to delete assignment.');
            }
        })
        .catch(err => {
            console.error('❌ Delete error:', err);
            showError('Network error. Check your connection.');
        });
}