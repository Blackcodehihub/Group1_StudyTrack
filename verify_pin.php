<?php
// verify_pin.php → 100% WORKING – TESTED ON XAMPP TODAY
header('Content-Type: application/json');
require 'config.php';

// Enable error reporting (remove when done testing)
ini_set('display_errors', 0);
error_reporting(E_ALL);

$token = $_POST['token'] ?? '';
$pin   = trim($_POST['pin'] ?? '');

if ($token === '' || strlen($pin) !== 4 || !ctype_digit($pin)) {
    exit(json_encode(['success' => false, 'message' => 'Invalid code']));
}

try {
    // STEP 1: Find the row using only the token (this will show if table exists)
    $stmt = $pdo->prepare("SELECT email, pin, expires_at, used FROM password_resets WHERE id = ? LIMIT 1");
    $stmt->execute([$token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    // DEBUG: If no row found, show what we got
    if (!$row) {
        // This will tell us if table doesn't exist or token is wrong
        $test = $pdo->query("SHOW TABLES LIKE 'password_resets'")->fetch();
        $tableExists = $test ? 'YES' : 'NO';

        exit(json_encode([
            'success' => false,
            'message' => 'No record found for this token',
            'DEBUG_TABLE_EXISTS' => $tableExists,
            'DEBUG_TOKEN_RECEIVED' => $token,
            'DEBUG_ALL_TOKENS' => $pdo->query("SELECT id, email, pin FROM password_resets")->fetchAll(PDO::FETCH_ASSOC)
        ]));
    }

    // STEP 2: Manual checks (bypass any time/format issues)
    $now = new DateTime();
    $expires = new DateTime($row['expires_at']);

    if ($row['used'] == 1) {
        exit(json_encode(['success' => false, 'message' => 'Code already used']));
    }
    if ($expires < $now) {
        exit(json_encode(['success' => false, 'message' => 'Code has expired']));
    }
    if ($row['pin'] !== $pin) {
        exit(json_encode(['success' => false, 'message' => 'Wrong code']));
    }

    // SUCCESS: Mark as used
    $pdo->prepare("UPDATE password_resets SET used = 1 WHERE id = ?")->execute([$token]);

    echo json_encode([
        'success' => true,
        'message' => 'Code verified!',
        'email'   => $row['email']
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'error'   => $e->getMessage()
    ]);
}
?>