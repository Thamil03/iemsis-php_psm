<?php
$host = "db-mysql-nyc3-88224-do-user-22958682-0.l.db.ondigitalocean.com";
$user = "doadmin";
$pass = "AVNS_uLb7iZGvlPLSuxlXYUW";
$dbname = "defaultdb";
$port = "25060";

$conn = new mysqli($host, $user, $pass, $dbname, $port);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
