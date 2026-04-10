<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['task_id']) || !isset($data['content'])) {
    echo json_encode(['success' => false, 'message' => 'Task ID and content are required']);
    exit;
}

$task_id = intval($data['task_id']);
$user_id = isset($data['user_id']) ? intval($data['user_id']) : 1;
$content = trim($data['content']);

if (empty($content)) {
    echo json_encode(['success' => false, 'message' => 'Comment cannot be empty']);
    exit;
}

try {
    // Check if task exists
    $stmt = $pdo->prepare("SELECT id, created_by FROM tasks WHERE id = ?");
    $stmt->execute([$task_id]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$task) {
        echo json_encode(['success' => false, 'message' => 'Task not found']);
        exit;
    }

    $user = flowstone_fetch_user($pdo, $user_id);
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    // Insert comment
    $stmt = $pdo->prepare("
        INSERT INTO task_comments (task_id, user_id, content)
        VALUES (?, ?, ?)
    ");

    $stmt->execute([
        $task_id,
        $user_id,
        $content
    ]);

    $commentId = $pdo->lastInsertId();

    // Get user info
    $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Comment added successfully',
        'comment' => [
            'id' => (int)$commentId,
            'user' => $user['name'] ?? 'Unknown',
            'content' => $content,
            'time' => date('M d, Y H:i'),
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
