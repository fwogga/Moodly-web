const ProfilePage = {

  render() {
    if (!App.state.connectionsLoaded) {
      App.state.connectionsLoaded = true;
      ProfilePage.load();
      return Components.shell(`
        <div class="page-header"><div><h1>Perfil</h1></div></div>
        <p style="color:var(--dim);">A carregar...</p>
      `, 'profile');
    }

    const u = App.state.profile;
    if (!u) return Components.shell(`<div class="empty"><h3>Erro a carregar perfil</h3></div>`, 'profile');

    return Components.shell(`
      <div class="page-header">
        <div><h1>Perfil</h1><p>Gere as tuas informações</p></div>
      </div>

      <div class="profile-grid">

        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="card" style="text-align:center;padding:0;overflow:hidden;">
            <div style="height:100px;background:linear-gradient(135deg,#4c0090,#1a0040);position:relative;">
              <button onclick="App.logout()" style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:4px 10px;font-size:0.75rem;font-weight:600;color:rgba(255,255,255,0.7);cursor:pointer;backdrop-filter:blur(4px);">Sair</button>
            </div>
            <div style="padding:0 20px 20px;">
              <div class="profile-avatar-big">
                ${u.usuar_foto_perfil
                  ? `<img src="${u.usuar_foto_perfil}"/>`
                  : `<span>${(u.usuar_nome||'?')[0].toUpperCase()}</span>`
                }
              </div>
              <div class="profile-name">${u.usuar_nome}</div>
              <div style="display:flex;justify-content:center;gap:28px;padding:12px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:16px;">
                <div style="text-align:center;">
                  <div style="font-size:1.2rem;font-weight:800;color:#fff;">${u.connection_count}</div>
                  <div style="font-size:0.68rem;color:var(--dim);text-transform:uppercase;letter-spacing:0.4px;">Conexões</div>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                <label style="display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;padding:9px;font-size:0.86rem;font-weight:600;transition:background 0.15s;">
                  Alterar foto
                  <input type="file" accept="image/*" style="display:none" onchange="ProfilePage.openCropper(this)"/>
                </label>
                <button onclick="ProfilePage.showEdit()" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;padding:9px;font-size:0.86rem;font-weight:600;">Editar nome</button>
                <button onclick="ProfilePage.showEditInterests()" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;padding:9px;font-size:0.86rem;font-weight:600;">Editar interesses</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="card" style="margin-bottom:14px;">
            <div class="card-title">Interesses</div>
            ${Components.interestCategories(u.interests || [])}
          </div>

          ${App.state.pendingRequests.length ? `
            <div class="card" style="border-color:rgba(255,214,0,0.25);margin-bottom:14px;">
              <div class="card-title" style="color:var(--yellow);">Pedidos recebidos (${App.state.pendingRequests.length})</div>
              ${App.state.pendingRequests.map(r => `
                <div class="conn-item">
                  ${Components.avatar(r.usuar_nome, 34)}
                  <div class="conn-name">${r.usuar_nome}</div>
                  <div class="conn-actions">
                    <button class="btn btn-sm btn-primary" onclick="ProfilePage.accept(${r.request_id})">Aceitar</button>
                    <button class="btn btn-sm btn-danger"  onclick="ProfilePage.reject(${r.request_id})">Recusar</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="card">
            <div class="card-title">Conexões (${App.state.connections.length})</div>
            ${App.state.connections.map(c => `
              <div class="conn-item">
                ${Components.avatar(c.usuar_nome, 34, c.usuar_foto_perfil || '')}
                <div class="conn-name">${c.usuar_nome}</div>
              </div>
            `).join('')}
            ${!App.state.connections.length
              ? `<span style="color:var(--dim);font-size:0.84rem;">Sem conexões ainda</span>`
              : ''}
          </div>
        </div>

      </div>
    `, 'profile');
  },

  openCropper(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target.result;
      Components.modal(`
        <h3>Ajustar foto</h3>
        <div id="crop-container" style="position:relative;width:100%;height:300px;overflow:hidden;background:#111;border-radius:10px;margin-bottom:16px;">
          <img id="crop-img" src="${src}" style="position:absolute;top:0;left:0;cursor:move;max-width:none;user-select:none;" draggable="false"/>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
            <div style="width:220px;height:220px;border-radius:50%;border:3px solid rgba(255,214,0,0.8);box-shadow:0 0 0 9999px rgba(0,0,0,0.55);"></div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="font-size:0.8rem;color:var(--dim);">Zoom</span>
          <input type="range" id="crop-zoom" min="0.1" max="3" step="0.01" value="1" style="flex:1;accent-color:var(--yellow);" oninput="ProfilePage._cropZoom(this.value)"/>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="Components.closeModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="ProfilePage.uploadCropped()">Guardar</button>
        </div>
      `);
      setTimeout(() => ProfilePage._initCropper(src), 50);
    };
    reader.readAsDataURL(file);
  },

  _cropState: { x: 0, y: 0, scale: 1, dragging: false, startX: 0, startY: 0, imgW: 0, imgH: 0 },

  _initCropper(src) {
    const img = document.getElementById('crop-img');
    if (!img) return;
    const s = ProfilePage._cropState;
    s.scale = 1; s.x = 0; s.y = 0;
    const tempImg = new Image();
    tempImg.onload = () => {
      s.imgW = tempImg.naturalWidth;
      s.imgH = tempImg.naturalHeight;
      const container = document.getElementById('crop-container');
      const cw = container.clientWidth, ch = container.clientHeight;
      const minScale = Math.min(cw / s.imgW, ch / s.imgH);
      s.scale = Math.max(220 / s.imgW, 220 / s.imgH);
      const zoomEl = document.getElementById('crop-zoom');
      if (zoomEl) {
        zoomEl.min   = minScale.toFixed(3);
        zoomEl.max   = '3';
        zoomEl.value = s.scale.toFixed(3);
        zoomEl.step  = '0.001';
      }
      ProfilePage._cropApply();
    };
    tempImg.src = src;
    img.addEventListener('mousedown', e => { s.dragging = true; s.startX = e.clientX - s.x; s.startY = e.clientY - s.y; e.preventDefault(); });
    document.addEventListener('mousemove', ProfilePage._cropMove);
    document.addEventListener('mouseup', () => { s.dragging = false; });
    img.addEventListener('touchstart', e => { const t = e.touches[0]; s.dragging = true; s.startX = t.clientX - s.x; s.startY = t.clientY - s.y; }, { passive: true });
    document.addEventListener('touchmove', ProfilePage._cropTouchMove, { passive: false });
    document.addEventListener('touchend', () => { s.dragging = false; });

    const container = document.getElementById('crop-container');
    container.addEventListener('wheel', e => {
      e.preventDefault();
      const zoomEl = document.getElementById('crop-zoom');
      const delta  = e.deltaY < 0 ? 0.05 : -0.05;
      const min    = parseFloat(zoomEl.min);
      const max    = parseFloat(zoomEl.max);
      ProfilePage._cropZoomToCenter(Math.min(max, Math.max(min, s.scale + delta)));
      zoomEl.value = s.scale;
    }, { passive: false });
  },

  _cropMove(e) {
    const s = ProfilePage._cropState;
    if (!s.dragging) return;
    s.x = e.clientX - s.startX; s.y = e.clientY - s.startY;
    ProfilePage._cropApply();
  },

  _cropTouchMove(e) {
    const s = ProfilePage._cropState;
    if (!s.dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    s.x = t.clientX - s.startX; s.y = t.clientY - s.startY;
    ProfilePage._cropApply();
  },

  _cropZoom(val) {
    ProfilePage._cropZoomToCenter(parseFloat(val));
  },

  _cropZoomToCenter(newScale) {
    const s = ProfilePage._cropState;
    const container = document.getElementById('crop-container');
    if (!container) return;
    const cw = container.clientWidth, ch = container.clientHeight;
    const circleCenterX = cw / 2, circleCenterY = ch / 2;
    const imgPointX = (circleCenterX - s.x) / s.scale;
    const imgPointY = (circleCenterY - s.y) / s.scale;
    s.scale = newScale;
    s.x = circleCenterX - imgPointX * s.scale;
    s.y = circleCenterY - imgPointY * s.scale;
    ProfilePage._cropApply();
  },

  _cropApply() {
    const img = document.getElementById('crop-img');
    if (!img) return;
    const s = ProfilePage._cropState;
    img.style.width     = (s.imgW * s.scale) + 'px';
    img.style.height    = (s.imgH * s.scale) + 'px';
    img.style.transform = `translate(${s.x}px, ${s.y}px)`;
  },

  async uploadCropped() {
    const img = document.getElementById('crop-img');
    const container = document.getElementById('crop-container');
    if (!img || !container) return;
    const s   = ProfilePage._cropState;
    const cw  = container.clientWidth, ch = container.clientHeight;
    const size = 220;
    const offX = (cw - size) / 2, offY = (ch - size) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, Math.PI * 2);
    ctx.clip();
    const scaleRatio = 300 / size;
    ctx.drawImage(img, (s.x - offX) * scaleRatio, (s.y - offY) * scaleRatio, s.imgW * s.scale * scaleRatio, s.imgH * s.scale * scaleRatio);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    Components.closeModal();

    const form = new FormData();
    form.append('action', 'upload_photo_cropped');
    form.append('imageData', imageData);
    const res  = await fetch('api/api.php', { method: 'POST', body: form });
    const json = await res.json();
    if (!json.ok) { Components.toast(json.error, 'error'); return; }
    if (App.state.profile) App.state.profile.usuar_foto_perfil = json.data.photo;
    App.state.user.photo = json.data.photo;
    App.state.profile    = null;
    App.state.connectionsLoaded = false;
    App.navigate('profile');
    Components.toast('Foto atualizada!', 'success');
  },

  async load() {
    const [profileRes, connRes] = await Promise.all([
      App.api('get_profile', {}, 'GET'),
      App.api('get_connections', {}, 'GET'),
    ]);
    if (profileRes.ok) App.state.profile = profileRes.data;
    if (connRes.ok) {
      App.state.connections     = connRes.data.connections;
      App.state.pendingRequests = connRes.data.pending;
    }
    App.render();
  },

  reload() {
    App.state.connectionsLoaded = false;
    App.state.profile           = null;
    App.navigate('profile');
  },

  showEdit() {
    const u = App.state.profile;
    Components.modal(`
      <h3>Editar Perfil</h3>
      <div class="form-group">
        <label class="form-label">Nome</label>
        <input class="form-input" id="ep-name" type="text" value="${u?.usuar_nome || ''}"/>
      </div>
      <div id="ep-err" class="error-msg" style="display:none;margin-bottom:8px;"></div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Components.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="ProfilePage.saveEdit()">Guardar</button>
      </div>`);
  },

  async saveEdit() {
    const name  = document.getElementById('ep-name')?.value.trim();
    const errEl = document.getElementById('ep-err');
    errEl.style.display = 'none';
    if (!name) { errEl.textContent = 'Nome inválido'; errEl.style.display = 'block'; return; }
    const res = await App.api('update_profile', { name });
    if (!res.ok) { errEl.textContent = res.error; errEl.style.display = 'block'; return; }
    App.state.user.name = name;
    Components.closeModal();
    Components.toast('Perfil atualizado!', 'success');
    ProfilePage.reload();
  },

  async uploadPhoto(input) {
    const file = input.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('action', 'upload_photo');
    form.append('photo', file);
    const res  = await fetch('api/api.php', { method: 'POST', body: form });
    const json = await res.json();
    if (json.ok) { Components.toast('Foto atualizada!', 'success'); ProfilePage.reload(); }
    else Components.toast(json.error, 'error');
  },

  showEditInterests() {
    App.state.selectedTags = (App.state.profile?.interests || []).map(t => ({
      id: t.subinter_id, nome: t.tag, categoria: t.categoria,
    }));
    Components.modal(`
      <h3>Editar Interesses</h3>
      ${InterestInput.render(App.state.selectedTags, 'InterestInput.remove')}
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Components.closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="ProfilePage.saveInterests()">Guardar</button>
      </div>`);
  },

  async saveInterests() {
    const tags = JSON.stringify(App.state.selectedTags.map(t => t.id));
    const res  = await App.api('set_interests', { tags });
    if (res.ok) { Components.closeModal(); Components.toast('Interesses atualizados!', 'success'); ProfilePage.reload(); }
    else Components.toast(res.error, 'error');
  },

  async accept(requestId) {
    const res = await App.api('accept_request', { requestId });
    if (res.ok) { Components.toast('Conexão aceite!', 'success'); ProfilePage.reload(); }
    else Components.toast(res.error, 'error');
  },

  async reject(requestId) {
    const res = await App.api('reject_request', { requestId });
    if (res.ok) ProfilePage.reload();
    else Components.toast(res.error, 'error');
  },

  showReport(userId, name) {
    Components.modal(`
      <h3>Reportar ${name}</h3>
      <div class="form-group">
        <label class="form-label">Motivo</label>
        <input class="form-input" id="rep-reason" type="text" placeholder="Descreve o problema"/>
      </div>
      <div id="rep-err" class="error-msg" style="display:none;margin-bottom:8px;"></div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="Components.closeModal()">Cancelar</button>
        <button class="btn btn-danger" onclick="ProfilePage.sendReport(${userId})">Reportar</button>
      </div>`);
  },

  async sendReport(userId) {
    const reason = document.getElementById('rep-reason')?.value.trim();
    const errEl  = document.getElementById('rep-err');
    errEl.style.display = 'none';
    if (!reason) { errEl.textContent = 'Preenche o motivo'; errEl.style.display = 'block'; return; }
    const res = await App.api('report_user', { reportedId: userId, reason });
    if (res.ok) { Components.closeModal(); Components.toast('Reportado.', 'info'); }
    else { errEl.textContent = res.error; errEl.style.display = 'block'; }
  },
};