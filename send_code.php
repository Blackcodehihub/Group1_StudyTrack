<?php
// send_code.php → SHORT & CLEAN TOKEN (FP1, FP123, etc.)
header('Content-Type: application/json');
require 'config.php';

$email = trim($_POST['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    exit(json_encode(['success' => false, 'message' => 'Invalid email address']));
}

// Generate SHORT, readable token: FP + number (e.g., FP1, FP827, FP9999)
do {
    $shortCode = 'FP' . random_int(1, 99999); // 5-digit max → FP00001 to FP99999
    $check = $pdo->prepare("SELECT 1 FROM password_resets WHERE id = ?");
    $check->execute([$shortCode]);
} while ($check->fetch()); // ensure no collision (very rare)

$pin = sprintf("%04d", random_int(0, 9999));

try {
    // Delete old requests
    $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);

    // Insert with SHORT token as id
    $stmt = $pdo->prepare("
        INSERT INTO password_resets 
        (id, email, pin, expires_at, used, created_at) 
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 0, NOW())
    ");
    $stmt->execute([$shortCode, $email, $pin]);

    // Send beautiful email
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = GMAIL_USER;
    $mail->Password   = GMAIL_APP_PASSWORD;
    $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom(GMAIL_USER, 'StudyTrack');
    $mail->addAddress($email);
    $mail->Subject = 'Your StudyTrack Verification Code';
    $mail->isHTML(true);

    $mail->Body = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 30px auto; padding: 30px; background: #f8f9fc; border-radius: 16px; text-align: center;'>
            <h2 style='color: #5d4eff;'>StudyTrack</h2>
            <p>Hello!</p>
            <p>Your password reset code is:</p>
            <div style='margin: 40px 0;'>
                <span style='font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #5d4eff; background: white; padding: 20px 40px; border-radius: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.1);'>
                    $pin
                </span>
            </div>
            <p>This code expires in <strong>15 minutes</strong>.</p>
            <p style='color: #888; font-size: 13px;'>If you didn't request this, just ignore it.</p>
        </div>
    ";
    $mail->AltBody = "Your code: $pin (expires in 15 min)";
    $mail->send();

    // Return SHORT token
    echo json_encode([
        'success' => true,
        'message' => 'Code sent successfully!',
        'token'   => $shortCode,           // ← Now short like FP8271
      
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to send code'
    ]);
}
?>