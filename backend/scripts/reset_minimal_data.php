<?php
require_once __DIR__ . '/../config.php';

if (php_sapi_name() !== 'cli') {
    echo "Run from CLI: php backend/scripts/reset_minimal_data.php\n";
    exit(1);
}

$email = 'admin@flowstone.com';
$passwordPlain = 'password123';
$passwordHash = password_hash($passwordPlain, PASSWORD_DEFAULT);

try {
    // Clear data in FK-safe order.
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    $pdo->exec('TRUNCATE TABLE activities');
    $pdo->exec('TRUNCATE TABLE notifications');
    $pdo->exec('TRUNCATE TABLE task_attachments');
    $pdo->exec('TRUNCATE TABLE task_comments');
    $pdo->exec('TRUNCATE TABLE tasks');
    $pdo->exec('TRUNCATE TABLE approvals');
    $pdo->exec('TRUNCATE TABLE resources');
    $pdo->exec('TRUNCATE TABLE users');
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

    // Keep only a tiny baseline dataset.
    $userStmt = $pdo->prepare('INSERT INTO users (email, password, name, role, department) VALUES (?, ?, ?, ?, ?)');
    $userStmt->execute([$email, $passwordHash, 'Admin User', 'Administrator', 'Management']);
    $adminId = (int) $pdo->lastInsertId();

    $userStmt->execute(['member@flowstone.com', $passwordHash, 'Team Member', 'Member', 'Operations']);
    $memberId = (int) $pdo->lastInsertId();

    $taskStmt = $pdo->prepare(
        'INSERT INTO tasks (title, description, status, priority, assignee_id, created_by, deadline)
         VALUES (?, ?, ?, ?, ?, ?, ?)' 
    );
    $taskStmt->execute([
        'Review onboarding checklist',
        'Validate and update onboarding steps for new hires.',
        'pending',
        'medium',
        $memberId,
        $adminId,
        date('Y-m-d', strtotime('+5 days')),
    ]);
    $task1Id = (int) $pdo->lastInsertId();

    $taskStmt->execute([
        'Prepare weekly status report',
        'Create summary report for current sprint progress.',
        'in-progress',
        'high',
        $adminId,
        $adminId,
        date('Y-m-d', strtotime('+2 days')),
    ]);

    $approvalStmt = $pdo->prepare(
        'INSERT INTO approvals (type, requested_by, department, description, status)
         VALUES (?, ?, ?, ?, ?)' 
    );
    $approvalStmt->execute(['Budget Request', $memberId, 'Operations', 'Request for basic tool subscription renewal.', 'pending']);

    $resourceStmt = $pdo->prepare(
        'INSERT INTO resources (name, type, status, assigned_to, location, description)
         VALUES (?, ?, ?, ?, ?, ?)' 
    );
    $resourceStmt->execute(['Meeting Room A', 'room', 'available', null, 'Floor 2', 'Small collaboration room']);
    $resourceStmt->execute(['Dell Latitude', 'device', 'assigned', $memberId, 'IT Desk', 'Team laptop']);

    $notificationStmt = $pdo->prepare(
        'INSERT INTO notifications (user_id, type, title, message, is_read)
         VALUES (?, ?, ?, ?, ?)' 
    );
    $notificationStmt->execute([$adminId, 'info', 'Welcome', 'Minimal dataset has been applied.', 0]);

    $activityStmt = $pdo->prepare(
        'INSERT INTO activities (user_id, type, description, related_id, related_type)
         VALUES (?, ?, ?, ?, ?)' 
    );
    $activityStmt->execute([$adminId, 'task_assigned', 'assigned Review onboarding checklist to Team Member', $task1Id, 'task']);

    echo "Minimal data reset complete.\n";
    echo "Login credentials:\n";
    echo "Email: {$email}\n";
    echo "Password: {$passwordPlain}\n";
} catch (Throwable $e) {
    try {
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    } catch (Throwable $ignored) {
    }

    echo 'Failed to reset minimal data: ' . $e->getMessage() . "\n";
    exit(1);
}
