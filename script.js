let db;
try {
  const saved = localStorage.getItem('organizaweb_v4');
  db = saved ? JSON.parse(saved) : { users: [], currentUser: null };
  if (!db.users || !Array.isArray(db.users)) throw new Error();
} catch {
  db = { users: [], currentUser: null };
}

const DEFAULT_TEMPLATES = [
  `Olá {{nome}}! 👋\n\nPassando para lembrar da sua consulta agendada para *{{data}}* às *{{hora}}*.\n\nQualquer dúvida estamos à disposição! 😊`,
  `Olá {{nome}}! ✅\n\nSeu agendamento foi *confirmado* com sucesso!\n\n📅 Data: *{{data}}*\n⏰ Hora: *{{hora}}*\n🏥 Local: *{{local}}*\n\nAté lá! 😊`,
  `Olá {{nome}}! 🙏\n\nEsperamos que o seu atendimento tenha sido ótimo!\n\nFoi um prazer atendê-lo(a). Estamos sempre à disposição.\n\nAté a próxima! ⭐`
];

let currentTemplates = [...DEFAULT_TEMPLATES];
let currentTemplateIdx = 0;
let currentWaConsultaId = null;
let agendaFilter = 'todos';

function gid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function saveDB() { localStorage.setItem('organizaweb_v4', JSON.stringify(db)); }
function getUser() { return db.users.find(u => u.id === db.currentUser); }

