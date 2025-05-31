<?php
header('Access-Control-Allow-Origin: http://157.230.245.190:3000');
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");
include('../db.php');

$data = json_decode(file_get_contents("php://input"), true);

// Extract all required fields with defaults
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$password = password_hash($data['password'], PASSWORD_BCRYPT);
$noBadan = $data['noBadan'] ?? '';
$phoneNo = $data['phoneNo'] ?? '';
$jawatan = $data['jawatan'] ?? '';
$role = $data['role'] ?? 'user';
$status = 'pending'; // Default status for new users
$approved_by = null; // Will be set when admin approves
$created_at = date('Y-m-d H:i:s');
$updated_at = date('Y-m-d H:i:s');
$login_count = 0; // Initial login count
$reset_token = null;
$reset_token_expiry = null;

// Validate required fields
if (empty($name) || empty($email) || empty($password) || empty($noBadan) || empty($phoneNo) || empty($jawatan)) {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required"
    ]);
    exit;
}

// Check if email already exists
$checkEmail = $conn->prepare("SELECT id FROM users WHERE email = ?");
$checkEmail->bind_param("s", $email);
$checkEmail->execute();
if ($checkEmail->get_result()->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Email already registered"
    ]);
    exit;
}
$checkEmail->close();

// Check if noBadan already exists
$checkNoBadan = $conn->prepare("SELECT id FROM users WHERE noBadan = ?");
$checkNoBadan->bind_param("s", $noBadan);
$checkNoBadan->execute();
if ($checkNoBadan->get_result()->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "No. Badan already registered"
    ]);
    exit;
}
$checkNoBadan->close();

// Insert new user with all fields
$sql = "INSERT INTO users (
    name, email, password, role, status, approved_by, 
    created_at, updated_at, login_count, reset_token, 
    reset_token_expiry, noBadan, phoneNo, jawatan
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param(
    "ssssssssiisss",
    $name, $email, $password, $role, $status, $approved_by,
    $created_at, $updated_at, $login_count, $reset_token,
    $reset_token_expiry, $noBadan, $phoneNo, $jawatan
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "User registered successfully"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Registration failed: " . $stmt->error
    ]);
}

$stmt->close();
?>
