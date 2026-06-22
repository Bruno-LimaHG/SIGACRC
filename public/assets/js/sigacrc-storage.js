/* =========================================================
   SIGACRC - Funções compartilhadas de armazenamento local.
   Nesta fase do TCC, o localStorage simula o banco de dados.
   ========================================================= */
const SIGACRC = {
    chaves: {
        usuarios: "usuariosSIGACRC",
        clienteLogado: "clienteLogadoSIGACRC",
        escreventeLogado: "escreventeLogadoSIGACRC",
        pedidos: "pedidosSIGACRC",
        ultimoProtocolo: "ultimoProtocoloSIGACRC",
        atendimentos: "atendimentosSIGACRC"
    },

    ler(chave, valorPadrao = null) {
        try {
            const valor = localStorage.getItem(chave);
            return valor ? JSON.parse(valor) : valorPadrao;
        } catch (error) {
            console.warn("Erro ao ler localStorage:", error);
            return valorPadrao;
        }
    },

    salvar(chave, valor) {
        localStorage.setItem(chave, JSON.stringify(valor));
    },

    usuarios() {
        return this.ler(this.chaves.usuarios, []);
    },

    salvarUsuarios(usuarios) {
        this.salvar(this.chaves.usuarios, usuarios);
    },

    clienteLogado() {
        return this.ler(this.chaves.clienteLogado, null);
    },

    salvarClienteLogado(cliente) {
        this.salvar(this.chaves.clienteLogado, cliente);
    },

    limparClienteLogado() {
        localStorage.removeItem(this.chaves.clienteLogado);
    },

    salvarEscreventeLogado(escrevente) {
        this.salvar(this.chaves.escreventeLogado, escrevente);
    },

    recuperarEscreventeLogado() {
        return this.ler(this.chaves.escreventeLogado, null);
    },

    limparEscreventeLogado() {
        localStorage.removeItem(this.chaves.escreventeLogado);
    },

    pedidos() {
        return this.ler(this.chaves.pedidos, []);
    },

    salvarPedidos(pedidos) {
        this.salvar(this.chaves.pedidos, pedidos);
    },

    buscarPedido(protocolo) {
        return this.pedidos().find((pedido) => pedido.protocolo === protocolo) || null;
    },

    atualizarPedido(protocolo, alteracoes) {
        const pedidos = this.pedidos();
        const indice = pedidos.findIndex((pedido) => pedido.protocolo === protocolo);

        if (indice === -1) {
            return null;
        }

        pedidos[indice] = {
            ...pedidos[indice],
            ...alteracoes,
            atualizadoEm: new Date().toISOString()
        };

        this.salvarPedidos(pedidos);
        return pedidos[indice];
    },



    atendimentos() {
        return this.ler(this.chaves.atendimentos, []);
    },

    salvarAtendimentos(atendimentos) {
        this.salvar(this.chaves.atendimentos, atendimentos);
    },

    criarAtendimento(cliente, mensagemInicial) {
        const agora = new Date().toISOString();
        const atendimentos = this.atendimentos();
        const id = `ATD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

        const atendimento = {
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
                    texto: mensagemInicial,
                    data: agora
                }
            ]
        };

        atendimentos.unshift(atendimento);
        this.salvarAtendimentos(atendimentos);
        return atendimento;
    },

    buscarAtendimento(id) {
        return this.atendimentos().find((atendimento) => atendimento.id === id) || null;
    },

    atendimentosDoCliente(cliente) {
        const emailCliente = String(cliente?.email || "").toLowerCase();
        const cpfCliente = String(cliente?.cpf || "").replace(/\D/g, "");

        return this.atendimentos().filter((atendimento) => {
            const emailAtendimento = String(atendimento.cliente?.email || "").toLowerCase();
            const cpfAtendimento = String(atendimento.cliente?.cpf || "").replace(/\D/g, "");

            if (!emailCliente && !cpfCliente) {
                return false;
            }

            return emailAtendimento === emailCliente || cpfAtendimento === cpfCliente;
        });
    },

    responderAtendimento(id, texto, funcionario = "Escrevente") {
        const atendimentos = this.atendimentos();
        const indice = atendimentos.findIndex((atendimento) => atendimento.id === id);

        if (indice === -1) {
            return null;
        }

        const agora = new Date().toISOString();
        atendimentos[indice].mensagens = atendimentos[indice].mensagens || [];
        atendimentos[indice].mensagens.push({
            autor: funcionario,
            perfil: "funcionario",
            texto,
            data: agora
        });
        atendimentos[indice].status = "Respondido";
        atendimentos[indice].atualizadoEm = agora;

        this.salvarAtendimentos(atendimentos);
        return atendimentos[indice];
    },

    gerarProtocolo() {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");
        const numero = Math.floor(1000 + Math.random() * 9000);
        return `SIGACRC-${ano}${mes}${dia}-${numero}`;
    },

    formatarData(dataISO) {
        if (!dataISO) {
            return "Não informado";
        }

        const data = new Date(dataISO);

        if (Number.isNaN(data.getTime())) {
            return dataISO;
        }

        return data.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    },

    classeStatus(status = "Pendente") {
        return status
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, "-");
    },

    obterClientePorIdentificador(identificador) {
        const normalizado = String(identificador || "").trim().toLowerCase();
        const somenteNumeros = normalizado.replace(/\D/g, "");

        return this.usuarios().find((usuario) => {
            const email = String(usuario.email || "").toLowerCase();
            const cpf = String(usuario.cpf || "").replace(/\D/g, "");
            return email === normalizado || cpf === somenteNumeros;
        }) || null;
    }
};
