// ==========================================
// 1. BANCO DE DADOS SEGURO
// ==========================================
let db;

try {
    const savedDb = localStorage.getItem('dental_saas_db_v2');
    db = savedDb ? JSON.parse(savedDb) : { users: [], currentUser: null };
    if (!db.users || !Array.isArray(db.users)) throw new Error("Estrutura inválida");
} catch (error) {
    console.error("Erro ao carregar banco de dados, resetando...");
    db = { users: [], currentUser: null };
    localStorage.setItem('dental_saas_db_v2', JSON.stringify(db));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
function saveDB() {
    localStorage.setItem('dental_saas_db_v2', JSON.stringify(db));
}
function getUserData() {
    return db.users.find(u => u.id === db.currentUser);
}

// ==========================================
// 2. TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'default') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
        error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    };

    toast.innerHTML = (icons[type] || icons.default) + `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ==========================================
// 3. AUTENTICAÇÃO
// ==========================================
function toggleAuthTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if (tab === 'login') {
        document.getElementById('form-login').classList.remove('hidden');
        document.getElementById('form-signup').classList.add('hidden');
        document.querySelectorAll('.tab')[0].classList.add('active');
    } else {
        document.getElementById('form-login').classList.add('hidden');
        document.getElementById('form-signup').classList.remove('hidden');
        document.querySelectorAll('.tab')[1].classList.add('active');
    }
}

function signUp() {
    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;

    if (!name || !email || !password) return showToast('Preencha todos os campos.', 'error');
    if (password.length < 6)           return showToast('A senha deve ter no mínimo 6 caracteres.', 'error');

    if (db.users.find(u => u.email === email)) {
        return showToast('Este e-mail já está cadastrado!', 'error');
    }

    const newUser = {
        id: generateId(), nome: name, email, senha: password,
        pacientes: [], consultas: [], pagamentos: []
    };

    db.users.push(newUser);
    db.currentUser = newUser.id;
    saveDB();
    seedNewUser(newUser);
    startApp();
}

function login() {
    const email    = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!email || !password) return showToast('Preencha o e-mail e a senha.', 'error');

    const user = db.users.find(u => u.email === email);
    if (!user)              return showToast('E-mail não encontrado.', 'error');
    if (user.senha !== password) return showToast('Senha incorreta.', 'error');

    db.currentUser = user.id;
    saveDB();
    startApp();
}

function logout() {
    db.currentUser = null;
    saveDB();
    document.getElementById('app-system').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

// ==========================================
// 4. INICIALIZAÇÃO E DADOS INICIAIS
// ==========================================
function seedNewUser(user) {
    if (user.pacientes.length > 0) return;

    const p1Id = generateId();
    const p2Id = generateId();
    user.pacientes.push(
        { id: p1Id, nome: 'João da Silva',  telefone: '11999887766', obs: 'Alérgico a Lidocaína' },
        { id: p2Id, nome: 'Maria Souza',    telefone: '11988776655', obs: '' }
    );

    const today = new Date();
    const h1 = new Date(today); h1.setHours(10, 0, 0, 0);
    const h2 = new Date(today); h2.setHours(14, 30, 0, 0);

    user.consultas.push(
        { id: generateId(), pacienteId: p1Id, data: h1.toISOString(), status: 'CONFIRMADA' },
        { id: generateId(), pacienteId: p2Id, data: h2.toISOString(), status: 'CONCLUIDA'  }
    );
    user.pagamentos.push({
        id: generateId(), descricao: 'Tratamento Maria', valor: 150.00, data: new Date().toISOString()
    });
    saveDB();
}

function startApp() {
    const user = getUserData();
    if (!user) return logout();

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-system').classList.remove('hidden');

    // Name display
    const firstName = user.nome.split(' ')[0];
    document.getElementById('user-name-display').innerText = firstName;

    // Avatar initials
    const initials = user.nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('user-avatar').innerText = initials;

    // Date
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    renderDashboard();
}

window.onload = () => { if (db.currentUser) startApp(); };

// ==========================================
// 5. MOBILE SIDEBAR
// ==========================================
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

// ==========================================
// 6. NAVEGAÇÃO E MODAIS
// ==========================================
function showSection(sectionName, element) {
    document.querySelectorAll('.main-content > div:not(.mobile-topbar)').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`section-${sectionName}`).classList.remove('hidden');
    if (element) element.classList.add('active');
    closeSidebar();

    if (sectionName === 'dashboard')  renderDashboard();
    if (sectionName === 'pacientes')  renderPacientes();
    if (sectionName === 'agenda')     renderAgenda();
    if (sectionName === 'financeiro') renderFinanceiro();
    if (sectionName === 'relatorios') renderRelatorios();
}

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
    if (id === 'modal-agenda') populatePacienteSelect();
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// ==========================================
// 7. RENDERIZAÇÃO
// ==========================================
function renderDashboard() {
    const user = getUserData(); if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const consultasHoje = user.consultas.filter(c => c.data.split('T')[0] === today);

    document.getElementById('stat-hoje').innerText      = consultasHoje.length;
    document.getElementById('stat-pacientes').innerText = user.pacientes.length;

    const mesAtual     = new Date().getMonth();
    const faturamento  = user.pagamentos.filter(p => new Date(p.data).getMonth() === mesAtual)
                                        .reduce((s, p) => s + parseFloat(p.valor), 0);
    document.getElementById('stat-faturamento').innerText = `R$ ${faturamento.toFixed(2)}`;

    const faltas = user.consultas.filter(c => c.status === 'CANCELADA').length;
    const total  = user.consultas.length;
    document.getElementById('stat-faltas').innerText =
        `${total === 0 ? 0 : Math.round((faltas / total) * 100)}%`;

    const tbody = document.getElementById('tbody-dashboard');
    tbody.innerHTML = '';

    if (consultasHoje.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-3);padding:28px">Nenhuma consulta agendada para hoje</td></tr>`;
        return;
    }

    consultasHoje.forEach(c => {
        const paciente = user.pacientes.find(p => p.id === c.pacienteId);
        const hora     = new Date(c.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const sc       = c.status === 'CONFIRMADA' ? 'bg-confirmada' : c.status === 'CONCLUIDA' ? 'bg-concluida' : 'bg-cancelada';
        tbody.innerHTML += `
        <tr>
            <td style="font-weight:600;color:var(--text)">${hora}</td>
            <td style="color:var(--text)">${paciente ? paciente.nome : 'Desconhecido'}</td>
            <td><span class="badge ${sc}">${c.status}</span></td>
            <td>
                <button class="btn btn-success btn-sm" onclick="sendWhatsApp('${c.id}')">WhatsApp</button>
                ${c.status !== 'CONCLUIDA' ? `<button class="btn btn-sm" style="background:var(--primary);color:white;margin-left:5px" onclick="changeStatus('${c.id}','CONCLUIDA')">Concluir</button>` : ''}
                ${c.status !== 'CANCELADA' ? `<button class="btn btn-danger btn-sm" style="margin-left:5px" onclick="changeStatus('${c.id}','CANCELADA')">Falta</button>` : ''}
            </td>
        </tr>`;
    });
}

