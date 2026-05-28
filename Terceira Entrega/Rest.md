# Moodly REST API

---

## Servidor Online

- **URL:** `/`
- **Method:** `GET`
- **Descrição:** Endpoint de teste para verificar se o servidor está online.

**Success Response**
- `200 OK`

```bash
curl -X GET http://localhost/Moodly-web/api/api.php?action=check_session
```

---

## Autenticação

### Registar conta

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=register
name=Ana Silva
email=ana@moodly.pt
password=123456
```

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": {
    "userId": 1,
    "name": "Ana Silva"
  }
}
```

**Error Responses**
- `400 Bad Request` → `"Preenche todos os campos"`
- `400 Bad Request` → `"Email inválido"`
- `400 Bad Request` → `"Email já registado"`

---

### Fazer login

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=login
email=ana@moodly.pt
password=123456
```

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": {
    "userId": 1,
    "name": "Ana Silva",
    "photo": "uploads/user_1.jpg",
    "role": "user"
  }
}
```

**Error Responses**
- `400 Bad Request` → `"Preenche todos os campos"`
- `401 Unauthorized` → `"Credenciais inválidas"`
- `403 Forbidden` → `"Conta suspensa"`

---

### Terminar sessão

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=logout
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

---

### Verificar sessão

- **URL:** `/api/api.php?action=check_session`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": {
    "userId": 1,
    "name": "Ana Silva",
    "role": "user"
  }
}
```

**Error Response**
- `401 Unauthorized` → `"Sem sessão"`

---

## Utilizadores

### Descobrir utilizadores

- **URL:** `/api/api.php?action=discover`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    {
      "usuar_id": 2,
      "usuar_nome": "Miguel Santos",
      "usuar_foto_perfil": "uploads/user_2.jpg",
      "score": 3,
      "sent_me_request": 0,
      "interests": [
        { "tag": "Elden Ring", "categoria": "Jogos", "matched": 1 }
      ]
    }
  ]
}
```

**Notes**
- Devolve até 30 utilizadores sem ligação com o utilizador autenticado, ordenados por `sent_me_request DESC, score DESC` (interesses em comum).
- O campo `sent_me_request` indica se o utilizador já enviou um pedido de conexão ao utilizador autenticado (`1` = sim, `0` = não).
- O campo `matched` em cada interesse indica se o interesse é partilhado com o utilizador autenticado (`1` = sim, `0` = não).

---

### Pesquisar utilizadores

- **URL:** `/api/api.php?action=search_users&q=:termo`
- **Method:** `GET`

**URL Params**
- `q` (string) — obrigatório

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "usuar_id": 2, "usuar_nome": "Miguel Santos", "usuar_foto_perfil": "uploads/user_2.jpg" }
  ]
}
```

```bash
curl -X GET "http://localhost/Moodly-web/api/api.php?action=search_users&q=Miguel"
```

---

### Obter perfil

- **URL:** `/api/api.php?action=get_profile`
- **Method:** `GET`

**URL Params**
- `targetId` (integer) — opcional. Se omitido, devolve o perfil do utilizador autenticado.

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": {
    "usuar_id": 1,
    "usuar_nome": "Ana Silva",
    "usuar_foto_perfil": "uploads/user_1.jpg",
    "connection_count": 5,
    "interests": [
      { "subinter_id": 1, "tag": "Bring Me The Horizon", "categoria": "Música" }
    ]
  }
}
```

**Error Response**
- `404 Not Found` → `"Utilizador não encontrado"`

---

### Editar perfil

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=update_profile
name=Ana Silva
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Response**
- `400 Bad Request` → `"Nome inválido"`

---

### Carregar foto de perfil

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=upload_photo
photo=<ficheiro>     (jpg, png ou webp — máx. 5 MB)
```

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": { "photo": "uploads/user_1_1714000000.jpg" }
}
```

**Error Responses**
- `400 Bad Request` → `"Tipo de ficheiro inválido"`
- `400 Bad Request` → `"Ficheiro demasiado grande"`

---

### Carregar foto recortada (base64)

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=upload_photo_cropped
imageData=data:image/jpeg;base64,...   (JPEG, PNG ou WebP em base64 — máx. 5 MB)
```

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": { "photo": "uploads/user_1_1714000000.jpg" }
}
```

