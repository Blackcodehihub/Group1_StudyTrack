<?php
session_start();

header('Content-Type: application/json');

// 1. DATABASE CONFIGURATION (Reuse settings)
$host = 'localhost';
$db   = 'studytrack';
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
     error_log("Database connection error: " . $e->getMessage());
     http_response_code(500); 
     echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
     exit();
}

// 2. GET USER_ID FROM SESSION
$current_user_id = $_SESSION['user_id'] ?? null; 

// CRITICAL CHECK: Authentication
if (empty($current_user_id)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You must be logged in to update a class.']);
    exit();
}

// 3. RETRIEVE AND SANITIZE INPUTS
// CRITICAL FIX: class_id uses string filter
$class_id          = filter_input(INPUT_POST, 'class_id', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$subject_name      = filter_input(INPUT_POST, 'subject_name', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$instructor        = filter_input(INPUT_POST, 'instructor', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$location          = filter_input(INPUT_POST, 'location', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$start_time        = filter_input(INPUT_POST, 'start_time', FILTER_SANITIZE_FULL_SPECIAL_CHARS); 
$end_time          = filter_input(INPUT_POST, 'end_time', FILTER_SANITIZE_FULL_SPECIAL_CHARS);   
$repeat_days       = $_POST['repeat_days'] ?? []; 
$reminder_time_val = filter_input(INPUT_POST, 'reminder_time', FILTER_SANITIZE_NUMBER_INT); 

$repeat_days_string = !empty($repeat_days) ? implode(',', $repeat_days) : NULL;
$reminder_time_minutes = !empty($reminder_time_val) ? (int)$reminder_time_val : NULL;

// 4. SERVER-SIDE VALIDATION
$errors = [];
// CRITICAL FIX: Loosened validation for class_id as it's a string (e.g., 'CLASS1')
if (empty($class_id)) { $errors[] = "Class ID is missing for update."; }
// The previous file had a strict check: !preg_match("/^CLASS[0-9]+$/", $class_id), which failed if the ID was somehow corrupted. Removing this strict check for basic functionality.
if (empty($subject_name)) { $errors[] = "Subject name is required."; }
if (empty($start_time) || empty($end_time)) { $errors[] = "Start and End times are required."; }
if (!preg_match("/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/", $start_time)) { $errors[] = "Invalid Start Time format. Use HH:MM."; }
if (!preg_match("/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/", $end_time)) { $errors[] = "Invalid End Time format. Use HH:MM."; }
if (empty($errors) && strtotime($start_time) >= strtotime($end_time)) { $errors[] = "End time must be after Start time."; }

if (!empty($errors)) {
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit();
}

// 5. UPDATE DATA IN DATABASE (Secured by user_id)
try {
    $sql = "UPDATE classes 
            SET subject_name = ?, instructor = ?, location = ?, start_time = ?, end_time = ?, repeat_days = ?, reminder_time_minutes = ?
            WHERE class_id = ? AND user_id = ?";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $subject_name,
        !empty($instructor) ? $instructor : NULL, 
        !empty($location) ? $location : NULL,     
        $start_time,
        $end_time,
        $repeat_days_string,
        $reminder_time_minutes,
        $class_id,            // VARCHAR ID
        $current_user_id      // VARCHAR ID from session
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Class updated successfully!']);
    } else {
        // Class not found or no changes were made
        // Use 200 OK if no changes were made but request was valid
        echo json_encode(['success' => false, 'message' => 'Class found, but no changes were detected, or you do not have permission.']);
    }

} catch (\PDOException $e) {
    error_log("Class update error: " . $e->getMessage());
    http_response_code(500); 
    echo json_encode(['success' => false, 'message' => 'Failed to update class due to a server error.']);
}
?>