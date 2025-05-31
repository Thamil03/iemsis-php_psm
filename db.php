<?php
$host = "db-mysql-nyc3-88224-do-user-22958682-0.l.db.ondigitalocean.com";
$user = "doadmin";
$pass = "AVNS_uLb7iZGvlPLSuxlXYUW";
$dbname = "defaultdb";
$port = 25060;

$conn = mysqli_init();

// Disable SSL server certificate verification
mysqli_ssl_set($conn, NULL, NULL, NULL, NULL, NULL);
mysqli_options($conn, MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, false);

// Connect using SSL (but skip cert validation)
if (!mysqli_real_connect($conn, $host, $user, $pass, $dbname, $port, NULL, MYSQLI_CLIENT_SSL)) {
    die("Connection failed: " . mysqli_connect_error());
}
?>
