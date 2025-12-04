// =============== LOGOUT MODAL ===============
// Target the logout link using the ID added to the HTML
const logoutTrigger = document.getElementById('logoutTrigger');

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
    window.location.href = "Sign-in.html"; // Redirect to login page
});

// Close modal if clicked outside the content
window.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
        logoutModal.style.display = "none";
    }
});


// =============== API ===============
const API_URL = 'wallet_api.php';

async function apiGet(endpoint) {
    try {
        const res = await fetch(`${API_URL}?${endpoint}`);
        if (!res.ok) throw new Error('Network error: ' + res.status);
        return await res.json();
    } catch (e) {
        console.warn('API GET failed:', e);
        return null;
    }
}


// =============== DYNAMIC UPDATE ===============
function updateWalletUI(wallet) {
    document.getElementById('wallet-balance').textContent = `₱ ${wallet.balance.toFixed(2)}`;
    document.getElementById('income-this-month').textContent = `₱ ${wallet.totalIncome.toFixed(2)}`;
    document.getElementById('expense-this-month').textContent = `₱ ${wallet.totalExpense.toFixed(2)}`;

    // Spending bar (% of income spent)
    const spendRatio = wallet.totalIncome > 0 ? wallet.totalExpense / wallet.totalIncome : 0;
    const spendPct = Math.min(100, spendRatio * 100);
    document.getElementById('spending-fill-bar').style.width = `${spendPct.toFixed(1)}%`;

    // Income list
    const incomeList = document.getElementById('income-list');
    if (wallet.incomeRecords.length === 0) {
        incomeList.innerHTML = '<li>No income records yet</li>';
    } else {
        incomeList.innerHTML = wallet.incomeRecords
            .map(r => `<li>₱ ${r.amount.toFixed(2)} — ${r.category}</li>`)
            .join('');
    }

    // Expense list
    const expenseList = document.getElementById('expense-list');
    if (wallet.expenseRecords.length === 0) {
        expenseList.innerHTML = '<li>No expense records yet</li>';
    } else {
        expenseList.innerHTML = wallet.expenseRecords
            .map(r => `<li>₱ ${r.amount.toFixed(2)} — ${r.category}</li>`)
            .join('');
    }
}

// Fetch habit data from database
async function updateHabitUI() {
    try {
        const response = await fetch('habit.php?action=list');
        const data = await response.json();

        if (data.today && data.streak) {
            // Calculate active habits (total habits in database)
            const activeHabits = data.history.length;

            // Count completed and missed from today's habits
            let completedToday = 0;
            let missedToday = 0;

            data.today.forEach(habit => {
                if (habit.completed_today) {
                    completedToday++;
                } else {
                    missedToday++;
                }
            });

            // Update the DOM elements with actual data
            document.getElementById('active-habits-count').textContent = activeHabits;
            document.getElementById('completed-today').textContent = completedToday;
            document.getElementById('missed-today').textContent = missedToday;
            document.getElementById('current-streak').textContent = `${data.streak.current} days`;
            document.getElementById('best-streak').textContent = `${data.streak.best} days`;

            // Habit circle: completion % = completed / (completed + missed)
            const total = completedToday + missedToday;
            const pct = total > 0 ? (completedToday / total) * 100 : 0;
            const dashOffset = 345.4 * (1 - pct / 100);
            document.getElementById('habit-fill-circle').style.strokeDashoffset = dashOffset;
            document.getElementById('habit-completion-text').textContent = `${Math.round(pct)}%`;

            // Streak progress
            const streakPct = data.streak.best > 0 ? (data.streak.current / data.streak.best) * 100 : 0;
            document.getElementById('streak-progress-fill').style.width = `${Math.min(100, streakPct)}%`;
        }
    } catch (error) {
        console.error('Error fetching habit data:', error);
        // Keep the default values or show error state if needed
    }
}


// =============== CLASS DATE/DAY NAVIGATION & CLASS DISPLAY ===============
const classDateInput = document.getElementById('classDate');
const daysContainer = document.getElementById('daysContainer');
const classBoxContainer = document.querySelector('.class-box-container'); // Reference to the container in HTML

// Initialize with today's date (this sets the value in the date picker input)
classDateInput.valueAsDate = new Date();

