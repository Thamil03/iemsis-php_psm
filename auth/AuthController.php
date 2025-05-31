<?php
// AuthController.php

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include session configuration
require_once __DIR__ . '/../config/session.php';

// Set headers for JSON output and CORS
//header'Content-Type: application/json');
header("Access-Control-Allow-Origin: http://157.230.245.190:3000");
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

$requestMethod = $_SERVER["REQUEST_METHOD"];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Logging function
function logAction($userId, $action, $module, $description) {
    global $conn;
    
    // Debug session state
    error_log("LogAction - Session ID: " . session_id());
    error_log("LogAction - Session Data: " . print_r($_SESSION, true));
    
    // Get user details from session
    $userName = $_SESSION['user_name'] ?? 'System';
    $userNoBadan = $_SESSION['user_noBadan'] ?? '-';
    
    // If userId is null (failed login), use default values
    if ($userId === null) {
        $userName = 'System';
        $userNoBadan = '-';
    }
    
    $stmt = $conn->prepare("INSERT INTO logs (user_id, user_name, user_noBadan, action, module, description) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssss", $userId, $userName, $userNoBadan, $action, $module, $description);
    $stmt->execute();
    $stmt->close();
}

switch ($requestMethod) {
    case "POST":
        $input = json_decode(file_get_contents("php://input"), true);
        
        if ($action === 'login') {
            handleLogin($input);
        } else if ($action === 'logout') {
            handleLogout();
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid action."]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed."]);
        break;
}

function handleLogin($data) {
    global $conn;
    
    if (!isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }
    
    $email = $data['email'];
    $password = $data['password'];
    
    $stmt = $conn->prepare("SELECT id, name, noBadan, role, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        if (password_verify($password, $user['password'])) {
            // Debug before setting session
            error_log("Before setting session - User data: " . print_r($user, true));
            
            // Set session variables
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['user_noBadan'] = $user['noBadan'];
            
            // Debug after setting session
            error_log("After setting session - Session data: " . print_r($_SESSION, true));
            
            // Log successful login
            logAction($user['id'], 'login', 'Authentication', 'User logged in successfully');
            
            echo json_encode([
                "success" => true,
                "user" => [
                    "id" => $user['id'],
                    "name" => $user['name'],
                    "role" => $user['role'],
                    "noBadan" => $user['noBadan']
                ]
            ]);
        } else {
            // Log failed login attempt
            logAction(null, 'login_failed', 'Authentication', 'Failed login attempt for email: ' . $email);
            
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
        }
    } else {
        // Log failed login attempt
        logAction(null, 'login_failed', 'Authentication', 'Failed login attempt for email: ' . $email);
        
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
    
    $stmt->close();
}

function handleLogout() {
    // Debug before logout
    error_log("Before logout - Session data: " . print_r($_SESSION, true));
    
    if (isset($_SESSION['user_id'])) {
        // Log logout action
        logAction($_SESSION['user_id'], 'logout', 'Authentication', 'User logged out');
        
        // Clear session data
        session_unset();
        session_destroy();
    }
    
    echo json_encode(['success' => true]);
}
?> 