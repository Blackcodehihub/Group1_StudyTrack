<?php
// delete_account.php
ini_set('session.cookie_path', '/Group1_StudyTrack');
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

// DO NOT CAST TO INT — your user_id is a string like "USER1"
$userId = $_SESSION['user_id'];   // Keep original value (string or int)

try {
    $pdo = new PDO("mysql:host=localhost;dbname=studytrack;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Disable constraints
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("SET UNIQUE_CHECKS = 0");
    $pdo->exec("SET SQL_SAFE_UPDATES = 0");

    // Use correct placeholder for string or int
    $stmt = $pdo->prepare("DELETE FROM users WHERE user_id = ? LIMIT 1");
    $stmt->execute([$userId]);

    // Re-enable constraints
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    $pdo->exec("SET UNIQUE_CHECKS = 1");
    $pdo->exec("SET SQL_SAFE_UPDATES = 1");

    // Destroy session
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();

    // Success only if a row was actually deleted
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found or already deleted']);
    }

} catch (Exception $e) {
    // Re-enable constraints on error
    try {
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        $pdo->exec("SET UNIQUE_CHECKS = 1");
        $pdo->exec("SET SQL_SAFE_UPDATES = 1");
    } catch (Exception $e2) {}

    error_log("Delete account failed (user_id: '$userId'): " . $e->getMessage());

    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>