<?php

class User {

    public static function findByEmail($email) {
        $db = Database::connect();
        $stmt = $db->prepare("SELECT * FROM usuario WHERE usuar_email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function findById($id) {
        $db = Database::connect();
        $stmt = $db->prepare("
            SELECT usuar_id, usuar_nome, usuar_email, usuar_foto_perfil, usuar_role, usuar_banned
            FROM usuario WHERE usuar_id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function create($name, $email, $password) {
        $db = Database::connect();
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("
            INSERT INTO usuario (usuar_nome, usuar_email, usuar_senha_hash)
            VALUES (?,?,?)
        ");
        $stmt->execute([$name, $email, $hash]);
        return $db->lastInsertId();
    }

    /**
     * Search users by name. Excludes banned users.
     */
    public static function search($query) {
        $db = Database::connect();
        $stmt = $db->prepare("
            SELECT usuar_id, usuar_nome, usuar_foto_perfil
            FROM usuario
            WHERE usuar_nome LIKE ?
              AND usuar_banned = 0
            LIMIT 20
        ");
        $stmt->execute(["%$query%"]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Discover users for the swipe screen.
     * - Excludes self
     * - Excludes banned users
     * - Excludes users already connected or with a pending request either way
     * - Prioritises users who sent a pending request TO the current user
     * - Then scores by shared interest tags
     */
    public static function discover($userId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT
                u.usuar_id,
                u.usuar_nome,
                u.usuar_foto_perfil,
                COUNT(DISTINCT ui2.usint_subinter_id) AS score,
                -- priority: 1 if they already swiped right on us and we haven't responded
                MAX(
                    CASE WHEN pc.pedcon_usuar_remetente_id = u.usuar_id
                              AND pc.pedcon_usuar_destinatario_id = ?
                              AND pc.pedcon_estado = 'pendente'
                    THEN 1 ELSE 0 END
                ) AS has_pending_request
            FROM usuario u
            LEFT JOIN usuario_interesse ui1
                ON ui1.usint_usuar_id = ?
            LEFT JOIN usuario_interesse ui2
                ON ui2.usint_usuar_id = u.usuar_id
               AND ui2.usint_subinter_id = ui1.usint_subinter_id
            LEFT JOIN pedido_conexao pc
                ON (pc.pedcon_usuar_remetente_id = ? AND pc.pedcon_usuar_destinatario_id = u.usuar_id)
                OR (pc.pedcon_usuar_remetente_id = u.usuar_id AND pc.pedcon_usuar_destinatario_id = ?)
            WHERE u.usuar_id != ?
              AND u.usuar_banned = 0
              -- exclude users with any connection request already (pending, accepted, rejected)
              AND NOT EXISTS (
                  SELECT 1 FROM pedido_conexao pc2
                  WHERE (pc2.pedcon_usuar_remetente_id = ? AND pc2.pedcon_usuar_destinatario_id = u.usuar_id)
                     OR (pc2.pedcon_usuar_remetente_id = u.usuar_id AND pc2.pedcon_usuar_destinatario_id = ?)
              )
            GROUP BY u.usuar_id, u.usuar_nome, u.usuar_foto_perfil
            ORDER BY has_pending_request DESC, score DESC
            LIMIT 20
        ");

        // Note: the LEFT JOIN on pedido_conexao is for the has_pending_request column;
        // the NOT EXISTS sub-query actually does the exclusion. Both are needed.
        $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId, $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function ban($userId) {
        $db = Database::connect();
        $stmt = $db->prepare("UPDATE usuario SET usuar_banned = 1 WHERE usuar_id = ?");
        return $stmt->execute([$userId]);
    }

    public static function unban($userId) {
        $db = Database::connect();
        $stmt = $db->prepare("UPDATE usuario SET usuar_banned = 0 WHERE usuar_id = ?");
        return $stmt->execute([$userId]);
    }

    /**
     * Returns all users for admin — never includes the password hash.
     */
    public static function getAll() {
        $db = Database::connect();
        return $db->query("
            SELECT usuar_id, usuar_nome, usuar_email, usuar_foto_perfil, usuar_role, usuar_banned
            FROM usuario
            ORDER BY usuar_id DESC
        ")->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function updateName($userId, $name) {
        $db = Database::connect();
        $stmt = $db->prepare("UPDATE usuario SET usuar_nome = ? WHERE usuar_id = ?");
        return $stmt->execute([$name, $userId]);
    }

    public static function updatePhoto($userId, $photoPath) {
        $db = Database::connect();
        $stmt = $db->prepare("UPDATE usuario SET usuar_foto_perfil = ? WHERE usuar_id = ?");
        return $stmt->execute([$photoPath, $userId]);
    }

    /**
     * Get a user's full public profile including their interest tags and connection count.
     */
    public static function getProfile($userId) {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT usuar_id, usuar_nome, usuar_foto_perfil
            FROM usuario WHERE usuar_id = ? AND usuar_banned = 0
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) return null;

        // Interests
        $stmt = $db->prepare("
            SELECT s.subinter_id, s.subinter_nome, i.inter_nome AS categoria
            FROM usuario_interesse ui
            JOIN subinteresse s ON s.subinter_id = ui.usint_subinter_id
            JOIN interesse i ON i.inter_id = s.subinter_inter_id
            WHERE ui.usint_usuar_id = ?
        ");
        $stmt->execute([$userId]);
        $user['interests'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Connection count
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM pedido_conexao
            WHERE (pedcon_usuar_remetente_id = ? OR pedcon_usuar_destinatario_id = ?)
              AND pedcon_estado = 'aceite'
        ");
        $stmt->execute([$userId, $userId]);
        $user['connection_count'] = (int) $stmt->fetchColumn();

        return $user;
    }
}