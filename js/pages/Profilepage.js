const ProfilePage = {

  render() {
    if (!App.state.connectionsLoaded) {
      App.state.connectionsLoaded = true;
      ProfilePage.load();
      return Components.shell(`
        <div class="page-header"><div><h1>Perfil</h1></div></div>
        <p style="color:#777;">A carregar...</p>
      `, 'profile');
    }

    const u = App.state.profile;
    if (!u) return Components.shell(`<div class="empty"><h3>Erro a carregar perfil</h3></div>`, 'profile');

    return Components.shell(`
      <div class="page-header">
        <div><h1>Perfil</h1></div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-sm" onclick="ProfilePage.showEdit()">Editar</button>
          <button class="btn btn-outline btn-sm" onclick="App.logout()">Sair</button>
        </div>
      </div>

      <div class="profile-grid">

        <div class="profile-card">
          <div class="profile-avatar-big">
            ${u.usuar_foto_perfil
              ? `<img src="${u.usuar_foto_perfil}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`
              : `<span style="font-size:2rem;">${(u.usuar_nome||'?')[0].toUpperCase()}</span>`
            }
          </div>
          <div class="profile-name">${u.usuar_nome}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:14px;">
            <span style="color:#777;">Conexões</span>
            <span>${u.connection_count}</span>
          </div>
          <label class="btn btn-outline btn-full" style="cursor:pointer;">
            Alterar foto
            <input type="file" accept="image/*" style="display:none" onchange="ProfilePage.uploadPhoto(this)"/>
          </label>
        </div>

        <div>
          <div class="card">
            <div class="card-title">Interesses</div>
            ${Components.interestCategories(u.interests || [])}
            <button class="btn btn-outline btn-sm" style="margin-top:12px;"
                    onclick="ProfilePage.showEditInterests()">Editar interesses</button>
          </div>

          <div class="card">
            <div class="card-title">Conexões (${App.state.connections.length})</div>
            ${App.state.connections.map(c => `
              <div class="conn-item">
                ${Components.avatar(c.usuar_nome, 32, c.usuar_foto_perfil || '')}
                <div class="conn-name">${c.usuar_nome}</div>
              </div>
            `).join('')}
            ${!App.state.connections.length
              ? `<span style="color:#777;font-size:0.84rem;">Sem conexões ainda</span>`
              : ''}
          </div>

          ${App.state.pendingRequests.length ? `
            <div class="card">
              <div class="card-title">Pedidos recebidos (${App.state.pendingRequests.length})</div>
              ${App.state.pendingRequests.map(r => `
                <div class="conn-item">
                  ${Components.avatar(r.usuar_nome, 32)}
                  <div class="conn-name">${r.usuar_nome}</div>
                  <div class="conn-actions">
                    <button class="btn btn-sm btn-primary" onclick="ProfilePage.accept(${r.request_id})">Aceitar</button>
                    <button class="btn btn-sm btn-danger"  onclick="ProfilePage.reject(${r.request_id})">Recusar</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

      </div>
    `, 'profile');
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
    Components.toast('Perfil actualizado!', 'success');
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
    if (json.ok) { Components.toast('Foto actualizada!', 'success'); ProfilePage.reload(); }
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
    if (res.ok) { Components.closeModal(); Components.toast('Interesses actualizados!', 'success'); ProfilePage.reload(); }
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
};