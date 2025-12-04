<?php
// config.php
header('Content-Type: application/json');

$host = 'localhost';
$db   = 'studytrack';
$user = 'root';
$pass = '';                    // XAMPP default
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'Database error']));
}

// PHPMailer Autoload (you'll download it in a sec)
require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

// Your Gmail credentials
define('GMAIL_USER', 'jadoksenpai12@gmail.com');           // ← CHANGE THIS
define('GMAIL_APP_PASSWORD', 'sbhs xauv vfek jfld');   // ← CHANGE THIS (16-char app password)
?>