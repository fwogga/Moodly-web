/* ============================================================
   ProfilePages.js — Páginas de Perfil e Editar Perfil
   ============================================================ */

const ProfilePages = {

  profile() {
    const u     = Model.user || { nome: 'Utilizador', email: '', connections: 0, music: '', movies: '', games: '' };
    const inits = u.nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return Components.shell(`
      <div class="page-header anim">
        <div class="page-header-left">
          <h1>O Teu Perfil</h1>
          <p>Gere as tuas informações</p>
        </div>
        <button class="btn btn-outline" onclick="Controller.showLogoutModal()">
          ${Icons.logout} Sair
        </button>
      </div>

      <div class="profile-layout">

        <!-- Card lateral com avatar e estatísticas -->
        <div class="anim">
          <div class="profile-card">
            <div class="profile-banner"></div>
            <div class="profile-avatar-wrap">
              <div class="profile-avatar" style="background:var(--purple-dim);">${inits}</div>
            </div>
            <div class="profile-body">
              <div class="profile-name">${u.nome}</div>
              <div class="profile-email">${u.email || 'sem email'}</div>
              <div class="stats-row">
                <div class="stat-cell">
                  <div class="num">${u.connections || 0}</div>
                  <div class="lbl">Conexões</div>
                </div>
                <div class="stat-cell">
                  <div class="num">${Model.getJoinedEventsCount()}</div>
                  <div class="lbl">Eventos</div>
                </div>
                <div class="stat-cell">
                  <div class="num">${Model.selectedInterests.size || 3}</div>
                  <div class="lbl">Interesses</div>
                </div>
              </div>
              <button class="btn btn-primary" style="width:100%"
                      onclick="Controller.navigate('edit-profile')">
                ${Icons.edit} Editar Perfil
              </button>
            </div>
          </div>
        </div>

        <!-- Coluna principal -->
        <div class="anim d2">
          <div class="card" style="padding:28px;margin-bottom:20px;">
            <div class="section-title">Interesses</div>
            <div class="interest-block">
              <div class="interest-block-label">${Icons.music} Música</div>
              <div class="interest-block-val">${u.music || 'Sem preferências definidas'}</div>
            </div>
            <div class="divider"></div>
            <div class="interest-block">
              <div class="interest-block-label">${Icons.film} Filmes &amp; Séries</div>
              <div class="interest-block-val">${u.movies || 'Sem preferências definidas'}</div>
            </div>
            <div class="divider"></div>
            <div class="interest-block">
              <div class="interest-block-label">${Icons.game} Jogos</div>
              <div class="interest-block-val">${u.games || 'Sem preferências definidas'}</div>
            </div>
          </div>

          <div class="card" style="padding:28px;">
            <div class="section-title">Conexões recentes</div>
            ${Model.suggestions.slice(0, 3).map(sg => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
                ${Components.avatar(sg.name, 38, sg.color)}
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:0.88rem;">${sg.name}</div>
                  <div style="font-size:0.75rem;color:var(--text-dim);">${sg.connections} conexões</div>
                </div>
                <button class="btn btn-sm btn-outline"
                        onclick="Controller.messageUser('${sg.name}')">Mensagem</button>
              </div>
            `).join('')}
          </div>
        </div>

      </div>`, 'profile');
  },

  editProfile() {
    const u = Model.user || {};
    return Components.shell(`
      <div class="page-header anim">
        <div class="page-header-left">
          <h1>Editar Perfil</h1>
          <p>Atualiza as tuas informações</p>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-outline" onclick="Controller.navigate('profile')">Cancelar</button>
          <button class="btn btn-primary" onclick="Controller.saveProfile()">Guardar</button>
        </div>
      </div>

      <div style="max-width:700px;">
        <div class="card anim" style="padding:32px;margin-bottom:20px;">
          <div class="section-title">Informações pessoais</div>
          <div class="edit-grid">
            <div class="form-group">
              <label class="form-label">Nome</label>
              <input class="form-input" id="ep-nome"  type="text"  value="${u.nome  || ''}"/>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" id="ep-email" type="email" value="${u.email || ''}"/>
            </div>
          </div>
        </div>
        <div class="card anim d2" style="padding:32px;">
          <div class="section-title">Os teus gostos</div>
          <div class="form-group">
            <label class="form-label">Música favorita</label>
            <input class="form-input" id="ep-music"  value="${u.music  || ''}"
                   placeholder="ex: Arctic Monkeys, Radiohead"/>
          </div>
          <div class="form-group">
            <label class="form-label">Filmes / Séries favoritos</label>
            <input class="form-input" id="ep-movies" value="${u.movies || ''}"
                   placeholder="ex: Inception, Breaking Bad"/>
          </div>
          <div class="form-group">
            <label class="form-label">Jogos favoritos</label>
            <input class="form-input" id="ep-games"  value="${u.games  || ''}"
                   placeholder="ex: Cyberpunk 2077, Elden Ring"/>
          </div>
        </div>
      </div>`, 'profile');
  },
};
