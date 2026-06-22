const dadosProtocolo = document.getElementById("dadosProtocolo");
const linkAcompanhamento = document.getElementById("linkAcompanhamento");
const protocoloLocal = localStorage.getItem(SIGACRC.chaves.ultimoProtocolo);

async function carregarProtocolo() {
    if (!protocoloLocal) {
        dadosProtocolo.className = "mensagem";
        dadosProtocolo.innerHTML = "Nenhum protocolo recente foi encontrado. Você pode consultar um protocolo manualmente na tela de acompanhamento.";
        return;
    }

    try {
        const cliente = SIGACRC.clienteLogado();
        const headers = cliente && cliente.token ? { 'Authorization': `Bearer ${cliente.token}` } : { 'x-user-id': cliente ? cliente.id : 'sem-id' };
        
        const response = await fetch(`/api/pedidos/${protocoloLocal}`, { headers });
        
        if (response.ok) {
            const pedidoApi = await response.json();
            
            // Compatibiliza formato API e Local
            const pedido = {
                protocolo: pedidoApi.id || pedidoApi._id || protocoloLocal,
                status: pedidoApi.status,
                resumo: {
                    contraente1: pedidoApi.solicitante || "Não informado",
                    contraente2: pedidoApi.conjuge || "Não informado"
                },
                enviadoEm: pedidoApi.createdAt || pedidoApi.data || new Date().toISOString()
            };

            linkAcompanhamento.href = `../acompanhamento/acompanhamento.html?protocolo=${encodeURIComponent(pedido.protocolo)}`;
            dadosProtocolo.innerHTML = `
                <h2>${pedido.protocolo}</h2>
                <p><strong>Status inicial:</strong> ${pedido.status}</p>
                <p><strong>Contraentes:</strong> ${pedido.resumo.contraente1} e ${pedido.resumo.contraente2}</p>
                <p><strong>Data de envio:</strong> ${SIGACRC.formatarData(pedido.enviadoEm)}</p>
                <p>Guarde este número para acompanhar o andamento do pedido.</p>
            `;
        } else {
            throw new Error("Não encontrado");
        }
    } catch (e) {
        dadosProtocolo.className = "mensagem";
        dadosProtocolo.innerHTML = "Erro ao carregar os detalhes do protocolo recente. Tente consultar na aba de Acompanhamento.";
    }
}

carregarProtocolo();
