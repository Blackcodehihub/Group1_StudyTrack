<?php
// 1. DATABASE CONFIGURATION (No change)
$host = 'localhost';
$db   = 'studytrack_db';
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

// 2. CHECK IF FORM WAS SUBMITTED (No change)
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: Sign-up.html");
    exit();
}

// 3. RETRIEVE AND SANITIZE INPUTS
$first_name = filter_input(INPUT_POST, 'first_name', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$last_name  = filter_input(INPUT_POST, 'last_name', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$email      = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$password   = $_POST['password'] ?? ''; 

// REMOVED: $university_name and $school_id retrieval


// 4. SERVER-SIDE VALIDATION (No change to logic, just cleaned up comments)
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


// 5. IF VALIDATION FAILS (No change)
if (!empty($errors)) {
    echo "<h2>Validation Errors:</h2>";
    echo "<ul>";
    foreach ($errors as $error) {
        echo "<li>" . $error . "</li>";
    }
    echo "</ul>";
    exit();
}


// 6. CHECK IF EMAIL ALREADY EXISTS (No change)
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


// 7. HASH PASSWORD & INSERT DATA
$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // UPDATED SQL: Removed the two placeholders and columns
    $sql = "INSERT INTO users (first_name, last_name, email, password_hash)
            VALUES (?, ?, ?, ?)";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $first_name,
        $last_name,
        $email,
        $password_hash
        // REMOVED: $university_name and $school_id execution values
    ]);

    // Success! Redirect to HomeF.html
    header("Location: HomeF.html");
    exit();

} catch (\PDOException $e) {
    echo "Database Insertion Error: " . $e->getMessage();
}
?>