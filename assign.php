<?php
// CRITICAL: Start the session to access $_SESSION['user_id']
session_start();

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 0. CHECK USER AUTHENTICATION
$current_user_id = $_SESSION['user_id'] ?? null; 
if (empty($current_user_id)) {
    http_response_code(403);
    echo json_encode(['error' => 'Authentication required.']);
    exit;
}

// --- ID GENERATION FUNCTION (for ASG1, ASG2, etc.) ---
/**
 * Finds the highest numeric suffix for Assignment IDs and returns the next sequential ID.
 */
function generateNextAssignmentId(mysqli $mysqli): string {
    // Use the database connection to find the last ID
    $sql = "SELECT AssignmentID FROM Assignments 
            WHERE AssignmentID REGEXP '^ASG[0-9]+$'
            ORDER BY CAST(SUBSTRING(AssignmentID, 4) AS UNSIGNED) DESC
            LIMIT 1";

    $result = $mysqli->query($sql);
    $lastIdRow = $result ? $result->fetch_assoc() : null;
    $lastId = $lastIdRow['AssignmentID'] ?? null;

    $nextNumber = 1;

    if ($lastId) {
        // Extract the numeric part (e.g., 'ASG10' -> '10')
        $numberPart = (int) substr($lastId, 3); 
        $nextNumber = $numberPart + 1;
    }

    return 'ASG' . $nextNumber;
}


// 🔐 DATABASE CONFIG
$host = 'localhost';
$dbname = 'studytrack'; 
$username = 'root';
$password = '';

// CRITICAL FIX: Using mysqli object-oriented approach
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
// AssignmentID is now VARCHAR (string)
$id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_SANITIZE_FULL_SPECIAL_CHARS) : null;


