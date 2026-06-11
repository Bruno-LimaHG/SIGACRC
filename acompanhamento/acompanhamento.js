const formConsulta = document.getElementById("formConsulta");
const campoProtocolo = document.getElementById("campoProtocolo");
const resultadoConsulta = document.getElementById("resultadoConsulta");

function obterParametro(nome) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nome);
}

function renderizarResultado(protocolo) {
    const pedido = SIGACRC.buscarPedido(protocolo.trim());

    if (!pedido) {
        resultadoConsulta.className = "mensagem erro";
        resultadoConsulta.innerHTML = "Protocolo não encontrado neste navegador. Confira se o código foi digitado corretamente.";
        resultadoConsulta.classList.remove("oculto");
        return;
    }

    const historico = pedido.historico || [];
    const documentos = pedido.documentos || [];

    resultadoConsulta.className = "mensagem sucesso";
    resultadoConsulta.innerHTML = `
        <h2>${pedido.protocolo}</h2>
        <p><strong>Status:</strong> <span class="status ${SIGACRC.classeStatus(pedido.status)}">${pedido.status}</span></p>
        <p><strong>Contraentes:</strong> ${pedido.resumo?.contraente1 || "Não informado"} e ${pedido.resumo?.contraente2 || "Não informado"}</p>
        <p><strong>Data de envio:</strong> ${SIGACRC.formatarData(pedido.enviadoEm)}</p>
        <p><strong>Observação do escrevente:</strong> ${pedido.observacaoEscrevente || "Nenhuma observação registrada."}</p>
        <h3>Documentos anexados</h3>
        <ul>${documentos.map((doc) => `<li>${doc.nomeDocumento}: ${doc.nomeArquivo || "Não anexado"}</li>`).join("")}</ul>
        <h3>Histórico</h3>
        <ul>${historico.map((item) => `<li>${SIGACRC.formatarData(item.data)} - ${item.descricao}</li>`).join("")}</ul>
    `;
    resultadoConsulta.classList.remove("oculto");
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
