<?php
date_default_timezone_set('Asia/Kuala_Lumpur');
// Ensure there is no output before this tag

// Enable error reporting for debugging (disable or adjust in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set headers for JSON output and CORS
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: https://dolphin-app-gllbf.ondigitalocean.app");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include the shared database connection
include_once __DIR__ . '/db.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$requestMethod = $_SERVER["REQUEST_METHOD"];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Logging function
function logAction($action, $description) {
    global $conn;
    
    // Get user details from session
    $user_id = $_SESSION['user_id'] ?? 0;
    $user_name = $_SESSION['user_name'] ?? 'System';
    $user_noBadan = $_SESSION['user_noBadan'] ?? '-';
    
    // Set module name
    $module = 'User Management';
    
    // Current timestamp
    $created_at = date('Y-m-d H:i:s');
    
    $stmt = $conn->prepare("INSERT INTO logs (user_id, user_name, user_noBadan, action, module, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issssss", $user_id, $user_name, $user_noBadan, $action, $module, $description, $created_at);
    $stmt->execute();
    $stmt->close();
}

switch ($requestMethod) {
    case "GET":
        if ($action === 'fetch_all') {
            fetchAllUsers();
        } else if ($action === 'fetch_reset_requests') {
            try {
                $stmt = $conn->prepare("
                    SELECT prr.*, u.name as user_name, u.noBadan as user_noBadan, u.email 
                    FROM password_reset_requests prr 
                    JOIN users u ON prr.user_id = u.id 
                    WHERE prr.status = 'pending'
                    ORDER BY prr.created_at DESC
                ");
                $stmt->execute();
                $result = $stmt->get_result();
                $requests = [];
                while ($row = $result->fetch_assoc()) {
                    $requests[] = $row;
                }
                echo json_encode($requests);
            } catch (Exception $e) {
                echo json_encode(['error' => 'Failed to fetch reset requests']);
            }
        } else if ($action === 'check_pending_resets') {
            try {
                $stmt = $conn->prepare("
                    SELECT COUNT(*) as count 
                    FROM password_reset_requests 
                    WHERE status = 'pending'
                ");
                $stmt->execute();
                $result = $stmt->get_result();
                $row = $result->fetch_assoc();
                echo json_encode(['count' => $row['count']]);
            } catch (Exception $e) {
                echo json_encode(['error' => 'Failed to check pending resets']);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid GET action."]);
        }
        break;
    case "POST":
        // Read POST data as JSON.
        $input = json_decode(file_get_contents("php://input"), true);
        if ($action === 'update') {
            updateUser($input);
        } else if ($action === 'update_status') {
            updateUserStatus($input);
        } else if ($action === 'delete') {
            deleteUser($input);
        } else if ($action === 'approve') {
            approveUser($input);
        } else if ($action === 'reject') {
            rejectUser($input);
        } else if ($action === 'add') {
            addUser($input);
        } else if ($action === 'forgot_password') {
            // Get email from JSON input
            $json = file_get_contents("php://input");
            $input = json_decode($json, true);
            $email = $input['email'] ?? '';
            
            if (empty($email)) {
                echo json_encode(['error' => 'Email is required']);
                exit;
            }

            // Check if email exists
            $stmt = $conn->prepare("SELECT id, name, noBadan FROM users WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                echo json_encode(['error' => 'Email not found']);
                exit;
            }

            $user = $result->fetch_assoc();

            // Check if there's already a pending request
            $stmt = $conn->prepare("SELECT id FROM password_reset_requests WHERE user_id = ? AND status = 'pending'");
            $stmt->bind_param("i", $user['id']);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                echo json_encode(['error' => 'You already have a pending password reset request']);
                exit;
            }

            // Create password reset request
            $stmt = $conn->prepare("INSERT INTO password_reset_requests (user_id, user_name, user_noBadan, email, status, created_at) VALUES (?, ?, ?, ?, 'pending', NOW())");
            $stmt->bind_param("isss", $user['id'], $user['name'], $user['noBadan'], $email);
            
            if ($stmt->execute()) {
                echo json_encode(['message' => 'Password reset request submitted successfully']);
            } else {
                echo json_encode(['error' => 'Failed to submit password reset request']);
            }
            exit;
        } else if ($action === 'reset_password') {
            resetPassword($input);
        } else if ($action === 'handle_reset_request') {
            try {
                $data = json_decode(file_get_contents("php://input"), true);
                $requestId = $data['request_id'];
                $action = $data['action'];

                if ($action === 'approve') {
                    // Set password to Default123
                    $defaultPassword = password_hash("Default123", PASSWORD_DEFAULT);

                    // Update user's password
                    $stmt = $conn->prepare("
                        UPDATE users u 
                        JOIN password_reset_requests prr ON u.id = prr.user_id 
                        SET u.password = ? 
                        WHERE prr.id = ?
                    ");
                    $stmt->bind_param("si", $defaultPassword, $requestId);
                    $stmt->execute();

                    // Update request status
                    $stmt = $conn->prepare("UPDATE password_reset_requests SET status = 'approved' WHERE id = ?");
                    $stmt->bind_param("i", $requestId);
                    $stmt->execute();

                    echo json_encode(['message' => "Password has been reset to Default123"]);
                } else {
                    // Update request status to rejected
                    $stmt = $conn->prepare("UPDATE password_reset_requests SET status = 'rejected' WHERE id = ?");
                    $stmt->bind_param("i", $requestId);
                    $stmt->execute();
                    echo json_encode(['message' => 'Password reset request rejected']);
                }
            } catch (Exception $e) {
                echo json_encode(['error' => 'Failed to process reset request']);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid POST action."]);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed."]);
        break;
}

// Function to fetch all users (including new columns)
function fetchAllUsers() {
    global $conn;
    
    // Get search parameter if exists
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    
    // Build the query with search functionality
    $query = "SELECT id, name, noBadan, jawatan, email, phoneNo, role, created_at, updated_at, status, approved_by FROM users";
    
    if (!empty($search)) {
        $search = "%$search%";
        $query .= " WHERE name LIKE ? OR email LIKE ? OR noBadan LIKE ? OR jawatan LIKE ? OR phoneNo LIKE ?";
    }
    
    $stmt = $conn->prepare($query);
    
    if (!empty($search)) {
        $stmt->bind_param("sssss", $search, $search, $search, $search, $search);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result) {
        $users = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($users);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $conn->error]);
    }
    $stmt->close();
}

// Function to update a user's information
function updateUser($data) {
    global $conn;
    if (!isset($data['id'], $data['name'], $data['email'], $data['noBadan'], $data['jawatan'], $data['phoneNo'], $data['role'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields."]);
        return;
    }
    
    $id = $data['id'];
    $name = $data['name'];
    $noBadan = $data['noBadan'];
    $jawatan = $data['jawatan'];
    $email = $data['email'];
    $phoneNo = $data['phoneNo'];
    $role = $data['role'];
    
    // Check for duplicate email or noBadan
    $checkStmt = $conn->prepare("SELECT id FROM users WHERE (email = ? OR noBadan = ?) AND id != ?");
    $checkStmt->bind_param("ssi", $email, $noBadan, $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        http_response_code(400);
        echo json_encode(["error" => "Email or No. Badan already exists."]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();
    
    // Fetch original data for logging
    $originalStmt = $conn->prepare("SELECT name, email, noBadan, jawatan, phoneNo, role FROM users WHERE id = ?");
    $originalStmt->bind_param("i", $id);
    $originalStmt->execute();
    $originalResult = $originalStmt->get_result();
    $originalData = $originalResult->fetch_assoc();
    $originalStmt->close();
    
    $stmt = $conn->prepare("UPDATE users SET name = ?, noBadan = ?, jawatan = ?, email = ?, phoneNo = ?, role = ?, updated_at = NOW() WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $conn->error]);
        return;
    }
    
    $stmt->bind_param("ssssssi", $name, $noBadan, $jawatan, $email, $phoneNo, $role, $id);
    if ($stmt->execute()) {
        echo json_encode(["message" => "User updated successfully."]);
        
        // Prepare changes for logging
        $changes = [];
        if ($originalData['name'] != $name) {
            $changes[] = "name: '{$originalData['name']}' to '$name'";
        }
        if ($originalData['email'] != $email) {
            $changes[] = "email: '{$originalData['email']}' to '$email'";
        }
        
        // Log the update action
        $logDesc = "Updated user ID: $id";
        if (!empty($changes)) {
            $logDesc .= " - Changes: " . implode("; ", $changes);
        }
        logAction("UPDATE", $logDesc);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $stmt->error]);
    }
    $stmt->close();
}

// Function to approve a user.
function approveUser($data) {
    global $conn;
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing user id."]);
        return;
    }
    $id = $data['id'];
    $status = "Approved";
    $approved_by = isset($data['approved_by']) ? $data['approved_by'] : "admin";
    
    // Get user information for logging
    $userStmt = $conn->prepare("SELECT name, email, status FROM users WHERE id = ?");
    $userStmt->bind_param("i", $id);
    $userStmt->execute();
    $userResult = $userStmt->get_result();
    $userData = $userResult->fetch_assoc();
    $userStmt->close();
    $oldStatus = $userData['status'] ?? 'unknown';
    
    $stmt = $conn->prepare("UPDATE users SET status = ?, approved_by = ? WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $conn->error]);
        return;
    }
    $stmt->bind_param("ssi", $status, $approved_by, $id);
    if ($stmt->execute()) {
        echo json_encode(["message" => "User approved successfully."]);
        
        // Log the approval action
        $userName = $userData['name'] ?? 'unknown';
        $userEmail = $userData['email'] ?? 'unknown';
        $logDesc = "Approved user ID: $id, Name: $userName, Email: $userEmail - Status changed from '$oldStatus' to 'Approved'";
        logAction("UPDATE", $logDesc);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $stmt->error]);
    }
    $stmt->close();
}

