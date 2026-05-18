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
/** @var string $action */
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
        JOIN usuario reported  ON reported.usuar_id=r.report_reported_id
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

if ($action === 'stats_popular_interests') {
    requireAdmin();
    $db = db();
    $rows = $db->query("
        SELECT s.subinter_nome AS nome, i.inter_nome AS categoria, COUNT(ui.usint_usuar_id) AS total
        FROM subinteresse s
        JOIN interesse i ON i.inter_id = s.subinter_inter_id
        JOIN usuario_interesse ui ON ui.usint_subinter_id = s.subinter_id
        GROUP BY s.subinter_id
        ORDER BY total DESC
        LIMIT 15
    ")->fetchAll(PDO::FETCH_ASSOC);
    ok($rows);
}

if ($action === 'stats_uniting_interests') {
    requireAdmin();
    $db = db();
    $rows = $db->query("
        SELECT s.subinter_nome AS nome, i.inter_nome AS categoria, COUNT(*) AS conexoes
        FROM pedido_conexao pc
        JOIN usuario_interesse ui1 ON ui1.usint_usuar_id = pc.pedcon_usuar_remetente_id
        JOIN usuario_interesse ui2 ON ui2.usint_usuar_id = pc.pedcon_usuar_destinatario_id
                                   AND ui2.usint_subinter_id = ui1.usint_subinter_id
        JOIN subinteresse s ON s.subinter_id = ui1.usint_subinter_id
        JOIN interesse i ON i.inter_id = s.subinter_inter_id
        WHERE pc.pedcon_estado = 'aceite'
        GROUP BY s.subinter_id
        ORDER BY conexoes DESC
        LIMIT 15
    ")->fetchAll(PDO::FETCH_ASSOC);
    ok($rows);
}

if ($action === 'stats_activity') {
    requireAdmin();
    $db = db();
    $rows = $db->query("
        SELECT DATE(post_data_envio) AS dia, COUNT(*) AS mensagens
        FROM post
        WHERE post_data_envio >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
        GROUP BY dia
        ORDER BY dia ASC
    ")->fetchAll(PDO::FETCH_ASSOC);
    $map = [];
    foreach ($rows as $r) $map[$r['dia']] = (int)$r['mensagens'];
    $result = [];
    for ($i = 13; $i >= 0; $i--) {
        $day = date('Y-m-d', strtotime("-$i days"));
        $result[] = ['dia' => $day, 'mensagens' => $map[$day] ?? 0];
    }
    ok($result);
}

if ($action === 'stats_registrations') {
    requireAdmin();
    $db = db();
    $rows = $db->query("
        SELECT usuar_role AS role, COUNT(*) AS total
        FROM usuario
        GROUP BY usuar_role
    ")->fetchAll(PDO::FETCH_ASSOC);
    ok($rows);
}

if ($action === 'stats_connections_over_time') {
    requireAdmin();
    $db = db();
    $rows = $db->query("
        SELECT pedcon_estado AS estado, COUNT(*) AS total
        FROM pedido_conexao
        GROUP BY pedcon_estado
    ")->fetchAll(PDO::FETCH_ASSOC);
    ok($rows);
}

if ($action === 'stats_category_distribution') {
    requireAdmin();
    $db = db();
    $rows = $db->query("
        SELECT i.inter_nome AS categoria, COUNT(ui.usint_usuar_id) AS total
        FROM interesse i
        JOIN subinteresse s ON s.subinter_inter_id = i.inter_id
        JOIN usuario_interesse ui ON ui.usint_subinter_id = s.subinter_id
        GROUP BY i.inter_id
        ORDER BY total DESC
    ")->fetchAll(PDO::FETCH_ASSOC);
    ok($rows);
}

if ($action === 'stats_event_participation') {
    requireAdmin();
    $db = db();
    $rows = $db->query("
        SELECT invite_estado AS estado, COUNT(*) AS total
        FROM invite
        GROUP BY invite_estado
    ")->fetchAll(PDO::FETCH_ASSOC);
    ok($rows);
}

if ($action === 'stats_top_users') {
    requireAdmin();
    $db = db();
    $rows = $db->query("
        SELECT u.usuar_nome AS nome, u.usuar_foto_perfil AS foto, COUNT(*) AS conexoes
        FROM pedido_conexao pc
        JOIN usuario u ON u.usuar_id IN (pc.pedcon_usuar_remetente_id, pc.pedcon_usuar_destinatario_id)
        WHERE pc.pedcon_estado = 'aceite'
          AND u.usuar_id = IF(pc.pedcon_usuar_remetente_id=u.usuar_id, pc.pedcon_usuar_remetente_id, pc.pedcon_usuar_destinatario_id)
        GROUP BY u.usuar_id
        ORDER BY conexoes DESC
        LIMIT 5
    ")->fetchAll(PDO::FETCH_ASSOC);
    ok($rows);
}

if ($action === 'stats_descriptive') {
    requireAdmin();
    $db = db();
    $connPerUser = $db->query("
        SELECT u.usuar_id, COUNT(pc.pedcon_id) AS n
        FROM usuario u
        LEFT JOIN pedido_conexao pc
               ON pc.pedcon_estado = 'aceite'
              AND (pc.pedcon_usuar_remetente_id = u.usuar_id
                OR pc.pedcon_usuar_destinatario_id = u.usuar_id)
        GROUP BY u.usuar_id
    ")->fetchAll(PDO::FETCH_ASSOC);

    $vals = array_map('intval', array_column($connPerUser, 'n'));
    sort($vals);
    $n    = count($vals);
    $mean = $n ? array_sum($vals) / $n : 0;
    $median = $n === 0 ? 0 : ($n % 2 === 0
        ? ($vals[$n/2 - 1] + $vals[$n/2]) / 2
        : $vals[(int)floor($n/2)]);
    $variance = 0;
    foreach ($vals as $v) $variance += ($v - $mean) ** 2;
    $stddev = $n > 1 ? sqrt($variance / $n) : 0;
    $interestPerCat = $db->query("
        SELECT i.inter_nome AS categoria,
               COUNT(ui.usint_usuar_id) AS total_entradas,
               COUNT(DISTINCT ui.usint_usuar_id) AS utilizadores
        FROM interesse i
        JOIN subinteresse s ON s.subinter_inter_id = i.inter_id
        JOIN usuario_interesse ui ON ui.usint_subinter_id = s.subinter_id
        GROUP BY i.inter_id
    ")->fetchAll(PDO::FETCH_ASSOC);
    $avgPerCat = [];
    foreach ($interestPerCat as $r) {
        $avgPerCat[] = [
            'categoria'    => $r['categoria'],
            'media'        => $r['utilizadores'] > 0 ? round($r['total_entradas'] / $r['utilizadores'], 2) : 0,
            'utilizadores' => (int)$r['utilizadores'],
        ];
    }
    $polarRows = $db->query("
        SELECT s.subinter_id, s.subinter_nome AS nome, i.inter_nome AS categoria,
               COUNT(DISTINCT ui.usint_usuar_id) AS utilizadores,
               COALESCE(conn.conexoes, 0) AS conexoes
        FROM subinteresse s
        JOIN interesse i ON i.inter_id = s.subinter_inter_id
        JOIN usuario_interesse ui ON ui.usint_subinter_id = s.subinter_id
        LEFT JOIN (
            SELECT ui1.usint_subinter_id, COUNT(*) AS conexoes
            FROM pedido_conexao pc
            JOIN usuario_interesse ui1 ON ui1.usint_usuar_id = pc.pedcon_usuar_remetente_id
            JOIN usuario_interesse ui2 ON ui2.usint_usuar_id = pc.pedcon_usuar_destinatario_id
                                       AND ui2.usint_subinter_id = ui1.usint_subinter_id
            WHERE pc.pedcon_estado = 'aceite'
            GROUP BY ui1.usint_subinter_id
        ) conn ON conn.usint_subinter_id = s.subinter_id
        GROUP BY s.subinter_id
        HAVING utilizadores >= 2
    ")->fetchAll(PDO::FETCH_ASSOC);
    $polarizador = null;
    $bestScore   = -1;
    foreach ($polarRows as $r) {
        $score = $r['utilizadores'] / ($r['conexoes'] + 1);
        if ($score > $bestScore) { $bestScore = $score; $polarizador = $r; }
    }

    $eventStats = $db->query("
        SELECT AVG(cnt) AS media, MAX(cnt) AS maximo, MIN(cnt) AS minimo
        FROM (
            SELECT invite_evento_id, COUNT(*) AS cnt
            FROM invite WHERE invite_estado = 'confirmado'
            GROUP BY invite_evento_id
        ) sub
    ")->fetch(PDO::FETCH_ASSOC);
    $msgStats = $db->query("
        SELECT AVG(cnt) AS media, MAX(cnt) AS maximo,
               SUM(CASE WHEN cnt = 0 THEN 1 ELSE 0 END) AS sem_msgs
        FROM (
            SELECT pc.pedcon_id, COUNT(p.post_id) AS cnt
            FROM pedido_conexao pc
            LEFT JOIN post p ON p.post_connect_id = pc.pedcon_id
            WHERE pc.pedcon_estado = 'aceite'
            GROUP BY pc.pedcon_id
        ) sub
    ")->fetch(PDO::FETCH_ASSOC);
    $bivariada = $db->query("
        SELECT grupos.grupo,
               ROUND(AVG(grupos.conexoes), 2) AS media_conexoes,
               COUNT(*) AS utilizadores
        FROM (
            SELECT u.usuar_id,
                   CASE
                       WHEN COUNT(DISTINCT ui.usint_subinter_id) = 0 THEN '0'
                       WHEN COUNT(DISTINCT ui.usint_subinter_id) BETWEEN 1 AND 2 THEN '1-2'
                       WHEN COUNT(DISTINCT ui.usint_subinter_id) BETWEEN 3 AND 4 THEN '3-4'
                       ELSE '5+'
                   END AS grupo,
                   (
                       SELECT COUNT(*) FROM pedido_conexao pc
                       WHERE pc.pedcon_estado = 'aceite'
                         AND (pc.pedcon_usuar_remetente_id = u.usuar_id
                           OR pc.pedcon_usuar_destinatario_id = u.usuar_id)
                   ) AS conexoes
            FROM usuario u
            LEFT JOIN usuario_interesse ui ON ui.usint_usuar_id = u.usuar_id
            GROUP BY u.usuar_id
        ) grupos
        GROUP BY grupos.grupo
        ORDER BY FIELD(grupos.grupo,'0','1-2','3-4','5+')
    ")->fetchAll(PDO::FETCH_ASSOC);

    ok([
        'conexoes' => [
            'media'   => round($mean, 2),
            'mediana' => round($median, 2),
            'desvio'  => round($stddev, 2),
            'min'     => $vals[0] ?? 0,
            'max'     => $n ? $vals[$n-1] : 0,
        ],
        'interesses_por_categoria' => $avgPerCat,
        'polarizador'              => $polarizador,
        'eventos' => [
            'media_participantes' => round((float)($eventStats['media'] ?? 0), 2),
            'max_participantes'   => (int)($eventStats['maximo'] ?? 0),
            'min_participantes'   => (int)($eventStats['minimo'] ?? 0),
        ],
        'mensagens' => [
            'media_por_conversa'  => round((float)($msgStats['media'] ?? 0), 2),
            'max_numa_conversa'   => (int)($msgStats['maximo'] ?? 0),
            'conversas_sem_msgs'  => (int)($msgStats['sem_msgs'] ?? 0),
        ],
        'bivariada' => $bivariada,
    ]);
}