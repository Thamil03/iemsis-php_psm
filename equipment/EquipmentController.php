<?php
date_default_timezone_set('Asia/Kuala_Lumpur');
// EquipmentController.php

// 1) Debug & CORS setup
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://152.42.242.10');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2) DB connection
include_once __DIR__ . '/../db.php';

// 3) Start session (must come *before* you read $_SESSION)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 4) Determine method & action
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

// 5) Helpers
function validateDate($dateString) {
    $d = DateTime::createFromFormat('Y-m-d', $dateString);
    return ($d && $d->format('Y-m-d') === $dateString) ? $dateString : null;
}

function getNextBilForYear($year) {
    global $conn;
    
    // Debug input
    error_log("Getting next BIL for year: " . $year);
    
    // Get all BIL numbers for the year to verify
    $stmt = $conn->prepare("
      SELECT bil 
      FROM equipment 
      WHERE year = ? 
      ORDER BY bil DESC
    ");
    $stmt->bind_param("i", $year);
    $stmt->execute();
    $result = $stmt->get_result();
    
    // Debug all existing BIL numbers
    $allBils = [];
    while ($row = $result->fetch_assoc()) {
        $allBils[] = $row['bil'];
    }
    error_log("Existing BIL numbers: " . implode(", ", $allBils));
    
    // Get the maximum BIL
    $maxBil = !empty($allBils) ? max($allBils) : 0;
    $nextBil = $maxBil + 1;
    
    // Debug output
    error_log("Max BIL: " . $maxBil . ", Next BIL: " . $nextBil);
    
    $stmt->close();
    return $nextBil;
}

function reorderBilAfterDelete($year, $oldBil) {
    global $conn;
    $stmt = $conn->prepare("
      UPDATE equipment
         SET bil = bil - 1
       WHERE year = ? AND bil > ?
    ");
    $stmt->bind_param("ii", $year, $oldBil);
    $stmt->execute();
    $stmt->close();
}

// 6) Logging function (unchanged)
function logAction($action, $description) {
    global $conn;
    
    // Debug session state
    error_log("EquipmentController - Session ID: " . session_id());
    error_log("EquipmentController - Session Data: " . print_r($_SESSION, true));
    
    // Get user details from session
    $user_id     = $_SESSION['user_id']     ?? 0;
    $user_name   = $_SESSION['user_name']   ?? 'System';
    $user_noBadan= $_SESSION['user_noBadan']?? '-';
    
    // Fallback if not logged in
    if ($user_id === 0) {
        $user_name    = 'System';
        $user_noBadan = '-';
    }
    error_log("EquipmentController - User ID: $user_id, Name: $user_name, No. Badan: $user_noBadan");
    
    $module     = 'Equipment Management';
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

// Custom actions
if ($action === 'add_option'    && $method === 'POST') { addDropdownOption();    return; }
if ($action === 'fetch_dropdowns'&& $method === 'GET' ) { fetchDropdownOptions(); return; }
if ($action === 'delete_option' && $method === 'POST') { deleteDropdownOption(); return; }
if ($action === 'fetch_all'     && $method === 'GET' ) { fetchEquipment();       return; }

// Add handler for getNextBil action
if ($action === 'getNextBil' && $method === 'GET') {
    $year = $_GET['year'] ?? null;
    if (!$year) {
        http_response_code(400);
        echo json_encode(["error" => "Year parameter is required"]);
        return;
    }
    $nextBil = getNextBilForYear($year);
    echo json_encode(["nextBil" => $nextBil]);
    return;
}

// New custom action for updating status only.
if ($action === 'update_status' && $method === 'PUT') {
    updateStatus();
    return;
}

// Standard REST methods
switch ($method) {
    case 'GET':
        fetchEquipment();
        break;
    case 'POST':
        addEquipment();
        break;
    case 'PUT':
        updateEquipment();
        break;
    case 'DELETE':
        deleteEquipment();
        break;
    default:
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
        break;
}


// === EQUIPMENT FUNCTIONS ===

function fetchEquipment() {
    global $conn;
    // Get year filter, search term, and status from query parameters.
    $year = $_GET['year'] ?? '';
    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? '';
    $search = trim($search);
    if ($search !== '') {
        $searchParam = '%' . $search . '%';
    }

    // Build query based on provided parameters.
    $whereClauses = [];
    $params = [];
    $types = '';

    if ($year) {
        $whereClauses[] = "year = ?";
        $params[] = $year;
        $types .= 'i';
    }

    if ($status) {
        $whereClauses[] = "status = ?";
        $params[] = $status;
        $types .= 's';
    }

    if ($search !== '') {
        $whereClauses[] = "(noResit LIKE ? OR noSiri LIKE ? OR noKewPA LIKE ? OR noReport LIKE ? OR bil LIKE ?)";
        $params = array_merge($params, [$searchParam, $searchParam, $searchParam, $searchParam, $searchParam]);
        $types .= 'sssss';
    }

    $whereSql = !empty($whereClauses) ? "WHERE " . implode(" AND ", $whereClauses) : "";
    $sql = "SELECT * FROM equipment $whereSql ORDER BY year ASC, bil ASC";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => $conn->error]);
        return;
    }

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $equipment = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode($equipment);
    $stmt->close();
}

