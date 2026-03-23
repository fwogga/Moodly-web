

const HomePages = {

  home() {
    const suggestion = Model.getCurrentSuggestion();

    if (!suggestion) {
      return Components.shell(`
        <div class="page-header">
          <div class="page-header-left">
            <h1>Descobrir</h1><p>Encontra novos Moodlers</p>
          </div>
        </div>
        <div class="empty-state">
          ${Icons.connect}
          <h3>Sem mais sugestões</h3>
          <p>Volta mais tarde para encontrar novos Moodlers!</p>
          <button class="btn btn-outline" onclick="Controller.resetSuggestions()">Recomeçar</button>
        </div>`, 'home');
    }

    const others = Model.getOtherSuggestions();

    return Components.shell(`
      <div class="page-header anim">
        <div class="page-header-left">
          <h1>Descobrir</h1>
          <p>Encontra Moodlers com os teus gostos</p>
        </div>
        <span class="badge badge-purple">
          ${Model.currentSuggestionIndex + 1} / ${Model.suggestions.length} sugestões
        </span>
      </div>

      <div class="discover-layout">

        <!-- Card principal -->
        <div class="profile-card-big anim" style="position:relative;">
          <div class="profile-card-banner"
               style="background:linear-gradient(135deg,${suggestion.color} 0%,#12001F 100%);">
          </div>
          <div class="profile-card-avatar" style="background:${suggestion.color};">
            ${suggestion.initial}
          </div>
          <div class="profile-card-body">
            <div class="profile-card-name">${suggestion.name}</div>
            <div class="profile-card-meta">${suggestion.connections} conexões em comum</div>
            <div class="interest-tags">
              ${suggestion.music.length  ? `<span class="interest-tag">${Icons.music} Música: ${suggestion.music.slice(0,2).join(', ')}</span>`  : ''}
              ${suggestion.movies.length ? `<span class="interest-tag">${Icons.film} Filmes: ${suggestion.movies.slice(0,2).join(', ')}</span>` : ''}
              ${suggestion.games.length  ? `<span class="interest-tag">${Icons.game} Jogos: ${suggestion.games.slice(0,2).join(', ')}</span>`   : ''}
            </div>
            <div class="card-actions">
              <button class="action-btn action-btn-pass"
                      onclick="Controller.swipe('pass')"    title="Passar">${Icons.x}</button>
              <button class="action-btn action-btn-connect"
                      onclick="Controller.swipe('connect')" title="Conectar">${Icons.check}</button>
              <button class="action-btn action-btn-super"
                      onclick="Controller.swipe('super')"   title="Super Like">${Icons.star}</button>
            </div>
          </div>
        </div>

        <!-- Painel de outras sugestões -->
        <div class="suggestions-panel">
          <div class="section-title">Outras sugestões</div>
          ${others.map(sg => {
            const idx  = Model.suggestions.indexOf(sg);
            const tags = [...sg.music, ...sg.movies, ...sg.games].slice(0, 3).join(' · ');
            return `
              <div class="suggestion-card" onclick="Controller.selectSuggestion(${idx})">
                ${Components.avatar(sg.name, 44, sg.color)}
                <div class="suggestion-info">
                  <div class="suggestion-name">${sg.name}</div>
                  <div class="suggestion-tags">${tags}</div>
                </div>
                <div class="suggestion-actions">
                  <button class="btn btn-sm btn-primary"
                          onclick="event.stopPropagation(); Controller.connectTo(${idx})">+</button>
                </div>
              </div>`;
          }).join('')}
        </div>

      </div>`, 'home');
  },
};
