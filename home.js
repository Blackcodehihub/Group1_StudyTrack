// =============== GLOBAL UTILS ===============

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

// Format HH:MM:SS to HH:MM (e.g., 13:00:00 -> 01:00 PM)
function formatTime(time24) {
    if (!time24) return '';
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12; 
    return `${formattedH}:${minute} ${ampm}`;
}

// =============== LOGOUT MODAL ===============
const logoutTrigger = document.getElementById('logoutTrigger');
const logoutModal = document.getElementById('logoutModal');
const cancelLogoutBtn = document.getElementById('cancelLogout');
const confirmLogoutBtn = document.getElementById('confirmLogout');

logoutTrigger?.addEventListener('click', (e) => {
    e.preventDefault();
    logoutModal.style.display = "flex";
});

cancelLogoutBtn?.addEventListener('click', () => {
    logoutModal.style.display = "none";
});

confirmLogoutBtn?.addEventListener('click', () => {
    window.location.href = "Sign-in.html";
});

window.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
        logoutModal.style.display = "none";
    }
});


// =============== API SETUP ===============
const CLASS_API_URL = 'home.php';
const WALLET_API_URL = 'wallet_api.php';
const HABIT_API_URL = 'habit.php';


async function apiGet(url, endpoint) {
    try {
        const res = await fetch(`${url}?${endpoint}`);
        if (res.status === 403) {
            // CRITICAL FIX: Redirect if unauthorized (session expired/failed)
            console.error("Authentication required. Redirecting.");
            window.location.href = "Sign-in.html";
            return { success: false }; // Return structured failure object
        }
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error(`API GET failed for ${url}?${endpoint}:`, e);
        return null;
    }
}


// =============== USER INFO & GREETING ===============
async function updateGreeting() {
    const greetingEl = document.querySelector('.greeting h2');
    const greetingBase = getGreeting();
    
    greetingEl.innerHTML = `${greetingBase}, <span style="color: var(--accent);">Loading...</span>`;
    
    // Fetch user's first name from PHP session
    const userData = await apiGet(CLASS_API_URL, 'action=get_user_info');
    
    if (userData && userData.success) {
        const firstName = userData.first_name || 'User';
        greetingEl.innerHTML = `${greetingBase}, <span style="color: var(--accent);">${firstName}</span>`;
    } else {
        // If userData fails (due to 403 or other API error), keep the generic greeting
        greetingEl.innerHTML = `${greetingBase}, <span style="color: var(--accent);">User</span>`;
    }
}


// =============== CLASS DATE/DAY NAVIGATION & CLASS DISPLAY ===============
const classDateInput = document.getElementById('classDate');
const daysContainer = document.getElementById('daysContainer');
const classBoxContainer = document.querySelector('.class-box-container');

// Function to generate week days buttons
function generateWeekDays(startFrom) {
    daysContainer.innerHTML = '';
    // Correct order starting from Sunday for getDay()
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; 
    const today = new Date();
    const startDate = new Date(startFrom);

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);

        const dayName = weekDays[dayDate.getDay()];
        const btn = document.createElement('button');
        
        btn.className = 'day';
        btn.textContent = dayName;
        btn.setAttribute('data-day', dayName); 

        // Highlight today
        if (dayDate.toDateString() === today.toDateString()) {
            btn.classList.add('active');
            btn.classList.add('today'); 
            setTimeout(() => btn.scrollIntoView({behavior:'smooth', inline:'center'}), 100);
        }

        btn.addEventListener('click', () => {
            document.querySelectorAll('.day').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadClassesForDay(btn.getAttribute('data-day'));
        });

        daysContainer.appendChild(btn);
    }
}

