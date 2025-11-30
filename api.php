<?php
// === DEBUG MODE ===
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
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

    // ✅ Ensure table exists (safe for existing DB)
    $pdo->exec("CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        due_date DATE NOT NULL,
        due_time TIME NOT NULL,
        remind_before VARCHAR(50) DEFAULT 'None',
        priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

} catch (Exception $e) {
    error_log("DB CONNECTION FAILED: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
    exit;
}

// === API LOGIC ===
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM reminders ORDER BY due_date ASC, due_time ASC");
            echo json_encode($stmt->fetchAll() ?: []);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data || !isset($data['title'], $data['due_date'], $data['due_time'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields: title, due_date, due_time']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO reminders (title, due_date, due_time, remind_before, priority, notes) 
                VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                trim($data['title']),
                $data['due_date'],
                $data['due_time'],
                $data['remind_before'] ?? 'None',
                $data['priority'] ?? 'medium',
                $data['notes'] ?? ''
            ]);

            echo json_encode(['id' => $pdo->lastInsertId(), 'success' => true]);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID required']);
                exit;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE reminders SET 
                title = ?, due_date = ?, due_time = ?, remind_before = ?, priority = ?, notes = ?
                WHERE id = ?");
            $stmt->execute([
                trim($data['title']),
                $data['due_date'],
                $data['due_time'],
                $data['remind_before'] ?? 'None',
                $data['priority'] ?? 'medium',
                $data['notes'] ?? '',
                $id
            ]);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID required']);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM reminders WHERE id = ?");
            $stmt->execute([$id]);
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