<?php

class InterestController extends Controller {

    public static function getAll() {
        self::json(Interest::getAll());
    }

    public static function search() {
        $q = $_GET['q'] ?? '';

        if (strlen($q) < 1) {
            self::json([]);
        }

        self::json(Interest::search($q));
    }

    public static function setUserInterests() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['tags']) || !is_array($data['tags'])) {
            self::error("'tags' must be an array");
        }

        $db = Database::connect();

        // Remove old interests
        $db->prepare("DELETE FROM usuario_interesse WHERE usint_usuar_id = ?")
           ->execute([$userId]);

        foreach ($data['tags'] as $tag) {
            if (!isset($tag['name'], $tag['category'])) {
                self::error("Each tag must have 'name' and 'category'");
            }

            try {
                $tagId = Interest::findOrCreate($tag['name'], $tag['category']);
            } catch (Exception $e) {
                self::error($e->getMessage());
            }

            $db->prepare("
                INSERT INTO usuario_interesse (usint_usuar_id, usint_subinter_id)
                VALUES (?,?)
            ")->execute([$userId, $tagId]);
        }

        self::success();
    }
}