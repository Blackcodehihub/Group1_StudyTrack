<?php
// CRITICAL: Start the session to access $_SESSION['user_id']
session_start();

header('Content-Type: application/json');

$host = 'localhost'; 
$dbname = 'studytrack'; 
$user = 'root'; 
$pass = '';

$current_user_id = $_SESSION['user_id'] ?? null;

// Handle authentication failure across all actions
if (empty($current_user_id)) {
    // Return a 403 status explicitly if no user is logged in
    http_response_code(403);
    echo json_encode(['error' => 'Authentication required.', 'auth_status' => false]);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $action = $_GET['action'] ?? null;
    
    // --- 1. Get User Data for Greeting ---
    if ($action === 'get_user_info') {
        $stmt = $pdo->prepare("SELECT first_name FROM users WHERE user_id = ?");
        $stmt->execute([$current_user_id]); 
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found.']);
            exit;
        }

        echo json_encode(['success' => true, 'first_name' => $user['first_name']]);
        exit;
    }

    // --- 2. Get Classes for Today/Selected Day ---
    if ($action === 'get_classes') {
        $day = $_GET['day'] ?? '';
        $valid = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        
        if (empty($day) || !in_array($day, $valid)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid day parameter']);
            exit;
        }
        
        // CRITICAL FIX: Filter by current user_id AND by day
        $stmt = $pdo->prepare("
            SELECT subject_name, instructor, location, start_time, end_time 
            FROM classes 
            WHERE user_id = ? 
            AND FIND_IN_SET(?, REPLACE(repeat_days, ' ', '')) > 0
            ORDER BY start_time ASC
        ");
        
        $day_short = substr($day, 0, 3);
        
        // CRITICAL: Bind user_id (VARCHAR) and day (string)
        $stmt->execute([$current_user_id, $day_short]);
        
        echo json_encode(['success' => true, 'classes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }
    
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action parameter']);

} catch (Exception $e) {
    error_log("Home API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error during database query.']);
}
?>