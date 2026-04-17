<?php
function db() {
static $pdo = null;
if ($pdo === null) {
    $pdo = new PDO("mysql:host=localhost;dbname=moodly;charset=utf8mb4", "root", "root");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
return $pdo;
}   