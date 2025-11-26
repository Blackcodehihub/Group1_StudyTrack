<?php
// 1. DATABASE CONFIGURATION
$host = 'localhost';
$db   = 'studytrack_db';
$user = 'root';
$pass = ''; 

$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     // Log the error securely and provide a generic message to the user
     error_log("Database connection error: " . $e->getMessage());
     http_response_code(500); // Internal Server Error
     echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
     exit();
}

// 2. TEMPORARY USER_ID (REPLACE WITH SESSION IN PRODUCTION)
// In a real app, you'd get this from $_SESSION['user_id'] after login
$current_user_id = 1; // <--- !!! IMPORTANT: Temporarily hardcode for testing !!!
                      // Make sure user with ID 1 exists in your 'users' table.
                      // Or dynamically fetch it from a login session.

// 3. CHECK IF FORM WAS SUBMITTED VIA AJAX (Expected method for modal)
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

// Ensure the request is AJAX for better error handling in the frontend
if (empty($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Request must be AJAX.']);
    exit();
}


// 4. RETRIEVE AND SANITIZE INPUTS
$subject_name      = filter_input(INPUT_POST, 'subject_name', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$instructor        = filter_input(INPUT_POST, 'instructor', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$location          = filter_input(INPUT_POST, 'location', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$start_time        = filter_input(INPUT_POST, 'start_time', FILTER_SANITIZE_FULL_SPECIAL_CHARS); // Expects HH:MM
$end_time          = filter_input(INPUT_POST, 'end_time', FILTER_SANITIZE_FULL_SPECIAL_CHARS);   // Expects HH:MM
$repeat_days       = $_POST['repeat_days'] ?? []; // Comes as an array from JS
$reminder_time_val = filter_input(INPUT_POST, 'reminder_time', FILTER_SANITIZE_NUMBER_INT); // Value from dropdown (e.g., 15)

// Convert repeat_days array to a comma-separated string for DB storage
$repeat_days_string = !empty($repeat_days) ? implode(',', $repeat_days) : NULL;

// Convert reminder_time to int or NULL
$reminder_time_minutes = !empty($reminder_time_val) ? (int)$reminder_time_val : NULL;


// 5. SERVER-SIDE VALIDATION
$errors = [];

if (empty($subject_name)) {
    $errors[] = "Subject name is required.";
}
if (empty($start_time) || empty($end_time)) {
    $errors[] = "Start and End times are required.";
}

// Validate time format (HH:MM) - simple regex
if (!preg_match("/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/", $start_time)) {
    $errors[] = "Invalid Start Time format. Use HH:MM.";
}
if (!preg_match("/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/", $end_time)) {
    $errors[] = "Invalid End Time format. Use HH:MM.";
}

// Ensure end time is after start time
if (empty($errors) && strtotime($start_time) >= strtotime($end_time)) {
    $errors[] = "End time must be after Start time.";
}


// 6. RESPOND WITH VALIDATION ERRORS OR SUCCESS
if (!empty($errors)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit();
}

// 7. INSERT DATA INTO DATABASE
try {
    $sql = "INSERT INTO classes (user_id, subject_name, instructor, location, start_time, end_time, repeat_days, reminder_time_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $current_user_id,
        $subject_name,
        !empty($instructor) ? $instructor : NULL, // Store NULL if empty
        !empty($location) ? $location : NULL,     // Store NULL if empty
        $start_time,
        $end_time,
        $repeat_days_string,
        $reminder_time_minutes
    ]);

    echo json_encode(['success' => true, 'message' => 'Class added successfully!']);

} catch (\PDOException $e) {
    // Log detailed error and return generic error to frontend
    error_log("Class insertion error: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'Failed to add class due to a server error.']);
}
?>