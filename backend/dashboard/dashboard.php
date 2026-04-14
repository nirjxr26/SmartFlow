<?php
require_once '../config.php';

// Get the user id from the URL.
// Use 1 if it is missing or invalid.
$user_id = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 1;
if ($user_id <= 0) {
    $user_id = 1;
}

// Load the user record.
// We need the role to know what data to show.
$requestUser = flowstone_fetch_user($pdo, $user_id);
$isAdmin = flowstone_is_admin_role($requestUser['role'] ?? null);


// Limit data for normal users.
// Admins can see everything.
$taskScopeClause = '';
$taskScopeParams = [];
if (!$isAdmin && $user_id > 0) {
    $taskScopeClause = ' AND (t.created_by = :scope_user_id OR t.assignee_id = :scope_user_id)';
    $taskScopeParams['scope_user_id'] = $user_id;
}

// Build all dashboard data.
try {
    // Count all tasks.
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM tasks t WHERE 1=1" . $taskScopeClause);
    $stmt->execute($taskScopeParams);
    $totalTasks = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Count tasks from the previous month.
    // This is used for the change number.
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM tasks t WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH) AND t.created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)" . $taskScopeClause);
    $stmt->execute($taskScopeParams);
    $prevMonthTasks = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $taskChange = $prevMonthTasks > 0 ? round((($totalTasks - $prevMonthTasks) / $prevMonthTasks) * 100) : 12;

    // Count pending approvals.
    if ($isAdmin) {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM approvals WHERE status = 'pending'");
        $pendingApprovals = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    } else {
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM approvals WHERE status = 'pending' AND requested_by = ?");
        $stmt->execute([$user_id]);
        $pendingApprovals = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    }

    // Count pending approvals from the previous week.
    if ($isAdmin) {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM approvals WHERE status = 'pending' AND created_at >= DATE_SUB(NOW(), INTERVAL 2 WEEK) AND created_at < DATE_SUB(NOW(), INTERVAL 1 WEEK)");
        $prevWeekApprovals = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    } else {
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM approvals WHERE status = 'pending' AND requested_by = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 2 WEEK) AND created_at < DATE_SUB(NOW(), INTERVAL 1 WEEK)");
        $stmt->execute([$user_id]);
        $prevWeekApprovals = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    }
    $approvalChange = $prevWeekApprovals > 0 ? round((($pendingApprovals - $prevWeekApprovals) / $prevWeekApprovals) * 100) : -5;

    // Count assigned resources.
    if ($isAdmin) {
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM resources WHERE status = 'assigned'");
        $resourcesInUse = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    } else {
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM resources WHERE status = 'assigned' AND assigned_to = ?");
        $stmt->execute([$user_id]);
        $resourcesInUse = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    }

    // Count completed tasks.
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM tasks t WHERE t.status = 'completed'" . $taskScopeClause);
    $stmt->execute($taskScopeParams);
    $completedTasks = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Count tasks completed this month.
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM tasks t WHERE t.status = 'completed' AND t.updated_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)" . $taskScopeClause);
    $stmt->execute($taskScopeParams);
    $thisMonthCompleted = (int) $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Build the weekly task chart.
    // Each day gets a value, even if it is zero.
    $taskChartData = [];
    $dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    $taskByDayMap = array_fill_keys($dayNames, 0);

    // Count tasks created in the current week.
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

    // Build the resource chart for the last 5 months.
    $resourceChartData = [];
    for ($i = 4; $i >= 0; $i--) {
        $monthLabel = date('M', strtotime("-{$i} month"));
        $monthStart = date('Y-m-01 00:00:00', strtotime("-{$i} month"));
        $monthEnd = date('Y-m-01 00:00:00', strtotime('-' . ($i - 1) . ' month'));

        if ($i === 0) {
            $monthEnd = date('Y-m-01 00:00:00', strtotime('+1 month'));
        }

        // Count resources created in each month.
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) AS cnt
             FROM resources
             WHERE created_at >= ? AND created_at < ?"
        );
        $stmt->execute([$monthStart, $monthEnd]);
        $count = (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

        $resourceChartData[] = ['name' => $monthLabel, 'value' => $count];
    }

    // Build the completion chart for the last 12 months.
    $monthlyCompletionData = [];
    for ($i = 11; $i >= 0; $i--) {
        $monthLabel = date('M', strtotime("-{$i} month"));
        $monthStart = date('Y-m-01 00:00:00', strtotime("-{$i} month"));
        $monthEnd = date('Y-m-01 00:00:00', strtotime('-' . ($i - 1) . ' month'));

        if ($i === 0) {
            $monthEnd = date('Y-m-01 00:00:00', strtotime('+1 month'));
        }

        // Count completed tasks for each month.
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) AS cnt
             FROM tasks
             WHERE status = 'completed' AND updated_at >= ? AND updated_at < ?"
        );
        $stmt->execute([$monthStart, $monthEnd]);
        $count = (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

        $monthlyCompletionData[] = ['name' => $monthLabel, 'value' => $count];
    }

    // Build the recent activity feed.
    // This mixes different event types into one list.
    $activityIcons = [
        'task_created' => 'fas fa-plus-circle',
        'task_updated' => 'fas fa-edit',
        'task_completed' => 'fas fa-check-circle',
        'approval_requested' => 'fas fa-handshake',
        'approval_approved' => 'fas fa-thumbs-up',
        'approval_rejected' => 'fas fa-thumbs-down',
        'resource_assigned' => 'fas fa-link',
        'user_login' => 'fas fa-sign-in-alt',
        'profile_updated' => 'fas fa-user-edit',
    ];

    $combinedActivities = [];

    // Add one activity to the combined list.
    $pushActivity = function (int $id, string $type, string $user, string $action, string $createdAt) use (&$combinedActivities, $activityIcons) {
        $combinedActivities[] = [
            'id' => $id,
            'type' => $type,
            'icon' => $activityIcons[$type] ?? 'fas fa-bell',
            'user' => $user !== '' ? $user : 'System',
            'action' => $action,
            'createdAt' => $createdAt,
        ];
    };

    // Load saved activity records.
    $stmt = $pdo->query(
        "SELECT a.id, a.type, a.description, a.created_at, u.name AS user_name
         FROM activities a
         JOIN users u ON a.user_id = u.id
         ORDER BY a.created_at DESC
         LIMIT 80"
    );
    $activityRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($activityRows as $row) {
        $pushActivity(
            (int)$row['id'],
            (string)$row['type'],
            (string)$row['user_name'],
            (string)$row['description'],
            (string)$row['created_at']
        );
    }

    // Add task creation events.
    $stmt = $pdo->query(
        "SELECT t.id, t.title, t.created_at, u.name AS user_name
         FROM tasks t
         JOIN users u ON u.id = t.created_by
         ORDER BY t.created_at DESC
         LIMIT 80"
    );
    $taskCreatedRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($taskCreatedRows as $row) {
        $pushActivity(
            1000000 + (int)$row['id'],
            'task_created',
            (string)$row['user_name'],
            'created task "' . (string)$row['title'] . '"',
            (string)$row['created_at']
        );
    }

    // Add task completion events.
    // Use assignee first, then creator if needed.
    $stmt = $pdo->query(
        "SELECT
            t.id,
            t.title,
            t.updated_at,
            COALESCE(assignee.name, creator.name) AS actor_name
         FROM tasks t
         LEFT JOIN users assignee ON assignee.id = t.assignee_id
         LEFT JOIN users creator ON creator.id = t.created_by
         WHERE t.status = 'completed'
         ORDER BY t.updated_at DESC
         LIMIT 80"
    );
    $taskCompletedRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($taskCompletedRows as $row) {
        $pushActivity(
            2000000 + (int)$row['id'],
            'task_completed',
            (string)($row['actor_name'] ?? 'System'),
            'completed task "' . (string)$row['title'] . '"',
            (string)$row['updated_at']
        );
    }

    // Add approval request events.
    $stmt = $pdo->query(
        "SELECT a.id, a.type, a.created_at, u.name AS user_name
         FROM approvals a
         JOIN users u ON u.id = a.requested_by
         ORDER BY a.created_at DESC
         LIMIT 80"
    );
    $approvalRequestedRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($approvalRequestedRows as $row) {
        $pushActivity(
            3000000 + (int)$row['id'],
            'approval_requested',
            (string)$row['user_name'],
            'requested ' . (string)$row['type'] . ' approval',
            (string)$row['created_at']
        );
    }

    // Add approval review events.
    $stmt = $pdo->query(
        "SELECT a.id, a.type, a.status, a.approved_at, u.name AS admin_name
         FROM approvals a
         JOIN users u ON u.id = a.approved_by
         WHERE a.approved_by IS NOT NULL
           AND a.approved_at IS NOT NULL
           AND a.status IN ('approved', 'rejected')
         ORDER BY a.approved_at DESC
         LIMIT 80"
    );
    $approvalReviewedRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($approvalReviewedRows as $row) {
        $reviewType = (string)$row['status'] === 'approved' ? 'approval_approved' : 'approval_rejected';
        $pushActivity(
            4000000 + (int)$row['id'],
            $reviewType,
            (string)$row['admin_name'],
            ((string)$row['status'] === 'approved' ? 'approved ' : 'rejected ') . (string)$row['type'] . ' request',
            (string)$row['approved_at']
        );
    }

    usort($combinedActivities, function ($a, $b) {
        return strtotime((string)$b['createdAt']) <=> strtotime((string)$a['createdAt']);
    });

    // Keep only the latest 80 items.
    $combinedActivities = array_slice($combinedActivities, 0, 80);

    // Format activity times for the frontend.
    $formattedActivities = [];
    foreach ($combinedActivities as $activity) {
        $createdAtRaw = (string)$activity['createdAt'];
        $createdAtIso = date('c', strtotime($createdAtRaw));
        $formattedActivities[] = [
            'id' => (int)$activity['id'],
            'type' => (string)$activity['type'],
            'icon' => (string)$activity['icon'],
            'user' => (string)$activity['user'],
            'action' => (string)$activity['action'],
            'time' => getTimeAgo($createdAtRaw),
            'createdAt' => $createdAtIso,
        ];
    }

    // Send the dashboard data to the frontend.
    echo json_encode([
        'success' => true,
        'kpis' => [
            'totalTasks' => [
                'value' => (int) $totalTasks,
                'change' => (int) $taskChange,
                'icon' => 'fas fa-list-check',
                'color' => '#3b82f6'
            ],
            'pendingApprovals' => [
                'value' => (int) $pendingApprovals,
                'change' => (int) $approvalChange,
                'icon' => 'fas fa-check-circle',
                'color' => '#f59e0b'
            ],
            'resourcesInUse' => [
                'value' => (int) $resourcesInUse,
                'change' => 8,
                'icon' => 'fas fa-tools',
                'color' => '#10b981'
            ],
            'completedTasks' => [
                'value' => (int) $completedTasks,
                'change' => (int) $thisMonthCompleted,
                'icon' => 'fas fa-check',
                'color' => '#8b5cf6'
            ]
        ],
        'charts' => [
            'tasksThisWeek' => $taskChartData,
            'resourceUtilization' => $resourceChartData,
            'monthlyCompletion' => $monthlyCompletionData,
        ],
        'activities' => $formattedActivities,
    ]);

} catch (PDOException $e) {
    // Return an error if the database query fails.
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch dashboard data: ' . $e->getMessage()
    ]);
}

// Turn a date into a short relative label.
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