try {
    switch ($method) {
        // ✅ GET /assign.php?action=list
        case 'GET':
            if ($action !== 'list') {
                throw new Exception('Invalid action', 400);
            }
            // CRITICAL: Filter by user_id
            $stmt = $mysqli->prepare("
                SELECT AssignmentID, user_id, Title, ClassName, Notes, DueDate, DueTime, Priority, Reminder, CreatedAt, UpdatedAt
                FROM Assignments 
                WHERE user_id = ? 
                ORDER BY 
                    CASE WHEN DueDate < CURDATE() THEN 0 ELSE 1 END,
                    DueDate ASC,
                    DueTime ASC
            ");
            // Bind user_id as string 's'
            $stmt->bind_param('s', $current_user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $assignments = [];
            while ($row = $result->fetch_assoc()) {
                $assignments[] = $row;
            }
            echo json_encode($assignments);
            break;

        // ✅ POST /assign.php (Add New Assignment)
        case 'POST':
            $data = getJsonInput();
            $title = trim($data['Title'] ?? '');
            $className = trim($data['ClassName'] ?? '');
            $notes = trim($data['Notes'] ?? '');
            $dueDate = trim($data['DueDate'] ?? '');
            $dueTime = (!empty($data['DueTime']) && $data['DueTime'] !== 'null') ? $data['DueTime'] : null;
            $priority = in_array($data['Priority'], ['Low', 'Medium', 'High']) ? $data['Priority'] : 'Medium';
            $reminder = in_array($data['Reminder'], ['1_day', '3_days', '1_week']) ? $data['Reminder'] : null;

            if (!$title || !$className || !$dueDate) {
                throw new Exception('Title, Class Name, and Due Date are required', 400);
            }
            
            // Generate new VARCHAR ID
            $newAssignmentId = generateNextAssignmentId($mysqli);

            // CRITICAL: INSERT statement now only includes user_id and assignment fields
            $stmt = $mysqli->prepare("
                INSERT INTO Assignments (AssignmentID, user_id, Title, ClassName, Notes, DueDate, DueTime, Priority, Reminder)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            // Bind parameters: 2 strings for IDs ('ss') + 7 other strings ('sssssss') = 9 total strings
            $stmt->bind_param('sssssssss', 
                $newAssignmentId, 
                $current_user_id, 
                $title, 
                $className, 
                $notes, 
                $dueDate, 
                $dueTime, 
                $priority, 
                $reminder
            );

            if (!$stmt->execute()) {
                throw new Exception('Insert failed: ' . $stmt->error, 500);
            }
            
            // Fetch the newly inserted row by its VARCHAR ID
            $stmt2 = $mysqli->prepare("SELECT * FROM Assignments WHERE AssignmentID = ?");
            $stmt2->bind_param('s', $newAssignmentId);
            $stmt2->execute();
            $newRow = $stmt2->get_result()->fetch_assoc();

            http_response_code(201);
            echo json_encode($newRow);
            break;

        // ✅ PUT /assign.php?id=ASG123 (Update Existing Assignment)
        case 'PUT':
            if (!$id) throw new Exception('AssignmentID required', 400);
            $data = getJsonInput();

            $title = trim($data['Title'] ?? '');
            $className = trim($data['ClassName'] ?? '');
            $notes = trim($data['Notes'] ?? '');
            $dueDate = trim($data['DueDate'] ?? '');
            $dueTime = (!empty($data['DueTime']) && $data['DueTime'] !== 'null') ? $data['DueTime'] : null;
            $priority = in_array($data['Priority'], ['Low', 'Medium', 'High']) ? $data['Priority'] : 'Medium';
            $reminder = in_array($data['Reminder'], ['1_day', '3_days', '1_week']) ? $data['Reminder'] : null;

            if (!$title || !$className || !$dueDate) {
                throw new Exception('Required fields missing', 400);
            }

            // CRITICAL: Update must include user_id for security
            $stmt = $mysqli->prepare("
                UPDATE Assignments 
                SET Title = ?, ClassName = ?, Notes = ?, DueDate = ?, DueTime = ?, Priority = ?, Reminder = ?, UpdatedAt = NOW()
                WHERE AssignmentID = ? AND user_id = ?
            ");
            // Bind parameters: 7 strings for fields ('sssssss') + 2 strings for WHERE clause ('ss') = 9 total strings
            $stmt->bind_param('sssssssss', 
                $title, 
                $className, 
                $notes, 
                $dueDate, 
                $dueTime, 
                $priority, 
                $reminder, 
                $id,                  // VARCHAR AssignmentID
                $current_user_id      // VARCHAR user_id
            );

            if (!$stmt->execute()) {
                throw new Exception('Update failed: ' . $stmt->error, 500);
            }

            if ($stmt->affected_rows === 0) {
                // If 0 affected rows, check if the record exists (it means no changes were made, which is success)
                $check_stmt = $mysqli->prepare("SELECT AssignmentID FROM Assignments WHERE AssignmentID = ? AND user_id = ?");
                $check_stmt->bind_param('ss', $id, $current_user_id);
                $check_stmt->execute();
                if ($check_stmt->get_result()->num_rows === 0) {
                     throw new Exception('Assignment not found or access denied', 404);
                }
            }

            // Fetch the updated row by its VARCHAR ID
            $stmt2 = $mysqli->prepare("SELECT * FROM Assignments WHERE AssignmentID = ? AND user_id = ?");
            $stmt2->bind_param('ss', $id, $current_user_id);
            $stmt2->execute();
            $updated = $stmt2->get_result()->fetch_assoc();
            echo json_encode($updated);
            break;

        // ✅ DELETE /assign.php?id=ASG123
        case 'DELETE':
            if (!$id) throw new Exception('AssignmentID required', 400);

            // CRITICAL: Delete must include user_id for security
            $stmt = $mysqli->prepare("DELETE FROM Assignments WHERE AssignmentID = ? AND user_id = ?");
            $stmt->bind_param('ss', $id, $current_user_id); // Bind both IDs as strings

            if (!$stmt->execute()) {
                throw new Exception('Delete failed: ' . $stmt->error, 500);
            }

            if ($stmt->affected_rows === 0) {
                throw new Exception('Assignment not found or access denied', 404);
            }

            echo json_encode(['success' => true]);
            break;

        default:
            throw new Exception('Method not allowed', 405);
    }

} catch (Exception $e) {
    // Log the full error message for debugging
    error_log("Assignment API Error: " . $e->getMessage()); 
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    echo json_encode(['error' => $e->getMessage()]);
}

$mysqli->close();