function renderPacientes() {
    const user = getUserData(); if (!user) return;
    const tbody = document.getElementById('tbody-pacientes');
    tbody.innerHTML = '';

    if (user.pacientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-3);padding:28px">Nenhum paciente cadastrado</td></tr>`;
        return;
    }

    user.pacientes.forEach(p => {
        tbody.innerHTML += `
        <tr>
            <td style="font-weight:600;color:var(--text)">${p.nome}</td>
            <td>${p.telefone || '—'}</td>
            <td style="max-width:240px">${p.obs || '—'}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deletePaciente('${p.id}')">Excluir</button></td>
        </tr>`;
    });
}

function salvarPaciente() {
    const user = getUserData(); if (!user) return;
    const nome = document.getElementById('inp-pac-nome').value.trim();
    const tel  = document.getElementById('inp-pac-tel').value.trim();
    const obs  = document.getElementById('inp-pac-obs').value.trim();
    if (!nome) return showToast('Preencha o nome do paciente.', 'error');

    user.pacientes.push({ id: generateId(), nome, telefone: tel, obs });
    saveDB();
    closeModal('modal-paciente');
    renderPacientes();

    document.getElementById('inp-pac-nome').value = '';
    document.getElementById('inp-pac-tel').value  = '';
    document.getElementById('inp-pac-obs').value  = '';
    showToast(`${nome} adicionado com sucesso!`, 'success');
}

function deletePaciente(id) {
    const user = getUserData(); if (!user) return;
    const pac = user.pacientes.find(p => p.id === id);
    if (!pac) return;
    if (!confirm(`Excluir o paciente "${pac.nome}"?`)) return;
    user.pacientes = user.pacientes.filter(p => p.id !== id);
    saveDB();
    renderPacientes();
    showToast('Paciente excluído.', 'default');
}

function populatePacienteSelect() {
    const user = getUserData(); if (!user) return;
    const select = document.getElementById('inp-cons-paciente');
    select.innerHTML = '<option value="">Selecione o paciente...</option>';
    user.pacientes.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
    });
}

