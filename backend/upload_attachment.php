<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get task_id from POST data
$task_id = isset($_POST['task_id']) ? intval($_POST['task_id']) : 0;
$user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 1;

if (!$task_id) {
    echo json_encode(['success' => false, 'message' => 'Task ID is required']);
    exit;
}

if (!isset($_FILES['file'])) {
    echo json_encode(['success' => false, 'message' => 'No file provided']);
    exit;
}

$file = $_FILES['file'];

// Validation
$maxFileSize = 5 * 1024 * 1024; // 5MB
$allowedExtensions = ['txt', 'pdf', 'jpg', 'jpeg', 'png'];
$allowedMimeTypes = ['text/plain', 'application/pdf', 'image/jpeg', 'image/png'];

// Check file size
if ($file['size'] > $maxFileSize) {
    echo json_encode(['success' => false, 'message' => 'File size exceeds 5MB limit']);
    exit;
}

// Check file extension
$fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($fileExtension, $allowedExtensions)) {
    echo json_encode(['success' => false, 'message' => 'File type not allowed. Allowed: txt, pdf, jpg, png']);
    exit;
}

// Check MIME type
$fileMimeType = mime_content_type($file['tmp_name']);
if (!in_array($fileMimeType, $allowedMimeTypes)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file type']);
    exit;
}

// Check if task exists
try {
    $user = flowstone_fetch_user($pdo, $user_id);
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, created_by FROM tasks WHERE id = ?");
    $stmt->execute([$task_id]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$task) {
        echo json_encode(['success' => false, 'message' => 'Task not found']);
        exit;
    }

    // Create uploads directory if it doesn't exist
    $uploadsDir = __DIR__ . '/uploads/task_attachments';
    if (!is_dir($uploadsDir)) {
        mkdir($uploadsDir, 0755, true);
    }

    // Generate unique filename
    $timestamp = time();
    $randomStr = bin2hex(random_bytes(4));
    $newFilename = $timestamp . '_' . $randomStr . '_' . basename($file['name']);
    $filePath = $uploadsDir . '/' . $newFilename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        echo json_encode(['success' => false, 'message' => 'Failed to upload file']);
        exit;
    }

    // Determine file type
    $fileType = 'other';
    if (in_array($fileExtension, ['jpg', 'jpeg', 'png'])) {
        $fileType = 'image';
    } elseif ($fileExtension === 'pdf') {
        $fileType = 'pdf';
    } elseif ($fileExtension === 'txt') {
        $fileType = 'doc';
    }

    // Insert into database
    $stmt = $pdo->prepare("
        INSERT INTO task_attachments (task_id, filename, file_type, file_size, file_path, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $task_id,
        $file['name'],
        $fileType,
        round($file['size'] / 1024, 2) . ' KB',
        'uploads/task_attachments/' . $newFilename,
        $user_id
    ]);

    $attachmentId = $pdo->lastInsertId();

    // Get user info
    $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'File uploaded successfully',
        'attachment' => [
            'id' => (int)$attachmentId,
            'name' => $file['name'],
            'type' => $fileType,
            'size' => round($file['size'] / 1024, 2) . ' KB',
            'uploadedBy' => $user['name'] ?? 'Unknown',
            'uploadedAt' => date('M d, Y H:i')
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
