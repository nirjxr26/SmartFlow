<?php
require_once 'config.php';

// Get user ID from token
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';
$user_id = 1; // Default for now, should decode from token

// Get dashboard statistics
try {
    // KPI: Total Tasks
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM tasks");
    $totalTasks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Previous month tasks for comparison
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM tasks WHERE created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)");
    $prevMonthTasks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $taskChange = $prevMonthTasks > 0 ? round((($totalTasks - $prevMonthTasks) / $prevMonthTasks) * 100) : 12;

    // KPI: Pending Approvals
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM approvals WHERE status = 'pending'");
    $pendingApprovals = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Previous week approvals
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM approvals WHERE status = 'pending' AND created_at >= DATE_SUB(NOW(), INTERVAL 2 WEEK) AND created_at < DATE_SUB(NOW(), INTERVAL 1 WEEK)");
    $prevWeekApprovals = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $approvalChange = $prevWeekApprovals > 0 ? round((($pendingApprovals - $prevWeekApprovals) / $prevWeekApprovals) * 100) : -5;

    // KPI: Resources in Use
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM resources WHERE status = 'assigned'");
    $resourcesInUse = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // KPI: Completed Tasks
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM tasks WHERE status = 'completed'");
    $completedTasks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // This month completed
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM tasks WHERE status = 'completed' AND updated_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)");
    $thisMonthCompleted = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // ===== TASKS THIS WEEK (Mon-Sun) =====
    $taskChartData = [];
    $dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    $taskByDayMap = array_fill_keys($dayNames, 0);

    $stmt = $pdo->query(
        "SELECT DATE_FORMAT(created_at, '%a') AS day_name, COUNT(*) AS cnt
         FROM tasks
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
           AND created_at < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
         GROUP BY day_name"
    );
    $taskByDayRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($taskByDayRows as $row) {
        if (isset($taskByDayMap[$row['day_name']])) {
            $taskByDayMap[$row['day_name']] = (int) $row['cnt'];
        }
    }

    foreach ($dayNames as $day) {
        $taskChartData[] = ['name' => $day, 'value' => $taskByDayMap[$day]];
    }

    // ===== RESOURCE UTILIZATION (LAST 5 MONTHS) =====
    $resourceChartData = [];
    for ($i = 4; $i >= 0; $i--) {
        $monthLabel = date('M', strtotime("-{$i} month"));
        $monthStart = date('Y-m-01 00:00:00', strtotime("-{$i} month"));
        $monthEnd = date('Y-m-01 00:00:00', strtotime('-' . ($i - 1) . ' month'));

        if ($i === 0) {
            $monthEnd = date('Y-m-01 00:00:00', strtotime('+1 month'));
        }

        $stmt = $pdo->prepare(
            "SELECT COUNT(*) AS cnt
             FROM resources
             WHERE created_at >= ? AND created_at < ?"
        );
        $stmt->execute([$monthStart, $monthEnd]);
        $count = (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

        $resourceChartData[] = ['name' => $monthLabel, 'value' => $count];
    }

    // ===== TASK COMPLETION BY MONTH (LAST 12 MONTHS) =====
    $monthlyCompletionData = [];
    for ($i = 11; $i >= 0; $i--) {
        $monthLabel = date('M', strtotime("-{$i} month"));
        $monthStart = date('Y-m-01 00:00:00', strtotime("-{$i} month"));
        $monthEnd = date('Y-m-01 00:00:00', strtotime('-' . ($i - 1) . ' month'));

        if ($i === 0) {
            $monthEnd = date('Y-m-01 00:00:00', strtotime('+1 month'));
        }

        $stmt = $pdo->prepare(
            "SELECT COUNT(*) AS cnt
             FROM tasks
             WHERE status = 'completed' AND updated_at >= ? AND updated_at < ?"
        );
        $stmt->execute([$monthStart, $monthEnd]);
        $count = (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

        $monthlyCompletionData[] = ['name' => $monthLabel, 'value' => $count];
    }

    // ===== TOP PERFORMERS =====
    $stmt = $pdo->query(
        "SELECT u.name, COUNT(t.id) AS completed_tasks
         FROM users u
         LEFT JOIN tasks t ON t.assignee_id = u.id AND t.status = 'completed'
         GROUP BY u.id, u.name
         ORDER BY completed_tasks DESC, u.name ASC
         LIMIT 5"
    );
    $topPerformersRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $topPerformers = [];
    foreach ($topPerformersRows as $row) {
        $topPerformers[] = [
            'name' => $row['name'],
            'completedTasks' => (int) $row['completed_tasks'],
            'avatar' => null,
        ];
    }

    // ===== RESOURCE UTILIZATION BY CATEGORY =====
    $resourceByCategory = [];
    $resourceCategories = ['device' => 'Devices', 'software' => 'Software', 'room' => 'Rooms', 'equipment' => 'Equipment'];
    foreach ($resourceCategories as $typeKey => $label) {
        $stmt = $pdo->prepare(
            "SELECT
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_cnt,
                SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) AS assigned_cnt,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) AS maintenance_cnt
             FROM resources
             WHERE type = ?"
        );
        $stmt->execute([$typeKey]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $resourceByCategory[] = [
            'category' => $label,
            'available' => (int) ($row['available_cnt'] ?? 0),
            'assigned' => (int) ($row['assigned_cnt'] ?? 0),
            'maintenance' => (int) ($row['maintenance_cnt'] ?? 0),
        ];
    }

    // ===== RECENT ACTIVITIES =====
    $stmt = $pdo->prepare("
        SELECT
            a.id,
            a.type,
            a.description,
            a.created_at,
            u.name as user_name
        FROM activities a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 5
    ");
    $stmt->execute();
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format activities
    $formattedActivities = [];
    foreach ($activities as $activity) {
        $formattedActivities[] = [
            'id' => $activity['id'],
            'type' => $activity['type'],
            'user' => $activity['user_name'],
            'action' => $activity['description'],
            'time' => getTimeAgo($activity['created_at'])
        ];
    }

    echo json_encode([
        'success' => true,
        'kpis' => [
            'totalTasks' => [
                'value' => (int) $totalTasks,
                'change' => (int) $taskChange
            ],
            'pendingApprovals' => [
                'value' => (int) $pendingApprovals,
                'change' => (int) $approvalChange
            ],
            'resourcesInUse' => [
                'value' => (int) $resourcesInUse,
                'change' => 8
            ],
            'completedTasks' => [
                'value' => (int) $completedTasks,
                'change' => (int) $thisMonthCompleted
            ]
        ],
        'charts' => [
            'tasksThisWeek' => $taskChartData,
            'resourceUtilization' => $resourceChartData,
            'monthlyCompletion' => $monthlyCompletionData,
            'resourceByCategory' => $resourceByCategory
        ],
        'topPerformers' => $topPerformers,
        'activities' => $formattedActivities
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch dashboard data: ' . $e->getMessage()
    ]);
}

function getTimeAgo($datetime)
{
    $now = new DateTime();
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);

    if ($diff->y > 0) return $diff->y . ' year' . ($diff->y > 1 ? 's' : '') . ' ago';
    if ($diff->m > 0) return $diff->m . ' month' . ($diff->m > 1 ? 's' : '') . ' ago';
    if ($diff->d > 0) return $diff->d . ' day' . ($diff->d > 1 ? 's' : '') . ' ago';
    if ($diff->h > 0) return $diff->h . ' hour' . ($diff->h > 1 ? 's' : '') . ' ago';
    if ($diff->i > 0) return $diff->i . ' min' . ($diff->i > 1 ? 's' : '') . ' ago';
    return 'Just now';
}
?>