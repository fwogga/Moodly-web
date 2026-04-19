<!DOCTYPE html>
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Moodly — Criar Conta</title>
</head>
<body>

  <!-- Página de registo: fundo + card central -->
  <div class="pagina-auth">

    <div class="fundo-bola fundo-bola--direita"></div>

    <div class="card-auth">

      <!-- Lado esquerdo: branding fixo -->
      <div class="card-auth__esquerda">

        <div class="logo">
          <span class="logo__emoji">😊</span>
          <div class="logo__nome">Mood<span>ly</span></div>
        </div>

        <p class="slogan">
          A tua <span class="slogan__destaque">tribo</span> está à espera
        </p>

        <p class="descricao">
          Cria a tua conta e começa a descobrir pessoas incríveis com os mesmos gostos.
        </p>

        <div class="etiquetas">
          <span class="etiqueta">✨ Grátis para sempre</span>
          <span class="etiqueta">🔒 Privacidade garantida</span>
          <span class="etiqueta">🇵🇹 Feito em Portugal</span>
        </div>

      </div>

      <!-- Lado direito: formulário de registo -->
      <div class="card-auth__direita">

        <h2 class="form-titulo">Criar conta</h2>
        <p class="form-subtitulo">Junta-te à comunidade Moodly</p>

        <!-- Erro preenchido pelo JS se o registo falhar -->
        <div id="erro-signup" class="mensagem-erro"></div>

        <div class="campo">
          <label class="campo__etiqueta" for="input-nome">NOME</label>
          <input class="campo__input" type="text" id="input-nome" name="nome"
                 placeholder="O teu nome" autocomplete="name" required/>
        </div>

        <div class="campo">
          <label class="campo__etiqueta" for="input-email">EMAIL</label>
          <input class="campo__input" type="email" id="input-email" name="email"
                 placeholder="o.teu@email.com" autocomplete="email" required/>
        </div>

        <div class="campo">
          <label class="campo__etiqueta" for="input-senha">SENHA</label>
          <input class="campo__input" type="password" id="input-senha" name="password"
                 placeholder="Mínimo 6 caracteres" autocomplete="new-password" required/>
        </div>

        <!-- Ação tratada pelo JS -->
        <button class="botao botao--primario botao--largo" id="botao-criar" type="button">
          Criar conta
        </button>

        <p class="link-troca">
          Já tens conta? <a href="01-login.html">Inicia sessão</a>
        </p>

      </div>

    </div>
  </div>

</body>
</html>