// ==================== TOAST ====================
function showToast(msg, type='default') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };
  t.innerHTML = (icons[type]||icons.default) + `<span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ==================== AUTH ====================
function switchTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab==='login');
  document.getElementById('tab-signup').classList.toggle('active', tab==='signup');
  document.getElementById('form-login').classList.toggle('hidden', tab!=='login');
  document.getElementById('form-signup').classList.toggle('hidden', tab!=='signup');
  if (tab==='login') {
    document.getElementById('auth-card-title').textContent = 'Bem-vindo de volta';
    document.getElementById('auth-card-sub').textContent = 'Entre na sua conta para continuar';
  } else {
    document.getElementById('auth-card-title').textContent = 'Criar sua conta';
    document.getElementById('auth-card-sub').textContent = 'Preencha os dados abaixo para começar';
  }
}

function loginGoogle() {
  showToast('Login com Google em breve! 🚀','info');
}

function login() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass  = document.getElementById('login-password').value;
  if (!email||!pass) return showToast('Preencha o e-mail e a senha.','error');
  const user = db.users.find(u => u.email===email);
  if (!user) return showToast('E-mail não encontrado.','error');
  if (user.senha!==pass) return showToast('Senha incorreta.','error');
  db.currentUser = user.id; saveDB(); startApp();
}

function signUp() {
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const pass  = document.getElementById('signup-password').value;
  if (!name||!email||!pass) return showToast('Preencha todos os campos.','error');
  if (pass.length<6) return showToast('A senha deve ter ao menos 6 caracteres.','error');
  if (db.users.find(u=>u.email===email)) return showToast('Este e-mail já está cadastrado.','error');
  const u = { id:gid(), nome:name, email, senha:pass, contatos:[], consultas:[], pagamentos:[], templates:null, config:{} };
  db.users.push(u); db.currentUser=u.id; saveDB(); seedNewUser(u); startApp();
}

function logout() {
  db.currentUser=null; saveDB();
  document.getElementById('app-system').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

function seedNewUser(u) {
  const c1=gid(), c2=gid();
  u.contatos.push(
    {id:c1, nome:'João da Silva', telefone:'11999887766', email:'joao@email.com', obs:'Prefere atendimento pela manhã'},
    {id:c2, nome:'Maria Souza',   telefone:'11988776655', email:'maria@email.com', obs:''}
  );
  const today=new Date(); const h1=new Date(today); h1.setHours(10,0,0,0); const h2=new Date(today); h2.setHours(14,30,0,0);
  u.consultas.push(
    {id:gid(), clienteId:c1, data:h1.toISOString(), status:'CONFIRMADA', servico:'Consulta'},
    {id:gid(), clienteId:c2, data:h2.toISOString(), status:'CONCLUIDA',  servico:'Retorno'}
  );
  u.pagamentos.push({id:gid(), descricao:'Consulta Maria Souza', tipo:'receita', valor:150, data:new Date().toISOString()});
  saveDB();
}

function startApp() {
  const user = getUser(); if(!user) return logout();
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-system').classList.remove('hidden');
  const first = user.nome.split(' ')[0];
  const initials = user.nome.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('user-name-display').textContent = first;
  document.getElementById('dash-first-name').textContent = first;
  document.getElementById('config-avatar-display').textContent = initials;
  document.getElementById('config-nome').value = user.nome;
  document.getElementById('config-email').value = user.email;
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  currentTemplates = user.templates ? [...user.templates] : [...DEFAULT_TEMPLATES];
  initTemplates();
  showSection('dashboard', document.querySelector('.nav-item'));
}

window.onload = () => { if(db.currentUser) startApp(); };

// ==================== NAVIGATION ====================
function showSection(name, el) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const sec = document.getElementById(`section-${name}`);
  if(sec) sec.classList.add('active');
  if(el) el.classList.add('active');
  closeSidebar();
  const renders = {
    dashboard: renderDashboard,
    clientes: renderClientes,
    agenda: renderAgenda,
    financeiro: renderFinanceiro,
    relatorios: renderRelatorios,
    notificacoes: () => initTemplates(),
    configuracoes: () => {}
  };
  if(renders[name]) renders[name]();
}

function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-overlay').classList.add('active'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('active'); }

// ==================== MODALS ====================
function openModal(id) {
  document.getElementById(id).classList.add('open');
  if(id==='modal-agenda') populateClienteSelect();
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e => {
  if(e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ==================== DASHBOARD ====================
function renderDashboard() {
  const u=getUser(); if(!u) return;
  const today = new Date(); const todayStr = today.toDateString();
  const todayAppts = u.consultas.filter(c=>new Date(c.data).toDateString()===todayStr);
  const mes = today.getMonth();
  const mesConsultas = u.consultas.filter(c=>new Date(c.data).getMonth()===mes);
  const canceladas = mesConsultas.filter(c=>c.status==='CANCELADA').length;
  const taxa = mesConsultas.length ? Math.round(canceladas/mesConsultas.length*100) : 0;
  const fat = u.pagamentos.filter(p=>new Date(p.data).getMonth()===mes && p.tipo!=='despesa').reduce((s,p)=>s+parseFloat(p.valor),0);
  document.getElementById('stat-hoje').textContent = todayAppts.length;
  document.getElementById('stat-clientes').textContent = u.contatos.length;
  document.getElementById('stat-fat').textContent = `R$${fat.toFixed(0)}`;
  document.getElementById('stat-faltas').textContent = taxa+'%';

  const sorted = [...todayAppts].sort((a,b)=>new Date(a.data)-new Date(b.data));
  const cont = document.getElementById('today-appts');
  if(sorted.length===0) {
    cont.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📅</span><div class="empty-state-title">Nenhuma consulta hoje</div><div class="empty-state-sub">Que tal agendar novos atendimentos?</div></div>`;
  } else {
    cont.innerHTML = sorted.map(c=>{
      const cli = u.contatos.find(p=>p.id===c.clienteId);
      const hora = new Date(c.data).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      const sc = c.status==='CONFIRMADA'?'badge-confirmada':c.status==='CONCLUIDA'?'badge-concluida':'badge-cancelada';
      const init = cli ? cli.nome.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase() : '?';
      return `<div class="appt-item">
        <div class="appt-time">${hora}</div>
        <div class="avatar">${init}</div>
        <div class="appt-info">
          <div class="appt-name">${cli?cli.nome:'Desconhecido'}</div>
          <div class="appt-type">${c.servico||'Consulta'}</div>
        </div>
        <span class="badge ${sc}">${c.status}</span>
        <div class="appt-actions">
          <button class="btn btn-secondary btn-sm btn-icon" title="WhatsApp" onclick="openWhatsappModal('${c.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </button>
        </div>
      </div>`;
    }).join('');
  }

  const future = u.consultas.filter(c=>new Date(c.data)>today && c.status==='CONFIRMADA').sort((a,b)=>new Date(a.data)-new Date(b.data));
  if(future.length) {
    const n=future[0], nc=u.contatos.find(p=>p.id===n.clienteId);
    document.getElementById('next-appt-time').textContent = new Date(n.data).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    document.getElementById('next-appt-name').textContent = nc?nc.nome:'Desconhecido';
  } else {
    document.getElementById('next-appt-time').textContent = '—';
    document.getElementById('next-appt-name').textContent = 'Sem próximos compromissos';
  }
}

