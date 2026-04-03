<?php

class Interest {

    /**
     * Returns all categories with their sub-tags, structured for frontend tag pickers.
     */
    public static function getAll() {
        $db = Database::connect();

        $stmt = $db->query("
            SELECT i.inter_id, i.inter_nome AS categoria, s.subinter_id, s.subinter_nome AS tag
            FROM interesse i
            JOIN subinteresse s ON s.subinter_inter_id = i.inter_id
            ORDER BY i.inter_nome, s.subinter_nome
        ");

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Group by category for cleaner frontend consumption
        $grouped = [];
        foreach ($rows as $row) {
            $cat = $row['categoria'];
            if (!isset($grouped[$cat])) {
                $grouped[$cat] = ['id' => $row['inter_id'], 'nome' => $cat, 'tags' => []];
            }
            $grouped[$cat]['tags'][] = ['id' => $row['subinter_id'], 'nome' => $row['tag']];
        }

        return array_values($grouped);
    }

    /**
     * Search sub-tags by name (for autocomplete while typing).
     */
    public static function search($query) {
        $db = Database::connect();

        $stmt = $db->prepare("
            SELECT s.subinter_id, s.subinter_nome AS tag, i.inter_nome AS categoria
            FROM subinteresse s
            JOIN interesse i ON i.inter_id = s.subinter_inter_id
            WHERE s.subinter_nome LIKE ?
            ORDER BY s.subinter_nome
            LIMIT 10
        ");

        $stmt->execute(["$query%"]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find an existing tag by name+category or create it.
     * Throws if the category doesn't exist (prevents junk categories).
     */
    public static function findOrCreate($name, $categoryName) {
        $db = Database::connect();

        // Get category
        $stmt = $db->prepare("SELECT inter_id FROM interesse WHERE LOWER(inter_nome) = LOWER(?)");
        $stmt->execute([$categoryName]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$category) {
            throw new Exception("Invalid category: $categoryName");
        }

        $categoryId = $category['inter_id'];

        // Check if tag already exists in that category
        $stmt = $db->prepare("
            SELECT subinter_id FROM subinteresse
            WHERE LOWER(subinter_nome) = LOWER(?) AND subinter_inter_id = ?
        ");
        $stmt->execute([$name, $categoryId]);
        $tag = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($tag) return $tag['subinter_id'];

        // Create new tag
        $stmt = $db->prepare("INSERT INTO subinteresse (subinter_inter_id, subinter_nome) VALUES (?,?)");
        $stmt->execute([$categoryId, $name]);

        return $db->lastInsertId();
    }
}