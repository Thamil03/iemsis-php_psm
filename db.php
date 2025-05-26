<?php
$host = "localhost";
$user = "root";
$pass = "123456";
$dbname = "iemsis";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
