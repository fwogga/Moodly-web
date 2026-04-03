<?php

class AuthController extends Controller {

    public static function register() {
        $data = self::getBody();

        if (!isset($data['name'], $data['email'], $data['password'])) {
            self::error("Missing fields: name, email and password are required");
        }

        if (strlen($data['password']) < 6) {
            self::error("Password must be at least 6 characters");
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            self::error("Invalid email address");
        }

        if (User::findByEmail($data['email'])) {
            self::error("Email already registered");
        }

        $userId = User::create($data['name'], $data['email'], $data['password']);

        self::success(['userId' => $userId]);
    }

    public static function login() {
        $data = self::getBody();

        if (!isset($data['email'], $data['password'])) {
            self::error("Missing fields");
        }

        $user = User::findByEmail($data['email']);

        if (!$user || !password_verify($data['password'], $user['usuar_senha_hash'])) {
            self::error("Invalid credentials", 401);
        }

        if ($user['usuar_banned']) {
            self::error("This account has been banned", 403);
        }

        unset($user['usuar_senha_hash']);

        self::json($user);
    }
}