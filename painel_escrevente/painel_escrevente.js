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

function atualizarMetricas(pedidos) {
    const atendimentos = SIGACRC.atendimentos();
    document.getElementById("metricaTotal").textContent = pedidos.length;
    document.getElementById("metricaPendentes").textContent = pedidos.filter((p) => p.status === "Pendente").length;
    document.getElementById("metricaAnalise").textContent = pedidos.filter((p) => p.status === "Em análise").length;
    document.getElementById("metricaExigencia").textContent = pedidos.filter((p) => p.status === "Exigência documental").length;
    document.getElementById("metricaAtendimentos").textContent = atendimentos.length;
    contadorAtendimentosAbertos.textContent = atendimentos.filter((a) => a.status === "Aberto").length;
}

function filtrarPedidos() {
    const termo = buscaPedido.value.trim().toLowerCase();
    const status = filtroStatus.value;

    return SIGACRC.pedidos()
        .filter((pedido) => {
            const textoBusca = [
                pedido.protocolo,
                pedido.resumo?.contraente1,
                pedido.resumo?.contraente2,
                pedido.dados?.cpf_contraente1,
                pedido.dados?.cpf_contraente2
            ].join(" ").toLowerCase();

            const combinaBusca = !termo || textoBusca.includes(termo);
            const combinaStatus = status === "todos" || pedido.status === status;
            return combinaBusca && combinaStatus;
        })
        .sort((a, b) => new Date(b.enviadoEm) - new Date(a.enviadoEm));
}

function renderizarTabela() {
    const todosPedidos = SIGACRC.pedidos();
    const pedidos = filtrarPedidos();
    atualizarMetricas(todosPedidos);

    if (pedidos.length === 0) {
        corpoTabelaPedidos.innerHTML = "";
        estadoVazio.classList.remove("oculto");
        return;
    }

    estadoVazio.classList.add("oculto");
    corpoTabelaPedidos.innerHTML = pedidos.map((pedido) => `
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
}

function abrirModal(protocolo) {
    const pedido = SIGACRC.buscarPedido(protocolo);

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
        ${detalhe("E-mail do cliente", pedido.cliente?.email || pedido.dados?.email_contraente1 || "Não informado")}
        ${detalhe("CEP validado", `${pedido.dados?.cep_contraente1 || "Não informado"} / ${pedido.dados?.cep_contraente2 || "Não informado"}`)}
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
                <div class="item-lista">
                    <div>
                        <strong>${doc.nomeDocumento}</strong>
                        <p>${doc.nomeArquivo || "Não anexado"}</p>
                    </div>
                    <span class="status ${doc.anexado ? "aprovado" : "exigencia-documental"}">${doc.anexado ? "Anexado" : "Pendente"}</span>
                </div>
            `).join("")}
        </div>
    `;
}

function renderizarHistorico(pedido) {
    const historico = pedido.historico || [];

    if (historico.length === 0) {
        document.getElementById("modalHistorico").innerHTML = "<p>Nenhum histórico registrado.</p>";
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
    const atendimentos = SIGACRC.atendimentos()
        .sort((a, b) => new Date(b.atualizadoEm) - new Date(a.atualizadoEm));

    atualizarMetricas(SIGACRC.pedidos());

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
    const atendimento = SIGACRC.buscarAtendimento(id);

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

formAtualizarPedido.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!protocoloSelecionado) {
        return;
    }

    const pedidoAtual = SIGACRC.buscarPedido(protocoloSelecionado);
    const novoStatus = document.getElementById("novoStatus").value;
    const observacaoEscrevente = document.getElementById("observacaoEscrevente").value.trim();
    const historico = pedidoAtual.historico || [];

    historico.push({
        data: new Date().toISOString(),
        descricao: `Status alterado para ${novoStatus}${observacaoEscrevente ? ` - ${observacaoEscrevente}` : ""}.`
    });

    SIGACRC.atualizarPedido(protocoloSelecionado, {
        status: novoStatus,
        observacaoEscrevente,
        historico
    });

    renderizarTabela();
    abrirModal(protocoloSelecionado);
});

formResponderAtendimento.addEventListener("submit", (event) => {
    event.preventDefault();

    const texto = respostaAtendimentoFuncionario.value.trim();

    if (!atendimentoSelecionado || !texto) {
        mensagemRespostaAtendimento.className = "mensagem erro";
        mensagemRespostaAtendimento.textContent = "Digite uma resposta antes de enviar.";
        mensagemRespostaAtendimento.classList.remove("oculto");
        return;
    }

    const atendimentoAtualizado = SIGACRC.responderAtendimento(atendimentoSelecionado, texto, "Escrevente SIGACRC");
    respostaAtendimentoFuncionario.value = "";
    mensagemRespostaAtendimento.className = "mensagem sucesso";
    mensagemRespostaAtendimento.textContent = "Resposta enviada para a área do cliente.";
    mensagemRespostaAtendimento.classList.remove("oculto");

    renderizarHistoricoAtendimentoFuncionario(atendimentoAtualizado);
    renderizarAtendimentos();
});

buscaPedido.addEventListener("input", renderizarTabela);
filtroStatus.addEventListener("change", renderizarTabela);
btnLimparFiltros.addEventListener("click", () => {
    buscaPedido.value = "";
    filtroStatus.value = "todos";
    renderizarTabela();
});

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

renderizarTabela();
renderizarAtendimentos();
