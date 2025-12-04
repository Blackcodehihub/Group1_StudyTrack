<?php
// === DEBUG MODE ===
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// CRITICAL: Start the session to access $_SESSION['user_id']
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// 0. CHECK USER AUTHENTICATION
$current_user_id = $_SESSION['user_id'] ?? null; 
if (empty($current_user_id)) {
    http_response_code(403);
    echo json_encode(['error' => 'Authentication required.']);
    exit;
}

// --- ID GENERATION FUNCTION ---
/**
 * Finds the highest numeric suffix for reminder IDs and returns the next sequential ID (e.g., REM11).
 */
function generateNextReminderId(PDO $pdo): string {
    try {
        $sql = "SELECT id FROM reminders 
                WHERE id REGEXP '^REM[0-9]+$'
                ORDER BY CAST(SUBSTRING(id, 4) AS UNSIGNED) DESC
                LIMIT 1";

        $stmt = $pdo->query($sql);
        $lastId = $stmt->fetchColumn();

        $nextNumber = 1;

        if ($lastId) {
            // Extract the numeric part (e.g., 'REM10' -> '10')
            $numberPart = (int) substr($lastId, 3); 
            $nextNumber = $numberPart + 1;
        }

        return 'REM' . $nextNumber;
    } catch (\PDOException $e) {
        error_log("Reminder ID generation error: " . $e->getMessage());
        throw $e;
    }
}


// ✅ MySQL CONFIG — XAMPP defaults
$host = 'localhost';
$dbname = 'studytrack';   // Your existing database
$username = 'root';
$password = '';              // Default XAMPP: no password

try {
    // Connect to MySQL
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // CRITICAL FIX: Removed class_id from the table creation statement
    $pdo->exec("CREATE TABLE IF NOT EXISTS reminders (
        id VARCHAR(50) PRIMARY KEY,                                 
        user_id VARCHAR(50) NOT NULL,                               
        title VARCHAR(255) NOT NULL,
        due_date DATE NOT NULL,
        due_time TIME NOT NULL,
        remind_before VARCHAR(50) DEFAULT 'None',
        priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    // NOTE: FK constraints should be applied separately.

} catch (Exception $e) {
    error_log("DB CONNECTION FAILED: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
    exit;
}

// === API LOGIC ===
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_SANITIZE_FULL_SPECIAL_CHARS) : null; 

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->prepare("SELECT * FROM reminders WHERE user_id = ? ORDER BY due_date ASC, due_time ASC");
            $stmt->execute([$current_user_id]);
            echo json_encode($stmt->fetchAll() ?: []);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['title'], $data['due_date'], $data['due_time'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields: title, due_date, due_time']);
                exit;
            }
            
            $new_reminder_id = generateNextReminderId($pdo);

            // CRITICAL FIX: Removed class_id placeholder
            $stmt = $pdo->prepare("INSERT INTO reminders (id, user_id, title, due_date, due_time, remind_before, priority, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $new_reminder_id,                           // VARCHAR ID
                $current_user_id,                           // VARCHAR USER_ID
                trim($data['title']),
                $data['due_date'],
                $data['due_time'],
                $data['remind_before'] ?? 'None',
                $data['priority'] ?? 'medium',
                $data['notes'] ?? ''
            ]);

            echo json_encode(['id' => $new_reminder_id, 'success' => true]);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID required']);
                exit;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            
            // CRITICAL FIX: Removed class_id column from SET clause
            $stmt = $pdo->prepare("UPDATE reminders SET 
                title = ?, due_date = ?, due_time = ?, remind_before = ?, priority = ?, notes = ?
                WHERE id = ? AND user_id = ?");
            $stmt->execute([
                trim($data['title']),
                $data['due_date'],
                $data['due_time'],
                $data['remind_before'] ?? 'None',
                $data['priority'] ?? 'medium',
                $data['notes'] ?? '',
                $id,                                    
                $current_user_id                        
            ]);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID required']);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM reminders WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $current_user_id]);
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("API ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
?>