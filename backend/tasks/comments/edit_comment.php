<?php
require_once '../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['comment_id']) || !isset($data['content'])) {
    echo json_encode(['success' => false, 'message' => 'Comment ID and content are required']);
    exit;
}

$comment_id = intval($data['comment_id']);
$user_id = isset($data['user_id']) ? intval($data['user_id']) : 1;
$content = trim($data['content']);

if (empty($content)) {
    echo json_encode(['success' => false, 'message' => 'Comment cannot be empty']);
    exit;
}

try {
    $user = flowstone_fetch_user($pdo, $user_id);
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    // Get comment details to verify ownership
    $stmt = $pdo->prepare("
        SELECT id, user_id, content, task_id FROM task_comments WHERE id = ?
    ");
    $stmt->execute([$comment_id]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$comment) {
        echo json_encode(['success' => false, 'message' => 'Comment not found']);
        exit;
    }

    $isAdmin = flowstone_is_admin_role($user['role'] ?? null);

    // Check if user owns the comment or is admin
    if (!$isAdmin && $comment['user_id'] != $user_id) {
        echo json_encode(['success' => false, 'message' => 'You can only edit your own comments']);
        exit;
    }

    // Update comment
    $stmt = $pdo->prepare("
        UPDATE task_comments SET content = ? WHERE id = ?
    ");

    $stmt->execute([
        $content,
        $comment_id
    ]);

    // Get user info
    $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Comment edited successfully',
        'comment' => [
            'id' => (int)$comment_id,
            'content' => $content,
            'user' => $user['name'] ?? 'Unknown',
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
