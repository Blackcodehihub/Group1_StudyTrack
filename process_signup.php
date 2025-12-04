<?php
// **********************************************
// 1. START SESSION
session_start();
// **********************************************

// --- 0. ID GENERATION FUNCTION ---
/**
 * Finds the highest numeric suffix for user IDs (e.g., from USER10 extracts 10),
 * increments it, and returns the next sequential ID (e.g., USER11).
 */
function generateNextUserId(PDO $pdo): string {
    try {
        // Use REGEXP to filter only IDs starting with 'USER' and containing numbers
        $sql = "SELECT user_id FROM users 
                WHERE user_id REGEXP '^USER[0-9]+$'
                ORDER BY CAST(SUBSTRING(user_id, 5) AS UNSIGNED) DESC
                LIMIT 1";

        $stmt = $pdo->query($sql);
        $lastId = $stmt->fetchColumn();

        $nextNumber = 1;

        if ($lastId) {
            // Extract the numeric part (e.g., 'USER10' -> '10')
            // SUBSTRING starts at index 5 (1-based: U-S-E-R-X)
            $numberPart = (int) substr($lastId, 4); 
            $nextNumber = $numberPart + 1;
        }

        return 'USER' . $nextNumber;
    } catch (\PDOException $e) {
        error_log("User ID generation error: " . $e->getMessage());
        throw $e;
    }
}


// 2. DATABASE CONFIGURATION (No change)
$host = 'localhost';
$db   = 'studytrack';
$user = 'root';
$pass = ''; 

$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     throw new \PDOException($e->getMessage(), (int)$e->getCode());
}

// 3. CHECK IF FORM WAS SUBMITTED (No change)
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: Sign-up.html");
    exit();
}

// 4. RETRIEVE AND SANITIZE INPUTS
$first_name = filter_input(INPUT_POST, 'first_name', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$last_name  = filter_input(INPUT_POST, 'last_name', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$email      = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$password   = $_POST['password'] ?? ''; 

// 5. SERVER-SIDE VALIDATION (No change)
$errors = [];

// Basic field checks
if (empty($first_name) || empty($last_name) || empty($email) || empty($password)) {
    $errors[] = "All required fields must be filled.";
}

// Email format check
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Invalid email format.";
}

// Password Policy Check (No change)
$password_policy = [
    'length'  => (strlen($password) >= 8),
    'capital' => preg_match('/[A-Z]/', $password),
    'number'  => preg_match('/[0-9]/', $password),
    'special' => preg_match('/[^a-zA-Z0-9\s]/', $password)
];

if (!$password_policy['length'] || !$password_policy['capital'] || !$password_policy['number'] || !$password_policy['special']) {
    $errors[] = "Password must be at least 8 characters and contain an uppercase letter, a number, and a special character.";
}


// 6. IF VALIDATION FAILS (No change)
if (!empty($errors)) {
    echo "<h2>Validation Errors:</h2>";
    echo "<ul>";
    foreach ($errors as $error) {
        echo "<li>" . $error . "</li>";
    }
    echo "</ul>";
    exit();
}


// 7. CHECK IF EMAIL ALREADY EXISTS (No change)
try {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetchColumn() > 0) {
        echo "Error: The email address is already registered.";
        exit();
    }
} catch (\PDOException $e) {
    echo "Database error during email check: " . $e->getMessage();
    exit();
}


// 8. HASH PASSWORD & INSERT DATA
$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // CRITICAL: Generate the next VARCHAR User ID
    $new_user_id = generateNextUserId($pdo);

    // CRITICAL: Include user_id in the INSERT statement
    $sql = "INSERT INTO users (user_id, first_name, last_name, email, password_hash)
            VALUES (?, ?, ?, ?, ?)";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $new_user_id,            // <-- The generated VARCHAR ID
        $first_name,
        $last_name,
        $email,
        $password_hash
    ]);

    // **********************************************
    // NEW: Use the generated ID for the session
    $_SESSION['user_id'] = $new_user_id;

    // Optional: Store other useful session data
    $_SESSION['user_first_name'] = $first_name;
    // **********************************************


    // Success! Redirect to HomeF.html
    header("Location: HomeF.html");
    exit();

} catch (\PDOException $e) {
    echo "Database Insertion Error: " . $e->getMessage();
}
?>