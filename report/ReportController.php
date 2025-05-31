// Set headers for JSON output and CORS
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://152.42.242.10");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include the shared database connection
include_once __DIR__ . '/../db.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Logging function
function logAction($action, $description) {
    global $conn;
    
    // Get user details from session
    $user_id = $_SESSION['user_id'] ?? 0;
    $user_name = $_SESSION['user_name'] ?? 'System';
    $user_noBadan = $_SESSION['user_noBadan'] ?? '-';
    
    // Set module name
    $module = 'Report';
    
    // Current timestamp
    $created_at = date('Y-m-d H:i:s');
    
    $stmt = $conn->prepare("INSERT INTO logs (user_id, user_name, user_noBadan, action, module, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issssss", $user_id, $user_name, $user_noBadan, $action, $module, $description, $created_at);
    $stmt->execute();
    $stmt->close();
}

// Function to add new report
function addReport($data) {
    global $conn;
    
    // Validate required fields
    if (!isset($data['title'], $data['content'], $data['type'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields."]);
        return;
    }
    
    $stmt = $conn->prepare("INSERT INTO reports (title, content, type, created_at) VALUES (?, ?, ?, NOW())");
    $stmt->bind_param("sss", $data['title'], $data['content'], $data['type']);
    
    if ($stmt->execute()) {
        $newId = $stmt->insert_id;
        
        // Log the creation
        $logDesc = "Created new report - ID: $newId, Title: {$data['title']}, Type: {$data['type']}";
        logAction("CREATE", $logDesc);
        
        echo json_encode(["success" => true, "id" => $newId]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $stmt->error]);
    }
    $stmt->close();
}

// Function to update report
function updateReport($data) {
    global $conn;
    
    if (!isset($data['id'], $data['title'], $data['content'], $data['type'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields."]);
        return;
    }
    
    // Get original data for logging
    $originalStmt = $conn->prepare("SELECT title, content, type FROM reports WHERE id = ?");
    $originalStmt->bind_param("i", $data['id']);
    $originalStmt->execute();
    $originalResult = $originalStmt->get_result();
    $originalData = $originalResult->fetch_assoc();
    $originalStmt->close();
    
    $stmt = $conn->prepare("UPDATE reports SET title = ?, content = ?, type = ?, updated_at = NOW() WHERE id = ?");
    $stmt->bind_param("sssi", $data['title'], $data['content'], $data['type'], $data['id']);
    
    if ($stmt->execute()) {
        // Prepare changes for logging
        $changes = [];
        if ($originalData['title'] != $data['title']) {
            $changes[] = "title: '{$originalData['title']}' to '{$data['title']}'";
        }
        if ($originalData['type'] != $data['type']) {
            $changes[] = "type: '{$originalData['type']}' to '{$data['type']}'";
        }
        
        // Log the update
        $logDesc = "Updated report ID: {$data['id']}";
        if (!empty($changes)) {
            $logDesc .= " - Changes: " . implode("; ", $changes);
        }
        logAction("UPDATE", $logDesc);
        
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $stmt->error]);
    }
    $stmt->close();
}

// Function to delete report
function deleteReport($data) {
    global $conn;
    
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing report ID."]);
        return;
    }
    
    // Get report info for logging
    $reportStmt = $conn->prepare("SELECT title, type FROM reports WHERE id = ?");
    $reportStmt->bind_param("i", $data['id']);
    $reportStmt->execute();
    $reportResult = $reportStmt->get_result();
    $reportData = $reportResult->fetch_assoc();
    $reportStmt->close();
    
    $stmt = $conn->prepare("DELETE FROM reports WHERE id = ?");
    $stmt->bind_param("i", $data['id']);
    
    if ($stmt->execute()) {
        // Log the deletion
        $logDesc = "Deleted report - ID: {$data['id']}, Title: {$reportData['title']}, Type: {$reportData['type']}";
        logAction("DELETE", $logDesc);
        
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $stmt->error]);
    }
    $stmt->close();
} 