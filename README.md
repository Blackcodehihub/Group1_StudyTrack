# Group1_StudyTrack: Student Productivity System

StudyTrack is a centralized student productivity system designed to help users manage their academic and personal commitments efficiently. It integrates essential tools for tracking:

* [cite_start]Classes and detailed schedules [cite: 1]
* [cite_start]Assignments and deadlines [cite: 1]
* [cite_start]Reminders (personal and academic) [cite: 1]
* [cite_start]Habits with streak monitoring [cite: 1]
* [cite_start]Personal Wallet for allowance and expense tracking [cite: 1]

---

## 🚀 Getting Started

[cite_start]To run the StudyTrack application, you need a local server environment (like XAMPP) with PHP and MySQL running[cite: 1].

### Prerequisites

1.  [cite_start]**Web Server**: XAMPP (or similar) installed[cite: 1].
2.  [cite_start]**Database**: MySQL/MariaDB[cite: 1].
3.  [cite_start]**Application Structure**: The application files must be placed within a folder named `Group1_StudyTrack` inside your web server's root directory (e.g., `htdocs`)[cite: 1].

### Step-by-Step Usage Guide

### 1. Server Initialization

1.  [cite_start]Open the **XAMPP Control Panel**[cite: 1].
2.  [cite_start]Click **Start** for the Apache module[cite: 1].
3.  [cite_start]Click **Start** for the MySQL module[cite: 1].

### 2. Accessing the System

1.  [cite_start]Open your web browser[cite: 1].
2.  [cite_start]In the address bar, type the local path: `localhost/Group1_StudyTrack/LandingPage.html`[cite: 1].

### 3. Authentication Flow

| Step | Interface | Action / Required Input |
| :-------------: | :---------------: | :--------------------------------------------------------------------------------------------------------------------------: |
| Landing Page | N/A | [cite_start]Browse the page and click **Get Started** or **Sign Up**[cite: 1]. |
| Sign Up | Registration Form | [cite_start]Input all required fields[cite: 1]. [cite_start]The **Create Account** button is only enabled when the password policy is met and terms are accepted[cite: 1]. |
| | | [cite_start]Example Password: `Jodell@123` (Must include 8+ chars, uppercase, number, and special character)[cite: 1]. |
| Sign In | Login Form | [cite_start]Input your registered **Email** and **Password**[cite: 1]. |
| Forgot Password | Modal Sequence | Follow the steps: 1. Verify email. 2. Enter PIN from inbox. 3. [cite_start]Set a new password[cite: 1]. |

### 4. Home Dashboard Interface

* [cite_start]**Personalization**: The greeting ("Good afternoon, Jodell") dynamically changes based on the time of day and the currently logged-in user's name[cite: 1].
* [cite_start]**Today's Classes**: This section automatically filters and displays only the classes scheduled for the selected day that belong to the current user[cite: 1].
* [cite_start]**Theme Toggle**: Use the Sun/Moon icon to toggle between Light and Dark modes[cite: 1].

### 5. Module Interfaces (CRUD Operations)

| Module | Action Type | Details & Key Features |
| :--------: | :-----------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------: |
| Classes | Add, Edit, Delete | [cite_start]Schedule repeated classes[cite: 1]. [cite_start]Set Start Time must be before End Time[cite: 1]. [cite_start]Uses modal validation for missing fields[cite: 1]. |
| Assignment | Add, Edit, Delete | [cite_start]Track homework with Due Date/Time, Priority (Low/Medium/High), and Reminder options[cite: 1]. |
| Reminder | Add, Edit, Delete | [cite_start]Set personal or academic alerts using date, time, and priority[cite: 1]. [cite_start]Uses modern modal validation[cite: 1]. |
| Wallet | Add Income, Add Expense, Delete | [cite_start]Track personal allowance/spending[cite: 1]. [cite_start]Records are categorized and instantly update the Total Balance dashboard[cite: 1]. |
| Habit | Add, Edit, Delete, Confirm | [cite_start]Define a recurring habit[cite: 1]. [cite_start]Click the **Green Checkmark** button to confirm completion for the current day, which updates the Current Streak stat[cite: 1]. |

### 6. Settings Interface

* [cite_start]**Change Password**: Use the modal to securely change your password after verifying your identity[cite: 1].
* [cite_start]**Update Profile Avatar**: Click the Camera icon to choose and upload a profile picture[cite: 1].
* [cite_start]**Delete Account**: This button performs a destructive action, permanently deleting the user and all associated records (classes, habits, wallet data)[cite: 1].

### 7. Logout

* [cite_start]Click the **Log out** link in the sidebar to return to the login screen[cite: 1].

---

## 👥 Meet the Team (Group 1)

| Name | Primary Role |
| :--------------------: | :--------------------: |
| Cariliman, Alkem Boi | [cite_start]Leader / HCI & QA Lead [cite: 1] |
| Cuizon, Dexter | [cite_start]Back-end Developer [cite: 1] |
| Doños, Jodell | [cite_start]Back-end Developer [cite: 1] |
| Lisondra, Jade | [cite_start]Front-end Developer [cite: 1] |
| Saquilon, Jhon Loyd | [cite_start]Database Designer [cite: 1] |
| Velasco, Dale Emmanuel | [cite_start]Front-end Developer [cite: 1] |
