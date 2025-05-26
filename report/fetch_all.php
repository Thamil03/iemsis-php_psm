<?php
header('Content-Type: application/json');

$host = "localhost";
$username = "root";
$password = "";
$database = "iemsis";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$sql = "SELECT * FROM maintenance ORDER BY createdAt DESC";
$result = $conn->query($sql);

$records = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }
}

$conn->close();
echo json_encode($records);
?>
