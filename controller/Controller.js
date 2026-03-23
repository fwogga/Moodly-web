/* ============================================================
   Controller.js — Lógica de interação
   Liga os eventos do utilizador ao Model e ao Renderer.
   ============================================================ */

const Controller = {

  // Navegação 
  navigate(page) {
    Model.setPage(page);
    Renderer.render();
  },

  //Login
  login() {
    const email = document.getElementById('l-email')?.value.trim();
    const pass  = document.getElementById('l-pass')?.value.trim();
    const errEl = document.getElementById('l-err');
    const btnEl = document.getElementById('l-btn');

    if (!email || !pass) {
      errEl.textContent = 'Preenche email e senha.';
      errEl.style.display = 'block';
      return;
    }

    btnEl.textContent = 'A entrar...';
    btnEl.disabled = true;

    setTimeout(() => {
      const nome = email.split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      Model.setUser({
        nome,
        email,
        connections: 14,
        music:  'Arctic Monkeys, Radiohead, Blur',
        movies: 'Inception, Breaking Bad, Her',
        games:  'Cyberpunk 2077, Elden Ring',
      });

      this.navigate('home');
      Renderer.toast('Bem-vindo de volta! 🎉', 'success');
    }, 800);
  },

  //Signup 
  signup() {
    const nome  = document.getElementById('s-nome')?.value.trim();
    const email = document.getElementById('s-email')?.value.trim();
    const pass  = document.getElementById('s-pass')?.value.trim();
    const errEl = document.getElementById('s-err');
    const btnEl = document.getElementById('s-btn');

    if (!nome || !email || !pass) {
      errEl.textContent = 'Preenche todos os campos.';
      errEl.style.display = 'block';
      return;
    }

    btnEl.textContent = 'A criar...';
    btnEl.disabled = true;

    setTimeout(() => {
      Model.setUser({ nome, email, connections: 0, music: '', movies: '', games: '' });
      this.navigate('interests');
    }, 700);
  },

  // Logout 
  logout() {
    document.querySelector('.modal-overlay')?.remove();
    Model.clearSession();
    this.navigate('login');
    Renderer.toast('Sessão terminada.', 'info');
  },

  showLogoutModal() {
    Renderer.modal(
      'Terminar sessão',
      'Tens a certeza que queres sair da tua conta?',
      `<button class="btn btn-outline" style="flex:1"
               onclick="document.querySelector('.modal-overlay').remove()">Cancelar</button>
       <button class="btn btn-primary" style="flex:1"
               onclick="Controller.logout()">Sair</button>`
    );
  },

  //Interesses
  toggleInterest(el, id) {
    Model.toggleInterest(id);
    el.classList.toggle('selected', Model.selectedInterests.has(id));
  },

  finishInterests() {
    if (Model.selectedInterests.size === 0) {
      Renderer.toast('Escolhe pelo menos 1 interesse!', 'error');
      return;
    }
    this.navigate('home');
    Renderer.toast('Bem-vindo ao Moodly! 🎉', 'success');
  },

  // Swipe / 
  swipe(action) {
    const s = Model.getCurrentSuggestion();
    if (!s) return;

    const MESSAGES = {
      pass:    { text: `Passaste ${s.name}`,               type: 'info'    },
      connect: { text: `Pedido enviado a ${s.name}! 🤝`,   type: 'success' },
      super:   { text: `Super like para ${s.name}! ⭐`,     type: 'info'    },
    };

    Renderer.toast(MESSAGES[action].text, MESSAGES[action].type);
    Model.advanceSuggestion();
    this.navigate('home');
  },

  selectSuggestion(index) {
    Model.currentSuggestionIndex = index;
    this.navigate('home');
  },

  connectTo(index) {
    const sg = Model.suggestions[index];
    if (sg) Renderer.toast(`Pedido enviado a ${sg.name}! 🤝`, 'success');
  },

  resetSuggestions() {
    Model.currentSuggestionIndex = 0;
    this.navigate('home');
  },

  //Eventos 
  joinEvent(id) {
    Model.joinEvent(id);
    const event = Model.events.find(e => e.id === id);
    this.navigate('events');
    Renderer.toast(`Inscrito em "${event?.title}"! 🎉`, 'success');
  },

  leaveEvent(id) {
    Model.leaveEvent(id);
    const event = Model.events.find(e => e.id === id);
    this.navigate('events');
    Renderer.toast(`Saíste de "${event?.title}".`, 'info');
  },

  createEvent()  { Renderer.toast('Criar evento em breve!',      'info'); },
  openEventChat(){ Renderer.toast('Chat do evento em breve!',    'info'); },

  //Chat 
  openChat(id) {
    Model.setActiveChat(id);
    this.navigate('chats');
  },

  filterChats(query) {
    const listEl = document.getElementById('chat-list');
    if (!listEl) return;
    const filtered = Model.chats.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
    listEl.innerHTML = filtered.map(c =>
      Components.chatItem(c, c.id === Model.activeChatId)
    ).join('');
  },

  sendMessage() {
    const inputEl = document.getElementById('msg-input');
    if (!inputEl || !inputEl.value.trim()) return;

    const text   = inputEl.value.trim();
    const chatId = Model.activeChatId;
    const msg    = Model.addMessage(chatId, text, 'me');

    inputEl.value = '';
    inputEl.style.height = 'auto';

    const listEl = document.getElementById('msg-list');
    if (listEl) {
      const div = document.createElement('div');
      div.className = 'msg-row me';
      div.innerHTML = `<div class="msg-bubble">${msg.text}</div>
                       <div class="msg-time">${msg.time}</div>`;
      listEl.appendChild(div);
      listEl.scrollTop = listEl.scrollHeight;
    }

    this._simulateReply(chatId, listEl);
  },

  _simulateReply(chatId, listEl) {
    const REPLIES = ['Que fixe! 😄', 'Concordo completamente!', 'Hahaha 😂', 'Sim sim!', '🔥🔥🔥'];
    const text = REPLIES[Math.floor(Math.random() * REPLIES.length)];

    setTimeout(() => {
      const reply = Model.addMessage(chatId, text, 'them');
      if (listEl) {
        const div = document.createElement('div');
        div.className = 'msg-row them';
        div.innerHTML = `<div class="msg-bubble">${reply.text}</div>
                         <div class="msg-time">${reply.time}</div>`;
        listEl.appendChild(div);
        listEl.scrollTop = listEl.scrollHeight;
      }
    }, 1400);
  },

  //Perfil
  saveProfile() {
    Model.updateUserProfile({
      nome:   document.getElementById('ep-nome')?.value   || '',
      email:  document.getElementById('ep-email')?.value  || '',
      music:  document.getElementById('ep-music')?.value  || '',
      movies: document.getElementById('ep-movies')?.value || '',
      games:  document.getElementById('ep-games')?.value  || '',
    });
    this.navigate('profile');
    Renderer.toast('Perfil atualizado! ✅', 'success');
  },

  messageUser(name) {
    Renderer.toast(`Mensagem enviada a ${name}!`, 'success');
  },
};