**Error Responses**
- `400 Bad Request` → `"Sem dados de imagem"`
- `400 Bad Request` → `"Formato inválido"`
- `400 Bad Request` → `"Imagem inválida"`
- `400 Bad Request` → `"Ficheiro demasiado grande"`

**Notes**
- Utilizado pelo cropper de perfil. Aceita a imagem em formato Data URL base64. Apaga a foto anterior automaticamente.

---

## Interesses

### Listar todos os interesses

- **URL:** `/api/api.php?action=get_interests`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "nome": "Música",
      "tags": [
        { "id": 1, "nome": "Bring Me The Horizon" },
        { "id": 2, "nome": "Arctic Monkeys" }
      ]
    },
    {
      "id": 2,
      "nome": "Jogos",
      "tags": [
        { "id": 10, "nome": "Elden Ring" }
      ]
    }
  ]
}
```

**Notes**
- Devolve todos os interesses agrupados por categoria, ordenados alfabeticamente. Não requer autenticação.

---

### Pesquisar interesses

- **URL:** `/api/api.php?action=search_interests&q=:termo`
- **Method:** `GET`

**URL Params**
- `q` (string) — obrigatório
- `categoria` (string) — opcional. Ex: `"Música"`, `"Jogos"`, `"Cinema & Séries"`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "id": 1, "tag": "Bring Me The Horizon", "categoria": "Música" }
  ]
}
```

---

### Encontrar ou criar interesse

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=find_or_create_interest
name=Elden Ring
categoria=Jogos
```

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": { "id": 20, "nome": "Elden Ring", "categoria": "Jogos" }
}
```

**Error Responses**
- `400 Bad Request` → `"Nome inválido"`
- `400 Bad Request` → `"Categoria inválida"`

**Notes**
- Se o interesse já existir, devolve o existente. Se não existir, cria-o na categoria indicada.

---

### Definir interesses do utilizador

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=set_interests
tags=[1,5,12]        (array de IDs em formato JSON)
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Notes**
- Substitui todos os interesses existentes do utilizador. Enviar array vazio remove todos.

---

## Conexões

### Pedir conexão

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=send_request
targetId=2
```

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": { "requestId": 14 }
}
```

**Error Responses**
- `400 Bad Request` → `"Pedido inválido"`
- `400 Bad Request` → `"Já existe um pedido"`

---

### Listar conexões e pedidos recebidos

- **URL:** `/api/api.php?action=get_connections`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": {
    "connections": [
      { "connection_id": 1, "usuar_id": 2, "usuar_nome": "Miguel Santos", "usuar_foto_perfil": "uploads/user_2.jpg" }
    ],
    "pending": [
      { "request_id": 14, "usuar_id": 5, "usuar_nome": "Inês Rodrigues", "usuar_foto_perfil": "uploads/user_5.jpg" }
    ]
  }
}
```

---

### Pedidos enviados pendentes

- **URL:** `/api/api.php?action=get_sent_requests`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "request_id": 14, "usuar_id": 6, "usuar_nome": "Diogo Martins", "usuar_foto_perfil": "uploads/user_6.jpg" }
  ]
}
```

---

### Novas conexões sem chat

- **URL:** `/api/api.php?action=get_new_connections`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "connection_id": 3, "usuar_id": 8, "usuar_nome": "Rui Pereira", "usuar_foto_perfil": "uploads/user_8.jpg" }
  ]
}
```

**Notes**
- Devolve conexões aceites onde ainda não existe nenhuma mensagem trocada.

---

### Aceitar pedido

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=accept_request
requestId=14
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Response**
- `400 Bad Request` → `"Pedido não encontrado"`

---

### Recusar pedido

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=reject_request
requestId=14
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Response**
- `400 Bad Request` → `"Pedido não encontrado"`

---

## Chats

### Listar conversas

- **URL:** `/api/api.php?action=get_chats`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    {
      "connection_id": 1,
      "usuar_id": 2,
      "usuar_nome": "Miguel Santos",
      "usuar_foto_perfil": "uploads/user_2.jpg",
      "last_message": "Já ouviste o novo álbum?",
      "last_at": "2026-04-25 14:32:00"
    }
  ]
}
```

---

### Listar mensagens de uma conversa

