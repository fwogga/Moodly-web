<?php
spl_autoload_register(function ($class) {
    $paths = ["controllers", "models", "core", "config"];
    foreach ($paths as $path) {
        $file = __DIR__ . "/" . $path . "/" . $class . ".php";
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

$router = new Router();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once "Routes.php";

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$router->resolve($_SERVER['REQUEST_METHOD'], $uri);