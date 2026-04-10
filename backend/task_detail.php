<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$taskId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$taskId) {
    echo json_encode(['success' => false, 'message' => 'Task ID is required']);
    exit;
}

try {
    // Get task details
    $stmt = $pdo->prepare("
        SELECT 
            t.id,
            t.title,
            t.description,
            t.status,
            t.priority,
            t.deadline,
            t.created_at,
            t.updated_at,
            u.id as assignee_id,
            u.name as assignee_name,
            u.email as assignee_email,
            creator.id as created_by_id,
            creator.name as created_by_name
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN users creator ON t.created_by = creator.id
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$task) {
        echo json_encode(['success' => false, 'message' => 'Task not found']);
        exit;
    }
    
    // Get comments
    $stmt = $pdo->prepare("
        SELECT 
            c.id,
            c.content,
            c.created_at,
            c.user_id,
            u.name as user_name,
            u.email as user_email
        FROM task_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.task_id = ?
        ORDER BY c.created_at DESC
    ");
    $stmt->execute([$taskId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get attachments
    $stmt = $pdo->prepare("
        SELECT 
            a.id,
            a.filename,
            a.file_type,
            a.file_size,
            a.file_path,
            a.created_at,
            a.uploaded_by,
            u.name as uploaded_by_name
        FROM task_attachments a
        LEFT JOIN users u ON a.uploaded_by = u.id
        WHERE a.task_id = ?
        ORDER BY a.created_at DESC
    ");
    $stmt->execute([$taskId]);
    $attachments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format response
    $response = [
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
        'createdBy' => [
            'id' => $task['created_by_id'],
            'name' => $task['created_by_name']
        ],
        'deadline' => $task['deadline'] ? date('M d, Y', strtotime($task['deadline'])) : null,
        'createdAt' => date('M d, Y', strtotime($task['created_at'])),
        'updatedAt' => date('M d, Y', strtotime($task['updated_at'])),
        'comments' => array_map(function($comment) {
            return [
                'id' => (int)$comment['id'],
                'userId' => (int)$comment['user_id'],
                'user' => $comment['user_name'],
                'content' => $comment['content'],
                'time' => date('M d, Y H:i', strtotime($comment['created_at']))
            ];
        }, $comments),
        'attachments' => array_map(function($attachment) {
            return [
                'id' => (int)$attachment['id'],
                'name' => $attachment['filename'],
                'type' => $attachment['file_type'],
                'size' => $attachment['file_size'],
                'uploadedBy' => $attachment['uploaded_by_name'],
                'uploadedById' => (int)$attachment['uploaded_by']
            ];
        }, $attachments)
    ];
    
    echo json_encode([
        'success' => true,
        'task' => $response
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>