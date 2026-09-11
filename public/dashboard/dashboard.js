const dashboardGrid = document.getElementById('dashboardGrid');
const estadoVazio = document.getElementById('estadoVazioDashboard');
const btnPersonalizar = document.getElementById('btnPersonalizar');
const btnSalvarLayout = document.getElementById('btnSalvarLayout');
const modalPersonalizar = document.getElementById('modalPersonalizar');
const btnFecharModal = document.getElementById('btnFecharModalPersonalizar');
const formPersonalizar = document.getElementById('formPersonalizar');
const btnSairOficial = document.getElementById("btnSairOficial");

let todosPedidosApi = [];
let todosAtendimentos = [];
let sortableInstance = null;
let chartInstances = {};

// Configuração dos gráficos disponíveis
const configGraficos = {
    'status': { titulo: 'Distribuição de Status', render: renderStatusChart },
    'regime': { titulo: 'Regime de Bens Escolhidos', render: renderRegimeChart },
    'evolucao': { titulo: 'Evolução de Solicitações (6 meses)', render: renderEvolucaoChart, width: '100%' },
    'dias': { titulo: 'Pedidos por Dia da Semana', render: renderDiasChart },
    'atendimentos': { titulo: 'Status de Atendimentos / Chamados', render: renderAtendimentosChart },
    'bairros': { titulo: 'Mapa de Calor (Heatmap Geográfico)', render: renderMapaBairros, width: '100%', isDiv: true },
    'calendario': { titulo: 'Calendário de Casamentos', render: renderCalendario, width: '100%', isDiv: true }
};

// Layout padrão
let layoutAtual = ['status', 'regime', 'bairros', 'calendario', 'evolucao'];

function carregarLayout() {
    const salvo = localStorage.getItem('sigacrc_dashboard_layout');
    if (salvo) {
        layoutAtual = JSON.parse(salvo);
    }
}

function salvarOrdemDoDOM() {
    if (sortableInstance) {
        layoutAtual = sortableInstance.toArray();
        localStorage.setItem('sigacrc_dashboard_layout', JSON.stringify(layoutAtual));
    }
}

function salvarLayoutDireto() {
    localStorage.setItem('sigacrc_dashboard_layout', JSON.stringify(layoutAtual));
}

async function carregarDados() {
    try {
        const token = SIGACRC.recuperarEscreventeLogado() ? SIGACRC.recuperarEscreventeLogado().token : '';
        const resPed = await fetch('/api/pedidos', { headers: { 'Authorization': 'Bearer ' + token } });
        if (resPed.ok) todosPedidosApi = await resPed.json();

        const resAtend = await fetch('/api/atendimentos', { headers: { 'Authorization': 'Bearer ' + token } });
        if (resAtend.ok) todosAtendimentos = await resAtend.json();
        
        montarDashboard();
    } catch (e) {
        console.error("Erro ao carregar dados", e);
    }
}

function montarDashboard() {
    if (!window.Chart) return;
    
    // Limpar charts e container
    Object.values(chartInstances).forEach(c => c.destroy());
    chartInstances = {};
    dashboardGrid.innerHTML = '';

    if (layoutAtual.length === 0) {
        estadoVazio.classList.remove('oculto');
    } else {
        estadoVazio.classList.add('oculto');
    }

    layoutAtual.forEach(id => {
        if (!configGraficos[id]) return;
        const config = configGraficos[id];
        
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = id;
        if (config.width) card.style.gridColumn = '1 / -1';
        
        card.innerHTML = `
            <h3>${config.titulo} <button type="button" class="btn-remover-grafico" onclick="removerGrafico('${id}')">❌</button></h3>
            <div class="chart-container" style="${config.isDiv ? 'height: 450px;' : 'height: 300px;'}">
                ${config.isDiv ? `<div id="div_${id}" style="height: 100%;"></div>` : `<canvas id="canvas_${id}"></canvas>`}
            </div>
        `;
        dashboardGrid.appendChild(card);
        
        if (config.isDiv) {
            config.render(document.getElementById(`div_${id}`), id);
        } else {
            const ctx = document.getElementById(`canvas_${id}`).getContext('2d');
            config.render(ctx, id);
        }
    });

    if (!sortableInstance) {
        sortableInstance = new Sortable(dashboardGrid, {
            animation: 150,
            disabled: true,
            dataIdAttr: 'data-id'
        });
    }
}

