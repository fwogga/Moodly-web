<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

function ok($data = [])  { echo json_encode(['ok' => true,  'data'  => $data]); exit; }
function fail($message)  { echo json_encode(['ok' => false, 'error' => $message]); exit; }

function requireLogin() {
    if (!empty($_SESSION['user_id'])) return (int)$_SESSION['user_id'];
    $id = $_POST['userId'] ?? $_GET['userId'] ?? null;
    if ($id && is_numeric($id)) return (int)$id;
    fail('Não autenticado');
}

function requireAdmin() {
    $userId = requireLogin();
    $st = db()->prepare("SELECT usuar_role FROM usuario WHERE usuar_id = ?");
    $st->execute([$userId]);
    $u = $st->fetch(PDO::FETCH_ASSOC);
    if (($u['usuar_role'] ?? '') !== 'admin') fail('Sem permissão');
    return $userId;
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

$routes = [
    'register'                   => 'auth',
    'login'                      => 'auth',
    'logout'                     => 'auth',
    'check_session'              => 'auth',

    'discover'                   => 'users',
    'search_users'               => 'users',
    'get_profile'                => 'users',
    'update_profile'             => 'users',
    'upload_photo'               => 'users',
    'upload_photo_cropped'       => 'users',

    'get_interests'              => 'interests',
    'search_interests'           => 'interests',
    'find_or_create_interest'    => 'interests',
    'set_interests'              => 'interests',

    'get_connections'            => 'connections',
    'get_sent_requests'          => 'connections',
    'get_new_connections'        => 'connections',
    'send_request'               => 'connections',
    'accept_request'             => 'connections',
    'reject_request'             => 'connections',

    'get_events'                 => 'events',
    'get_map_events'             => 'events',
    'create_event'               => 'events',
    'invite_to_event'            => 'events',
    'accept_event'               => 'events',
    'decline_event'              => 'events',
    'cancel_event'               => 'events',
    'delete_event'               => 'events',
    'get_event_detail'           => 'events',

    'get_chats'                  => 'chats',
    'get_messages'               => 'chats',
    'send_message'               => 'chats',
    'get_event_messages'         => 'chats',
    'send_event_message'         => 'chats',

    'report_user'                => 'reports',

    'make_admin'                 => 'admin',
    'admin_get_users'            => 'admin',
    'admin_ban'                  => 'admin',
    'admin_stats'                => 'admin',
    'admin_get_reports'          => 'admin',
    'admin_resolve_report'       => 'admin',
    'stats_popular_interests'    => 'admin',
    'stats_uniting_interests'    => 'admin',
    'stats_activity'             => 'admin',
    'stats_registrations'        => 'admin',
    'stats_connections_over_time'=> 'admin',
    'stats_category_distribution'=> 'admin',
    'stats_event_participation'  => 'admin',
    'stats_top_users'            => 'admin',
    'stats_descriptive'          => 'admin',
];

if (!isset($routes[$action])) fail('Ação desconhecida: ' . $action);

require_once __DIR__ . '/actions/' . $routes[$action] . '.php';

fail('Ação desconhecida: ' . $action);