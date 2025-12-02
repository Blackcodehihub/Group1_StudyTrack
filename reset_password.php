<?php
header('Content-Type: application/json');
require 'config.php';

$token = $_POST['token'] ?? '';
$newPassword = $_POST['password'] ?? '';

if (strlen($newPassword) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password too short']);
    exit;
}

// Get email from valid token (even if used, just to update password)
$stmt = $pdo->prepare("SELECT email FROM password_resets WHERE id = ?");
$stmt->execute([$token]);
$reset = $stmt->fetch();

if (!$reset) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$email = $reset['email'];
$hash = password_hash($newPassword, PASSWORD_DEFAULT);

// Update password in users table
$stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
$stmt->execute([$hash, $email]);

// Optional: delete all reset requests for this email
$pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);

echo json_encode(['success' => true, 'message' => 'Password changed successfully!']);
?>