// Function to load classes for a specific day
async function loadClassesForDay(day) { 
    try {
        classBoxContainer.innerHTML = '';

        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'loading';
        loadingMessage.textContent = 'Loading classes...';
        classBoxContainer.appendChild(loadingMessage);

        const data = await apiGet(CLASS_API_URL, `action=get_classes&day=${day}`);

        // Remove loading message
        classBoxContainer.removeChild(loadingMessage);

        if (data && data.success && data.classes && data.classes.length > 0) {
            data.classes.forEach(cls => {
                const classBox = document.createElement('div');
                classBox.className = 'class-box';

                const startTime = formatTime(cls.start_time);
                const endTime = formatTime(cls.end_time);

                classBox.innerHTML = `
                    <img src="images_icons/book.png" alt="Class Icon">
                    <div>
                        <h4>${cls.subject_name || 'Unknown Subject'}</h4>
                        <p>${startTime} - ${endTime}, ${cls.location || 'Location Unknown'}</p>
                    </div>
                `;

                classBoxContainer.appendChild(classBox);
            });
        } else if (data && data.success) {
            // No classes found for this day for this user
            const noClasses = document.createElement('div');
            noClasses.className = 'no-classes';
            noClasses.innerHTML = 'No classes scheduled for this day.';
            classBoxContainer.appendChild(noClasses);
        } else if (data && data.error) {
             classBoxContainer.innerHTML = `<div class="error-message">Error: ${data.error}</div>`;
        } else {
             classBoxContainer.innerHTML = '<div class="error-message">Failed to connect to the server API.</div>';
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        classBoxContainer.innerHTML = '<div class="error-message">An unexpected network error occurred.</div>';
    }
}


// =============== INITIAL LOAD FUNCTION ===============
async function loadDashboardData() {
    console.log("Starting dashboard load...");
    
    // 1. Update Greeting (fetches user name)
    await updateGreeting();
    
    // 2. Set current date display
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    // 3. Load Wallet data
    const walletData = await apiGet(WALLET_API_URL, 'get=wallet');
    if (walletData && walletData.wallet) {
        updateWalletUI(walletData.wallet);
    } 

    // 4. Load Habit data
    await updateHabitUI();
    
    // 5. Load Today's Classes (after everything else)
    const todayDayBtn = document.querySelector('.day.today');
    if (todayDayBtn) {
        console.log("Loading today's classes...");
        loadClassesForDay(todayDayBtn.getAttribute('data-day'));
    } else {
        console.warn("Could not find today's day button to trigger initial class load.");
    }
}

// =============== WALLET, HABIT, THEME LOGIC (From previous files) ===============

function updateWalletUI(wallet) {
    if (!wallet) return;
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

async function updateHabitUI() {
    try {
        const data = await apiGet(HABIT_API_URL, 'action=list');

        if (data && data.streak) {
            // Calculate active habits (total habits in database)
            const activeHabits = (data.all_habits || []).length;
            
            const currentStreak = data.streak.current || 0;
            const bestStreak = data.streak.best || 0;
            
            document.getElementById('current-streak').textContent = `${currentStreak} days`;
            document.getElementById('best-streak').textContent = `${bestStreak} days`;

            const pct = data.streak.completionRate || 0;
            const dashOffset = 345.4 * (1 - pct / 100);
            document.getElementById('habit-fill-circle').style.strokeDashoffset = dashOffset;
            document.getElementById('habit-completion-text').textContent = `${Math.round(pct)}%`;

            const streakPct = bestStreak > 0 ? (currentStreak / bestStreak) * 100 : 0;
            document.getElementById('streak-progress-fill').style.width = `${Math.min(100, streakPct)}%`;
            
            const completedToday = data.history.length; 
            const missedToday = data.today.length;

            document.getElementById('active-habits-count').textContent = activeHabits;
            document.getElementById('completed-today').textContent = completedToday;
            document.getElementById('missed-today').textContent = missedToday;
            
        } else {
             document.getElementById('active-habits-count').textContent = 0;
             document.getElementById('current-streak').textContent = '0 days';
             document.getElementById('best-streak').textContent = '0 days';
        }
    } catch (error) {
        console.error('Error fetching habit data:', error);
    }
}

// =============== INITIALIZATION ===============
document.addEventListener("DOMContentLoaded", () => {
    // 1. Generate days for the current week starting from Sunday
    generateWeekDays(new Date()); 
    // 2. Load all dashboard data (includes classes for today)
    loadDashboardData();
});


// =============== SIDEBAR / THEME LOGIC (Unchanged) ===============
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('.main-content');

hamburgerBtn?.addEventListener('click', (event) => {
    event.stopPropagation();
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('shift');
});

document.addEventListener('click', (event) => {
    const clickedInsideSidebar = sidebar.contains(event.target);
    const clickedHamburger = hamburgerBtn?.contains(event.target);
    if (sidebar.classList.contains('active') && !clickedInsideSidebar && !clickedHamburger) {
        sidebar.classList.remove('active');
        mainContent.classList.remove('shift');
    }
});

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-theme');
    themeIcon.src = 'images_icons/moon.png'; 
} else {
    document.body.classList.remove('light-theme');
    themeIcon.src = 'images_icons/sun.png'; 
}

themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeIcon.src = isLight ? 'images_icons/moon.png' : 'images_icons/sun.png';
});