<?php
session_start();

// ✅ CORS headers
header("Access-Control-Allow-Origin: *");
//header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

// ✅ Include DB connection
include('../db.php');

// ✅ Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ✅ Parse incoming JSON
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["success" => false, "reason" => "Missing email or password"]);
    exit;
}

$email = $data['email'];
$password = $data['password'];

// ✅ Query the user
$sql = "SELECT * FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    echo json_encode(["success" => false, "reason" => "User not found"]);
    exit;
}
// ✅ Check if user is inactive
if (strtolower($user['status']) !== 'active') {
    echo json_encode(["success" => false, "reason" => "Your account is inactive. Please contact the administrator."]);
    exit;
}

if (password_verify($password, $user['password'])) {
    // Check if this is the default password
    $isDefaultPassword = ($password === 'Default123');
    
    // Set session variables
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_noBadan'] = $user['noBadan'];
    
    // If it's the default password, set the password reset flag
    if ($isDefaultPassword) {
        $_SESSION['password_reset_required'] = true;
        
        // Generate a reset token
        $token = bin2hex(random_bytes(32));
        $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Save token to database
        $tokenStmt = $conn->prepare("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?");
        $tokenStmt->bind_param("ssi", $token, $expiry, $user['id']);
        $tokenStmt->execute();
        
        echo json_encode([
            "success" => true,
            "first_login" => true,
            "message" => "First login detected. Please reset your password.",
            "reset_token" => $token,
            "user" => $user
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "first_login" => false,
            "user" => $user
        ]);
    }
} else {
    echo json_encode(["success" => false, "reason" => "Incorrect password"]);
    exit;
}
//thamil2000
?>