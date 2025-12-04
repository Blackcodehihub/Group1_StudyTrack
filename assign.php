<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 🔐 DATABASE CONFIG — UPDATE THESE IF NEEDED
$host = 'localhost';
$dbname = 'studytrack_db';
$username = 'root';
$password = ''; // ← set if you have MySQL password

$mysqli = new mysqli($host, $username, $password, $dbname);

if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'DB Connection Failed: ' . $mysqli->connect_error]);
    exit;
}
$mysqli->set_charset("utf8mb4");

function getJsonInput() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    switch ($method) {
        // ✅ GET /assign.php?action=list
        case 'GET':
            if ($action !== 'list') {
                throw new Exception('Invalid action', 400);
            }
            $result = $mysqli->query("
                SELECT * FROM Assignments 
                ORDER BY 
                    CASE WHEN DueDate < CURDATE() THEN 0 ELSE 1 END,
                    DueDate ASC,
                    DueTime ASC
            ");
            $assignments = [];
            while ($row = $result->fetch_assoc()) {
                $assignments[] = $row;
            }
            echo json_encode($assignments);
            break;

        // ✅ POST /assign.php
        case 'POST':
            $data = getJsonInput();
            $title = trim($data['Title'] ?? '');
            $className = trim($data['ClassName'] ?? '');
            $notes = trim($data['Notes'] ?? ''); // Added notes
            $dueDate = trim($data['DueDate'] ?? '');
            $dueTime = (!empty($data['DueTime']) && $data['DueTime'] !== 'null') ? $data['DueTime'] : null;
            $priority = in_array($data['Priority'], ['Low', 'Medium', 'High']) ? $data['Priority'] : 'Medium';
            $reminder = in_array($data['Reminder'], ['1_day', '3_days', '1_week']) ? $data['Reminder'] : null;

            if (!$title || !$className || !$dueDate) {
                throw new Exception('Title, Class Name, and Due Date are required', 400);
            }

            $stmt = $mysqli->prepare("
                INSERT INTO Assignments (Title, ClassName, Notes, DueDate, DueTime, Priority, Reminder)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param('sssssss', $title, $className, $notes, $dueDate, $dueTime, $priority, $reminder);

            if (!$stmt->execute()) {
                throw new Exception('Insert failed: ' . $stmt->error, 500);
            }

            $newId = $mysqli->insert_id;
            $stmt2 = $mysqli->prepare("SELECT * FROM Assignments WHERE AssignmentID = ?");
            $stmt2->bind_param('i', $newId);
            $stmt2->execute();
            $newRow = $stmt2->get_result()->fetch_assoc();

            http_response_code(201);
            echo json_encode($newRow);
            break;

        // ✅ PUT /assign.php?id=123
        case 'PUT':
            if (!$id) throw new Exception('AssignmentID required', 400);
            $data = getJsonInput();

            $title = trim($data['Title'] ?? '');
            $className = trim($data['ClassName'] ?? '');
            $notes = trim($data['Notes'] ?? ''); // Added notes
            $dueDate = trim($data['DueDate'] ?? '');
            $dueTime = (!empty($data['DueTime']) && $data['DueTime'] !== 'null') ? $data['DueTime'] : null;
            $priority = in_array($data['Priority'], ['Low', 'Medium', 'High']) ? $data['Priority'] : 'Medium';
            $reminder = in_array($data['Reminder'], ['1_day', '3_days', '1_week']) ? $data['Reminder'] : null;

            if (!$title || !$className || !$dueDate) {
                throw new Exception('Required fields missing', 400);
            }

            $stmt = $mysqli->prepare("
                UPDATE Assignments 
                SET Title = ?, ClassName = ?, Notes = ?, DueDate = ?, DueTime = ?, Priority = ?, Reminder = ?, UpdatedAt = NOW()
                WHERE AssignmentID = ?
            ");
            $stmt->bind_param('sssssssi', $title, $className, $notes, $dueDate, $dueTime, $priority, $reminder, $id);

            if (!$stmt->execute()) {
                throw new Exception('Update failed: ' . $stmt->error, 500);
            }

            if ($stmt->affected_rows === 0) {
                throw new Exception('Assignment not found', 404);
            }

            $stmt2 = $mysqli->prepare("SELECT * FROM Assignments WHERE AssignmentID = ?");
            $stmt2->bind_param('i', $id);
            $stmt2->execute();
            $updated = $stmt2->get_result()->fetch_assoc();
            echo json_encode($updated);
            break;

        // ✅ DELETE /assign.php?id=123
        case 'DELETE':
            if (!$id) throw new Exception('AssignmentID required', 400);

            $stmt = $mysqli->prepare("DELETE FROM Assignments WHERE AssignmentID = ?");
            $stmt->bind_param('i', $id);

            if (!$stmt->execute()) {
                throw new Exception('Delete failed: ' . $stmt->error, 500);
            }

            if ($stmt->affected_rows === 0) {
                throw new Exception('Assignment not found', 404);
            }

            echo json_encode(['success' => true]);
            break;

        default:
            throw new Exception('Method not allowed', 405);
    }

} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    echo json_encode(['error' => $e->getMessage()]);
}

$mysqli->close();
?>