// Function to reject a user.
function rejectUser($data) {
    global $conn;
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing user id."]);
        return;
    }
    $id = $data['id'];
    $status = "Rejected";
    $approved_by = isset($data['approved_by']) ? $data['approved_by'] : "admin";
    
    // Get user information for logging
    $userStmt = $conn->prepare("SELECT name, email, status FROM users WHERE id = ?");
    $userStmt->bind_param("i", $id);
    $userStmt->execute();
    $userResult = $userStmt->get_result();
    $userData = $userResult->fetch_assoc();
    $userStmt->close();
    $oldStatus = $userData['status'] ?? 'unknown';
    
    $stmt = $conn->prepare("UPDATE users SET status = ?, approved_by = ? WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $conn->error]);
        return;
    }
    $stmt->bind_param("ssi", $status, $approved_by, $id);
    if ($stmt->execute()) {
        echo json_encode(["message" => "User rejected successfully."]);
        
        // Log the rejection action
        $userName = $userData['name'] ?? 'unknown';
        $userEmail = $userData['email'] ?? 'unknown';
        $logDesc = "Rejected user ID: $id, Name: $userName, Email: $userEmail - Status changed from '$oldStatus' to 'Rejected'";
        logAction("UPDATE", $logDesc);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $stmt->error]);
    }
    $stmt->close();
}

