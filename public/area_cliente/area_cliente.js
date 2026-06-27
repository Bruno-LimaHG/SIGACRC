const cliente = SIGACRC.clienteLogado();

if (!cliente) {
    sessionStorage.setItem("avisoLoginSIGACRC", "Para acessar a Área do Cliente, faça login ou crie seu cadastro. Assim seus pedidos, protocolos e mensagens ficam vinculados ao seu usuário.");
    sessionStorage.setItem("destinoAposLoginSIGACRC", window.location.href);
    window.location.replace("/login?aviso=area-cliente");
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

async function abrirAtendimento() {
    await renderizarAtendimentosCliente();
    modalAtendimentoCliente.classList.remove("oculto");
    modalAtendimentoCliente.setAttribute("aria-hidden", "false");
}

function fecharAtendimento() {
    modalAtendimentoCliente.classList.add("oculto");
    modalAtendimentoCliente.setAttribute("aria-hidden", "true");
    mensagemAtendimentoSistema.className = "mensagem oculto";
}

async function renderizarAtendimentosCliente() {
    let atendimentos = [];
    try {
        const response = await fetch('/api/atendimentos', {
            headers: { 'x-user-id': cliente ? cliente.cpf : 'sem-id' }
        });
        if (response.ok) {
            const todos = await response.json();
            const emailCliente = String(cliente?.email || "").toLowerCase();
            const cpfCliente = String(cliente?.cpf || "").replace(/\D/g, "");
            
            atendimentos = todos.filter((atendimento) => {
                const emailAtendimento = String(atendimento.cliente?.email || "").toLowerCase();
                const cpfAtendimento = String(atendimento.cliente?.cpf || "").replace(/\D/g, "");
                if (!emailCliente && !cpfCliente) return false;
                return emailAtendimento === emailCliente || cpfAtendimento === cpfCliente;
            });
        }
    } catch (error) {
        console.error("Erro ao buscar atendimentos:", error);
    }

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

formAtendimentoCliente.addEventListener("submit", async (event) => {
    event.preventDefault();

    const texto = mensagemAtendimentoCliente.value.trim();

    if (!texto) {
        mensagemAtendimentoSistema.className = "mensagem erro";
        mensagemAtendimentoSistema.textContent = "Digite uma mensagem antes de enviar.";
        mensagemAtendimentoSistema.classList.remove("oculto");
        return;
    }

    const id = `ATD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const agora = new Date().toISOString();
    
    const novoAtendimento = {
        id,
        status: "Aberto",
        cliente: {
            nome: cliente?.nome || "Cliente não identificado",
            email: cliente?.email || "",
            cpf: cliente?.cpf || ""
        },
        criadoEm: agora,
        atualizadoEm: agora,
        mensagens: [
            {
                autor: cliente?.nome || "Cliente",
                perfil: "cliente",
                texto,
                data: agora
            }
        ]
    };

    try {
        await fetch("/api/atendimentos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": cliente ? cliente.cpf : "sem-id"
            },
            body: JSON.stringify(novoAtendimento)
        });

        mensagemAtendimentoCliente.value = "";
        mensagemAtendimentoSistema.className = "mensagem sucesso";
        mensagemAtendimentoSistema.textContent = "Mensagem enviada. O escrevente poderá responder pelo painel do funcionário.";
        mensagemAtendimentoSistema.classList.remove("oculto");
        await renderizarAtendimentosCliente();
    } catch (e) {
        console.error(e);
        mensagemAtendimentoSistema.className = "mensagem erro";
        mensagemAtendimentoSistema.textContent = "Erro de conexão ao enviar a mensagem.";
        mensagemAtendimentoSistema.classList.remove("oculto");
    }
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
    window.location.href = "/login";
});

renderizarPedidos();

}