function renderAgenda() {
    const user = getUserData(); if (!user) return;
    const tbody = document.getElementById('tbody-agenda');
    tbody.innerHTML = '';

    if (user.consultas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-3);padding:28px">Nenhuma consulta agendada</td></tr>`;
        return;
    }

    const ordenadas = [...user.consultas].sort((a, b) => new Date(a.data) - new Date(b.data));
    ordenadas.forEach(c => {
        const paciente      = user.pacientes.find(p => p.id === c.pacienteId);
        const dataFormatada = new Date(c.data).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
        const sc            = c.status === 'CONFIRMADA' ? 'bg-confirmada' : c.status === 'CONCLUIDA' ? 'bg-concluida' : 'bg-cancelada';
        tbody.innerHTML += `
        <tr>
            <td style="font-weight:600;color:var(--text)">${dataFormatada}</td>
            <td>${paciente ? paciente.nome : 'Desconhecido'}</td>
            <td><span class="badge ${sc}">${c.status}</span></td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteConsulta('${c.id}')">Excluir</button></td>
        </tr>`;
    });
}

function salvarConsulta() {
    const user       = getUserData(); if (!user) return;
    const pacienteId = document.getElementById('inp-cons-paciente').value;
    const data       = document.getElementById('inp-cons-data').value;
    if (!pacienteId || !data) return showToast('Preencha todos os campos.', 'error');

    user.consultas.push({ id: generateId(), pacienteId, data: new Date(data).toISOString(), status: 'CONFIRMADA' });
    saveDB();
    closeModal('modal-agenda');
    renderAgenda();
    showToast('Consulta agendada com sucesso!', 'success');
}

function deleteConsulta(id) {
    const user = getUserData(); if (!user) return;
    if (!confirm('Excluir esta consulta?')) return;
    user.consultas = user.consultas.filter(c => c.id !== id);
    saveDB();
    renderAgenda();
    showToast('Consulta excluída.', 'default');
}

function changeStatus(id, newStatus) {
    const user = getUserData(); if (!user) return;
    const cons = user.consultas.find(c => c.id === id);
    if (cons) {
        cons.status = newStatus;
        saveDB();
        renderDashboard();
        const msg = newStatus === 'CONCLUIDA' ? 'Consulta concluída! ✓' : 'Falta registrada.';
        showToast(msg, newStatus === 'CONCLUIDA' ? 'success' : 'default');
    }
}

function sendWhatsApp(consultaId) {
    const user = getUserData(); if (!user) return;
    const cons = user.consultas.find(c => c.id === consultaId);
    if (!cons) return;
    const paciente = user.pacientes.find(p => p.id === cons.pacienteId);
    if (!paciente) return showToast('Paciente não encontrado.', 'error');

    const hora       = new Date(cons.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const mensagem   = `Olá ${paciente.nome}! 👋 Aqui é da clínica. Passando para lembrar da sua consulta hoje às ${hora}. Pode confirmar?`;
    const tel        = paciente.telefone.replace(/\D/g, '');
    const telFinal   = tel.startsWith('55') ? tel : `55${tel}`;
    window.open(`https://wa.me/${telFinal}?text=${encodeURIComponent(mensagem)}`, '_blank');
}

function renderFinanceiro() {
    const user = getUserData(); if (!user) return;
    const tbody = document.getElementById('tbody-financeiro');
    tbody.innerHTML = '';

    if (user.pagamentos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-3);padding:28px">Nenhum pagamento registrado</td></tr>`;
        return;
    }

    const ordenados = [...user.pagamentos].sort((a, b) => new Date(b.data) - new Date(a.data));
    ordenados.forEach(p => {
        tbody.innerHTML += `
        <tr>
            <td style="color:var(--text-3)">${new Date(p.data).toLocaleDateString('pt-BR')}</td>
            <td style="color:var(--text)">${p.descricao}</td>
            <td style="color:var(--success);font-weight:700">R$ ${parseFloat(p.valor).toFixed(2)}</td>
        </tr>`;
    });
}

function salvarPagamento() {
    const user  = getUserData(); if (!user) return;
    const desc  = document.getElementById('inp-pag-desc').value.trim();
    const valor = document.getElementById('inp-pag-valor').value;
    if (!valor) return showToast('Informe o valor.', 'error');

    user.pagamentos.push({ id: generateId(), descricao: desc || 'Consulta', valor: parseFloat(valor), data: new Date().toISOString() });
    saveDB();
    closeModal('modal-pagamento');
    renderFinanceiro();
    document.getElementById('inp-pag-valor').value = '';
    showToast(`R$ ${parseFloat(valor).toFixed(2)} registrado com sucesso!`, 'success');
}

function renderRelatorios() {
    const user = getUserData(); if (!user) return;
    const mes  = new Date().getMonth();
    const mes_consultas = user.consultas.filter(c => new Date(c.data).getMonth() === mes);

    document.getElementById('rel-atendidos').innerText = mes_consultas.filter(c => c.status === 'CONCLUIDA').length;
    document.getElementById('rel-faltas').innerText    = mes_consultas.filter(c => c.status === 'CANCELADA').length;

    const fat = user.pagamentos.filter(p => new Date(p.data).getMonth() === mes)
                               .reduce((s, p) => s + parseFloat(p.valor), 0);
    document.getElementById('rel-faturamento').innerText = fat.toFixed(2);
}