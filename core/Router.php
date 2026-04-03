<?php

class Router {
    private $routes = [];

    public function register($method, $path, $callback) {
        $this->routes[] = [$method, $path, $callback];
    }

    public function resolve($method, $uri) {
        // Strip query string from URI
        $uri = strtok($uri, '?');

        foreach ($this->routes as [$m, $path, $callback]) {
            if ($method !== $m) continue;

            // Build regex from path, supporting {param} placeholders
            $pattern = preg_replace('#\{[^}]+\}#', '([^/]+)', $path);
            $pattern = '#^' . $pattern . '$#';

            if (preg_match($pattern, $uri, $matches)) {
                // Extract param names from path
                preg_match_all('#\{([^}]+)\}#', $path, $paramNames);
                array_shift($matches); // remove full match
                foreach ($paramNames[1] as $i => $name) {
                    $_GET[$name] = $matches[$i] ?? null;
                }
                return call_user_func($callback);
            }
        }

        http_response_code(404);
        echo json_encode(["error" => "Route not found"]);
    }
}