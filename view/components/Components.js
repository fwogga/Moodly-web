/*Components.js — Componentes HTML reutilizáveis||Funções puras: recebem dados, devolvem HTML (string).*/

const Components = {

  /* Avatar circular com iniciais colorido.*/
  avatar(name, size = 44, color = '') {
    const PALETTE = ['#6A2A9E', '#2A5090', '#2A6050', '#802A40'];
    const bg   = color || PALETTE[name.charCodeAt(0) % PALETTE.length];
    const fs   = Math.round(size * 0.38);
    const inits = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return `<div class="avatar" style="width:${size}px;height:${size}px;background:${bg};font-size:${fs}px;color:#fff;">${inits}</div>`;
  },

  /*Barra lateral da navegação.*/
  sidebar(activePage) {
    const NAV_ITEMS = [
      { id: 'events',  icon: 'events',  label: 'Eventos'   },
      { id: 'home',    icon: 'connect', label: 'Descobrir' },
      { id: 'chats',   icon: 'chat',    label: 'Mensagens' },
      { id: 'profile', icon: 'profile', label: 'Perfil'    },
    ];
    const nome       = Model.user?.nome || 'Utilizador';
    const totalUnread = Model.getTotalUnread();

    return `
      <aside class="sidebar">
        <div class="sidebar-logo">
          <img src="assets/MoodlyLogo.png" style="width:42px;height:42px;object-fit:contain;"/>
          <div class="logo-name">Mood<span>ly</span></div>
        </div>
        <nav class="nav-group">
          ${NAV_ITEMS.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}"
                 onclick="Controller.navigate('${item.id}')">
              ${Icons[item.icon]}
              <span>${item.label}</span>
              ${item.id === 'chats' && totalUnread > 0
                ? `<span class="nav-badge">${totalUnread}</span>`
                : ''}
            </div>
          `).join('')}
        </nav>
        <div class="sidebar-user" onclick="Controller.navigate('profile')">
          ${Components.avatar(nome, 38)}
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${nome}</div>
            <div class="sidebar-user-role">Ver perfil</div>
          </div>
          ${Icons.settings}
        </div>
      </aside>`;
  },

  /*Layout base: sidebar + área de conteúdo principal.*/
  shell(content, activePage) {
    return Components.sidebar(activePage)
      + `<div class="main-area"><div class="content">${content}</div></div>`;
  },

  /* Item individual na lista de conversas.*/
  chatItem(chat, isActive) {
    return `
      <div class="chat-item ${isActive ? 'active' : ''}"
           onclick="Controller.openChat(${chat.id})">
        <div class="chat-avatar-wrap">
          ${Components.avatar(chat.name, 40)}
          ${chat.online ? '<span class="chat-online-dot"></span>' : ''}
        </div>
        <div class="chat-info">
          <div class="chat-name">${chat.name}</div>
          <div class="chat-preview">${chat.preview}</div>
        </div>
        <div class="chat-meta-col">
          <span class="chat-time">${chat.time}</span>
          ${chat.unread ? `<span class="chat-unread">${chat.unread}</span>` : ''}
        </div>
      </div>`;
  },
};
