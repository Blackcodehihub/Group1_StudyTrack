<?php
// 1. DATABASE CONFIGURATION (Replace with your XAMPP settings)
$host = 'localhost';
$db   = 'studytrack_db';
$user = 'root';
$pass = ''; // Default XAMPP root password is often empty

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

// 2. CHECK IF FORM WAS SUBMITTED
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    // Redirect or display an error if accessed directly
    header("Location: Sign-up.html");
    exit();
}

// 3. RETRIEVE AND SANITIZE INPUTS
$first_name = filter_input(INPUT_POST, 'first_name', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$last_name  = filter_input(INPUT_POST, 'last_name', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$email      = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$password   = $_POST['password'] ?? ''; // No sanitization for password, validation follows

// School info from hidden or optional fields (defaults to NULL/empty string)
// You may need to update your HTML to send these fields.
$university_name = filter_input(INPUT_POST, 'university_name', FILTER_SANITIZE_FULL_SPECIAL_CHARS) ?? NULL;
$school_id       = filter_input(INPUT_POST, 'school_id', FILTER_SANITIZE_FULL_SPECIAL_CHARS) ?? NULL;


// 4. SERVER-SIDE VALIDATION
// You MUST repeat validation on the server because client-side JS can be bypassed.
$errors = [];

// Basic field checks
if (empty($first_name) || empty($last_name) || empty($email) || empty($password)) {
    $errors[] = "All required fields must be filled.";
}

// Email format check
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Invalid email format.";
}

// Password Policy Check (Matches the JS criteria)
$password_policy = [
    'length'  => (strlen($password) >= 8),
    'capital' => preg_match('/[A-Z]/', $password),
    'number'  => preg_match('/[0-9]/', $password),
    'special' => preg_match('/[^a-zA-Z0-9\s]/', $password) // Non-alphanumeric/whitespace
];

if (!$password_policy['length'] || !$password_policy['capital'] || !$password_policy['number'] || !$password_policy['special']) {
    $errors[] = "Password must be at least 8 characters and contain an uppercase letter, a number, and a special character.";
}


// 5. IF VALIDATION FAILS
if (!empty($errors)) {
    // For now, we'll just print the errors. In a real app, you'd redirect back
    // to the sign-up form and pass the error messages.
    echo "<h2>Validation Errors:</h2>";
    echo "<ul>";
    foreach ($errors as $error) {
        echo "<li>" . $error . "</li>";
    }
    echo "</ul>";
    exit();
}


// 6. CHECK IF EMAIL ALREADY EXISTS
try {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetchColumn() > 0) {
        // Handle email already exists error
        echo "Error: The email address is already registered.";
        exit();
    }
} catch (\PDOException $e) {
    // Handle database error
    echo "Database error during email check: " . $e->getMessage();
    exit();
}


// 7. HASH PASSWORD & INSERT DATA
// Hashing the password using bcrypt (recommended)
$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $sql = "INSERT INTO users (first_name, last_name, email, password_hash, university_name, school_id)
            VALUES (?, ?, ?, ?, ?, ?)";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $first_name,
        $last_name,
        $email,
        $password_hash,
        $university_name,
        $school_id
    ]);

    // Success! Redirect to a welcome page or login page
    header("Location: HomeF.html");
    exit();

} catch (\PDOException $e) {
    // Handle insertion error (e.g., if the unique email check somehow failed)
    echo "Database Insertion Error: " . $e->getMessage();
}