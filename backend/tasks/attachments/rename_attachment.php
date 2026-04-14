<?php
require_once '../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['attachment_id']) || !isset($data['filename'])) {
    echo json_encode(['success' => false, 'message' => 'Attachment ID and filename are required']);
    exit;
}

$attachment_id = intval($data['attachment_id']);
$filename = trim($data['filename']);
$user_id = isset($data['user_id']) ? intval($data['user_id']) : 1;

if (empty($filename)) {
    echo json_encode(['success' => false, 'message' => 'Filename cannot be empty']);
    exit;
}

// Validate filename format
if (strpos($filename, '/') !== false || strpos($filename, '\\') !== false) {
    echo json_encode(['success' => false, 'message' => 'Invalid filename']);
    exit;
}

try {
    $user = flowstone_fetch_user($pdo, $user_id);
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    // Get attachment details to verify ownership
    $stmt = $pdo->prepare("
        SELECT id, uploaded_by FROM task_attachments WHERE id = ?
    ");
    $stmt->execute([$attachment_id]);
    $attachment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$attachment) {
        echo json_encode(['success' => false, 'message' => 'Attachment not found']);
        exit;
    }

    $isAdmin = flowstone_is_admin_role($user['role'] ?? null);

    // Check if user uploaded the attachment or is admin
    if (!$isAdmin && $attachment['uploaded_by'] != $user_id) {
        echo json_encode(['success' => false, 'message' => 'You can only rename your own attachments']);
        exit;
    }

    // Update filename
    $stmt = $pdo->prepare("
        UPDATE task_attachments SET filename = ? WHERE id = ?
    ");

    $stmt->execute([
        $filename,
        $attachment_id
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Attachment renamed successfully',
        'attachment' => [
            'id' => (int)$attachment_id,
            'name' => $filename,
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
