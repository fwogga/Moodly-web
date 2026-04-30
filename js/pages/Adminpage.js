const AdminPage = {

  render() {
    if (!App.state.adminStats) {
      AdminPage.load();
      return Components.shell(`
        <div class="page-header"><div><h1>Admin</h1></div></div>
        <p style="color:#777;">A carregar...</p>
      `, 'admin');
    }

    const s = App.state.adminStats;

    return Components.shell(`
      <div class="page-header"><div><h1>Admin</h1></div></div>

      <div class="stats-grid" style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
        <div class="stat-box"><div class="stat-box-num">${s.users}</div><div class="stat-box-lbl">Utilizadores</div></div>
        <div class="stat-box"><div class="stat-box-num">${s.banned}</div><div class="stat-box-lbl">Banidos</div></div>
        <div class="stat-box"><div class="stat-box-num">${s.events}</div><div class="stat-box-lbl">Eventos</div></div>
        <div class="stat-box"><div class="stat-box-num">${s.reports}</div><div class="stat-box-lbl">Reports pendentes</div></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;">

        <!-- user -->
        <div>
          <div style="font-weight:700;margin-bottom:8px;">Utilizadores</div>
          <input type="text" placeholder="Pesquisar por nome..."
                 style="width:100%;margin-bottom:8px;"
                 oninput="AdminPage.searchUsers(this.value)"/>
          <div id="admin-user-results">
            ${AdminPage.renderUserRows(App.state.adminUsers || [])}
          </div>
        </div>

        <!-- reporte -->
        <div>
          <div style="font-weight:700;margin-bottom:8px;">Reports</div>
          <div id="admin-reports">
            ${AdminPage.renderReports(App.state.adminReports || [])}
          </div>
        </div>

      </div>
    `, 'admin');
  },

  renderUserRows(users) {
    if (!users.length) return `<p style="color:#777;font-size:0.82rem;">Sem resultados.</p>`;
    return users.map(u => `
      <div class="row" style="cursor:pointer;" onclick="AdminPage.showUserProfile(${u.usuar_id})">
        ${Components.avatar(u.usuar_nome, 32, u.usuar_foto_perfil || '')}
        <div class="row-name">
          ${u.usuar_nome}
          ${u.usuar_banned ? `<span style="color:#f87171;font-size:0.72rem;margin-left:4px;">[banido]</span>` : ''}
          ${u.usuar_role === 'admin' ? `<span style="color:#FFD600;font-size:0.72rem;margin-left:4px;">[admin]</span>` : ''}
        </div>
        <span style="color:#777;font-size:0.78rem;">#${u.usuar_id}</span>
      </div>`).join('');
  },

  renderReports(reports) {
    if (!reports.length) return `<p style="color:#777;font-size:0.82rem;">Sem reports.</p>`;
    return reports.map(r => `
      <div style="border:1px solid #333;padding:10px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:0.72rem;color:#777;">#${r.report_id} — ${r.report_status}</span>
          <span style="font-size:0.72rem;color:#777;">${(r.report_created_at||'').slice(0,10)}</span>
        </div>
        <div style="margin-bottom:4px;">
          <span style="color:#aaa;font-size:0.8rem;">Reportador: </span>
          <span style="font-size:0.8rem;cursor:pointer;color:#FFD600;" onclick="AdminPage.showUserProfile(${r.report_reporter_id})">${r.reporter_nome}</span>
        </div>
        <div style="margin-bottom:4px;">
          <span style="color:#aaa;font-size:0.8rem;">Reportado: </span>
          <span style="font-size:0.8rem;cursor:pointer;color:#FFD600;" onclick="AdminPage.showUserProfile(${r.report_reported_id})">${r.reported_nome}</span>
        </div>
        <div style="margin-bottom:8px;">
          <span style="color:#aaa;font-size:0.8rem;">Motivo: </span>
          <span style="font-size:0.8rem;">${r.report_reason}</span>
        </div>
        ${r.report_status === 'pending' ? `
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn-danger btn-sm" onclick="AdminPage.banUser(${r.report_reported_id}, '${r.reported_nome.replace(/'/g,"\\'")}', ${r.report_id})">Banir reportado</button>
            <button class="btn btn-sm" onclick="AdminPage.resolveReport(${r.report_id},'reviewed')">Visto</button>
            <button class="btn btn-sm" onclick="AdminPage.resolveReport(${r.report_id},'dismissed')">Ignorar</button>
          </div>
        ` : ''}
      </div>`).join('');
  },

  async load() {
    const [statsRes, usersRes, reportsRes] = await Promise.all([
      App.api('admin_stats',       {}, 'GET'),
      App.api('admin_get_users',   {}, 'GET'),
      App.api('admin_get_reports', {}, 'GET'),
    ]);
    if (statsRes.ok)   App.state.adminStats   = statsRes.data;
    if (usersRes.ok)   App.state.adminUsers   = usersRes.data;
    if (reportsRes.ok) App.state.adminReports = reportsRes.data;
    App.render();
  },

  async searchUsers(q) {
    const el = document.getElementById('admin-user-results');
    if (!el) return;
    const lower = q.toLowerCase();
    const filtered = (App.state.adminUsers || []).filter(u =>
      u.usuar_nome.toLowerCase().includes(lower) ||
      u.usuar_email.toLowerCase().includes(lower) ||
      String(u.usuar_id) === q.trim()
    );
    el.innerHTML = AdminPage.renderUserRows(filtered);
  },

  async showUserProfile(userId) {
    const res = await App.api('get_profile', { targetId: userId }, 'GET');
    if (!res.ok) { Components.toast(res.error, 'error'); return; }
    const u = res.data;
    const adminU = (App.state.adminUsers || []).find(x => x.usuar_id == userId) || {};

    Components.modal(`
      <h3>${u.usuar_nome}</h3>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
        ${Components.avatar(u.usuar_nome, 56, u.usuar_foto_perfil || '')}
        <div>
          <div style="font-size:0.82rem;color:#777;">ID: ${u.usuar_id}</div>
          <div style="font-size:0.82rem;color:#777;">Email: ${adminU.usuar_email || '—'}</div>
          <div style="font-size:0.82rem;color:#777;">Role: ${adminU.usuar_role || '—'}</div>
          <div style="font-size:0.82rem;${adminU.usuar_banned ? 'color:#f87171;' : 'color:#4ade80;'}">
            ${adminU.usuar_banned ? 'Banido' : 'Normal'}
          </div>
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <div style="font-size:0.72rem;color:#777;text-transform:uppercase;margin-bottom:6px;">Interesses</div>
        ${Components.interestCategories(u.interests || [])}
      </div>

      <div style="font-size:0.82rem;color:#777;margin-bottom:12px;">
        ${u.connection_count} conexões
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
        ${adminU.usuar_role !== 'admin' ? `
          ${adminU.usuar_banned
            ? `<button class="btn btn-sm" onclick="AdminPage.toggleBan(${u.usuar_id}, 0)">Desbanir</button>`
            : `<button class="btn-danger btn-sm" onclick="AdminPage.toggleBan(${u.usuar_id}, 1)">Banir</button>`
          }
          <button class="btn btn-sm" onclick="AdminPage.promoteAdmin(${u.usuar_id})">Tornar admin</button>
        ` : ''}
        <button class="btn btn-sm" onclick="Components.closeModal()">Fechar</button>
      </div>
    `);
  },

  async toggleBan(userId, banned) {
    const res = await App.api('admin_ban', { targetId: userId, banned });
    if (res.ok) {
      Components.closeModal();
      Components.toast(banned ? 'Utilizador banido.' : 'Utilizador desbanido.', 'info');
      App.state.adminStats = null;
      App.state.adminUsers = null;
      await AdminPage.load();
    } else {
      Components.toast(res.error, 'error');
    }
  },

  async banUser(userId, name, reportId) {
    const res = await App.api('admin_ban', { targetId: userId, banned: 1 });
    if (res.ok) {
      Components.toast(`${name} banido.`, 'info');
      await AdminPage.resolveReport(reportId, 'reviewed');
    } else {
      Components.toast(res.error, 'error');
    }
  },

  async resolveReport(reportId, status) {
    const res = await App.api('admin_resolve_report', { reportId, status });
    if (res.ok) {
      App.state.adminStats   = null;
      App.state.adminReports = null;
      await AdminPage.load();
    } else {
      Components.toast(res.error, 'error');
    }
  },

  async promoteAdmin(userId) {
    const res = await App.api('make_admin', { targetId: userId });
    if (res.ok) {
      Components.closeModal();
      Components.toast('Utilizador promovido a admin.', 'success');
      App.state.adminUsers = null;
      await AdminPage.load();
    } else {
      Components.toast(res.error, 'error');
    }
  },
};