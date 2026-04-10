<?php
require_once __DIR__ . '/../config.php';

$email = 'admin@flowstone.com';
$passwordPlain = 'password123';
$name = 'Admin User';
$passwordHash = password_hash($passwordPlain, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare(
        "INSERT INTO users (email, password, name) VALUES (?, ?, ?)\n         ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name)"
    );

    $stmt->execute([$email, $passwordHash, $name]);

    echo "Admin credentials are set.\n";
    echo "Email: {$email}\n";
    echo "Password: {$passwordPlain}\n";
} catch (Throwable $e) {
    echo 'Failed to set admin credentials: ' . $e->getMessage() . "\n";
    exit(1);
}
