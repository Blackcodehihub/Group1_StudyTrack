<?php
// 1. DATABASE CONFIGURATION
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
     echo json_encode(['error' => 'A server error occurred.']);
     exit();
}

// 2. RETRIEVE AND SANITIZE INPUT
$email = filter_input(INPUT_GET, 'email', FILTER_SANITIZE_EMAIL);

// Set default response headers
header('Content-Type: application/json');

// 3. SERVER-SIDE VALIDATION
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['exists' => false]);
    exit();
}

// 4. CHECK IF EMAIL ALREADY EXISTS
try {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $email_exists = $stmt->fetchColumn() > 0;
    
    // Return JSON response
    echo json_encode(['exists' => $email_exists]);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database check failed.']);
    exit();
}
?>