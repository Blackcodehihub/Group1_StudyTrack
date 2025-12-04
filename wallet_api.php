<?php
// wallet_api.php - Handles financial records
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

// 0. CHECK USER AUTHENTICATION
$current_user_id = $_SESSION['user_id'] ?? null; 
if (empty($current_user_id)) {
    http_response_code(403);
    echo json_encode(['error' => 'Authentication required.']);
    exit;
}

// --- ID GENERATION FUNCTION (for WAL1, WAL2, etc.) ---
/**
 * Finds the highest numeric suffix for Wallet IDs and returns the next sequential ID.
 */
function generateNextWalletId(PDO $pdo): string {
    try {
        $sql = "SELECT id FROM wallet_records 
                WHERE id REGEXP '^WAL[0-9]+$'
                ORDER BY CAST(SUBSTRING(id, 4) AS UNSIGNED) DESC
                LIMIT 1";

        $stmt = $pdo->query($sql);
        $lastId = $stmt->fetchColumn();

        $nextNumber = 1;

        if ($lastId) {
            // Extract the numeric part (e.g., 'WAL10' -> '10')
            $numberPart = (int) substr($lastId, 3); 
            $nextNumber = $numberPart + 1;
        }

        return 'WAL' . $nextNumber;
    } catch (\PDOException $e) {
        error_log("Wallet ID generation error: " . $e->getMessage());
        throw $e;
    }
}

// ================== CONFIG ==================
$host = 'localhost';
$dbname = 'studytrack'; 
$username = 'root';        
$password = '';            

// ================== DATABASE ==================
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
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
    // $userId is VARCHAR
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

    // CRITICAL: ID is now VARCHAR, no need for intval() but keeping floatval for amount
    return [
        'balance' => floatval($balance),
        'totalIncome' => floatval($summary['total_income']),
        'totalExpense' => floatval($summary['total_expense']),
        'incomeRecords' => array_map(fn($r) => [
            'id' => $r['id'], // VARCHAR ID
            'amount' => floatval($r['amount']),
            'category' => $r['category'],
            'date' => $r['record_date']
        ], $incomeRecords),
        'expenseRecords' => array_map(fn($r) => [
            'id' => $r['id'], // VARCHAR ID
            'amount' => floatval($r['amount']),
            'category' => $r['category'],
            'date' => $r['record_date']
        ], $expenseRecords)
    ];
}

function getUserTheme($pdo, $userId) {
    // NOTE: This assumes the 'theme' column is now in the users table
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
                    'wallet' => getWalletSummary($pdo, $current_user_id)
                ]);
            } elseif ($get === 'theme') {
                echo json_encode(['theme' => getUserTheme($pdo, $current_user_id)]);
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
            
            // CRITICAL: Generate new VARCHAR ID
            $new_wallet_id = generateNextWalletId($pdo);

            // CRITICAL: Include ID and user_id in INSERT statement
            $stmt = $pdo->prepare("
                INSERT INTO wallet_records (id, user_id, type, amount, category, description, record_date, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURDATE(), NOW())
            ");
            $stmt->execute([
                $new_wallet_id,
                $current_user_id, // VARCHAR user_id
                $type, 
                $amount, 
                $category, 
                $description
            ]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'wallet' => getWalletSummary($pdo, $current_user_id)
            ]);
            break;

        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) throw new Exception('Invalid JSON');

            // CRITICAL: ID is now VARCHAR (string)
            $id = $input['id'] ?? ''; 
            $type = $input['type'] ?? '';

            if (empty($id)) {
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
            // IDs are VARCHAR
            $checkStmt->execute([$id, $current_user_id, $type]);
            $record = $checkStmt->fetch();

            if (!$record) {
                http_response_code(404);
                throw new Exception('Record not found or access denied');
            }

            // ✅ Delete it
            $delStmt = $pdo->prepare("DELETE FROM wallet_records WHERE id = ? AND user_id = ?");
            // IDs are VARCHAR
            $deleted = $delStmt->execute([$id, $current_user_id]);

            if (!$deleted) {
                throw new Exception('Failed to delete record');
            }

            // ✅ Return fresh wallet state
            echo json_encode([
                'success' => true,
                'message' => 'Record deleted successfully',
                'wallet' => getWalletSummary($pdo, $current_user_id)
            ]);
            break;

        case 'PUT':
            // This section is for theme updates, often done from settings
            $input = json_decode(file_get_contents('php://input'), true);
            $theme = $input['theme'] ?? null;
            if (!in_array($theme, ['dark', 'light'])) {
                throw new Exception('Invalid theme. Use "dark" or "light"');
            }
            $updated = setUserTheme($pdo, $current_user_id, $theme);
            if (!$updated) {
                throw new Exception('Failed to update theme');
            }
            echo json_encode(['success' => true, 'theme' => $theme]);
            break;

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