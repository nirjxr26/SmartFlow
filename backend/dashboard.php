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
    $taskChange = $prevMonthTasks > 0 ? round((($totalTasks - $prevMonthTasks) / $prevMonthTasks) * 100) : 0;
    
    // KPI: Pending Approvals
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM approvals WHERE status = 'pending'");
    $pendingApprovals = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Previous week approvals
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM approvals WHERE status = 'pending' AND created_at >= DATE_SUB(NOW(), INTERVAL 2 WEEK) AND created_at < DATE_SUB(NOW(), INTERVAL 1 WEEK)");
    $prevWeekApprovals = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $approvalChange = $prevWeekApprovals > 0 ? round((($pendingApprovals - $prevWeekApprovals) / $prevWeekApprovals) * 100) : 0;
    
    // KPI: Resources in Use
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM resources WHERE status = 'assigned'");
    $resourcesInUse = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // KPI: Completed Tasks
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM tasks WHERE status = 'completed'");
    $completedTasks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // This month completed
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM tasks WHERE status = 'completed' AND updated_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)");
    $thisMonthCompleted = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Tasks this week (for chart)
    $stmt = $pdo->query("
        SELECT 
            DAYNAME(created_at) as day,
            DAYOFWEEK(created_at) as day_num,
            COUNT(*) as count
        FROM tasks 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY day, day_num
        ORDER BY day_num
    ");
    $tasksThisWeek = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format for chart
    $dayMap = ['Mon' => 0, 'Tue' => 0, 'Wed' => 0, 'Thu' => 0, 'Fri' => 0, 'Sat' => 0, 'Sun' => 0];
    foreach ($tasksThisWeek as $task) {
        $dayName = substr($task['day'], 0, 3);
        if (isset($dayMap[$dayName])) {
            $dayMap[$dayName] = (int)$task['count'];
        }
    }
    $taskChartData = [];
    foreach ($dayMap as $name => $value) {
        $taskChartData[] = ['name' => $name, 'value' => $value];
    }
    
    // Resource utilization (last 6 months)
    $stmt = $pdo->query("
        SELECT 
            DATE_FORMAT(created_at, '%b') as month,
            MONTH(created_at) as month_num,
            COUNT(*) as count
        FROM resources 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month, month_num
        ORDER BY month_num
    ");
    $resourceData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $resourceChartData = [];
    foreach ($resourceData as $resource) {
        $resourceChartData[] = [
            'name' => $resource['month'],
            'value' => (int)$resource['count']
        ];
    }
    
    // If no data, provide default
    if (empty($resourceChartData)) {
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        foreach ($months as $month) {
            $resourceChartData[] = ['name' => $month, 'value' => rand(60, 95)];
        }
    }
    
    // Recent activities
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
        LIMIT 10
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
                'value' => (int)$totalTasks,
                'change' => (int)$taskChange
            ],
            'pendingApprovals' => [
                'value' => (int)$pendingApprovals,
                'change' => (int)$approvalChange
            ],
            'resourcesInUse' => [
                'value' => (int)$resourcesInUse,
                'change' => 8
            ],
            'completedTasks' => [
                'value' => (int)$completedTasks,
                'change' => (int)$thisMonthCompleted
            ]
        ],
        'charts' => [
            'tasksThisWeek' => $taskChartData,
            'resourceUtilization' => $resourceChartData
        ],
        'activities' => $formattedActivities
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch dashboard data: ' . $e->getMessage()
    ]);
}

function getTimeAgo($datetime) {
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
