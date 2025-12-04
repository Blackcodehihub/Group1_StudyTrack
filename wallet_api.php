<?php
// wallet_api.php
// Compatible with existing users table (user_id INT(11) AUTO_INCREMENT)
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// ================== CONFIG ==================
$host = 'localhost';
$dbname = 'studytrack'; // ← CHANGE if your DB is named differently
$username = 'root';        // ← CHANGE if needed
$password = '';            // ← CHANGE if needed

// Get authenticated user_id (for demo, hardcode to 1 — replace with session later)
$userId = 1; // e.g., $_SESSION['user_id'] ?? 1;

// ================== DATABASE ==================
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// ================== HELPERS ==================

function getWalletSummary($pdo, $userId) {
    // Get totals
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
        FROM wallet_records 
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $summary = $stmt->fetch();

    $balance = $summary['total_income'] - $summary['total_expense'];

    // Recent income (last 3)
    $stmt = $pdo->prepare("
        SELECT id, amount, category, record_date 
        FROM wallet_records 
        WHERE user_id = ? AND type = 'income' 
        ORDER BY created_at DESC LIMIT 3
    ");
    $stmt->execute([$userId]);
    $incomeRecords = $stmt->fetchAll();

    // Recent expense (last 3)
    $stmt = $pdo->prepare("
        SELECT id, amount, category, record_date 
        FROM wallet_records 
        WHERE user_id = ? AND type = 'expense' 
        ORDER BY created_at DESC LIMIT 3
    ");
    $stmt->execute([$userId]);
    $expenseRecords = $stmt->fetchAll();

    return [
        'balance' => floatval($balance),
        'totalIncome' => floatval($summary['total_income']),
        'totalExpense' => floatval($summary['total_expense']),
        'incomeRecords' => array_map(fn($r) => [
            'id' => intval($r['id']),
            'amount' => floatval($r['amount']),
            'category' => $r['category'],
            'date' => $r['record_date']
        ], $incomeRecords),
        'expenseRecords' => array_map(fn($r) => [
            'id' => intval($r['id']),
            'amount' => floatval($r['amount']),
            'category' => $r['category'],
            'date' => $r['record_date']
        ], $expenseRecords)
    ];
}

function getUserTheme($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT theme FROM users WHERE user_id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    return $user ? ($user['theme'] ?? 'dark') : 'dark';
}

function setUserTheme($pdo, $userId, $theme) {
    $theme = in_array($theme, ['dark', 'light']) ? $theme : 'dark';
    $stmt = $pdo->prepare("UPDATE users SET theme = ? WHERE user_id = ?");
    return $stmt->execute([$theme, $userId]);
}

// ================== ROUTING ==================
$method = $_SERVER['REQUEST_METHOD'];
$get = $_GET['get'] ?? null;

try {
    switch ($method) {
        case 'GET':
            if ($get === 'wallet') {
                echo json_encode([
                    'wallet' => getWalletSummary($pdo, $userId)
                ]);
            } elseif ($get === 'theme') {
                echo json_encode(['theme' => getUserTheme($pdo, $userId)]);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Missing ?get=... parameter (e.g., ?get=wallet)']);
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) throw new Exception('Invalid or empty JSON input');

            $type = $input['type'] ?? null;
            $amount = floatval($input['amount'] ?? 0);
            $category = trim($input['category'] ?? 'Other');
            $description = trim($input['description'] ?? '');

            if (!in_array($type, ['income', 'expense'])) {
                throw new Exception('Invalid type. Must be "income" or "expense"');
            }
            if ($amount <= 0) {
                throw new Exception('Amount must be greater than 0');
            }

            $stmt = $pdo->prepare("
                INSERT INTO wallet_records (user_id, type, amount, category, description, record_date, created_at)
                VALUES (?, ?, ?, ?, ?, CURDATE(), NOW())
            ");
            $stmt->execute([$userId, $type, $amount, $category, $description]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'wallet' => getWalletSummary($pdo, $userId)
            ]);
            break;

        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) throw new Exception('Invalid JSON');

            $id = intval($input['id'] ?? 0);
            $type = $input['type'] ?? '';

            if ($id <= 0) {
                throw new Exception('Invalid record ID');
            }
            if (!in_array($type, ['income', 'expense'])) {
                throw new Exception('Invalid type. Must be "income" or "expense"');
            }

            // 🔒 Ensure record exists AND belongs to current user
            $checkStmt = $pdo->prepare("
                SELECT id FROM wallet_records 
                WHERE id = ? AND user_id = ? AND type = ?
            ");
            $checkStmt->execute([$id, $userId, $type]);
            $record = $checkStmt->fetch();

            if (!$record) {
                http_response_code(404);
                throw new Exception('Record not found or access denied');
            }

            // ✅ Delete it
            $delStmt = $pdo->prepare("DELETE FROM wallet_records WHERE id = ? AND user_id = ?");
            $deleted = $delStmt->execute([$id, $userId]);

            if (!$deleted) {
                throw new Exception('Failed to delete record');
            }

            // ✅ Return fresh wallet state
            echo json_encode([
                'success' => true,
                'message' => 'Record deleted successfully',
                'wallet' => getWalletSummary($pdo, $userId)
            ]);
            break;

        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $theme = $input['theme'] ?? null;
            if (!in_array($theme, ['dark', 'light'])) {
                throw new Exception('Invalid theme. Use "dark" or "light"');
            }
            $updated = setUserTheme($pdo, $userId, $theme);
            if (!$updated) {
                throw new Exception('Failed to update theme');
            }
            echo json_encode(['success' => true, 'theme' => $theme]);
            break;

        case 'OPTIONS':
            http_response_code(204); // No Content
            exit();

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed. Use GET, POST, PUT, or DELETE']);
            break;
    }
} catch (Exception $e) {
    error_log("Wallet API Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?>