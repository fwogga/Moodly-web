/* ============================================================
   Model.js — Dados e estado da aplicação
   Não contém HTML, CSS nem eventos de utilizador.
   ============================================================ */

const Model = {

  // ── Navegação ────────────────────────────────────────────
  currentPage: 'login',

  // ── Sessão ───────────────────────────────────────────────
  user: null,

  // ── Interesses escolhidos no registo ─────────────────────
  selectedInterests: new Set(),

  // ── Sugestões (Descobrir) ─────────────────────────────────
  currentSuggestionIndex: 0,

  suggestions: [
    { id:1, name:'Beatriz Monteiro',  initial:'B', color:'#6A2A9E', connections:7,
      music:['Arctic Monkeys','Blur','Radiohead'], movies:['Inception','Her','Interstellar'], games:[] },
    { id:2, name:'Carlos Mendes',     initial:'C', color:'#2A5090', connections:3,
      music:['Jazz','Lo-fi','Chet Baker'], movies:[], games:['Valorant','FIFA 25','Elden Ring'] },
    { id:3, name:'Sofia Pires',       initial:'S', color:'#802A40', connections:12,
      music:['Taylor Swift','Olivia Rodrigo'], movies:['Barbie','Scream'], games:['The Sims 4'] },
    { id:4, name:'Tomás Figueiredo',  initial:'T', color:'#2A6050', connections:5,
      music:['Kendrick Lamar','Frank Ocean'], movies:['Parasite','Dune'], games:['Cyberpunk 2077'] },
  ],

  // ── Eventos ──────────────────────────────────────────────
  events: [
    { id:1, title:'Noite de Cinema',          date:'25 Mar', location:'Cinema NOS Colombo, Lisboa', cat:'Filmes', color:'#1A4080', joined:false },
    { id:2, title:'Game Night',               date:'28 Mar', location:'Biblioteca de Marvila',      cat:'Jogos',  color:'#1A6040', joined:true  },
    { id:3, title:'Festival de Música Indie', date:'5 Abr',  location:'Jardim Braancamp Freire',    cat:'Música', color:'#6A2A9E', joined:false },
    { id:4, title:'Maratona de Séries',       date:'10 Abr', location:'Casa do participante',       cat:'Séries', color:'#802A40', joined:false },
    { id:5, title:'Workshop de Fotografia',   date:'15 Abr', location:'MAAT, Lisboa',               cat:'Arte',   color:'#2A4060', joined:false },
    { id:6, title:'LAN Party',                date:'20 Abr', location:'Hub Criativo do Beato',      cat:'Jogos',  color:'#1A5050', joined:false },
  ],

  // ── Chat ─────────────────────────────────────────────────
  activeChatId: 1,

  chats: [
    { id:1, name:'Ana Silva',           preview:'Quando nos encontramos?',    time:'14:32', unread:2, online:true  },
    { id:2, name:'Ricardo Lopes',       preview:'Adoro o mesmo artista!! 🔥', time:'12:07', unread:0, online:false },
    { id:3, name:'Joana Costa',         preview:'Obrigada pela conexão 😊',   time:'ontem', unread:1, online:true  },
    { id:4, name:'Grupo — Rock Lisboa', preview:'Alguém vai ao concerto?',    time:'ontem', unread:0, online:false },
    { id:5, name:'Miguel Ferreira',     preview:'Vi aquele filme também!',    time:'seg',   unread:0, online:false },
  ],

  messages: {
    1: [
      { text:'Olá! Vi que temos gostos muito parecidos 😊',                    from:'them', time:'14:20' },
      { text:'Sim! Também adoro Arctic Monkeys! Foste ao último concerto?',    from:'me',   time:'14:22' },
      { text:'Fui!! Foi incrível. Quando nos encontramos?',                    from:'them', time:'14:32' },
    ],
    2: [
      { text:'Conheces o último album do Radiohead?', from:'me',   time:'11:50' },
      { text:'Adoro o mesmo artista!! 🔥',            from:'them', time:'12:07' },
    ],
  },

  // ── Getters ───────────────────────────────────────────────
  getCurrentSuggestion()   { return this.suggestions[this.currentSuggestionIndex] || null; },
  getOtherSuggestions()    { return this.suggestions.filter((_, i) => i !== this.currentSuggestionIndex); },
  getActiveChat()          { return this.chats.find(c => c.id === this.activeChatId) || this.chats[0]; },
  getMessagesForChat(id)   { return this.messages[id] || []; },
  getTotalUnread()         { return this.chats.reduce((t, c) => t + c.unread, 0); },
  getJoinedEventsCount()   { return this.events.filter(e => e.joined).length; },

  // ── Mutações ──────────────────────────────────────────────
  setPage(page)            { this.currentPage = page; },
  setUser(data)            { this.user = data; },

  toggleInterest(id) {
    this.selectedInterests.has(id)
      ? this.selectedInterests.delete(id)
      : this.selectedInterests.add(id);
  },

  advanceSuggestion()      { this.currentSuggestionIndex++; },

  joinEvent(id)  { const e = this.events.find(x => x.id === id); if (e) e.joined = true;  },
  leaveEvent(id) { const e = this.events.find(x => x.id === id); if (e) e.joined = false; },

  setActiveChat(id) {
    this.activeChatId = id;
    const chat = this.chats.find(c => c.id === id);
    if (chat) chat.unread = 0;
  },

  addMessage(chatId, text, from) {
    if (!this.messages[chatId]) this.messages[chatId] = [];
    const now  = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    const msg  = { text, from, time };
    this.messages[chatId].push(msg);
    const chat = this.chats.find(c => c.id === chatId);
    if (chat) chat.preview = text;
    return msg;
  },

  updateUserProfile(fields) {
    if (!this.user) this.user = {};
    Object.assign(this.user, fields);
  },

  clearSession() {
    this.user = null;
    this.currentSuggestionIndex = 0;
    this.selectedInterests.clear();
  },
};
