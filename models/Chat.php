<?php

class Chat {

    /**
     * Send a message to a direct (connection) chat.
     */
    public static function sendMessage($connectionId, $userId, $message) {
        $db = Database::connect();

        $stmt = $db->prepare("
            INSERT INTO post (post_connect_id, post_usuar_id, post_conteudo, post_tipo)
            VALUES (?,?,?,'text')
        ");

        return $stmt->execute([$connectionId, $userId, $message]);
    }

    /**
     * Get all messages in a direct chat, including sender info.
     */
    public static function getMessages($connectionId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT p.*, u.usuar_nome, u.usuar_foto_perfil
            FROM post p
            JOIN usuario u ON u.usuar_id = p.post_usuar_id
            WHERE p.post_connect_id = ?
            ORDER BY p.post_data_envio ASC
        ");

        $stmt->execute([$connectionId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Send a message to an event group chat.
     * Only confirmed participants may post.
     */
    public static function sendEventMessage($eventId, $userId, $message) {
        $db = Database::connect();

        // Verify the user is a confirmed participant
        $stmt = $db->prepare("
            SELECT 1 FROM invite
            WHERE invite_evento_id = ?
              AND invite_usuar_id = ?
              AND invite_estado = 'confirmado'
        ");
        $stmt->execute([$eventId, $userId]);

        if (!$stmt->fetch()) return false;

        $stmt = $db->prepare("
            INSERT INTO group_post (gp_evento_id, gp_usuar_id, gp_conteudo)
            VALUES (?,?,?)
        ");

        return $stmt->execute([$eventId, $userId, $message]);
    }

    /**
     * Get all messages in an event group chat.
     */
    public static function getEventMessages($eventId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT gp.*, u.usuar_nome, u.usuar_foto_perfil
            FROM group_post gp
            JOIN usuario u ON u.usuar_id = gp.gp_usuar_id
            WHERE gp.gp_evento_id = ?
            ORDER BY gp.gp_data_envio ASC
        ");

        $stmt->execute([$eventId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * List all direct chats for a user, ordered by most recent message.
     */
    public static function getUserChats($userId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT
                pc.pedcon_id AS connection_id,
                other.usuar_id,
                other.usuar_nome,
                other.usuar_foto_perfil,
                last_msg.post_conteudo   AS last_message,
                last_msg.post_data_envio AS last_message_at
            FROM pedido_conexao pc
            JOIN usuario other
                ON other.usuar_id = IF(
                    pc.pedcon_usuar_remetente_id = ?,
                    pc.pedcon_usuar_destinatario_id,
                    pc.pedcon_usuar_remetente_id
                )
            LEFT JOIN post last_msg
                ON last_msg.post_connect_id = pc.pedcon_id
               AND last_msg.post_data_envio = (
                   SELECT MAX(p2.post_data_envio)
                   FROM post p2
                   WHERE p2.post_connect_id = pc.pedcon_id
               )
            WHERE pc.pedcon_estado = 'aceite'
              AND (
                  pc.pedcon_usuar_remetente_id    = ?
               OR pc.pedcon_usuar_destinatario_id = ?
              )
            ORDER BY last_msg.post_data_envio DESC
        ");

        $stmt->execute([$userId, $userId, $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}