const App = {

  state: {
    page:           'login',
    user:           null,

    discoverUsers:  [],
    discoverIndex:  0,
    discoverLoaded: false,

    interests:      [],
    selectedTags:   [],
    interestsLoaded: false,

    connections:    [],
    pendingRequests:[],
    connectionsLoaded: false,

    events:         [],
    eventsLoaded:   false,

    chats:          [],
    chatsLoaded:    false,
    activeChatId:   null,
    activeChatName: null,
    messages:       [],
    activeEventId:  null,
    eventMessages:  [],

    profile:        null,

    adminStats:     null,
    adminUsers:     null,
    adminReports:   null,
  },

  async api(action, data = {}, method = 'POST') {
    try {
      let url = 'api/api.php';
      let options = { method };

      if (method === 'POST') {
        const form = new FormData();
        form.append('action', action);
        for (const [k, v] of Object.entries(data)) {
          if (v !== undefined && v !== null) form.append(k, v);
        }
        options.body = form;
      } else {
        url += '?' + new URLSearchParams({ action, ...data }).toString();
      }

      const res  = await fetch(url, options);
      const json = await res.json();
      return json;
    } catch (e) {
      return { ok: false, error: 'Erro de ligação' };
    }
  },

  navigate(page) {
    this.state.page = page;
    this.render();
  },

  render() {
    const app  = document.getElementById('app');
    const page = this.state.page;
    const authPages = new Set(['login', 'signup', 'interests', 'photo']);
    app.className = authPages.has(page) ? 'auth' : '';

    const map = {
      login:     () => AuthPages.login(),
      signup:    () => AuthPages.signup(),
      interests: () => AuthPages.interests(),
      photo:     () => AuthPages.photoStep(),
      home:      () => HomePage.render(),
      events:    () => EventsPage.render(),
      chats:     () => ChatsPage.render(),
      profile:   () => ProfilePage.render(),
      admin:     () => AdminPage.render(),
    };

    app.innerHTML = (map[page] || map.home)();

    if (page === 'chats') {
      setTimeout(() => {
        const el = document.getElementById('msg-list');
        if (el) el.scrollTop = el.scrollHeight;
      }, 30);
    }
  },

  async init() {
    const res = await this.api('check_session', {}, 'GET');
    if (res.ok) {
      this.state.user = res.data;
      this.navigate('home');
    } else {
      this.navigate('login');
    }
  },

  async boot() {
    return this.init();
  },

  async logout() {
    await this.api('logout');
    this.state.user           = null;
    this.state.discoverLoaded = false;
    this.state.chatsLoaded    = false;
    this.state.eventsLoaded   = false;
    this.state.connectionsLoaded = false;
    this.state.profile        = null;
    this.navigate('login');
  },
};