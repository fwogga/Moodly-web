<?php

class ReportController extends Controller {

    public static function report() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['reportedId'], $data['reason'])) {
            self::error("Missing reportedId or reason");
        }

        if (trim($data['reason']) === '') {
            self::error("Reason cannot be empty");
        }

        $result = Report::create($userId, $data['reportedId'], $data['reason']);

        if ($result === false) {
            self::error("Cannot submit report. You may have already reported this user.");
        }

        self::success();
    }
}