// ==================== CLIENTES ====================
function renderClientes(filter='') {
  const u=getUser(); if(!u) return;
  const tbody=document.getElementById('tbody-clientes');
  let list = filter ? u.contatos.filter(c=>c.nome.toLowerCase().includes(filter.toLowerCase())||c.telefone?.includes(filter)) : u.contatos;
  document.getElementById('clientes-count').textContent = `${list.length} cliente${list.length!==1?'s':''}`;
  if(!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty"><span class="table-empty-icon">👥</span><div class="table-empty-text">Nenhum cliente cadastrado ainda.<br>Clique em "Novo Cliente" para começar.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(c=>{
    const init = c.nome.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    return `<tr>
      <td><div class="client-name-cell"><div class="avatar">${init}</div><div><div class="td-main">${c.nome}</div><div style="font-size:0.75rem;color:var(--text-4)">${c.email||''}</div></div></div></td>
      <td>${c.telefone||'—'}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.obs||'—'}</td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="openWhatsappClientModal('${c.id}')">WhatsApp</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCliente('${c.id}')">Excluir</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterClientes() { renderClientes(document.getElementById('search-clients').value); }

function salvarCliente() {
  const u=getUser(); if(!u) return;
  const nome=document.getElementById('inp-cli-nome').value.trim();
  const tel=document.getElementById('inp-cli-tel').value.trim();
  const email=document.getElementById('inp-cli-email').value.trim();
  const obs=document.getElementById('inp-cli-obs').value.trim();
  if(!nome) return showToast('Informe o nome do cliente.','error');
  u.contatos.push({id:gid(), nome, telefone:tel, email, obs});
  saveDB(); closeModal('modal-cliente'); renderClientes();
  document.getElementById('inp-cli-nome').value='';
  document.getElementById('inp-cli-tel').value='';
  document.getElementById('inp-cli-email').value='';
  document.getElementById('inp-cli-obs').value='';
  showToast(`${nome} adicionado com sucesso!`,'success');
}

function deleteCliente(id) {
  const u=getUser(); if(!u) return;
  const c=u.contatos.find(p=>p.id===id); if(!c) return;
  if(!confirm(`Excluir "${c.nome}"?`)) return;
  u.contatos=u.contatos.filter(p=>p.id!==id); saveDB(); renderClientes();
  showToast('Cliente excluído.','default');
}

// ==================== AGENDA ====================
function populateClienteSelect() {
  const u=getUser(); if(!u) return;
  const sel=document.getElementById('inp-cons-cliente');
  sel.innerHTML='<option value="">Selecione o cliente...</option>';
  u.contatos.forEach(c=>{sel.innerHTML+=`<option value="${c.id}">${c.nome}</option>`;});
}

function filterAgenda(status, el) {
  agendaFilter=status;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  if(el) el.classList.add('active');
  renderAgenda();
}

function renderAgenda() {
  const u=getUser(); if(!u) return;
  const tbody=document.getElementById('tbody-agenda');
  let list = [...u.consultas].sort((a,b)=>new Date(a.data)-new Date(b.data));
  if(agendaFilter!=='todos') list=list.filter(c=>c.status===agendaFilter);
  document.getElementById('agenda-count').textContent = `${list.length} compromisso${list.length!==1?'s':''}`;
  if(!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty"><span class="table-empty-icon">📅</span><div class="table-empty-text">Nenhum compromisso encontrado.</div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(c=>{
    const cli=u.contatos.find(p=>p.id===c.clienteId);
    const dt=new Date(c.data);
    const dtStr=dt.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const sc=c.status==='CONFIRMADA'?'badge-confirmada':c.status==='CONCLUIDA'?'badge-concluida':'badge-cancelada';
    const init=cli?cli.nome.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase():'?';
    return `<tr>
      <td class="td-main">${dtStr}</td>
      <td><div class="client-name-cell"><div class="avatar" style="width:28px;height:28px;font-size:0.7rem">${init}</div>${cli?cli.nome:'Desconhecido'}</div></td>
      <td><span class="badge ${sc}">${c.status}</span></td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="openWhatsappModal('${c.id}')">💬</button>
          ${c.status!=='CONCLUIDA'?`<button class="btn btn-success btn-sm" onclick="changeStatus('${c.id}','CONCLUIDA')">Concluir</button>`:''}
          ${c.status!=='CANCELADA'?`<button class="btn btn-danger btn-sm" onclick="changeStatus('${c.id}','CANCELADA')">Cancelar</button>`:''}
          <button class="btn btn-ghost btn-sm" onclick="deleteConsulta('${c.id}')">✕</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function salvarConsulta() {
  const u=getUser(); if(!u) return;
  const clienteId=document.getElementById('inp-cons-cliente').value;
  const data=document.getElementById('inp-cons-data').value;
  const servico=document.getElementById('inp-cons-servico').value.trim();
  if(!clienteId||!data) return showToast('Selecione o cliente e a data.','error');
  u.consultas.push({id:gid(), clienteId, data:new Date(data).toISOString(), status:'CONFIRMADA', servico:servico||'Consulta'});
  saveDB(); closeModal('modal-agenda'); renderAgenda(); renderDashboard();
  document.getElementById('inp-cons-servico').value='';
  showToast('Consulta agendada com sucesso!','success');
}

function deleteConsulta(id) {
  const u=getUser(); if(!u) return;
  if(!confirm('Excluir este compromisso?')) return;
  u.consultas=u.consultas.filter(c=>c.id!==id); saveDB(); renderAgenda();
  showToast('Compromisso excluído.','default');
}

function changeStatus(id, s) {
  const u=getUser(); if(!u) return;
  const c=u.consultas.find(x=>x.id===id); if(!c) return;
  c.status=s; saveDB(); renderAgenda();
  showToast(s==='CONCLUIDA'?'Consulta concluída! ✓':'Consulta cancelada.', s==='CONCLUIDA'?'success':'default');
}

// ==================== FINANCEIRO ====================
function renderFinanceiro() {
  const u=getUser(); if(!u) return;
  const mes=new Date().getMonth();
  const mesPag=u.pagamentos.filter(p=>new Date(p.data).getMonth()===mes);
  const receita=mesPag.filter(p=>p.tipo!=='despesa').reduce((s,p)=>s+parseFloat(p.valor),0);
  const count=u.pagamentos.length;
  const ticket=count?receita/mesPag.filter(p=>p.tipo!=='despesa').length:0;
  document.getElementById('fin-receita').textContent=`R$ ${receita.toFixed(2)}`;
  document.getElementById('fin-count').textContent=count;
  document.getElementById('fin-ticket').textContent=ticket?`R$ ${ticket.toFixed(2)}`:'R$ 0,00';

  const tbody=document.getElementById('tbody-financeiro');
  if(!u.pagamentos.length) {
    tbody.innerHTML=`<tr><td colspan="5" class="table-empty"><span class="table-empty-icon">💰</span><div class="table-empty-text">Nenhuma transação registrada ainda.</div></td></tr>`;
    return;
  }
  const sorted=[...u.pagamentos].sort((a,b)=>new Date(b.data)-new Date(a.data));
  tbody.innerHTML=sorted.map(p=>`<tr>
    <td style="color:var(--text-3)">${new Date(p.data).toLocaleDateString('pt-BR')}</td>
    <td class="td-main">${p.descricao||'—'}</td>
    <td><span class="fin-tag ${p.tipo==='despesa'?'fin-tag-despesa':'fin-tag-receita'}">${p.tipo==='despesa'?'Despesa':'Receita'}</span></td>
    <td style="font-weight:700;color:${p.tipo==='despesa'?'var(--danger)':'var(--success)'}">
      ${p.tipo==='despesa'?'-':'+'} R$ ${parseFloat(p.valor).toFixed(2)}
    </td>
    <td><button class="btn btn-danger btn-sm" onclick="deletePagamento('${p.id}')">Excluir</button></td>
  </tr>`).join('');
}

function salvarPagamento() {
  const u=getUser(); if(!u) return;
  const desc=document.getElementById('inp-pag-desc').value.trim();
  const tipo=document.getElementById('inp-pag-tipo').value;
  const valor=document.getElementById('inp-pag-valor').value;
  if(!valor) return showToast('Informe o valor.','error');
  u.pagamentos.push({id:gid(), descricao:desc||'Serviço', tipo, valor:parseFloat(valor), data:new Date().toISOString()});
  saveDB(); closeModal('modal-pagamento');
  document.getElementById('inp-pag-valor').value='';
  document.getElementById('inp-pag-desc').value='';
  renderFinanceiro();
  showToast(`R$ ${parseFloat(valor).toFixed(2)} registrado!`,'success');
}

function deletePagamento(id) {
  const u=getUser(); if(!u) return;
  if(!confirm('Excluir este registro?')) return;
  u.pagamentos=u.pagamentos.filter(p=>p.id!==id); saveDB(); renderFinanceiro();
  showToast('Registro excluído.','default');
}

// ==================== RELATÓRIOS ====================
function renderRelatorios() {
  const u=getUser(); if(!u) return;
  const mes=new Date().getMonth();
  const mc=u.consultas.filter(c=>new Date(c.data).getMonth()===mes);
  const concluidas=mc.filter(c=>c.status==='CONCLUIDA').length;
  const canceladas=mc.filter(c=>c.status==='CANCELADA').length;
  const fat=u.pagamentos.filter(p=>new Date(p.data).getMonth()===mes&&p.tipo!=='despesa').reduce((s,p)=>s+parseFloat(p.valor),0);
  document.getElementById('rel-concluidas').textContent=concluidas;
  document.getElementById('rel-faltas').textContent=canceladas;
  document.getElementById('rel-faturamento').textContent=`R$ ${fat.toFixed(0)}`;

  const total=mc.length||1;
  const data=[
    {label:'Confirmadas',val:mc.filter(c=>c.status==='CONFIRMADA').length,color:'#7c3aed'},
    {label:'Concluídas',val:concluidas,color:'#10b981'},
    {label:'Canceladas',val:canceladas,color:'#ef4444'},
  ];
  const chart=document.getElementById('rel-chart');
  chart.innerHTML=data.map(d=>`<div style="flex:1;min-width:120px">
    <div style="font-size:0.78rem;font-weight:600;color:var(--text-3);margin-bottom:8px">${d.label}</div>
    <div style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--text);margin-bottom:8px">${d.val}</div>
    <div style="height:6px;background:var(--border);border-radius:99px;overflow:hidden">
      <div style="height:100%;width:${Math.round(d.val/total*100)}%;background:${d.color};border-radius:99px;transition:width 0.5s ease"></div>
    </div>
    <div style="font-size:0.75rem;color:var(--text-4);margin-top:4px">${Math.round(d.val/total*100)}%</div>
  </div>`).join('');
}

// ==================== NOTIFICAÇÕES ====================
function initTemplates() {
  updateTplPreviewAll();
  selectTemplate(0, document.querySelector('.template-item'));
}

function updateTplPreviewAll() {
  currentTemplates.forEach((t,i)=>{
    const el=document.getElementById(`tpl-preview-${i}`);
    if(el) el.textContent=t.substring(0,60)+'...';
  });
}

function selectTemplate(idx, el) {
  currentTemplateIdx=idx;
  document.querySelectorAll('.template-item').forEach(i=>i.classList.remove('selected'));
  if(el) el.classList.add('selected');
  const titles=['✏️ Editando: Lembrete de Consulta','✏️ Editando: Confirmação de Agendamento','✏️ Editando: Pós-Atendimento'];
  document.getElementById('tpl-editor-title').textContent=titles[idx]||'✏️ Editando template';
  document.getElementById('tpl-editor').value=currentTemplates[idx]||'';
  updateTplPreview();
}

function updateTplPreview() {
  const val=document.getElementById('tpl-editor').value;
  currentTemplates[currentTemplateIdx]=val;
  const preview=renderTemplate(val,{nome:'João Silva',data:'15/05/2025',hora:'10:00',profissional:'Dra. Ana',local:'Clínica OrganizaWeb',servico:'Consulta'});
  document.getElementById('tpl-preview-whatsapp').textContent=preview;
  const el=document.getElementById(`tpl-preview-${currentTemplateIdx}`);
  if(el) el.textContent=val.substring(0,60)+'...';
}

function renderTemplate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_,k)=>vars[k]||`{{${k}}}`);
}

