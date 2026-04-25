<?php

if ($action === 'get_events') {
    $userId = requireLogin();
    $db = db();
    $st = $db->prepare("
        SELECT e.*, u.usuar_nome AS organizador, i.invite_estado,
               (SELECT COUNT(*) FROM invite i2 WHERE i2.invite_evento_id=e.evento_id AND i2.invite_estado='confirmado') AS confirmados
        FROM evento e
        JOIN invite i ON i.invite_evento_id=e.evento_id
        JOIN usuario u ON u.usuar_id=e.evento_usuar_id
        WHERE i.invite_usuar_id=? AND i.invite_estado IN ('confirmado','pendente')
        ORDER BY e.evento_data ASC
    ");
    $st->execute([$userId]);
    ok($st->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'get_map_events') {
    $userId = requireLogin();
    $db = db();
    $st = $db->prepare("
        SELECT e.evento_id, e.evento_titulo, e.evento_local, e.evento_lat, e.evento_lng, e.evento_data
        FROM evento e JOIN invite i ON i.invite_evento_id=e.evento_id
        WHERE i.invite_usuar_id=? AND i.invite_estado='confirmado'
          AND e.evento_estado!='cancelado' AND e.evento_lat IS NOT NULL
    ");
    $st->execute([$userId]);
    ok($st->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'create_event') {
    $userId      = requireLogin();
    $title       = trim($_POST['title']       ?? '');
    $description = trim($_POST['description'] ?? '');
    $location    = trim($_POST['location']    ?? '');
    $lat         = $_POST['lat'] ?? null;
    $lng         = $_POST['lng'] ?? null;
    $date        = trim($_POST['date']        ?? '');
    if (!$title || !$date) fail('Título e data são obrigatórios');

    $db = db();
    $db->prepare("INSERT INTO evento (evento_usuar_id,evento_titulo,evento_descricao,evento_local,evento_lat,evento_lng,evento_data) VALUES (?,?,?,?,?,?,?)")
       ->execute([$userId, $title, $description, $location, ($lat ?: null), ($lng ?: null), $date]);
    $eventId = (int)$db->lastInsertId();
    $db->prepare("INSERT INTO invite (invite_evento_id,invite_usuar_id,invite_estado) VALUES (?,?,'confirmado')")->execute([$eventId, $userId]);
    ok(['eventId' => $eventId]);
}

if ($action === 'invite_to_event') {
    $userId    = requireLogin();
    $eventId   = (int)($_POST['eventId']   ?? 0);
    $inviteeId = (int)($_POST['inviteeId'] ?? 0);
    if (!$eventId || !$inviteeId) fail('Dados em falta');

    $db = db();
    $st = $db->prepare("SELECT evento_usuar_id, evento_titulo, evento_data FROM evento WHERE evento_id=?");
    $st->execute([$eventId]);
    $event = $st->fetch(PDO::FETCH_ASSOC);
    if (!$event) fail('Evento não encontrado');
    if ($event['evento_usuar_id'] != $userId) fail('Só o criador pode convidar');

    $st = $db->prepare("SELECT 1 FROM pedido_conexao WHERE pedcon_estado='aceite' AND ((pedcon_usuar_remetente_id=? AND pedcon_usuar_destinatario_id=?) OR (pedcon_usuar_remetente_id=? AND pedcon_usuar_destinatario_id=?))");
    $st->execute([$userId, $inviteeId, $inviteeId, $userId]);
    if (!$st->fetch()) fail('Sem conexão com este utilizador');

    $st = $db->prepare("SELECT 1 FROM invite WHERE invite_evento_id=? AND invite_usuar_id=?");
    $st->execute([$eventId, $inviteeId]);
    if ($st->fetch()) fail('Utilizador já convidado');

    $db->prepare("INSERT INTO invite (invite_evento_id,invite_usuar_id,invite_estado) VALUES (?,?,'pendente')")->execute([$eventId, $inviteeId]);
    ok();
}

if ($action === 'accept_event') {
    $userId  = requireLogin();
    $eventId = (int)($_POST['eventId'] ?? 0);
    $st = db()->prepare("UPDATE invite SET invite_estado='confirmado' WHERE invite_evento_id=? AND invite_usuar_id=? AND invite_estado='pendente'");
    $st->execute([$eventId, $userId]);
    if (!$st->rowCount()) fail('Convite não encontrado');
    ok();
}

if ($action === 'decline_event') {
    $userId  = requireLogin();
    $eventId = (int)($_POST['eventId'] ?? 0);
    $st = db()->prepare("SELECT evento_usuar_id FROM evento WHERE evento_id=?");
    $st->execute([$eventId]);
    $ev = $st->fetch(PDO::FETCH_ASSOC);
    if ($ev && $ev['evento_usuar_id'] == $userId) fail('O criador não pode sair — cancela o evento');
    $st = db()->prepare("UPDATE invite SET invite_estado='recusado' WHERE invite_evento_id=? AND invite_usuar_id=? AND invite_estado IN ('pendente','confirmado')");
    $st->execute([$eventId, $userId]);
    if (!$st->rowCount()) fail('Convite não encontrado');
    ok();
}

if ($action === 'cancel_event') {
    $userId  = requireLogin();
    $eventId = (int)($_POST['eventId'] ?? 0);
    $db = db();
    $st = $db->prepare("UPDATE evento SET evento_estado='cancelado' WHERE evento_id=? AND evento_usuar_id=?");
    $st->execute([$eventId, $userId]);
    if (!$st->rowCount()) fail('Sem permissão');
    $db->prepare("UPDATE invite SET invite_estado='cancelado' WHERE invite_evento_id=?")->execute([$eventId]);
    ok();
}

if ($action === 'delete_event') {
    $userId  = requireLogin();
    $eventId = (int)($_POST['eventId'] ?? 0);
    $st = db()->prepare("DELETE FROM evento WHERE evento_id=? AND evento_usuar_id=? AND evento_estado='cancelado'");
    $st->execute([$eventId, $userId]);
    if (!$st->rowCount()) fail('Só é possível apagar eventos cancelados');
    ok();
}