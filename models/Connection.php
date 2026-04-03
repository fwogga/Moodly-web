<?php

class Connection {

    /**
     * Send a connection request from $senderId to $targetId.
     */
    public static function request($senderId, $targetId) {
        $db = Database::connect();

        if ($senderId == $targetId) return false;

        // Check no request already exists in either direction
        $stmt = $db->prepare("
            SELECT pedcon_id, pedcon_estado FROM pedido_conexao
            WHERE (pedcon_usuar_remetente_id = ? AND pedcon_usuar_destinatario_id = ?)
               OR (pedcon_usuar_remetente_id = ? AND pedcon_usuar_destinatario_id = ?)
        ");
        $stmt->execute([$senderId, $targetId, $targetId, $senderId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) return ['error' => 'already_exists', 'state' => $existing['pedcon_estado']];

        $stmt = $db->prepare("
            INSERT INTO pedido_conexao (pedcon_usuar_remetente_id, pedcon_usuar_destinatario_id, pedcon_estado)
            VALUES (?, ?, 'pendente')
        ");
        $stmt->execute([$senderId, $targetId]);

        return ['requestId' => $db->lastInsertId()];
    }

    /**
     * Accept a pending request. Only the recipient may accept.
     */
    public static function accept($requestId, $userId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            UPDATE pedido_conexao
            SET pedcon_estado = 'aceite'
            WHERE pedcon_id = ?
              AND pedcon_usuar_destinatario_id = ?
              AND pedcon_estado = 'pendente'
        ");
        $stmt->execute([$requestId, $userId]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Reject a pending request. Only the recipient may reject.
     */
    public static function reject($requestId, $userId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            UPDATE pedido_conexao
            SET pedcon_estado = 'recusado'
            WHERE pedcon_id = ?
              AND pedcon_usuar_destinatario_id = ?
              AND pedcon_estado = 'pendente'
        ");
        $stmt->execute([$requestId, $userId]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Get all accepted connections for a user, plus pending requests received.
     */
    public static function getForUser($userId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT
                pc.pedcon_id AS connection_id,
                pc.pedcon_estado AS state,
                other.usuar_id,
                other.usuar_nome,
                other.usuar_foto_perfil
            FROM pedido_conexao pc
            JOIN usuario other
                ON other.usuar_id = IF(
                    pc.pedcon_usuar_remetente_id = ?,
                    pc.pedcon_usuar_destinatario_id,
                    pc.pedcon_usuar_remetente_id
                )
            WHERE pc.pedcon_estado = 'aceite'
              AND (pc.pedcon_usuar_remetente_id = ? OR pc.pedcon_usuar_destinatario_id = ?)
            ORDER BY other.usuar_nome
        ");
        $stmt->execute([$userId, $userId, $userId]);
        $connections = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $db->prepare("
            SELECT
                pc.pedcon_id AS request_id,
                sender.usuar_id,
                sender.usuar_nome,
                sender.usuar_foto_perfil,
                pc.pedcon_criado_em AS sent_at
            FROM pedido_conexao pc
            JOIN usuario sender ON sender.usuar_id = pc.pedcon_usuar_remetente_id
            WHERE pc.pedcon_usuar_destinatario_id = ?
              AND pc.pedcon_estado = 'pendente'
            ORDER BY pc.pedcon_criado_em DESC
        ");
        $stmt->execute([$userId]);
        $pending = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'connections'      => $connections,
            'pending_requests' => $pending
        ];
    }
}
