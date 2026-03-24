/* ============================================================
   Renderer.js — Orquestrador do DOM
   Único ficheiro que escreve diretamente no document.
   ============================================================ */

const Renderer = {

  // Mapa: página → função de View
  PAGE_MAP: {
    'login':        () => AuthPages.login(),
    'signup':       () => AuthPages.signup(),
    'interests':    () => AuthPages.interests(),
    'home':         () => HomePages.home(),
    'events':       () => EventsPage.events(),
    'chats':        () => ChatsPage.chats(),
    'profile':      () => ProfilePages.profile(),
    'edit-profile': () => ProfilePages.editProfile(),
  },

  // Páginas sem sidebar (ecrã inteiro)
  FULLSCREEN_PAGES: new Set(['login', 'signup', 'interests']),

  /* Render principal — chamado sempre que o estado muda.*/
  render() {
    const appEl  = document.getElementById('app');
    const page   = Model.currentPage;
    const pageFn = this.PAGE_MAP[page] || this.PAGE_MAP['home'];

    appEl.className = this.FULLSCREEN_PAGES.has(page) ? 'auth-mode' : '';
    appEl.innerHTML = pageFn();

    if (page === 'chats') {
      this._scrollChatToBottom();
    }
  },

  /*Toast de notificação temporária.*/
  toast(message, type = 'info') {
    const ICONS = { success: Icons.check, error: Icons.x, info: Icons.star };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${ICONS[type]}</span><span>${message}</span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    }, 3200);
  },

  /* Modal de confirmação genérico.*/
  modal(title, body, buttons) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <h3>${title}</h3>
        <p>${body}</p>
        <div class="modal-actions">${buttons}</div>
      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    return overlay;
  },

  _scrollChatToBottom() {
    const list = document.getElementById('msg-list');
    if (list) setTimeout(() => list.scrollTop = list.scrollHeight, 50);
  },

  init() {
    this.render();
  },
};
