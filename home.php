<?php
header('Content-Type: application/json');
$host = 'localhost'; $dbname = 'studytrack'; $user = 'root'; $pass = '';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Handle the existing 'get_classes' action, but fix the FIND_IN_SET logic for " & " format
    if ($_GET['action'] === 'get_classes') {
        $day = $_GET['day'] ?? '';
        $valid = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        if (!in_array($day, $valid)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid day']);
            exit;
        }
        // Use REPLACE to convert " & " to "," before using FIND_IN_SET
        $stmt = $pdo->prepare("SELECT subject_name,instructor,location,start_time,end_time FROM classes WHERE FIND_IN_SET(?, REPLACE(repeat_days, ' & ', ',')) > 0");
        $stmt->execute([$day]);
        echo json_encode(['success' => true, 'classes' => $stmt->fetchAll()]);
        exit;
    }

    // You can keep the original 'get_classes' action or remove it if not used elsewhere.
    // The key change is using REPLACE in the SQL query.

    http_response_code(400);
    echo json_encode(['error' => 'Invalid action']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
?>