<?php

class Report {

    /**
     * Create a report. Prevents duplicate reports from the same reporter.
     */
    public static function create($reporterId, $reportedId, $reason) {
        $db = Database::connect();

        // Prevent reporting yourself
        if ($reporterId == $reportedId) return false;

        // Prevent duplicate pending reports
        $stmt = $db->prepare("
            SELECT 1 FROM user_report
            WHERE report_reporter_id = ? AND report_reported_id = ? AND report_status = 'pending'
        ");
        $stmt->execute([$reporterId, $reportedId]);
        if ($stmt->fetch()) return false;

        $stmt = $db->prepare("
            INSERT INTO user_report (report_reporter_id, report_reported_id, report_reason, report_status)
            VALUES (?,?,?,'pending')
        ");

        return $stmt->execute([$reporterId, $reportedId, $reason]);
    }
}