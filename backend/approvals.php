<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $requestUserId = 0;
    $data = [];

    if ($method === 'GET') {
        $requestUserId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    } else {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $requestUserId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    }

    if ($requestUserId <= 0) {
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        exit;
    }

    $requestUser = flowstone_fetch_user($pdo, $requestUserId);
    if (!$requestUser) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    $isAdmin = flowstone_is_admin_role($requestUser['role'] ?? null);

    if ($method === 'GET') {
        $status = $_GET['status'] ?? 'all';
        $allowedStatuses = ['all', 'pending', 'approved', 'rejected'];
        if (!in_array($status, $allowedStatuses, true)) {
            echo json_encode(['success' => false, 'message' => 'Invalid status filter']);
            exit;
        }

        $sql = "
            SELECT
                a.id,
                a.type,
                a.description,
                a.status,
                a.created_at,
                a.department,
                a.requested_by,
                u.name AS requested_by_name,
                approver.name AS approved_by_name,
                a.approved_at
            FROM approvals a
            JOIN users u ON a.requested_by = u.id
            LEFT JOIN users approver ON a.approved_by = approver.id
        ";

        $where = [];
        $params = [];

        if (!$isAdmin) {
            $where[] = 'a.requested_by = :requested_by';
            $params[':requested_by'] = $requestUserId;
        }

        if ($status !== 'all') {
            $where[] = 'a.status = :status';
            $params[':status'] = $status;
        }

        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY a.created_at DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $approvals = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formattedApprovals = array_map(function ($approval) use ($requestUserId, $isAdmin) {
            $isPending = $approval['status'] === 'pending';
            return [
                'id' => (int)$approval['id'],
                'type' => $approval['type'],
                'requestedBy' => [
                    'id' => (int)$approval['requested_by'],
                    'name' => $approval['requested_by_name'],
                    'department' => $approval['department'],
                ],
                'date' => date('M d, Y', strtotime($approval['created_at'])),
                'createdDate' => date('Y-m-d', strtotime($approval['created_at'])),
                'description' => $approval['description'],
                'status' => $approval['status'],
                'approvedBy' => $approval['approved_by_name'],
                'approvedAt' => $approval['approved_at'] ? date('M d, Y', strtotime($approval['approved_at'])) : null,
                'canModify' => $isPending && ((int)$approval['requested_by'] === $requestUserId || $isAdmin),
            ];
        }, $approvals);

        $countsSql = 'SELECT status, COUNT(*) AS count FROM approvals';
        $countsParams = [];

        if (!$isAdmin) {
            $countsSql .= ' WHERE requested_by = :requested_by';
            $countsParams[':requested_by'] = $requestUserId;
        }

        $countsSql .= ' GROUP BY status';

        $stmt = $pdo->prepare($countsSql);
        $stmt->execute($countsParams);
        $countRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countMap = [
            'pending' => 0,
            'approved' => 0,
            'rejected' => 0,
        ];

        foreach ($countRows as $row) {
            if (isset($countMap[$row['status']])) {
                $countMap[$row['status']] = (int)$row['count'];
            }
        }

        echo json_encode([
            'success' => true,
            'approvals' => $formattedApprovals,
            'counts' => $countMap,
            'canReview' => $isAdmin,
        ]);
        exit;
    }

    if ($method === 'POST') {
        $type = isset($data['type']) ? trim($data['type']) : '';
        $description = isset($data['description']) ? trim($data['description']) : '';
        $department = isset($data['department']) ? trim($data['department']) : '';

        if ($type === '' || $description === '') {
            echo json_encode(['success' => false, 'message' => 'Type and description are required']);
            exit;
        }

        $stmt = $pdo->prepare('
            INSERT INTO approvals (type, requested_by, department, description, status)
            VALUES (:type, :requested_by, :department, :description, :status)
        ');

        $stmt->execute([
            ':type' => $type,
            ':requested_by' => $requestUserId,
            ':department' => $department !== '' ? $department : null,
            ':description' => $description,
            ':status' => 'pending',
        ]);

        $approvalId = (int)$pdo->lastInsertId();

        $stmt = $pdo->prepare('
            INSERT INTO notifications (user_id, type, title, message)
            SELECT id, :type, :title, :message
            FROM users
            WHERE role = :role AND id <> :requester
        ');
        $stmt->execute([
            ':type' => 'warning',
            ':title' => 'New Approval Request',
            ':message' => $type . ' request submitted',
            ':role' => 'Administrator',
            ':requester' => $requestUserId,
        ]);

        $stmt = $pdo->prepare('
            INSERT INTO activities (user_id, type, description, related_id, related_type)
            VALUES (:user_id, :type, :description, :related_id, :related_type)
        ');
        $stmt->execute([
            ':user_id' => $requestUserId,
            ':type' => 'approval_requested',
            ':description' => 'requested approval for ' . $type,
            ':related_id' => $approvalId,
            ':related_type' => 'approval',
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Approval request created successfully',
            'id' => $approvalId,
        ]);
        exit;
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        $approvalId = isset($data['id']) ? intval($data['id']) : 0;
        $action = $data['action'] ?? '';

        if ($approvalId <= 0 || !in_array($action, ['approve', 'reject', 'modify', 'pending'], true)) {
            echo json_encode(['success' => false, 'message' => 'Invalid request']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id, type, requested_by, status, department, description FROM approvals WHERE id = :id');
        $stmt->execute([':id' => $approvalId]);
        $approval = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$approval) {
            echo json_encode(['success' => false, 'message' => 'Approval not found']);
            exit;
        }

        $isOwner = (int)$approval['requested_by'] === $requestUserId;

        if ($action === 'modify') {
            if ($approval['status'] !== 'pending') {
                echo json_encode(['success' => false, 'message' => 'Only pending approvals can be modified']);
                exit;
            }

            if (!$isAdmin && !$isOwner) {
                echo json_encode(['success' => false, 'message' => 'You can only modify your own pending approvals']);
                exit;
            }

            $newType = isset($data['type']) ? trim($data['type']) : '';
            $newDescription = isset($data['description']) ? trim($data['description']) : '';
            $newDepartment = isset($data['department']) ? trim($data['department']) : '';

            if ($newType === '' || $newDescription === '') {
                echo json_encode(['success' => false, 'message' => 'Type and description are required']);
                exit;
            }

            $stmt = $pdo->prepare('UPDATE approvals SET type = :type, department = :department, description = :description WHERE id = :id');
            $stmt->execute([
                ':type' => $newType,
                ':department' => $newDepartment !== '' ? $newDepartment : null,
                ':description' => $newDescription,
                ':id' => $approvalId,
            ]);

            $stmt = $pdo->prepare('
                INSERT INTO activities (user_id, type, description, related_id, related_type)
                VALUES (:user_id, :type, :description, :related_id, :related_type)
            ');
            $stmt->execute([
                ':user_id' => $requestUserId,
                ':type' => 'approval_requested',
                ':description' => 'modified approval request #' . $approvalId,
                ':related_id' => $approvalId,
                ':related_type' => 'approval',
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Approval updated successfully',
            ]);
            exit;
        }

        if (!$isAdmin) {
            echo json_encode(['success' => false, 'message' => 'Only admins can review approvals']);
            exit;
        }

        $allowedReviewActionsByStatus = [
            'pending' => ['approve', 'reject'],
            'approved' => ['reject', 'pending'],
            'rejected' => ['approve', 'pending'],
        ];

        $currentStatus = (string)$approval['status'];
        $allowedActions = $allowedReviewActionsByStatus[$currentStatus] ?? [];
        if (!in_array($action, $allowedActions, true)) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid status transition from ' . $currentStatus,
            ]);
            exit;
        }

        if ($action === 'pending') {
            $stmt = $pdo->prepare('
                UPDATE approvals
                SET status = :status, approved_by = NULL, approved_at = NULL
                WHERE id = :id
            ');
            $stmt->execute([
                ':status' => 'pending',
                ':id' => $approvalId,
            ]);

            $stmt = $pdo->prepare('
                INSERT INTO activities (user_id, type, description, related_id, related_type)
                VALUES (:user_id, :type, :description, :related_id, :related_type)
            ');
            $stmt->execute([
                ':user_id' => $requestUserId,
                ':type' => 'approval_requested',
                ':description' => 'moved approval request #' . $approvalId . ' back to pending',
                ':related_id' => $approvalId,
                ':related_type' => 'approval',
            ]);

            $stmt = $pdo->prepare('
                INSERT INTO notifications (user_id, type, title, message)
                VALUES (:user_id, :type, :title, :message)
            ');
            $stmt->execute([
                ':user_id' => (int)$approval['requested_by'],
                ':type' => 'info',
                ':title' => 'Approval Moved To Pending',
                ':message' => 'Your ' . $approval['type'] . ' request was moved back to pending review',
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Approval moved to pending successfully',
            ]);
            exit;
        }

        $status = $action === 'approve' ? 'approved' : 'rejected';

        $stmt = $pdo->prepare('
            UPDATE approvals
            SET status = :status, approved_by = :approved_by, approved_at = NOW()
            WHERE id = :id
        ');
        $stmt->execute([
            ':status' => $status,
            ':approved_by' => $requestUserId,
            ':id' => $approvalId,
        ]);

        $stmt = $pdo->prepare('
            INSERT INTO notifications (user_id, type, title, message)
            VALUES (:user_id, :type, :title, :message)
        ');
        $stmt->execute([
            ':user_id' => (int)$approval['requested_by'],
            ':type' => $status === 'approved' ? 'success' : 'warning',
            ':title' => 'Approval ' . ucfirst($status),
            ':message' => 'Your ' . $approval['type'] . ' request has been ' . $status,
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Approval ' . $status . ' successfully',
        ]);
        exit;
    }

    if ($method === 'DELETE') {
        $approvalId = isset($data['id']) ? intval($data['id']) : 0;
        if ($approvalId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Approval ID is required']);
            exit;
        }

        if (!$isAdmin) {
            echo json_encode(['success' => false, 'message' => 'Only admins can delete approvals']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id, type, requested_by FROM approvals WHERE id = :id');
        $stmt->execute([':id' => $approvalId]);
        $approval = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$approval) {
            echo json_encode(['success' => false, 'message' => 'Approval not found']);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM approvals WHERE id = :id');
        $stmt->execute([':id' => $approvalId]);

        $stmt = $pdo->prepare('
            INSERT INTO activities (user_id, type, description, related_id, related_type)
            VALUES (:user_id, :type, :description, :related_id, :related_type)
        ');
        $stmt->execute([
            ':user_id' => $requestUserId,
            ':type' => 'approval_requested',
            ':description' => 'deleted approval request #' . $approvalId,
            ':related_id' => $approvalId,
            ':related_type' => 'approval',
        ]);

        $stmt = $pdo->prepare('
            INSERT INTO notifications (user_id, type, title, message)
            VALUES (:user_id, :type, :title, :message)
        ');
        $stmt->execute([
            ':user_id' => (int)$approval['requested_by'],
            ':type' => 'warning',
            ':title' => 'Approval Deleted',
            ':message' => 'Your ' . $approval['type'] . ' request was deleted by an administrator',
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Approval deleted successfully',
        ]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
    ]);
}
?>