function insertVar(v) {
  const ta=document.getElementById('tpl-editor');
  const s=ta.selectionStart, e=ta.selectionEnd;
  ta.value=ta.value.substring(0,s)+v+ta.value.substring(e);
  ta.selectionStart=ta.selectionEnd=s+v.length; ta.focus();
  updateTplPreview();
}

function saveTemplates() {
  const u=getUser(); if(!u) return;
  u.templates=[...currentTemplates]; saveDB();
  showToast('Templates salvos com sucesso!','success');
}

// ==================== WHATSAPP ====================
function openWhatsappModal(consultaId) {
  currentWaConsultaId=consultaId;
  updateWaPreview();
  openModal('modal-whatsapp');
}

function openWhatsappClientModal(clienteId) {
  const u=getUser(); if(!u) return;
  const c=u.contatos.find(p=>p.id===clienteId);
  if(!c) return;
  const msg=`Olá ${c.nome}! 👋 Entrando em contato da nossa parte. Como posso ajudá-lo(a)?`;
  const tel=c.telefone?.replace(/\D/g,'')||'';
  if(!tel) return showToast('Cliente sem telefone cadastrado.','error');
  const t=tel.startsWith('55')?tel:`55${tel}`;
  window.open(`https://wa.me/${t}?text=${encodeURIComponent(msg)}`,'_blank');
}