- **URL:** `/api/api.php?action=get_messages&connectionId=:id`
- **Method:** `GET`

**URL Params**
- `connectionId` (integer) — obrigatório

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    {
      "post_id": 1,
      "post_usuar_id": 1,
      "post_conteudo": "Olá!",
      "post_data_envio": "2026-04-25 14:30:00",
      "usuar_nome": "Ana Silva"
    }
  ]
}
```

**Error Response**
- `403 Forbidden` → `"Sem acesso"`

---

### Enviar mensagem

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=send_message
connectionId=1
message=Olá!
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Responses**
- `400 Bad Request` → `"Mensagem vazia"`
- `403 Forbidden` → `"Sem acesso"`

---

### Listar mensagens do chat de evento (grupo)

- **URL:** `/api/api.php?action=get_event_messages&eventId=:id`
- **Method:** `GET`

**URL Params**
- `eventId` (integer) — obrigatório

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    {
      "gp_id": 1,
      "gp_usuar_id": 1,
      "gp_conteudo": "Alguém precisa de boleia?",
      "gp_data_envio": "2026-04-25 21:00:00",
      "usuar_nome": "Admin"
    }
  ]
}
```

**Error Response**
- `403 Forbidden` → `"Sem acesso"` (utilizador não está confirmado no evento)

---

### Enviar mensagem no chat de evento

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=send_event_message
eventId=1
message=Vamos!
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Responses**
- `400 Bad Request` → `"Mensagem vazia"`
- `403 Forbidden` → `"Sem acesso"`

---

## Eventos

### Criar evento

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=create_event
title=Concerto Arctic Monkeys      (obrigatório)
date=2026-06-14 21:00:00           (obrigatório)
description=Concerto no Altice     (opcional)
location=Altice Arena, Lisboa      (opcional)
lat=38.768100                      (opcional)
lng=-9.095200                      (opcional)
```

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": { "eventId": 6 }
}
```

**Error Response**
- `400 Bad Request` → `"Título e data são obrigatórios"`

**Notes**
- O criador é automaticamente adicionado como participante confirmado.
- As coordenadas `lat` e `lng` são preenchidas pelo mapa Leaflet integrado na aplicação.

---

### Listar eventos do utilizador

- **URL:** `/api/api.php?action=get_events`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    {
      "evento_id": 1,
      "evento_titulo": "Concerto Arctic Monkeys",
      "evento_data": "2026-06-14 21:00:00",
      "evento_local": "Altice Arena, Lisboa",
      "evento_lat": "38.768100",
      "evento_lng": "-9.095200",
      "evento_estado": "ativo",
      "organizador": "Admin",
      "invite_estado": "confirmado",
      "confirmados": 3
    }
  ]
}
```

**Notes**
- Devolve eventos onde o utilizador tem invite com estado `confirmado` ou `pendente`, ordenados por data ascendente.

---

### Detalhe de um evento

- **URL:** `/api/api.php?action=get_event_detail&eventId=:id`
- **Method:** `GET`

**URL Params**
- `eventId` (integer) — obrigatório

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": {
    "event": {
      "evento_id": 1,
      "evento_titulo": "Concerto Arctic Monkeys",
      "evento_descricao": "Concerto no Altice",
      "evento_data": "2026-06-14 21:00:00",
      "evento_local": "Altice Arena, Lisboa",
      "evento_lat": "38.768100",
      "evento_lng": "-9.095200",
      "evento_estado": "ativo",
      "organizador": "Admin",
      "organizador_foto": "uploads/user_1.jpg"
    },
    "participants": [
      {
        "usuar_id": 1,
        "usuar_nome": "Admin",
        "usuar_foto_perfil": "uploads/user_1.jpg",
        "invite_estado": "confirmado"
      }
    ]
  }
}
```

**Error Response**
- `400 Bad Request` → `"eventId em falta"`
- `404 Not Found` → `"Evento não encontrado"`

**Notes**
- Os participantes são devolvidos ordenados por estado (`confirmado` → `pendente` → `recusado` → `cancelado`) e depois por nome.

---

### Convidar para evento

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=invite_to_event
eventId=1
inviteeId=2
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Responses**
- `400 Bad Request` → `"Dados em falta"`
- `404 Not Found` → `"Evento não encontrado"`
- `403 Forbidden` → `"Só o criador pode convidar"`
- `400 Bad Request` → `"Sem conexão com este utilizador"`
- `400 Bad Request` → `"Utilizador já convidado"`

