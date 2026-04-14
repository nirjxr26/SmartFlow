<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

$userId = intval($data['id']);

// Validate authorization (simple check for demo)
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader)) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Fields that can be updated
$updateFields = [];
$params = [];

if (isset($data['name']) && !empty(trim($data['name']))) {
    $updateFields[] = "name = ?";
    $params[] = trim($data['name']);
}

if (isset($data['phone'])) {
    $updateFields[] = "phone = ?";
    $params[] = !empty(trim($data['phone'])) ? trim($data['phone']) : null;
}

if (isset($data['bio'])) {
    $updateFields[] = "bio = ?";
    $params[] = !empty(trim($data['bio'])) ? trim($data['bio']) : null;
}

if (isset($data['department'])) {
    $updateFields[] = "department = ?";
    $params[] = !empty(trim($data['department'])) ? trim($data['department']) : null;
}

if (empty($updateFields)) {
    echo json_encode(['success' => false, 'message' => 'No fields to update']);
    exit;
}

try {
    // Build and execute update query
    $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $params[] = $userId;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() > 0 || true) { // true allows for no-change updates
        // Fetch updated user data
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
            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => $user
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found after update']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'No changes made']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>