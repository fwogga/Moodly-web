
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
<div class="auth-box">
  <div class="auth-logo">Mood<span>ly</span></div>
  <h2>Bem-vindo de volta</h2>
  <p>Entra na tua conta</p>
  <div class="form-group">
    <label class="form-label">Email</label>
    <input class="form-input" type="email" id="l-email" placeholder="email@exemplo.com"
            onkeydown="if(event.key==='Enter') AuthPages.doLogin()"/>
  </div>
  <div class="form-group">
    <label class="form-label">Senha</label>
    <input class="form-input" type="password" id="l-pass" placeholder="••••••••"
            onkeydown="if(event.key==='Enter') AuthPages.doLogin()"/>
  </div>
  <div id="l-err" class="error-msg" style="display:none;margin-bottom:10px;"></div>
  <button class="btn btn-primary btn-full" id="l-btn" onclick="AuthPages.doLogin()">Entrar</button>
  <div class="auth-switch">Não tens conta? <a onclick="App.navigate('signup')">Cria uma aqui</a></div>
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
<div class="auth-box">
<div class="auth-logo">Mood<span>ly</span></div>
<h2>Criar conta</h2>
<p>Junta-te à comunidade Moodly</p>
<div class="form-group">
  <label class="form-label">Nome</label>
  <input class="form-input" type="text" id="s-name" placeholder="O teu nome"/>
</div>
<div class="form-group">
  <label class="form-label">Email</label>
  <input class="form-input" type="email" id="s-email" placeholder="email@exemplo.com"/>
</div>
<div class="form-group">
  <label class="form-label">Senha</label>
  <input class="form-input" type="password" id="s-pass" placeholder="••••••••"
          onkeydown="if(event.key==='Enter') AuthPages.doSignup()"/>
</div>
<div id="s-err" class="error-msg" style="display:none;margin-bottom:10px;"></div>
<button class="btn btn-primary btn-full" id="s-btn" onclick="AuthPages.doSignup()">Criar conta</button>
<div class="auth-switch">Já tens conta? <a onclick="App.navigate('login')">Inicia sessão</a></div>
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
    App.state.selectedTags = [];
    App.navigate('interests');
  },

  interests() {
    return `
      <div class="auth-box" style="max-width:500px;">
        <div class="auth-logo">Mood<span>ly</span></div>
        <h2>Os teus interesses</h2>
        <p style="margin-bottom:20px;">Escreve um interesse em cada categoria. Se já existir aparece como sugestão, caso contrário é criado.</p>
        ${InterestInput.render(App.state.selectedTags, 'InterestInput.remove')}
        <div id="int-err" class="error-msg" style="display:none;margin:10px 0;"></div>
        <button class="btn btn-primary btn-full" style="margin-top:8px;" onclick="AuthPages.saveInterests()">Continuar →</button>
        <div class="auth-switch"><a onclick="App.navigate('photo')">Saltar por agora</a></div>
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

  // ── Photo step ──
  photoStep() {
    return `
<div class="auth-box">
<div class="auth-logo">Mood<span>ly</span></div>
<h2>Foto de perfil</h2>
<p>Opcional. Podes adicionar ou alterar mais tarde.</p>
<div style="text-align:center;margin-bottom:16px;">
<div id="photo-preview" style="width:90px;height:90px;border-radius:50%;background:var(--purple);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;margin:0 auto 12px;overflow:hidden;">
  ${(App.state.user?.name || '?')[0].toUpperCase()}
</div>
<label class="btn btn-outline" style="cursor:pointer;">
  Escolher foto
  <input type="file" accept="image/*" style="display:none" onchange="AuthPages.previewPhoto(this)"/>
</label>
</div>
<div id="photo-err" class="error-msg" style="display:none;margin-bottom:10px;"></div>
<button class="btn btn-primary btn-full" id="photo-btn" onclick="AuthPages.uploadPhoto()">Guardar e entrar</button>
<div class="auth-switch"><a onclick="App.navigate('home')">Saltar</a></div>
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