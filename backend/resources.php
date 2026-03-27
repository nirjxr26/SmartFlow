<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Get user ID from token
$headers = getallheaders();
$token = $headers['Authorization'] ?? '';
$user_id = 1; // Default for now, should decode from token

try {
    if ($method === 'GET') {
        // Get resources list
        $type = $_GET['type'] ?? 'all';
        $status = $_GET['status'] ?? 'all';
        $search = $_GET['search'] ?? '';
        
        $sql = "
            SELECT 
                r.id,
                r.name,
                r.type,
                r.status,
                r.location,
                r.description,
                u.name as assigned_to_name
            FROM resources r
            LEFT JOIN users u ON r.assigned_to = u.id
            WHERE 1=1
        ";
        
        $params = [];
        
        if ($type !== 'all') {
            $sql .= " AND r.type = :type";
            $params[':type'] = $type;
        }
        
        if ($status !== 'all') {
            $sql .= " AND r.status = :status";
            $params[':status'] = $status;
        }
        
        if (!empty($search)) {
            $sql .= " AND r.name LIKE :search";
            $params[':search'] = "%$search%";
        }
        
        $sql .= " ORDER BY r.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format resources
        $formattedResources = [];
        foreach ($resources as $resource) {
            $formattedResources[] = [
                'id' => (int)$resource['id'],
                'name' => $resource['name'],
                'type' => $resource['type'],
                'status' => $resource['status'],
                'location' => $resource['location'],
                'description' => $resource['description'],
                'assignedTo' => $resource['assigned_to_name'] ? ['name' => $resource['assigned_to_name']] : null
            ];
        }
        
        echo json_encode([
            'success' => true,
            'resources' => $formattedResources
        ]);
        
    } elseif ($method === 'POST') {
        // Create new resource or assign/unassign resource
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (isset($data['action'])) {
            // Assign or release resource
            $action = $data['action'];
            $resourceId = $data['id'] ?? 0;
            
            if ($action === 'assign') {
                $assignToId = $data['assignTo'] ?? $user_id;
                
                $stmt = $pdo->prepare("
                    UPDATE resources 
                    SET status = 'assigned', assigned_to = :assigned_to
                    WHERE id = :id AND status = 'available'
                ");
                
                $stmt->execute([
                    ':assigned_to' => $assignToId,
                    ':id' => $resourceId
                ]);
                
                if ($stmt->rowCount() > 0) {
                    // Get resource name
                    $stmt = $pdo->prepare("SELECT name FROM resources WHERE id = :id");
                    $stmt->execute([':id' => $resourceId]);
                    $resourceName = $stmt->fetch(PDO::FETCH_ASSOC)['name'];
                    
                    // Log activity
                    $stmt = $pdo->prepare("
                        INSERT INTO activities (user_id, type, description, related_id, related_type)
                        VALUES (:user_id, 'resource_booked', :description, :resource_id, 'resource')
                    ");
                    $stmt->execute([
                        ':user_id' => $user_id,
                        ':description' => "booked $resourceName",
                        ':resource_id' => $resourceId
                    ]);
                    
                    // Create notification
                    $stmt = $pdo->prepare("
                        INSERT INTO notifications (user_id, type, title, message)
                        VALUES (:user_id, 'success', 'Resource Assigned', :message)
                    ");
                    $stmt->execute([
                        ':user_id' => $assignToId,
                        ':message' => "$resourceName has been assigned to you"
                    ]);
                    
                    echo json_encode(['success' => true, 'message' => 'Resource assigned successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Resource not available']);
                }
                
            } elseif ($action === 'release') {
                $stmt = $pdo->prepare("
                    UPDATE resources 
                    SET status = 'available', assigned_to = NULL
                    WHERE id = :id
                ");
                
                $stmt->execute([':id' => $resourceId]);
                
                echo json_encode(['success' => true, 'message' => 'Resource released successfully']);
                
            } elseif ($action === 'maintenance') {
                $stmt = $pdo->prepare("
                    UPDATE resources 
                    SET status = 'maintenance', assigned_to = NULL
                    WHERE id = :id
                ");
                
                $stmt->execute([':id' => $resourceId]);
                
                echo json_encode(['success' => true, 'message' => 'Resource marked for maintenance']);
            }
            
        } else {
            // Create new resource
            $name = $data['name'] ?? '';
            $type = $data['type'] ?? '';
            $location = $data['location'] ?? '';
            $description = $data['description'] ?? '';
            
            if (empty($name) || empty($type)) {
                echo json_encode(['success' => false, 'message' => 'Name and type are required']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO resources (name, type, status, location, description)
                VALUES (:name, :type, 'available', :location, :description)
            ");
            
            $stmt->execute([
                ':name' => $name,
                ':type' => $type,
                ':location' => $location,
                ':description' => $description
            ]);
            
            $resourceId = $pdo->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Resource created successfully',
                'id' => $resourceId
            ]);
        }
        
    } elseif ($method === 'DELETE') {
        // Delete resource
        $data = json_decode(file_get_contents('php://input'), true);
        $resourceId = $data['id'] ?? 0;
        
        if (!$resourceId) {
            echo json_encode(['success' => false, 'message' => 'Resource ID required']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM resources WHERE id = :id");
        $stmt->execute([':id' => $resourceId]);
        
        echo json_encode(['success' => true, 'message' => 'Resource deleted successfully']);
        
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
