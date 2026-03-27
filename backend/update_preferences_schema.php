<?php
require_once 'config.php';

try {
    // Add preferences column to users table
    $sql = "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSON DEFAULT NULL";
    $pdo->exec($sql);
    
    echo "✓ Successfully added preferences column to users table\n";
    
    // Set default preferences for existing users
    $sql = "UPDATE users SET preferences = :default_prefs WHERE preferences IS NULL";
    $stmt = $pdo->prepare($sql);
    $defaultPreferences = json_encode([
        'emailNotifications' => true,
        'taskReminders' => true,
        'approvalRequests' => true,
        'systemUpdates' => false,
        'theme' => 'light'
    ]);
    $stmt->execute([':default_prefs' => $defaultPreferences]);
    
    echo "✓ Set default preferences for existing users\n";
    echo "\nDatabase schema updated successfully!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
