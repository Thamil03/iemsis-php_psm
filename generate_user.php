<?php
/**
 * Project: iemsis-php
 * File: generate_user.php
 *
 * Instructions:
 * 1. Copy this file and db.php into your project folder:
 *      XAMPP (Windows): C:/xampp/htdocs/iemsis-php/
 *      LAMP   (Linux):  /var/www/html/iemsis-php/
 *
 * 2. Update db.php with your MySQL credentials and database name.
 *    Example db.php:
 *      <?php
 *      $host   = '127.0.0.1';
 *      $user   = 'root';
 *      $pass   = '';
 *      $dbname = 'your_db';
 *      $conn   = new mysqli($host, $user, $pass, $dbname);
 *      if (\$conn->connect_error) {
 *          die("Connection failed: " . \$conn->connect_error);
 *      }
 *
 * 3. Start your web server and database:
 *      - XAMPP Control Panel → Start Apache & MySQL
 *      - Or: sudo service apache2 start && sudo service mysql start
 *
 * 4a. Browser: open http://localhost/iemsis-php/generate_user.php
 * 4b. CLI:  cd path/to/iemsis-php && php generate_user.php
 */

include('db.php');

// Test user data
$name               = "Thamil";
$email              = "thamil@gmail.com";
$password           = "123456";
$hash               = password_hash($password, PASSWORD_BCRYPT);
$role               = "user"; // Can set here user role admin/user
$status             = "pending";
$approved_by        = null;
$login_count        = 0;
$reset_token        = null;
$reset_token_expiry = null;
$noBadan            = "123456789";
$phoneNo            = "0123456789";
$jawatan            = "Staff";

// Prepare statement with placeholders for all columns except `id`
$sql = "
  INSERT INTO users (
    name, email, password, role, status,
    approved_by,      created_at,        updated_at,
    login_count,      reset_token,       reset_token_expiry,
    noBadan,          phoneNo,           jawatan
  ) VALUES (
    ?,    ?,     ?,        ?,     ?,
    ?,    NOW(), NOW(),
    ?,    ?,     ?,
    ?,    ?,     ?
  )
";

$stmt = $conn->prepare($sql);
if ( ! $stmt) {
    die("Prepare failed: " . $conn->error);
}

// Bind parameters:
//  1–5:  s (string)  name, email, hash, role, status
//    6:   i (integer) approved_by (NULL → SQL NULL)
//    7:   i (integer) login_count
// 8–9:   s (string)  reset_token, reset_token_expiry (NULL → SQL NULL)
//10–12:  s (string)  noBadan, phoneNo, jawatan
$stmt->bind_param(
    "sssssiisssss",
    $name,
    $email,
    $hash,
    $role,
    $status,
    $approved_by,
    $login_count,
    $reset_token,
    $reset_token_expiry,
    $noBadan,
    $phoneNo,
    $jawatan
);

if ($stmt->execute()) {
    echo "<h2>✅ User inserted successfully!</h2>";
    echo "<p><strong>Email:</strong> $email</p>";
    echo "<p><strong>Password:</strong> $password</p>";
    echo "<p><strong>Hash:</strong> $hash</p>";
} else {
    echo "<h2>❌ Failed to insert user.</h2>";
    echo "<pre>" . $stmt->error . "</pre>";
}

$stmt->close();
$conn->close();
?>
