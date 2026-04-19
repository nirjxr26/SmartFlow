<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['GET', 'POST', 'DELETE'], true)) {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    $data = [];
    $requestUserId = 0;
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

    $canManageUsers = flowstone_can_manage_users_role($requestUser['role'] ?? null);

    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT id, name, email, role, department FROM users ORDER BY name ASC");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'users' => $users,
            'permissions' => [
                'canManageUsers' => flowstone_can_manage_users_role($requestUser['role'] ?? null),
            ],
        ]);
        exit;
    }

    if (!$canManageUsers) {
        echo json_encode(['success' => false, 'message' => 'Only admin, HR, or executive roles can manage users']);
        exit;
    }

    if ($method === 'POST') {
        $email = isset($data['email']) ? trim((string)$data['email']) : '';
        $name = isset($data['name']) ? trim((string)$data['name']) : '';
        $password = isset($data['password']) ? (string)$data['password'] : '';
        $role = isset($data['role']) ? trim((string)$data['role']) : null;
        $department = isset($data['department']) ? trim((string)$data['department']) : null;

        if ($email === '' || $name === '' || $password === '') {
            echo json_encode(['success' => false, 'message' => 'Name, email, and password are required']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Invalid email format']);
            exit;
        }

        if (strlen($password) < 6) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode(['success' => false, 'message' => 'Email already exists']);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO users (email, password, name, role, department) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([
            $email,
            $hashedPassword,
            $name,
            ($role !== null && $role !== '') ? $role : 'User',
            ($department !== null && $department !== '') ? $department : null,
        ]);

        $newUserId = (int)$pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'User created successfully',
            'user' => [
                'id' => $newUserId,
                'name' => $name,
                'email' => $email,
                'role' => ($role !== null && $role !== '') ? $role : 'User',
                'department' => ($department !== null && $department !== '') ? $department : null,
            ],
        ]);
        exit;
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        $updateUserId = isset($data['id']) ? intval($data['id']) : 0;
        $email = isset($data['email']) ? trim((string)$data['email']) : '';
        $name = isset($data['name']) ? trim((string)$data['name']) : '';
        $password = isset($data['password']) ? (string)$data['password'] : '';
        $role = isset($data['role']) ? trim((string)$data['role']) : '';
        $department = isset($data['department']) ? trim((string)$data['department']) : '';

        if ($updateUserId <= 0) {
            echo json_encode(['success' => false, 'message' => 'User ID is required for update']);
            exit;
        }

        if ($email === '' || $name === '') {
            echo json_encode(['success' => false, 'message' => 'Name and email are required']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Invalid email format']);
            exit;
        }

        if ($password !== '' && strlen($password) < 6) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
        $stmt->execute([$updateUserId]);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
        $stmt->execute([$email, $updateUserId]);
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode(['success' => false, 'message' => 'Email already exists']);
            exit;
        }

        $updateFields = [
            'email = ?',
            'name = ?',
            'role = ?',
            'department = ?',
        ];
        $params = [
            $email,
            $name,
            $role !== '' ? $role : 'User',
            $department !== '' ? $department : null,
        ];

        if ($password !== '') {
            $updateFields[] = 'password = ?';
            $params[] = password_hash($password, PASSWORD_DEFAULT);
        }

        $params[] = $updateUserId;

        $sql = 'UPDATE users SET ' . implode(', ', $updateFields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare('SELECT id, name, email, role, department FROM users WHERE id = ?');
        $stmt->execute([$updateUserId]);
        $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'message' => 'User updated successfully',
            'user' => $updatedUser,
        ]);
        exit;
    }

    $deleteUserId = isset($data['id']) ? intval($data['id']) : 0;
    if ($deleteUserId <= 0) {
        echo json_encode(['success' => false, 'message' => 'User ID is required for deletion']);
        exit;
    }

    if ($deleteUserId === $requestUserId) {
        echo json_encode(['success' => false, 'message' => 'You cannot delete your own account']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id, name, email FROM users WHERE id = ?');
    $stmt->execute([$deleteUserId]);
    $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$targetUser) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$deleteUserId]);

    echo json_encode([
        'success' => true,
        'message' => 'User deleted successfully',
        'deletedUser' => [
            'id' => (int)$targetUser['id'],
            'name' => $targetUser['name'],
            'email' => $targetUser['email'],
        ],
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
