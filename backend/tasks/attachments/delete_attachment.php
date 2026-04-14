<?php
require_once '../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['attachment_id'])) {
    echo json_encode(['success' => false, 'message' => 'Attachment ID is required']);
    exit;
}

$attachmentId = intval($data['attachment_id']);
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

    // Get attachment details
    $stmt = $pdo->prepare("
        SELECT id, file_path, uploaded_by FROM task_attachments WHERE id = ?
    ");
    $stmt->execute([$attachmentId]);
    $attachment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$attachment) {
        echo json_encode(['success' => false, 'message' => 'Attachment not found']);
        exit;
    }

    $isAdmin = flowstone_is_admin_role($user['role'] ?? null);
    if (!$isAdmin && (int)$attachment['uploaded_by'] !== $userId) {
        echo json_encode(['success' => false, 'message' => 'You can only delete your own attachments']);
        exit;
    }

    // Delete file from disk
    $filePath = dirname(__DIR__, 2) . '/' . $attachment['file_path'];
    if (file_exists($filePath)) {
        unlink($filePath);
    }

    // Delete from database
    $stmt = $pdo->prepare("DELETE FROM task_attachments WHERE id = ?");
    $stmt->execute([$attachmentId]);

    echo json_encode([
        'success' => true,
        'message' => 'Attachment deleted successfully'
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
