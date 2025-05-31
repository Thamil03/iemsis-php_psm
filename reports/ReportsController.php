// ReportsController.php

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include session configuration
require_once __DIR__ . '../config/session.php';

// Set headers for JSON output and CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: 157.230.245.190:3000');
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . 'db.php'; // DB connection

// Logging function
function logAction($action, $description) {
    global $conn;
    
    // Debug session state
    error_log("ReportsController - Session ID: " . session_id());
    error_log("ReportsController - Session Data: " . print_r($_SESSION, true));
    
    // Get user details from session
    $user_id = $_SESSION['user_id'] ?? 0;
    $user_name = $_SESSION['user_name'] ?? 'System';
    $user_noBadan = $_SESSION['user_noBadan'] ?? '-';
    
    // If user_id is 0 (not logged in), use default values
    if ($user_id === 0) {
        $user_name = 'System';
        $user_noBadan = '-';
    }
    
    // Debug user details
    error_log("ReportsController - User ID: $user_id, Name: $user_name, No. Badan: $user_noBadan");
    
    // Set module name
    $module = 'Reports Management';
    
    // Current timestamp
    $created_at = date('Y-m-d H:i:s');
    
    $stmt = $conn->prepare("INSERT INTO logs (user_id, user_name, user_noBadan, action, module, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issssss", $user_id, $user_name, $user_noBadan, $action, $module, $description, $created_at);
    $stmt->execute();
    $stmt->close();
}

function addReport() {
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields
    if (!isset($data['title'], $data['content'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields"]);
        return;
    }
    
    $title = $data['title'];
    $content = $data['content'];
    $created_at = date('Y-m-d H:i:s');
    
    $stmt = $conn->prepare("INSERT INTO reports (title, content, created_at) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $title, $content, $created_at);
    
    if ($stmt->execute()) {
        $reportId = $stmt->insert_id;
        logAction("CREATE", "Added report: ID $reportId, Title: $title");
        echo json_encode(["success" => true, "id" => $reportId]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
}

function updateReport() {
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['id'], $data['title'], $data['content'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields"]);
        return;
    }
    
    $id = $data['id'];
    $title = $data['title'];
    $content = $data['content'];
    
    // Get original data for logging
    $orig = $conn->prepare("SELECT title, content FROM reports WHERE id = ?");
    $orig->bind_param("i", $id);
    $orig->execute();
    $originalData = $orig->get_result()->fetch_assoc();
    $orig->close();
    
    $stmt = $conn->prepare("UPDATE reports SET title = ?, content = ? WHERE id = ?");
    $stmt->bind_param("ssi", $title, $content, $id);
    
    if ($stmt->execute()) {
        $changes = [];
        if ($originalData['title'] !== $title) {
            $changes[] = "title:'{$originalData['title']}'→'$title'";
        }
        if ($originalData['content'] !== $content) {
            $changes[] = "content changed";
        }
        
        logAction("UPDATE", "Updated report ID $id" . (!empty($changes) ? " [" . implode("; ", $changes) . "]" : ""));
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
}

function deleteReport() {
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing report ID"]);
        return;
    }
    
    $id = $data['id'];
    
    // Get report details for logging
    $orig = $conn->prepare("SELECT title FROM reports WHERE id = ?");
    $orig->bind_param("i", $id);
    $orig->execute();
    $originalData = $orig->get_result()->fetch_assoc();
    $orig->close();
    
    $stmt = $conn->prepare("DELETE FROM reports WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        logAction("DELETE", "Deleted report ID $id, Title: {$originalData['title']}");
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
} 