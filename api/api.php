<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

function ok($data = []) { echo json_encode(['ok' => true, 'data' => $data]); exit; }
function fail($msg)     { echo json_encode(['ok' => false, 'error' => $msg]); exit; }

function requireLogin() {
    if (!empty($_SESSION['user_id'])) return (int)$_SESSION['user_id'];
    $id = $_POST['userId'] ?? $_GET['userId'] ?? null;
    if ($id && is_numeric($id)) return (int)$id;
    fail('Não autenticado');
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

require_once __DIR__ . DIRECTORY_SEPARATOR . 'actions' . DIRECTORY_SEPARATOR . 'auth.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . 'actions' . DIRECTORY_SEPARATOR . 'users.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . 'actions' . DIRECTORY_SEPARATOR . 'interests.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . 'actions' . DIRECTORY_SEPARATOR . 'connections.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . 'actions' . DIRECTORY_SEPARATOR . 'events.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . 'actions' . DIRECTORY_SEPARATOR . 'chats.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . 'actions' . DIRECTORY_SEPARATOR . 'reports.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . 'actions' . DIRECTORY_SEPARATOR . 'admin.php';

fail('Ação desconhecida: ' . $action);