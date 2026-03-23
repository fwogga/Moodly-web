

const ChatsPage = {

  chats() {
    const activeChat = Model.getActiveChat();
    const messages   = Model.getMessagesForChat(activeChat.id);

    // Esta página tem layout próprio (chats-layout), por isso
    // constrói o HTML diretamente sem usar Components.shell()
    return `
      ${Components.sidebar('chats')}
      <div class="main-area">
        <div class="chats-layout">

          <!-- Coluna esquerda: lista de conversas -->
          <div class="chat-list-col">
            <div class="chat-list-header">
              <h2>Mensagens</h2>
              <div class="chat-search-wrap">
                ${Icons.search}
                <input class="form-input" type="text" placeholder="Pesquisar..."
                       oninput="Controller.filterChats(this.value)"/>
              </div>
            </div>
            <div class="chat-list-scroll" id="chat-list">
              ${Model.chats.map(c =>
                Components.chatItem(c, c.id === activeChat.id)
              ).join('')}
            </div>
          </div>

          <!-- Coluna direita: chatroom ativo -->
          <div class="chatroom-col">
            <div class="chatroom-header">
              ${Components.avatar(activeChat.name, 44)}
              <div class="chatroom-header-info">
                <div class="chatroom-header-name">${activeChat.name}</div>
                <div class="chatroom-header-status">
                  ${activeChat.online ? '● Online agora' : 'Offline'}
                </div>
              </div>
            </div>

            <div class="chatroom-messages" id="msg-list">
              ${messages.map(msg => `
                <div class="msg-row ${msg.from}">
                  <div class="msg-bubble">${msg.text}</div>
                  <div class="msg-time">${msg.time}</div>
                </div>
              `).join('')}
            </div>

            <div class="chatroom-bar">
              <textarea class="chatroom-input" id="msg-input"
                        placeholder="Escreve uma mensagem..." rows="1"
                        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Controller.sendMessage();}"
                        oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px'">
              </textarea>
              <button class="send-btn" onclick="Controller.sendMessage()">
                ${Icons.send}
              </button>
            </div>
          </div>

        </div>
      </div>`;
  },
};
