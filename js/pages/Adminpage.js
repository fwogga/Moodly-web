const AdminPage = {

  async load() {
    const [statsRes, usersRes, reportsRes] = await Promise.all([
      App.api('admin_stats',       {}, 'GET'),
      App.api('admin_get_users',   {}, 'GET'),
      App.api('admin_get_reports', {}, 'GET'),
    ]);
    if (statsRes.ok)   App.state.adminStats   = statsRes.data;
    if (usersRes.ok)   App.state.adminUsers   = usersRes.data;
    if (reportsRes.ok) App.state.adminReports = reportsRes.data;
  },

  render() {
    if (!App.state.adminStats) {
      AdminPage.load().then(() => App.render());
      return Components.shell(`<div class="empty"><h3>A carregar...</h3></div>`, 'admin');
    }

    const s = App.state.adminStats;

    return Components.shell(`
      <div class="page-header">
        <div><h1>Admin</h1><p>Gestão da plataforma</p></div>
      </div>

      <div class="stats-grid">
        <div class="stat-box"><div class="stat-box-num">${s.users}</div><div class="stat-box-lbl">Utilizadores</div></div>
        <div class="stat-box"><div class="stat-box-num">${s.banned}</div><div class="stat-box-lbl">Banidos</div></div>
        <div class="stat-box"><div class="stat-box-num">${s.events}</div><div class="stat-box-lbl">Eventos</div></div>
        <div class="stat-box"><div class="stat-box-num">${s.connections}</div><div class="stat-box-lbl">Conexões</div></div>
        <div class="stat-box"><div class="stat-box-num">${s.messages}</div><div class="stat-box-lbl">Mensagens</div></div>
        <div class="stat-box"><div class="stat-box-num">${s.reports}</div><div class="stat-box-lbl">Reports pendentes</div></div>
      </div>

      <div class="card" style="margin-bottom:24px;">
        <div style="font-size:0.78rem;color:var(--dim);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:14px;">Utilizadores</div>
        <table>
          <thead>
            <tr><th>ID</th><th>Nome</th><th>Email</th><th>Role</th><th>Estado</th><th>Ação</th></tr>
          </thead>
          <tbody>
            ${(App.state.adminUsers || []).map(u => `
              <tr>
                <td>${u.usuar_id}</td>
                <td>${u.usuar_nome}</td>
                <td>${u.usuar_email}</td>
                <td>${u.usuar_role}</td>
                <td>${u.usuar_banned ? '<span style="color:var(--red);">Banido</span>' : 'Activo'}</td>
                <td>
                  ${u.usuar_role !== 'admin'
                    ? u.usuar_banned
                      ? `<button class="btn btn-sm btn-outline" onclick="AdminPage.ban(${u.usuar_id}, 0)">Desbanir</button>`
                      : `<button class="btn btn-sm btn-danger"  onclick="AdminPage.ban(${u.usuar_id}, 1)">Banir</button>`
                    : '—'
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <div style="font-size:0.78rem;color:var(--dim);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:14px;">Reports</div>
        <table>
          <thead>
            <tr><th>ID</th><th>Reportador</th><th>Reportado</th><th>Motivo</th><th>Estado</th><th>Ação</th></tr>
          </thead>
          <tbody>
            ${(App.state.adminReports || []).map(r => `
              <tr>
                <td>${r.report_id}</td>
                <td>${r.reporter_nome}</td>
                <td>${r.reported_nome}</td>
                <td>${r.report_reason}</td>
                <td>${r.report_status}</td>
                <td>
                  ${r.report_status === 'pending' ? `
                    <button class="btn btn-sm btn-outline" onclick="AdminPage.resolveReport(${r.report_id},'reviewed')">Rever</button>
                    <button class="btn btn-sm btn-danger"  onclick="AdminPage.resolveReport(${r.report_id},'dismissed')">Ignorar</button>
                  ` : '—'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `, 'admin');
  },

  async ban(userId, banned) {
    const res = await App.api('admin_ban', { targetId: userId, banned });
    if (res.ok) {
      Components.toast(banned ? 'Utilizador banido' : 'Utilizador desbanido', 'info');
      App.state.adminStats = null;
      App.state.adminUsers = null;
      await AdminPage.load();
      App.render();
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
      App.render();
    } else {
      Components.toast(res.error, 'error');
    }
  },
};