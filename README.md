# Group1_StudyTrack: Student Productivity System

StudyTrack is a centralized student productivity system designed to help users manage their academic and personal commitments efficiently. It integrates essential tools for tracking:

* Classes and detailed schedules
* Assignments and deadlines
* Reminders (personal and academic)
* Habits with streak monitoring
* Personal Wallet for allowance and expense tracking

---

## 🚀 Getting Started

To run the StudyTrack application, you need a local server environment (like XAMPP) with PHP and MySQL running.

### Prerequisites

1.  **Web Server**: XAMPP (or similar) installed.
2.  **Database**: MySQL/MariaDB.
3.  **Application Structure**: The application files must be placed within a folder named `Group1_StudyTrack` inside your web server's root directory (e.g., `htdocs`).

### Step-by-Step Usage Guide

### 1. Server Initialization

1.  Open the **XAMPP Control Panel**.
2.  Click **Start** for the Apache module.
3.  Click **Start** for the MySQL module.

### 2. Accessing the System

1.  Open your web browser.
2.  In the address bar, type the local path: `localhost/Group1_StudyTrack/LandingPage.html`.

### 3. Authentication Flow

| Step | Interface | Action / Required Input |
| :-------------: | :---------------: | :--------------------------------------------------------------------------------------------------------------------------: |
| Landing Page | N/A | Browse the page and click **Get Started** or **Sign Up**. |
| Sign Up | Registration Form | Input all required fields. The **Create Account** button is only enabled when the password policy is met and terms are accepted. |
| | | Example Password: `Jodell@123` (Must include 8+ chars, uppercase, number, and special character). |
| Sign In | Login Form | Input your registered **Email** and **Password**. |
| Forgot Password | Modal Sequence | Follow the steps: 1. Verify email. 2. Enter PIN from inbox. 3. Set a new password. |

### 4. Home Dashboard Interface

* **Personalization**: The greeting ("Good afternoon, Jodell") dynamically changes based on the time of day and the currently logged-in user's name.
* **Today's Classes**: This section automatically filters and displays only the classes scheduled for the selected day that belong to the current user.
* **Theme Toggle**: Use the Sun/Moon icon to toggle between Light and Dark modes.

### 5. Module Interfaces (CRUD Operations)

| Module | Action Type | Details & Key Features |
| :--------: | :-----------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------: |
| Classes | Add, Edit, Delete | Schedule repeated classes. Set Start Time must be before End Time. Uses modal validation for missing fields. |
| Assignment | Add, Edit, Delete | Track homework with Due Date/Time, Priority (Low/Medium/High), and Reminder options. |
| Reminder | Add, Edit, Delete | Set personal or academic alerts using date, time, and priority. Uses modern modal validation. |
| Wallet | Add Income, Add Expense, Delete | Track personal allowance/spending. Records are categorized and instantly update the Total Balance dashboard. |
| Habit | Add, Edit, Delete, Confirm | Define a recurring habit. Click the **Green Checkmark** button to confirm completion for the current day, which updates the Current Streak stat. |

### 6. Settings Interface

* **Change Password**: Use the modal to securely change your password after verifying your identity.
* **Update Profile Avatar**: Click the Camera icon to choose and upload a profile picture.
* **Delete Account**: This button performs a destructive action, permanently deleting the user and all associated records (classes, habits, wallet data).

### 7. Logout

* Click the **Log out** link in the sidebar to return to the login screen.

---

## 👥 Meet the Team (Group 1)

| Name | Primary Role |
| :--------------------: | :--------------------: |
| Cariliman, Alkem Boi | Leader / HCI & QA Lead |
| Cuizon, Dexter | Back-end Developer |
| Doños, Jodell | Back-end Developer |
| Lisondra, Jade | Front-end Developer |
| Saquilon, Jhon Loyd | Database Designer |
| Velasco, Dale Emmanuel | Front-end Developer |
