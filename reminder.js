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


        // === CONFIG ===
        const API_URL = 'api.php';
        // === UTILS ===
        function formatTime(t) {
            if (!t) return '';
            const [h, m] = t.split(':');
            const hour = parseInt(h);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${m} ${ampm}`;
        }
        function formatDate(d) {
            if (!d) return '';
            const date = new Date(d);
            return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        }
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }
        // === API ===
        async function loadReminders() {
            try {
                const res = await fetch(API_URL);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (e) {
                console.error('Load failed:', e);
                return [];
            }
        }
        async function saveReminder(data, id = null) {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}?id=${id}` : API_URL;
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        }
        async function deleteReminder(id) {
            const response = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        }
        // === RENDER ===
        let editingId = null;
        let pendingDeleteId = null;
        let pendingDeleteTitle = '';
        async function renderReminders() {
            const container = document.querySelector('.card');
            container.querySelectorAll('.class-item').forEach(el => el.remove());
            const placeholder = container.querySelector('p');
            if (placeholder && placeholder.textContent.includes('No reminders yet')) {
                placeholder.remove();
            }
            const reminders = await loadReminders();
            if (reminders.length === 0) {
                const p = document.createElement('p');
                p.style.cssText = "color:var(--text-dim);text-align:center;padding:60px 0;";
                p.textContent = "No reminders yet. Click '+ Add Reminder' to create one!";
                container.appendChild(p);
                return;
            }
            reminders.forEach(r => {
                const due = new Date(`${r.due_date} ${r.due_time}`);
                const now = new Date();
                const isToday = due.toDateString() === now.toDateString();
                const isOverdue = due < now;
                const div = document.createElement('div');
                div.className = 'class-item';
                div.dataset.id = r.id;
                div.innerHTML = `
                    <div class="class-info">
                        <img src="images_icons/book.png" alt="Reminder">
                        <div>
                            <h4>${escapeHtml(r.title)}</h4>
                            <p>${formatDate(r.due_date)} at ${formatTime(r.due_time)} • ${r.remind_before || 'None'}</p>
                        </div>
                    </div>
                    <div class="class-time">
                        ${isToday ? '<strong style="color:var(--accent);">Due Today</strong><br>' : ''}
                        ${isOverdue ? '<strong style="color:#ff4d4f;">Overdue!</strong><br>' : ''}
                        ${formatTime(r.due_time)} <br>
                        <span class="priority-label ${r.priority}">${capitalize(r.priority)} Priority</span>
                    </div>
                    <button class="edit-btn" title="Edit Reminder">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2 2 0 0 1 2.8 0l4 4a2 2 0 0 1 0 2.8L7 21l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                    </button>
                    <button class="delete-btn" title="Delete">×</button>
                `;
                container.appendChild(div);
            });
            // Rebind listeners
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.onclick = () => editReminder(btn.closest('.class-item').dataset.id);
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = () => {
                    const item = btn.closest('.class-item');
                    pendingDeleteId = item.dataset.id;
                    pendingDeleteTitle = item.querySelector('.class-info h4')?.textContent || 'this reminder';
                    document.getElementById('deleteModalMessage').textContent = 
                        `Are you sure you want to delete "${pendingDeleteTitle}"? This action cannot be undone.`;
                    document.getElementById('deleteModal').style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                };
            });
        }
        // === MODALS ===
        function openModal() {
            editingId = null;
            resetForm();
            document.getElementById('modalTitle').textContent = 'Add Reminder';
            document.getElementById('saveReminderBtn').textContent = 'Save Reminder';
            document.getElementById('addClassModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        function closeModal() {
            document.getElementById('addClassModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        function resetForm() {
            document.getElementById('reminderTitle').value = '';
            document.getElementById('reminderDueDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('reminderDueTime').value = '12:00';
            document.getElementById('reminderBefore').value = 'None';
            document.getElementById('reminderNotes').value = '';
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.priority-btn[data-priority="medium"]').classList.add('active');
        }
        async function editReminder(id) {
            const reminders = await loadReminders();
            const rem = reminders.find(r => r.id == id);
            if (!rem) return;
            editingId = id;
            document.getElementById('reminderTitle').value = rem.title;
            document.getElementById('reminderDueDate').value = rem.due_date;
            document.getElementById('reminderDueTime').value = rem.due_time;
            document.getElementById('reminderBefore').value = rem.remind_before;
            document.getElementById('reminderNotes').value = rem.notes || '';
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector(`.priority-btn[data-priority="${rem.priority}"]`);
            (btn || document.querySelector('.priority-btn[data-priority="medium"]')).classList.add('active');
            document.getElementById('modalTitle').textContent = 'Edit Reminder';
            document.getElementById('saveReminderBtn').textContent = 'Update Reminder';
            document.getElementById('addClassModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        function showSuccess(title, message) {
            document.getElementById('successTitle').textContent = title;
            document.getElementById('successMessage').innerHTML = message;
            document.getElementById('successModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        // ✅ SHOW VALIDATION ERROR MODAL
        function showValidationError(message) {
            document.getElementById('validationMessage').textContent = message;
            document.getElementById('validationModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        // === EVENT LISTENERS ===
        document.getElementById('openModalBtn').addEventListener('click', openModal);
        document.getElementById('closeModalBtn').addEventListener('click', closeModal);
        document.getElementById('cancelBtn').addEventListener('click', closeModal);
        document.getElementById('addClassModal').addEventListener('click', e => {
            if (e.target === e.currentTarget) closeModal();
        });
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        document.getElementById('saveReminderBtn').addEventListener('click', async () => {
            const title = document.getElementById('reminderTitle').value.trim();
            const dueDate = document.getElementById('reminderDueDate').value;
            const dueTime = document.getElementById('reminderDueTime').value;
            const remindBefore = document.getElementById('reminderBefore').value;
            const priority = document.querySelector('.priority-btn.active')?.dataset.priority || 'medium';
            const notes = document.getElementById('reminderNotes').value.trim();
            // ✅ VALIDATION USING MODAL INSTEAD OF ALERT
            if (!title) {
                showValidationError('Title cannot be empty.');
                return;
            }
            if (!dueDate) {
                showValidationError('Due date is required.');
                return;
            }
            const data = { title, due_date: dueDate, due_time: dueTime, remind_before: remindBefore, priority, notes };
            try {
                await saveReminder(data, editingId);
                closeModal();
                const action = editingId ? 'updated' : 'added';
                showSuccess(
                    `${editingId ? 'Updated' : 'Added'} Successfully`,
                    `Your reminder has been ${action}.`
                );
                renderReminders();
            } catch (err) {
                console.error(err);
                showValidationError('Error: ' + (err.message || 'Failed to save.'));
            }
        });
        // ✅ VALIDATION MODAL HANDLERS — Cancel listener REMOVED
        document.getElementById('closeValidationModal').addEventListener('click', () => {
            document.getElementById('validationModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        // ❌ Removed: cancelValidationBtn listener
        document.getElementById('tryAgainBtn').addEventListener('click', () => {
            document.getElementById('validationModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            document.getElementById('reminderTitle').focus();
        });
        // ✅ DELETE MODAL HANDLERS (USING YOUR SVG)
        document.getElementById('closeDeleteModal').addEventListener('click', () => {
            document.getElementById('deleteModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            pendingDeleteId = null;
        });
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            document.getElementById('deleteModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            pendingDeleteId = null;
        });
        document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
            if (!pendingDeleteId) return;
            try {
                await deleteReminder(pendingDeleteId);
                document.getElementById('deleteModal').style.display = 'none';
                document.body.style.overflow = 'auto';
                pendingDeleteId = null;
                showSuccess('Deleted', `"${pendingDeleteTitle}" has been permanently removed.`);
                renderReminders();
            } catch (err) {
                console.error(err);
                showValidationError('Failed to delete. Check console for details.');
                document.getElementById('deleteModal').style.display = 'none';
                document.body.style.overflow = 'auto';
                pendingDeleteId = null;
            }
        });
        // Success modal
        document.getElementById('successCloseBtn').addEventListener('click', () => {
            document.getElementById('successModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        document.getElementById('addAnotherClassBtn').addEventListener('click', () => {
            document.getElementById('successModal').style.display = 'none';
            openModal();
        });
        document.getElementById('viewClassBtn').addEventListener('click', () => {
            document.getElementById('successModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        // Theme Toggle
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
            themeIcon.src = 'images_icons/moon.png';
        } else {
            themeIcon.src = 'images_icons/Sun.png';
        }
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            themeIcon.src = isLight ? 'images_icons/moon.png' : 'images_icons/Sun.png';
        });
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        hamburgerBtn.addEventListener('click', (e) => {
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
        // INIT
        document.addEventListener('DOMContentLoaded', renderReminders);