function getNextIdForYear($year) {
    global $conn;
    // Get the maximum ID across all years and add 1
    $stmt = $conn->prepare("SELECT IFNULL(MAX(id), 0) + 1 AS nextId FROM equipment");
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    return $row["nextId"];
}

function addEquipment() {
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);

    // Validate required fields
    $requiredFields = [
        'year', 'device', 'noResit', 'name', 'location', 'branch', 
        'deviceName', 'problem', 'technician', 'status', 'tarikhDiresit'
    ];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "error" => ucfirst($field) . " is required",
                "field" => $field
            ]);
            return;
        }
    }

    // Validate No. Resit format
    if (!preg_match('/^\d{4}$/', $data['noResit'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "No. Resit must be exactly 4 digits",
            "field" => "noResit"
        ]);
        return;
    }

    // Check for duplicate values
    $duplicateChecks = [
        'noResit' => 'No. Resit',
        'noSiri' => 'No. Siri',
        'noKewPA' => 'No. Kew PA',
        'noReport' => 'No. Report'
    ];

    foreach ($duplicateChecks as $field => $fieldName) {
        if (!empty($data[$field])) {
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM equipment WHERE $field = ?");
            $stmt->bind_param("s", $data[$field]);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if ($result['count'] > 0) {
                http_response_code(400);
                echo json_encode([
                    "success" => false, 
                    "error" => "$fieldName already exists in the system",
                    "field" => $field
                ]);
                return;
            }
        }
    }

    // Get next BIL for the year
    $year = (int)$data['year'];
    $bil = getNextBilForYear($year);
    $id = getNextIdForYear($year);

    // Required fields
    $name = $data['name'];
    $branch = $data['branch'];
    $device = $data['device'];
    $deviceName = $data['deviceName'];
    $location = $data['location'];
    $noResit = $data['noResit'];
    $tarikhDiresit = validateDate($data['tarikhDiresit']);
    $problem = $data['problem'];
    $status = $data['status'];
    $technician = $data['technician'];

    // Optional fields
    $noKewPA = $data['noKewPA'] ?? "";
    $noReport = $data['noReport'] ?? "";
    $noSiri = $data['noSiri'] ?? "";
    $actionTaken = $data['actionTaken'] ?? "";
    $tempohWarranty = isset($data['tempohWarranty']) ? validateDate($data['tempohWarranty']) : null;
    $submissionDate = isset($data['submissionDate']) ? validateDate($data['submissionDate']) : null;
    $exitDate = isset($data['exitDate']) ? validateDate($data['exitDate']) : null;

    $stmt = $conn->prepare("
      INSERT INTO equipment
        (id, name, bil, branch, device, deviceName, location, 
         noKewPA, noReport, noResit, tarikhDiresit, noSiri, 
         problem, actionTaken, status, submissionDate, exitDate, 
         year, technician, tempohWarranty)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $conn->error
        ]);
        return;
    }

    $stmt->bind_param(
      "isisssssssssssssssss",
      $id, $name, $bil, $branch, $device, $deviceName, $location,
      $noKewPA, $noReport, $noResit, $tarikhDiresit, $noSiri,
      $problem, $actionTaken, $status, $submissionDate, $exitDate,
      $year, $technician, $tempohWarranty
    );

    if ($stmt->execute()) {
        $newEquipmentId = $stmt->insert_id;
        echo json_encode([
            "success" => true,
            "message" => "Equipment added successfully.",
            "id" => $newEquipmentId
        ]);
        
        // Log the addition
        logAction("CREATE", "Create equipment: " . $deviceName . " (No. Resit: " . $noResit . ", Status: " . $status . ")");
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $stmt->error
        ]);
    }
    $stmt->close();
}

