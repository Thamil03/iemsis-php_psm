<?php
$host = "db-mysql-nyc3-88224-do-user-22958682-0.l.db.ondigitalocean.com";
$user = "doadmin";
$pass = "AVNS_uLb7iZGvlPLSuxlXYUW";
$dbname = "defaultdb";
$port = 25060;

// Path to the CA certificate — required for DO SSL
$ca_cert = "/etc/ssl/certs/ca-certificates.crt"; // Common on Ubuntu

$conn = mysqli_init();

// Set SSL options
mysqli_ssl_set($conn, NULL, NULL, $ca_cert, NULL, NULL);

// Connect using SSL
if (!mysqli_real_connect($conn, $host, $user, $pass, $dbname, $port, NULL, MYSQLI_CLIENT_SSL)) {
    die("Connection failed: " . mysqli_connect_error());
}
?>
