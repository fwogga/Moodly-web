<?php

class AdminController extends Controller {

    public static function users() {
        self::requireAdmin();
        self::json(User::getAll());
    }

    public static function ban() {
        self::requireAdmin();
        $data = self::getBody();

        if (!isset($data['userId'])) self::error("Missing userId");

        User::ban($data['userId']);
        self::success();
    }

    public static function unban() {
        self::requireAdmin();
        $data = self::getBody();

        if (!isset($data['userId'])) self::error("Missing userId");

        User::unban($data['userId']);
        self::success();
    }

    public static function stats() {
        self::requireAdmin();
        self::json(Admin::getStats());
    }

    public static function reports() {
        self::requireAdmin();
        self::json(Admin::getReports());
    }

    public static function resolveReport() {
        self::requireAdmin();
        $data = self::getBody();

        if (!isset($data['reportId'], $data['status'])) {
            self::error("Missing reportId or status");
        }

        $result = Admin::resolveReport($data['reportId'], $data['status']);

        if (!$result) {
            self::error("Invalid status. Use 'reviewed' or 'dismissed'");
        }

        self::success();
    }
}