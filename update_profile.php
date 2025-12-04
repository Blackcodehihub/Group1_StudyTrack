<?php
// update_profile.php
ini_set('session.cookie_path', '/Group1_StudyTrack');
ini_set('session.cookie_domain', 'localhost');
ini_set('session.cookie_secure', '0');
ini_set('session.cookie_httponly', '0');
ini_set('session.cookie_samesite', 'Lax');

session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $pdo = new PDO("mysql:host=localhost;dbname=studytrack;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $updated = false;
    $message = '';

    // Update Password
    if (!empty($_POST['new_password'])) {
        $new_pass = $_POST['new_password'];
        if (strlen($new_pass) < 8) {
            echo json_encode(['success' => false, 'message' => 'Password must be 8+ characters']);
            exit;
        }
        $hash = password_hash($new_pass, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
        $stmt->execute([$hash, $user_id]);

        // Update session for eye toggle
        $_SESSION['plain_password'] = $new_pass;

        $updated = true;
        $message = 'Password updated successfully!';
    }

    // Update Avatar (BLOB)
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === 0) {
        $file = $_FILES['avatar'];
        $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $allowed) || $file['size'] > 5*1024*1024) {
            echo json_encode(['success' => false, 'message' => 'Invalid or large image']);
            exit;
        }

        $img_data = file_get_contents($file['tmp_name']);
        $stmt = $pdo->prepare("UPDATE users SET profile_pic = ? WHERE user_id = ?");
        $stmt->execute([$img_data, $user_id]);

        $updated = true;
        $message = 'Avatar updated!';
    }

    if ($updated) {
        echo json_encode(['success' => true, 'message' => $message]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No changes made']);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>