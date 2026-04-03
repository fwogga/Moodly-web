<?php

// ─── AUTH ────────────────────────────────────────────────────────────────────
$router->register("POST", "/api/register", [AuthController::class,      "register"]);
$router->register("POST", "/api/login",    [AuthController::class,      "login"]);

// ─── USERS ───────────────────────────────────────────────────────────────────
$router->register("GET",  "/api/users/search",   [UserController::class, "search"]);
$router->register("GET",  "/api/users/discover", [UserController::class, "discover"]);
$router->register("GET",  "/api/users/profile",  [UserController::class, "getProfile"]);  // ?userId= optional (defaults to self)
$router->register("POST", "/api/users/update",   [UserController::class, "updateProfile"]);
$router->register("POST", "/api/users/photo",    [UserController::class, "uploadPhoto"]);  // multipart/form-data

// ─── INTERESTS ───────────────────────────────────────────────────────────────
$router->register("GET",  "/api/interests",        [InterestController::class, "getAll"]);
$router->register("GET",  "/api/interests/search", [InterestController::class, "search"]);  // ?q=
$router->register("POST", "/api/interests/set",    [InterestController::class, "setUserInterests"]);

// ─── CONNECTIONS ─────────────────────────────────────────────────────────────
$router->register("GET",  "/api/connections",         [ConnectionController::class, "getConnections"]);
$router->register("POST", "/api/connections/request", [ConnectionController::class, "request"]);
$router->register("POST", "/api/connections/accept",  [ConnectionController::class, "accept"]);
$router->register("POST", "/api/connections/reject",  [ConnectionController::class, "reject"]);

// ─── EVENTS ──────────────────────────────────────────────────────────────────
$router->register("GET",  "/api/events",         [EventController::class, "getUserEvents"]);
$router->register("GET",  "/api/events/map",     [EventController::class, "map"]);
$router->register("GET",  "/api/events/detail",  [EventController::class, "getEventDetail"]);  // ?eventId=
$router->register("POST", "/api/events/create",  [EventController::class, "create"]);
$router->register("POST", "/api/events/invite",  [EventController::class, "invite"]);   // creator invites after creation
$router->register("POST", "/api/events/accept",  [EventController::class, "accept"]);   // participant accepts
$router->register("POST", "/api/events/decline", [EventController::class, "decline"]);  // participant declines pending invite
$router->register("POST", "/api/events/leave",   [EventController::class, "decline"]);  // alias: participant leaves after accepting
$router->register("POST", "/api/events/cancel",  [EventController::class, "cancel"]);   // creator cancels whole event
$router->register("POST", "/api/events/delete",  [EventController::class, "delete"]);   // creator deletes cancelled event

// ─── CHAT (Direct) ───────────────────────────────────────────────────────────
$router->register("GET",  "/api/chat",          [ChatController::class, "getChats"]);    // list all conversations
$router->register("GET",  "/api/chat/messages", [ChatController::class, "getMessages"]); // ?connectionId=
$router->register("POST", "/api/chat/send",     [ChatController::class, "sendMessage"]);

// ─── CHAT (Event / Group) ────────────────────────────────────────────────────
$router->register("GET",  "/api/chat/event/messages", [ChatController::class, "getEventMessages"]); // ?eventId=
$router->register("POST", "/api/chat/event/send",     [ChatController::class, "sendEventMessage"]);

// ─── REPORTS ─────────────────────────────────────────────────────────────────
$router->register("POST", "/api/report", [ReportController::class, "report"]);

// ─── ADMIN ───────────────────────────────────────────────────────────────────
$router->register("GET",  "/api/admin/users",           [AdminController::class, "users"]);
$router->register("GET",  "/api/admin/stats",           [AdminController::class, "stats"]);
$router->register("GET",  "/api/admin/reports",         [AdminController::class, "reports"]);
$router->register("POST", "/api/admin/ban",             [AdminController::class, "ban"]);
$router->register("POST", "/api/admin/unban",           [AdminController::class, "unban"]);
$router->register("POST", "/api/admin/reports/resolve", [AdminController::class, "resolveReport"]);