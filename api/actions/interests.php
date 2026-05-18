<?php
/** @var string $action */
if ($action === 'get_interests') {
    $db   = db();
    $rows = $db->query("
        SELECT i.inter_id, i.inter_nome AS categoria, s.subinter_id, s.subinter_nome AS tag
        FROM interesse i
        JOIN subinteresse s ON s.subinter_inter_id = i.inter_id
        ORDER BY i.inter_nome, s.subinter_nome
    ")->fetchAll(PDO::FETCH_ASSOC);

    $grouped = [];
    foreach ($rows as $row) {
        $cat = $row['categoria'];
        if (!isset($grouped[$cat])) $grouped[$cat] = ['id' => $row['inter_id'], 'nome' => $cat, 'tags' => []];
        $grouped[$cat]['tags'][] = ['id' => $row['subinter_id'], 'nome' => $row['tag']];
    }
    ok(array_values($grouped));
}

if ($action === 'search_interests') {
    $term     = trim($_GET['q']         ?? '');
    $categoria = trim($_GET['categoria'] ?? '');
    $db = db();

    if ($categoria) {
        $st = $db->prepare("
            SELECT s.subinter_id AS id, s.subinter_nome AS tag, i.inter_nome AS categoria
            FROM subinteresse s JOIN interesse i ON i.inter_id = s.subinter_inter_id
            WHERE s.subinter_nome LIKE ? AND i.inter_nome = ?
            ORDER BY s.subinter_nome LIMIT 10
        ");
        $st->execute([$term . '%', $categoria]);
    } else {
        $st = $db->prepare("
            SELECT s.subinter_id AS id, s.subinter_nome AS tag, i.inter_nome AS categoria
            FROM subinteresse s JOIN interesse i ON i.inter_id = s.subinter_inter_id
            WHERE s.subinter_nome LIKE ?
            ORDER BY s.subinter_nome LIMIT 10
        ");
        $st->execute([$term . '%']);
    }
    ok($st->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'find_or_create_interest') {
    requireLogin();
    $name     = trim($_POST['name']      ?? '');
    $categoria = trim($_POST['categoria'] ?? '');
    if (!$name) fail('Nome inválido');

    $db = db();

    if ($categoria) {
        $st = $db->prepare("
            SELECT s.subinter_id AS id, s.subinter_nome AS nome, i.inter_nome AS categoria
            FROM subinteresse s JOIN interesse i ON i.inter_id = s.subinter_inter_id
            WHERE LOWER(s.subinter_nome) = LOWER(?) AND i.inter_nome = ? LIMIT 1
        ");
        $st->execute([$name, $categoria]);
    } else {
        $st = $db->prepare("
            SELECT s.subinter_id AS id, s.subinter_nome AS nome, i.inter_nome AS categoria
            FROM subinteresse s JOIN interesse i ON i.inter_id = s.subinter_inter_id
            WHERE LOWER(s.subinter_nome) = LOWER(?) LIMIT 1
        ");
        $st->execute([$name]);
    }
    $existing = $st->fetch(PDO::FETCH_ASSOC);
    if ($existing) ok($existing);

    if ($categoria) {
        $st = $db->prepare("SELECT inter_id FROM interesse WHERE inter_nome = ?");
        $st->execute([$categoria]);
        $catId = (int)$st->fetchColumn();
        if (!$catId) fail('Categoria inválida');
    } else {
        $catId = (int)$db->query("SELECT inter_id FROM interesse ORDER BY inter_id LIMIT 1")->fetchColumn();
    }

    $db->prepare("INSERT INTO subinteresse (subinter_inter_id, subinter_nome) VALUES (?,?)")->execute([$catId, $name]);
    $newId = (int)$db->lastInsertId();

    $st = $db->prepare("
        SELECT s.subinter_id AS id, s.subinter_nome AS nome, i.inter_nome AS categoria
        FROM subinteresse s JOIN interesse i ON i.inter_id = s.subinter_inter_id
        WHERE s.subinter_id = ?
    ");
    $st->execute([$newId]);
    ok($st->fetch(PDO::FETCH_ASSOC));
}

if ($action === 'set_interests') {
    $userId = requireLogin();
    $tags   = json_decode($_POST['tags'] ?? '[]', true);
    if (!is_array($tags)) fail('Tags inválidas');

    $db = db();
    $db->prepare("DELETE FROM usuario_interesse WHERE usint_usuar_id = ?")->execute([$userId]);
    foreach ($tags as $tagId) {
        $tagId = (int)$tagId;
        if (!$tagId) continue;
        $db->prepare("INSERT IGNORE INTO usuario_interesse (usint_usuar_id, usint_subinter_id) VALUES (?,?)")->execute([$userId, $tagId]);
    }
    ok();
}