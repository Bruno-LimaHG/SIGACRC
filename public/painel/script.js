if (!sessionStorage.getItem("sigacrc_funcionario")) {
    window.location.href = "../login_escreventes/login_escreventes.html";
}

let pedidos = [];

const corpoTabela = document.getElementById("corpoTabela");
const filtro = document.getElementById("filtro");
const modal = document.getElementById("modal");
const fecharModal = document.getElementById("fecharModal");
const btnAprovar = document.getElementById("btnAprovar");
const btnRecusar = document.getElementById("btnRecusar");
const kpiPendentes = document.getElementById("kpiPendentes");
const kpiAprovados = document.getElementById("kpiAprovados");
const kpiRecusados = document.getElementById("kpiRecusados");

let pedidoSelecionado = null;

function normalizarStatus(status) {
    const valor = (status || "").toLowerCase();

    if (valor.includes("aprov")) {
        return "aprovado";
    }
    if (valor.includes("recus")) {
        return "recusado";
    }
    return "pendente";
}

function atualizarKpis(lista) {
    const contagem = { pendente: 0, aprovado: 0, recusado: 0 };

    lista.forEach((pedido) => {
        contagem[normalizarStatus(pedido.status)]++;
    });

    kpiPendentes.textContent = contagem.pendente;
    kpiAprovados.textContent = contagem.aprovado;
    kpiRecusados.textContent = contagem.recusado;
}

async function carregarPedidos() {
    try {
        const response = await fetch("/api/pedidos");
        pedidos = await response.json();
        atualizarKpis(pedidos);
        renderizarTabela(pedidos);
    } catch {
        corpoTabela.innerHTML =
            "<tr><td colspan='5'>Erro ao carregar pedidos. Execute npm start na pasta SIGACRC.</td></tr>";
    }
}

async function atualizarStatusPedido(status) {
    if (!pedidoSelecionado) {
        return;
    }

    try {
        const response = await fetch(`/api/pedidos/${pedidoSelecionado.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            alert("Não foi possível atualizar o pedido");
            return;
        }

        await carregarPedidos();
        modal.style.display = "none";
    } catch {
        alert("Erro ao conectar com o servidor");
    }
}

function renderizarTabela(listaPedidos) {
    corpoTabela.innerHTML = "";

    if (listaPedidos.length === 0) {
        corpoTabela.innerHTML =
            "<tr><td colspan='5'>Nenhum pedido encontrado.</td></tr>";
        return;
    }

    listaPedidos.forEach((pedido) => {
        let classeStatus = "status-analise";

        if (pedido.status === "Pendente") {
            classeStatus = "status-pendente";
        } else if (pedido.status === "Aprovado") {
            classeStatus = "status-aprovado";
        } else if (pedido.status === "Recusado") {
            classeStatus = "status-recusado";
        }

        corpoTabela.innerHTML += `
            <tr data-id="${pedido.id}">
                <td>${pedido.id}</td>
                <td>${pedido.solicitante}</td>
                <td>${pedido.tipo}</td>
                <td>${pedido.cpf}</td>
                <td class="${classeStatus}">${pedido.status}</td>
            </tr>
        `;
    });

    adicionarEventosLinhas();
}

function adicionarEventosLinhas() {
    document.querySelectorAll("#corpoTabela tr").forEach((linha) => {
        linha.addEventListener("click", () => {
            const id = linha.dataset.id;
            pedidoSelecionado = pedidos.find((pedido) => pedido.id === id);
            abrirModal();
        });
    });
}

function visualizarDocumento(doc) {
    if (doc.dados || doc.url) {
        visualizarArquivo(doc);
        return;
    }

    alert("Arquivo não disponível. Peça ao cliente para reenviar o formulário com os anexos.");
}

function renderizarDocumentos(pedido) {
    const areaDocumentos = document.getElementById("documentos");
    const semDocumentos = document.getElementById("semDocumentos");
    areaDocumentos.innerHTML = "";

    const anexos = pedido.documentosAnexos || [];

    if (anexos.length > 0) {
        semDocumentos.classList.add("oculto");

        anexos.forEach((doc) => {
            const item = document.createElement("div");
            item.className = "doc-item";

            const rotulo = document.createElement("span");
            rotulo.textContent = `${doc.rotulo || doc.nome} (${doc.nome})`;

            const btnVer = document.createElement("button");
            btnVer.type = "button";
            btnVer.textContent = "Visualizar";
            btnVer.addEventListener("click", (event) => {
                event.stopPropagation();
                visualizarDocumento(doc);
            });

            item.appendChild(rotulo);
            item.appendChild(btnVer);
            areaDocumentos.appendChild(item);
        });

        return;
    }

    const nomesLegado = pedido.documentos || [];

    if (nomesLegado.length === 0) {
        semDocumentos.classList.remove("oculto");
        return;
    }

    semDocumentos.classList.add("oculto");

    nomesLegado.forEach((nome) => {
        const item = document.createElement("div");
        item.className = "doc-item";

        const rotulo = document.createElement("span");
        rotulo.textContent = nome;

        const aviso = document.createElement("button");
        aviso.type = "button";
        aviso.textContent = "Indisponível";
        aviso.disabled = true;

        item.appendChild(rotulo);
        item.appendChild(aviso);
        areaDocumentos.appendChild(item);
    });
}

function abrirModal() {
    document.getElementById("nomeSolicitante").innerHTML =
        `<strong>Solicitante:</strong> ${pedidoSelecionado.solicitante}`;

    document.getElementById("nomeConjuge").innerHTML =
        `<strong>Cônjuge:</strong> ${pedidoSelecionado.conjuge}`;

    document.getElementById("tipoCasamento").innerHTML =
        `<strong>Tipo:</strong> ${pedidoSelecionado.tipo}`;

    document.getElementById("dataCasamento").innerHTML =
        `<strong>Data:</strong> ${pedidoSelecionado.data}`;

    document.getElementById("testemunha1").innerHTML =
        `<strong>Testemunha 1:</strong> ${pedidoSelecionado.testemunha1}`;

    document.getElementById("testemunha2").innerHTML =
        `<strong>Testemunha 2:</strong> ${pedidoSelecionado.testemunha2}`;

    renderizarDocumentos(pedidoSelecionado);

    modal.style.display = "flex";
}

fecharModal.addEventListener("click", () => {
    modal.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

btnAprovar.addEventListener("click", () => {
    atualizarStatusPedido("Aprovado");
});

btnRecusar.addEventListener("click", () => {
    atualizarStatusPedido("Recusado");
});

filtro.addEventListener("keyup", () => {
    const texto = filtro.value.toLowerCase();

    const resultado = pedidos.filter(
        (pedido) =>
            pedido.id.toLowerCase().includes(texto) ||
            pedido.solicitante.toLowerCase().includes(texto) ||
            pedido.tipo.toLowerCase().includes(texto) ||
            pedido.cpf.toLowerCase().includes(texto) ||
            pedido.status.toLowerCase().includes(texto)
    );

    renderizarTabela(resultado);
});

carregarPedidos();
