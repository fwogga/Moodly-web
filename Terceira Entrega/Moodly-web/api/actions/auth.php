<?php
/** @var string $action */
if ($action === 'register') {
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

if ($action === 'login') {
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
    ok([
        'userId' => $user['usuar_id'],
        'name'   => $user['usuar_nome'],
        'photo'  => $user['usuar_foto_perfil'],
        'role'   => $user['usuar_role'],
    ]);
}

if ($action === 'logout') {
    session_destroy();
    ok();
}

if ($action === 'check_session') {
    if (!empty($_SESSION['user_id'])) {
        $db = db();
        $st = $db->prepare("SELECT usuar_role FROM usuario WHERE usuar_id=?");
        $st->execute([$_SESSION['user_id']]);
        $u = $st->fetch(PDO::FETCH_ASSOC);
        ok(['userId' => (int)$_SESSION['user_id'], 'name' => $_SESSION['user_name'], 'role' => $u['usuar_role'] ?? 'user']);
    }
    fail('Sem sessão');
}