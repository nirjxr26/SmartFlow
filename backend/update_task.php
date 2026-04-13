<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'Task ID is required']);
    exit;
}

$taskId = intval($data['id']);
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

    // Check if task exists and who owns it.
    $stmt = $pdo->prepare("SELECT id, title, created_by, assignee_id, status FROM tasks WHERE id = ?");
    $stmt->execute([$taskId]);
    $existingTask = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$existingTask) {
        echo json_encode(['success' => false, 'message' => 'Task not found']);
        exit;
    }

    $isAdmin = flowstone_is_admin_role($user['role'] ?? null);
    $isOwner = (int)$existingTask['created_by'] === $userId;

    if (!$isAdmin && !$isOwner) {
        echo json_encode(['success' => false, 'message' => 'You can only update your own tasks']);
        exit;
    }

    // Build update query dynamically.
    $updateFields = [];
    $params = [];

    if (isset($data['title']) && !empty(trim($data['title']))) {
        $updateFields[] = "title = ?";
        $params[] = trim($data['title']);
    }

    if (isset($data['description'])) {
        $updateFields[] = "description = ?";
        $params[] = !empty(trim($data['description'])) ? trim($data['description']) : null;
    }

    if (isset($data['status']) && in_array($data['status'], ['pending', 'in-progress', 'review', 'completed'])) {
        $updateFields[] = "status = ?";
        $params[] = $data['status'];
    }

    if (isset($data['priority']) && in_array($data['priority'], ['low', 'medium', 'high'])) {
        $updateFields[] = "priority = ?";
        $params[] = $data['priority'];
    }

    if (isset($data['assignee_id'])) {
        $updateFields[] = "assignee_id = ?";
        $params[] = $data['assignee_id'] ? intval($data['assignee_id']) : null;
    }

    if (isset($data['deadline'])) {
        if (!empty($data['deadline'])) {
            $deadlineObj = DateTime::createFromFormat('Y-m-d', $data['deadline']);
            if (!$deadlineObj) {
                echo json_encode(['success' => false, 'message' => 'Invalid deadline format. Use YYYY-MM-DD']);
                exit;
            }
            $updateFields[] = "deadline = ?";
            $params[] = $data['deadline'];
        } else {
            $updateFields[] = "deadline = NULL";
        }
    }

    if (empty($updateFields)) {
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }

    // Execute update.
    $sql = "UPDATE tasks SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $params[] = $taskId;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Fetch updated task.
    $stmt = $pdo->prepare("\n        SELECT 
            t.id,
            t.title,
            t.description,
            t.status,
            t.priority,
            t.deadline,
            t.created_at,
            t.updated_at,
            t.created_by,
            t.assignee_id,
            u.name as assignee_name,
            u.email as assignee_email,
            creator.name as created_by_name,
            (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comments_count,
            (SELECT COUNT(*) FROM task_attachments WHERE task_id = t.id) as attachments_count
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN users creator ON t.created_by = creator.id
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($isAdmin) {
        $notifyStmt = $pdo->prepare("\n            INSERT INTO notifications (user_id, type, title, message)
            VALUES (:user_id, :type, :title, :message)
        ");

        $newAssigneeId = (int)($task['assignee_id'] ?? 0);
        $oldAssigneeId = (int)($existingTask['assignee_id'] ?? 0);
        $creatorId = (int)$task['created_by'];
        $taskTitle = $task['title'];

        $baseRecipients = array_unique(array_filter([$creatorId, $newAssigneeId]));
        foreach ($baseRecipients as $recipientId) {
            if ($recipientId === $userId) {
                continue;
            }

            $notifyStmt->execute([
                ':user_id' => $recipientId,
                ':type' => 'info',
                ':title' => 'Task Updated',
                ':message' => 'Task "' . $taskTitle . '" was updated by an administrator',
            ]);
        }

        if ($newAssigneeId > 0 && $newAssigneeId !== $oldAssigneeId && $newAssigneeId !== $userId) {
            $notifyStmt->execute([
                ':user_id' => $newAssigneeId,
                ':type' => 'success',
                ':title' => 'Task Assigned',
                ':message' => 'You were assigned to task: ' . $taskTitle,
            ]);
        }

        if ($oldAssigneeId > 0 && $oldAssigneeId !== $newAssigneeId && $oldAssigneeId !== $userId) {
            $notifyStmt->execute([
                ':user_id' => $oldAssigneeId,
                ':type' => 'warning',
                ':title' => 'Task Unassigned',
                ':message' => 'You were unassigned from task: ' . $taskTitle,
            ]);
        }
    }

    $response = [
        'id' => (int)$task['id'],
        'title' => $task['title'],
        'description' => $task['description'],
        'status' => $task['status'],
        'priority' => $task['priority'],
        'assignee' => [
            'name' => $task['assignee_name'] ?? 'Unassigned',
            'email' => $task['assignee_email'] ?? null
        ],
        'createdBy' => $task['created_by_name'],
        'deadline' => $task['deadline'] ? date('M d, Y', strtotime($task['deadline'])) : null,
        'createdAt' => date('M d, Y', strtotime($task['created_at'])),
        'updatedAt' => date('M d, Y', strtotime($task['updated_at'])),
        'comments' => (int)$task['comments_count'],
        'attachments' => (int)$task['attachments_count']
    ];

    echo json_encode([
        'success' => true,
        'message' => 'Task updated successfully',
        'task' => $response
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>