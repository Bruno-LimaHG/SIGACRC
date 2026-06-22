const corpoTabelaPedidos = document.getElementById("corpoTabelaPedidos");
const estadoVazio = document.getElementById("estadoVazio");
const buscaPedido = document.getElementById("buscaPedido");
const filtroStatus = document.getElementById("filtroStatus");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");
const modalPedido = document.getElementById("modalPedido");
const btnFecharModal = document.getElementById("btnFecharModal");
const formAtualizarPedido = document.getElementById("formAtualizarPedido");
const btnSairFuncionario = document.getElementById("btnSairFuncionario");
const listaAtendimentosFuncionario = document.getElementById("listaAtendimentosFuncionario");
const estadoAtendimentoVazio = document.getElementById("estadoAtendimentoVazio");
const contadorAtendimentosAbertos = document.getElementById("contadorAtendimentosAbertos");
const modalAtendimentoFuncionario = document.getElementById("modalAtendimentoFuncionario");
const btnFecharAtendimentoFuncionario = document.getElementById("btnFecharAtendimentoFuncionario");
const formResponderAtendimento = document.getElementById("formResponderAtendimento");
const respostaAtendimentoFuncionario = document.getElementById("respostaAtendimentoFuncionario");
const mensagemRespostaAtendimento = document.getElementById("mensagemRespostaAtendimento");

let protocoloSelecionado = null;
let atendimentoSelecionado = null;

// Novas variáveis globais para a API
let todosPedidosApi = [];
let todosAtendimentos = [];

let ordemDecrescente = true; // Por padrão, mais recentes primeiro

let paginaAtual = 1;
const itensPorPagina = 10;

