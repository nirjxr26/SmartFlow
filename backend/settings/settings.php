<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Get user ID from token
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';

// For now, get user from localStorage (should be from JWT token in production)
$user_id = $_GET['userId'] ?? 1;

try {
    if ($method === 'GET') {
        // Get user settings
        $stmt = $pdo->prepare("
            SELECT 
                id, name, email, role, department, phone, bio, avatar, preferences
            FROM users 
            WHERE id = :id
        ");
        $stmt->execute([':id' => $user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // Parse preferences JSON or use defaults
            $preferences = json_decode($user['preferences'], true) ?? [
                'emailNotifications' => true,
                'taskReminders' => true,
                'approvalRequests' => true,
                'systemUpdates' => false,
                'theme' => 'light'
            ];
            
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => (int)$user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'department' => $user['department'],
                    'phone' => $user['phone'],
                    'bio' => $user['bio'],
                    'avatar' => $user['avatar']
                ],
                'preferences' => $preferences
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
        
    } elseif ($method === 'POST' || $method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? 'updateProfile';
        
        if ($action === 'updateProfile') {
            // Update user profile
            $userId = $data['id'] ?? $user_id;
            $name = $data['name'] ?? null;
            $email = $data['email'] ?? null;
            $phone = $data['phone'] ?? null;
            $bio = $data['bio'] ?? null;
            $department = $data['department'] ?? null;
            
            $updates = [];
            $params = [':id' => $userId];
            
            if ($name !== null) {
                $updates[] = "name = :name";
                $params[':name'] = $name;
            }
            if ($email !== null) {
                $updates[] = "email = :email";
                $params[':email'] = $email;
            }
            if ($phone !== null) {
                $updates[] = "phone = :phone";
                $params[':phone'] = $phone;
            }
            if ($bio !== null) {
                $updates[] = "bio = :bio";
                $params[':bio'] = $bio;
            }
            if ($department !== null) {
                $updates[] = "department = :department";
                $params[':department'] = $department;
            }
            
            if (!empty($updates)) {
                $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                
                // Get updated user
                $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
                $stmt->execute([':id' => $userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Profile updated successfully',
                    'user' => $user
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'No fields to update']);
            }
            
        } elseif ($action === 'updatePassword') {
            // Update password
            $userId = $data['id'] ?? $user_id;
            $currentPassword = $data['currentPassword'] ?? '';
            $newPassword = $data['newPassword'] ?? '';
            
            if (empty($currentPassword) || empty($newPassword)) {
                echo json_encode(['success' => false, 'message' => 'Current and new passwords are required']);
                exit;
            }
            
            // Verify current password
            $stmt = $pdo->prepare("SELECT password FROM users WHERE id = :id");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user || !password_verify($currentPassword, $user['password'])) {
                echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
                exit;
            }
            
            // Update password
            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET password = :password WHERE id = :id");
            $stmt->execute([
                ':password' => $hashedPassword,
                ':id' => $userId
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Password updated successfully'
            ]);
            
        } elseif ($action === 'updateAvatar') {
            // Update avatar URL
            $userId = $data['id'] ?? $user_id;
            $avatar = $data['avatar'] ?? null;
            
            if ($avatar) {
                $stmt = $pdo->prepare("UPDATE users SET avatar = :avatar WHERE id = :id");
                $stmt->execute([
                    ':avatar' => $avatar,
                    ':id' => $userId
                ]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Avatar updated successfully',
                    'avatar' => $avatar
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Avatar URL required']);
            }
            
        } elseif ($action === 'updatePreferences') {
            // Update notification preferences in database
            $userId = $data['id'] ?? $user_id;
            $preferences = $data['preferences'] ?? [];
            
            $stmt = $pdo->prepare("UPDATE users SET preferences = :preferences WHERE id = :id");
            $stmt->execute([
                ':preferences' => json_encode($preferences),
                ':id' => $userId
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Preferences updated successfully',
                'preferences' => $preferences
            ]);
        }
        
    } else {
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
