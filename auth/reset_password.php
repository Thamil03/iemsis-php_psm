<?php
session_start();
include('../db.php');

header('Access-Control-Allow-Origin: 157.230.245.190:3000');
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['token']) || !isset($data['new_password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing token or new password", "success" => false]);
    exit;
}

$token = $data['token'];
$newPassword = password_hash($data['new_password'], PASSWORD_DEFAULT);
$now = date("Y-m-d H:i:s");
$isFirstLogin = isset($data['is_first_login']) && $data['is_first_login'];

// First check if this is a first login scenario
if ($isFirstLogin && isset($_SESSION['user_id']) && isset($_SESSION['password_reset_required'])) {
    $userId = $_SESSION['user_id'];
    
    // Verify the token matches what we have for this user
    $stmt = $conn->prepare("SELECT id FROM users WHERE id = ? AND reset_token = ? AND reset_token_expiry > ?");
    $stmt->bind_param("iss", $userId, $token, $now);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        // Valid token, update password and clear token
        $updateStmt = $conn->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?");
        $updateStmt->bind_param("si", $newPassword, $userId);
        $updateStmt->execute();
        
        // Clear the password reset requirement
        unset($_SESSION['password_reset_required']);
        
        echo json_encode([
            "success" => true,
            "message" => "Password has been reset successfully."
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Invalid or expired token for first login"
        ]);
    }
} else {
    // Regular token verification (non-first login)
    $stmt = $conn->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > ?");
    $stmt->bind_param("ss", $token, $now);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        // Update password and clear token
        $updateStmt = $conn->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?");
        $updateStmt->bind_param("si", $newPassword, $row['id']);
        $updateStmt->execute();

        echo json_encode([
            "success" => true,
            "message" => "Password has been reset successfully."
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Invalid or expired token"
        ]);
    }
}
?>