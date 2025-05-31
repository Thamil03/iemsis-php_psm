<?php
include('../db.php');
session_start();
header("Access-Control-Allow-Origin: https://152.42.242.10");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if (isset($_SESSION['user_id'])) {
    $id = $_SESSION['user_id'];
    $sql = "SELECT * FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    echo json_encode(["loggedIn" => true, "user" => $user]);
} else {
    echo json_encode(["loggedIn" => false]);
}
?>
