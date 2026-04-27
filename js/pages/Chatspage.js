const ChatsPage = {

  render() {
    if (!App.state.chatsLoaded) {
      App.state.chatsLoaded = true;
      ChatsPage.loadChats();
    }

    const isEventChat = !!App.state.activeEventId;
    const messages    = isEventChat ? App.state.eventMessages : App.state.messages;
    const chatName    = App.state.activeChatName || '';
    const myId        = String(App.state.user?.userId);
    const eventChats = (App.state.events || []).filter(e =>
      e.invite_estado === 'confirmado' && e.evento_estado !== 'cancelado'
    );

    return `
      ${Components.sidebar('chats')}
      <div style="flex:1;display:flex;overflow:hidden;height:100vh;">

        <!--list -->
        <div style="width:260px;min-width:260px;background:var(--panel);border-right:1px solid var(--border);display:flex;flex-direction:column;height:100vh;overflow:hidden;">
          <div style="padding:20px 20px 12px;border-bottom:1px solid var(--border);flex-shrink:0;">
            <h1>Mensagens</h1>
          </div>
          <div style="flex:1;overflow-y:auto;" id="chat-list">

            ${App.state.chats.map(c => `
              <div class="chat-item ${!isEventChat && App.state.activeChatId == c.connection_id ? 'active' : ''}"
                   onclick="ChatsPage.openChat(${c.connection_id}, '${c.usuar_nome.replace(/'/g,"\\'")}')">
                ${Components.avatar(c.usuar_nome, 34, c.usuar_foto_perfil || '')}
                <div style="flex:1;min-width:0;">
                  <div class="chat-item-name">${c.usuar_nome}</div>
                  <div class="chat-item-preview">${c.last_message || 'Sem mensagens'}</div>
                </div>
              </div>
            `).join('')}
            ${eventChats.map(e => `
              <div class="chat-item ${isEventChat && App.state.activeEventId == e.evento_id ? 'active' : ''}"
                   onclick="ChatsPage.openEventChat(${e.evento_id}, '${e.evento_titulo.replace(/'/g,"\\'")}')">
                ${Components.avatar(e.evento_titulo, 34)}
                <div style="flex:1;min-width:0;">
                  <div class="chat-item-name">${e.evento_titulo}</div>
                </div>
              </div>
            `).join('')}
            ${!App.state.chats.length && !eventChats.length
              ? `<div style="padding:16px;color:var(--dim);font-size:0.82rem;">Sem conversas ainda.<br>Conecta-te a alguém primeiro.</div>`
              : ''}
          </div>
        </div>

        <!--chatroom -->
        <div style="flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden;background:var(--bg);">

          ${chatName ? `
            <div style="padding:12px 18px;border-bottom:1px solid var(--border);background:var(--panel);display:flex;align-items:center;gap:10px;flex-shrink:0;">
              ${Components.avatar(chatName, 34)}
              <span style="font-weight:700;font-size:0.9rem;">${chatName}</span>
            </div>
          ` : `
            <div style="padding:12px 18px;border-bottom:1px solid var(--border);background:var(--panel);height:59px;flex-shrink:0;"></div>
          `}

          <div style="flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:8px;" id="msg-list">
            ${messages.map(m => {
              const senderId = isEventChat ? String(m.gp_usuar_id) : String(m.post_usuar_id);
              const isMe     = senderId === myId;
              const text     = isEventChat ? m.gp_conteudo   : m.post_conteudo;
              const time     = isEventChat ? m.gp_data_envio : m.post_data_envio;
              return `
                <div class="msg-row ${isMe ? 'me' : 'them'}">
                  ${!isMe ? `<div class="msg-sender">${m.usuar_nome || ''}</div>` : ''}
                  <div class="msg-bubble">${text}</div>
                  <div class="msg-time">${(time || '').slice(11,16)}</div>
                </div>`;
            }).join('')}
            ${!chatName
              ? `<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:0.86rem;padding-top:60px;">Seleciona uma conversa</div>`
              : ''}
            ${chatName && !messages.length
              ? `<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:0.86rem;padding-top:60px;">Sem mensagens ainda</div>`
              : ''}
          </div>

          <div style="padding:10px 18px;border-top:1px solid var(--border);background:var(--panel);display:flex;gap:8px;align-items:center;flex-shrink:0;">
            <textarea class="chat-input" id="msg-input" rows="1"
                      placeholder="${chatName ? 'Escreve uma mensagem...' : ''}"
                      ${!chatName ? 'disabled' : ''}
                      onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();ChatsPage.send();}"
                      oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,80)+'px'">
            </textarea>
            <button class="send-btn" onclick="ChatsPage.send()" ${!chatName ? 'disabled style="opacity:0.3;"' : ''} style="border-radius:4px;width:auto;padding:0 10px;font-size:0.8rem;">Enviar</button>
          </div>

        </div>
      </div>`;
  },

  async loadChats() {
    const res = await App.api('get_chats', {}, 'GET');
    if (res.ok) App.state.chats = res.data;
    if (!App.state.eventsLoaded) {
      const res2 = await App.api('get_events', {}, 'GET');
      if (res2.ok) { App.state.events = res2.data; App.state.eventsLoaded = true; }
    }
    // Pre-load messages if a chat was already selected (e.g. navigating from events page)
    if (App.state.activeEventId && !App.state.eventMessages.length) {
      const res3 = await App.api('get_event_messages', { eventId: App.state.activeEventId }, 'GET');
      if (res3.ok) App.state.eventMessages = res3.data;
    } else if (App.state.activeChatId && !App.state.messages.length) {
      const res3 = await App.api('get_messages', { connectionId: App.state.activeChatId }, 'GET');
      if (res3.ok) App.state.messages = res3.data;
    }
    App.render();
    setTimeout(() => {
      const el = document.getElementById('msg-list');
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  },

  async openChat(connectionId, name) {
    App.state.activeChatId   = connectionId;
    App.state.activeChatName = name;
    App.state.activeEventId  = null;
    App.state.messages       = [];
    App.render();
    const res = await App.api('get_messages', { connectionId }, 'GET');
    if (res.ok) App.state.messages = res.data;
    App.render();
    setTimeout(() => {
      const el = document.getElementById('msg-list');
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  },

  async openEventChat(eventId, title) {
    App.state.activeEventId  = eventId;
    App.state.activeChatName = title;
    App.state.activeChatId   = null;
    App.state.eventMessages  = [];
    App.state.chatsLoaded    = false;
    App.navigate('chats');
  },

  async loadEventMessages(eventId) {
    App.state.chatsLoaded = true;
    await ChatsPage.openEventChat(eventId, App.state.activeChatName || '');
  },

  async send() {
    const input = document.getElementById('msg-input');
    const text  = input?.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';

    if (App.state.activeEventId) {
      const res = await App.api('send_event_message', { eventId: App.state.activeEventId, message: text });
      if (!res.ok) { Components.toast(res.error, 'error'); return; }
      const res2 = await App.api('get_event_messages', { eventId: App.state.activeEventId }, 'GET');
      if (res2.ok) App.state.eventMessages = res2.data;
    } else {
      const res = await App.api('send_message', { connectionId: App.state.activeChatId, message: text });
      if (!res.ok) { Components.toast(res.error, 'error'); return; }
      const res2 = await App.api('get_messages', { connectionId: App.state.activeChatId }, 'GET');
      if (res2.ok) App.state.messages = res2.data;
      const chat = App.state.chats.find(c => c.connection_id == App.state.activeChatId);
      if (chat) chat.last_message = text;
    }

    App.render();
    setTimeout(() => {
      const el = document.getElementById('msg-list');
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  },

  filter(query) {
    const listEl = document.getElementById('chat-list');
    if (!listEl) return;
    const q = query.toLowerCase();
    listEl.innerHTML = App.state.chats
      .filter(c => c.usuar_nome.toLowerCase().includes(q))
      .map(c => `
        <div class="chat-item ${App.state.activeChatId == c.connection_id ? 'active' : ''}"
             onclick="ChatsPage.openChat(${c.connection_id}, '${c.usuar_nome.replace(/'/g,"\\'")}')">
          ${Components.avatar(c.usuar_nome, 34, c.usuar_foto_perfil || '')}
          <div style="flex:1;min-width:0;">
            <div class="chat-item-name">${c.usuar_nome}</div>
            <div class="chat-item-preview">${c.last_message || ''}</div>
          </div>
        </div>
      `).join('');
  },
};