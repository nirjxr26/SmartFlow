<?php
require_once '../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['comment_id'])) {
    echo json_encode(['success' => false, 'message' => 'Comment ID is required']);
    exit;
}

$commentId = intval($data['comment_id']);
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

    // Check if comment exists
    $stmt = $pdo->prepare("SELECT id, user_id FROM task_comments WHERE id = ?");
    $stmt->execute([$commentId]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$comment) {
        echo json_encode(['success' => false, 'message' => 'Comment not found']);
        exit;
    }

    $isAdmin = flowstone_is_admin_role($user['role'] ?? null);
    if (!$isAdmin && (int)$comment['user_id'] !== $userId) {
        echo json_encode(['success' => false, 'message' => 'You can only delete your own comments']);
        exit;
    }

    // Delete comment
    $stmt = $pdo->prepare("DELETE FROM task_comments WHERE id = ?");
    $stmt->execute([$commentId]);

    echo json_encode([
        'success' => true,
        'message' => 'Comment deleted successfully'
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
