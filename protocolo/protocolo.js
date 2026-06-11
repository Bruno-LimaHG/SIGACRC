const dadosProtocolo = document.getElementById("dadosProtocolo");
const linkAcompanhamento = document.getElementById("linkAcompanhamento");
const protocolo = localStorage.getItem(SIGACRC.chaves.ultimoProtocolo);
const pedido = protocolo ? SIGACRC.buscarPedido(protocolo) : null;

if (!pedido) {
    dadosProtocolo.className = "mensagem";
    dadosProtocolo.innerHTML = "Nenhum protocolo recente foi encontrado. Você pode consultar um protocolo manualmente na tela de acompanhamento.";
} else {
    linkAcompanhamento.href = `../acompanhamento/acompanhamento.html?protocolo=${encodeURIComponent(pedido.protocolo)}`;
    dadosProtocolo.innerHTML = `
        <h2>${pedido.protocolo}</h2>
        <p><strong>Status inicial:</strong> ${pedido.status}</p>
        <p><strong>Contraentes:</strong> ${pedido.resumo?.contraente1 || "Não informado"} e ${pedido.resumo?.contraente2 || "Não informado"}</p>
        <p><strong>Data de envio:</strong> ${SIGACRC.formatarData(pedido.enviadoEm)}</p>
        <p>Guarde este número para acompanhar o andamento do pedido.</p>
    `;
}
