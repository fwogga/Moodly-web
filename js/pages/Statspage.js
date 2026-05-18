const StatsPage = {

  render() {
    const html = Components.shell(`
      <div class="page-header">
        <div><h1>Estatísticas</h1><p>Análise descritiva da plataforma</p></div>
      </div>

      <div id="stats-summary" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px;">
        <div style="color:#777;font-size:0.82rem;">A carregar...</div>
      </div>

      <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px;">
        <div class="card">
          <div class="card-title">Mensagens enviadas — últimos 14 dias</div>
          <div style="position:relative;height:200px;"><canvas id="chart-activity"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title">Distribuição por categoria</div>
          <div style="position:relative;height:200px;"><canvas id="chart-category"></canvas></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        <div class="card">
          <div class="card-title">Interesses mais populares</div>
          <div style="position:relative;height:320px;"><canvas id="chart-popular"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title">Interesses que mais uniram pessoas</div>
          <div style="position:relative;height:320px;"><canvas id="chart-uniting"></canvas></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:20px;">
        <div class="card">
          <div class="card-title">Estado dos convites de eventos</div>
          <div style="position:relative;height:220px;"><canvas id="chart-events"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title">Estado dos pedidos de conexão</div>
          <div style="position:relative;height:220px;"><canvas id="chart-connections"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title">Top 5 utilizadores mais conectados</div>
          <div id="top-users" style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
            <span style="color:#777;font-size:0.82rem;">A carregar...</span>
          </div>
        </div>
      </div>

      <div id="descriptive-section" style="margin-bottom:20px;">
        <div style="color:#777;font-size:0.82rem;">A carregar análise descritiva...</div>
      </div>

    `, 'stats');

    setTimeout(() => StatsPage.loadAll(), 0);
    return html;
  },

  async loadAll() {
    await StatsPage._loadChartJs();

    const [actRes, popRes, uniRes, catRes, evRes, connRes, topRes, globalRes, descRes] = await Promise.all([
      App.api('stats_activity',              {}, 'GET'),
      App.api('stats_popular_interests',     {}, 'GET'),
      App.api('stats_uniting_interests',     {}, 'GET'),
      App.api('stats_category_distribution', {}, 'GET'),
      App.api('stats_event_participation',   {}, 'GET'),
      App.api('stats_connections_over_time', {}, 'GET'),
      App.api('stats_top_users',             {}, 'GET'),
      App.api('admin_stats',                 {}, 'GET'),
      App.api('stats_descriptive',           {}, 'GET'),
    ]);

    if (globalRes.ok) StatsPage._renderSummary(globalRes.data, actRes.ok ? actRes.data : [], popRes.ok ? popRes.data : []);
    if (actRes.ok)    StatsPage._drawActivity(actRes.data);
    if (catRes.ok)    StatsPage._drawCategory(catRes.data);
    if (popRes.ok)    StatsPage._drawPopular(popRes.data);
    if (uniRes.ok)    StatsPage._drawUniting(uniRes.data);
    if (evRes.ok)     StatsPage._drawEventParticipation(evRes.data);
    if (connRes.ok)   StatsPage._drawConnections(connRes.data);
    if (topRes.ok)    StatsPage._renderTopUsers(topRes.data);
    if (descRes.ok)   StatsPage._renderDescriptive(descRes.data);
  },

  _renderSummary(g, actData, popData) {
    const el = document.getElementById('stats-summary');
    if (!el) return;


    const totalMsgs14 = actData.reduce((s, d) => s + d.mensagens, 0);
    const avgMsgs = actData.length ? (totalMsgs14 / actData.length).toFixed(1) : 0;
    const maxDay  = actData.reduce((m, d) => d.mensagens > m.mensagens ? d : m, { dia: '—', mensagens: 0 });
    const topInterest = popData.length ? popData[0].nome : '—';

    const cards = [
      { label: 'Utilizadores',          value: g.users },
      { label: 'Banidos',               value: g.banned },
      { label: 'Conexões aceites',       value: g.connections },
      { label: 'Eventos',               value: g.events },
      { label: 'Mensagens totais',       value: g.messages },
      { label: 'Reports pendentes',      value: g.reports },
      { label: 'Msgs (14 dias)',         value: totalMsgs14 },
      { label: 'Média msgs/dia',         value: avgMsgs },
      { label: 'Dia mais ativo',         value: maxDay.dia.slice(5) + ' (' + maxDay.mensagens + ')' },
      { label: 'Interesse top',          value: topInterest },
    ];

    el.innerHTML = cards.map(c => `
      <div class="stat-box" style="flex:1;min-width:120px;">
        <div class="stat-box-num" style="font-size:1.1rem;">${c.value}</div>
        <div class="stat-box-lbl">${c.label}</div>
      </div>
    `).join('');
  },

  _renderTopUsers(data) {
    const el = document.getElementById('top-users');
    if (!el) return;
    if (!data.length) { el.innerHTML = `<span style="color:#777;font-size:0.82rem;">Sem dados</span>`; return; }
    el.innerHTML = data.map((u, i) => `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="color:#777;font-size:0.8rem;width:16px;">${i + 1}.</span>
        ${Components.avatar(u.nome, 28, u.foto || '')}
        <div style="flex:1;font-size:0.82rem;">${u.nome}</div>
        <span style="font-size:0.78rem;color:#FFD600;">${u.conexoes} conexões</span>
      </div>
    `).join('');
  },

  _loadChartJs() {
    if (typeof Chart !== 'undefined') return Promise.resolve();
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  },

  _base() {
    return {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#cccccc', font: { family: 'Arial', size: 11 }, boxWidth: 12 } },
      },
      scales: {
        x: { ticks: { color: '#999', font: { size: 10 } }, grid: { color: '#2a2a2a' } },
        y: { ticks: { color: '#999', font: { size: 10 } }, grid: { color: '#2a2a2a' }, beginAtZero: true },
      },
    };
  },

  _catColor(cat, alpha = 0.85) {
    const map = {
      'Música':          `rgba(139,92,246,${alpha})`,
      'Jogos':           `rgba(34,197,94,${alpha})`,
      'Cinema & Séries': `rgba(59,130,246,${alpha})`,
    };
    return map[cat] || `rgba(255,214,0,${alpha})`;
  },

  _drawActivity(data) {
    const el = document.getElementById('chart-activity');
    if (!el) return;
    new Chart(el, {
      type: 'line',
      data: {
        labels: data.map(d => d.dia.slice(5)),
        datasets: [{
          label: 'Mensagens',
          data: data.map(d => d.mensagens),
          borderColor: '#FFD600',
          backgroundColor: 'rgba(255,214,0,0.10)',
          borderWidth: 2,
          pointRadius: 3,
          fill: true,
          tension: 0.3,
        }],
      },
      options: { ...StatsPage._base(), plugins: { ...StatsPage._base().plugins, legend: { display: false } } },
    });
  },

  _drawCategory(data) {
    const el = document.getElementById('chart-category');
    if (!el) return;
    new Chart(el, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.categoria),
        datasets: [{
          data: data.map(d => d.total),
          backgroundColor: data.map(d => StatsPage._catColor(d.categoria)),
          borderWidth: 0,
        }],
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#ccc', font: { size: 11 }, boxWidth: 12 } },
        },
      },
    });
  },

  _drawPopular(data) {
    const el = document.getElementById('chart-popular');
    if (!el) return;
    new Chart(el, {
      type: 'bar',
      data: {
        labels: data.map(d => d.nome),
        datasets: [{
          label: 'Utilizadores',
          data: data.map(d => d.total),
          backgroundColor: data.map(d => StatsPage._catColor(d.categoria)),
          borderRadius: 3,
        }],
      },
      options: {
        ...StatsPage._base(),
        indexAxis: 'y',
        plugins: {
          ...StatsPage._base().plugins,
          legend: { display: false },
          tooltip: { callbacks: {
            label: ctx => ` ${ctx.parsed.x} utilizadores`,
            afterLabel: ctx => `  ${data[ctx.dataIndex].categoria}`,
          }},
        },
        scales: {
          x: { ticks: { color: '#999', font: { size: 10 } }, grid: { color: '#2a2a2a' } },
          y: { ticks: { color: '#ccc', font: { size: 10 } }, grid: { color: '#2a2a2a' } },
        },
      },
    });
  },

  _drawUniting(data) {
    const el = document.getElementById('chart-uniting');
    if (!el) return;
    new Chart(el, {
      type: 'bar',
      data: {
        labels: data.map(d => d.nome),
        datasets: [{
          label: 'Conexões',
          data: data.map(d => d.conexoes),
          backgroundColor: data.map(d => StatsPage._catColor(d.categoria)),
          borderRadius: 3,
        }],
      },
      options: {
        ...StatsPage._base(),
        indexAxis: 'y',
        plugins: {
          ...StatsPage._base().plugins,
          legend: { display: false },
          tooltip: { callbacks: {
            label: ctx => ` ${ctx.parsed.x} conexões`,
            afterLabel: ctx => `  ${data[ctx.dataIndex].categoria}`,
          }},
        },
        scales: {
          x: { ticks: { color: '#999', font: { size: 10 } }, grid: { color: '#2a2a2a' } },
          y: { ticks: { color: '#ccc', font: { size: 10 } }, grid: { color: '#2a2a2a' } },
        },
      },
    });
  },

  _drawEventParticipation(data) {
    const el = document.getElementById('chart-events');
    if (!el) return;
    const colorMap = {
      'confirmado': 'rgba(34,197,94,0.85)',
      'pendente':   'rgba(255,214,0,0.85)',
      'recusado':   'rgba(248,113,113,0.85)',
      'cancelado':  'rgba(100,100,100,0.85)',
    };
    new Chart(el, {
      type: 'pie',
      data: {
        labels: data.map(d => d.estado),
        datasets: [{
          data: data.map(d => d.total),
          backgroundColor: data.map(d => colorMap[d.estado] || 'rgba(200,200,200,0.7)'),
          borderWidth: 0,
        }],
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#ccc', font: { size: 10 }, boxWidth: 12 } },
        },
      },
    });
  },

  _drawConnections(data) {
    const el = document.getElementById('chart-connections');
    if (!el) return;
    const colorMap = {
      'aceite':   'rgba(34,197,94,0.85)',
      'pendente': 'rgba(255,214,0,0.85)',
      'recusado': 'rgba(248,113,113,0.85)',
    };
    new Chart(el, {
      type: 'pie',
      data: {
        labels: data.map(d => d.estado),
        datasets: [{
          data: data.map(d => d.total),
          backgroundColor: data.map(d => colorMap[d.estado] || 'rgba(200,200,200,0.7)'),
          borderWidth: 0,
        }],
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#ccc', font: { size: 10 }, boxWidth: 12 } },
        },
      },
    });
  },

  _renderDescriptive(d) {
    const el = document.getElementById('descriptive-section');
    if (!el) return;

    const statRow = (label, value, note = '') => `
      <div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px solid #222;">
        <span style="font-size:0.84rem;color:#ccc;">${label}</span>
        <span style="font-size:0.92rem;font-weight:700;color:#FFD600;">${value}${note ? `<span style="font-size:0.72rem;font-weight:400;color:#777;margin-left:6px;">${note}</span>` : ''}</span>
      </div>`;

    const card = (title, rows) => `
      <div class="card">
        <div class="card-title">${title}</div>
        ${rows.join('')}
      </div>`;

    const c = d.conexoes;
    const connBlock = card('Conexões por utilizador', [
      statRow('Média',         c.media),
      statRow('Mediana',       c.mediana),
      statRow('Desvio padrão', c.desvio, 'dispersão em torno da média'),
      statRow('Mínimo',        c.min),
      statRow('Máximo',        c.max),
    ]);

    const intBlock = card('Média de interesses por utilizador', d.interesses_por_categoria.map(r =>
      statRow(r.categoria, r.media + ' interesses', `(${r.utilizadores} utilizadores)`)
    ));

    const p = d.polarizador;
    const polBlock = card('Interesse mais polarizador', p ? [
      statRow('Interesse',         p.nome),
      statRow('Categoria',         p.categoria),
      statRow('Utilizadores',      p.utilizadores, 'têm este interesse'),
      statRow('Conexões geradas',  p.conexoes,     'pares que o partilham'),
    ] : [statRow('Sem dados suficientes', '—')]);

    const ev = d.eventos;
    const evBlock = card('Participação em eventos', [
      statRow('Média de participantes',        ev.media_participantes),
      statRow('Evento mais concorrido',        ev.max_participantes + ' pessoas'),
      statRow('Evento menos concorrido',       ev.min_participantes + ' pessoas'),
    ]);

    const m = d.mensagens;
    const msgBlock = card('Mensagens por conversa', [
      statRow('Média de mensagens',            m.media_por_conversa),
      statRow('Conversa mais ativa',           m.max_numa_conversa + ' mensagens'),
      statRow('Conversas sem mensagens',       m.conversas_sem_msgs, 'nunca falaram'),
    ]);

    const bivBlock = card('Mais interesses = mais conexões?', [
      `<div style="font-size:0.76rem;color:#777;margin-bottom:10px;line-height:1.5;">
        Correlação entre número de interesses e número de conexões aceites por utilizador.
      </div>`,
      `<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
        <thead>
          <tr>
            <th style="text-align:left;color:#777;padding:4px 0;border-bottom:1px solid #333;font-weight:400;">Nº interesses</th>
            <th style="text-align:center;color:#777;padding:4px 0;border-bottom:1px solid #333;font-weight:400;">Utilizadores</th>
            <th style="text-align:right;color:#FFD600;padding:4px 0;border-bottom:1px solid #333;font-weight:700;">Média conexões</th>
          </tr>
        </thead>
        <tbody>
          ${d.bivariada.map(r => `
            <tr>
              <td style="padding:5px 0;border-bottom:1px solid #1a1a1a;">${r.grupo}</td>
              <td style="text-align:center;padding:5px 0;border-bottom:1px solid #1a1a1a;color:#aaa;">${r.utilizadores}</td>
              <td style="text-align:right;padding:5px 0;border-bottom:1px solid #1a1a1a;font-weight:700;">${r.media_conexoes}</td>
            </tr>`).join('')}
        </tbody>
      </table>`,
    ]);

    el.innerHTML = `
      <div style="font-weight:700;font-size:0.95rem;margin-bottom:12px;color:#ccc;">Análise Descritiva</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:20px;">
        ${connBlock}${intBlock}${polBlock}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;">
        ${evBlock}${msgBlock}${bivBlock}
      </div>
    `;
  },
};