<?php
require_once 'config.php';

echo "Creating Tasks Management Schema\n";
echo "=================================\n\n";

try {
    // Read and execute SQL file
    $sql = file_get_contents('tasks_schema.sql');
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement) || substr($statement, 0, 2) === '--') {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            // Get first 60 chars for display
            $preview = substr(str_replace("\n", " ", $statement), 0, 60);
            echo "✓ Executed: $preview...\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate') === false) {
                echo "⚠ Warning: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n✓ Tasks schema created successfully!\n\n";
    
    // Verify the tables
    $stmt = $pdo->query("SHOW TABLES LIKE 'tasks'");
    if ($stmt->rowCount() > 0) {
        echo "Tables created:\n";
        echo "  - tasks\n";
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM tasks");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "  - Sample tasks: {$result['count']}\n";
    }
    
    $stmt = $pdo->query("SHOW TABLES LIKE 'task_comments'");
    if ($stmt->rowCount() > 0) {
        echo "  - task_comments\n";
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM task_comments");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "  - Sample comments: {$result['count']}\n";
    }
    
    $stmt = $pdo->query("SHOW TABLES LIKE 'task_attachments'");
    if ($stmt->rowCount() > 0) {
        echo "  - task_attachments\n";
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM task_attachments");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "  - Sample attachments: {$result['count']}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>