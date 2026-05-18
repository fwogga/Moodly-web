<?php
/** @var string $action */
if ($action === 'report_user') {
    $userId     = requireLogin();
    $reportedId = (int)($_POST['reportedId'] ?? 0);
    $reason     = trim($_POST['reason'] ?? '');
    if (!$reportedId || !$reason) fail('Dados em falta');
    if ($reportedId === $userId) fail('Não te podes reportar a ti mesmo');

    $db = db();
    $st = $db->prepare("SELECT 1 FROM user_report WHERE report_reporter_id=? AND report_reported_id=? AND report_status='pending'");
    $st->execute([$userId, $reportedId]);
    if ($st->fetch()) fail('Já reportaste este utilizador');

    $db->prepare("INSERT INTO user_report (report_reporter_id,report_reported_id,report_reason) VALUES (?,?,?)")->execute([$userId, $reportedId, $reason]);
    ok();
}