<?php

if ($action === 'get_connections') {
    $userId = requireLogin();
    $db = db();

    $st = $db->prepare("
        SELECT pc.pedcon_id AS connection_id, other.usuar_id, other.usuar_nome, other.usuar_foto_perfil
        FROM pedido_conexao pc
        JOIN usuario other ON other.usuar_id = IF(pc.pedcon_usuar_remetente_id=?, pc.pedcon_usuar_destinatario_id, pc.pedcon_usuar_remetente_id)
        WHERE pc.pedcon_estado='aceite'
          AND (pc.pedcon_usuar_remetente_id=? OR pc.pedcon_usuar_destinatario_id=?)
    ");
    $st->execute([$userId, $userId, $userId]);
    $connections = $st->fetchAll(PDO::FETCH_ASSOC);

    $st = $db->prepare("
        SELECT pc.pedcon_id AS request_id, u.usuar_id, u.usuar_nome, u.usuar_foto_perfil
        FROM pedido_conexao pc
        JOIN usuario u ON u.usuar_id = pc.pedcon_usuar_remetente_id
        WHERE pc.pedcon_usuar_destinatario_id=? AND pc.pedcon_estado='pendente'
    ");
    $st->execute([$userId]);
    ok(['connections' => $connections, 'pending' => $st->fetchAll(PDO::FETCH_ASSOC)]);
}

if ($action === 'send_request') {
    $userId   = requireLogin();
    $targetId = (int)($_POST['targetId'] ?? 0);
    if (!$targetId || $targetId === $userId) fail('Pedido inválido');

    $db = db();
    $st = $db->prepare("
        SELECT 1 FROM pedido_conexao
        WHERE (pedcon_usuar_remetente_id=? AND pedcon_usuar_destinatario_id=?)
           OR (pedcon_usuar_remetente_id=? AND pedcon_usuar_destinatario_id=?)
    ");
    $st->execute([$userId, $targetId, $targetId, $userId]);
    if ($st->fetch()) fail('Já existe um pedido');

    $db->prepare("INSERT INTO pedido_conexao (pedcon_usuar_remetente_id, pedcon_usuar_destinatario_id) VALUES (?,?)")
       ->execute([$userId, $targetId]);
    ok(['requestId' => (int)$db->lastInsertId()]);
}

if ($action === 'accept_request') {
    $userId    = requireLogin();
    $requestId = (int)($_POST['requestId'] ?? 0);
    $st = db()->prepare("
        UPDATE pedido_conexao SET pedcon_estado='aceite'
        WHERE pedcon_id=? AND pedcon_usuar_destinatario_id=? AND pedcon_estado='pendente'
    ");
    $st->execute([$requestId, $userId]);
    if (!$st->rowCount()) fail('Pedido não encontrado');
    ok();
}

if ($action === 'reject_request') {
    $userId    = requireLogin();
    $requestId = (int)($_POST['requestId'] ?? 0);
    $st = db()->prepare("
        UPDATE pedido_conexao SET pedcon_estado='recusado'
        WHERE pedcon_id=? AND pedcon_usuar_destinatario_id=? AND pedcon_estado='pendente'
    ");
    $st->execute([$requestId, $userId]);
    if (!$st->rowCount()) fail('Pedido não encontrado');
    ok();
}