function updateWaPreview() {
  const u=getUser(); if(!u) return;
  const idx=parseInt(document.getElementById('modal-wa-template')?.value||'0');
  if(!currentWaConsultaId){
    document.getElementById('modal-wa-preview').textContent='Selecione uma consulta para personalizar a mensagem.';
    return;
  }
  const cons=u.consultas.find(c=>c.id===currentWaConsultaId); if(!cons) return;
  const cli=u.contatos.find(p=>p.id===cons.clienteId); if(!cli) return;
  const dt=new Date(cons.data);
  const msg=renderTemplate(currentTemplates[idx]||'', {
    nome:cli.nome,
    data:dt.toLocaleDateString('pt-BR'),
    hora:dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
    profissional:'Você',
    local:'Nossa Clínica',
    servico:cons.servico||'Consulta'
  });
  document.getElementById('modal-wa-preview').textContent=msg;
}

function sendWaFromModal() {
  const u=getUser(); if(!u||!currentWaConsultaId) return;
  const cons=u.consultas.find(c=>c.id===currentWaConsultaId); if(!cons) return;
  const cli=u.contatos.find(p=>p.id===cons.clienteId); if(!cli) return showToast('Cliente não encontrado.','error');
  const idx=parseInt(document.getElementById('modal-wa-template').value||'0');
  const dt=new Date(cons.data);
  const msg=renderTemplate(currentTemplates[idx]||'', {
    nome:cli.nome,
    data:dt.toLocaleDateString('pt-BR'),
    hora:dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
    profissional:'Você',
    local:'Nossa Clínica',
    servico:cons.servico||'Consulta'
  });
  const tel=cli.telefone?.replace(/\D/g,'')||'';
  if(!tel) return showToast('Cliente sem telefone.','error');
  const t=tel.startsWith('55')?tel:`55${tel}`;
  window.open(`https://wa.me/${t}?text=${encodeURIComponent(msg)}`,'_blank');
  closeModal('modal-whatsapp');
}

// ==================== CONFIGURAÇÕES ====================
function switchConfig(name, el) {
  document.querySelectorAll('.config-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.config-panel').forEach(p=>p.classList.remove('active'));
  if(el) el.classList.add('active');
  document.getElementById(`config-${name}`)?.classList.add('active');
}

function saveConfig() {
  const u=getUser(); if(!u) return;
  const nome=document.getElementById('config-nome').value.trim();
  if(!nome) return showToast('Informe o nome.','error');
  u.nome=nome; u.email=document.getElementById('config-email').value.trim();
  u.config={especialidade:document.getElementById('config-espec').value, tel:document.getElementById('config-tel').value};
  saveDB();
  const first=nome.split(' ')[0];
  const initials=nome.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('user-name-display').textContent=first;
  document.getElementById('user-avatar').textContent=initials;
  document.getElementById('config-avatar-display').textContent=initials;
  showToast('Perfil atualizado com sucesso!','success');
}
