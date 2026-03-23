

const EventsPage = {

  events() {
    return Components.shell(`
      <div class="page-header anim">
        <div class="page-header-left">
          <h1>oosodsaods</h1>
          <p>Participa em eventos com pessoas como tu</p>
        </div>
        <button class="btn btn-primary" onclick="Controller.createEvent()">
          ${Icons.plus} Criar evento
        </button>
      </div>

      <div class="events-grid">
        ${Model.events.map((event, i) => `
          <div class="event-card anim d${(i % 4) + 1}">
            <div class="event-banner"
                 style="background:linear-gradient(135deg,${event.color} 0%,#12001F 100%);">
              <span class="event-date-chip">${event.date}</span>
              <span class="event-title">${event.title}</span>
            </div>
            <div class="event-body">
              <div class="event-meta">${Icons.pin}<span>${event.location}</span></div>
              <div class="event-meta">${Icons.star}<span class="badge badge-accent">${event.cat}</span></div>
              <div class="event-footer">
                ${event.joined
                  ? `<button class="btn btn-sm btn-danger"
                             onclick="Controller.leaveEvent(${event.id})">Sair do evento</button>`
                  : `<button class="btn btn-sm btn-primary"
                             onclick="Controller.joinEvent(${event.id})">Participar</button>`}
                <button class="btn btn-sm btn-outline"
                        onclick="Controller.openEventChat()">Chat</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`, 'events');
  },
};
