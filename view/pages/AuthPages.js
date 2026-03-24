/* ============================================================
   AuthPages.js — Templates das páginas de autenticação
   Login, Signup, Seleção de interesses
   ============================================================ */

const AuthPages = {

  login() {
    return `
      <div class="auth-page">
        <div class="auth-background-mid" style="width:500px;height:500px;background:radial-gradient(circle,rgba(106,42,158,0.3) 0%,transparent 70%);top:-150px;left:-150px;"></div>
        <div class="auth-background-mid" style="width:400px;height:400px;background:radial-gradient(circle,rgba(255,214,0,0.08) 0%,transparent 70%);bottom:-100px;right:-100px;"></div>
        <div class="auth-split anim">
          <div class="auth-left">
            <div class="auth-left-logo">
              <img src="assets/MoodlyLogo.png" style="width:52px;height:52px;object-fit:contain;"/>
              <div class="logo-name" style="font-size:2rem;">Mood<span>ly</span></div>
            </div>
            <div class="auth-tagline">Encontra pessoas com os teus <span>gostos</span></div>
            <div class="auth-desc">Liga-te a quem ama a mesma música, filmes e jogos que tu.</div>
            <div class="auth-chips">
              <span class="auth-chip">🎵 Música</span>
              <span class="auth-chip">🎬 Filmes</span>
              <span class="auth-chip">🎮 Jogos</span>
              <span class="auth-chip">📺 Séries</span>
              <span class="auth-chip">🎨 Arte</span>
            </div>
          </div>
          <div class="auth-right">
            <h2>Bem-vindo de volta</h2>
            <p class="auth-sub">Entra na tua conta para continuar</p>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" id="l-email" placeholder="o.teu@email.com"
                     onkeydown="if(event.key==='Enter') Controller.login()"/>
            </div>
            <div class="form-group">
              <label class="form-label">Senha</label>
              <input class="form-input" type="password" id="l-pass" placeholder="••••••••"
                     onkeydown="if(event.key==='Enter') Controller.login()"/>
            </div>
            <div id="l-err" class="form-error" style="display:none;margin-bottom:12px;"></div>
            <button class="btn btn-primary btn-lg" style="width:100%" id="l-btn"
                    onclick="Controller.login()">Entrar</button>
            <div style="text-align:center;margin-top:12px;color:var(--text-sub);font-size:0.82rem;">
              <em>Demo: qualquer email + senha funciona</em>
            </div>
            <div class="auth-switch">
              Não tens conta? <a onclick="Controller.navigate('signup')">Cria uma aqui!</a>
            </div>
          </div>
        </div>
      </div>`;
  },

  signup() {
    return `
      <div class="auth-page">
        <div class="auth-bg-orb" style="width:500px;height:500px;background:radial-gradient(circle,rgba(106,42,158,0.3) 0%,transparent 70%);top:-150px;right:-150px;"></div>
        <div class="auth-split anim">
          <div class="auth-left">
            <div class="auth-left-logo">
              <div class="logo-emoji" style="width:52px;height:52px;font-size:28px;">😊</div>
              <div class="logo-name" style="font-size:2rem;">Mood<span>ly</span></div>
            </div>
            <div class="auth-tagline">A tua <span>tribo</span> está à espera</div>
            <div class="auth-desc">Cria a tua conta e começa a descobrir pessoas incríveis com os mesmos gostos.</div>
            <div class="auth-chips">
              <span class="auth-chip">✨ Grátis para sempre</span>
              <span class="auth-chip">🔒 Privacidade garantida</span>
              <span class="auth-chip">🇵🇹 Feito em Portugal</span>
            </div>
          </div>
          <div class="auth-right">
            <h2>Criar conta</h2>
            <p class="auth-sub">Junta-te à comunidade Moodly</p>
            <div class="form-group">
              <label class="form-label">Nome</label>
              <input class="form-input" type="text" id="s-nome" placeholder="O teu nome"/>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" id="s-email" placeholder="o.teu@email.com"/>
            </div>
            <div class="form-group">
              <label class="form-label">Senha</label>
              <input class="form-input" type="password" id="s-pass" placeholder="Mínimo 6 caracteres"
                     onkeydown="if(event.key==='Enter') Controller.signup()"/>
            </div>
            <div id="s-err" class="form-error" style="display:none;margin-bottom:12px;"></div>
            <button class="btn btn-primary btn-lg" style="width:100%" id="s-btn"
                    onclick="Controller.signup()">Criar conta</button>
            <div class="auth-switch">
              Já tens conta? <a onclick="Controller.navigate('login')">Inicia sessão</a>
            </div>
          </div>
        </div>
      </div>`;
  },

  interests() {
    const OPTIONS = [
      { id: 'music',  icon: 'music', label: 'Música'   },
      { id: 'movies', icon: 'film',  label: 'Filmes'   },
      { id: 'series', icon: 'film',  label: 'Séries'   },
      { id: 'games',  icon: 'game',  label: 'Jogos'    },
      { id: 'art',    icon: 'art',   label: 'Arte'     },
      { id: 'sport',  icon: 'sport', label: 'Desporto' },
      { id: 'books',  icon: 'star',  label: 'Livros'   },
      { id: 'travel', icon: 'pin',   label: 'Viagens'  },
    ];
    return `
      <div class="interests-page">
        <div class="interests-container anim">
          <div style="text-align:center;margin-bottom:8px;">
            <div class="logo-emoji" style="width:52px;height:52px;font-size:28px;margin:0 auto 16px;">😊</div>
            <h2 style="font-size:1.8rem;">Os teus interesses</h2>
            <p style="color:var(--text-sub);margin-top:8px;">Escolhe pelo menos 1 para personalizar a tua experiência</p>
          </div>
          <div class="interests-grid">
            ${OPTIONS.map(opt => `
              <button class="interest-chip ${Model.selectedInterests.has(opt.id) ? 'selected' : ''}"
                      onclick="Controller.toggleInterest(this, '${opt.id}')">
                ${Icons[opt.icon]}
                <span>${opt.label}</span>
              </button>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-lg" style="width:100%"
                  onclick="Controller.finishInterests()">Continuar →</button>
        </div>
      </div>`;
  },
};
