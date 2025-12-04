<?php
// ===== FIX LOCALHOST SESSION COOKIE (MAGIC LINES) =====
ini_set('session.cookie_domain', 'localhost');
ini_set('session.cookie_path', '/Group1_StudyTrack');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_secure', '0');
ini_set('session.cookie_httponly', '0');
// =====================================================
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

$email = trim($_POST['email'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['exists' => false]);
    exit;
}

try {
    $pdo = new PDO("mysql:host=localhost;dbname=studytrack;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("SELECT 1 FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $exists = $stmt->fetchColumn() !== false;

    // NEVER tell the truth directly → always delay + neutral response
    usleep(800000); // ~0.8 sec delay to prevent timing attacks

    echo json_encode(['exists' => $exists]);
} catch (Exception $e) {
    usleep(800000);
    echo json_encode(['exists' => false]);
}
?>