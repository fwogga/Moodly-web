# Moodly  
## Autores
- Deuwer Rabelais (20241521)
- Isimar Quixito (20242038)
- Miguel Almeida (20240206)
- Vivandro Kambanza (20241805)

Moodly será uma expansão do nosso projeto do semestre anterior com o mesmo nome. Será um website criado para ajudar calouros universitários a integrarem-se mais facilmente na vida académica. A ideia surge do facto de que muitos estudantes do primeiro ano têm dificuldade em encontrar novos amigos e criar amizades até mesmo dentro do seu curso. O website funciona de forma semelhante a serviços como tinder, ou o Bumble, que popularizaram o conceito de "swipe" mas em vez de procurar relações românticas, o objetivo é encontrar pessoas com interesses em comum, como música, filmes ou jogos.

## Autores
- Deuwer Rabelais (20241521)
- Isimar Quixito (20242038)
- Miguel Almeida (20240206)
- Vivandro Kambanza (20241805)

## Objetivos do Projeto
-	Criar um website funcional que promova conexões sociais autênticas
-	Implementar um sistema de matching baseado em interesses
-	Desenvolver um backend pensado nas novas funcionalidades
-	Fazer o design e desenvolver um website que cumpra as melhores práticas de UI
-	Criação da conta de administrador para gestão de utilizadores e visualização de estatísticas
-	Aplicar conhecimentos adquiridos nas diferentes Unidades Curriculares

## Público-Alvo
-	Estudantes universitários, especialmente do primeiro ano
-	Jovens adultos entre 18 e 30 anos
-	Pessoas que querem criar novas amizades
-	Pessoas que querem conhecer pessoas com interesses semelhantes
-	Pessoas que querem participar em eventos sociais informais

