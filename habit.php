<?php
session_start();

ob_start();

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

// 0. CHECK USER AUTHENTICATION
$current_user_id = $_SESSION['user_id'] ?? null; 
if (empty($current_user_id)) {
    http_response_code(403);
    echo json_encode(['error' => 'Authentication required.']);
    exit;
}

// --- ID GENERATION FUNCTION (Unchanged) ---
function generateNextHabitId(mysqli $mysqli): string {
    $sql = "SELECT habit_id FROM user_habits 
            WHERE habit_id REGEXP '^HABIT[0-9]+$'
            ORDER BY CAST(SUBSTRING(habit_id, 6) AS UNSIGNED) DESC
            LIMIT 1";

    $result = $mysqli->query($sql);
    $lastIdRow = $result ? $result->fetch_assoc() : null;
    $lastId = $lastIdRow['habit_id'] ?? null;

    $nextNumber = 1;

    if ($lastId) {
        $numberPart = (int) substr($lastId, 5); 
        $nextNumber = $numberPart + 1;
    }

    return 'HABIT' . $nextNumber;
}


// 🔐 DATABASE CONFIG
$host = 'localhost';
$dbname = 'studytrack'; 
$username = 'root';
$password = '';

$mysqli = new mysqli($host, $username, $password, $dbname);

if ($mysqli->connect_error) {
    ob_clean();
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
$filter = $_GET['filter'] ?? 'completed'; 
$id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_SANITIZE_FULL_SPECIAL_CHARS) : null;


