<?php
// CRITICAL: Start the session to access $_SESSION['user_id']
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
     http_response_code(500);
     echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
     exit();
}

// 2. DEFINE USER ID (NOW FROM SESSION)
$current_user_id = $_SESSION['user_id'] ?? null; 

// CRITICAL CHECK: If not logged in, return an empty list or error
if (empty($current_user_id)) {
    // If user is not logged in, we return a success status but an empty list.
    // The frontend JS handles displaying the "no classes" message.
    echo json_encode(['success' => true, 'classes' => []]);
    exit();
}


// 3. FETCH CLASSES FOR THE USER
try {
    // Fetch the class_id now, so we can use it for the delete button in the future!
    $sql = "SELECT class_id, subject_name, instructor, location, start_time, end_time, repeat_days
            FROM classes
            WHERE user_id = ?
            ORDER BY start_time ASC";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$current_user_id]);
    $classes = $stmt->fetchAll();

    echo json_encode(['success' => true, 'classes' => $classes]);

} catch (\PDOException $e) {
    error_log("Class fetching error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch classes.']);
}
?>