<?php
$enteredPassword = '123456';
$storedHash = '$2y$10$JTbS9e1WRAXAiHqZ5kgpVeRn/8r9EkuN4DD3.ZQAhmkgPlu3TzW3W';

echo "<h2>Raw Check</h2>";
echo "<p><strong>Entered Password:</strong> $enteredPassword</p>";
echo "<p><strong>Stored Hash:</strong> $storedHash</p>";

if (password_verify($enteredPassword, $storedHash)) {
    echo "<p style='color:green'>✅ Password is correct</p>";
} else {
    echo "<p style='color:red'>❌ Password is incorrect</p>";
}

echo "<hr>";
echo "<h2>PHP Version:</h2>";
echo phpversion();
?>
