<?php
/** @var string $action */
 
if ($action === 'discover') {
    $userId = requireLogin();
    $db = db();
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
              WHERE (
                  (pc.pedcon_usuar_remetente_id = ? AND pc.pedcon_usuar_destinatario_id = u.usuar_id)
                OR (pc.pedcon_usuar_remetente_id = u.usuar_id AND pc.pedcon_usuar_destinatario_id = ? AND pc.pedcon_estado != 'pendente')
              )
          )
        GROUP BY u.usuar_id
        ORDER BY sent_me_request DESC, score DESC, RAND()
        LIMIT 30
    ");
    $st->execute([$userId, $userId, $userId, $userId, $userId]);
    $users = $st->fetchAll(PDO::FETCH_ASSOC);
 
    foreach ($users as &$u) {
        $st2 = $db->prepare("
            SELECT s.subinter_id, s.subinter_nome AS tag, i.inter_nome AS categoria,
                   EXISTS (
                       SELECT 1 FROM usuario_interesse ui2
                       WHERE ui2.usint_usuar_id = ? AND ui2.usint_subinter_id = s.subinter_id
                   ) AS matched
            FROM usuario_interesse ui
            JOIN subinteresse s ON s.subinter_id = ui.usint_subinter_id
            JOIN interesse i ON i.inter_id = s.subinter_inter_id
            WHERE ui.usint_usuar_id = ?
        ");
        $st2->execute([$userId, $u['usuar_id']]);
        $u['interests'] = $st2->fetchAll(PDO::FETCH_ASSOC);
    }
    ok($users);
}
 
if ($action === 'search_users') {
    requireLogin();
    $q  = trim($_GET['q'] ?? '');
    $db = db();
    $st = $db->prepare("SELECT usuar_id, usuar_nome, usuar_foto_perfil FROM usuario WHERE usuar_nome LIKE ? AND usuar_banned = 0 LIMIT 20");
    $st->execute(['%' . $q . '%']);
    ok($st->fetchAll(PDO::FETCH_ASSOC));
}
 
if ($action === 'get_profile') {
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
 
if ($action === 'update_profile') {
    $userId = requireLogin();
    $name   = trim($_POST['name'] ?? '');
    if (!$name) fail('Nome inválido');
    db()->prepare("UPDATE usuario SET usuar_nome = ? WHERE usuar_id = ?")->execute([$name, $userId]);
    $_SESSION['user_name'] = $name;
    ok();
}
 
if ($action === 'upload_photo') {
    $userId = requireLogin();
    if (empty($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) fail('Erro no upload');
    $file    = $_FILES['photo'];
    $ext     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg','jpeg','png','webp'];
    if (!in_array($ext, $allowed)) fail('Tipo de ficheiro inválido');
    if ($file['size'] > 5 * 1024 * 1024) fail('Ficheiro demasiado grande');
    if (!getimagesize($file['tmp_name'])) fail('Ficheiro inválido');
    $ext = $ext === 'jpeg' ? 'jpg' : $ext;
 
    $dir = __DIR__ . '/../../uploads/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
 
    $db  = db();
    $st  = $db->prepare("SELECT usuar_foto_perfil FROM usuario WHERE usuar_id = ?");
    $st->execute([$userId]);
    $old = $st->fetchColumn();
    if ($old && strpos($old, 'uploads/user_') === 0 && file_exists(__DIR__ . '/../../' . $old)) {
        unlink(__DIR__ . '/../../' . $old);
    }
 
    $filename = "user_{$userId}_" . time() . ".{$ext}";
    move_uploaded_file($file['tmp_name'], $dir . $filename);
    $path = "uploads/{$filename}";
    $db->prepare("UPDATE usuario SET usuar_foto_perfil = ? WHERE usuar_id = ?")->execute([$path, $userId]);
    ok(['photo' => $path]);
}
 
if ($action === 'upload_photo_cropped') {
    $userId  = requireLogin();
    $data    = $_POST['imageData'] ?? '';
    if (!$data) fail('Sem dados de imagem');
 
    if (!preg_match('/^data:image\/(jpeg|png|webp);base64,/', $data, $m)) fail('Formato inválido');
    $ext     = $m[1] === 'jpeg' ? 'jpg' : $m[1];
    $base64  = preg_replace('/^data:image\/\w+;base64,/', '', $data);
    $binary  = base64_decode($base64);
    if (!$binary) fail('Imagem inválida');
    if (strlen($binary) > 5 * 1024 * 1024) fail('Ficheiro demasiado grande');
 
    $dir = __DIR__ . '/../../uploads/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
 
    $db  = db();
    $st  = $db->prepare("SELECT usuar_foto_perfil FROM usuario WHERE usuar_id = ?");
    $st->execute([$userId]);
    $old = $st->fetchColumn();
    if ($old && strpos($old, 'uploads/user_') === 0 && file_exists(__DIR__ . '/../../' . $old)) {
        unlink(__DIR__ . '/../../' . $old);
    }
 
    $filename = "user_{$userId}_" . time() . ".{$ext}";
    file_put_contents($dir . $filename, $binary);
    $path = "uploads/{$filename}";
    $db->prepare("UPDATE usuario SET usuar_foto_perfil = ? WHERE usuar_id = ?")->execute([$path, $userId]);
    ok(['photo' => $path]);
}
 