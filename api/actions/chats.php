<?php

if ($action === 'get_chats') {
    $userId = requireLogin();
    $db = db();
    $st = $db->prepare("
        SELECT pc.pedcon_id AS connection_id,
               other.usuar_id, other.usuar_nome, other.usuar_foto_perfil,
               (SELECT post_conteudo FROM post WHERE post_connect_id=pc.pedcon_id ORDER BY post_data_envio DESC LIMIT 1) AS last_message,
               (SELECT post_data_envio FROM post WHERE post_connect_id=pc.pedcon_id ORDER BY post_data_envio DESC LIMIT 1) AS last_at
        FROM pedido_conexao pc
        JOIN usuario other ON other.usuar_id = IF(pc.pedcon_usuar_remetente_id=?, pc.pedcon_usuar_destinatario_id, pc.pedcon_usuar_remetente_id)
        WHERE pc.pedcon_estado='aceite'
          AND (pc.pedcon_usuar_remetente_id=? OR pc.pedcon_usuar_destinatario_id=?)
        ORDER BY last_at DESC
    ");
    $st->execute([$userId, $userId, $userId]);
    ok($st->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'get_messages') {
    $userId = requireLogin();
    $connId = (int)($_GET['connectionId'] ?? 0);
    $db = db();
    $st = $db->prepare("SELECT 1 FROM pedido_conexao WHERE pedcon_id=? AND pedcon_estado='aceite' AND (pedcon_usuar_remetente_id=? OR pedcon_usuar_destinatario_id=?)");
    $st->execute([$connId, $userId, $userId]);
    if (!$st->fetch()) fail('Sem acesso');
    $st = $db->prepare("SELECT p.*, u.usuar_nome FROM post p JOIN usuario u ON u.usuar_id=p.post_usuar_id WHERE p.post_connect_id=? ORDER BY p.post_data_envio ASC");
    $st->execute([$connId]);
    ok($st->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'send_message') {
    $userId = requireLogin();
    $connId = (int)($_POST['connectionId'] ?? 0);
    $text   = trim($_POST['message'] ?? '');
    if (!$text) fail('Mensagem vazia');
    $db = db();
    $st = $db->prepare("SELECT 1 FROM pedido_conexao WHERE pedcon_id=? AND pedcon_estado='aceite' AND (pedcon_usuar_remetente_id=? OR pedcon_usuar_destinatario_id=?)");
    $st->execute([$connId, $userId, $userId]);
    if (!$st->fetch()) fail('Sem acesso');
    $db->prepare("INSERT INTO post (post_connect_id,post_usuar_id,post_conteudo) VALUES (?,?,?)")->execute([$connId, $userId, $text]);
    ok();
}

if ($action === 'get_event_messages') {
    $userId  = requireLogin();
    $eventId = (int)($_GET['eventId'] ?? 0);
    $db = db();
    $st = $db->prepare("SELECT 1 FROM invite WHERE invite_evento_id=? AND invite_usuar_id=? AND invite_estado='confirmado'");
    $st->execute([$eventId, $userId]);
    if (!$st->fetch()) fail('Sem acesso');
    $st = $db->prepare("SELECT gp.*, u.usuar_nome FROM group_post gp JOIN usuario u ON u.usuar_id=gp.gp_usuar_id WHERE gp.gp_evento_id=? ORDER BY gp.gp_data_envio ASC");
    $st->execute([$eventId]);
    ok($st->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'send_event_message') {
    $userId  = requireLogin();
    $eventId = (int)($_POST['eventId'] ?? 0);
    $text    = trim($_POST['message'] ?? '');
    if (!$text) fail('Mensagem vazia');
    $db = db();
    $st = $db->prepare("SELECT 1 FROM invite WHERE invite_evento_id=? AND invite_usuar_id=? AND invite_estado='confirmado'");
    $st->execute([$eventId, $userId]);
    if (!$st->fetch()) fail('Sem acesso');
    $db->prepare("INSERT INTO group_post (gp_evento_id,gp_usuar_id,gp_conteudo) VALUES (?,?,?)")->execute([$eventId, $userId, $text]);
    ok();
}