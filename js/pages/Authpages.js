const InterestInput = {

  CATS: ['Música', 'Jogos', 'Cinema & Séries'],

  render(selectedTags, removeCallbackStr) {
    return this.CATS.map(cat => {
      const catTags = selectedTags.filter(t => t.categoria === cat);
      const catKey  = cat.replace(/[^a-z]/gi, '');
      return `
        <div class="interest-section">
          <div class="interest-section-label">${cat}</div>
          <div class="interest-input-row">
            <input class="form-input" id="int-${catKey}" type="text"
                   placeholder="Escreve e carrega Enter..."
                   oninput="InterestInput.search('${cat}', this.value, 'sug-${catKey}')"
                   onkeydown="if(event.key==='Enter'){event.preventDefault();InterestInput.addTyped('${cat}','int-${catKey}','sug-${catKey}');}"/>
            <button class="btn btn-outline btn-sm"
                    onclick="InterestInput.addTyped('${cat}','int-${catKey}','sug-${catKey}')">+</button>
          </div>
          <div class="tag-suggestions" id="sug-${catKey}"></div>
          <div class="selected-tags" id="sel-${catKey}">
            ${catTags.map(t => `
              <span class="selected-tag">
                ${t.nome}
                <button onclick="${removeCallbackStr}(${t.id})">×</button>
              </span>`).join('')}
          </div>
        </div>`;
    }).join('');
  },

  async search(categoria, q, sugId) {
    const container = document.getElementById(sugId);
    if (!container) return;
    if (!q.trim()) { container.innerHTML = ''; return; }

    const res = await App.api('search_interests', { q, categoria }, 'GET');
    if (!res.ok) return;

    const existing = new Set(App.state.selectedTags.map(t => t.id));
    container.innerHTML = res.data
      .filter(t => !existing.has(t.id))
      .map(t => `
        <span class="tag-suggestion"
              onclick="InterestInput.addTag(${t.id},'${t.tag.replace(/'/g,"\\'")}','${categoria}','${sugId}')">
          ${t.tag}
        </span>
      `).join('');
  },

  addTag(id, nome, categoria, sugId) {
    if (App.state.selectedTags.find(t => t.id === id)) return;
    App.state.selectedTags.push({ id, nome, categoria });
    this._refreshCategory(categoria);
    const container = document.getElementById(sugId);
    if (container) container.innerHTML = '';
  },

  async addTyped(categoria, inputId, sugId) {
    const input = document.getElementById(inputId);
    const val   = input?.value.trim();
    if (!val) return;

    if (App.state.selectedTags.find(t => t.nome.toLowerCase() === val.toLowerCase() && t.categoria === categoria)) {
      input.value = '';
      return;
    }

    const res = await App.api('find_or_create_interest', { name: val, categoria });
    if (!res.ok) { Components.toast(res.error, 'error'); return; }

    const { id, nome, categoria: cat } = res.data;
    if (!App.state.selectedTags.find(t => t.id === id)) {
      App.state.selectedTags.push({ id, nome, categoria: cat });
    }
    input.value = '';
    const container = document.getElementById(sugId);
    if (container) container.innerHTML = '';
    this._refreshCategory(cat);
  },

  remove(id) {
    App.state.selectedTags = App.state.selectedTags.filter(t => t.id !== id);
    this.CATS.forEach(cat => this._refreshCategory(cat));
  },

  _refreshCategory(categoria) {
    const catKey = categoria.replace(/[^a-z]/gi, '');
    const selEl  = document.getElementById('sel-' + catKey);
    if (!selEl) return;
    const catTags = App.state.selectedTags.filter(t => t.categoria === categoria);
    selEl.innerHTML = catTags.map(t => `
      <span class="selected-tag">
        ${t.nome}
        <button onclick="InterestInput.remove(${t.id})">×</button>
      </span>`).join('');
  },
};

