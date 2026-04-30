const HomePage = {

  render() {
    if (!App.state.discoverLoaded) {
      App.state.discoverLoaded = true;
      HomePage.load();
      return Components.shell(`
        <div class="page-header"><div><h1>Descobrir</h1></div></div>
        <p style="color:var(--dim);">A carregar...</p>
      `, 'home');
    }

    const users = App.state.discoverUsers;
    const user  = users[App.state.discoverIndex] || null;

    if (!user) {
      return Components.shell(`
        <div class="page-header"><div><h1>Descobrir</h1></div></div>
        <div class="empty">
          <h3>Sem mais sugestões</h3>
          <p>Volta mais tarde.</p>
        </div>
      `, 'home');
    }

    const photo = user.usuar_foto_perfil || '';
    const inits = (user.usuar_nome || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();

    const html = Components.shell(`
      <div class="page-header">
        <div><h1>Descobrir</h1></div>
        <input type="text" placeholder="Pesquisar utilizadores..."
               style="width:220px;padding:5px 8px;background:#222;border:1px solid #444;color:#eee;"
               oninput="HomePage.search(this.value)"/>
      </div>

      <div id="search-results"></div>

      <div class="discover-wrap">

        <div class="discover-card">
          <div class="discover-photo">
            <div class="discover-photo-avatar">
              ${photo ? `<img src="${photo}"/>` : inits}
            </div>
            <div class="discover-name">${user.usuar_nome}</div>
            <div class="discover-score">${user.score || 0} interesses em comum</div>
          </div>
          <div class="discover-info">
            ${Components.interestCategories(user.interests || [])}
          </div>
        </div>

        <div class="discover-btns">
          <span class="discover-action connect"
                onclick="HomePage.connect(${user.usuar_id}, '${user.usuar_nome.replace(/'/g,"\\'")}')">
            Conectar
          </span>
          <span class="discover-action pass" onclick="HomePage.pass()">
            Passar
          </span>
          <span class="discover-action" style="color:#f87171;margin-top:12px;"
                onclick="HomePage.showReport(${user.usuar_id}, '${user.usuar_nome.replace(/'/g,"\\'")}')">
            Reportar
          </span>
        </div>

      </div>

      <div style="display:flex;gap:16px;margin-top:24px;align-items:flex-start;">

        <div style="flex:1;">
          <div style="font-weight:700;margin-bottom:8px;font-size:0.9rem;">Pedidos enviados</div>
          <div id="sent-requests-list" style="display:flex;flex-direction:column;gap:6px;">
            <span style="color:#777;font-size:0.82rem;">A carregar...</span>
          </div>
        </div>

        <div style="flex:1;">
          <div style="font-weight:700;margin-bottom:8px;font-size:0.9rem;">Novas conexões</div>
          <div id="new-connections-list" style="display:flex;flex-direction:column;gap:6px;">
            <span style="color:#777;font-size:0.82rem;">A carregar...</span>
          </div>
        </div>

      </div>
    `, 'home');

    setTimeout(() => HomePage.loadSocial(), 0);
    return html;
  },

  async load() {
    const res = await App.api('discover', {}, 'GET');
    if (res.ok) {
      App.state.discoverUsers = res.data;
      App.state.discoverIndex = 0;
    }
    App.render();
  },

  async loadSocial() {
    const [sentRes, newConnRes] = await Promise.all([
      App.api('get_sent_requests',   {}, 'GET'),
      App.api('get_new_connections', {}, 'GET'),
    ]);

    const sentEl    = document.getElementById('sent-requests-list');
    const newConnEl = document.getElementById('new-connections-list');

    if (sentEl) {
      const sent = sentRes.ok ? sentRes.data : [];
      sentEl.innerHTML = sent.length
        ? sent.map(u => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #2a2a2a;">
              ${Components.avatar(u.usuar_nome, 30, u.usuar_foto_perfil || '')}
              <div style="flex:1;font-size:0.84rem;">${u.usuar_nome}</div>
              <span style="font-size:0.72rem;color:#777;">Pendente</span>
            </div>`).join('')
        : `<span style="color:#777;font-size:0.82rem;">Sem pedidos pendentes</span>`;
    }

    if (newConnEl) {
      const newConns = newConnRes.ok ? newConnRes.data : [];
      newConnEl.innerHTML = newConns.length
        ? newConns.map(c => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #2a2a2a;">
              ${Components.avatar(c.usuar_nome, 30, c.usuar_foto_perfil || '')}
              <div style="flex:1;font-size:0.84rem;">${c.usuar_nome}</div>
              <button class="btn btn-sm btn-primary"
                      onclick="HomePage.startChat(${c.connection_id}, '${c.usuar_nome.replace(/'/g,"\\'")}', this)">
                Mensagem
              </button>
            </div>`).join('')
        : `<span style="color:#777;font-size:0.82rem;">Sem novas conexões</span>`;
    }
  },

  async startChat(connectionId, name, btnEl) {
    btnEl.closest('div').remove();
    App.state.activeChatId   = connectionId;
    App.state.activeChatName = name;
    App.state.activeEventId  = null;
    App.state.messages       = [];
    App.state.chatsLoaded    = false;
    App.navigate('chats');
  },

  pass() {
    App.state.discoverIndex++;
    App.render();
  },

  async connect(userId, name) {
    const res = await App.api('send_request', { targetId: userId });
    if (res.ok) Components.toast(`Pedido enviado a ${name}!`, 'success');
    else        Components.toast(res.error, 'error');
    App.state.discoverIndex++;
    App.render();
  },

  async search(q) {
    const el = document.getElementById('search-results');
    if (!el) return;
    if (!q.trim()) { el.innerHTML = ''; return; }
    const res = await App.api('search_users', { q }, 'GET');
    if (!res.ok) return;
    el.innerHTML = res.data.length
      ? `<div style="border:1px solid #333;margin-bottom:12px;">` +
        res.data.map(u => `
          <div class="row" style="padding:8px 10px;">
            ${Components.avatar(u.usuar_nome, 32, u.usuar_foto_perfil || '')}
            <div class="row-name">${u.usuar_nome}</div>
            <button onclick="HomePage.connectDirect(${u.usuar_id},'${u.usuar_nome.replace(/'/g,"\\'")}')">Conectar</button>
          </div>`).join('') + `</div>`
      : `<p style="color:#777;margin-bottom:12px;">Sem resultados.</p>`;
  },

  async connectDirect(userId, name) {
    const res = await App.api('send_request', { targetId: userId });
    if (res.ok) Components.toast(`Pedido enviado a ${name}!`, 'success');
    else        Components.toast(res.error, 'error');
  },

  showReport(userId, name) {
    Components.modal(`
      <h3>Reportar ${name}</h3>
      <div style="margin-bottom:8px;"><label>Motivo</label>
        <input id="rep-reason" type="text" placeholder="Descreve o problema"/></div>
      <div id="rep-err" style="color:#f87171;font-size:0.8rem;display:none;margin-bottom:8px;"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
        <button onclick="Components.closeModal()">Cancelar</button>
        <button class="btn-danger" onclick="HomePage.sendReport(${userId})">Reportar</button>
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