async function carregarDadosDaApi() {
    try {
        const response = await fetch('/api/pedidos');
        const pedidosBd = await response.json();
        
        // Mapeia os dados do Banco (MongoDB) para a estrutura visual que o HTML do Escrevente já espera
        todosPedidosApi = pedidosBd.map(p => ({
            _idOriginal: p._id, // ID real do MongoDB necessário para o PATCH
            protocolo: p.id,
            enviadoEm: p.createdAt || p.data,
            status: p.status,
            observacaoEscrevente: "",
            resumo: {
                contraente1: p.solicitante,
                contraente2: p.conjuge,
                tipoCerimonia: p.tipo,
                regimeBens: p.dadosCompletos?.regimeBens || "Não informado"
            },
            dados: {
                cpf_contraente1: p.cpf,
                email_contraente1: p.dadosCompletos?.email || "Não informado",
                cep_contraente1: p.dadosCompletos?.cep || "Não informado"
            },
            documentos: (p.documentos || []).map(docObj => ({
                nomeArquivo: docObj.nome || docObj.rotulo || "Documento",
                nomeDocumento: docObj.rotulo || "Anexo",
                anexado: true,
                url: docObj.dados || "#"
            })),
            historico: []
        }));

        const resAtend = await fetch('/api/atendimentos', {
            headers: { 'x-user-id': 'escrevente' }
        });
        if (resAtend.ok) {
            todosAtendimentos = await resAtend.json();
        } else {
            todosAtendimentos = [];
        }

        renderizarTabela();
        renderizarAtendimentos();
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
    contadorAtendimentosAbertos.textContent = todosAtendimentos.filter((a) => a.status === "Aberto").length;
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

function renderizarTabela() {
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
            <td><button type="button" class="btnAbrirPedido" data-protocolo="${pedido.protocolo}">Analisar</button></td>
        </tr>
    `).join("");

    document.querySelectorAll(".btnAbrirPedido").forEach((botao) => {
        botao.addEventListener("click", () => abrirModal(botao.dataset.protocolo));
    });

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

function abrirModal(protocolo) {
    const pedido = todosPedidosApi.find(p => p.protocolo === protocolo);

    if (!pedido) {
        return;
    }

    protocoloSelecionado = protocolo;

    document.getElementById("modalProtocolo").textContent = pedido.protocolo;
    document.getElementById("modalContraentes").textContent = `${pedido.resumo?.contraente1 || "Não informado"} e ${pedido.resumo?.contraente2 || "Não informado"}`;
    document.getElementById("novoStatus").value = pedido.status || "Pendente";
    document.getElementById("observacaoEscrevente").value = pedido.observacaoEscrevente || "";

    document.getElementById("modalDetalhes").innerHTML = `
        ${detalhe("Status atual", `<span class="status ${SIGACRC.classeStatus(pedido.status)}">${pedido.status}</span>`)}
        ${detalhe("Data de envio", SIGACRC.formatarData(pedido.enviadoEm))}
        ${detalhe("Tipo de cerimônia", pedido.resumo?.tipoCerimonia || "Não informado")}
        ${detalhe("Regime de bens", pedido.resumo?.regimeBens || "Não informado")}
        ${detalhe("E-mail do cliente", pedido.dados?.email_contraente1 || "Não informado")}
        ${detalhe("CEP", pedido.dados?.cep_contraente1 || "Não informado")}
    `;

    renderizarDocumentos(pedido);
    renderizarHistorico(pedido);

    modalPedido.classList.remove("oculto");
    modalPedido.setAttribute("aria-hidden", "false");
}

function detalhe(titulo, valor) {
    return `<div class="detalhe"><span>${titulo}</span><strong>${valor}</strong></div>`;
}

function renderizarDocumentos(pedido) {
    const documentos = pedido.documentos || [];

    if (documentos.length === 0) {
        document.getElementById("modalDocumentos").innerHTML = "<p>Nenhum documento registrado.</p>";
        return;
    }

    document.getElementById("modalDocumentos").innerHTML = `
        <div class="lista-cards">
            ${documentos.map((doc) => `
                <div class="item-lista" style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <strong>${doc.nomeDocumento}</strong>
                        <p>${doc.nomeArquivo || "Não anexado"}</p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="status ${doc.anexado ? "aprovado" : "exigencia-documental"}">${doc.anexado ? "Anexado" : "Pendente"}</span>
                        ${doc.url && doc.url !== "#" ? `<a href="${doc.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secundario" style="padding: 4px 8px; font-size: 12px; text-decoration: none;">Ver/Baixar</a>` : ""}
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function renderizarHistorico(pedido) {
    const historico = pedido.historico || [];

    if (historico.length === 0) {
        document.getElementById("modalHistorico").innerHTML = "<p>Nenhum histórico de alterações registrado ainda.</p>";
        return;
    }

    document.getElementById("modalHistorico").innerHTML = `
        <ul>
            ${historico.map((item) => `<li>${SIGACRC.formatarData(item.data)} - ${item.descricao}</li>`).join("")}
        </ul>
    `;
}

function fecharModal() {
    modalPedido.classList.add("oculto");
    modalPedido.setAttribute("aria-hidden", "true");
    protocoloSelecionado = null;
}

function renderizarAtendimentos() {
    const atendimentos = todosAtendimentos
        .sort((a, b) => new Date(b.atualizadoEm) - new Date(a.atualizadoEm));

    atualizarMetricas();

    if (atendimentos.length === 0) {
        listaAtendimentosFuncionario.innerHTML = "";
        estadoAtendimentoVazio.classList.remove("oculto");
        return;
    }

    estadoAtendimentoVazio.classList.add("oculto");
    listaAtendimentosFuncionario.innerHTML = atendimentos.map((atendimento) => {
        const mensagens = atendimento.mensagens || [];
        const ultimaMensagem = mensagens[mensagens.length - 1];

        return `
            <article class="item-lista">
                <div>
                    <h3>${atendimento.cliente?.nome || "Cliente"}</h3>
                    <p>${ultimaMensagem?.texto || "Sem mensagem registrada."}</p>
                    <small>${atendimento.id} · ${SIGACRC.formatarData(atendimento.atualizadoEm)} · ${mensagens.length} mensagem(ns)</small>
                </div>
                <div class="form-acoes">
                    <span class="status ${atendimento.status === "Aberto" ? "pendente" : "aprovado"}">${atendimento.status}</span>
                    <button type="button" class="btnAbrirAtendimentoFuncionario btn-secundario" data-id="${atendimento.id}">Responder</button>
                </div>
            </article>
        `;
    }).join("");

    document.querySelectorAll(".btnAbrirAtendimentoFuncionario").forEach((botao) => {
        botao.addEventListener("click", () => abrirAtendimentoFuncionario(botao.dataset.id));
    });
}

function abrirAtendimentoFuncionario(id) {
    const atendimento = todosAtendimentos.find(a => a.id === id);

    if (!atendimento) {
        return;
    }

    atendimentoSelecionado = id;
    respostaAtendimentoFuncionario.value = "";
    mensagemRespostaAtendimento.className = "mensagem oculto";
    document.getElementById("modalAtendimentoTitulo").textContent = atendimento.id;
    document.getElementById("modalAtendimentoCliente").textContent = `${atendimento.cliente?.nome || "Cliente"} · ${atendimento.cliente?.email || "E-mail não informado"}`;
    renderizarHistoricoAtendimentoFuncionario(atendimento);
    modalAtendimentoFuncionario.classList.remove("oculto");
    modalAtendimentoFuncionario.setAttribute("aria-hidden", "false");
}

function renderizarHistoricoAtendimentoFuncionario(atendimento) {
    const mensagens = atendimento.mensagens || [];

    document.getElementById("historicoAtendimentoFuncionario").innerHTML = mensagens.map((msg) => `
        <div class="chat-mensagem ${msg.perfil}">
            <strong>${msg.autor}</strong>
            <div>${msg.texto}</div>
            <small>${SIGACRC.formatarData(msg.data)}</small>
        </div>
    `).join("");
}

function fecharAtendimentoFuncionario() {
    modalAtendimentoFuncionario.classList.add("oculto");
    modalAtendimentoFuncionario.setAttribute("aria-hidden", "true");
    atendimentoSelecionado = null;
}

formAtualizarPedido.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!protocoloSelecionado) {
        return;
    }

    const pedidoAtual = todosPedidosApi.find(p => p.protocolo === protocoloSelecionado);
    const novoStatus = document.getElementById("novoStatus").value;
    const observacaoEscrevente = document.getElementById("observacaoEscrevente").value.trim();

    try {
        // Envia atualização via API para o Servidor MongoDB real
        const response = await fetch('/api/pedidos/' + pedidoAtual.protocolo, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'escrevente' // Simula o cabeçalho de auth esperado pela API
            },
            body: JSON.stringify({ status: novoStatus })
        });
        
        if (!response.ok) {
            throw new Error("Erro ao salvar no servidor");
        }

        // Atualiza a memória local temporariamente para não precisar buscar tudo de novo
        pedidoAtual.status = novoStatus;
        pedidoAtual.observacaoEscrevente = observacaoEscrevente;
        pedidoAtual.historico.push({
            data: new Date().toISOString(),
            descricao: `Status alterado para ${novoStatus}${observacaoEscrevente ? " - " + observacaoEscrevente : ""}.`
        });

        renderizarTabela();
        abrirModal(protocoloSelecionado);
        
        // Alerta opcional visualmente nativo do browser para confirmar sucesso
        alert('Status atualizado com sucesso no banco de dados!');
    } catch (error) {
        console.error("Falha ao salvar no servidor", error);
        alert('Erro ao atualizar status. O servidor pode estar indisponível.');
    }
});

formResponderAtendimento.addEventListener("submit", async (event) => {
    event.preventDefault();

    const texto = respostaAtendimentoFuncionario.value.trim();

    if (!atendimentoSelecionado || !texto) {
        mensagemRespostaAtendimento.className = "mensagem erro";
        mensagemRespostaAtendimento.textContent = "Selecione um atendimento e digite uma resposta.";
        mensagemRespostaAtendimento.classList.remove("oculto");
        return;
    }

    try {
        const response = await fetch(`/api/atendimentos/${atendimentoSelecionado}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": "escrevente"
            },
            body: JSON.stringify({ autor: "Escrevente SIGACRC", perfil: "funcionario", texto })
        });
        
        if (response.ok) {
            const atendimentoAtualizado = await response.json();
            respostaAtendimentoFuncionario.value = "";
            mensagemRespostaAtendimento.className = "mensagem sucesso";
            mensagemRespostaAtendimento.textContent = "Resposta enviada para a área do cliente.";
            mensagemRespostaAtendimento.classList.remove("oculto");

            renderizarHistoricoAtendimentoFuncionario(atendimentoAtualizado);
            await carregarDadosDaApi();
        }
    } catch (e) {
        console.error(e);
    }
});