function updateEquipment() {
    global $conn;
    
    // Get raw input and decode JSON
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);
    
    // Check if JSON decode failed
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Invalid JSON data"
        ]);
        return;
    }

    // Validate required fields
    $requiredFields = [
        'year', 'id', 'device', 'noResit', 'name', 'location', 'branch', 
        'deviceName', 'problem', 'technician', 'status', 'tarikhDiresit'
    ];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "error" => ucfirst($field) . " is required",
                "field" => $field
            ]);
            return;
        }
    }

    // Validate No. Resit format
    if (!preg_match('/^\d{4}$/', $data['noResit'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "No. Resit must be exactly 4 digits",
            "field" => "noResit"
        ]);
        return;
    }

    // Convert and validate numeric fields
    $year = filter_var($data['year'], FILTER_VALIDATE_INT);
    $id = filter_var($data['id'], FILTER_VALIDATE_INT);
    
    if ($year === false || $id === false) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Invalid year or id format"
        ]);
        return;
    }

    // Check for duplicate values (excluding current record)
    $duplicateChecks = [
        'noResit' => 'No. Resit',
        'noSiri' => 'No. Siri',
        'noKewPA' => 'No. Kew PA',
        'noReport' => 'No. Report'
    ];

    foreach ($duplicateChecks as $field => $fieldName) {
        if (!empty($data[$field])) {
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM equipment WHERE $field = ? AND (year != ? OR id != ?)");
            $stmt->bind_param("sii", $data[$field], $year, $id);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if ($result['count'] > 0) {
                http_response_code(400);
                echo json_encode([
                    "success" => false, 
                    "error" => "$fieldName already exists in the system",
                    "field" => $field
                ]);
                return;
            }
        }
    }

    // Fetch original data for logging
    $orig = $conn->prepare("SELECT * FROM equipment WHERE year=? AND id=?");
    if (!$orig) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $conn->error
        ]);
        return;
    }
    
    $orig->bind_param("ii", $year, $id);
    if (!$orig->execute()) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $orig->error
        ]);
        $orig->close();
        return;
    }
    
    $originalData = $orig->get_result()->fetch_assoc();
    $orig->close();

    if (!$originalData) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "error" => "Equipment not found"
        ]);
        return;
    }

    // Required fields
    $noResit = $data['noResit'];
    $name = $data['name'];
    $location = $data['location'];
    $branch = $data['branch'];
    $device = $data['device'];
    $deviceName = $data['deviceName'];
    $problem = $data['problem'];
    $technician = $data['technician'];
    $status = $data['status'];
    $tarikhDiresit = validateDate($data['tarikhDiresit']);

    // Optional fields
    $noSiri = $data['noSiri'] ?? "";
    $noKewPA = $data['noKewPA'] ?? "";
    $noReport = $data['noReport'] ?? "";
    $actionTaken = $data['actionTaken'] ?? "";
    $tempohWarranty = isset($data['tempohWarranty']) ? validateDate($data['tempohWarranty']) : null;
    $submissionDate = isset($data['submissionDate']) ? validateDate($data['submissionDate']) : null;
    $exitDate = isset($data['exitDate']) ? validateDate($data['exitDate']) : null;

    // Prepare update statement
    $stmt = $conn->prepare("
        UPDATE equipment
        SET noResit = ?,
            tarikhDiresit = ?,
            name = ?,
            location = ?,
            branch = ?,
            device = ?,
            deviceName = ?,
            noSiri = ?,
            noKewPA = ?,
            problem = ?,
            noReport = ?,
            actionTaken = ?,
            status = ?,
            technician = ?,
            tempohWarranty = ?,
            submissionDate = ?,
            exitDate = ?
        WHERE year = ? AND id = ?
    ");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $conn->error
        ]);
        return;
    }

    // Bind parameters
    $stmt->bind_param(
        "sssssssssssssssssii",
        $noResit, $tarikhDiresit, $name, $location, $branch,
        $device, $deviceName, $noSiri, $noKewPA,
        $problem, $noReport, $actionTaken,
        $status, $technician, $tempohWarranty,
        $submissionDate, $exitDate,
        $year, $id
    );

    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Equipment updated successfully."
        ]);
        
        // Log the update
        logAction("UPDATE", "Updated equipment: " . $deviceName . " (No. Resit: " . $noResit . ", Status: " . $status . ")");
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $stmt->error
        ]);
    }
    
    $stmt->close();
}

