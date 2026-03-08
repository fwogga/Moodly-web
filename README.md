# Moodly  
## Autores
- Deuwer Rabelais (20241521)
- Isimar Quixito (20242038)
- Miguel Almeida (20240206)
- Vivandro Kambanza (20241805)

Moodly será uma expansão do nosso projeto do semestre anterior com o mesmo nome. Será um website criado para ajudar calouros universitários a integrarem-se mais facilmente na vida académica. A ideia surge da facto de que muitos estudantes do primeiro ano têm dificuldade em encontrar novos amigos e criar amizades até mesmo dentro do seu curso. O website funciona de forma semelhante a serviços como tinder, ou o Bumble, que popularizaram o conceito de “swipe” mas em vez de procurar relações românticas, o objetivo é encontrar pessoas com interesses em comum, como música, filmes ou jogos.

## Objetivos do Projeto
-	Criar um website funcional que promova conexões sociais autênticas
-	Implementar um sistema de matching baseado em interesses
-	Desenvolver um backend pensado nas novas funcionalidades
-	Fazer o design e desenvolver um website que cumpra as melhores práticas de UI
-	Criação da conta de administrador para gestão de usuarios e vizualização de estatíticas
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
- Fase 5 – Testes e Validação  - 24 de Abril
- Fase 6 – Entrega e Apresentação - Dia da Ultima apresentação

## Project Charter

A **Moodly** diferencia-se por colocar em primeiro plano os **interesses culturais dos utilizadores**, permitindo que novas amizades ou relações surjam de forma natural através da partilha de música, livros ou jogos preferidos.  

Objetivos
- Criar um website que sugere matches entre utilizadores com base nos seus gostos.  
- Implementar um sistema de perfis de utilizador, com interesses armazenados em base de dados relacional.  
- Desenvolver um backend em **Node.js** para gerir os dados dos utilizadores e matches.  
- Criar mockups e interfaces no **Figma** com foco nas boas práticas de UI.  
- implementar a conta de administrador e as suas respectivas funções-
- implementar pesquisa de usuarios
- implementar mapa de eventos

Escopo
**Incluído no projeto:**  
- Criação de perfis de utilizador.  
- Sistema de preferências culturais (música, literatura, jogos).  
- Algoritmo de matching baseado em interesses.  
- Interface de sugestões de matches e mensagens básicas.  
- Integração com backend Node.js e base de dados.  
- Mockups em Figma e documentação no GitHub.  

Público-Alvo
- Jovens adultos (18–30 anos) que procuram **novas amizades ou relações**.  
- Estudantes universitários e utilizadores que valorizam **gostos culturais** como música, livros ou jogos.  

Stakeholders
- **Equipa de Desenvolvimento (Alunos):** responsáveis pela implementação.  
- **Docentes:** supervisão e validação académica.  
- **Utilizadores finais:** jovens interessados em conhecer pessoas através de interesses culturais.  

Requisitos de Alto Nível
- Linguagens: **React (Frontend), Node.js (Backend)**.  
- Frameworks: **Spring Boot, Jetpack Compose**.  
- BD: **PostgreSQL/MySQL**.  
- Versionamento: **GitHub**.  
- Mockups: **Figma**.   
- Comunicação: **WhatsApp**.  


## Requisitos Funcionais

Estes requisitos descrevem as funcionalidades que a aplicação deve obrigatoriamente oferecer:  

- **Swipe de Perfis**: o utilizador deve poder visualizar perfis de outros estudantes e indicar interesse em conectar-se ou não.  
- **Gestão de Conexões (Matches)**: sempre que dois utilizadores mostrem interesse mútuo, deve ser criada uma conexão visível na aba de Conexões.  
- **Chats Individuais**: o website permitirá iniciar conversas privadas com base nas conexões estabelecidas.  
- **Group Chats**: deve ser possível criar conversas em grupo, associadas a hangouts.  
- **Criação e Participação em Hangouts**: os utilizadores devem poder criar eventos com data, hora e local, convidar conexões, e gerir confirmações. Os participantes confirmados entram automaticamente num chat de grupo do evento.  
- **Perfil do Utilizador**: cada utilizador deve ter um perfil editável, incluindo nome, curso, interesses (música, filmes, jogos),e foto
- **Pesquisa de Usuario**: cada utilizador deve conseguir pesquisar livremente por um usuario e mandar uma request
- **Conta de Administrador**: uma conta que irá permitir a gestão de usuarios e estatisticas.
- **Mapa de Eventos**: cada usuario poderá ver os evenbtos da qual ele participa por meio de um mapa.

## Requisitos não funcionais
Estes requisitos garantem a qualidade, segurança e usabilidade da aplicação:  

- **Definições**: o website deve ter algumas definições de perfil basicas 
- **Interface Intuitiva e Amigável**: o design vai ser simples, moderno e adaptado ao público, facilitando a navegação.  
- **Qualidade de Vida (QoL Features)**: funcionalidades pequenas, mas importantes, opção de silenciar chats,e bloquear usuarios.
  
