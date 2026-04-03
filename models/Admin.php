<?php

class Admin {

    public static function getStats() {
        $db = Database::connect();

        return [
            "users"       => (int) $db->query("SELECT COUNT(*) FROM usuario")->fetchColumn(),
            "banned_users"=> (int) $db->query("SELECT COUNT(*) FROM usuario WHERE usuar_banned = 1")->fetchColumn(),
            "events"      => (int) $db->query("SELECT COUNT(*) FROM evento")->fetchColumn(),
            "messages"    => (int) $db->query("SELECT COUNT(*) FROM post")->fetchColumn(),
            "connections" => (int) $db->query("SELECT COUNT(*) FROM pedido_conexao WHERE pedcon_estado = 'aceite'")->fetchColumn(),
            "pending_reports" => (int) $db->query("SELECT COUNT(*) FROM user_report WHERE report_status = 'pending'")->fetchColumn(),
        ];
    }

    public static function getReports() {
        $db = Database::connect();

        $stmt = $db->query("
            SELECT
                r.report_id,
                r.report_reason,
                r.report_status,
                r.report_created_at,
                reporter.usuar_id   AS reporter_id,
                reporter.usuar_nome AS reporter_nome,
                reported.usuar_id   AS reported_id,
                reported.usuar_nome AS reported_nome,
                reported.usuar_banned AS reported_banned
            FROM user_report r
            JOIN usuario reporter ON reporter.usuar_id = r.report_reporter_id
            JOIN usuario reported ON reported.usuar_id = r.report_reported_id
            ORDER BY r.report_created_at DESC
        ");

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function resolveReport($reportId, $status) {
        $db = Database::connect();

        $allowed = ['reviewed', 'dismissed'];
        if (!in_array($status, $allowed)) return false;

        $stmt = $db->prepare("UPDATE user_report SET report_status = ? WHERE report_id = ?");
        return $stmt->execute([$status, $reportId]);
    }
}