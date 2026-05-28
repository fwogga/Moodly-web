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
        <div><h1>Descobrir</h1><p>Encontra pessoas com os teus gostos</p></div>
        <input type="text" placeholder="Pesquisar utilizadores..."
               style="width:220px;" oninput="HomePage.search(this.value)"/>
      </div>

      <div id="search-results"></div>

      <div style="display:grid;grid-template-columns:1fr 260px;gap:20px;align-items:start;">

        <div class="card" style="padding:0;overflow:hidden;">
          <div style="height:130px;background:linear-gradient(135deg,#3b0070,#1a0040);"></div>
          <div style="padding:0 20px 20px;">
            <div style="width:100px;height:100px;border-radius:50%;background:#5b21b6;border:4px solid var(--panel);display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:800;overflow:hidden;margin:-50px 0 14px;position:relative;z-index:1;">
              ${photo ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;"/>` : inits}
            </div>
            <div style="font-size:1.15rem;font-weight:800;color:#fff;margin-bottom:3px;">${user.usuar_nome}</div>
            <div style="font-size:0.8rem;color:var(--yellow);font-weight:600;margin-bottom:16px;">⭐ ${user.score || 0} interesses em comum</div>
            ${Components.interestCategories(user.interests || [])}
            <div style="display:flex;gap:10px;margin-top:20px;">
              <button onclick="HomePage.connect(${user.usuar_id},'${user.usuar_nome.replace(/'/g,"\\'")}'); event.stopPropagation();"
                style="flex:1;background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.4);color:#4ade80;border-radius:10px;padding:11px;font-size:0.9rem;font-weight:700;cursor:pointer;transition:background 0.15s;">
                ✓ Conectar
              </button>
              <button onclick="HomePage.pass(); event.stopPropagation();"
                style="flex:1;background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.35);color:#f87171;border-radius:10px;padding:11px;font-size:0.9rem;font-weight:700;cursor:pointer;transition:background 0.15s;">
                ✕ Passar
              </button>
              <button onclick="HomePage.showReport(${user.usuar_id},'${user.usuar_nome.replace(/'/g,"\\'")}'); event.stopPropagation();"
                style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--dim);border-radius:10px;padding:11px 14px;font-size:0.88rem;cursor:pointer;transition:background 0.15s;">
                ⚑
              </button>
            </div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;">
          <div class="card" style="margin-bottom:0;">
            <div class="card-title">Pedidos enviados</div>
            <div id="sent-requests-list"><span style="color:var(--dim);font-size:0.82rem;">A carregar...</span></div>
          </div>
          <div class="card" style="margin-bottom:0;">
            <div class="card-title">Novas conexões</div>
            <div id="new-connections-list"><span style="color:var(--dim);font-size:0.82rem;">A carregar...</span></div>
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
    // Reset so chats page loads fresh list
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