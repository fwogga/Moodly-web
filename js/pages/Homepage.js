const HomePage = {

render() {
if (!App.state.discoverLoaded) {
App.state.discoverLoaded = true;
HomePage.load();
return Components.shell(`
<div class="page-header"><div><h1>Descobrir</h1></div></div>
<p style="color:var(--dim);">A carregar...</p>
`, 'home');
}

const users = App.state.discoverUsers;
const user  = users[App.state.discoverIndex] || null;

if (!user) {
return Components.shell(`
<div class="page-header"><div><h1>Descobrir</h1></div></div>
<div class="empty">
<h3>Sem sugestões</h3>
<p>Isso nao é suposto acontecer...?.</p>
</div>
`, 'home');
}

const photo = user.usuar_foto_perfil || '';
const inits = (user.usuar_nome || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();

return Components.shell(`
<div class="page-header"><div><h1>Descobrir</h1></div></div>

<div class="discover-wrap">

<div class="discover-card">
<div class="discover-photo">
  <div class="discover-photo-avatar">
    ${photo ? `<img src="${photo}"/>` : inits}
  </div>
  <div class="discover-name">${user.usuar_nome}</div>
  <div class="discover-score">${user.score || 0} interesses em comum</div>
</div>
<div class="discover-info">
  ${Components.interestCategories(user.interests || [])}
</div>
</div>


<div class="discover-btns">
<span class="discover-action connect"
      onclick="HomePage.connect(${user.usuar_id}, '${user.usuar_nome.replace(/'/g,"\\'")}')">
  Conectar
</span>
<span class="discover-action pass" onclick="HomePage.pass()">
  Passar
</span>
</div>

</div>
`, 'home');
},

  async load() {
    const res = await App.api('discover', {}, 'GET');
    if (res.ok) {
      App.state.discoverUsers = res.data;
      App.state.discoverIndex = 0;
    }
    App.render();
  },

  pass() {
    App.state.discoverIndex++;
    App.render();
  },

  async connect(userId, name) {
    const res = await App.api('send_request', { targetId: userId });
    if (res.ok) Components.toast(`Pedido enviado a ${name}!`, 'success');
    else        Components.toast(res.error, 'error');
    App.state.discoverIndex++;
    App.render();
  },
};