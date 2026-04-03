<?php

class ChatController extends Controller {

    public static function sendMessage() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['connectionId'], $data['message'])) {
            self::error("Missing connectionId or message");
        }

        if (trim($data['message']) === '') {
            self::error("Message cannot be empty");
        }

        // Verify the user is part of this connection
        $db = Database::connect();
        $stmt = $db->prepare("
            SELECT 1 FROM pedido_conexao
            WHERE pedcon_id = ?
              AND pedcon_estado = 'aceite'
              AND (pedcon_usuar_remetente_id = ? OR pedcon_usuar_destinatario_id = ?)
        ");
        $stmt->execute([$data['connectionId'], $userId, $userId]);

        if (!$stmt->fetch()) {
            self::error("You are not part of this connection", 403);
        }

        Chat::sendMessage($data['connectionId'], $userId, $data['message']);

        self::success();
    }

    public static function getMessages() {
        $userId = self::requireUser();
        $connId = $_GET['connectionId'] ?? null;

        if (!$connId) self::error("Missing connectionId");

        // Verify the user is part of this connection
        $db = Database::connect();
        $stmt = $db->prepare("
            SELECT 1 FROM pedido_conexao
            WHERE pedcon_id = ?
              AND pedcon_estado = 'aceite'
              AND (pedcon_usuar_remetente_id = ? OR pedcon_usuar_destinatario_id = ?)
        ");
        $stmt->execute([$connId, $userId, $userId]);

        if (!$stmt->fetch()) {
            self::error("You are not part of this connection", 403);
        }

        self::json(Chat::getMessages($connId));
    }

    public static function getChats() {
        $userId = self::requireUser();
        self::json(Chat::getUserChats($userId));
    }

    public static function sendEventMessage() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['eventId'], $data['message'])) {
            self::error("Missing eventId or message");
        }

        if (trim($data['message']) === '') {
            self::error("Message cannot be empty");
        }

        $result = Chat::sendEventMessage($data['eventId'], $userId, $data['message']);

        if (!$result) {
            self::error("You are not a confirmed participant of this event", 403);
        }

        self::success();
    }

    public static function getEventMessages() {
        $userId = self::requireUser();
        $eventId = $_GET['eventId'] ?? null;

        if (!$eventId) self::error("Missing eventId");

        // Verify user is a participant
        $db = Database::connect();
        $stmt = $db->prepare("
            SELECT 1 FROM invite
            WHERE invite_evento_id = ? AND invite_usuar_id = ? AND invite_estado = 'confirmado'
        ");
        $stmt->execute([$eventId, $userId]);

        if (!$stmt->fetch()) {
            self::error("You are not a confirmed participant of this event", 403);
        }

        self::json(Chat::getEventMessages($eventId));
    }
}