<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$attachment_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$attachment_id) {
    echo json_encode(['success' => false, 'message' => 'Attachment ID is required']);
    exit;
}

try {
    // Get attachment details
    $stmt = $pdo->prepare("
        SELECT id, filename, file_path FROM task_attachments WHERE id = ?
    ");
    $stmt->execute([$attachment_id]);
    $attachment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$attachment) {
        http_response_code(404);
        echo 'Attachment not found';
        exit;
    }

    $filePath = __DIR__ . '/' . $attachment['file_path'];

    if (!file_exists($filePath)) {
        http_response_code(404);
        echo 'File not found';
        exit;
    }

    // Get file MIME type
    $mimeType = mime_content_type($filePath);
    
    // Set headers for download
    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . $attachment['filename'] . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: public, must-revalidate');
    header('Pragma: public');

    // Output file
    readfile($filePath);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo 'Database error: ' . $e->getMessage();
}
?>