try {
    switch ($method) {
        // ✅ GET /habit.php?action=list
        case 'GET':
            if ($action === 'list') {
                $stmt = $mysqli->prepare("SELECT * FROM user_habits WHERE user_id = ? ORDER BY start_time ASC");
                $stmt->bind_param('s', $current_user_id);
                $stmt->execute();
                $allHabits = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

                $today = date('Y-m-d');
                $stmt = $mysqli->prepare("
                    SELECT habit_id FROM habit_completions 
                    WHERE user_id = ? AND completion_date = ? AND is_completed = 1
                ");
                $stmt->bind_param('ss', $current_user_id, $today);
                $stmt->execute();
                $completedToday = [];
                $result = $stmt->get_result();
                while ($row = $result->fetch_assoc()) {
                    $completedToday[] = $row['habit_id'];
                }

                foreach ($allHabits as &$h) {
                    $h['completed_today'] = in_array($h['habit_id'], $completedToday);
                }
                unset($h);

                $todayDayName = date('D');
                $todayHabits = array_filter($allHabits, function($h) use ($todayDayName, $completedToday) {
                    $days = array_map('trim', explode(',', $h['repeat_days']));
                    $isScheduledToday = in_array($todayDayName, $days);
                    $isCompletedToday = in_array($h['habit_id'], $completedToday);
                    return $isScheduledToday && !$isCompletedToday;
                });

                $historyHabits = array_filter($allHabits, function($h) use ($todayDayName, $completedToday) {
                    $days = array_map('trim', explode(',', $h['repeat_days']));
                    $isScheduledToday = in_array($todayDayName, $days);
                    $isCompletedToday = in_array($h['habit_id'], $completedToday);
                    return $isScheduledToday && $isCompletedToday;
                });

                $streak = calculateStreak($mysqli, $current_user_id, $allHabits);

                if ($filter === 'all') {
                    ob_clean();
                    echo json_encode([
                        'today' => array_values($todayHabits),
                        'history' => array_values($historyHabits), 
                        'all_habits' => array_values($allHabits), 
                        'streak' => $streak
                    ]);
                    return;
                }

                ob_clean();
                echo json_encode([
                    'today' => array_values($todayHabits),
                    'history' => array_values($historyHabits),
                    'streak' => $streak
                ]);
            } else {
                throw new Exception('Invalid action', 400);
            }
            break;

        // ✅ POST /habit.php?action=complete (Mark completion status)
        case 'POST':
            if ($action === 'complete') {
                $data = getJsonInput();
                $habit_id = filter_var($data['habit_id'] ?? '', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
                $completed = !empty($data['completed']);

                if (!$habit_id) {
                    throw new Exception('habit_id is required', 400);
                }

                $stmt = $mysqli->prepare("SELECT 1 FROM user_habits WHERE habit_id = ? AND user_id = ?");
                $stmt->bind_param('ss', $habit_id, $current_user_id);
                $stmt->execute();
                if (!$stmt->get_result()->fetch_row()) {
                    throw new Exception('Habit not found or access denied', 404);
                }

                $today = date('Y-m-d');
                $is_completed_val = $completed ? 1 : 0;
                
                if ($completed) {
                    // CRITICAL FIX: Add placeholder for is_completed (4 placeholders total)
                    $stmt = $mysqli->prepare("
                        INSERT INTO habit_completions (habit_id, user_id, completion_date, is_completed)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE is_completed = VALUES(is_completed)
                    ");
                    // Bind 4 values: habit_id, user_id, completion_date (all strings), is_completed (integer)
                    $stmt->bind_param('sssi', $habit_id, $current_user_id, $today, $is_completed_val);
                } else {
                    // CRITICAL FIX: UPDATE requires binding 3 strings and one integer (for SET) 
                    $stmt = $mysqli->prepare("
                        UPDATE habit_completions
                        SET is_completed = ?
                        WHERE habit_id = ? AND user_id = ? AND completion_date = ?
                    ");
                    // Bind 4 values: is_completed (integer), habit_id, user_id, completion_date (all strings)
                    $stmt->bind_param('isss', $is_completed_val, $habit_id, $current_user_id, $today);
                }
                
                if (!$stmt->execute()) {
                    // If it fails here, the error message should now be returned
                    throw new Exception('Completion status update failed: ' . $mysqli->error, 500);
                }

                ob_clean();
                echo json_encode(['success' => true]);
                break;
            }

            // --- Create new habit ---
            $data = getJsonInput();
            $name = trim($data['habit_name'] ?? '');
            $repeat_days = trim($data['repeat_days'] ?? 'Mon');
            $start_time = trim($data['start_time'] ?? '09:00:00');
            $end_time = trim($data['end_time'] ?? '09:30:00');
            $reminder = $data['reminder_option'] ?? 'None';

            if (!$name) {
                throw new Exception('Habit name is required', 400);
            }

            $repeat_days = preg_replace('/\s*,\s*/', ',', $repeat_days);
            if (empty($repeat_days)) $repeat_days = 'Mon';
            
            $newHabitId = generateNextHabitId($mysqli);

            // CRITICAL: INSERT into user_habits
            $stmt = $mysqli->prepare("
                INSERT INTO user_habits (habit_id, user_id, habit_name, repeat_days, start_time, end_time, reminder_option)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param('sssssss', 
                $newHabitId,
                $current_user_id,
                $name, 
                $repeat_days, 
                $start_time, 
                $end_time, 
                $reminder
            );

            if (!$stmt->execute()) {
                throw new Exception('Insert failed: ' . $mysqli->error, 500);
            }

            $stmt2 = $mysqli->prepare("SELECT * FROM user_habits WHERE habit_id = ?");
            $stmt2->bind_param('s', $newHabitId);
            $stmt2->execute();
            $newHabit = $stmt2->get_result()->fetch_assoc();

            ob_clean();
            echo json_encode($newHabit);
            break;

        // ✅ PUT /habit.php?id=HABIT123 (Update Existing Habit)
        case 'PUT':
            if (!$id) throw new Exception('Habit ID required', 400);
            $data = getJsonInput();
            $name = trim($data['habit_name'] ?? '');
            $repeat_days = trim($data['repeat_days'] ?? 'Mon');
            $start_time = trim($data['start_time'] ?? '09:00:00');
            $end_time = trim($data['end_time'] ?? '09:30:00');
            $reminder = $data['reminder_option'] ?? 'None';

            if (!$name) throw new Exception('Habit name is required', 400);

            $repeat_days = preg_replace('/\s*,\s*/', ',', $repeat_days);
            if (empty($repeat_days)) $repeat_days = 'Mon';

            // CRITICAL: Update user_habits
            $stmt = $mysqli->prepare("
                UPDATE user_habits 
                SET habit_name = ?, repeat_days = ?, start_time = ?, end_time = ?, reminder_option = ?
                WHERE habit_id = ? AND user_id = ?
            ");
            $stmt->bind_param('sssssss', 
                $name, 
                $repeat_days, 
                $start_time, 
                $end_time, 
                $reminder, 
                $id,                  
                $current_user_id     
            );

            if (!$stmt->execute()) {
                throw new Exception('Update failed: ' . $mysqli->error, 500);
            }

            $stmt2 = $mysqli->prepare("SELECT * FROM user_habits WHERE habit_id = ?");
            $stmt2->bind_param('s', $id);
            $stmt2->execute();
            $updated = $stmt2->get_result()->fetch_assoc();

            ob_clean();
            echo json_encode($updated);
            break;

        // ✅ DELETE /habit.php?id=HABIT123
        case 'DELETE':
            if (!$id) throw new Exception('Habit ID required', 400);
            
            // CRITICAL: Delete from user_habits
            $stmt = $mysqli->prepare("DELETE FROM user_habits WHERE habit_id = ? AND user_id = ?");
            $stmt->bind_param('ss', $id, $current_user_id);
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

// ✅ STREAK CALCULATION (Updated to use user_habits table name)
function calculateStreak($mysqli, $user_id, $habits) {
    // ... (Streak calculation logic remains the same, using 'habit_completions' and 'user_habits') ...
    
    // Get completed habits (is_completed = 1) for last 14 days
    $stmt = $mysqli->prepare("
        SELECT habit_id, completion_date 
        FROM habit_completions 
        WHERE user_id = ? AND is_completed = 1 
          AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
    ");
    $stmt->bind_param('s', $user_id); 
    $stmt->execute();
    $completions = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Group by date: [date => [habit_id1, habit_id2, ...]]
    $completedByDate = [];
    foreach ($completions as $comp) {
        $date = $comp['completion_date'];
        $completedByDate[$date][] = $comp['habit_id'];
    }

    // Build list: 13 days ago → today
    $dates = [];
    for ($i = 13; $i >= 0; $i--) {
        $dates[] = date('Y-m-d', strtotime("-$i days"));
    }

    // Evaluate each day
    $dayResults = []; 
    foreach ($dates as $date) {
        $dayName = date('D', strtotime($date));
        
        // Scheduled habits for this weekday
        $scheduled = [];
        foreach ($habits as $h) {
            $days = array_map('trim', explode(',', $h['repeat_days']));
            if (in_array($dayName, $days)) {
                $scheduled[] = $h['habit_id'];
            }
        }

        if (empty($scheduled)) {
            $dayResults[$date] = null; 
            continue;
        }

        $doneToday = $completedByDate[$date] ?? [];
        $dayResults[$date] = empty(array_diff($scheduled, $doneToday));
    }

    // 🔥 CURRENT STREAK, BEST STREAK, WEEKLY RATE logic 
    $current = 0;
    $best = 0;
    $run = 0;
    $today = date('Y-m-d');
    
    $i = array_search($today, $dates);
    if ($i !== false) {
        for ($j = $i; $j >= 0; $j--) {
            $res = $dayResults[$dates[$j]];
            if ($res === false) break; 
            if ($res === true) $current++;
        }
    }

    // Calculate Best Streak
    foreach ($dates as $date) {
        $res = $dayResults[$date];
        if ($res === true) {
            $run++;
        } elseif ($res === false) {
            $best = max($best, $run);
            $run = 0;
        }
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
        $dayStatus[$dayName] = $dayResults[$d] ?? false; 
    }

    return [
        'current' => $current,
        'best' => $best,
        'completionRate' => $completionRate,
        'days' => $dayStatus
    ];
}
?>