function deleteEquipment() {
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['year'], $data['id'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Missing year or id"
        ]);
        return;
    }
    
    $year = (int)$data['year'];
    $id = (int)$data['id'];

    // fetch equipment details for logging before deletion
    $stmt = $conn->prepare("SELECT bil, device, deviceName, noResit, status FROM equipment WHERE year=? AND id=?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $conn->error
        ]);
        return;
    }
    
    $stmt->bind_param("ii", $year, $id);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $stmt->error
        ]);
        $stmt->close();
        return;
    }
    
    $result = $stmt->get_result();
    $equipment = $result->fetch_assoc();
    $stmt->close();

    if (!$equipment) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "error" => "Equipment not found"
        ]);
        return;
    }

    $oldBil = (int)$equipment['bil'];
    $deviceName = $equipment['deviceName'] ?? 'Unknown Device';
    $noResit = $equipment['noResit'] ?? 'Unknown';
    $status = $equipment['status'] ?? 'Unknown';

    // delete the equipment
    $stmt = $conn->prepare("DELETE FROM equipment WHERE year = ? AND id = ?");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $conn->error
        ]);
        return;
    }
    
    $stmt->bind_param("ii", $year, $id);

    if ($stmt->execute()) {
        // close the gap in BIL numbers
        reorderBilAfterDelete($year, $oldBil);
        
        echo json_encode([
            "success" => true,
            "message" => "Equipment deleted successfully."
        ]);
        
        // Log the deletion with equipment details
        logAction("DELETE", "Deleted equipment: " . $deviceName . " (No. Resit: " . $noResit . ", Status: " . $status . ")");
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database error: " . $stmt->error
        ]);
    }
    
    $stmt->close();
}

// === DROPDOWN OPTION FUNCTIONS ===

function addDropdownOption() {
    global $conn;
    $input = json_decode(file_get_contents("php://input"), true);

    $type = $input['type'] ?? null;
    $value = $input['value'] ?? null;

    if (!$type || !$value) {
        http_response_code(400);
        echo json_encode(["error" => "Missing 'type' or 'value'"]);
        return;
    }

    // Check for case-insensitive duplicates
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM dropdown_options WHERE LOWER(type) = LOWER(?) AND LOWER(value) = LOWER(?)");
    $stmt->bind_param("ss", $type, $value);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($result['count'] > 0) {
        http_response_code(400);
        echo json_encode(["error" => "This option already exists."]);
        return;
    }

    // Insert the new option
    $stmt = $conn->prepare("INSERT INTO dropdown_options (`type`, `value`) VALUES (?, ?)");
    $stmt->bind_param("ss", $type, $value);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Option added successfully"]);
        
        // Log the dropdown option creation
        $logDesc = "Added dropdown option: Type '$type', Value '$value'";
        logAction("CREATE", $logDesc);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to insert: " . $stmt->error]);
    }

    $stmt->close();
}

function fetchDropdownOptions() {
    global $conn;

    $stmt = $conn->prepare("SELECT type, value FROM dropdown_options ORDER BY type, value");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to prepare dropdown fetch: " . $conn->error]);
        return;
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $options = [];
    while ($row = $result->fetch_assoc()) {
        $type = $row['type'];
        $value = $row['value'];

        if (!isset($options[$type])) {
            $options[$type] = [];
        }

        $options[$type][] = $value;
    }

    echo json_encode($options);
    $stmt->close();
}

function deleteDropdownOption() {
    global $conn;
    $input = json_decode(file_get_contents("php://input"), true);

    $type = $input['type'] ?? null;
    $value = $input['value'] ?? null;

    if (!$type || !$value) {
        http_response_code(400);
        echo json_encode(["error" => "Missing 'type' or 'value'"]);
        return;
    }

    // Delete only the exact match (case-sensitive)
    $stmt = $conn->prepare("DELETE FROM dropdown_options WHERE type = ? AND value = ?");
    $stmt->bind_param("ss", $type, $value);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(["message" => "Option deleted successfully"]);
            
            // Log the dropdown option deletion
            $logDesc = "Deleted dropdown option: Type '$type', Value '$value'";
            logAction("DELETE", $logDesc);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Option not found"]);
        }
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to delete: " . $stmt->error]);
    }

    $stmt->close();
}
?>