buscaPedido.addEventListener("input", () => { paginaAtual = 1; renderizarTabela(); });
filtroStatus.addEventListener("change", () => { paginaAtual = 1; renderizarTabela(); });
btnLimparFiltros.addEventListener("click", () => {
    buscaPedido.value = "";
    filtroStatus.value = "todos";
    paginaAtual = 1;
    renderizarTabela();
});

const btnPaginaAnterior = document.getElementById("btnPaginaAnterior");
const btnProximaPagina = document.getElementById("btnProximaPagina");
if (btnPaginaAnterior) {
    btnPaginaAnterior.addEventListener("click", () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarTabela();
        }
    });
}
if (btnProximaPagina) {
    btnProximaPagina.addEventListener("click", () => {
        const pedidosFiltrados = filtrarPedidos();
        const totalPaginas = Math.ceil(pedidosFiltrados.length / itensPorPagina);
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarTabela();
        }
    });
}

btnFecharModal.addEventListener("click", fecharModal);
modalPedido.addEventListener("click", (event) => {
    if (event.target === modalPedido) {
        fecharModal();
    }
});

btnFecharAtendimentoFuncionario.addEventListener("click", fecharAtendimentoFuncionario);
modalAtendimentoFuncionario.addEventListener("click", (event) => {
    if (event.target === modalAtendimentoFuncionario) {
        fecharAtendimentoFuncionario();
    }
});

btnSairFuncionario.addEventListener("click", () => {
    SIGACRC.limparEscreventeLogado();
    window.location.href = "../login_escreventes/login_escreventes.html";
});

// Iniciando chamadas do painel (API)
carregarDadosDaApi();
