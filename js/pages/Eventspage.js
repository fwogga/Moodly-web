const EventsPage = {

render() {
if (!App.state.eventsLoaded) {
App.state.eventsLoaded = true;
EventsPage.load();
return Components.shell(`
  <div class="page-header"><div><h1>Eventos</h1><p>A carregar...</p></div></div>
`, 'events');
}

const events = App.state.events;

return Components.shell(`
<div class="page-header">
  <div><h1>Eventos</h1><p>Os teus eventos e convites</p></div>
  <button class="btn btn-primary" onclick="EventsPage.showCreate()">+ Criar evento</button>
</div>

${!events.length
  ? `<div class="empty"><h3>Sem eventos</h3><p>Cria um evento ou aceita um convite.</p></div>`
  : `<div class="events-list">${events.map(e => EventsPage.eventItem(e)).join('')}</div>`
}

<div style="margin-top:24px;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
    <div style="font-weight:700;">Mapa</div>
    <button class="btn btn-outline btn-sm" onclick="EventsPage.loadMap()">Mostrar no mapa</button>
  </div>
  <div id="map"></div>
</div>
`, 'events');
},

async load() {
const res = await App.api('get_events', {}, 'GET');
if (res.ok) App.state.events = res.data;
App.render();
},

eventItem(e) {
const cancelled = e.evento_estado === 'cancelado';
const pending   = e.invite_estado === 'pendente';
const isCreator = String(e.evento_usuar_id) === String(App.state.user?.userId);

return `
<div class="event-item ${cancelled ? 'cancelled' : ''}">
  <div class="event-title">${e.evento_titulo}</div>
  <div class="event-meta">${e.evento_data}</div>
  <div class="event-meta">${e.evento_local || 'Sem local'} · Organizado por ${e.organizador}</div>
  <div class="event-meta">${e.confirmados} confirmados</div>
  <div class="event-footer">
    ${cancelled ? `<span class="badge-cancelled">Cancelado</span>` : ''}
    ${pending   ? `<span class="badge-pending">Convite pendente</span>` : ''}
    ${EventsPage.eventActions(e, cancelled, pending, isCreator)}
  </div>
</div>`;
},

eventActions(e, cancelled, pending, isCreator) {
if (cancelled && isCreator) return `<button class="btn btn-sm btn-danger" onclick="EventsPage.deleteEvent(${e.evento_id})">Apagar</button>`;
if (cancelled) return '';
if (pending) return `
<button class="btn btn-sm btn-primary" onclick="EventsPage.accept(${e.evento_id})">Aceitar</button>
<button class="btn btn-sm btn-danger"  onclick="EventsPage.decline(${e.evento_id})">Recusar</button>`;

const btns = [`<button class="btn btn-sm btn-outline" onclick="EventsPage.openChat(${e.evento_id},'${e.evento_titulo}')">Chat</button>`];
if (isCreator) {
btns.push(`<button class="btn btn-sm btn-outline" onclick="EventsPage.showInvite(${e.evento_id})">Convidar</button>`);
btns.push(`<button class="btn btn-sm btn-danger" onclick="EventsPage.cancel(${e.evento_id})">Cancelar evento</button>`);
} else {
btns.push(`<button class="btn btn-sm btn-danger" onclick="EventsPage.decline(${e.evento_id})">Sair</button>`);
}
return btns.join('');
},

showCreate() {
Components.modal(`
<h3>Criar Evento</h3>
<div class="form-group"><label class="form-label">Título *</label>
  <input class="form-input" id="ev-title" type="text" placeholder="Nome do evento"/></div>
<div class="form-group"><label class="form-label">Descrição</label>
  <input class="form-input" id="ev-desc" type="text" placeholder="Descrição"/></div>
<div class="form-group"><label class="form-label">Local</label>
  <input class="form-input" id="ev-location" type="text" placeholder="ex: Lisboa, Musicbox"/></div>
<div class="form-group"><label class="form-label">Latitude</label>
  <input class="form-input" id="ev-lat" type="number" step="any" placeholder="ex: 38.72"/></div>
<div class="form-group"><label class="form-label">Longitude</label>
  <input class="form-input" id="ev-lng" type="number" step="any" placeholder="ex: -9.13"/></div>
<div class="form-group"><label class="form-label">Data *</label>
  <input class="form-input" id="ev-date" type="datetime-local"/></div>
<div id="ev-err" class="error-msg" style="display:none;margin-bottom:8px;"></div>
<div class="modal-footer">
  <button class="btn btn-outline" onclick="Components.closeModal()">Cancelar</button>
  <button class="btn btn-primary" onclick="EventsPage.create()">Criar</button>
</div>`);
},

async create() {
const title    = document.getElementById('ev-title')?.value.trim();
const desc     = document.getElementById('ev-desc')?.value.trim();
const location = document.getElementById('ev-location')?.value.trim();
const lat      = document.getElementById('ev-lat')?.value;
const lng      = document.getElementById('ev-lng')?.value;
const date     = document.getElementById('ev-date')?.value;
const errEl    = document.getElementById('ev-err');
errEl.style.display = 'none';
if (!title || !date) { errEl.textContent = 'Título e data são obrigatórios'; errEl.style.display = 'block'; return; }

const res = await App.api('create_event', { title, description: desc, location, lat, lng, date });
if (!res.ok) { errEl.textContent = res.error; errEl.style.display = 'block'; return; }

Components.closeModal();
Components.toast('Evento criado!', 'success');
App.state.eventsLoaded = false;
App.navigate('events');
},

async accept(eventId) {
const res = await App.api('accept_event', { eventId });
if (res.ok) { Components.toast('Participação confirmada!', 'success'); App.state.eventsLoaded = false; App.navigate('events'); }
else Components.toast(res.error, 'error');
},

async decline(eventId) {
const res = await App.api('decline_event', { eventId });
if (res.ok) { App.state.eventsLoaded = false; App.navigate('events'); }
else Components.toast(res.error, 'error');
},

async cancel(eventId) {
if (!confirm('Cancelar este evento?')) return;
const res = await App.api('cancel_event', { eventId });
if (res.ok) { Components.toast('Evento cancelado.', 'info'); App.state.eventsLoaded = false; App.navigate('events'); }
else Components.toast(res.error, 'error');
},

async deleteEvent(eventId) {
const res = await App.api('delete_event', { eventId });
if (res.ok) { App.state.eventsLoaded = false; App.navigate('events'); }
else Components.toast(res.error, 'error');
},

showInvite(eventId) {
Components.modal(`
<h3>Convidar para o evento</h3>
<div class="form-group"><label class="form-label">ID do utilizador</label>
  <input class="form-input" id="inv-id" type="number" placeholder="userId"/></div>
<div id="inv-err" class="error-msg" style="display:none;margin-bottom:8px;"></div>
<div class="modal-footer">
  <button class="btn btn-outline" onclick="Components.closeModal()">Cancelar</button>
  <button class="btn btn-primary" onclick="EventsPage.sendInvite(${eventId})">Convidar</button>
</div>`);
},

async sendInvite(eventId) {
const inviteeId = document.getElementById('inv-id')?.value;
const errEl     = document.getElementById('inv-err');
errEl.style.display = 'none';
const res = await App.api('invite_to_event', { eventId, inviteeId });
if (res.ok) { Components.closeModal(); Components.toast('Convite enviado!', 'success'); }
else { errEl.textContent = res.error; errEl.style.display = 'block'; }
},

openChat(eventId, title) {
App.state.activeEventId  = eventId;
App.state.activeChatId   = null;
App.state.activeChatName = title;
App.state.eventMessages  = [];
App.state.chatsLoaded    = true;
ChatsPage.loadEventMessages(eventId);
},

async loadMap() {
const res = await App.api('get_map_events', {}, 'GET');
if (!res.ok || !res.data.length) { Components.toast('Sem eventos com localização.', 'info'); return; }

const mapEl = document.getElementById('map');
if (!mapEl) return;

if (typeof L === 'undefined') {
const link = document.createElement('link');
link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
document.head.appendChild(link);
await new Promise(resolve => {
  const s = document.createElement('script');
  s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  s.onload = resolve; document.head.appendChild(s);
});
}

const first = res.data[0];
const map = L.map('map').setView([first.evento_lat, first.evento_lng], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
res.data.forEach(e => {
L.marker([e.evento_lat, e.evento_lng])
  .bindPopup(`<b>${e.evento_titulo}</b><br>${e.evento_local || ''}<br>${e.evento_data}`)
  .addTo(map);
});
},
};