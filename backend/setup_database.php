<?php
// Database Setup Script
// Run this file directly in your browser: http://localhost:8000/setup_database.php

require_once 'config.php';

echo "<h1>FlowStone Database Setup</h1>";
echo "<pre>";

try {
    // Read the SQL file
    $sqlFile = __DIR__ . '/full_schema.sql';
    
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    
    // Split SQL commands (basic splitting by semicolons)
    $commands = array_filter(
        array_map('trim', explode(';', $sql)),
        function($cmd) {
            return !empty($cmd) && strpos($cmd, '--') !== 0;
        }
    );
    
    echo "Found " . count($commands) . " SQL commands to execute.\n\n";
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($commands as $index => $command) {
        if (empty(trim($command))) continue;
        
        try {
            $pdo->exec($command);
            $successCount++;
            
            // Show progress for important operations
            if (stripos($command, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $command, $matches);
                $tableName = $matches[1] ?? 'unknown';
                echo "✓ Created table: $tableName\n";
            } elseif (stripos($command, 'DELETE FROM') !== false) {
                preg_match('/DELETE FROM `?(\w+)`?/i', $command, $matches);
                $tableName = $matches[1] ?? 'unknown';
                echo "✓ Cleared table: $tableName\n";
            } elseif (stripos($command, 'INSERT INTO') !== false) {
                preg_match('/INSERT INTO `?(\w+)`?/i', $command, $matches);
                $tableName = $matches[1] ?? 'unknown';
                echo "✓ Inserted data into: $tableName\n";
            } elseif (stripos($command, 'ALTER TABLE') !== false) {
                preg_match('/ALTER TABLE `?(\w+)`?/i', $command, $matches);
                $tableName = $matches[1] ?? 'unknown';
                echo "✓ Altered table: $tableName\n";
            }
        } catch (PDOException $e) {
            $errorCount++;
            // Only show errors that are not "table already exists" or "duplicate entry"
            if (strpos($e->getMessage(), 'already exists') === false && 
                strpos($e->getMessage(), 'Duplicate entry') === false) {
                echo "✗ Error: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n";
    echo "========================================\n";
    echo "Database Setup Complete!\n";
    echo "========================================\n";
    echo "Successful operations: $successCount\n";
    echo "Errors (non-critical): $errorCount\n\n";
    
    // Verify tables
    echo "Verifying tables...\n";
    $tables = ['users', 'tasks', 'task_comments', 'task_attachments', 'approvals', 
               'resources', 'notifications', 'activities'];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            $countStmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $count = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "✓ Table '$table' exists with $count records\n";
        } else {
            echo "✗ Table '$table' NOT FOUND\n";
        }
    }
    
    echo "\n";
    echo "========================================\n";
    echo "Setup successful! You can now use the application.\n";
    echo "========================================\n\n";
    
    echo "Default login credentials:\n";
    echo "Email: admin@flowstone.com\n";
    echo "Password: password123\n\n";
    
    echo "Other test users:\n";
    echo "- sarah@flowstone.com (password123)\n";
    echo "- mike@flowstone.com (password123)\n";
    echo "- emily@flowstone.com (password123)\n";
    echo "- david@flowstone.com (password123)\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "</pre>";
echo "<p><a href='/'>← Back to Application</a></p>";
?>