---

### Aceitar convite

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=accept_event
eventId=1
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Response**
- `400 Bad Request` → `"Convite não encontrado"`

---

### Recusar convite / sair de evento

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=decline_event
eventId=1
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Responses**
- `400 Bad Request` → `"Convite não encontrado"`
- `400 Bad Request` → `"O criador não pode sair — cancela o evento"`

---

### Cancelar evento

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=cancel_event
eventId=1
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Response**
- `403 Forbidden` → `"Sem permissão"`

**Notes**
- Todos os convites associados passam automaticamente ao estado `cancelado`.

---

### Apagar evento

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=delete_event
eventId=1
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Response**
- `400 Bad Request` → `"Só é possível apagar eventos cancelados"`

---

### Eventos com localização (mapa)

- **URL:** `/api/api.php?action=get_map_events`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    {
      "evento_id": 1,
      "evento_titulo": "Concerto Arctic Monkeys",
      "evento_local": "Altice Arena, Lisboa",
      "evento_lat": "38.768100",
      "evento_lng": "-9.095200",
      "evento_data": "2026-06-14 21:00:00"
    }
  ]
}
```

**Notes**
- Devolve apenas eventos confirmados com coordenadas definidas e estado diferente de `cancelado`.

---

## Reports

### Reportar utilizador

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=report_user
reportedId=7
reason=Spam
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Responses**
- `400 Bad Request` → `"Dados em falta"`
- `400 Bad Request` → `"Não te podes reportar a ti mesmo"`
- `400 Bad Request` → `"Já reportaste este utilizador"`

---

## Administração

> Todos os endpoints desta secção requerem `role: "admin"`. Caso contrário a resposta é `403 Forbidden` → `"Sem permissão"`.

---

### Estatísticas globais

- **URL:** `/api/api.php?action=admin_stats`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": {
    "users": 10,
    "banned": 0,
    "events": 5,
    "connections": 13,
    "messages": 24,
    "reports": 0
  }
}
```

**Notes**
- O campo `reports` conta apenas os reports com estado `pending`.

---

### Listar utilizadores (com pesquisa)

- **URL:** `/api/api.php?action=admin_get_users&q=:termo`
- **Method:** `GET`

**URL Params**
- `q` (string) — obrigatório. Pode ser um nome parcial ou um ID numérico.

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    {
      "usuar_id": 1,
      "usuar_nome": "Admin",
      "usuar_email": "admin@moodly.pt",
      "usuar_role": "admin",
      "usuar_banned": 0,
      "usuar_foto_perfil": "uploads/user_1.jpg"
    }
  ]
}
```

**Notes**
- Se `q` estiver vazio, devolve array vazio. Se `q` for numérico, filtra por ID exato. Caso contrário, filtra por nome com `LIKE %q%`. Máx. 20 resultados.

---

### Banir / desbanir utilizador

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=admin_ban
targetId=7
banned=1           (1 para banir, 0 para desbanir)
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

---

### Listar todos os reports

- **URL:** `/api/api.php?action=admin_get_reports`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    {
      "report_id": 1,
      "report_reason": "Spam",
      "report_status": "pending",
      "report_created_at": "2026-04-25 10:00:00",
      "reporter_nome": "Beatriz Costa",
      "reported_nome": "Sofia Oliveira"
    }
  ]
}
```

---

### Resolver report

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=admin_resolve_report
reportId=1
status=reviewed        ("reviewed" ou "dismissed")
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

**Error Response**
- `400 Bad Request` → `"Status inválido"`

---

### Promover a admin

- **URL:** `/api/api.php`
- **Method:** `POST`

**Data Params (FormData)**
```
action=make_admin
targetId=3
```

**Success Response**
- `200 OK`
```json
{ "ok": true, "data": [] }
```

---

## Estatísticas (Admin)

> Todos os endpoints desta secção requerem `role: "admin"`.

---

### Interesses mais populares

