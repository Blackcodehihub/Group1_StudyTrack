<?php
// CRITICAL: Start the PHP session FIRST. This makes $_SESSION available.
session_start();

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

// 2. CHECK FOR POST REQUEST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

// 3. RETRIEVE AND SANITIZE INPUTS
$email_input = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$password_input = $_POST['password'] ?? '';

if (empty($email_input) || empty($password_input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and Password are required.']);
    exit();
}

// 4. FIND USER BY EMAIL AND GET HASH
try {
    // Select the user_id and password_hash for verification
    $stmt = $pdo->prepare("SELECT user_id, password_hash, first_name FROM users WHERE email = ?");
    $stmt->execute([$email_input]);
    $user = $stmt->fetch();

    if (!$user) {
        // User not found
        http_response_code(401); 
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit();
    }

    $stored_hash = $user['password_hash'];

} catch (\PDOException $e) {
    error_log("Login query error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'A server error occurred during authentication.']);
    exit();
}

// 5. VERIFY PASSWORD HASH
if (password_verify($password_input, $stored_hash)) {
    
    // --- SUCCESS: START SESSION AND STORE ID ---
    // This makes the user_id globally accessible across PHP scripts.
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['first_name'] = $user['first_name'];
    
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Login successful!']);

} else {
    // FAILURE: Password does not match
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
}
?>