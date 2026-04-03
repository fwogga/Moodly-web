<?php

class UserController extends Controller {

    public static function search() {
        $userId = self::requireUser(); // auth required — you shouldn't search without logging in
        $q = $_GET['q'] ?? '';

        self::json(User::search($q));
    }

    public static function discover() {
        $userId = self::requireUser();
        self::json(User::discover($userId));
    }

    public static function getProfile() {
        $userId = self::requireUser();
        $targetId = $_GET['userId'] ?? $userId; // default to own profile

        $profile = User::getProfile($targetId);

        if (!$profile) {
            self::error("User not found", 404);
        }

        self::json($profile);
    }

    public static function updateProfile() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!empty($data['name'])) {
            User::updateName($userId, $data['name']);
        }

        self::success();
    }

    /**
     * Upload profile photo. Expects a multipart/form-data POST with field "photo".
     */
    public static function uploadPhoto() {
        $userId = self::requireUser();

        if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
            self::error("No photo uploaded or upload error");
        }

        $file = $_FILES['photo'];
        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        // Validate MIME type from actual file content
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);

        if (!in_array($mime, $allowed)) {
            self::error("Invalid file type. Allowed: jpg, png, webp, gif");
        }

        if ($file['size'] > 5 * 1024 * 1024) { // 5MB limit
            self::error("File too large. Maximum size is 5MB");
        }

        $ext = match($mime) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        };

        $uploadDir = __DIR__ . '/../uploads/profile_photos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Remove old photo if it exists
        $db = Database::connect();
        $stmt = $db->prepare("SELECT usuar_foto_perfil FROM usuario WHERE usuar_id = ?");
        $stmt->execute([$userId]);
        $existing = $stmt->fetchColumn();
        if ($existing && file_exists(__DIR__ . '/../' . $existing)) {
            unlink(__DIR__ . '/../' . $existing);
        }

        $filename = "user_{$userId}_" . time() . ".{$ext}";
        $destination = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            self::error("Failed to save photo");
        }

        $relativePath = "uploads/profile_photos/{$filename}";
        User::updatePhoto($userId, $relativePath);

        self::success(['photo' => $relativePath]);
    }
}