## Persona
**Admin**
<img width="1035" height="571" alt="Captura de ecrã 2026-03-08 012458" src="https://github.com/user-attachments/assets/cda5071f-b0ed-42fa-a1eb-8fd00ed227f4" />
**Jornada do Admin**
![WhatsApp Image 2026-03-07 at 22 16 01](https://github.com/user-attachments/assets/a872e96d-f3d9-40d0-af27-0144f9bb11c4)

**User**
<img width="1029" height="577" alt="Captura de ecrã 2026-03-08 012630" src="https://github.com/user-attachments/assets/c18c3584-52aa-4863-a323-85ef09edc91e" />
**Jornada do User** 

![WhatsApp Image 2026-03-07 at 22 16 0](https://github.com/user-attachments/assets/f3da7224-115d-450e-b653-e8afedcc2c3c)

## Pesquisa de Mercado
**Tinder / Bumble**
-	Utilizam o conceito de swipe
-	Foco principal em relações românticas
-	Pouca valorização de interesses aprofundados

**Meetup**
-	Orientada para eventos e grupos
-	Menos centrada em relações individuais

**Discord**
-	Forte componente de chat e comunidades
-	Não possui sistema de descoberta pessoal direta

## Planos de Trabalho

- Fase 1 – Planeamento e Pesquisa - 18 de Fev
- Fase 2 – Design e Modelagem - 10 de Março
- Fase 3 – Desenvolvimento Backend - 20 de Março
- Fase 4 – Desenvolvimento Frontend - 20 de Março
- Fase 5 – Testes e Validação - 24 de Abril
- Fase 6 – Entrega e Apresentação - Dia da Última Apresentação

## Project Charter

A **Moodly** diferencia-se por colocar em primeiro plano os **interesses culturais dos utilizadores**, permitindo que novas amizades surjam de forma natural através da partilha de música, filmes ou jogos preferidos.

### Objetivos
- Criar um website que sugere matches entre utilizadores com base nos seus gostos.
- Implementar um sistema de perfis de utilizador, com interesses armazenados em base de dados relacional.
- Desenvolver um backend em **PHP** para gerir os dados dos utilizadores e matches.
- Criar mockups e interfaces no **Figma** com foco nas boas práticas de UI.
- Implementar a conta de administrador e as suas respetivas funções.
- Implementar pesquisa de utilizadores.
- Implementar mapa de eventos com seleção de localização interativa.

### Escopo
**Incluído no projeto:**
- Criação de perfis de utilizador com foto de perfil.
- Sistema de preferências culturais (Música, Jogos, Cinema & Séries).
- Algoritmo de matching baseado em interesses com pontuação por interesses em comum.
- Interface de sugestões de matches, pesquisa de utilizadores e mensagens diretas.
- Chat de grupo associado a eventos.
- Integração com backend PHP e base de dados MySQL.
- Mapa interativo de eventos com seleção de localização via Leaflet e geocodificação Nominatim.
- Documentação REST e diagramas UML no GitHub.

### Público-Alvo
- Jovens adultos (18–30 anos) que procuram novas amizades.
- Estudantes universitários que valorizam gostos culturais como música, jogos ou cinema.

### Stakeholders
- **Equipa de Desenvolvimento (Alunos):** responsáveis pela implementação.
- **Docentes:** supervisão e validação académica.
- **Utilizadores finais:** jovens interessados em conhecer pessoas através de interesses culturais.

### Requisitos de Alto Nível
- Linguagens: **HTML, CSS, JavaScript (Vanilla SPA), PHP**
- Servidor: **Apache via MAMP**
- Base de dados: **MySQL**
- Versionamento: **GitHub**
- Mockups: **Figma**
- Comunicação: **WhatsApp**

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | Vanilla JavaScript (SPA sem framework) |
| Backend | PHP 8.3 |
| Base de dados | MySQL |
| Servidor | Apache (MAMP) |
| Mapas | Leaflet.js + OpenStreetMap + Nominatim |
| Controlo de versões | Git / GitHub |

## Arquitetura

O projeto segue uma arquitetura **SPA (Single Page Application)** em JavaScript puro no frontend, comunicando com um backend PHP via fetch API.

- **Frontend:** todos os pedidos passam por `App.js`, que gere o estado global e o routing. Cada página (`Authpages.js`, `Homepage.js`, `Eventspage.js`, `Chatspage.js`, `Profilepage.js`, `Adminpage.js`) é responsável por renderizar o seu próprio HTML e tratar os eventos do utilizador.
- **Backend:** todos os pedidos chegam a `api/api.php`, que encaminha para o ficheiro de ação correspondente em `api/actions/` com base no parâmetro `action`.
- **Base de dados:** MySQL com as tabelas `usuario`, `interesse`, `subinteresse`, `usuario_interesse`, `pedido_conexao`, `post`, `evento`, `invite`, `group_post` e `user_report`.

## Requisitos Funcionais

- **Descoberta de Perfis:** o utilizador visualiza sugestões de outros utilizadores ordenadas por número de interesses em comum. Pode conectar, passar ou reportar.
- **Gestão de Conexões:** pedidos de ligação enviados e recebidos com estados pendente/aceite/recusado. Conexões mútuas dão acesso ao chat.
- **Chats Individuais:** mensagens diretas entre utilizadores com conexão aceite.
- **Chat de Grupo de Evento:** cada evento tem um chat de grupo acessível aos participantes confirmados.
- **Criação e Gestão de Eventos:** criação de eventos com título, descrição, local, data e localização geográfica. Convites, aceitação/recusa, cancelamento e eliminação de eventos.
- **Mapa de Eventos:** visualização dos eventos confirmados do utilizador num mapa interativo. Criação de eventos com seleção de localização por clique no mapa e geocodificação automática do nome do local via Nominatim.
- **Perfil do Utilizador:** perfil editável com nome, foto de perfil e interesses por categoria (Música, Jogos, Cinema & Séries).
- **Pesquisa de Utilizadores:** pesquisa livre por nome com envio de pedido de ligação diretamente a partir dos resultados.
- **Conta de Administrador:** painel com estatísticas globais, gestão de utilizadores (banir/desbanir, promover a admin) e resolução de reports.
- **Sistema de Reports:** qualquer utilizador pode reportar outro. O admin revê e resolve os reports no painel de administração.

## Requisitos Não Funcionais

- **Interface Intuitiva:** design simples e moderno em SPA, sem recarregamentos de página, com feedback visual via toasts e modais.
- **Segurança:** passwords com hash bcrypt, sessões PHP, validação de tipo de ficheiro no upload de fotos.
- **Routing via Apache:** `.htaccess` com `mod_rewrite` encaminha todas as rotas não-ficheiro para `index.html`, mantendo o comportamento de SPA.
- **Sem dependências de framework:** o frontend não utiliza React, Vue ou qualquer outro framework — apenas JavaScript vanilla, o que elimina etapas de build e simplifica o deployment.
