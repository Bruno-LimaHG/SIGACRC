const formConsulta = document.getElementById("formConsulta");
const campoProtocolo = document.getElementById("campoProtocolo");
const resultadoConsulta = document.getElementById("resultadoConsulta");

function obterParametro(nome) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nome);
}

async function renderizarResultado(protocolo) {
    const idBusca = protocolo.trim();
    resultadoConsulta.className = "mensagem";
    resultadoConsulta.innerHTML = "Buscando protocolo no banco de dados...";
    resultadoConsulta.classList.remove("oculto");

    try {
        const response = await fetch('/api/pedidos');
        const pedidos = await response.json();
        
        const p = pedidos.find(pedido => pedido.id === idBusca);

        if (!p) {
            resultadoConsulta.className = "mensagem erro";
            resultadoConsulta.innerHTML = "Protocolo não encontrado no servidor. Confira se o código foi digitado corretamente.";
            return;
        }

        // Mapeando a resposta do backend MongoDB para o formato visual esperado
        const pedidoMap = {
            protocolo: p.id,
            status: p.status,
            resumo: {
                contraente1: p.solicitante,
                contraente2: p.conjuge
            },
            enviadoEm: p.createdAt || p.data,
            observacaoEscrevente: p.dadosCompletos?.observacaoEscrevente || "",
            documentos: (p.documentos || []).map(d => ({ nomeDocumento: "Arquivo", nomeArquivo: d })),
            historico: []
        };

        resultadoConsulta.className = "mensagem sucesso";
        resultadoConsulta.innerHTML = `
            <h2>Protocolo: ${pedidoMap.protocolo}</h2>
            <p><strong>Status:</strong> <span class="status ${SIGACRC.classeStatus(pedidoMap.status)}">${pedidoMap.status}</span></p>
            <p><strong>Contraentes:</strong> ${pedidoMap.resumo.contraente1 || "Não informado"} e ${pedidoMap.resumo.contraente2 || "Não informado"}</p>
            <p><strong>Data de envio:</strong> ${SIGACRC.formatarData(pedidoMap.enviadoEm)}</p>
            <p><strong>Observação do escrevente:</strong> ${pedidoMap.observacaoEscrevente || "Nenhuma observação registrada."}</p>
            <h3>Documentos anexados</h3>
            <ul>${pedidoMap.documentos.length > 0 ? pedidoMap.documentos.map((doc) => `<li>${doc.nomeDocumento}: ${doc.nomeArquivo || "Não anexado"}</li>`).join("") : "<li>Nenhum documento listado.</li>"}</ul>
            <h3>Histórico de atualizações</h3>
            <ul>${pedidoMap.historico.length > 0 ? pedidoMap.historico.map((item) => `<li>${SIGACRC.formatarData(item.data)} - ${item.descricao}</li>`).join("") : "<li>Sem histórico registrado (as alterações de status do painel ainda não geram log para o cliente).</li>"}</ul>
            ${(pedidoMap.status === "Recusado" || pedidoMap.status === "Exigência documental") ? `<div style="margin-top: 20px;"><a href="../formulario_casamento/formulario_casamento.html?editar=${encodeURIComponent(pedidoMap.protocolo)}" class="btn">Editar Solicitação</a></div>` : ""}
        `;
    } catch(err) {
        resultadoConsulta.className = "mensagem erro";
        resultadoConsulta.innerHTML = "Erro de conexão com o servidor. Tente novamente mais tarde.";
    }
}

formConsulta.addEventListener("submit", (event) => {
    event.preventDefault();
    renderizarResultado(campoProtocolo.value);
});

const protocoloURL = obterParametro("protocolo");
if (protocoloURL) {
    campoProtocolo.value = protocoloURL;
    renderizarResultado(protocoloURL);
}
