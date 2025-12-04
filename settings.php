<?php
// ===== FIX SESSION FOR localhost + /Group1_StudyTrack subfolder =====
ini_set('session.cookie_path', '/Group1_StudyTrack');
ini_set('session.cookie_domain', 'localhost');
ini_set('session.cookie_secure', '0');
ini_set('session.cookie_httponly', '0');
ini_set('session.cookie_samesite', 'Lax');

session_start();
header('Content-Type: application/json');

// Check login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=localhost;dbname=studytrack;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // CORRECT COLUMN NAMES FROM YOUR DB
    $stmt = $pdo->prepare("
    SELECT first_name, last_name, email, profile_pic, password_hash
    FROM users
    WHERE user_id = ?
");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'first_name' => $user['first_name'] ?? '',
            'last_name'  => $user['last_name'] ?? '',
            'email'      => $user['email'] ?? '',
            // CORRECT AVATAR PATH + DEFAULT
            'avatar' => !empty($user['profile_pic']) 
    ? 'data:image/png;base64,' . base64_encode($user['profile_pic'])
    : 'images_icons/user.png',
            'plain_password' => $_SESSION['plain_password'] ?? '',
            'password_hash' => $user['password_hash'] ?? '',
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>