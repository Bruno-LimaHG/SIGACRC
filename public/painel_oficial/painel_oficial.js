const corpoTabelaFuncionarios = document.getElementById("corpoTabelaFuncionarios");
const estadoVazioFuncionarios = document.getElementById("estadoVazioFuncionarios");
const btnAbrirModalAdicionar = document.getElementById("btnAbrirModalAdicionar");
const modalAdicionarFuncionario = document.getElementById("modalAdicionarFuncionario");
const btnFecharModalAdicionar = document.getElementById("btnFecharModalAdicionar");
const formAdicionarFuncionario = document.getElementById("formAdicionarFuncionario");
const mensagemAdicionar = document.getElementById("mensagemAdicionar");
const btnSairOficial = document.getElementById("btnSairOficial");

const corpoTabelaPedidos = document.getElementById("corpoTabelaPedidos");
const estadoVazio = document.getElementById("estadoVazio");
const buscaPedido = document.getElementById("buscaPedido");
const filtroStatus = document.getElementById("filtroStatus");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");

let todosPedidosApi = [];
let todosAtendimentos = [];
let todosFuncionarios = [];

let ordemDecrescente = true; // Por padrão, mais recentes primeiro

let paginaAtual = 1;
const itensPorPagina = 10;

async function carregarFuncionarios() {
    try {
        const response = await fetch('/api/usuarios/escreventes', {
            headers: { 'x-user-id': 'oficial' }
        });
        if (response.ok) {
            todosFuncionarios = await response.json();
            renderizarFuncionarios();
        }
    } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
    }
}

