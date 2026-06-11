const cliente = SIGACRC.clienteLogado();

if (!cliente) {
    sessionStorage.setItem("avisoLoginSIGACRC", "Para acessar a Área do Cliente, faça login ou crie seu cadastro. Assim seus pedidos, protocolos e mensagens ficam vinculados ao seu usuário.");
    sessionStorage.setItem("destinoAposLoginSIGACRC", window.location.href);
    window.location.replace("../login_clientes/login_clientes.html?aviso=area-cliente");
} else {
const tituloCliente = document.getElementById("tituloCliente");
const listaPedidosCliente = document.getElementById("listaPedidosCliente");
const btnSair = document.getElementById("btnSair");
const modalAtendimentoCliente = document.getElementById("modalAtendimentoCliente");
const btnFecharAtendimento = document.getElementById("btnFecharAtendimento");
const formAtendimentoCliente = document.getElementById("formAtendimentoCliente");
const mensagemAtendimentoCliente = document.getElementById("mensagemAtendimentoCliente");
const mensagemAtendimentoSistema = document.getElementById("mensagemAtendimentoSistema");
const listaAtendimentosCliente = document.getElementById("listaAtendimentosCliente");

if (cliente?.nome) {
    tituloCliente.textContent = `Olá, ${cliente.nome.split(" ")[0]}`;
}

function pedidosDoCliente() {
    const pedidos = SIGACRC.pedidos();

    if (!cliente?.email && !cliente?.cpf) {
        return pedidos;
    }

    return pedidos.filter((pedido) => {
        const emailPedido = String(pedido.cliente?.email || pedido.dados?.email_contraente1 || "").toLowerCase();
        const cpfPedido = String(pedido.cliente?.cpf || pedido.dados?.cpf_contraente1 || "").replace(/\D/g, "");
        const emailCliente = String(cliente.email || "").toLowerCase();
        const cpfCliente = String(cliente.cpf || "").replace(/\D/g, "");

        return emailPedido === emailCliente || cpfPedido === cpfCliente;
    });
}

function atualizarMetricas(pedidos) {
    document.getElementById("totalPedidos").textContent = pedidos.length;
    document.getElementById("totalPendentes").textContent = pedidos.filter((p) => p.status === "Pendente").length;
    document.getElementById("totalAnalise").textContent = pedidos.filter((p) => p.status === "Em análise").length;
    document.getElementById("totalConcluidos").textContent = pedidos.filter((p) => ["Aprovado", "Recusado"].includes(p.status)).length;
}

function renderizarPedidos() {
    const pedidos = pedidosDoCliente().sort((a, b) => new Date(b.enviadoEm) - new Date(a.enviadoEm));
    atualizarMetricas(pedidos);

    if (pedidos.length === 0) {
        listaPedidosCliente.innerHTML = `
            <div class="mensagem">
                Nenhum pedido foi encontrado para este cliente. Clique em <strong>Novo pedido</strong> para preencher o formulário de casamento.
            </div>
        `;
        return;
    }

    listaPedidosCliente.innerHTML = pedidos.map((pedido) => `
        <article class="item-lista">
            <div>
                <h3>${pedido.protocolo}</h3>
                <p>${pedido.resumo?.contraente1 || "1º contraente"} e ${pedido.resumo?.contraente2 || "2º contraente"}</p>
                <small>Enviado em ${SIGACRC.formatarData(pedido.enviadoEm)} · ${pedido.resumo?.tipoCerimonia || "Tipo não informado"}</small>
            </div>
            <div class="form-acoes">
                <span class="status ${SIGACRC.classeStatus(pedido.status)}">${pedido.status}</span>
                <a class="btn btn-secundario" href="../acompanhamento/acompanhamento.html?protocolo=${encodeURIComponent(pedido.protocolo)}">Detalhes</a>
            </div>
        </article>
    `).join("");
}

function abrirAtendimento() {
    renderizarAtendimentosCliente();
    modalAtendimentoCliente.classList.remove("oculto");
    modalAtendimentoCliente.setAttribute("aria-hidden", "false");
}

function fecharAtendimento() {
    modalAtendimentoCliente.classList.add("oculto");
    modalAtendimentoCliente.setAttribute("aria-hidden", "true");
    mensagemAtendimentoSistema.className = "mensagem oculto";
}

function renderizarAtendimentosCliente() {
    const atendimentos = SIGACRC.atendimentosDoCliente(cliente)
        .sort((a, b) => new Date(b.atualizadoEm) - new Date(a.atualizadoEm));

    if (atendimentos.length === 0) {
        listaAtendimentosCliente.innerHTML = `
            <div class="mensagem">
                Você ainda não enviou mensagens para a equipe. Use o formulário ao lado para iniciar um atendimento.
            </div>
        `;
        return;
    }

    listaAtendimentosCliente.innerHTML = atendimentos.map((atendimento) => {
        const mensagens = atendimento.mensagens || [];
        return `
            <article class="item-lista" style="align-items: stretch; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; gap: 12px; align-items: center;">
                    <div>
                        <h3>${atendimento.id}</h3>
                        <small>${SIGACRC.formatarData(atendimento.atualizadoEm)} · ${mensagens.length} mensagem(ns)</small>
                    </div>
                    <span class="status ${atendimento.status === "Respondido" ? "aprovado" : "pendente"}">${atendimento.status}</span>
                </div>
                <div class="chat-historico">
                    ${mensagens.map((msg) => `
                        <div class="chat-mensagem ${msg.perfil}">
                            <strong>${msg.autor}</strong>
                            <div>${msg.texto}</div>
                            <small>${SIGACRC.formatarData(msg.data)}</small>
                        </div>
                    `).join("")}
                </div>
            </article>
        `;
    }).join("");
}

formAtendimentoCliente.addEventListener("submit", (event) => {
    event.preventDefault();

    const texto = mensagemAtendimentoCliente.value.trim();

    if (!texto) {
        mensagemAtendimentoSistema.className = "mensagem erro";
        mensagemAtendimentoSistema.textContent = "Digite uma mensagem antes de enviar.";
        mensagemAtendimentoSistema.classList.remove("oculto");
        return;
    }

    SIGACRC.criarAtendimento(cliente || {}, texto);
    mensagemAtendimentoCliente.value = "";
    mensagemAtendimentoSistema.className = "mensagem sucesso";
    mensagemAtendimentoSistema.textContent = "Mensagem enviada. O escrevente poderá responder pelo painel do funcionário.";
    mensagemAtendimentoSistema.classList.remove("oculto");
    renderizarAtendimentosCliente();
});

["btnAbrirAtendimento", "btnAbrirAtendimentoTopo", "btnAbrirAtendimentoCard"].forEach((id) => {
    const botao = document.getElementById(id);
    if (botao) {
        botao.addEventListener("click", abrirAtendimento);
    }
});

btnFecharAtendimento.addEventListener("click", fecharAtendimento);
modalAtendimentoCliente.addEventListener("click", (event) => {
    if (event.target === modalAtendimentoCliente) {
        fecharAtendimento();
    }
});

btnSair.addEventListener("click", () => {
    SIGACRC.limparClienteLogado();
    window.location.href = "../login_clientes/login_clientes.html";
});

renderizarPedidos();

}
