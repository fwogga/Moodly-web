const Components = {

  avatar(name, size = 38, photoUrl = '') {
    const initials = (name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
    const fs = Math.round(size * 0.38);
    if (photoUrl) {
      return `<div class="avatar" style="width:${size}px;height:${size}px;overflow:hidden;"><img src="${photoUrl}" alt="${initials}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<span style=font-size:${fs}px>${initials}</span>';"/></div>`;
    }
    return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${fs}px;">${initials}</div>`;
  },

  interestCategories(interests) {
    const cats = { 'Música': [], 'Jogos': [], 'Cinema & Séries': [] };
    (interests || []).forEach(t => {
      const cat = t.categoria;
      if (cats[cat]) cats[cat].push(t);
      else cats[Object.keys(cats)[0]].push(t);
    });

    return `<div class="interest-categories">
      ${Object.entries(cats).map(([cat, tags]) => `
        <div class="interest-cat">
          <div class="interest-cat-label">${cat}</div>
          <div class="interest-cat-tags">
            ${tags.length
              ? tags.map(t => `<span class="itag${t.matched == 1 ? ' itag-match' : ''}">${t.tag || t.nome}</span>`).join('')
              : `<span style="color:var(--dim);font-size:0.78rem;">—</span>`
            }
          </div>
        </div>
      `).join('')}
    </div>`;
  },

  sidebar(activePage) {
    const items = [
      { id: 'events',  label: 'Eventos'   },
      { id: 'home',    label: 'Descobrir' },
      { id: 'chats',   label: 'Mensagens' },
      { id: 'profile', label: 'Perfil'    },
    ];
    if (App.state.user?.role === 'admin') {
      items.push({ id: 'admin', label: 'Admin' });
      items.push({ id: 'stats', label: 'Estatísticas' });
    }
    return `
      <div class="mobile-topbar">
        <div class="sidebar-logo">
          <img src="uploads/MoodlyLogo.png" alt="Moodly" class="logo-img"/><span class="logo-text">Mood<span class="logo-highlight">ly</span></span>
        </div>
        <button class="hamburger" onclick="Components.toggleMenu()" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="menu-overlay" onclick="Components.closeMenu()"></div>
      <aside class="sidebar">
        <div class="sidebar-logo">
          <img src="uploads/MoodlyLogo.png" alt="Moodly" class="logo-img"/><span class="logo-text">Mood<span class="logo-highlight">ly</span></span>
        </div>
        <nav class="nav">
          ${items.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}"
                 onclick="App.navigate('${item.id}'); Components.closeMenu()">
              ${item.label}
            </div>
          `).join('')}
        </nav>
        <div class="sidebar-user">${App.state.user?.name || ''}</div>
      </aside>`;
  },

  shell(content, activePage) {
    const isChats = activePage === 'chats';
    return Components.sidebar(activePage) + (isChats
      ? content
      : `<div class="main">${content}</div>`);
  },

  toggleMenu() {
    document.querySelector('.sidebar')?.classList.toggle('open');
    document.querySelector('.menu-overlay')?.classList.toggle('show');
    document.querySelector('.hamburger')?.classList.toggle('open');
  },

  closeMenu() {
    document.querySelector('.sidebar')?.classList.remove('open');
    document.querySelector('.menu-overlay')?.classList.remove('show');
    document.querySelector('.hamburger')?.classList.remove('open');
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