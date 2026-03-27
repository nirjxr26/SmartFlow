<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get filters from query parameters
$status = isset($_GET['status']) ? $_GET['status'] : null;
$priority = isset($_GET['priority']) ? $_GET['priority'] : null;
$assignee_id = isset($_GET['assignee_id']) ? intval($_GET['assignee_id']) : null;
$search = isset($_GET['search']) ? trim($_GET['search']) : null;

try {
    // Build query
    $sql = "
        SELECT 
            t.id,
            t.title,
            t.description,
            t.status,
            t.priority,
            t.deadline,
            t.created_at,
            t.updated_at,
            t.assignee_id,
            u.name as assignee_name,
            u.email as assignee_email,
            creator.name as created_by_name,
            (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comments_count,
            (SELECT COUNT(*) FROM task_attachments WHERE task_id = t.id) as attachments_count
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN users creator ON t.created_by = creator.id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Add filters
    if ($status && in_array($status, ['pending', 'in-progress', 'review', 'completed'])) {
        $sql .= " AND t.status = ?";
        $params[] = $status;
    }
    
    if ($priority && in_array($priority, ['low', 'medium', 'high'])) {
        $sql .= " AND t.priority = ?";
        $params[] = $priority;
    }
    
    if ($assignee_id) {
        $sql .= " AND t.assignee_id = ?";
        $params[] = $assignee_id;
    }
    
    if ($search) {
        $sql .= " AND (t.title LIKE ? OR t.description LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    // Order by priority and deadline
    $sql .= " ORDER BY 
        CASE t.priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
        END,
        t.deadline ASC,
        t.created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format tasks
    $formattedTasks = array_map(function($task) {
        return [
            'id' => (int)$task['id'],
            'title' => $task['title'],
            'description' => $task['description'],
            'status' => $task['status'],
            'priority' => $task['priority'],
            'assignee' => [
                'id' => $task['assignee_id'],
                'name' => $task['assignee_name'] ?? 'Unassigned',
                'email' => $task['assignee_email'] ?? null
            ],
            'createdBy' => $task['created_by_name'],
            'deadline' => $task['deadline'] ? date('M d, Y', strtotime($task['deadline'])) : null,
            'createdAt' => date('M d, Y', strtotime($task['created_at'])),
            'updatedAt' => date('M d, Y', strtotime($task['updated_at'])),
            'comments' => (int)$task['comments_count'],
            'attachments' => (int)$task['attachments_count']
        ];
    }, $tasks);
    
    echo json_encode([
        'success' => true,
        'tasks' => $formattedTasks,
        'total' => count($formattedTasks)
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>