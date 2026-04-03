<?php

class Controller {

    protected static function json($data, $status = 200) {
        http_response_code($status);
        header("Content-Type: application/json");
        echo json_encode($data);
        exit;
    }

    protected static function getBody() {
        return json_decode(file_get_contents("php://input"), true) ?? [];
    }

    protected static function error($message, $status = 400) {
        self::json(["error" => $message], $status);
    }

    protected static function success($data = []) {
        self::json(["success" => true, "data" => $data]);
    }

    /**
     * Reads userId from the Authorization header: "Bearer <userId>"
     * Falls back to ?userId= query param for backwards compatibility during migration.
     * Returns the integer userId or exits with 401.
     */
    protected static function requireUser() {
        $userId = null;

        // Preferred: Authorization: Bearer <userId>
        $headers = getallheaders();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (str_starts_with($auth, 'Bearer ')) {
            $userId = trim(substr($auth, 7));
        }

        // Fallback: ?userId= query param (legacy, remove once frontend is updated)
        if (!$userId && isset($_GET['userId'])) {
            $userId = $_GET['userId'];
        }

        if (!$userId || !is_numeric($userId)) {
            self::error("User not authenticated", 401);
        }

        // Verify user exists and is not banned
        $db = Database::connect();
        $stmt = $db->prepare("SELECT usuar_id, usuar_banned FROM usuario WHERE usuar_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            self::error("User not found", 401);
        }

        if ($user['usuar_banned']) {
            self::error("Account is banned", 403);
        }

        return (int) $userId;
    }

    protected static function requireAdmin() {
        $userId = self::requireUser();

        $db = Database::connect();
        $stmt = $db->prepare("SELECT usuar_role FROM usuario WHERE usuar_id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || $user['usuar_role'] !== 'admin') {
            self::error("Admin access required", 403);
        }

        return $userId;
    }
}