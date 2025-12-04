<?php
// Enable detailed error logging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Prevent broken JSON
ini_set('log_errors', 1);
ini_set('error_log', 'php_errors.log');

ob_start(); // Prevent accidental output

// 🕒 Set timezone to match your location
date_default_timezone_set('Asia/Manila');

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = 'localhost';
$dbname = 'studytrack_db';
$username = 'root';
$password = '';

try {
    $mysqli = new mysqli($host, $username, $password, $dbname);
    
    if ($mysqli->connect_error) {
        throw new Exception('DB Connection Failed: ' . $mysqli->connect_error);
    }
    
    // Ensure tables exist
    $tables = ['habits', 'habit_completions'];
    foreach ($tables as $table) {
        $result = $mysqli->query("SHOW TABLES LIKE '$table'");
        if (!$result || $result->num_rows == 0) {
            if ($table === 'habits') {
                $mysqli->query("
                    CREATE TABLE IF NOT EXISTS habits (
                        habit_id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL DEFAULT 1,
                        habit_name VARCHAR(255) NOT NULL,
                        repeat_days VARCHAR(255) NOT NULL DEFAULT 'Mon',
                        start_time TIME NOT NULL,
                        end_time TIME NOT NULL,
                        reminder_option VARCHAR(50) DEFAULT 'None',
                        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                ");
            } elseif ($table === 'habit_completions') {
                $mysqli->query("
                    CREATE TABLE IF NOT EXISTS habit_completions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        habit_id INT NOT NULL,
                        user_id INT NOT NULL DEFAULT 1,
                        completion_date DATE NOT NULL,
                        is_completed TINYINT(1) NOT NULL DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE KEY unique_completion (habit_id, user_id, completion_date),
                        FOREIGN KEY (habit_id) REFERENCES habits(habit_id) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                ");
            }
        }
    }

    // Ensure is_completed exists
    $cols = $mysqli->query("SHOW COLUMNS FROM habit_completions LIKE 'is_completed'");
    if (!$cols || $cols->num_rows === 0) {
        $mysqli->query("ALTER TABLE habit_completions ADD COLUMN is_completed TINYINT(1) NOT NULL DEFAULT 1 AFTER completion_date");
    }

} catch(Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Database setup error', 'message' => $e->getMessage()]);
    error_log("DB Setup Error: " . $e->getMessage());
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
$USER_ID = 1;

try {
    switch ($method) {
        // ✅ GET /habit.php?action=list
        case 'GET':
            if ($action === 'list') {
                $stmt = $mysqli->prepare("SELECT * FROM habits WHERE user_id = ? ORDER BY start_time ASC");
                $stmt->bind_param('i', $USER_ID);
                $stmt->execute();
                $allHabits = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

                // Get today’s completions (only completed = 1)
                $today = date('Y-m-d');
                $stmt = $mysqli->prepare("
                    SELECT habit_id FROM habit_completions 
                    WHERE user_id = ? AND completion_date = ? AND is_completed = 1
                ");
                $stmt->bind_param('is', $USER_ID, $today);
                $stmt->execute();
                $completedToday = [];
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $completedToday[] = (int)$row['habit_id'];
                }

                // Enrich habits with completion status
                foreach ($allHabits as &$h) {
                    $h['completed_today'] = in_array($h['habit_id'], $completedToday);
                }
                unset($h);

                // Filter today’s habits - only habits scheduled for today that are NOT completed
                $todayDayName = date('D');
                $todayHabits = array_filter($allHabits, function($h) use ($todayDayName, $completedToday) {
                    $days = array_map('trim', explode(',', $h['repeat_days']));
                    $isScheduledToday = in_array($todayDayName, $days);
                    $isCompletedToday = in_array($h['habit_id'], $completedToday);
                    return $isScheduledToday && !$isCompletedToday; // Only if scheduled AND not completed
                });

                // Filter history habits - only habits scheduled for today that ARE completed
                $historyHabits = array_filter($allHabits, function($h) use ($todayDayName, $completedToday) {
                    $days = array_map('trim', explode(',', $h['repeat_days']));
                    $isScheduledToday = in_array($todayDayName, $days);
                    $isCompletedToday = in_array($h['habit_id'], $completedToday);
                    return $isScheduledToday && $isCompletedToday; // Only if scheduled AND completed
                });

                // ✅ Calculate streak — STRICT MODE (all habits must be done)
                $streak = calculateStreak($mysqli, $USER_ID);

                ob_clean();
                echo json_encode([
                    'today' => array_values($todayHabits),
                    'history' => array_values($historyHabits), // Changed: only completed today's habits go to history
                    'streak' => $streak
                ]);
            } else {
                throw new Exception('Invalid action', 400);
            }
            break;

        // ✅ POST /habit.php?action=complete
        case 'POST':
            if ($action === 'complete') {
                $data = getJsonInput();
                $habit_id = (int)($data['habit_id'] ?? 0);
                $completed = !empty($data['completed']);

                if (!$habit_id) {
                    throw new Exception('habit_id is required', 400);
                }

                $stmt = $mysqli->prepare("SELECT 1 FROM habits WHERE habit_id = ? AND user_id = ?");
                $stmt->bind_param('ii', $habit_id, $USER_ID);
                $stmt->execute();
                if (!$stmt->get_result()->fetch_row()) {
                    throw new Exception('Habit not found', 404);
                }

                $today = date('Y-m-d');

                if ($completed) {
                    $stmt = $mysqli->prepare("
                        INSERT INTO habit_completions (habit_id, user_id, completion_date, is_completed)
                        VALUES (?, ?, ?, 1)
                        ON DUPLICATE KEY UPDATE is_completed = 1
                    ");
                    $stmt->bind_param('iis', $habit_id, $USER_ID, $today);
                } else {
                    $stmt = $mysqli->prepare("
                        UPDATE habit_completions
                        SET is_completed = 0
                        WHERE habit_id = ? AND user_id = ? AND completion_date = ?
                    ");
                    $stmt->bind_param('iis', $habit_id, $USER_ID, $today);
                }
                $stmt->execute();

                ob_clean();
                echo json_encode(['success' => true]);
                break;
            }

            // --- Create new habit ---
            $data = getJsonInput();
            $name = trim($data['habit_name'] ?? '');
            $repeat_days = trim($data['repeat_days'] ?? 'Mon');
            $start_time = trim($data['start_time'] ?? '09:00');
            $end_time = trim($data['end_time'] ?? '09:30');
            $reminder = $data['reminder_option'] ?? 'None';

            if (!$name) {
                throw new Exception('Habit name is required', 400);
            }

            $repeat_days = preg_replace('/\s*,\s*/', ',', $repeat_days);
            if (empty($repeat_days)) $repeat_days = 'Mon';

            $stmt = $mysqli->prepare("
                INSERT INTO habits (user_id, habit_name, repeat_days, start_time, end_time, reminder_option)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param('isssss', $USER_ID, $name, $repeat_days, $start_time, $end_time, $reminder);

            if (!$stmt->execute()) {
                throw new Exception('Insert failed: ' . $mysqli->error, 500);
            }

            $newId = $mysqli->insert_id;
            $stmt2 = $mysqli->prepare("SELECT * FROM habits WHERE habit_id = ?");
            $stmt2->bind_param('i', $newId);
            $stmt2->execute();
            $newHabit = $stmt2->get_result()->fetch_assoc();

            ob_clean();
            echo json_encode($newHabit);
            break;

        // ✅ PUT /habit.php?id=123
        case 'PUT':
            if (!$id) throw new Exception('Habit ID required', 400);
            $data = getJsonInput();
            $name = trim($data['habit_name'] ?? '');
            $repeat_days = trim($data['repeat_days'] ?? 'Mon');
            $start_time = trim($data['start_time'] ?? '09:00');
            $end_time = trim($data['end_time'] ?? '09:30');
            $reminder = $data['reminder_option'] ?? 'None';

            if (!$name) throw new Exception('Habit name is required', 400);

            $repeat_days = preg_replace('/\s*,\s*/', ',', $repeat_days);
            if (empty($repeat_days)) $repeat_days = 'Mon';

            $stmt = $mysqli->prepare("
                UPDATE habits 
                SET habit_name = ?, repeat_days = ?, start_time = ?, end_time = ?, reminder_option = ?
                WHERE habit_id = ? AND user_id = ?
            ");
            $stmt->bind_param('sssssii', $name, $repeat_days, $start_time, $end_time, $reminder, $id, $USER_ID);

            if (!$stmt->execute()) {
                throw new Exception('Update failed: ' . $mysqli->error, 500);
            }

            if ($stmt->affected_rows === 0) {
                throw new Exception('Habit not found or no changes', 404);
            }

            $stmt2 = $mysqli->prepare("SELECT * FROM habits WHERE habit_id = ?");
            $stmt2->bind_param('i', $id);
            $stmt2->execute();
            $updated = $stmt2->get_result()->fetch_assoc();

            ob_clean();
            echo json_encode($updated);
            break;

        // ✅ DELETE /habit.php?id=123
        case 'DELETE':
            if (!$id) throw new Exception('Habit ID required', 400);
            $stmt = $mysqli->prepare("DELETE FROM habits WHERE habit_id = ? AND user_id = ?");
            $stmt->bind_param('ii', $id, $USER_ID);
            $stmt->execute();

            if ($stmt->affected_rows === 0) {
                throw new Exception('Habit not found', 404);
            }
            ob_clean();
            echo json_encode(['success' => true]);
            break;

        default:
            throw new Exception('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Exception: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    ob_clean();
    http_response_code($e->getCode() ?: 500);
    echo json_encode([
        'error' => $e->getMessage(),
        'code' => $e->getCode() ?: 500
    ]);
    exit;
}

$mysqli->close();

// ✅ STRICT STREAK CALCULATION — "ALL scheduled habits must be completed"
function calculateStreak($mysqli, $user_id) {
    $daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Get user's habits
    $stmt = $mysqli->prepare("
        SELECT habit_id, repeat_days 
        FROM habits 
        WHERE user_id = ?
    ");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $habits = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Get completed habits (is_completed = 1) for last 14 days
    $stmt = $mysqli->prepare("
        SELECT habit_id, completion_date 
        FROM habit_completions 
        WHERE user_id = ? AND is_completed = 1 
          AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
    ");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $completions = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Group by date: [date => [habit_id1, habit_id2, ...]]
    $completedByDate = [];
    foreach ($completions as $comp) {
        $date = $comp['completion_date'];
        $completedByDate[$date][] = (int)$comp['habit_id'];
    }

    // Build list: 13 days ago → today
    $dates = [];
    for ($i = 13; $i >= 0; $i--) {
        $dates[] = date('Y-m-d', strtotime("-$i days"));
    }

    // Evaluate each day
    $dayResults = []; // date → true (all done), false (incomplete), null (no habits)
    foreach ($dates as $date) {
        $dayName = date('D', strtotime($date));
        
        // Scheduled habits for this weekday
        $scheduled = [];
        foreach ($habits as $h) {
            $days = array_map('trim', explode(',', $h['repeat_days']));
            if (in_array($dayName, $days)) {
                $scheduled[] = (int)$h['habit_id'];
            }
        }

        if (empty($scheduled)) {
            $dayResults[$date] = null; // neutral
            continue;
        }

        $doneToday = $completedByDate[$date] ?? [];
        // ✅ STRICT: all scheduled must be in done list
        $dayResults[$date] = empty(array_diff($scheduled, $doneToday));
    }

    // 🔥 CURRENT STREAK: backward from TODAY, stop at first FALSE
    $current = 0;
    $today = date('Y-m-d');
    
    $i = array_search($today, $dates);
    if ($i !== false) {
        for ($j = $i; $j >= 0; $j--) {
            $res = $dayResults[$dates[$j]];
            if ($res === false) break; // broken
            if ($res === true) $current++; // only true days count
            // null → skip (no effect)
        }
    }

    // 🔥 BEST STREAK: longest run of TRUE (ignore nulls)
    $best = 0;
    $run = 0;
    foreach ($dates as $date) {
        $res = $dayResults[$date];
        if ($res === true) {
            $run++;
        } elseif ($res === false) {
            $best = max($best, $run);
            $run = 0;
        }
        // null → continue run
    }
    $best = max($best, $run);

    // 📊 Weekly rate (last 7 days)
    $weekDates = array_slice($dates, -7);
    $completedDays = array_filter($weekDates, fn($d) => $dayResults[$d] === true);
    $completionRate = round((count($completedDays) / 7) * 100);

    // 🗓️ This week’s Mon–Sun status
    $weekStart = new DateTime('monday this week');
    $dayStatus = [];
    for ($i = 0; $i < 7; $i++) {
        $d = (clone $weekStart)->modify("+$i days")->format('Y-m-d');
        $dayName = (clone $weekStart)->modify("+$i days")->format('D');
        $dayStatus[$dayName] = ($dayResults[$d] === true);
    }

    return [
        'current' => $current,
        'best' => $best,
        'completionRate' => $completionRate,
        'days' => $dayStatus
    ];
}
?>