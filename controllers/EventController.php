<?php

class EventController extends Controller {

    public static function create() {
        $userId = self::requireUser();
        $data = self::getBody();

        foreach (['title', 'description', 'location', 'lat', 'lng', 'date'] as $field) {
            if (!isset($data[$field])) self::error("Missing field: $field");
        }

        $data['userId']   = $userId;
        $data['invitees'] = $data['invitees'] ?? [];

        $eventId = Event::create($data);

        self::success(['eventId' => $eventId]);
    }

    /**
     * Invite a user to an existing event (creator only).
     */
    public static function invite() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['eventId'], $data['userId'])) {
            self::error("Missing eventId or userId");
        }

        $result = Event::invite($data['eventId'], $userId, $data['userId']);

        if ($result === true) {
            self::success();
        } else {
            self::error($result['error']);
        }
    }

    public static function getUserEvents() {
        $userId = self::requireUser();
        self::json(Event::getUserEvents($userId));
    }

    public static function getEventDetail() {
        $userId = self::requireUser();
        $eventId = $_GET['eventId'] ?? null;

        if (!$eventId) self::error("Missing eventId");

        $event = Event::getById($eventId);
        if (!$event) self::error("Event not found", 404);

        self::json($event);
    }

    public static function map() {
        $userId = self::requireUser();
        self::json(Event::getMapEvents($userId));
    }

    public static function cancel() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['eventId'])) self::error("Missing eventId");

        $ok = Event::cancelEvent($data['eventId'], $userId);
        if (!$ok) self::error("Cannot cancel — event not found or you are not the creator", 403);

        self::success();
    }

    public static function accept() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['eventId'])) self::error("Missing eventId");

        $ok = Event::acceptInvite($data['eventId'], $userId);
        if (!$ok) self::error("No pending invite found for this event");

        self::success();
    }

    /**
     * Decline a pending invite OR leave an already-accepted event.
     * Aliased as both /decline and /leave in routes.
     */
    public static function decline() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['eventId'])) self::error("Missing eventId");

        $ok = Event::declineInvite($data['eventId'], $userId);
        if (!$ok) self::error("Cannot leave — you may be the creator (use /cancel) or no active invite exists");

        self::success();
    }

    public static function delete() {
        $userId = self::requireUser();
        $data = self::getBody();

        if (!isset($data['eventId'])) self::error("Missing eventId");

        $ok = Event::deleteEvent($data['eventId'], $userId);
        if (!$ok) self::error("Cannot delete — event must be cancelled and you must be the creator", 403);

        self::success();
    }
}