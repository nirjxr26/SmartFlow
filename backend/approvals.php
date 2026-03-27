<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Get user ID from token
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';
$user_id = 1; // Default for now, should decode from token

try {
    if ($method === 'GET') {
        // Get approvals list
        $status = $_GET['status'] ?? 'all';
        
        $sql = "
            SELECT 
                a.id,
                a.type,
                a.description,
                a.status,
                a.created_at,
                u.name as requested_by_name,
                a.department,
                approver.name as approved_by_name,
                a.approved_at
            FROM approvals a
            JOIN users u ON a.requested_by = u.id
            LEFT JOIN users approver ON a.approved_by = approver.id
        ";
        
        if ($status !== 'all') {
            $sql .= " WHERE a.status = :status";
        }
        
        $sql .= " ORDER BY a.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        
        if ($status !== 'all') {
            $stmt->bindParam(':status', $status);
        }
        
        $stmt->execute();
        $approvals = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format approvals
        $formattedApprovals = [];
        foreach ($approvals as $approval) {
            $formattedApprovals[] = [
                'id' => (int)$approval['id'],
                'type' => $approval['type'],
                'requestedBy' => [
                    'name' => $approval['requested_by_name'],
                    'department' => $approval['department']
                ],
                'date' => date('M d, Y', strtotime($approval['created_at'])),
                'description' => $approval['description'],
                'status' => $approval['status'],
                'approvedBy' => $approval['approved_by_name'],
                'approvedAt' => $approval['approved_at'] ? date('M d, Y', strtotime($approval['approved_at'])) : null
            ];
        }
        
        // Get counts
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM approvals WHERE status = 'pending'");
        $pendingCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM approvals WHERE status = 'approved'");
        $approvedCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM approvals WHERE status = 'rejected'");
        $rejectedCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        echo json_encode([
            'success' => true,
            'approvals' => $formattedApprovals,
            'counts' => [
                'pending' => (int)$pendingCount,
                'approved' => (int)$approvedCount,
                'rejected' => (int)$rejectedCount
            ]
        ]);
        
    } elseif ($method === 'POST') {
        // Create new approval request
        $data = json_decode(file_get_contents('php://input'), true);
        
        $type = $data['type'] ?? '';
        $description = $data['description'] ?? '';
        $department = $data['department'] ?? '';
        
        if (empty($type) || empty($description)) {
            echo json_encode(['success' => false, 'message' => 'Type and description are required']);
            exit;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO approvals (type, requested_by, department, description, status)
            VALUES (:type, :requested_by, :department, :description, 'pending')
        ");
        
        $stmt->execute([
            ':type' => $type,
            ':requested_by' => $user_id,
            ':department' => $department,
            ':description' => $description
        ]);
        
        $approvalId = $pdo->lastInsertId();
        
        // Create notification for admins
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message)
            SELECT id, 'warning', 'New Approval Request', CONCAT(:type, ' request from ', :department)
            FROM users WHERE role = 'Administrator'
        ");
        $stmt->execute([
            ':type' => $type,
            ':department' => $department
        ]);
        
        // Log activity
        $stmt = $pdo->prepare("
            INSERT INTO activities (user_id, type, description, related_id, related_type)
            VALUES (:user_id, 'approval_requested', :description, :approval_id, 'approval')
        ");
        $stmt->execute([
            ':user_id' => $user_id,
            ':description' => "requested approval for $type",
            ':approval_id' => $approvalId
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Approval request created successfully',
            'id' => $approvalId
        ]);
        
    } elseif ($method === 'PUT' || $method === 'PATCH') {
        // Update approval status (approve/reject)
        $data = json_decode(file_get_contents('php://input'), true);
        
        $approvalId = $data['id'] ?? 0;
        $action = $data['action'] ?? ''; // 'approve' or 'reject'
        
        if (!$approvalId || !in_array($action, ['approve', 'reject'])) {
            echo json_encode(['success' => false, 'message' => 'Invalid request']);
            exit;
        }
        
        $status = $action === 'approve' ? 'approved' : 'rejected';
        
        $stmt = $pdo->prepare("
            UPDATE approvals 
            SET status = :status, approved_by = :approved_by, approved_at = NOW()
            WHERE id = :id
        ");
        
        $stmt->execute([
            ':status' => $status,
            ':approved_by' => $user_id,
            ':id' => $approvalId
        ]);
        
        // Get approval details for notification
        $stmt = $pdo->prepare("SELECT type, requested_by FROM approvals WHERE id = :id");
        $stmt->execute([':id' => $approvalId]);
        $approval = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Notify requester
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, title, message)
            VALUES (:user_id, :notif_type, :title, :message)
        ");
        $stmt->execute([
            ':user_id' => $approval['requested_by'],
            ':notif_type' => $status === 'approved' ? 'success' : 'warning',
            ':title' => 'Approval ' . ucfirst($status),
            ':message' => "Your {$approval['type']} request has been $status"
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => "Approval $status successfully"
        ]);
        
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
