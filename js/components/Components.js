const Components = {

  avatar(name, size = 38, photoUrl = '') {
    const initials = (name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
    const fs = Math.round(size * 0.38);
    if (photoUrl) {
      return `<div class="avatar" style="width:${size}px;height:${size}px;"><img src="${photoUrl}" alt="${initials}"/></div>`;
    }
    return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${fs}px;">${initials}</div>`;
  },

  
  interestCategories(interests) {
    const cats = { 'Música': [], 'Jogos': [], 'Cinema & Séries': [] };
    (interests || []).forEach(t => {
      const cat = t.categoria;
      if (cats[cat]) cats[cat].push(t.tag || t.nome);
      else {
        const first = Object.keys(cats)[0];
        cats[first].push(t.tag || t.nome);
      }
    });

    const labels = { 'Música': 'Música', 'Jogos': 'Jogos', 'Cinema & Séries': 'Cinema & Séries' };
    return `<div class="interest-categories">
      ${Object.entries(cats).map(([cat, tags]) => `
        <div class="interest-cat">
          <div class="interest-cat-label">${labels[cat]}</div>
          <div class="interest-cat-tags">
            ${tags.length
              ? tags.map(t => `<span class="itag">${t}</span>`).join('')
              : `<span style="color:var(--dim);font-size:0.78rem;">—</span>`
            }
          </div>
        </div>
      `).join('')}
    </div>`;
  },

  sidebar(activePage) {
    const items = [
      { id: 'events',  icon: 'events',  label: 'Eventos'   },
      { id: 'home',    icon: 'connect', label: 'Descobrir' },
      { id: 'chats',   icon: 'chat',    label: 'Mensagens' },
      { id: 'profile', icon: 'profile', label: 'Perfil'    },
    ];
    if (App.state.user?.role === 'admin') {
      items.push({ id: 'admin', icon: 'admin', label: 'Admin' });
    }
    return `
      <aside class="sidebar">
        <div class="sidebar-logo">Mood<span>ly</span></div>
        <nav class="nav">
          ${items.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}"
                 onclick="App.navigate('${item.id}')">
              ${Icons[item.icon]}
              <span>${item.label}</span>
            </div>
          `).join('')}
        </nav>
        <div class="sidebar-user">${App.state.user?.name || ''}</div>
      </aside>`;
  },

  shell(content, activePage) {
    return Components.sidebar(activePage) + `<div class="main">${content}</div>`;
  },

  toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
  },

  modal(html) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box">${html}</div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    return overlay;
  },

  closeModal() {
    document.querySelector('.modal-overlay')?.remove();
  },
};