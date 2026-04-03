<?php

class ConnectionController extends Controller {

    public static function request() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['targetId'])) self::error("Missing targetId");

        $result = Connection::request($userId, $data['targetId']);

        if ($result === false) {
            self::error("Cannot send request to yourself");
        }

        if (isset($result['error'])) {
            self::error("Connection already exists with state: {$result['state']}");
        }

        self::success(['requestId' => $result['requestId']]);
    }

    public static function accept() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['requestId'])) self::error("Missing requestId");

        $ok = Connection::accept($data['requestId'], $userId);

        if (!$ok) self::error("Request not found or you are not the recipient");

        self::success();
    }

    public static function reject() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['requestId'])) self::error("Missing requestId");

        $ok = Connection::reject($data['requestId'], $userId);

        if (!$ok) self::error("Request not found or you are not the recipient");

        self::success();
    }

    public static function getConnections() {
        $userId = self::requireUser();
        self::json(Connection::getForUser($userId));
    }
}