<?php

function requireAdmin() {
    $userId = requireLogin();
    $db = db();
    $st = $db->prepare("SELECT usuar_role FROM usuario WHERE usuar_id=?");
    $st->execute([$userId]);
    $u = $st->fetch(PDO::FETCH_ASSOC);
    if (!$u || $u['usuar_role'] !== 'admin') fail('Sem permissão');
    return $userId;
}

if ($action === 'make_admin') {
    $targetId = (int)($_POST['targetId'] ?? 0);
    if (!$targetId) fail('targetId em falta');
    db()->prepare("UPDATE usuario SET usuar_role='admin' WHERE usuar_id=?")->execute([$targetId]);
    ok();
}

if ($action === 'admin_get_users') {
    requireAdmin();
    ok(db()->query("SELECT usuar_id,usuar_nome,usuar_email,usuar_role,usuar_banned,usuar_foto_perfil FROM usuario ORDER BY usuar_id DESC")->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'admin_ban') {
    requireAdmin();
    $targetId = (int)($_POST['targetId'] ?? 0);
    $banned   = (int)($_POST['banned']   ?? 1);
    db()->prepare("UPDATE usuario SET usuar_banned=? WHERE usuar_id=?")->execute([$banned, $targetId]);
    ok();
}

if ($action === 'admin_stats') {
    requireAdmin();
    $db = db();
    ok([
        'users'       => (int)$db->query("SELECT COUNT(*) FROM usuario")->fetchColumn(),
        'banned'      => (int)$db->query("SELECT COUNT(*) FROM usuario WHERE usuar_banned=1")->fetchColumn(),
        'events'      => (int)$db->query("SELECT COUNT(*) FROM evento")->fetchColumn(),
        'connections' => (int)$db->query("SELECT COUNT(*) FROM pedido_conexao WHERE pedcon_estado='aceite'")->fetchColumn(),
        'messages'    => (int)$db->query("SELECT COUNT(*) FROM post")->fetchColumn(),
        'reports'     => (int)$db->query("SELECT COUNT(*) FROM user_report WHERE report_status='pending'")->fetchColumn(),
    ]);
}

if ($action === 'admin_get_reports') {
    requireAdmin();
    ok(db()->query("
        SELECT r.*, reporter.usuar_nome AS reporter_nome, reported.usuar_nome AS reported_nome
        FROM user_report r
        JOIN usuario reporter ON reporter.usuar_id=r.report_reporter_id
        JOIN usuario reported ON reported.usuar_id=r.report_reported_id
        ORDER BY r.report_created_at DESC
    ")->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'admin_resolve_report') {
    requireAdmin();
    $reportId = (int)($_POST['reportId'] ?? 0);
    $status   = $_POST['status'] ?? '';
    if (!in_array($status, ['reviewed','dismissed'])) fail('Status inválido');
    db()->prepare("UPDATE user_report SET report_status=? WHERE report_id=?")->execute([$status, $reportId]);
    ok();
}