- **URL:** `/api/api.php?action=stats_popular_interests`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "nome": "Elden Ring", "categoria": "Jogos", "total": 8 }
  ]
}
```

**Notes**
- Devolve os 15 subinteresses com mais utilizadores associados.

---

### Interesses que mais uniram pessoas

- **URL:** `/api/api.php?action=stats_uniting_interests`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "nome": "Elden Ring", "categoria": "Jogos", "conexoes": 5 }
  ]
}
```

**Notes**
- Devolve os 15 subinteresses que mais vezes estiveram na origem de uma conexão aceite (partilhados pelos dois lados do pedido).

---

### Atividade de mensagens — últimos 14 dias

- **URL:** `/api/api.php?action=stats_activity`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "dia": "2026-05-15", "mensagens": 12 },
    { "dia": "2026-05-16", "mensagens": 0 }
  ]
}
```

**Notes**
- Devolve sempre 14 entradas (uma por dia), preenchendo com `0` os dias sem atividade.

---

### Distribuição de utilizadores por role

- **URL:** `/api/api.php?action=stats_registrations`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "role": "user", "total": 9 },
    { "role": "admin", "total": 1 }
  ]
}
```

---

### Estado dos pedidos de conexão

- **URL:** `/api/api.php?action=stats_connections_over_time`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "estado": "aceite", "total": 13 },
    { "estado": "pendente", "total": 2 },
    { "estado": "recusado", "total": 1 }
  ]
}
```

---

### Distribuição de interesses por categoria

- **URL:** `/api/api.php?action=stats_category_distribution`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "categoria": "Música", "total": 34 },
    { "categoria": "Jogos", "total": 22 }
  ]
}
```

---

### Participação em eventos

- **URL:** `/api/api.php?action=stats_event_participation`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "estado": "confirmado", "total": 15 },
    { "estado": "pendente", "total": 4 },
    { "estado": "recusado", "total": 2 },
    { "estado": "cancelado", "total": 1 }
  ]
}
```

---

### Top 5 utilizadores mais conectados

- **URL:** `/api/api.php?action=stats_top_users`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": [
    { "nome": "Ana Silva", "foto": "uploads/user_1.jpg", "conexoes": 7 }
  ]
}
```

---

### Análise descritiva completa

- **URL:** `/api/api.php?action=stats_descriptive`
- **Method:** `GET`

**Success Response**
- `200 OK`
```json
{
  "ok": true,
  "data": {
    "conexoes": {
      "media": 2.6,
      "mediana": 2.0,
      "moda": 2,
      "desvio": 1.85,
      "min": 0,
      "max": 7,
      "p25": 1,
      "p75": 4,
      "n": 10
    },
    "interesses_por_categoria": [
      { "categoria": "Música", "media": 2.4, "utilizadores": 8 }
    ],
    "polarizador": {
      "subinter_id": 5,
      "nome": "Elden Ring",
      "categoria": "Jogos",
      "utilizadores": 6,
      "conexoes": 1
    },
    "eventos": {
      "media_participantes": 3.2,
      "max_participantes": 6,
      "min_participantes": 1
    },
    "mensagens": {
      "media_por_conversa": 4.1,
      "max_numa_conversa": 18,
      "conversas_sem_msgs": 2
    },
    "bivariada": [
      { "grupo": "0", "media_conexoes": "0.00", "utilizadores": 1 },
      { "grupo": "1-3", "media_conexoes": "2.50", "utilizadores": 4 }
    ],
    "_raw_conn_values": [0, 1, 2, 2, 3, 4],
    "_raw_msg_values": [0, 2, 5, 18]
  }
}
```

**Notes**
- `conexoes` — estatísticas descritivas do número de conexões aceites por utilizador (média, mediana, moda, desvio padrão, mínimo, máximo, percentis P25/P75 e n).
- `interesses_por_categoria` — média de interesses por utilizador em cada categoria.
- `polarizador` — interesse com mais utilizadores mas menor taxa de conversão em conexões (score = utilizadores / (conexões + 1)).
- `eventos` — média, máximo e mínimo de participantes confirmados por evento.
- `mensagens` — média, máximo de mensagens por conversa e número de conversas sem mensagens.
- `bivariada` — correlação entre número de interesses (agrupados) e média de conexões.
- `_raw_conn_values` e `_raw_msg_values` — valores brutos para construção de histogramas no cliente.

---

## Nota

Como referência para a estrutura desta documentação usamos:  
https://www.bocoup.com/blog/documenting-your-api
