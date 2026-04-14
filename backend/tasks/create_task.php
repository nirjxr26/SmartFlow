<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validation
if (!$data || !isset($data['title']) || empty(trim($data['title']))) {
    echo json_encode(['success' => false, 'message' => 'Title is required']);
    exit;
}

// Use user_id from request body.
$userId = isset($data['user_id']) ? intval($data['user_id']) : 1;

$title = trim($data['title']);
$description = isset($data['description']) ? trim($data['description']) : null;
$status = isset($data['status']) && in_array($data['status'], ['pending', 'in-progress', 'review', 'completed']) 
    ? $data['status'] 
    : 'pending';
$priority = isset($data['priority']) && in_array($data['priority'], ['low', 'medium', 'high']) 
    ? $data['priority'] 
    : 'medium';
$assignee_id = isset($data['assignee_id']) ? intval($data['assignee_id']) : null;
$deadline = isset($data['deadline']) && !empty($data['deadline']) ? $data['deadline'] : null;

// Validate deadline format
if ($deadline) {
    $deadlineObj = DateTime::createFromFormat('Y-m-d', $deadline);
    if (!$deadlineObj) {
        echo json_encode(['success' => false, 'message' => 'Invalid deadline format. Use YYYY-MM-DD']);
        exit;
    }
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO tasks (title, description, status, priority, assignee_id, created_by, deadline)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $title,
        $description,
        $status,
        $priority,
        $assignee_id,
        $userId,
        $deadline
    ]);
    
    $taskId = $pdo->lastInsertId();

    if ($assignee_id && $assignee_id !== $userId) {
        $stmt = $pdo->prepare("\n            INSERT INTO notifications (user_id, type, title, message)\n            VALUES (:user_id, 'info', :title, :message)\n        ");
        $stmt->execute([
            ':user_id' => $assignee_id,
            ':title' => 'New Task Assigned',
            ':message' => 'You were assigned to task: ' . $title,
        ]);
    }
    
    // Fetch the created task
    $stmt = $pdo->prepare("
        SELECT 
            t.id,
            t.title,
            t.description,
            t.status,
            t.priority,
            t.deadline,
            t.created_at,
            u.name as assignee_name,
            u.email as assignee_email,
            creator.name as created_by_name
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN users creator ON t.created_by = creator.id
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $response = [
        'id' => (int)$task['id'],
        'title' => $task['title'],
        'description' => $task['description'],
        'status' => $task['status'],
        'priority' => $task['priority'],
        'assignee' => [
            'name' => $task['assignee_name'] ?? 'Unassigned',
            'email' => $task['assignee_email'] ?? null
        ],
        'createdBy' => $task['created_by_name'],
        'deadline' => $task['deadline'] ? date('M d, Y', strtotime($task['deadline'])) : null,
        'createdAt' => date('M d, Y', strtotime($task['created_at'])),
        'comments' => 0,
        'attachments' => 0
    ];
    
    echo json_encode([
        'success' => true,
        'message' => 'Task created successfully',
        'task' => $response
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>