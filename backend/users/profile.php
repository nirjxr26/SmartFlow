<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get user ID from query parameter or session
$userId = isset($_GET['id']) ? intval($_GET['id']) : null;

// If no ID provided, try to get from authorization token
if (!$userId) {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    // For simplicity, we'll extract user ID from localStorage token sent in header
    // In production, you should use proper JWT or session validation
    if (empty($authHeader)) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
}

// For demo, if still no user ID, use ID from token or default to 1
if (!$userId) {
    $userId = 1; // Default to first user for demo
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            id, 
            email, 
            name, 
            phone,
            role,
            department,
            bio,
            avatar,
            created_at 
        FROM users 
        WHERE id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Remove sensitive data
        unset($user['password']);
        
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>