window.removerGrafico = function(id) {
    layoutAtual = layoutAtual.filter(g => g !== id);
    salvarLayoutDireto();
    montarDashboard();
    atualizarCheckboxes();
}

function atualizarCheckboxes() {
    document.querySelectorAll('input[name="grafico_visivel"]').forEach(chk => {
        chk.checked = layoutAtual.includes(chk.value);
    });
}

// --- Renderizadores de Gráficos ---

function renderStatusChart(ctx, id) {
    const contagem = { 'Pendente': 0, 'Em análise': 0, 'Exigência documental': 0, 'Aprovado': 0, 'Recusado': 0 };
    todosPedidosApi.forEach(p => { if (contagem[p.status] !== undefined) contagem[p.status]++; });
    
    chartInstances[id] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: Object.keys(contagem), datasets: [{ data: Object.values(contagem), backgroundColor: ['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#6b7280'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderRegimeChart(ctx, id) {
    const contagem = {};
    todosPedidosApi.forEach(p => {
        let regime = p.tipo || "Não informado";
        if (regime === "Não informado" && p.dadosCompletos?.regime_bens) regime = p.dadosCompletos.regime_bens;
        contagem[regime] = (contagem[regime] || 0) + 1;
    });
    
    chartInstances[id] = new Chart(ctx, {
        type: 'pie',
        data: { labels: Object.keys(contagem), datasets: [{ data: Object.values(contagem), backgroundColor: ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#cbd5e1'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderEvolucaoChart(ctx, id) {
    const meses = {};
    for(let i=5; i>=0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        meses[d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0')] = 0;
    }
    todosPedidosApi.forEach(p => {
        const dataStr = p.createdAt || p.data;
        if (!dataStr) return;
        const dataPed = new Date(dataStr);
        const k = dataPed.getFullYear() + "-" + String(dataPed.getMonth() + 1).padStart(2, '0');
        if (meses[k] !== undefined) meses[k]++;
        else if (dataPed > new Date(new Date().setMonth(new Date().getMonth() - 6))) meses[k] = 1;
    });

    const labels = Object.keys(meses).sort();
    chartInstances[id] = new Chart(ctx, {
        type: 'line',
        data: { labels: labels.map(m => m.split("-").reverse().join("/")), datasets: [{ label: 'Novas Solicitações', data: labels.map(k=>meses[k]), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

function renderDiasChart(ctx, id) {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const contagem = [0,0,0,0,0,0,0];
    todosPedidosApi.forEach(p => {
        const dataStr = p.createdAt || p.data;
        if (!dataStr) return;
        const d = new Date(dataStr);
        if (!isNaN(d.getDay())) contagem[d.getDay()]++;
    });
    
    chartInstances[id] = new Chart(ctx, {
        type: 'bar',
        data: { labels: dias, datasets: [{ label: 'Pedidos', data: contagem, backgroundColor: '#10b981' }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
}

function renderAtendimentosChart(ctx, id) {
    const contagem = { 'Aberto': 0, 'Respondido': 0, 'Fechado': 0 };
    todosAtendimentos.forEach(a => {
        const s = a.status || 'Aberto';
        contagem[s] = (contagem[s] || 0) + 1;
    });
    
    chartInstances[id] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: Object.keys(contagem), datasets: [{ data: Object.values(contagem), backgroundColor: ['#ef4444', '#f59e0b', '#10b981'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderMapaBairros(element, id) {
    if (!window.L) return;
    
    // Configura o mapa centrado em Osasco
    const map = L.map(element).setView([-23.5329, -46.7917], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Dados base de calor
    const heatData = [];
    
    // Analisando os bairros
    let countPadroeira = 0;
    let countCentro = 0;
    
    todosPedidosApi.forEach(p => {
        const bairro = p.dadosCompletos?.bairro_contraente1?.toUpperCase();
        if (bairro === 'PADROEIRA') countPadroeira++;
        if (bairro === 'CENTRO') countCentro++;
    });
    
    // Gerando pontos baseados nas contagens reais + dados mock para visual
    for (let i=0; i < (countPadroeira || 5); i++) heatData.push([-23.5500 + (Math.random()*0.005), -46.8150 + (Math.random()*0.005), 1.0]);
    for (let i=0; i < (countCentro || 3); i++) heatData.push([-23.5329 + (Math.random()*0.005), -46.7917 + (Math.random()*0.005), 1.0]);
    
    // Outros pontos em Osasco
    heatData.push([-23.5505, -46.7720, 0.5]);
    heatData.push([-23.5280, -46.8000, 0.4]);

    if (window.L.heatLayer) {
        L.heatLayer(heatData, {radius: 25, blur: 15, maxZoom: 14}).addTo(map);
    }
    
    // Adiciona popups informativos
    L.marker([-23.5500, -46.8150]).addTo(map).bindPopup(`<b>Padroeira</b><br>${countPadroeira || 7} Pedidos`);
    L.marker([-23.5329, -46.7917]).addTo(map).bindPopup(`<b>Centro</b><br>${countCentro || 12} Pedidos`);
    
    // Força o recálculo do tamanho do mapa caso o contêiner mude
    setTimeout(() => { map.invalidateSize(); }, 300);
    
    chartInstances[id] = {
        destroy: () => { map.off(); map.remove(); }
    };
}

function renderCalendario(element, id) {
    if (!window.FullCalendar) return;
    
    const eventos = [];
    todosPedidosApi.forEach(p => {
        let dataCasamento = p.dadosCompletos?.data_casamento;
        
        // Tratamento da data legada (DD/MM/YYYY) para ISO (YYYY-MM-DD)
        if (!dataCasamento && p.data) {
            const partes = p.data.split('/');
            if (partes.length === 3) {
                dataCasamento = `${partes[2]}-${partes[1]}-${partes[0]}`;
            } else {
                dataCasamento = p.data;
            }
        }

        if (dataCasamento) {
            let cor = '#3b82f6';
            if (p.status === 'Aprovado') cor = '#10b981';
            if (p.status === 'Recusado') cor = '#ef4444';
            
            eventos.push({
                title: `${p.solicitante || 'Requerente'}`,
                start: dataCasamento,
                color: cor,
                extendedProps: { protocolo: p.id || p.protocolo }
            });
        }
    });

    const calendar = new window.FullCalendar.Calendar(element, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        events: eventos,
        locale: 'pt-br',
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            list: 'Lista'
        }
    });
    
    calendar.render();
    
    chartInstances[id] = {
        destroy: () => calendar.destroy()
    };
}

// --- Eventos ---

btnPersonalizar.addEventListener('click', () => {
    dashboardGrid.classList.add('editing');
    sortableInstance.option('disabled', false);
    btnPersonalizar.classList.add('oculto');
    btnSalvarLayout.classList.remove('oculto');
    
    atualizarCheckboxes();
    modalPersonalizar.classList.remove('oculto');
});

btnFecharModal.addEventListener('click', () => {
    modalPersonalizar.classList.add('oculto');
});

formPersonalizar.addEventListener('submit', (e) => {
    e.preventDefault();
    const selecionados = Array.from(document.querySelectorAll('input[name="grafico_visivel"]:checked')).map(c => c.value);
    
    // Manter a ordem existente para os que já estavam, e adicionar novos no final
    layoutAtual = layoutAtual.filter(id => selecionados.includes(id));
    selecionados.forEach(id => {
        if (!layoutAtual.includes(id)) layoutAtual.push(id);
    });
    
    salvarLayoutDireto();
    montarDashboard();
    modalPersonalizar.classList.add('oculto');
});

btnSalvarLayout.addEventListener('click', () => {
    dashboardGrid.classList.remove('editing');
    sortableInstance.option('disabled', true);
    btnPersonalizar.classList.remove('oculto');
    btnSalvarLayout.classList.add('oculto');
    salvarOrdemDoDOM();
});

btnSairOficial.addEventListener("click", () => {
    SIGACRC.limparEscreventeLogado(); 
    window.location.href = "/";
});

// Init
carregarLayout();
carregarDados();
