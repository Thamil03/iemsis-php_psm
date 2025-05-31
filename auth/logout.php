<?php
session_start();

//header"Access-Control-Allow-Origin: http://157.230.245.190");
//header"Access-Control-Allow-Credentials: true");
//header"Content-Type: application/json");

// Unset all session variables
$_SESSION = [];

// Expire the session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Destroy the session
session_destroy();

echo json_encode(["success" => true]);
?>
