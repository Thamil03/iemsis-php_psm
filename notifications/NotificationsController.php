<?php
date_default_timezone_set('Asia/Kuala_Lumpur');
// NotificationsController.php

// Enable error reporting for debugging (disable or adjust in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set headers for JSON output and CORS
//header'Content-Type: application/json');
//header'Access-Control-Allow-Origin: http://localhost:8000');
//header'Access-Control-Allow-Credentials: true');
//header'Access-Control-Allow-Headers: Content-Type');
//header'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include the shared database connection
include_once __DIR__ . '/../db.php';

// Ensure the session cookie can be sent from your React app
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'domain'   => '157.230.245.190:3000',
    'secure'   => false,    // true if using HTTPS
    'httponly' => true,
    'samesite' => 'Lax'     // or 'None' if necessary
]);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Read raw JSON body and decode
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];

// Support POST-based method override via `_method` in JSON
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($data['_method'])) {
    $method = strtoupper($data['_method']);
} else {
    $method = $_SERVER['REQUEST_METHOD'];
}

// --- Logging helper ---
function logAction($action, $description) {
    global $conn;
    // Pull user info from session
    $user_id      = $_SESSION['user_id']     ?? 0;
    $user_name    = $_SESSION['user_name']   ?? 'System';
    $user_noBadan = $_SESSION['user_noBadan']?? '-';

    // Fallback to System if no valid user
    if ($user_id === 0) {
        $user_name    = 'System';
        $user_noBadan = '-';
    }

    $module     = 'Notifications Management';
    $created_at = date('Y-m-d H:i:s');

    $stmt = $conn->prepare("
        INSERT INTO logs (
            user_id, user_name, user_noBadan,
            action, module, description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param(
        "issssss",
        $user_id, $user_name, $user_noBadan,
        $action,  $module,    $description, $created_at
    );
    $stmt->execute();
    $stmt->close();
}

// --- Route the request ---
switch ($method) {
    case 'GET':
        fetchNotifications();
        break;
    case 'POST':
        addNotification();
        break;
    case 'PUT':
        updateNotification();
        break;
    case 'DELETE':
        deleteNotification();
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

// --- Handlers ---

function fetchNotifications() {
    global $conn;
    $sql  = "SELECT id, type, content, startTime, endTime, createdAt
             FROM notifications
             ORDER BY startTime ASC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $result = $stmt->get_result();
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    $stmt->close();
}

function addNotification() {
    global $conn, $data;
    if (!isset($data['type'], $data['content'], $data['startTime'], $data['endTime'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields"]);
        return;
    }
    $type      = $data['type'];
    $content   = $data['content'];
    $startTime = $data['startTime'];
    $endTime   = $data['endTime'];
    $createdAt = date('Y-m-d H:i:s');

    $stmt = $conn->prepare("
        INSERT INTO notifications
            (type, content, startTime, endTime, createdAt)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("sssss", $type, $content, $startTime, $endTime, $createdAt);

    if ($stmt->execute()) {
        $newId = $stmt->insert_id;
        logAction("CREATE", "Added notification ID $newId, Type: $type");
        echo json_encode(["success" => true, "id" => $newId]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
}

function updateNotification() {
    global $conn, $data;
    if (!isset($data['id'], $data['type'], $data['content'], $data['startTime'], $data['endTime'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing required fields"]);
        return;
    }
    $id        = (int)$data['id'];
    $type      = $data['type'];
    $content   = $data['content'];
    $startTime = $data['startTime'];
    $endTime   = $data['endTime'];

    // Fetch original for logging
    $orig = $conn->prepare("
        SELECT type, content, startTime, endTime
        FROM notifications
        WHERE id = ?
    ");
    $orig->bind_param("i", $id);
    $orig->execute();
    $originalData = $orig->get_result()->fetch_assoc();
    $orig->close();

    // Update
    $stmt = $conn->prepare("
        UPDATE notifications
        SET type = ?, content = ?, startTime = ?, endTime = ?
        WHERE id = ?
    ");
    $stmt->bind_param("ssssi", $type, $content, $startTime, $endTime, $id);

    if ($stmt->execute()) {
        $changes = [];
        foreach (['type','content','startTime','endTime'] as $field) {
            if ($originalData[$field] !== $data[$field]) {
                $changes[] = "$field '{$originalData[$field]}'→'{$data[$field]}'";
            }
        }
        logAction("UPDATE", "Updated notification ID $id" . (count($changes) ? " [" . implode("; ", $changes) . "]" : ""));
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
}

function deleteNotification() {
    global $conn, $data;
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing notification ID"]);
        return;
    }
    $id = (int)$data['id'];

    // Fetch for logging
    $orig = $conn->prepare("
        SELECT type, content
        FROM notifications
        WHERE id = ?
    ");
    $orig->bind_param("i", $id);
    $orig->execute();
    $originalData = $orig->get_result()->fetch_assoc();
    $orig->close();

    // Delete
    $stmt = $conn->prepare("DELETE FROM notifications WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        logAction("DELETE", "Deleted notification ID $id, Type: {$originalData['type']}, Content: {$originalData['content']}");
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
}
