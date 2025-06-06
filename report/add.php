<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

$host = "db-mysql-nyc3-88224-do-user-22958682-0.l.db.ondigitalocean.com";
$user = "doadmin";
$pass = "AVNS_uLb7iZGvlPLSuxlXYUW";
$dbname = "defaultdb";
$port = "25060";

$conn = new mysqli($host, $user, $pass, $dbname, $port);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$stmt = $conn->prepare("INSERT INTO maintenance (noResit, name, lokasi, bil, noSiri, noKewPA, noReport, tindakan, status, teknikal, tarikhSubmission, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
$stmt->bind_param("sssssssssss",
    $data['noResit'],
    $data['name'],
    $data['lokasi'],
    $data['bil'],
    $data['noSiri'],
    $data['noKewPA'],
    $data['noReport'],
    $data['tindakan'],
    $data['status'],
    $data['teknikal'],
    $data['tarikhSubmission']
);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["error" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
