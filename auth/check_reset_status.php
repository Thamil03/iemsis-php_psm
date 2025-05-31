<?php
session_start();
include('../db.php');

header("Access-Control-Allow-Origin: http://152.42.242.10");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

// Check if there's an active session requiring password reset
if (!isset($_SESSION['user_id']) || !isset($_SESSION['password_reset_required'])) {
    echo json_encode([
        "reset_required" => false
    ]);
    exit;
}

// Get the user's reset token from the database
$userId = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT reset_token, reset_token_expiry FROM users WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if ($user && $user['reset_token'] && strtotime($user['reset_token_expiry']) > time()) {
    // Valid token exists
    echo json_encode([
        "reset_required" => true,
        "reset_token" => $user['reset_token']
    ]);
} else {
    // No valid token
    echo json_encode([
        "reset_required" => false
    ]);
}
?>