const AuthPages = {

login() {
  return `
    <div class="auth-split">
      <div class="auth-left">
        <div class="auth-left-logo">
          <img src="uploads/MoodlyLogo.png" alt="Moodly"/>
          Mood<span>ly</span>
        </div>
        <div class="auth-left-body">
          <div class="auth-left-tagline">
            Encontra pessoas com<br/><span>os teus gostos</span>
          </div>
          <div class="auth-left-sub">
            Liga-te a quem ama a mesma música,<br/>filmes e jogos que tu.
          </div>
          <div class="auth-pills">
            <span class="auth-pill">🎮 Jogos</span>
            <span class="auth-pill">🎬 Filmes</span>
            <span class="auth-pill">🎵 Música</span>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-form-wrap">
          <div class="auth-form-title">Bem-vindo<br/>de volta</div>
          <div class="auth-form-sub">Entra na tua conta para continuar</div>

          <div class="auth-field">
            <label>Email</label>
            <input type="email" id="l-email" placeholder="o.teu@email.com"
                   onkeydown="if(event.key==='Enter') AuthPages.doLogin()"/>
          </div>
          <div class="auth-field">
            <label>Senha</label>
            <input type="password" id="l-pass" placeholder="••••••••"
                   onkeydown="if(event.key==='Enter') AuthPages.doLogin()"/>
          </div>
          <div id="l-err" class="auth-err"></div>
          <button class="auth-btn-primary" id="l-btn" onclick="AuthPages.doLogin()">Entrar</button>
          <div class="auth-switch-line">
            Não tens conta? <a onclick="App.navigate('signup')">Cria uma aqui</a>
          </div>
        </div>
      </div>
    </div>`;
},

  async doLogin() {
    const email = document.getElementById('l-email')?.value.trim();
    const pass  = document.getElementById('l-pass')?.value;
    const errEl = document.getElementById('l-err');
    const btn   = document.getElementById('l-btn');
    errEl.style.display = 'none';
    if (!email || !pass) { errEl.textContent = 'Preenche todos os campos'; errEl.style.display = 'block'; return; }
    btn.disabled = true; btn.textContent = 'A entrar...';
    const res = await App.api('login', { email, password: pass });
    btn.disabled = false; btn.textContent = 'Entrar';
    if (!res.ok) { errEl.textContent = res.error; errEl.style.display = 'block'; return; }
    App.state.user = res.data;
    App.navigate('home');
    Components.toast('Bem-vindo!', 'success');
  },

  signup() {
    return `
    <div class="auth-split">
      <div class="auth-left">
        <div class="auth-left-logo">
          <img src="uploads/MoodlyLogo.png" alt="Moodly"/>
          Mood<span>ly</span>
        </div>
        <div class="auth-left-body">
          <div class="auth-left-tagline">
            Começa a tua<br/><span>jornada</span>
          </div>
          <div class="auth-left-sub">
            Cria o teu perfil e começa a descobrir pessoas com os mesmos interesses.
          </div>
          <div class="auth-pills">
            <span class="auth-pill">🎮 Jogos</span>
            <span class="auth-pill">🎬 Filmes</span>
            <span class="auth-pill">🎵 Música</span>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-form-wrap">
          <div class="auth-form-title">Criar conta</div>
          <div class="auth-form-sub">Junta-te à comunidade Moodly</div>

          <div class="auth-field">
            <label>Nome</label>
            <input type="text" id="s-name" placeholder="O teu nome"/>
          </div>
          <div class="auth-field">
            <label>Email</label>
            <input type="email" id="s-email" placeholder="o.teu@email.com"/>
          </div>
          <div class="auth-field">
            <label>Senha</label>
            <input type="password" id="s-pass" placeholder="••••••••"
                   onkeydown="if(event.key==='Enter') AuthPages.doSignup()"/>
          </div>
          <div id="s-err" class="auth-err"></div>
          <button class="auth-btn-primary" id="s-btn" onclick="AuthPages.doSignup()">Criar conta</button>
          <div class="auth-switch-line">
            Já tens conta? <a onclick="App.navigate('login')">Inicia sessão</a>
          </div>
        </div>
      </div>
    </div>`;
  },

  async doSignup() {
    const name  = document.getElementById('s-name')?.value.trim();
    const email = document.getElementById('s-email')?.value.trim();
    const pass  = document.getElementById('s-pass')?.value;
    const errEl = document.getElementById('s-err');
    const btn   = document.getElementById('s-btn');
    errEl.style.display = 'none';
    if (!name || !email || !pass) { errEl.textContent = 'Preenche todos os campos'; errEl.style.display = 'block'; return; }
    btn.disabled = true; btn.textContent = 'A criar...';
    const res = await App.api('register', { name, email, password: pass });
    btn.disabled = false; btn.textContent = 'Criar conta';
    if (!res.ok) { errEl.textContent = res.error; errEl.style.display = 'block'; return; }
    App.state.user = res.data;
    App.state.selectedTags  = [];
    App.state.chats         = [];
    App.state.chatsLoaded   = false;
    App.state.activeChatId   = null;
    App.state.activeChatName = null;
    App.state.messages       = [];
    App.state.activeEventId  = null;
    App.state.eventMessages  = [];
    App.navigate('interests');
  },

  interests() {
    return `
    <div class="auth-split">
      <div class="auth-left">
        <div class="auth-left-logo">
          <img src="uploads/MoodlyLogo.png" alt="Moodly"/>
          Mood<span>ly</span>
        </div>
        <div class="auth-left-body">
          <div class="auth-left-tagline">
            Os teus<br/><span>interesses</span>
          </div>
          <div class="auth-left-sub">
            Quanto mais interesses adicionares, mais pessoas compatíveis vais descobrir.
          </div>
          <div class="auth-pills">
            <span class="auth-pill">🎮 Jogos</span>
            <span class="auth-pill">🎬 Cinema & Séries</span>
            <span class="auth-pill">🎵 Música</span>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-form-wrap" style="max-width:460px;">
          <div class="auth-form-title">Os teus gostos</div>
          <div class="auth-form-sub">Escreve e carrega Enter para adicionar. Se já existir aparece como sugestão.</div>
          ${InterestInput.render(App.state.selectedTags, 'InterestInput.remove')}
          <div id="int-err" class="auth-err"></div>
          <button class="auth-btn-primary" style="margin-top:16px;" onclick="AuthPages.saveInterests()">Continuar →</button>
          <button class="auth-btn-outline" onclick="App.navigate('photo')">Saltar por agora</button>
        </div>
      </div>
    </div>`;
  },

  async saveInterests() {
    const errEl = document.getElementById('int-err');
    if (!App.state.selectedTags.length) {
      errEl.textContent = 'Adiciona pelo menos 1 interesse';
      errEl.style.display = 'block';
      return;
    }
    const tags = JSON.stringify(App.state.selectedTags.map(t => t.id));
    await App.api('set_interests', { tags });
    App.navigate('photo');
  },

  photoStep() {
    return `
    <div class="auth-split">
      <div class="auth-left">
        <div class="auth-left-logo">
          <img src="uploads/MoodlyLogo.png" alt="Moodly"/>
          Mood<span>ly</span>
        </div>
        <div class="auth-left-body">
          <div class="auth-left-tagline">
            A tua<br/><span>cara</span>
          </div>
          <div class="auth-left-sub">
            Uma foto ajuda as pessoas a reconhecer-te. Podes adicionar ou alterar mais tarde.
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-form-wrap">
          <div class="auth-form-title">Foto de perfil</div>
          <div class="auth-form-sub">Opcional — podes saltar e adicionar mais tarde.</div>

          <div class="auth-avatar-wrap">
            <div id="photo-preview" class="auth-avatar-circle">
              ${(App.state.user?.name || '?')[0].toUpperCase()}
            </div>
            <label class="auth-btn-outline" style="width:auto;padding:9px 24px;cursor:pointer;display:inline-block;text-align:center;">
              Escolher foto
              <input type="file" accept="image/*" style="display:none" onchange="AuthPages.previewPhoto(this)"/>
            </label>
          </div>

          <div id="photo-err" class="auth-err"></div>
          <button class="auth-btn-primary" id="photo-btn" onclick="AuthPages.uploadPhoto()">Guardar e entrar</button>
          <button class="auth-btn-outline" onclick="App.navigate('home')">Saltar</button>
        </div>
      </div>
    </div>`;
  },

  previewPhoto(input) {
    const file = input.files[0];
    if (!file) return;
    AuthPages._pendingFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      const el = document.getElementById('photo-preview');
      if (el) el.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
    };
    reader.readAsDataURL(file);
  },

  async uploadPhoto() {
    const file  = AuthPages._pendingFile;
    const errEl = document.getElementById('photo-err');
    const btn   = document.getElementById('photo-btn');
    if (!file) { App.navigate('home'); return; }
    btn.disabled = true; btn.textContent = 'A guardar...';
    const form = new FormData();
    form.append('action', 'upload_photo');
    form.append('photo', file);
    const res  = await fetch('api/api.php', { method: 'POST', body: form });
    const json = await res.json();
    btn.disabled = false; btn.textContent = 'Guardar e entrar';
    if (!json.ok) { errEl.textContent = json.error; errEl.style.display = 'block'; return; }
    App.state.user.photo = json.data.photo;
    AuthPages._pendingFile = null;
    App.navigate('home');
    Components.toast('Perfil criado!', 'success');
  },
};