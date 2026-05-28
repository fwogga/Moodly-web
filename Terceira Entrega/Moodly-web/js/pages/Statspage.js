const StatsPage = {

  render() {
    const section = (title) => `
      <div style="display:flex;align-items:center;gap:12px;margin:28px 0 14px;">
        <div style="font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--yellow);white-space:nowrap;">${title}</div>
        <div style="flex:1;height:1px;background:rgba(255,214,0,0.15);"></div>
      </div>`;

    const html = Components.shell(`
      <div class="page-header">
        <div><h1>Estatísticas</h1><p>Painel de análise para decisões sobre a plataforma</p></div>
        <button class="btn btn-outline btn-sm" onclick="StatsPage.exportPDF()">Exportar PDF</button>
      </div>

      <!-- Utilizadores -->
      ${section('Utilizadores')}
      <div id="stats-kpis-users" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:4px;">
        <div style="color:var(--dim);font-size:0.82rem;">A carregar...</div>
      </div>

      <!-- Atividade -->
      ${section('Atividade')}
      <div id="stats-kpis-activity" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:4px;">
        <div style="color:var(--dim);font-size:0.82rem;">A carregar...</div>
      </div>

      <!-- Conexões section -->
      ${section('Conexões')}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:4px;">
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Análise descritiva</div>
          <div id="desc-connections"></div>
        </div>
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Histograma — distribuição</div>
          <div style="position:relative;height:180px;"><canvas id="chart-hist-conn"></canvas></div>
          <div id="hist-conn-insight" style="margin-top:8px;font-size:0.76rem;color:var(--dim);"></div>
        </div>
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Estado dos pedidos</div>
          <div style="position:relative;height:180px;"><canvas id="chart-connections"></canvas></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;margin-bottom:4px;">
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Correlação: interesses vs conexões</div>
          <div style="position:relative;height:200px;"><canvas id="chart-correlation"></canvas></div>
          <div id="corr-insight" style="margin-top:8px;font-size:0.76rem;color:var(--dim);"></div>
        </div>
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Top 5 mais conectados</div>
          <div id="top-users" style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
            <span style="color:var(--dim);font-size:0.82rem;">A carregar...</span>
          </div>
        </div>
      </div>

      <!-- Interesses section -->
      ${section('Interesses')}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:4px;">
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Distribuição por categoria</div>
          <div style="position:relative;height:200px;"><canvas id="chart-category"></canvas></div>
        </div>
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Mais populares</div>
          <div style="position:relative;height:200px;"><canvas id="chart-popular"></canvas></div>
        </div>
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Que mais uniram pessoas</div>
          <div style="position:relative;height:200px;"><canvas id="chart-uniting"></canvas></div>
        </div>
      </div>
      <div style="margin-top:16px;margin-bottom:4px;">
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Interesse mais polarizador</div>
          <div id="polarizador-block" style="margin-top:4px;"></div>
        </div>
      </div>

      <!-- Mensagens section -->
      ${section('Mensagens')}
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:4px;">
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Atividade — últimos 14 dias</div>
          <div style="position:relative;height:200px;"><canvas id="chart-activity"></canvas></div>
          <div id="activity-insight" style="margin-top:8px;font-size:0.76rem;color:var(--dim);"></div>
        </div>
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Análise descritiva</div>
          <div id="desc-other"></div>
        </div>
      </div>
      <div style="margin-top:16px;margin-bottom:4px;">
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Histograma — mensagens por conversa</div>
          <div style="position:relative;height:180px;"><canvas id="chart-hist-msg"></canvas></div>
          <div id="hist-msg-insight" style="margin-top:8px;font-size:0.76rem;color:var(--dim);"></div>
        </div>
      </div>

      <!-- Eventos section -->
      ${section('Eventos')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;">
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Estado dos convites</div>
          <div style="position:relative;height:200px;"><canvas id="chart-events"></canvas></div>
        </div>
        <div class="card" style="margin-bottom:0;">
          <div class="card-title">Participação média e extremos</div>
          <div id="desc-events" style="margin-top:4px;"></div>
        </div>
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

    if (globalRes.ok) StatsPage._renderKPIs(globalRes.data, actRes.ok ? actRes.data : []);
    if (descRes.ok)   StatsPage._renderDescriptive(descRes.data);
    if (descRes.ok)   StatsPage._renderDescEvents(descRes.data);
    if (actRes.ok)    StatsPage._drawActivity(actRes.data);
    if (catRes.ok)    StatsPage._drawCategory(catRes.data);
    if (popRes.ok)    StatsPage._drawPopular(popRes.data);
    if (uniRes.ok)    StatsPage._drawUniting(uniRes.data);
    if (evRes.ok)     StatsPage._drawEventParticipation(evRes.data);
    if (connRes.ok)   StatsPage._drawConnections(connRes.data);
    if (topRes.ok)    StatsPage._renderTopUsers(topRes.data);
    if (descRes.ok)   StatsPage._drawCorrelation(descRes.data);
    if (descRes.ok)   StatsPage._renderPolarizador(descRes.data);
    if (descRes.ok)   StatsPage._drawHistograms(descRes.data);

    window.onbeforeprint = () => StatsPage._applyPrintColors(true);
    window.onafterprint  = () => StatsPage._applyPrintColors(false);
  },

  exportPDF() {
    window.print();
  },

  _applyPrintColors(dark) {
    const color = dark ? '#111111' : 'rgba(255,255,255,0.6)';
    if (typeof Chart === 'undefined') return;
    Chart.helpers.each(Chart.instances, chart => {
      if (chart.options.plugins?.legend?.labels) {
        chart.options.plugins.legend.labels.color = color;
      }
      if (chart.options.scales) {
        Object.values(chart.options.scales).forEach(scale => {
          if (scale.ticks) scale.ticks.color = dark ? '#444444' : 'rgba(255,255,255,0.4)';
          if (scale.grid)  scale.grid.color  = dark ? '#dddddd' : 'rgba(255,255,255,0.05)';
        });
      }
      chart.update('none');
    });
  },

  _renderKPIs(g, actData) {
    const totalMsgs14 = actData.reduce((s, d) => s + d.mensagens, 0);
    const maxDay = actData.reduce((m, d) => d.mensagens > m.mensagens ? d : m, { dia: '—', mensagens: 0 });

    const usersEl = document.getElementById('stats-kpis-users');
    if (usersEl) usersEl.innerHTML = [
      { n: g.users,       l: 'Total' },
      { n: g.banned,      l: 'Banidos',     warn: g.banned > 0 },
      { n: g.connections, l: 'Conexões aceites' },
      { n: g.reports,     l: 'Reports pendentes', warn: g.reports > 0 },
    ].map(i => `
      <div class="stat-box" style="flex:1;min-width:110px;">
        <div class="stat-box-num" style="${i.warn ? 'color:var(--red)' : ''}">${i.n}</div>
        <div class="stat-box-lbl">${i.l}</div>
      </div>`).join('');

    const actEl = document.getElementById('stats-kpis-activity');
    if (actEl) actEl.innerHTML = [
      { n: g.messages,    l: 'Mensagens totais' },
      { n: totalMsgs14,   l: 'Msgs (14 dias)' },
      { n: maxDay.mensagens + ' (' + (maxDay.dia.slice(5) || '—') + ')', l: 'Dia mais ativo' },
      { n: g.events,      l: 'Eventos criados' },
    ].map(i => `
      <div class="stat-box" style="flex:1;min-width:110px;">
        <div class="stat-box-num">${i.n}</div>
        <div class="stat-box-lbl">${i.l}</div>
      </div>`).join('');
  },

  _row(label, value, note = '', warn = false) {
    return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <span style="font-size:0.83rem;color:var(--dim);">${label}</span>
      <span style="font-size:0.9rem;font-weight:700;color:${warn ? 'var(--red)' : 'var(--yellow)'};">${value}${note ? `<span style="font-size:0.7rem;font-weight:400;color:var(--dim2);margin-left:5px;">${note}</span>` : ''}</span>
    </div>`;
  },

  _renderDescriptive(d) {
    const c = d.conexoes;
    const m = d.mensagens;
    const ev = d.eventos;

    const ci95 = (mean, std, n) => {
      if (n < 2) return '—';
      const se = std / Math.sqrt(n);
      return `[${(mean - 1.96 * se).toFixed(2)}, ${(mean + 1.96 * se).toFixed(2)}]`;
    };

    const connEl = document.getElementById('desc-connections');
    if (connEl) connEl.innerHTML = [
      StatsPage._row('Média',          c.media),
      StatsPage._row('Mediana',        c.mediana),
      StatsPage._row('Moda',           c.moda ?? '—'),
      StatsPage._row('Desvio padrão',  c.desvio, 'dispersão'),
      StatsPage._row('Mínimo / Máximo', `${c.min} / ${c.max}`),
      StatsPage._row('P25 / P75',      `${c.p25 ?? '—'} / ${c.p75 ?? '—'}`, 'percentis'),
      StatsPage._row('IC 95% da média', ci95(c.media, c.desvio, c.n ?? 10), ''),
      `<div style="margin-top:10px;font-size:0.75rem;color:var(--dim2);line-height:1.6;">
        ${c.desvio > c.media ? 'Desvio padrão elevado — distribuição assimétrica. Alguns utilizadores têm muito mais conexões que a maioria.' : 'Distribuição relativamente homogénea entre utilizadores.'}
      </div>`,
    ].join('');

    const otherEl = document.getElementById('desc-other');
    if (otherEl) otherEl.innerHTML = [
      `<div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;color:var(--dim);letter-spacing:0.5px;margin-bottom:8px;">Mensagens por conversa</div>`,
      StatsPage._row('Média',             m.media_por_conversa.toFixed(1)),
      StatsPage._row('Conversa mais ativa', m.max_numa_conversa + ' mensagens'),
      StatsPage._row('Conversas sem msgs', m.conversas_sem_msgs, 'nunca falaram', m.conversas_sem_msgs > 0),
      `<div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;color:var(--dim);letter-spacing:0.5px;margin:14px 0 8px;">Eventos</div>`,
      StatsPage._row('Média participantes', ev.media_participantes.toFixed(1)),
      StatsPage._row('Mais concorrido',    ev.max_participantes + ' pessoas'),
      StatsPage._row('Menos concorrido',   ev.min_participantes + ' pessoas'),
      d.interesses_por_categoria.map(r =>
        `<div style="margin-top:12px;font-size:0.7rem;font-weight:700;text-transform:uppercase;color:var(--dim);letter-spacing:0.5px;margin-bottom:6px;">${r.categoria}</div>` +
        StatsPage._row('Média interesses/user', r.media)
      ).join(''),
    ].join('');
  },

  _drawCorrelation(d) {
    const el = document.getElementById('chart-correlation');
    if (!el || !d.bivariada) return;
    const labels = d.bivariada.map(r => r.grupo + ' int.');
    const values = d.bivariada.map(r => parseFloat(r.media_conexoes));
    new Chart(el, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Média de conexões',
          data: values,
          backgroundColor: values.map((v, i) => `rgba(124,58,237,${0.4 + i * 0.15})`),
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        ...StatsPage._base(),
        plugins: {
          ...StatsPage._base().plugins,
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(1)} conexões médias` } },
        },
      },
    });

    const corrEl = document.getElementById('corr-insight');
    if (corrEl && d.bivariada.length > 1) {
      const first = parseFloat(d.bivariada[0]?.media_conexoes || 0);
      const last  = parseFloat(d.bivariada[d.bivariada.length - 1]?.media_conexoes || 0);
      corrEl.textContent = last > first
        ? `Correlação positiva — utilizadores com mais interesses tendem a ter mais conexões.`
        : `Correlação não clara — mais interesses não implica necessariamente mais conexões.`;
    }
  },

  _renderPolarizador(d) {
    const el = document.getElementById('polarizador-block');
    if (!el || !d.polarizador) { if (el) el.innerHTML = `<span style="color:var(--dim)">Sem dados suficientes</span>`; return; }
    const p = d.polarizador;
    const taxa = p.utilizadores > 0 ? ((p.conexoes / p.utilizadores) * 100).toFixed(0) : 0;
    el.innerHTML = `
      <div style="background:rgba(255,214,0,0.06);border:1px solid rgba(255,214,0,0.2);border-radius:10px;padding:14px;margin-bottom:12px;">
        <div style="font-size:1rem;font-weight:800;color:#fff;margin-bottom:4px;">${p.nome}</div>
        <div style="font-size:0.78rem;color:var(--dim);">${p.categoria}</div>
      </div>
      ${StatsPage._row('Utilizadores com este interesse', p.utilizadores)}
      ${StatsPage._row('Conexões que partilham este interesse', p.conexoes)}
      ${StatsPage._row('Taxa de conversão', taxa + '%', 'utilizadores → conexão')}
      <div style="margin-top:12px;font-size:0.78rem;color:var(--dim2);line-height:1.6;">
        Este interesse é popular mas converte poucas conexões, pode indicar que os utilizadores têm gostos em comum mas não se conectam.
      </div>`;
  },

  _drawHistograms(d) {
    const connValues = d._raw_conn_values || [];
    const msgValues  = d._raw_msg_values  || [];

    const buildHist = (values, bins) => {
      if (!values.length) return { labels: [], counts: [] };
      const min = Math.min(...values), max = Math.max(...values);
      const step = Math.max(1, Math.ceil((max - min + 1) / bins));
      const labels = [], counts = [];
      for (let i = min; i <= max; i += step) {
        labels.push(`${i}${step > 1 ? '–' + (i + step - 1) : ''}`);
        counts.push(values.filter(v => v >= i && v < i + step).length);
      }
      return { labels, counts };
    };

    const histConn = buildHist(connValues, 6);
    const elConn = document.getElementById('chart-hist-conn');
    if (elConn && histConn.labels.length) {
      new Chart(elConn, {
        type: 'bar',
        data: {
          labels: histConn.labels,
          datasets: [{ label: 'Utilizadores', data: histConn.counts, backgroundColor: 'rgba(124,58,237,0.7)', borderRadius: 4, borderSkipped: false }],
        },
        options: { ...StatsPage._base(), plugins: { ...StatsPage._base().plugins, legend: { display: false } }, scales: { ...StatsPage._base().scales, y: { ...StatsPage._base().scales.y, ticks: { ...StatsPage._base().scales.y.ticks, precision: 0 } } } },
      });
    }
    const hcEl = document.getElementById('hist-conn-insight');
    if (hcEl && d.conexoes) {
      hcEl.textContent = `Média: ${d.conexoes.media} · Mediana: ${d.conexoes.mediana} · σ: ${d.conexoes.desvio}`;
    }

    const histMsg = buildHist(msgValues, 5);
    const elMsg = document.getElementById('chart-hist-msg');
    if (elMsg && histMsg.labels.length) {
      new Chart(elMsg, {
        type: 'bar',
        data: {
          labels: histMsg.labels,
          datasets: [{ label: 'Conversas', data: histMsg.counts, backgroundColor: 'rgba(255,214,0,0.6)', borderRadius: 4, borderSkipped: false }],
        },
        options: { ...StatsPage._base(), plugins: { ...StatsPage._base().plugins, legend: { display: false } }, scales: { ...StatsPage._base().scales, y: { ...StatsPage._base().scales.y, ticks: { ...StatsPage._base().scales.y.ticks, precision: 0 } } } },
      });
    }
    const hmEl = document.getElementById('hist-msg-insight');
    if (hmEl && d.mensagens) {
      hmEl.textContent = `Média: ${d.mensagens.media_por_conversa.toFixed(1)} msgs/conversa · Máx: ${d.mensagens.max_numa_conversa}`;
    }
  },

  _renderDescEvents(d) {
    const el = document.getElementById('desc-events');
    if (!el || !d.eventos) return;
    const ev = d.eventos;
    el.innerHTML = [
      StatsPage._row('Média de participantes', ev.media_participantes.toFixed(1)),
      StatsPage._row('Evento mais concorrido', ev.max_participantes + ' pessoas'),
      StatsPage._row('Evento menos concorrido', ev.min_participantes + ' pessoas'),
    ].join('');
  },

  _renderTopUsers(data) {
    const el = document.getElementById('top-users');
    if (!el) return;
    if (!data.length) { el.innerHTML = `<span style="color:var(--dim)">Sem dados</span>`; return; }
    el.innerHTML = data.map((u, i) => `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="color:var(--dim);font-size:0.78rem;width:18px;text-align:right;">${i + 1}</span>
        ${Components.avatar(u.nome, 30, u.foto || '')}
        <div style="flex:1;font-size:0.84rem;font-weight:600;">${u.nome}</div>
        <span style="font-size:0.78rem;color:var(--yellow);font-weight:700;">${u.conexoes}</span>
      </div>`).join('');
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
        legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { family: 'Inter', size: 11 }, boxWidth: 12 } },
      },
      scales: {
        x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, precision: 0 }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
      },
    };
  },

  _catColor(cat) {
    const map = { 'Música': 'rgba(139,92,246,0.8)', 'Jogos': 'rgba(34,197,94,0.8)', 'Cinema & Séries': 'rgba(59,130,246,0.8)' };
    return map[cat] || 'rgba(255,214,0,0.8)';
  },

  _drawActivity(data) {
    const el = document.getElementById('chart-activity');
    if (!el) return;
    const values = data.map(d => d.mensagens);
    const avg = values.reduce((a,b) => a+b, 0) / values.length;
    new Chart(el, {
      type: 'line',
      data: {
        labels: data.map(d => d.dia.slice(5)),
        datasets: [
          { label: 'Mensagens', data: values, borderColor: '#FFD600', backgroundColor: 'rgba(255,214,0,0.08)', borderWidth: 2, pointRadius: 3, fill: true, tension: 0.3 },
          { label: 'Média', data: values.map(() => Math.round(avg)), borderColor: 'rgba(255,255,255,0.25)', borderDash: [4,4], borderWidth: 1, pointRadius: 0, fill: false },
        ],
      },
      options: { ...StatsPage._base(), scales: { ...StatsPage._base().scales, y: { ...StatsPage._base().scales.y, ticks: { ...StatsPage._base().scales.y.ticks, precision: 0 } } } },
    });
    const insEl = document.getElementById('activity-insight');
    if (insEl) {
      const max = Math.max(...values);
      const trend = values[values.length-1] > values[0] ? 'tendência crescente' : 'tendência decrescente';
      insEl.textContent = `Média: ${Math.round(avg)} msgs/dia · Pico: ${max} · ${trend} nos últimos 14 dias`;
    }
  },

  _drawCategory(data) {
    const el = document.getElementById('chart-category');
    if (!el) return;
    new Chart(el, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.categoria),
        datasets: [{ data: data.map(d => d.total), backgroundColor: data.map(d => StatsPage._catColor(d.categoria)), borderWidth: 0 }],
      },
      options: { animation: false, responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.6)', font: { size: 11 }, boxWidth: 12 } } } },
    });
  },

  _drawPopular(data) {
    const el = document.getElementById('chart-popular');
    if (!el) return;
    new Chart(el, {
      type: 'bar',
      data: {
        labels: data.map(d => d.nome),
        datasets: [{ data: data.map(d => d.total), backgroundColor: data.map(d => StatsPage._catColor(d.categoria)), borderRadius: 3 }],
      },
      options: { ...StatsPage._base(), indexAxis: 'y', plugins: { ...StatsPage._base().plugins, legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} utilizadores`, afterLabel: ctx => `  ${data[ctx.dataIndex].categoria}` } } }, scales: { x: { ...StatsPage._base().scales.x, ticks: { ...StatsPage._base().scales.x.ticks, precision: 0 } }, y: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } } } },
    });
  },

  _drawUniting(data) {
    const el = document.getElementById('chart-uniting');
    if (!el) return;
    new Chart(el, {
      type: 'bar',
      data: {
        labels: data.map(d => d.nome),
        datasets: [{ data: data.map(d => d.conexoes), backgroundColor: data.map(d => StatsPage._catColor(d.categoria)), borderRadius: 3 }],
      },
      options: { ...StatsPage._base(), indexAxis: 'y', plugins: { ...StatsPage._base().plugins, legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} conexões`, afterLabel: ctx => `  ${data[ctx.dataIndex].categoria}` } } }, scales: { x: { ...StatsPage._base().scales.x, ticks: { ...StatsPage._base().scales.x.ticks, precision: 0 } }, y: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } } } },
    });
  },

  _drawEventParticipation(data) {
    const el = document.getElementById('chart-events');
    if (!el) return;
    const colorMap = { 'confirmado': 'rgba(74,222,128,0.8)', 'pendente': 'rgba(255,214,0,0.8)', 'recusado': 'rgba(248,113,113,0.8)', 'cancelado': 'rgba(100,100,100,0.7)' };
    new Chart(el, { type: 'pie', data: { labels: data.map(d => d.estado), datasets: [{ data: data.map(d => d.total), backgroundColor: data.map(d => colorMap[d.estado] || 'rgba(200,200,200,0.6)'), borderWidth: 0 }] }, options: { animation: false, responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.6)', font: { size: 10 }, boxWidth: 12 } } } } });
  },

  _drawConnections(data) {
    const el = document.getElementById('chart-connections');
    if (!el) return;
    const colorMap = { 'aceite': 'rgba(74,222,128,0.8)', 'pendente': 'rgba(255,214,0,0.8)', 'recusado': 'rgba(248,113,113,0.8)' };
    new Chart(el, { type: 'pie', data: { labels: data.map(d => d.estado), datasets: [{ data: data.map(d => d.total), backgroundColor: data.map(d => colorMap[d.estado] || 'rgba(200,200,200,0.6)'), borderWidth: 0 }] }, options: { animation: false, responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.6)', font: { size: 10 }, boxWidth: 12 } } } } });
  },
};