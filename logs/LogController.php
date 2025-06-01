<?php
// LogController.php

// Allow cross-origin requests and set JSON header.
header("Access-Control-Allow-Origin: https://iemsweb.online");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    exit(0);
}

include_once __DIR__ . '/../db.php'; // DB connection

// Start session if not already started (for user_id)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Standard REST methods
switch ($method) {
    case 'GET':
        if ($action === 'fetch_all') {
            fetchLogs();
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid action specified"]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}

function fetchLogs() {
    global $conn;
    
    // Debug session state
    error_log("LogController - Session ID: " . session_id());
    error_log("LogController - Session Data: " . print_r($_SESSION, true));
    
    try {
        // Get pagination parameters
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $countStmt = $conn->prepare("SELECT COUNT(*) as total FROM logs");
        $countStmt->execute();
        $total = $countStmt->get_result()->fetch_assoc()['total'];
        $countStmt->close();
        
        // Updated query to join with users table
        $sql = "
            SELECT 
                l.*,
                COALESCE(l.user_name, u.name) as user_name,
                COALESCE(l.user_noBadan, u.noBadan) as user_noBadan
            FROM logs l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        // Get logs
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $logs = [];
        while ($row = $result->fetch_assoc()) {
            $logs[] = [
                'id' => $row['id'],
                'user_id' => $row['user_id'],
                'action' => $row['action'],
                'module' => $row['module'],
                'description' => $row['description'],
                'created_at' => $row['created_at'],
                'user_name' => $row['user_name'],
                'user_noBadan' => $row['user_noBadan']
            ];
        }
        
        echo json_encode([
            "success" => true,
            "logs" => $logs,
            "total" => $total,
            "page" => $page,
            "limit" => $limit,
            "totalPages" => ceil($total / $limit)
        ]);
        
        $stmt->close();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $e->getMessage()
        ]);
    }
}

// Helper function to log actions
function logAction($action, $module, $description, $equipmentData = null) {
    global $conn;
    
    // Get user details from session
    $user_id = $_SESSION['user_id'] ?? 0;
    $user_name = $_SESSION['user_name'] ?? 'System';
    $user_noBadan = $_SESSION['user_noBadan'] ?? '-';
    
    // Format description with equipment details if provided
    if ($equipmentData) {
        $equipmentInfo = [];
        if (isset($equipmentData['noResit'])) {
            $equipmentInfo[] = "No. Resit: " . $equipmentData['noResit'];
        }
        if (isset($equipmentData['deviceName'])) {
            $equipmentInfo[] = "Device: " . $equipmentData['deviceName'];
        }
        if (isset($equipmentData['status'])) {
            $equipmentInfo[] = "Status: " . $equipmentData['status'];
        }
        
        if (!empty($equipmentInfo)) {
            $description .= " [" . implode(", ", $equipmentInfo) . "]";
        }
    }
    
    // Insert log with user details
    $stmt = $conn->prepare("
        INSERT INTO logs (user_id, user_name, user_noBadan, action, module, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param("isssss", $user_id, $user_name, $user_noBadan, $action, $module, $description);
    $stmt->execute();
    $stmt->close();
}
?> 