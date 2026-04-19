<?php
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
}

function flowstone_execute_sql_file(PDO $pdo, string $sqlFile): void
{
    $sqlLines = file($sqlFile, FILE_IGNORE_NEW_LINES);

    if ($sqlLines === false) {
        throw new RuntimeException('Unable to read schema file: ' . $sqlFile);
    }

    $sql = implode("\n", array_filter($sqlLines, function ($line) {
        $trimmedLine = ltrim($line);

        if ($trimmedLine === '') {
            return false;
        }

        if (substr($trimmedLine, 0, 2) === '--') {
            return false;
        }

        if (substr($trimmedLine, 0, 1) === '#') {
            return false;
        }

        return true;
    }));

    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function ($statement) {
            return $statement !== '';
        }
    );

    foreach ($statements as $statement) {
        $pdo->exec($statement);
    }
}

function flowstone_bootstrap_schema(PDO $pdo): void
{
    $requiredTables = [
        'users',
        'tasks',
        'task_comments',
        'task_attachments',
        'approvals',
        'resources',
        'notifications',
        'activities',
    ];

    $missingTables = [];

    foreach ($requiredTables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '" . str_replace("'", "''", $table) . "'");

        if (!$stmt || $stmt->rowCount() === 0) {
            $missingTables[] = $table;
        }
    }

    if (!empty($missingTables)) {
        $schemaFile = __DIR__ . '/full_schema.sql';

        if (!file_exists($schemaFile)) {
            throw new RuntimeException('Schema file not found: ' . $schemaFile);
        }

        flowstone_execute_sql_file($pdo, $schemaFile);
    }
}

function flowstone_fetch_user(PDO $pdo, int $userId): ?array
{
    if ($userId <= 0) {
        return null;
    }

    $stmt = $pdo->prepare("SELECT id, email, name, role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    return $user ?: null;
}

function flowstone_is_admin_role(?string $role): bool
{
    return $role !== null && stripos($role, 'admin') !== false;
}

function flowstone_can_manage_users_role(?string $role): bool
{
    if ($role === null) {
        return false;
    }

    $normalizedRole = strtolower(trim($role));
    if ($normalizedRole === '') {
        return false;
    }

    return strpos($normalizedRole, 'admin') !== false
        || strpos($normalizedRole, 'hr') !== false
        || strpos($normalizedRole, 'human resources') !== false
        || strpos($normalizedRole, 'executive') !== false;
}

function flowstone_fetch_task_owner(PDO $pdo, int $taskId): ?array
{
    if ($taskId <= 0) {
        return null;
    }

    $stmt = $pdo->prepare("SELECT id, created_by FROM tasks WHERE id = ?");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    return $task ?: null;
}

// Load .env file if available
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines !== false) {
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0 || strpos($line, '=') === false) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            if (!array_key_exists($key, $_ENV)) {
                $_ENV[$key] = $value;
                putenv("{$key}={$value}");
            }
        }
    }
}

try {
    // Load database credentials from .env
    $host = getenv('DB_HOST') ?: 'localhost';
    $dbname = getenv('DB_NAME') ?: 'flowstone_db';
    $username = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASS') ?: '';
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    flowstone_bootstrap_schema($pdo);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
} catch (RuntimeException $e) {
    echo json_encode(['success' => false, 'message' => 'Database initialization failed: ' . $e->getMessage()]);
    exit;
}
?>