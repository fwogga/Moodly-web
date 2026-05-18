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
      <div class="event-item ${cancelled ? 'cancelled' : ''}"
           onclick="EventsPage.showDetail(${e.evento_id})" style="cursor:pointer;">
        <div class="event-title">${e.evento_titulo}</div>
        <div class="event-meta">${e.evento_data}</div>
        <div class="event-meta">${e.evento_local || 'Sem local'} · Organizado por ${e.organizador}</div>
        <div class="event-meta">${e.confirmados} confirmados</div>
        <div class="event-footer" onclick="event.stopPropagation()">
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

    const btns = [`<button class="btn btn-sm btn-outline" onclick="EventsPage.openChat(${e.evento_id},'${e.evento_titulo.replace(/'/g,"\\'")}')">Chat</button>`];
    if (isCreator) {
      btns.push(`<button class="btn btn-sm btn-outline" onclick="EventsPage.showInvite(${e.evento_id})">Convidar</button>`);
      btns.push(`<button class="btn btn-sm btn-danger" onclick="EventsPage.cancel(${e.evento_id})">Cancelar evento</button>`);
    } else {
      btns.push(`<button class="btn btn-sm btn-danger" onclick="EventsPage.decline(${e.evento_id})">Sair</button>`);
    }
    return btns.join('');
  },

  // ── map picker state ──────────────────────────────────────────
  _pickerMap:    null,
  _pickerMarker: null,
  _pickerLat:    null,
  _pickerLng:    null,
  _locationTimer: null,

  async showCreate() {
    await EventsPage._loadLeaflet();

    Components.modal(`
      <h3>Criar Evento</h3>
      <div class="form-group"><label class="form-label">Título *</label>
        <input class="form-input" id="ev-title" type="text" placeholder="Nome do evento"/></div>
      <div class="form-group"><label class="form-label">Descrição</label>
        <input class="form-input" id="ev-desc" type="text" placeholder="Descrição"/></div>
      <div class="form-group">
        <label class="form-label">Local</label>
        <input class="form-input" id="ev-location" type="text" placeholder="Pesquisar localização..."
               oninput="EventsPage.searchLocation(this.value)"/>
        <div id="loc-suggestions" style="border:1px solid #444;display:none;max-height:140px;overflow-y:auto;background:#1a1a1a;font-size:0.82rem;position:relative;z-index:10;"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Localização no mapa <span style="color:#777;font-weight:400;">— clica para marcar</span></label>
        <div id="picker-map" style="width:100%;height:200px;border:1px solid #444;"></div>
        <div id="picker-coords" style="font-size:0.75rem;color:#777;margin-top:4px;">Sem localização marcada</div>
      </div>
      <div class="form-group"><label class="form-label">Data *</label>
        <input class="form-input" id="ev-date" type="datetime-local"/></div>
      <div id="ev-err" class="error-msg" style="display:none;margin-bottom:8px;"></div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Components.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="EventsPage.create()">Criar</button>
      </div>`);

    EventsPage._pickerLat    = null;
    EventsPage._pickerLng    = null;
    EventsPage._pickerMarker = null;
    setTimeout(() => EventsPage._initPickerMap(), 50);
  },

  async _loadLeaflet() {
    if (typeof L !== 'undefined') return;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    await new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  },

  _initPickerMap() {
    const mapEl = document.getElementById('picker-map');
    if (!mapEl || typeof L === 'undefined') return;

    const map = L.map('picker-map').setView([38.72, -9.13], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', ev => {
      const { lat, lng } = ev.latlng;
      EventsPage._pickerLat = lat.toFixed(6);
      EventsPage._pickerLng = lng.toFixed(6);

      if (EventsPage._pickerMarker) {
        EventsPage._pickerMarker.setLatLng([lat, lng]);
      } else {
        EventsPage._pickerMarker = L.marker([lat, lng]).addTo(map);
      }

      const coordsEl = document.getElementById('picker-coords');
      if (coordsEl) coordsEl.textContent = `Lat: ${EventsPage._pickerLat}  Lng: ${EventsPage._pickerLng}`;

      const locationInput = document.getElementById('ev-location');
      if (!locationInput?.value.trim()) EventsPage._reverseGeocode(lat, lng);
    });

    EventsPage._pickerMap = map;
  },

  async _reverseGeocode(lat, lng) {
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'pt' } });
      const data = await res.json();
      const input = document.getElementById('ev-location');
      if (input && data.address) {
        const a = data.address;
        input.value = [a.city || a.town || a.village, a.country].filter(Boolean).join(', ');
      }
    } catch (e) { /* user types manually */ }
  },

  searchLocation(term) {
    clearTimeout(EventsPage._locationTimer);
    const sugEl = document.getElementById('loc-suggestions');
    if (!term.trim()) { if (sugEl) sugEl.style.display = 'none'; return; }

    EventsPage._locationTimer = setTimeout(async () => {
      try {
        const res     = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=json&limit=5`, { headers: { 'Accept-Language': 'pt' } });
        const results = await res.json();
        if (!sugEl) return;
        if (!results.length) { sugEl.style.display = 'none'; return; }
        sugEl.style.display = 'block';
        sugEl.innerHTML = results.map(p => `
          <div style="padding:7px 10px;cursor:pointer;border-bottom:1px solid #333;"
               onmousedown="EventsPage.pickLocation('${p.display_name.replace(/'/g,"\\'")}', ${p.lat}, ${p.lon})">
            ${p.display_name}
          </div>`).join('');
      } catch (e) { if (sugEl) sugEl.style.display = 'none'; }
    }, 400);
  },

  pickLocation(name, lat, lng) {
    const input = document.getElementById('ev-location');
    const sugEl = document.getElementById('loc-suggestions');
    if (input) input.value = name;
    if (sugEl) sugEl.style.display = 'none';

    EventsPage._pickerLat = parseFloat(lat).toFixed(6);
    EventsPage._pickerLng = parseFloat(lng).toFixed(6);

    const coordsEl = document.getElementById('picker-coords');
    if (coordsEl) coordsEl.textContent = `Lat: ${EventsPage._pickerLat}  Lng: ${EventsPage._pickerLng}`;

    if (EventsPage._pickerMap) {
      const pos = [parseFloat(lat), parseFloat(lng)];
      EventsPage._pickerMap.setView(pos, 14);
      if (EventsPage._pickerMarker) {
        EventsPage._pickerMarker.setLatLng(pos);
      } else {
        EventsPage._pickerMarker = L.marker(pos).addTo(EventsPage._pickerMap);
      }
    }
  },

  async create() {
    const title    = document.getElementById('ev-title')?.value.trim();
    const desc     = document.getElementById('ev-desc')?.value.trim();
    const location = document.getElementById('ev-location')?.value.trim();
    const date     = document.getElementById('ev-date')?.value;
    const errEl    = document.getElementById('ev-err');
    errEl.style.display = 'none';
    if (!title || !date) { errEl.textContent = 'Título e data são obrigatórios'; errEl.style.display = 'block'; return; }

    const res = await App.api('create_event', {
      title, description: desc, location,
      lat: EventsPage._pickerLat || '',
      lng: EventsPage._pickerLng || '',
      date,
    });
    if (!res.ok) { errEl.textContent = res.error; errEl.style.display = 'block'; return; }

    EventsPage._pickerMap = null; EventsPage._pickerMarker = null;
    EventsPage._pickerLat = null; EventsPage._pickerLng    = null;

    Components.closeModal();
    Components.toast('Evento criado!', 'success');
    App.state.eventsLoaded = false;
    App.navigate('events');
  },

  async showDetail(eventId) {
    const res = await App.api('get_event_detail', { eventId }, 'GET');
    if (!res.ok) { Components.toast(res.error, 'error'); return; }

    const { event: e, participants } = res.data;
    const confirmed = participants.filter(p => p.invite_estado === 'confirmado');
    const pending   = participants.filter(p => p.invite_estado === 'pendente');
    const declined  = participants.filter(p => ['recusado','cancelado'].includes(p.invite_estado));

    const participantRow = (p) => `
      <div style="display:flex;align-items:center;gap:8px;padding:5px 0;">
        ${Components.avatar(p.usuar_nome, 30, p.usuar_foto_perfil || '')}
        <span style="font-size:0.84rem;flex:1;">${p.usuar_nome}</span>
      </div>`;

    Components.modal(`
      <h3>${e.evento_titulo}</h3>
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px;">
        <div style="font-size:0.82rem;color:#aaa;">📅 ${e.evento_data}</div>
        <div style="font-size:0.82rem;color:#aaa;">📍 ${e.evento_local || 'Sem local'}</div>
        <div style="font-size:0.82rem;color:#aaa;">👤 Organizado por ${e.organizador}</div>
        ${e.evento_descricao ? `<div style="font-size:0.84rem;margin-top:6px;">${e.evento_descricao}</div>` : ''}
      </div>

      ${confirmed.length ? `
        <div style="margin-bottom:12px;">
          <div style="font-size:0.72rem;color:#4ade80;text-transform:uppercase;font-weight:700;margin-bottom:4px;">
            Confirmados (${confirmed.length})
          </div>
          ${confirmed.map(participantRow).join('')}
        </div>` : ''}

      ${pending.length ? `
        <div style="margin-bottom:12px;">
          <div style="font-size:0.72rem;color:#FFD600;text-transform:uppercase;font-weight:700;margin-bottom:4px;">
            Pendentes (${pending.length})
          </div>
          ${pending.map(participantRow).join('')}
        </div>` : ''}

      ${declined.length ? `
        <div style="margin-bottom:12px;">
          <div style="font-size:0.72rem;color:#f87171;text-transform:uppercase;font-weight:700;margin-bottom:4px;">
            Recusaram (${declined.length})
          </div>
          ${declined.map(participantRow).join('')}
        </div>` : ''}

      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Components.closeModal()">Fechar</button>
      </div>
    `);
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

  async showInvite(eventId) {
    if (!App.state.connections.length) {
      const res = await App.api('get_connections', {}, 'GET');
      if (res.ok) App.state.connections = res.data.connections;
    }

    const connections = App.state.connections;

    Components.modal(`
      <h3>Convidar para o evento</h3>
      ${!connections.length
        ? `<p style="color:#777;font-size:0.85rem;">Não tens conexões para convidar.</p>`
        : `<div style="display:flex;flex-direction:column;gap:4px;max-height:300px;overflow-y:auto;">
            ${connections.map(c => `
              <div class="row" style="cursor:pointer;padding:8px;" onclick="EventsPage.sendInvite(${eventId}, ${c.usuar_id}, '${c.usuar_nome.replace(/'/g,"\\'")}')">
                ${Components.avatar(c.usuar_nome, 32, c.usuar_foto_perfil || '')}
                <div class="row-name">${c.usuar_nome}</div>
                <span style="color:#777;font-size:0.78rem;">#${c.usuar_id}</span>
              </div>`).join('')}
           </div>`
      }
      <div id="inv-err" style="color:#f87171;font-size:0.8rem;display:none;margin-top:8px;"></div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Components.closeModal()">Fechar</button>
      </div>`);
  },

  async sendInvite(eventId, inviteeId, name) {
    const errEl = document.getElementById('inv-err');
    const res = await App.api('invite_to_event', { eventId, inviteeId });
    if (res.ok) {
      Components.closeModal();
      Components.toast(`${name} convidado!`, 'success');
    } else {
      if (errEl) { errEl.textContent = res.error; errEl.style.display = 'block'; }
      else Components.toast(res.error, 'error');
    }
  },

  openChat(eventId, title) {
    App.state.activeEventId  = eventId;
    App.state.activeChatId   = null;
    App.state.activeChatName = title;
    App.state.eventMessages  = [];
    App.state.chatsLoaded    = false;
    App.navigate('chats');
  },

  async loadMap() {
    const res = await App.api('get_map_events', {}, 'GET');
    if (!res.ok || !res.data.length) { Components.toast('Sem eventos com localização.', 'info'); return; }

    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    await EventsPage._loadLeaflet();

    const first = res.data[0];
    const map = L.map('map').setView([first.evento_lat, first.evento_lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    res.data.forEach(ev => {
      L.marker([ev.evento_lat, ev.evento_lng])
       .bindPopup(`<b>${ev.evento_titulo}</b><br>${ev.evento_local || ''}<br>${ev.evento_data}`)
       .addTo(map);
    });
  },
}