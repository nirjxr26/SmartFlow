<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Get user ID from token
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';
$userId = $_GET['userId'] ?? 1; // Get from query or token

try {
    if ($method === 'GET') {
        // Get notifications for user
        $filter = $_GET['filter'] ?? 'all'; // 'all' or 'unread'
        
        $sql = "
            SELECT 
                id,
                type,
                title,
                message,
                is_read,
                created_at
            FROM notifications
            WHERE user_id = :user_id
        ";
        
        if ($filter === 'unread') {
            $sql .= " AND is_read = 0";
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT 50";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':user_id' => $userId]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format notifications
        $formattedNotifications = [];
        foreach ($notifications as $notification) {
            $formattedNotifications[] = [
                'id' => (int)$notification['id'],
                'type' => $notification['type'],
                'title' => $notification['title'],
                'message' => $notification['message'],
                'time' => getTimeAgo($notification['created_at']),
                'read' => (bool)$notification['is_read']
            ];
        }
        
        // Get unread count
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = :user_id AND is_read = 0");
        $stmt->execute([':user_id' => $userId]);
        $unreadCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        echo json_encode([
            'success' => true,
            'notifications' => $formattedNotifications,
            'unreadCount' => (int)$unreadCount
        ]);
        
    } elseif ($method === 'POST') {
        // Mark notification as read
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? '';
        
        if ($action === 'markRead') {
            $notificationId = $data['id'] ?? 0;
            
            if ($notificationId) {
                $stmt = $pdo->prepare("
                    UPDATE notifications 
                    SET is_read = 1
                    WHERE id = :id AND user_id = :user_id
                ");
                $stmt->execute([
                    ':id' => $notificationId,
                    ':user_id' => $userId
                ]);
            }
            
            echo json_encode(['success' => true, 'message' => 'Notification marked as read']);
            
        } elseif ($action === 'markAllRead') {
            $stmt = $pdo->prepare("
                UPDATE notifications 
                SET is_read = 1
                WHERE user_id = :user_id AND is_read = 0
            ");
            $stmt->execute([':user_id' => $userId]);
            
            echo json_encode(['success' => true, 'message' => 'All notifications marked as read']);
            
        } elseif ($action === 'create') {
            // Create new notification (admin/system use)
            $type = $data['type'] ?? 'info';
            $title = $data['title'] ?? '';
            $message = $data['message'] ?? '';
            $targetUserId = $data['userId'] ?? $userId;
            
            if (empty($title) || empty($message)) {
                echo json_encode(['success' => false, 'message' => 'Title and message required']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, type, title, message)
                VALUES (:user_id, :type, :title, :message)
            ");
            
            $stmt->execute([
                ':user_id' => $targetUserId,
                ':type' => $type,
                ':title' => $title,
                ':message' => $message
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Notification created']);
        }
        
    } elseif ($method === 'DELETE') {
        // Delete notification
        $data = json_decode(file_get_contents('php://input'), true);
        $notificationId = $data['id'] ?? 0;
        
        if (!$notificationId) {
            echo json_encode(['success' => false, 'message' => 'Notification ID required']);
            exit;
        }
        
        $stmt = $pdo->prepare("
            DELETE FROM notifications 
            WHERE id = :id AND user_id = :user_id
        ");
        $stmt->execute([
            ':id' => $notificationId,
            ':user_id' => $userId
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Notification deleted']);
        
    } else {
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

function getTimeAgo($datetime) {
    $now = new DateTime();
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);
    
    if ($diff->y > 0) return $diff->y . ' year' . ($diff->y > 1 ? 's' : '') . ' ago';
    if ($diff->m > 0) return $diff->m . ' month' . ($diff->m > 1 ? 's' : '') . ' ago';
    if ($diff->d > 1) return $diff->d . ' days ago';
    if ($diff->d == 1) return 'Yesterday';
    if ($diff->h > 0) return $diff->h . ' hour' . ($diff->h > 1 ? 's' : '') . ' ago';
    if ($diff->i > 0) return $diff->i . ' min ago';
    return 'Just now';
}
?>
