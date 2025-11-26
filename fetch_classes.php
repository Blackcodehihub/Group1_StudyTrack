<?php
header('Content-Type: application/json');

// 1. DATABASE CONFIGURATION (Reuse settings)
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
     http_response_code(500);
     echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
     exit();
}

// 2. DEFINE USER ID (HARDCODED AS REQUESTED)
// !!! MUST BE REPLACED WITH SESSION VARIABLE AFTER SIGN IN IS IMPLEMENTED !!!
$current_user_id = 1; 


// 3. FETCH CLASSES FOR THE USER
try {
    $sql = "SELECT subject_name, instructor, location, start_time, end_time, repeat_days
            FROM classes
            WHERE user_id = ?
            ORDER BY start_time ASC";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$current_user_id]);
    $classes = $stmt->fetchAll();

    if (empty($classes)) {
        // Return an empty array if no classes are found
        echo json_encode(['success' => true, 'classes' => []]);
    } else {
        // Return the array of classes
        echo json_encode(['success' => true, 'classes' => $classes]);
    }

} catch (\PDOException $e) {
    error_log("Class fetching error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch classes.']);
}
?>