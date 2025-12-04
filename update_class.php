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
// Check required fields first
if (empty($class_id)) { $errors[] = "Class ID is missing for update."; }
if (empty($subject_name)) { $errors[] = "Subject name is required."; }
if (empty($start_time) || empty($end_time)) { $errors[] = "Start and End times are required."; }

// Time Format Check
if (!empty($start_time) && !preg_match("/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/", $start_time)) { 
    $errors[] = "Invalid Start Time format. Use HH:MM."; 
}
if (!empty($end_time) && !preg_match("/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/", $end_time)) { 
    $errors[] = "Invalid End Time format. Use HH:MM."; 
}

// Time Logic Check (CRITICAL FIX: Use DateTime objects for reliability)
if (empty($errors) && !empty($start_time) && !empty($end_time)) { 
    try {
        $start = DateTime::createFromFormat('H:i', $start_time);
        $end = DateTime::createFromFormat('H:i', $end_time);

        // Check if parsing failed or if start time is greater than or equal to end time
        if (!$start || !$end || $start >= $end) {
             $errors[] = "End time must be after Start time."; 
        }
    } catch (\Exception $e) {
        // Fallback catch for unexpected time issues
        $errors[] = "Time comparison failed.";
    }
}


/* if (!empty($errors)) {
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit();
} */

    // TEMPORARY DEBUG BLOCK: Check what data passed validation
    if (!empty($errors)) {
        // The validation failed, return the errors as usual
        http_response_code(400); 
        echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
        exit();
    }

    // --- START DEBUG HERE ---
    if (isset($_GET['debug'])) {
        http_response_code(200);
        echo json_encode([
            'success' => true, 
            'message' => 'DEBUG SUCCESS: Validation Passed. Data Received:', 
            'received' => [
                'class_id' => $class_id,
                'subject_name' => $subject_name,
                'start_time' => $start_time,
                'end_time' => $end_time,
                'repeat_days' => $repeat_days,
                'reminder_time_minutes' => $reminder_time_minutes,
                'user_id' => $current_user_id
            ]
        ]);
        exit();
    }
    // --- END DEBUG HERE ---

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

    // CRITICAL FIX: If rowCount > 0, we updated successfully.
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Class updated successfully!']);
    } else {
        // If rowCount is 0, we assume the class exists and no changes were made.
        // We still return true to prevent the client from displaying an error.
        
        // OPTIONAL: Better check if the row truly exists to ensure it's not a 404.
        $check_sql = "SELECT class_id FROM classes WHERE class_id = ? AND user_id = ?";
        $check_stmt = $pdo->prepare($check_sql);
        $check_stmt->execute([$class_id, $current_user_id]);

        if ($check_stmt->fetch()) {
             // Class found, but no changes made -> Treat as success.
             echo json_encode(['success' => true, 'message' => 'Class found. No new changes were applied as the data was identical.']);
        } else {
             // Class not found or access denied.
             http_response_code(404);
             echo json_encode(['success' => false, 'message' => 'Class not found or access denied.']);
        }
    }

} catch (\PDOException $e) {
    error_log("Class update error: " . $e->getMessage());
    http_response_code(500); 
    echo json_encode(['success' => false, 'message' => 'Failed to update class due to a server error.']);
}
?>