// Function to add a new user.
// Now, we also insert a default password.
function addUser($data) {
    global $conn;
    if (!isset($data['name'], $data['email'], $data['role'], $data['noBadan'], $data['jawatan'], $data['phoneNo'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields."]);
        return;
    }
    $name = $data['name'];
    $email = $data['email'];
    $role = $data['role'];
    $noBadan = $data['noBadan'];
    $jawatan = $data['jawatan'];
    $phoneNo = $data['phoneNo'];
    $status = "Active";
    
    // Check for duplicate email or noBadan
    $checkStmt = $conn->prepare("SELECT id FROM users WHERE email = ? OR noBadan = ?");
    $checkStmt->bind_param("ss", $email, $noBadan);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        http_response_code(400);
        echo json_encode(["error" => "Email or No. Badan already exists."]);
        $checkStmt->close();
        return;
    }
    $checkStmt->close();
    
    // Set a default password and hash it.
    $defaultPassword = password_hash("Default123", PASSWORD_DEFAULT);
    
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, status, noBadan, jawatan, phoneNo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $conn->error]);
        return;
    }
    $stmt->bind_param("ssssssss", $name, $email, $defaultPassword, $role, $status, $noBadan, $jawatan, $phoneNo);
    if ($stmt->execute()) {
        $newUserId = $stmt->insert_id;
        echo json_encode(["message" => "User added successfully.", "id" => $newUserId]);
        
        // Log the user creation
        $logDesc = "Created new user - ID: $newUserId, Name: $name, Email: $email, Role: $role, No. Badan: $noBadan";
        logAction("CREATE", $logDesc);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $stmt->error]);
    }
    $stmt->close();
}