// Function to generate week days and handle class display
function generateWeekDays(startFrom) {
    daysContainer.innerHTML = ''; // Clear previous days

    const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; // Correct order starting from Sunday for getDay()
    const today = new Date();
    const startDate = new Date(startFrom);

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);

        const btn = document.createElement('button');
        btn.className = 'day';
        // Only show the day abbreviation (e.g., "Mon", "Tue")
        btn.textContent = weekDays[dayDate.getDay()]; // Use getDay() to get the correct abbreviation

        // Add data attribute to store the day name for API calls
        btn.setAttribute('data-day', weekDays[dayDate.getDay()]); // Use getDay() to get the correct abbreviation

        if (dayDate.toDateString() === today.toDateString()) {
            btn.classList.add('active'); // Highlight today
            // Scroll to today's button after a short delay to ensure it's rendered
            setTimeout(() => btn.scrollIntoView({behavior:'smooth', inline:'center'}), 100);
        }

        // Add click event to load classes for this day
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.day').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            // Load classes for selected day using the stored day name
            loadClassesForDay(btn.getAttribute('data-day'));
        });

        daysContainer.appendChild(btn);
    }
}

// Function to load classes for a specific day
async function loadClassesForDay(day) { // Parameter is now 'day', not 'date'
    try {
        // Clear existing classes *before* fetching new ones
        classBoxContainer.innerHTML = '';

        // Add a temporary loading message
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'loading';
        loadingMessage.textContent = 'Loading classes...';
        classBoxContainer.appendChild(loadingMessage);

        // Fetch classes for the selected day from the database
        // Use the existing PHP logic in home.php with action=get_classes
        const response = await fetch(`home.php?action=get_classes&day=${day}`);
        const data = await response.json();

        // Remove the loading message if added
        classBoxContainer.removeChild(loadingMessage);

        if (data.success && data.classes && data.classes.length > 0) {
            // Create class boxes for each class
            data.classes.forEach(cls => {
                const classBox = document.createElement('div');
                classBox.className = 'class-box';

                // Format time
                const startTime = cls.start_time ? cls.start_time.substring(0, 5) : '';
                const endTime = cls.end_time ? cls.end_time.substring(0, 5) : '';

                classBox.innerHTML = `
                    <img src="images_icons/book.png" alt="">
                    <div>
                        <h4>${cls.subject_name || 'Unknown Subject'}</h4>
                        <p>${startTime} - ${endTime}, ${cls.location || 'Location Unknown'}</p>
                    </div>
                `;

                classBoxContainer.appendChild(classBox);
            });
        } else {
            // No classes found for this day
            const noClasses = document.createElement('div');
            noClasses.className = 'no-classes-message';
            noClasses.textContent = 'No classes scheduled for this day';
            classBoxContainer.appendChild(noClasses);
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        // Display error message
        classBoxContainer.innerHTML = ''; // Clear any partial content or loading message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Error loading classes. Please try again.';
        classBoxContainer.appendChild(errorDiv);
    }
}


// Generate days for the current week
generateWeekDays(new Date());

// Initial load of classes for today
document.addEventListener("DOMContentLoaded", () => {
    // Ensure page starts scrolled to top
    setTimeout(() => window.scrollTo(0, 0), 100);
    // Load all dashboard data
    loadDashboardData();

    // Load classes for today after DOM is loaded
    setTimeout(() => {
        // Get today's day name using the correct mapping
        const today = new Date();
        const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; // Correct order
        const todayDay = weekDays[today.getDay()]; // Use getDay() to get the correct abbreviation for today
        loadClassesForDay(todayDay); // Load classes for today using the correct day name
    }, 500); // Small delay to ensure other initializations are done
});


// =============== INITIAL LOAD ===============
async function loadDashboardData() {
    // Set current date
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    // Fetch wallet data
    const walletData = await apiGet('get=wallet');
    if (walletData && walletData.wallet) {
        updateWalletUI(walletData.wallet);
    } else {
        updateWalletUI({ balance: 0, totalIncome: 0, totalExpense: 0, incomeRecords: [], expenseRecords: [] });
    }

    // Update habits (simulated)
    await updateHabitUI();
}


// =============== SIDEBAR TOGGLE LOGALOGIC ===============
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('.main-content');

hamburgerBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('shift');
});

// Close sidebar if clicked outside on larger screens
document.addEventListener('click', (event) => {
    const clickedInsideSidebar = sidebar.contains(event.target);
    const clickedHamburger = hamburgerBtn.contains(event.target);
    if (sidebar.classList.contains('active') && !clickedInsideSidebar && !clickedHamburger) {
        sidebar.classList.remove('active');
        mainContent.classList.remove('shift');
    }
});


// =============== THEME TOGGLE LOGIC ===============
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

// Check for saved theme preference or default to dark
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-theme');
    themeIcon.src = 'images_icons/moon.png'; // Show moon icon for light theme
} else {
    document.body.classList.remove('light-theme'); // Ensure dark theme is default
    themeIcon.src = 'images_icons/sun.png'; // Show sun icon for dark theme
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeIcon.src = isLight ? 'images_icons/moon.png' : 'images_icons/sun.png';
});