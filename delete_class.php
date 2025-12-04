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
     // Log the error for backend diagnostics
     error_log("Database connection error: " . $e->getMessage());
     http_response_code(500);
     echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
     exit();
}

// 2. GET USER_ID FROM SESSION
$current_user_id = $_SESSION['user_id'] ?? null; 

// CRITICAL CHECK 1: Authentication
if (empty($current_user_id)) {
    http_response_code(403); 
    echo json_encode(['success' => false, 'message' => 'You must be logged in to delete a class.']);
    exit();
}

// 3. GET CLASS ID FROM POST DATA
// class_id is now VARCHAR (e.g., 'CLASS1')
$class_id = filter_input(INPUT_POST, 'class_id', FILTER_SANITIZE_FULL_SPECIAL_CHARS);

// CRITICAL CHECK 2: Data validation
if (empty($class_id)) {
    http_response_code(400); 
    echo json_encode(['success' => false, 'message' => 'Class ID is missing.']);
    exit();
}

// 4. SECURE DELETE OPERATION (ON DELETE CASCADE handles dependencies)
try {
    // IMPORTANT: Delete WHERE class_id = ? AND user_id = ?
    // The database will now automatically delete associated assignments and reminders.
    $sql = "DELETE FROM classes WHERE class_id = ? AND user_id = ?";
            
    $stmt = $pdo->prepare($sql);
    // Execute expects $class_id to be a string (VARCHAR)
    $stmt->execute([$class_id, $current_user_id]);

    // Check if any row was affected
    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Class deleted successfully!']);
    } else {
        // If rowCount is 0, either the ID was invalid or it belonged to another user.
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Class not found or access denied.']);
    }

} catch (\PDOException $e) {
    // Log the error for backend diagnostics
    error_log("Class deletion error: " . $e->getMessage());
    http_response_code(500); 
    echo json_encode(['success' => false, 'message' => 'Failed to delete class due to a server error.']);
}
?>