<?php

class Event {

    /**
     * Create an event and insert the creator as a confirmed participant.
     * Optionally sends invites if 'invitees' array is provided.
     * $data keys: userId, title, description, location, lat, lng, date, invitees[]
     */
    public static function create($data) {
        $db = Database::connect();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("
                INSERT INTO evento
                    (evento_usuar_id, evento_titulo, evento_descricao, evento_local, evento_lat, evento_lng, evento_data, evento_estado)
                VALUES (?,?,?,?,?,?,?,'activo')
            ");
            $stmt->execute([
                $data['userId'],
                $data['title'],
                $data['description'],
                $data['location'],
                $data['lat'],
                $data['lng'],
                $data['date']
            ]);
            $eventId = $db->lastInsertId();

            // Creator is automatically confirmed
            $db->prepare("
                INSERT INTO invite (invite_evento_id, invite_usuar_id, invite_estado)
                VALUES (?,?,'confirmado')
            ")->execute([$eventId, $data['userId']]);

            // Optional invitees at creation time
            if (!empty($data['invitees']) && is_array($data['invitees'])) {
                foreach ($data['invitees'] as $inviteeId) {
                    self::sendInvite($eventId, $data['userId'], $inviteeId, $db);
                }
            }

            $db->commit();
            return $eventId;

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Invite a single user to an existing event (post-creation).
     * Only the event creator can invite.
     */
    public static function invite($eventId, $creatorId, $inviteeId) {
        $db = Database::connect();

        // Verify caller is the creator
        $stmt = $db->prepare("SELECT evento_usuar_id, evento_estado FROM evento WHERE evento_id = ?");
        $stmt->execute([$eventId]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$event) return ['error' => 'Event not found'];
        if ($event['evento_usuar_id'] != $creatorId) return ['error' => 'Only the creator can invite'];
        if ($event['evento_estado'] === 'cancelado') return ['error' => 'Cannot invite to a cancelled event'];

        // Check they are connected
        $stmt = $db->prepare("
            SELECT pedcon_id FROM pedido_conexao
            WHERE pedcon_estado = 'aceite'
              AND ((pedcon_usuar_remetente_id = ? AND pedcon_usuar_destinatario_id = ?)
                OR (pedcon_usuar_remetente_id = ? AND pedcon_usuar_destinatario_id = ?))
        ");
        $stmt->execute([$creatorId, $inviteeId, $inviteeId, $creatorId]);
        if (!$stmt->fetch()) return ['error' => 'You must be connected to invite this user'];

        // Check not already invited
        $stmt = $db->prepare("SELECT 1 FROM invite WHERE invite_evento_id = ? AND invite_usuar_id = ?");
        $stmt->execute([$eventId, $inviteeId]);
        if ($stmt->fetch()) return ['error' => 'User already invited'];

        self::sendInvite($eventId, $creatorId, $inviteeId, $db);

        return true;
    }

    /**
     * Internal helper: insert invite row + send notification message in the direct chat.
     */
    private static function sendInvite($eventId, $creatorId, $inviteeId, $db) {
        $stmt = $db->prepare("
            INSERT INTO invite (invite_evento_id, invite_usuar_id, invite_estado)
            VALUES (?,?,'pendente')
        ");
        $stmt->execute([$eventId, $inviteeId]);
        $inviteId = $db->lastInsertId();

        // Fetch event title for the message
        $stmt = $db->prepare("SELECT evento_titulo, evento_data FROM evento WHERE evento_id = ?");
        $stmt->execute([$eventId]);
        $ev = $stmt->fetch(PDO::FETCH_ASSOC);

        // Find the direct chat connection
        $stmt = $db->prepare("
            SELECT pedcon_id FROM pedido_conexao
            WHERE pedcon_estado = 'aceite'
              AND ((pedcon_usuar_remetente_id = ? AND pedcon_usuar_destinatario_id = ?)
                OR (pedcon_usuar_remetente_id = ? AND pedcon_usuar_destinatario_id = ?))
            LIMIT 1
        ");
        $stmt->execute([$creatorId, $inviteeId, $inviteeId, $creatorId]);
        $conn = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($conn && $ev) {
            $date = date('d/m/Y H:i', strtotime($ev['evento_data']));
            $message = "Convidei-te para o evento: \"{$ev['evento_titulo']}\" — {$date}";
            $stmt = $db->prepare("
                INSERT INTO post (post_connect_id, post_usuar_id, post_conteudo, post_tipo, post_invite_id)
                VALUES (?,?,?,'invite',?)
            ");
            $stmt->execute([$conn['pedcon_id'], $creatorId, $message, $inviteId]);
        }
    }

    /**
     * Get all events for a user (confirmed or pending invites, not rejected).
     */
    public static function getUserEvents($userId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT
                e.*,
                u.usuar_nome  AS organizador_nome,
                u.usuar_foto_perfil AS organizador_foto,
                i.invite_estado,
                (
                    SELECT COUNT(*) FROM invite i2
                    WHERE i2.invite_evento_id = e.evento_id
                      AND i2.invite_estado = 'confirmado'
                ) AS participantes_confirmados
            FROM evento e
            JOIN invite i ON i.invite_evento_id = e.evento_id
            JOIN usuario u ON u.usuar_id = e.evento_usuar_id
            WHERE i.invite_usuar_id = ?
              AND i.invite_estado IN ('confirmado','pendente')
            ORDER BY e.evento_data ASC
        ");

        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get confirmed + non-cancelled events with coordinates for the map.
     */
    public static function getMapEvents($userId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT
                e.evento_id,
                e.evento_titulo,
                e.evento_descricao,
                e.evento_local,
                e.evento_lat,
                e.evento_lng,
                e.evento_data,
                e.evento_estado,
                u.usuar_nome AS organizador_nome
            FROM evento e
            JOIN invite i ON i.invite_evento_id = e.evento_id
            JOIN usuario u ON u.usuar_id = e.evento_usuar_id
            WHERE i.invite_usuar_id = ?
              AND i.invite_estado = 'confirmado'
              AND e.evento_estado != 'cancelado'
              AND e.evento_lat IS NOT NULL
              AND e.evento_lng IS NOT NULL
        ");

        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get a single event's full detail including participants.
     */
    public static function getById($eventId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT e.*, u.usuar_nome AS organizador_nome, u.usuar_foto_perfil AS organizador_foto
            FROM evento e
            JOIN usuario u ON u.usuar_id = e.evento_usuar_id
            WHERE e.evento_id = ?
        ");
        $stmt->execute([$eventId]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$event) return null;

        $stmt = $db->prepare("
            SELECT u.usuar_id, u.usuar_nome, u.usuar_foto_perfil, i.invite_estado
            FROM invite i
            JOIN usuario u ON u.usuar_id = i.invite_usuar_id
            WHERE i.invite_evento_id = ?
        ");
        $stmt->execute([$eventId]);
        $event['participants'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $event;
    }

    /**
     * Creator cancels the whole event and marks all invites as cancelled.
     */
    public static function cancelEvent($eventId, $userId) {
        $db = Database::connect();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare("
                UPDATE evento SET evento_estado = 'cancelado'
                WHERE evento_id = ? AND evento_usuar_id = ?
            ");
            $stmt->execute([$eventId, $userId]);

            if ($stmt->rowCount() === 0) {
                $db->rollBack();
                return false;
            }

            $db->prepare("UPDATE invite SET invite_estado = 'cancelado' WHERE invite_evento_id = ?")
               ->execute([$eventId]);

            $db->commit();
            return true;

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    /**
     * Participant accepts their pending invite.
     */
    public static function acceptInvite($eventId, $userId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            UPDATE invite
            SET invite_estado = 'confirmado'
            WHERE invite_evento_id = ? AND invite_usuar_id = ? AND invite_estado = 'pendente'
        ");
        $stmt->execute([$eventId, $userId]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Participant declines or leaves an event.
     * The creator cannot use this — they must use cancelEvent().
     */
    public static function declineInvite($eventId, $userId) {
        $db = Database::connect();

        $stmt = $db->prepare("SELECT evento_usuar_id FROM evento WHERE evento_id = ?");
        $stmt->execute([$eventId]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($event && $event['evento_usuar_id'] == $userId) {
            return false; // creator must cancel instead
        }

        $stmt = $db->prepare("
            UPDATE invite
            SET invite_estado = 'recusado'
            WHERE invite_evento_id = ? AND invite_usuar_id = ?
              AND invite_estado IN ('pendente','confirmado')
        ");
        $stmt->execute([$eventId, $userId]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Delete a cancelled event. Only the creator can do this.
     */
    public static function deleteEvent($eventId, $userId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            DELETE FROM evento
            WHERE evento_id = ? AND evento_usuar_id = ? AND evento_estado = 'cancelado'
        ");
        $stmt->execute([$eventId, $userId]);

        return $stmt->rowCount() > 0;
    }
}