function renderizarFuncionarios() {
    if (todosFuncionarios.length === 0) {
        corpoTabelaFuncionarios.innerHTML = "";
        estadoVazioFuncionarios.classList.remove("oculto");
        return;
    }

    estadoVazioFuncionarios.classList.add("oculto");
    corpoTabelaFuncionarios.innerHTML = todosFuncionarios.map((func) => `
        <tr>
            <td><strong>${func.nome}</strong></td>
            <td>${func.email}</td>
            <td>${func.cpf}</td>
            <td>
                <button type="button" class="btn-secundario btnAlterarSenhaFuncionario" data-id="${func.id}">Alterar Senha</button>
                <button type="button" class="btn-escuro btnDeletarFuncionario" style="margin-left:8px;" data-id="${func.id}">Excluir</button>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll(".btnDeletarFuncionario").forEach((botao) => {
        botao.addEventListener("click", async () => {
            if (confirm("Tem certeza que deseja excluir este funcionário?")) {
                await deletarFuncionario(botao.dataset.id);
            }
        });
    });

    document.querySelectorAll(".btnAlterarSenhaFuncionario").forEach((botao) => {
        botao.addEventListener("click", () => {
            document.getElementById("senhaFuncionarioId").value = botao.dataset.id;
            document.getElementById("novaSenhaFuncionario").value = "";
            document.getElementById("mensagemSenhaFuncionario").classList.add("oculto");
            document.getElementById("modalAlterarSenhaFuncionario").classList.remove("oculto");
        });
    });
}

async function deletarFuncionario(id) {
    try {
        const response = await fetch(`/api/usuarios/${id}`, {
            method: 'DELETE',
            headers: { 'x-user-id': 'oficial' }
        });
        if (response.ok) {
            await carregarFuncionarios();
        } else {
            alert("Erro ao excluir funcionário");
        }
    } catch (e) {
        console.error(e);
        alert("Erro ao excluir funcionário");
    }
}

formAdicionarFuncionario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("novoNome").value;
    const email = document.getElementById("novoEmail").value;
    const cpf = document.getElementById("novoCpf").value;
    const senha = document.getElementById("novaSenha").value;

    try {
        const response = await fetch("/api/usuarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, cpf, senha, perfil: "escrevente" })
        });
        
        const json = await response.json();
        
        if (response.ok) {
            mensagemAdicionar.className = "mensagem sucesso";
            mensagemAdicionar.textContent = "Funcionário cadastrado com sucesso.";
            mensagemAdicionar.classList.remove("oculto");
            formAdicionarFuncionario.reset();
            await carregarFuncionarios();
            setTimeout(() => { fecharModalAdicionar(); }, 1500);
        } else {
            mensagemAdicionar.className = "mensagem erro";
            mensagemAdicionar.textContent = json.erro || "Erro ao cadastrar funcionário.";
            mensagemAdicionar.classList.remove("oculto");
        }
    } catch (error) {
        mensagemAdicionar.className = "mensagem erro";
        mensagemAdicionar.textContent = "Erro na conexão com o servidor.";
        mensagemAdicionar.classList.remove("oculto");
    }
});

btnAbrirModalAdicionar.addEventListener("click", () => {
    modalAdicionarFuncionario.classList.remove("oculto");
    modalAdicionarFuncionario.setAttribute("aria-hidden", "false");
    mensagemAdicionar.classList.add("oculto");
});

function fecharModalAdicionar() {
    modalAdicionarFuncionario.classList.add("oculto");
    modalAdicionarFuncionario.setAttribute("aria-hidden", "true");
}

btnFecharModalAdicionar.addEventListener("click", fecharModalAdicionar);

async function carregarPedidosEAtendimentos() {
    try {
        const response = await fetch('/api/pedidos', {
            headers: { 'x-user-id': 'oficial' }
        });
        const pedidosBd = await response.json();
        
        todosPedidosApi = pedidosBd.map(p => ({
            protocolo: p.id || p._id,
            enviadoEm: p.createdAt || p.data,
            status: p.status,
            resumo: {
                contraente1: p.solicitante,
                contraente2: p.conjuge,
                tipoCerimonia: p.tipo
            },
            documentos: (p.documentos || []).map(docObj => ({
                nomeArquivo: docObj.nome || docObj.rotulo || "Documento",
                nomeDocumento: docObj.rotulo || "Anexo",
                anexado: true,
                url: docObj.dados || "#"
            })),
            dados: {
                cpf_contraente1: p.cpf
            }
        }));

        const resAtend = await fetch('/api/atendimentos', {
            headers: { 'x-user-id': 'oficial' }
        });
        if (resAtend.ok) {
            todosAtendimentos = await resAtend.json();
        } else {
            todosAtendimentos = [];
        }

        renderizarPedidos();
    } catch (error) {
        console.error("Erro ao carregar dados da API:", error);
    }
}

function atualizarMetricas() {
    document.getElementById("metricaTotal").textContent = todosPedidosApi.length;
    document.getElementById("metricaPendentes").textContent = todosPedidosApi.filter((p) => p.status === "Pendente").length;
    document.getElementById("metricaAnalise").textContent = todosPedidosApi.filter((p) => p.status === "Em análise").length;
    document.getElementById("metricaExigencia").textContent = todosPedidosApi.filter((p) => p.status === "Exigência documental" || p.status === "Recusado").length;
    document.getElementById("metricaAtendimentos").textContent = todosAtendimentos.length;
}

function filtrarPedidos() {
    const termo = buscaPedido.value.trim().toLowerCase();
    const status = filtroStatus.value;

    return todosPedidosApi
        .filter((pedido) => {
            const textoBusca = [
                pedido.protocolo,
                pedido.resumo?.contraente1,
                pedido.resumo?.contraente2,
                pedido.dados?.cpf_contraente1
            ].join(" ").toLowerCase();

            const combinaBusca = !termo || textoBusca.includes(termo);
            const combinaStatus = status === "todos" || pedido.status === status;
            return combinaBusca && combinaStatus;
        })
        .sort((a, b) => {
            const dataA = new Date(a.enviadoEm);
            const dataB = new Date(b.enviadoEm);
            return ordemDecrescente ? dataB - dataA : dataA - dataB;
        });
}

const thDataOrdenacao = document.getElementById("thDataOrdenacao");
if (thDataOrdenacao) {
    thDataOrdenacao.addEventListener("click", () => {
        ordemDecrescente = !ordemDecrescente;
        document.getElementById("iconeOrdenacao").textContent = ordemDecrescente ? "⬇️" : "⬆️";
        paginaAtual = 1;
        renderizarPedidos();
    });
}

function renderizarPedidos() {
    const pedidosFiltrados = filtrarPedidos();
    atualizarMetricas();

    const paginacaoControles = document.getElementById("paginacaoPedidos");

    if (pedidosFiltrados.length === 0) {
        corpoTabelaPedidos.innerHTML = "";
        estadoVazio.classList.remove("oculto");
        if (paginacaoControles) paginacaoControles.classList.add("oculto");
        return;
    }

    estadoVazio.classList.add("oculto");
    if (paginacaoControles) paginacaoControles.classList.remove("oculto");

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const pedidosPaginados = pedidosFiltrados.slice(inicio, fim);

    corpoTabelaPedidos.innerHTML = pedidosPaginados.map((pedido) => `
        <tr>
            <td><strong>${pedido.protocolo}</strong></td>
            <td>${pedido.resumo?.contraente1 || "Não informado"}<br><small>${pedido.resumo?.contraente2 || "Não informado"}</small></td>
            <td>${SIGACRC.formatarData(pedido.enviadoEm)}</td>
            <td>${pedido.resumo?.tipoCerimonia || "Não informado"}</td>
            <td><span class="status ${SIGACRC.classeStatus(pedido.status)}">${pedido.status}</span></td>
        </tr>
    `).join("");

    if (paginacaoControles) {
        const totalPaginas = Math.ceil(pedidosFiltrados.length / itensPorPagina);
        const btnPaginaAnterior = document.getElementById("btnPaginaAnterior");
        const btnProximaPagina = document.getElementById("btnProximaPagina");
        const textoPaginacao = document.getElementById("textoPaginacao");

        textoPaginacao.textContent = `Página ${paginaAtual} de ${totalPaginas || 1}`;
        btnPaginaAnterior.disabled = paginaAtual === 1;
        btnProximaPagina.disabled = paginaAtual >= totalPaginas;
    }
}

buscaPedido.addEventListener("input", () => { paginaAtual = 1; renderizarPedidos(); });
filtroStatus.addEventListener("change", () => { paginaAtual = 1; renderizarPedidos(); });
btnLimparFiltros.addEventListener("click", () => {
    buscaPedido.value = "";
    filtroStatus.value = "todos";
    paginaAtual = 1;
    renderizarPedidos();
});

const btnPaginaAnterior = document.getElementById("btnPaginaAnterior");
const btnProximaPagina = document.getElementById("btnProximaPagina");
if (btnPaginaAnterior) {
    btnPaginaAnterior.addEventListener("click", () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarPedidos();
        }
    });
}
if (btnProximaPagina) {
    btnProximaPagina.addEventListener("click", () => {
        const pedidosFiltrados = filtrarPedidos();
        const totalPaginas = Math.ceil(pedidosFiltrados.length / itensPorPagina);
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarPedidos();
        }
    });
}

btnSairOficial.addEventListener("click", () => {
    SIGACRC.limparEscreventeLogado(); 
    window.location.href = "/";
});

// Alterar Minha Senha (Oficial)
document.getElementById("btnAlterarMinhaSenha").addEventListener("click", () => {
    document.getElementById("minhaNovaSenha").value = "";
    document.getElementById("mensagemMinhaSenha").classList.add("oculto");
    document.getElementById("modalAlterarMinhaSenha").classList.remove("oculto");
});

document.getElementById("btnFecharModalMinhaSenha").addEventListener("click", () => {
    document.getElementById("modalAlterarMinhaSenha").classList.add("oculto");
});

document.getElementById("formAlterarMinhaSenha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const novaSenha = document.getElementById("minhaNovaSenha").value;
    const msg = document.getElementById("mensagemMinhaSenha");
    const admin = SIGACRC.recuperarEscreventeLogado();
    
    if (!admin || !admin.id) {
        msg.textContent = "Erro de sessão.";
        msg.className = "mensagem erro";
        msg.classList.remove("oculto");
        return;
    }

    try {
        const response = await fetch(`/api/usuarios/${admin.id}/senha`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-user-id": "oficial" },
            body: JSON.stringify({ novaSenha })
        });
        const resData = await response.json();
        if (response.ok) {
            msg.textContent = "Senha atualizada com sucesso.";
            msg.className = "mensagem sucesso";
            msg.classList.remove("oculto");
            setTimeout(() => document.getElementById("modalAlterarMinhaSenha").classList.add("oculto"), 1500);
        } else {
            msg.textContent = resData.erro || "Erro ao atualizar senha.";
            msg.className = "mensagem erro";
            msg.classList.remove("oculto");
        }
    } catch (err) {
        msg.textContent = "Erro de conexão.";
        msg.className = "mensagem erro";
        msg.classList.remove("oculto");
    }
});

// Alterar Senha de Funcionário
document.getElementById("btnFecharModalSenhaFuncionario").addEventListener("click", () => {
    document.getElementById("modalAlterarSenhaFuncionario").classList.add("oculto");
});

document.getElementById("formAlterarSenhaFuncionario").addEventListener("submit", async (e) => {
    e.preventDefault();
    const novaSenha = document.getElementById("novaSenhaFuncionario").value;
    const funcId = document.getElementById("senhaFuncionarioId").value;
    const msg = document.getElementById("mensagemSenhaFuncionario");

    try {
        const response = await fetch(`/api/usuarios/${funcId}/senha`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-user-id": "oficial" },
            body: JSON.stringify({ novaSenha })
        });
        const resData = await response.json();
        if (response.ok) {
            msg.textContent = "Senha do funcionário atualizada.";
            msg.className = "mensagem sucesso";
            msg.classList.remove("oculto");
            setTimeout(() => document.getElementById("modalAlterarSenhaFuncionario").classList.add("oculto"), 1500);
        } else {
            msg.textContent = resData.erro || "Erro ao atualizar senha.";
            msg.className = "mensagem erro";
            msg.classList.remove("oculto");
        }
    } catch (err) {
        msg.textContent = "Erro de conexão.";
        msg.className = "mensagem erro";
        msg.classList.remove("oculto");
    }
});

carregarFuncionarios();
carregarPedidosEAtendimentos();