// Function to handle forgot password requests
function forgotPassword($data) {
    global $conn;

    if (!isset($data['email'])) {
        http_response_code(400);
        echo json_encode(["error" => "Email is required."]);
        return;
    }

    $email = $data['email'];

    // Check if user exists
    $stmt = $conn->prepare("SELECT id, name, noBadan FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["error" => "Email not found."]);
        return;
    }

    $user = $result->fetch_assoc();
    $userId = $user['id'];
    $userName = $user['name'];
    $userNoBadan = $user['noBadan'];

    // Check if there's already a pending request
    $checkStmt = $conn->prepare("SELECT id FROM password_reset_requests WHERE user_id = ? AND status = 'pending'");
    $checkStmt->bind_param("i", $userId);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        http_response_code(400);
        echo json_encode(["error" => "You already have a pending password reset request."]);
        return;
    }
    $checkStmt->close();

    // Create a password reset request
    $stmt = $conn->prepare("INSERT INTO password_reset_requests (user_id, user_name, user_noBadan, status, created_at) VALUES (?, ?, ?, 'pending', NOW())");
    $stmt->bind_param("iss", $userId, $userName, $userNoBadan);
    
    if ($stmt->execute()) {
        // Log the password reset request
        $logDesc = "Password reset requested - User ID: $userId, Name: $userName, No. Badan: $userNoBadan";
        logAction("REQUEST", $logDesc);
        
        echo json_encode(["message" => "Password reset request has been sent to admin."]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to create password reset request."]);
    }
}

// Add new function to fetch password reset requests
function fetchPasswordResetRequests() {
    global $conn;
    
    $query = "SELECT prr.*, u.email 
              FROM password_reset_requests prr 
              JOIN users u ON prr.user_id = u.id 
              WHERE prr.status = 'pending' 
              ORDER BY prr.created_at DESC";
    
    $result = $conn->query($query);
    
    if ($result) {
        $requests = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($requests);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $conn->error]);
    }
}

// Function to update user status (Active/Inactive)
function updateUserStatus($data) {
    global $conn;
    if (!isset($data['id'], $data['status'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields."]);
        return;
    }
    
    $id = $data['id'];
    $status = $data['status'];
    
    // Get user information for logging
    $userStmt = $conn->prepare("SELECT name, email, status FROM users WHERE id = ?");
    $userStmt->bind_param("i", $id);
    $userStmt->execute();
    $userResult = $userStmt->get_result();
    $userData = $userResult->fetch_assoc();
    $userStmt->close();
    $oldStatus = $userData['status'] ?? 'unknown';
    
    $stmt = $conn->prepare("UPDATE users SET status = ? WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $conn->error]);
        return;
    }
    
    $stmt->bind_param("si", $status, $id);
    if ($stmt->execute()) {
        echo json_encode(["message" => "User status updated successfully."]);
        
        // Log the status change
        $userName = $userData['name'] ?? 'unknown';
        $userEmail = $userData['email'] ?? 'unknown';
        $logDesc = "Updated user status - ID: $id, Name: $userName, Email: $userEmail - Status changed from '$oldStatus' to '$status'";
        logAction("UPDATE", $logDesc);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $stmt->error]);
    }
    $stmt->close();
}

// Function to delete a user
function deleteUser($data) {
    global $conn;
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing user id."]);
        return;
    }
    
    $id = $data['id'];
    
    // Get user information for logging
    $userStmt = $conn->prepare("SELECT name, email FROM users WHERE id = ?");
    $userStmt->bind_param("i", $id);
    $userStmt->execute();
    $userResult = $userStmt->get_result();
    $userData = $userResult->fetch_assoc();
    $userStmt->close();
    
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $conn->error]);
        return;
    }
    
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(["message" => "User deleted successfully."]);
        
        // Log the deletion
        $userName = $userData['name'] ?? 'unknown';
        $userEmail = $userData['email'] ?? 'unknown';
        $logDesc = "Deleted user - ID: $id, Name: $userName, Email: $userEmail";
        logAction("DELETE", $logDesc);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $stmt->error]);
    }
    $stmt->close();
}

// Add this function before the closing PHP tag
function resetPassword($data) {
    global $conn;
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing user id."]);
        return;
    }
    
    $id = $data['id'];
    $defaultPassword = password_hash("Default123", PASSWORD_DEFAULT);
    
    // Get user information for logging
    $userStmt = $conn->prepare("SELECT name, email FROM users WHERE id = ?");
    $userStmt->bind_param("i", $id);
    $userStmt->execute();
    $userResult = $userStmt->get_result();
    $userData = $userResult->fetch_assoc();
    $userStmt->close();
    
    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $conn->error]);
        return;
    }
    
    $stmt->bind_param("si", $defaultPassword, $id);
    if ($stmt->execute()) {
        echo json_encode(["message" => "Password has been reset to Default123"]);
        
        // Log the password reset
        $userName = $userData['name'] ?? 'unknown';
        $userEmail = $userData['email'] ?? 'unknown';
        $logDesc = "Reset password for user - ID: $id, Name: $userName, Email: $userEmail";
        logAction("UPDATE", $logDesc);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $stmt->error]);
    }
    $stmt->close();
}
?>