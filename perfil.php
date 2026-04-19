<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Moodly — Perfil</title>
</head>
<body>

  <!-- Estrutura geral: barra lateral + conteúdo -->
  <div class="app">

    <!-- Barra lateral de navegação -->
    <div class="barra-lateral">

      <div class="logo">
        <img src="assets/MoodlyLogo.png" alt="Logo Moodly" class="logo__imagem--pequena"/>
        <div class="logo__nome">Mood<span>ly</span></div>
      </div>

      <div class="navegacao">
        <a class="navegacao__item" href="08-eventos.html">
          <span>📅</span><span>Eventos</span>
        </a>
        <a class="navegacao__item" href="04-descobrir.html">
          <span>🔍</span><span>Descobrir</span>
        </a>
        <a class="navegacao__item" href="05-mensagens.html">
          <span>💬</span><span>Mensagens</span>
          <span class="contador-nao-lidas" id="contador-nao-lidas"></span>
        </a>
        <a class="navegacao__item navegacao__item--ativo" href="06-perfil.html">
          <span>👤</span><span>Perfil</span>
        </a>
      </div>

      <div class="utilizador-barra" id="utilizador-barra">
        <div class="avatar" id="avatar-barra"></div>
        <div class="utilizador-barra__info">
          <div class="utilizador-barra__nome" id="nome-utilizador"></div>
          <div class="utilizador-barra__sub">Ver perfil</div>
        </div>
      </div>

    </div>

    <!-- Área de conteúdo principal -->
    <div class="conteudo-principal">
      <div class="pagina">

        <div class="cabecalho-pagina">
          <div class="cabecalho-pagina__esquerda">
            <h1>O Teu Perfil</h1>
            <p>Gere as tuas informações</p>
          </div>
          <!-- Ação de logout tratada pelo JS -->
          <button class="botao botao--contorno" id="botao-sair" type="button">🚪 Sair</button>
        </div>

        <div class="layout-perfil">

          <!-- Card lateral: avatar e estatísticas, preenchidos pelo JS -->
          <div class="card-lateral-perfil">

            <div class="card-lateral-perfil__faixa"></div>

            <div class="card-lateral-perfil__avatar-area">
              <div class="avatar avatar--grande" id="perfil-avatar"></div>
            </div>

            <div class="card-lateral-perfil__corpo">
              <div class="perfil-nome" id="perfil-nome"></div>
              <div class="perfil-email" id="perfil-email"></div>

              <!-- Números preenchidos pelo JS/PHP -->
              <div class="estatisticas">
                <div class="estatistica">
                  <div class="estatistica__numero" id="total-conexoes"></div>
                  <div class="estatistica__label">Conexões</div>
                </div>
                <div class="estatistica">
                  <div class="estatistica__numero" id="total-eventos"></div>
                  <div class="estatistica__label">Eventos</div>
                </div>
                <div class="estatistica">
                  <div class="estatistica__numero" id="total-interesses"></div>
                  <div class="estatistica__label">Interesses</div>
                </div>
              </div>

              <a class="botao botao--primario botao--largo" href="07-editar-perfil.html">
                ✏️ Editar Perfil
              </a>
            </div>

          </div>

          <!-- Coluna principal -->
          <div class="coluna-perfil">

            <!-- Interesses do utilizador, preenchidos pelo JS/PHP -->
            <div class="card">
              <div class="card__titulo-secao">Interesses</div>

              <div class="interesse-linha">
                <div class="interesse-linha__etiqueta">🎵 Música</div>
                <div class="interesse-linha__valor" id="perfil-musica"></div>
              </div>
              <div class="separador"></div>

              <div class="interesse-linha">
                <div class="interesse-linha__etiqueta">🎬 Filmes &amp; Séries</div>
                <div class="interesse-linha__valor" id="perfil-filmes"></div>
              </div>
              <div class="separador"></div>

              <div class="interesse-linha">
                <div class="interesse-linha__etiqueta">🎮 Jogos</div>
                <div class="interesse-linha__valor" id="perfil-jogos"></div>
              </div>
            </div>

            <!-- Lista de conexões gerada pelo JS -->
            <div class="card">
              <div class="card__titulo-secao">Conexões recentes</div>
              <div id="lista-conexoes"></div>
            </div>

          </div>

        </div>

      </div>
    </div>

  </div>

</body>
</html>