<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

function ok($data = []) { echo json_encode(['ok' => true, 'data' => $data]); exit; }
function fail($msg)      { echo json_encode(['ok' => false, 'error' => $msg]); exit; }

function requireLogin() {
if (!empty($_SESSION['user_id'])) return (int)$_SESSION['user_id'];
    $id = $_POST['userId'] ?? $_GET['userId'] ?? null;
    if ($id && is_numeric($id)) return (int)$id;
    fail('Não autenticado');
}

switch ($action) {

    // login e registo

    case 'register': {
        $name  = trim($_POST['name']  ?? '');
        $email = trim($_POST['email'] ?? '');
        $pass  = $_POST['password']   ?? '';
        if (!$name || !$email || !$pass) fail('Preenche todos os campos');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Email inválido');

        $db = db();
        $st = $db->prepare("SELECT usuar_id FROM usuario WHERE usuar_email = ?");
        $st->execute([$email]);
        if ($st->fetch()) fail('Email já registado');

        $hash = password_hash($pass, PASSWORD_DEFAULT);
        $db->prepare("INSERT INTO usuario (usuar_nome, usuar_email, usuar_senha_hash) VALUES (?,?,?)")
           ->execute([$name, $email, $hash]);
        $id = (int)$db->lastInsertId();
        $_SESSION['user_id']   = $id;
        $_SESSION['user_name'] = $name;
        ok(['userId' => $id, 'name' => $name]);
    }

    case 'login': {
        $email = trim($_POST['email'] ?? '');
        $pass  = $_POST['password']  ?? '';
        if (!$email || !$pass) fail('Preenche todos os campos');
        $db = db();
        $st = $db->prepare("SELECT * FROM usuario WHERE usuar_email = ?");
        $st->execute([$email]);
        $user = $st->fetch(PDO::FETCH_ASSOC);
        if (!$user || !password_verify($pass, $user['usuar_senha_hash'])) fail('Credenciais inválidas');
        if ($user['usuar_banned']) fail('Conta suspensa');
        $_SESSION['user_id']   = $user['usuar_id'];
        $_SESSION['user_name'] = $user['usuar_nome'];
        ok(['userId' => $user['usuar_id'], 'name' => $user['usuar_nome'], 'photo' => $user['usuar_foto_perfil'], 'role' => $user['usuar_role']]);
    }

    case 'logout': {
        session_destroy();
        ok();
    }

    case 'check_session': {
        if (!empty($_SESSION['user_id'])) ok(['userId' => (int)$_SESSION['user_id'], 'name' => $_SESSION['user_name']]);
        fail('Sem sessão');
    }

    // INTERESSEs

    case 'get_interests': {
        $db   = db();
        $rows = $db->query("
            SELECT i.inter_id, i.inter_nome AS categoria, s.subinter_id, s.subinter_nome AS tag
            FROM interesse i
            JOIN subinteresse s ON s.subinter_inter_id = i.inter_id
            ORDER BY i.inter_nome, s.subinter_nome
        ")->fetchAll(PDO::FETCH_ASSOC);
        $grouped = [];
        foreach ($rows as $r) {
            $cat = $r['categoria'];
            if (!isset($grouped[$cat])) $grouped[$cat] = ['id' => $r['inter_id'], 'nome' => $cat, 'tags' => []];
            $grouped[$cat]['tags'][] = ['id' => $r['subinter_id'], 'nome' => $r['tag']];
        }
        ok(array_values($grouped));
    }

    case 'search_interests': {
        // restringir resultaos a uma categoria
        $q        = trim($_GET['q']        ?? '');
        $categoria = trim($_GET['categoria'] ?? '');
        $db = db();

        if ($categoria) {
            $st = $db->prepare("
                SELECT s.subinter_id AS id, s.subinter_nome AS tag, i.inter_nome AS categoria
                FROM subinteresse s
                JOIN interesse i ON i.inter_id = s.subinter_inter_id
                WHERE s.subinter_nome LIKE ? AND i.inter_nome = ?
                ORDER BY s.subinter_nome LIMIT 10
            ");
            $st->execute([$q . '%', $categoria]);
        } else {
            $st = $db->prepare("
                SELECT s.subinter_id AS id, s.subinter_nome AS tag, i.inter_nome AS categoria
                FROM subinteresse s
                JOIN interesse i ON i.inter_id = s.subinter_inter_id
                WHERE s.subinter_nome LIKE ?
                ORDER BY s.subinter_nome LIMIT 10
            ");
            $st->execute([$q . '%']);
        }
        ok($st->fetchAll(PDO::FETCH_ASSOC));
    }

    case 'find_or_create_interest': {
        requireLogin();
        $name      = trim($_POST['name']      ?? '');
        $categoria = trim($_POST['categoria'] ?? '');
        if (!$name) fail('Nome inválido');

        $db = db();

        // match na categoria dada
        if ($categoria) {
            $st = $db->prepare("
                SELECT s.subinter_id AS id, s.subinter_nome AS nome, i.inter_nome AS categoria
                FROM subinteresse s
                JOIN interesse i ON i.inter_id = s.subinter_inter_id
                WHERE LOWER(s.subinter_nome) = LOWER(?) AND i.inter_nome = ?
                LIMIT 1
            ");
            $st->execute([$name, $categoria]);
        } else {
            $st = $db->prepare("
                SELECT s.subinter_id AS id, s.subinter_nome AS nome, i.inter_nome AS categoria
                FROM subinteresse s
                JOIN interesse i ON i.inter_id = s.subinter_inter_id
                WHERE LOWER(s.subinter_nome) = LOWER(?)
                LIMIT 1
            ");
            $st->execute([$name]);
        }
        $existing = $st->fetch(PDO::FETCH_ASSOC);
        if ($existing) ok($existing);

        // categoria por id
        if ($categoria) {
            $st = $db->prepare("SELECT inter_id FROM interesse WHERE inter_nome = ?");
            $st->execute([$categoria]);
            $catId = (int)$st->fetchColumn();
            if (!$catId) fail('Categoria inválida');
        } else {
            $catId = (int)$db->query("SELECT inter_id FROM interesse ORDER BY inter_id LIMIT 1")->fetchColumn();
        }

        $db->prepare("INSERT INTO subinteresse (subinter_inter_id, subinter_nome) VALUES (?,?)")
           ->execute([$catId, $name]);
        $newId = (int)$db->lastInsertId();

        $st = $db->prepare("
            SELECT s.subinter_id AS id, s.subinter_nome AS nome, i.inter_nome AS categoria
            FROM subinteresse s
            JOIN interesse i ON i.inter_id = s.subinter_inter_id
            WHERE s.subinter_id = ?
        ");
        $st->execute([$newId]);
        ok($st->fetch(PDO::FETCH_ASSOC));
    }

    case 'set_interests': {
        $userId = requireLogin();
        $tags   = json_decode($_POST['tags'] ?? '[]', true);
        if (!is_array($tags)) fail('Tags inválidas');
        $db = db();
        $db->prepare("DELETE FROM usuario_interesse WHERE usint_usuar_id = ?")->execute([$userId]);
        foreach ($tags as $tagId) {
            $tagId = (int)$tagId;
            if (!$tagId) continue;
            $db->prepare("INSERT IGNORE INTO usuario_interesse (usint_usuar_id, usint_subinter_id) VALUES (?,?)")
               ->execute([$userId, $tagId]);
        }
        ok();
    }

    // USER

    case 'search_users': {
        requireLogin();
        $q  = trim($_GET['q'] ?? '');
        $db = db();
        $st = $db->prepare("SELECT usuar_id, usuar_nome, usuar_foto_perfil FROM usuario WHERE usuar_nome LIKE ? AND usuar_banned = 0 LIMIT 20");
        $st->execute(['%' . $q . '%']);
        ok($st->fetchAll(PDO::FETCH_ASSOC));
    }

    case 'discover': {
        $userId = requireLogin();
        $db = db();

        // primeiro mostra quem teve interesse
        // depois mostra quem partilha interesses
        $st = $db->prepare("
            SELECT u.usuar_id, u.usuar_nome, u.usuar_foto_perfil,
                   COUNT(DISTINCT ui2.usint_subinter_id) AS score,
                   MAX(CASE WHEN pc2.pedcon_usuar_remetente_id = u.usuar_id THEN 1 ELSE 0 END) AS sent_me_request
            FROM usuario u
            LEFT JOIN usuario_interesse ui1 ON ui1.usint_usuar_id = ?
            LEFT JOIN usuario_interesse ui2
                ON ui2.usint_usuar_id = u.usuar_id
               AND ui2.usint_subinter_id = ui1.usint_subinter_id
            LEFT JOIN pedido_conexao pc2
                ON pc2.pedcon_usuar_remetente_id = u.usuar_id
               AND pc2.pedcon_usuar_destinatario_id = ?
               AND pc2.pedcon_estado = 'pendente'
            WHERE u.usuar_id != ? AND u.usuar_banned = 0
              AND NOT EXISTS (
                  SELECT 1 FROM pedido_conexao pc
                  WHERE (pc.pedcon_usuar_remetente_id = ? AND pc.pedcon_usuar_destinatario_id = u.usuar_id)
                     OR (pc.pedcon_usuar_remetente_id = u.usuar_id AND pc.pedcon_usuar_destinatario_id = ?)
              )
            GROUP BY u.usuar_id
            ORDER BY sent_me_request DESC, score DESC
            LIMIT 30
        ");
        $st->execute([$userId, $userId, $userId, $userId, $userId]);
        $users = $st->fetchAll(PDO::FETCH_ASSOC);

        foreach ($users as &$u) {
            $st2 = $db->prepare("
                SELECT s.subinter_id, s.subinter_nome AS tag, i.inter_nome AS categoria
                FROM usuario_interesse ui
                JOIN subinteresse s ON s.subinter_id = ui.usint_subinter_id
                JOIN interesse i ON i.inter_id = s.subinter_inter_id
                WHERE ui.usint_usuar_id = ?
            ");
            $st2->execute([$u['usuar_id']]);
            $u['interests'] = $st2->fetchAll(PDO::FETCH_ASSOC);
        }
        ok($users);
    }

    case 'get_profile': {
        $userId   = requireLogin();
        $targetId = (int)($_GET['targetId'] ?? $userId);
        $db = db();
        $st = $db->prepare("SELECT usuar_id, usuar_nome, usuar_foto_perfil FROM usuario WHERE usuar_id = ?");
        $st->execute([$targetId]);
        $user = $st->fetch(PDO::FETCH_ASSOC);
        if (!$user) fail('Utilizador não encontrado');
        $st = $db->prepare("
            SELECT s.subinter_id, s.subinter_nome AS tag, i.inter_nome AS categoria
            FROM usuario_interesse ui
            JOIN subinteresse s ON s.subinter_id = ui.usint_subinter_id
            JOIN interesse i ON i.inter_id = s.subinter_inter_id
            WHERE ui.usint_usuar_id = ?
        ");
        $st->execute([$targetId]);
        $user['interests'] = $st->fetchAll(PDO::FETCH_ASSOC);
        $st = $db->prepare("SELECT COUNT(*) FROM pedido_conexao WHERE (pedcon_usuar_remetente_id=? OR pedcon_usuar_destinatario_id=?) AND pedcon_estado='aceite'");
        $st->execute([$targetId, $targetId]);
        $user['connection_count'] = (int)$st->fetchColumn();
        ok($user);
    }

    case 'update_profile': {
        $userId = requireLogin();
        $name   = trim($_POST['name'] ?? '');
        if (!$name) fail('Nome inválido');
        db()->prepare("UPDATE usuario SET usuar_nome = ? WHERE usuar_id = ?")->execute([$name, $userId]);
        $_SESSION['user_name'] = $name;
        ok();
    }

    case 'upload_photo': {
        $userId = requireLogin();
        if (empty($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) fail('Erro no upload');
        $file    = $_FILES['photo'];
        $allowed = ['image/jpeg','image/png','image/webp'];
        $finfo   = new finfo(FILEINFO_MIME_TYPE);
        $mime    = $finfo->file($file['tmp_name']);
        if (!in_array($mime, $allowed)) fail('Tipo de ficheiro inválido');
        if ($file['size'] > 5 * 1024 * 1024) fail('Ficheiro demasiado grande');
        $ext = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$mime];
        $dir = __DIR__ . '/../uploads/';
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $db  = db();
        $st  = $db->prepare("SELECT usuar_foto_perfil FROM usuario WHERE usuar_id = ?");
        $st->execute([$userId]);
        $old = $st->fetchColumn();
        if ($old && file_exists(__DIR__ . '/../' . $old)) unlink(__DIR__ . '/../' . $old);
        $filename = "user_{$userId}_" . time() . ".{$ext}";
        move_uploaded_file($file['tmp_name'], $dir . $filename);
        $path = "uploads/{$filename}";
        $db->prepare("UPDATE usuario SET usuar_foto_perfil = ? WHERE usuar_id = ?")->execute([$path, $userId]);
        ok(['photo' => $path]);
    }

    // CONEXAO

    case 'get_connections': {
        $userId = requireLogin();
        $db = db();
        $st = $db->prepare("
            SELECT pc.pedcon_id AS connection_id, other.usuar_id, other.usuar_nome, other.usuar_foto_perfil
            FROM pedido_conexao pc
            JOIN usuario other ON other.usuar_id = IF(pc.pedcon_usuar_remetente_id=?, pc.pedcon_usuar_destinatario_id, pc.pedcon_usuar_remetente_id)
            WHERE pc.pedcon_estado='aceite' AND (pc.pedcon_usuar_remetente_id=? OR pc.pedcon_usuar_destinatario_id=?)
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

    case 'send_request': {
        $userId   = requireLogin();
        $targetId = (int)($_POST['targetId'] ?? 0);
        if (!$targetId || $targetId === $userId) fail('Pedido inválido');
        $db = db();
        $st = $db->prepare("SELECT 1 FROM pedido_conexao WHERE (pedcon_usuar_remetente_id=? AND pedcon_usuar_destinatario_id=?) OR (pedcon_usuar_remetente_id=? AND pedcon_usuar_destinatario_id=?)");
        $st->execute([$userId, $targetId, $targetId, $userId]);
        if ($st->fetch()) fail('Já existe um pedido');
        $db->prepare("INSERT INTO pedido_conexao (pedcon_usuar_remetente_id, pedcon_usuar_destinatario_id) VALUES (?,?)")->execute([$userId, $targetId]);
        ok(['requestId' => (int)$db->lastInsertId()]);
    }

    case 'accept_request': {
        $userId    = requireLogin();
        $requestId = (int)($_POST['requestId'] ?? 0);
        $st = db()->prepare("UPDATE pedido_conexao SET pedcon_estado='aceite' WHERE pedcon_id=? AND pedcon_usuar_destinatario_id=? AND pedcon_estado='pendente'");
        $st->execute([$requestId, $userId]);
        if (!$st->rowCount()) fail('Pedido não encontrado');
        ok();
    }

    case 'reject_request': {
        $userId    = requireLogin();
        $requestId = (int)($_POST['requestId'] ?? 0);
        $st = db()->prepare("UPDATE pedido_conexao SET pedcon_estado='recusado' WHERE pedcon_id=? AND pedcon_usuar_destinatario_id=? AND pedcon_estado='pendente'");
        $st->execute([$requestId, $userId]);
        if (!$st->rowCount()) fail('Pedido não encontrado');
        ok();
    }

    // Eventos

    case 'get_events': {
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

    case 'get_map_events': {
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

    case 'create_event': {
        $userId = requireLogin();
        $title  = trim($_POST['title']       ?? '');
        $desc   = trim($_POST['description'] ?? '');
        $local  = trim($_POST['location']    ?? '');
        $lat    = $_POST['lat'] ?? null;
        $lng    = $_POST['lng'] ?? null;
        $date   = trim($_POST['date']        ?? '');
        if (!$title || !$date) fail('Título e data são obrigatórios');
        $db = db();
        $db->prepare("INSERT INTO evento (evento_usuar_id,evento_titulo,evento_descricao,evento_local,evento_lat,evento_lng,evento_data) VALUES (?,?,?,?,?,?,?)")
           ->execute([$userId, $title, $desc, $local, $lat ?: null, $lng ?: null, $date]);
        $eventId = (int)$db->lastInsertId();
        $db->prepare("INSERT INTO invite (invite_evento_id,invite_usuar_id,invite_estado) VALUES (?,?,'confirmado')")->execute([$eventId, $userId]);
        ok(['eventId' => $eventId]);
    }

    case 'invite_to_event': {
        $userId    = requireLogin();
        $eventId   = (int)($_POST['eventId']   ?? 0);
        $inviteeId = (int)($_POST['inviteeId'] ?? 0);
        if (!$eventId || !$inviteeId) fail('Dados em falta');
        $db = db();
        $st = $db->prepare("SELECT evento_usuar_id, evento_titulo, evento_data FROM evento WHERE evento_id=?");
        $st->execute([$eventId]);
        $ev = $st->fetch(PDO::FETCH_ASSOC);
        if (!$ev) fail('Evento não encontrado');
        if ($ev['evento_usuar_id'] != $userId) fail('Só o criador pode convidar');
        $st = $db->prepare("SELECT 1 FROM pedido_conexao WHERE pedcon_estado='aceite' AND ((pedcon_usuar_remetente_id=? AND pedcon_usuar_destinatario_id=?) OR (pedcon_usuar_remetente_id=? AND pedcon_usuar_destinatario_id=?))");
        $st->execute([$userId, $inviteeId, $inviteeId, $userId]);
        if (!$st->fetch()) fail('Sem conexão com este utilizador');
        $st = $db->prepare("SELECT 1 FROM invite WHERE invite_evento_id=? AND invite_usuar_id=?");
        $st->execute([$eventId, $inviteeId]);
        if ($st->fetch()) fail('Utilizador já convidado');
        $db->prepare("INSERT INTO invite (invite_evento_id,invite_usuar_id,invite_estado) VALUES (?,?,'pendente')")->execute([$eventId, $inviteeId]);
        $st = $db->prepare("SELECT pedcon_id FROM pedido_conexao WHERE pedcon_estado='aceite' AND ((pedcon_usuar_remetente_id=? AND pedcon_usuar_destinatario_id=?) OR (pedcon_usuar_remetente_id=? AND pedcon_usuar_destinatario_id=?)) LIMIT 1");
        $st->execute([$userId, $inviteeId, $inviteeId, $userId]);
        $conn = $st->fetch(PDO::FETCH_ASSOC);
        if ($conn) {
            $db->prepare("INSERT INTO post (post_connect_id,post_usuar_id,post_conteudo,post_tipo) VALUES (?,?,?,'invite')")
               ->execute([$conn['pedcon_id'], $userId, "Convidei-te para o evento: \"{$ev['evento_titulo']}\" — {$ev['evento_data']}"]);
        }
        ok();
    }

    case 'accept_event': {
        $userId  = requireLogin();
        $eventId = (int)($_POST['eventId'] ?? 0);
        $st = db()->prepare("UPDATE invite SET invite_estado='confirmado' WHERE invite_evento_id=? AND invite_usuar_id=? AND invite_estado='pendente'");
        $st->execute([$eventId, $userId]);
        if (!$st->rowCount()) fail('Convite não encontrado');
        ok();
    }

    case 'decline_event': {
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

    case 'cancel_event': {
        $userId  = requireLogin();
        $eventId = (int)($_POST['eventId'] ?? 0);
        $db = db();
        $st = $db->prepare("UPDATE evento SET evento_estado='cancelado' WHERE evento_id=? AND evento_usuar_id=?");
        $st->execute([$eventId, $userId]);
        if (!$st->rowCount()) fail('Evento não encontrado ou sem permissão');
        $db->prepare("UPDATE invite SET invite_estado='cancelado' WHERE invite_evento_id=?")->execute([$eventId]);
        ok();
    }

    case 'delete_event': {
        $userId  = requireLogin();
        $eventId = (int)($_POST['eventId'] ?? 0);
        $st = db()->prepare("DELETE FROM evento WHERE evento_id=? AND evento_usuar_id=? AND evento_estado='cancelado'");
        $st->execute([$eventId, $userId]);
        if (!$st->rowCount()) fail('Só é possível apagar eventos cancelados');
        ok();
    }

    // CHAT

    case 'get_chats': {
        $userId = requireLogin();
        $db = db();
        $st = $db->prepare("
            SELECT pc.pedcon_id AS connection_id,
                   other.usuar_id, other.usuar_nome, other.usuar_foto_perfil,
                   (SELECT post_conteudo FROM post WHERE post_connect_id=pc.pedcon_id ORDER BY post_data_envio DESC LIMIT 1) AS last_message,
                   (SELECT post_data_envio FROM post WHERE post_connect_id=pc.pedcon_id ORDER BY post_data_envio DESC LIMIT 1) AS last_at
            FROM pedido_conexao pc
            JOIN usuario other ON other.usuar_id = IF(pc.pedcon_usuar_remetente_id=?, pc.pedcon_usuar_destinatario_id, pc.pedcon_usuar_remetente_id)
            WHERE pc.pedcon_estado='aceite' AND (pc.pedcon_usuar_remetente_id=? OR pc.pedcon_usuar_destinatario_id=?)
            ORDER BY last_at DESC
        ");
        $st->execute([$userId, $userId, $userId]);
        ok($st->fetchAll(PDO::FETCH_ASSOC));
    }

    case 'get_messages': {
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

    case 'send_message': {
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

    case 'get_event_messages': {
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

    case 'send_event_message': {
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

    // Report

    case 'report_user': {
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

    // Adm

    case 'admin_get_users': {
        $userId = requireLogin();
        $db = db();
        $st = $db->prepare("SELECT usuar_role FROM usuario WHERE usuar_id=?"); $st->execute([$userId]);
        $u = $st->fetch(PDO::FETCH_ASSOC);
        if (!$u || $u['usuar_role'] !== 'admin') fail('Sem permissão');
        ok($db->query("SELECT usuar_id,usuar_nome,usuar_email,usuar_role,usuar_banned FROM usuario ORDER BY usuar_id DESC")->fetchAll(PDO::FETCH_ASSOC));
    }

    case 'admin_ban': {
        $userId   = requireLogin();
        $targetId = (int)($_POST['targetId'] ?? 0);
        $banned   = (int)($_POST['banned']   ?? 1);
        $db = db();
        $st = $db->prepare("SELECT usuar_role FROM usuario WHERE usuar_id=?"); $st->execute([$userId]);
        $u = $st->fetch(PDO::FETCH_ASSOC);
        if (!$u || $u['usuar_role'] !== 'admin') fail('Sem permissão');
        $db->prepare("UPDATE usuario SET usuar_banned=? WHERE usuar_id=?")->execute([$banned, $targetId]);
        ok();
    }

    case 'admin_stats': {
        $userId = requireLogin();
        $db = db();
        $st = $db->prepare("SELECT usuar_role FROM usuario WHERE usuar_id=?"); $st->execute([$userId]);
        $u = $st->fetch(PDO::FETCH_ASSOC);
        if (!$u || $u['usuar_role'] !== 'admin') fail('Sem permissão');
        ok([
            'users'       => (int)$db->query("SELECT COUNT(*) FROM usuario")->fetchColumn(),
            'banned'      => (int)$db->query("SELECT COUNT(*) FROM usuario WHERE usuar_banned=1")->fetchColumn(),
            'events'      => (int)$db->query("SELECT COUNT(*) FROM evento")->fetchColumn(),
            'connections' => (int)$db->query("SELECT COUNT(*) FROM pedido_conexao WHERE pedcon_estado='aceite'")->fetchColumn(),
            'messages'    => (int)$db->query("SELECT COUNT(*) FROM post")->fetchColumn(),
            'reports'     => (int)$db->query("SELECT COUNT(*) FROM user_report WHERE report_status='pending'")->fetchColumn(),
        ]);
    }

    case 'admin_get_reports': {
        $userId = requireLogin();
        $db = db();
        $st = $db->prepare("SELECT usuar_role FROM usuario WHERE usuar_id=?"); $st->execute([$userId]);
        $u = $st->fetch(PDO::FETCH_ASSOC);
        if (!$u || $u['usuar_role'] !== 'admin') fail('Sem permissão');
        ok($db->query("
            SELECT r.*, reporter.usuar_nome AS reporter_nome, reported.usuar_nome AS reported_nome
            FROM user_report r
            JOIN usuario reporter ON reporter.usuar_id=r.report_reporter_id
            JOIN usuario reported ON reported.usuar_id=r.report_reported_id
            ORDER BY r.report_created_at DESC
        ")->fetchAll(PDO::FETCH_ASSOC));
    }

    case 'admin_resolve_report': {
        $userId   = requireLogin();
        $reportId = (int)($_POST['reportId'] ?? 0);
        $status   = $_POST['status'] ?? '';
        if (!in_array($status, ['reviewed','dismissed'])) fail('Status inválido');
        $db = db();
        $st = $db->prepare("SELECT usuar_role FROM usuario WHERE usuar_id=?"); $st->execute([$userId]);
        $u = $st->fetch(PDO::FETCH_ASSOC);
        if (!$u || $u['usuar_role'] !== 'admin') fail('Sem permissão');
        $db->prepare("UPDATE user_report SET report_status=? WHERE report_id=?")->execute([$status, $reportId]);
        ok();
    }

    default:
        fail('Ação desconhecida: ' . $action);
}