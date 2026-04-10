<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'Task ID is required']);
    exit;
}

$taskId = intval($data['id']);
$userId = isset($data['user_id']) ? intval($data['user_id']) : 0;

try {
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        exit;
    }

    $user = flowstone_fetch_user($pdo, $userId);
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    // Check if task exists
    $stmt = $pdo->prepare("SELECT id, title, created_by FROM tasks WHERE id = ?");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$task) {
        echo json_encode(['success' => false, 'message' => 'Task not found']);
        exit;
    }

    $isAdmin = flowstone_is_admin_role($user['role'] ?? null);
    $isOwner = (int)$task['created_by'] === $userId;

    if (!$isAdmin && !$isOwner) {
        echo json_encode(['success' => false, 'message' => 'You can only delete your own tasks']);
        exit;
    }
    
    // Delete task (comments and attachments will be deleted automatically due to CASCADE)
    $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
    $stmt->execute([$taskId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Task deleted successfully',
        'task_id' => $taskId,
        'task_title' => $task['title']
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>