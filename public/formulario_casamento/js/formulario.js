// =========================================================
// SIGACRC - Formulário de casamento em 8 etapas
// Integra CEP, valida campos, salva pedido e gera protocolo.
// =========================================================
// Bloqueia acesso direto ao formulário sem login do cliente.
const clienteLogadoFormulario = SIGACRC.clienteLogado();

if (!clienteLogadoFormulario) {
    sessionStorage.setItem("avisoLoginSIGACRC", "Para iniciar um novo pedido de casamento civil, faça login na Área do Cliente ou crie seu cadastro.");
    sessionStorage.setItem("destinoAposLoginSIGACRC", window.location.href);
    window.location.replace("../login_clientes/login_clientes.html?aviso=formulario");
    throw new Error("Login do cliente obrigatório para acessar o formulário.");
}

const etapas = [
    "etapas/etapa1-dados-casamento.html",
    "etapas/etapa2-primeiro-contraente.html",
    "etapas/etapa3-pais-primeiro-contraente.html",
    "etapas/etapa4-segundo-contraente.html",
    "etapas/etapa5-pais-segundo-contraente.html",
    "etapas/etapa6-sobrenome.html",
    "etapas/etapa7-testemunhas.html",
    "etapas/etapa8-documentos-revisao.html"
];

const camposObrigatoriosPorEtapa = {
    0: ["data_casamento", "tipo_cerimonia", "regime_bens"],
    1: [
        "nome_contraente1", "nascimento_contraente1", "estado_civil_contraente1",
        "nacionalidade_contraente1", "naturalidade_contraente1", "profissao_contraente1",
        "cpf_contraente1", "rg_contraente1", "email_contraente1", "celular_contraente1",
        "cep_contraente1", "logradouro_contraente1", "numero_contraente1",
        "bairro_contraente1", "cidade_contraente1", "uf_contraente1"
    ],
    2: ["pai_nome1", "pai_falecido1", "mae_nome1", "mae_falecida1"],
    3: [
        "nome_contraente2", "nascimento_contraente2", "estado_civil_contraente2",
        "nacionalidade_contraente2", "naturalidade_contraente2", "profissao_contraente2",
        "cpf_contraente2", "rg_contraente2", "email_contraente2", "celular_contraente2",
        "cep_contraente2", "logradouro_contraente2", "numero_contraente2",
        "bairro_contraente2", "cidade_contraente2", "uf_contraente2"
    ],
    4: ["pai_nome2", "pai_falecido2", "mae_nome2", "mae_falecida2"],
    6: [
        "testemunha1_nome", "testemunha1_idade", "testemunha1_rg", "testemunha1_rua",
        "testemunha1_numero", "testemunha1_bairro", "testemunha1_cidade", "testemunha1_uf",
        "testemunha2_nome", "testemunha2_idade", "testemunha2_rg", "testemunha2_rua",
        "testemunha2_numero", "testemunha2_bairro", "testemunha2_cidade", "testemunha2_uf"
    ]
};

const documentosObrigatoriosBase = [
    { check: "doc_certidoes", arquivo: "arquivo_certidoes", nomeDocumento: "Certidões atualizadas" },
    { check: "doc_rg_noivos", arquivo: "arquivo_rg_noivos", nomeDocumento: "RG, CPF ou CNH dos noivos" },
    { check: "doc_rg_testemunhas", arquivo: "arquivo_rg_testemunhas", nomeDocumento: "RG ou CNH das testemunhas" },
    { check: "doc_residencia", arquivo: "arquivo_residencia", nomeDocumento: "Comprovante de residência" }
];

const conteudoEtapa = document.getElementById("conteudoEtapa");
const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");
const btnFinalizar = document.getElementById("btnFinalizar");
const textoEtapa = document.getElementById("textoEtapa");
const porcentagem = document.getElementById("porcentagem");
const barraProgresso = document.getElementById("barraProgresso");
const btnContraste = document.getElementById("btnContraste");
const form = document.getElementById("formCasamento");
const mensagemFormulario = document.getElementById("mensagemFormulario");

const API_CEP_URL = window.location.origin.startsWith("http")
    ? `${window.location.origin}/cep`
    : "http://localhost:3000/cep";

let etapaAtual = 0;
let dadosFormulario = {};

async function carregarEtapa() {
    salvarDadosDaEtapaAtual();

    try {
        const resposta = await fetch(etapas[etapaAtual]);
        const html = await resposta.text();
        conteudoEtapa.innerHTML = html;
    } catch (error) {
        conteudoEtapa.innerHTML = `
            <div class="aviso">
                Não foi possível carregar a etapa. Abra o projeto pelo servidor usando <strong>npm start</strong>.
            </div>
        `;
        return;
    }

    preencherCamposDaEtapa();
    marcarCamposObrigatorios();
    atualizarProgresso();
    configurarEventosDaEtapa();
    limparMensagemFormulario();

    if (etapaAtual === etapas.length - 1) {
        gerarResumo();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function atualizarProgresso() {
    const total = etapas.length;
    const progresso = Math.round(((etapaAtual + 1) / total) * 100);

    textoEtapa.textContent = `Etapa ${etapaAtual + 1} de ${total}`;
    porcentagem.textContent = `${progresso}%`;
    barraProgresso.style.width = `${progresso}%`;

    btnAnterior.style.visibility = etapaAtual === 0 ? "hidden" : "visible";
    btnProximo.classList.toggle("oculto", etapaAtual === total - 1);
    btnFinalizar.classList.toggle("oculto", etapaAtual !== total - 1);
}

function salvarDadosDaEtapaAtual() {
    if (!conteudoEtapa) {
        return;
    }

    const campos = conteudoEtapa.querySelectorAll("input, select, textarea");

    campos.forEach((campo) => {
        if (!campo.name) {
            return;
        }

        if (campo.type === "checkbox") {
            dadosFormulario[campo.name] = campo.checked;
        } else if (campo.type === "file") {
            return;
        } else {
            dadosFormulario[campo.name] = campo.value;
        }
    });
}

function preencherCamposDaEtapa() {
    const campos = conteudoEtapa.querySelectorAll("input, select, textarea");

    campos.forEach((campo) => {
        if (!campo.name || dadosFormulario[campo.name] === undefined) {
            return;
        }

        if (campo.type === "checkbox") {
            campo.checked = dadosFormulario[campo.name];
        } else if (campo.type !== "file") {
            campo.value = dadosFormulario[campo.name];
        }
    });
}

function marcarCamposObrigatorios() {
    const obrigatorios = camposObrigatoriosPorEtapa[etapaAtual] || [];

    obrigatorios.forEach((nome) => {
        const campo = conteudoEtapa.querySelector(`[name="${nome}"]`);
        const label = campo ? conteudoEtapa.querySelector(`label[for="${campo.id}"]`) : null;

        if (campo) {
            campo.dataset.obrigatorio = "true";
        }

        if (label && !label.textContent.includes("*")) {
            label.textContent = `${label.textContent} *`;
        }
    });
}

btnProximo.addEventListener("click", async () => {
    if (await validarEtapaAtual()) {
        salvarDadosDaEtapaAtual();
        etapaAtual++;
        carregarEtapa();
    }
});

btnAnterior.addEventListener("click", () => {
    salvarDadosDaEtapaAtual();

    if (etapaAtual > 0) {
        etapaAtual--;
        carregarEtapa();
    }
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!(await validarEtapaAtual())) {
        return;
    }

    salvarDadosDaEtapaAtual();
    gerarResumo();

    const pedido = montarPedidoParaEnvio();
    const cliente = SIGACRC.clienteLogado();

    try {
        const tokenHeader = cliente && cliente.token ? { 'Authorization': `Bearer ${cliente.token}` } : { 'x-user-id': cliente ? cliente.id : 'sem-id' };
        
        const method = protocoloEdicao ? 'PUT' : 'POST';
        const url = protocoloEdicao ? `/api/pedidos/${protocoloEdicao}` : '/api/pedidos';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...tokenHeader
            },
            body: JSON.stringify(pedido)
        });

        if (response.ok) {
            const result = await response.json();
            localStorage.setItem(SIGACRC.chaves.ultimoProtocolo, result.id || pedido.protocolo);
            exibirMensagemFormulario(`Pedido enviado com sucesso. Protocolo gerado: ${result.id || pedido.protocolo}`, "sucesso");

            setTimeout(() => {
                window.location.href = "../protocolo/protocolo.html";
            }, 900);
        } else {
            const err = await response.json().catch(() => ({}));
            if (response.status === 401 || response.status === 403) {
                exibirMensagemFormulario("Sua sessão expirou. Por favor, faça login novamente na aba ao lado ou recarregue a página após logar para enviar seu pedido (seus dados preenchidos continuarão na tela).", "erro");
            } else {
                exibirMensagemFormulario(`Erro ao enviar pedido: ${err.erro || 'Falha no servidor'}`, "erro");
            }
        }
    } catch (error) {
        exibirMensagemFormulario("Erro de conexão com o servidor.", "erro");
    }
});

btnContraste.addEventListener("click", () => {
    document.body.classList.toggle("alto-contraste");
    const contrasteAtivo = document.body.classList.contains("alto-contraste");

    btnContraste.setAttribute("aria-label", contrasteAtivo ? "Ativar tema normal" : "Ativar alto contraste");
    localStorage.setItem("altoContraste", contrasteAtivo ? "sim" : "nao");
});

function configurarEventosDaEtapa() {
    configurarMascaras();
    configurarBuscaCEP();
    configurarCalculoDeIdade();
    configurarCamposCondicionais();
    configurarAnexosDocumentos();
}

async function validarEtapaAtual() {
    limparErros();
    limparMensagemFormulario();

    let valido = true;
    const camposObrigatorios = conteudoEtapa.querySelectorAll("[data-obrigatorio='true']");

    camposObrigatorios.forEach((campo) => {
        if (!String(campo.value || "").trim()) {
            mostrarErro(campo, "Este campo é obrigatório.");
            valido = false;
        }
    });

    if (!validarCamposEspecificos()) {
        valido = false;
    }

    const cepsValidos = await validarCEPsDaEtapa();

    if (etapaAtual === etapas.length - 1 && !validarDocumentosObrigatorios()) {
        valido = false;
    }

    if (!valido || !cepsValidos) {
        exibirMensagemFormulario("Revise os campos destacados antes de continuar.", "erro");
    }

    return valido && cepsValidos;
}

function validarCPFReal(cpfStr) {
    let cpf = cpfStr.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
}

function criarDataLocalSegura(dataString) {
    const [ano, mes, dia] = dataString.split("-");
    return new Date(parseInt(ano, 10), parseInt(mes, 10) - 1, parseInt(dia, 10));
}

function validarCamposEspecificos() {
    let valido = true;

    conteudoEtapa.querySelectorAll("input[type='email']").forEach((campo) => {
        if (campo.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campo.value)) {
            mostrarErro(campo, "Informe um e-mail válido.");
            valido = false;
        }
    });

    conteudoEtapa.querySelectorAll(".cpf").forEach((campo) => {
        if (campo.value && !validarCPFReal(campo.value)) {
            mostrarErro(campo, "Informe um CPF válido.");
            valido = false;
        }
    });

    ["nascimento_contraente1", "nascimento_contraente2"].forEach((id) => {
        const campo = document.getElementById(id);
        if (!campo || !campo.value) {
            return;
        }

        const idade = calcularIdade(campo.value);
        if (idade < 16) {
            mostrarErro(campo, "A idade mínima configurada para o protótipo é 16 anos.");
            valido = false;
        }
    });

    ["testemunha1_idade", "testemunha2_idade"].forEach((id) => {
        const campo = document.getElementById(id);
        if (!campo || !campo.value) {
            return;
        }

        if (Number(campo.value) < 18) {
            mostrarErro(campo, "A testemunha deve ser maior de 18 anos.");
            valido = false;
        }
    });

    const dataCasamento = document.getElementById("data_casamento");
    if (dataCasamento?.value) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataInformada = criarDataLocalSegura(dataCasamento.value);

        if (dataInformada < hoje) {
            mostrarErro(dataCasamento, "A data provável não pode ser anterior à data atual.");
            valido = false;
        }
    }

    return valido;
}

function validarDocumentosObrigatorios() {
    const documentos = obterDocumentosObrigatorios();
    let valido = true;

    documentos.forEach((doc) => {
        const checkbox = document.getElementById(doc.check);
        const item = checkbox?.closest(".item-documento");

        if (!dadosFormulario[doc.arquivo]?.nome) {
            valido = false;

            if (item) {
                item.classList.add("erro-documento");
                const erro = document.createElement("span");
                erro.className = "mensagem-erro";
                erro.textContent = "Documento obrigatório para finalizar.";
                item.appendChild(erro);
            }
        }
    });

    return valido;
}

function obterDocumentosObrigatorios() {
    const documentos = [...documentosObrigatoriosBase];

    if (dadosFormulario.regime_bens && dadosFormulario.regime_bens !== "Comunhão parcial de bens") {
        documentos.push({ check: "doc_pacto", arquivo: "arquivo_pacto", nomeDocumento: "Pacto antenupcial" });
    }

    if (String(dadosFormulario.tipo_cerimonia || "").toLowerCase().includes("religioso")) {
        documentos.push({ check: "doc_religioso", arquivo: "arquivo_religioso", nomeDocumento: "Requerimento religioso com efeito civil" });
    }

    return documentos;
}

function mostrarErro(campo, mensagem) {
    campo.classList.add("erro");

    const erro = document.createElement("span");
    erro.className = "mensagem-erro";
    erro.textContent = mensagem;

    campo.parentElement.appendChild(erro);
}

function limparErros() {
    conteudoEtapa.querySelectorAll(".erro").forEach((campo) => campo.classList.remove("erro"));
    conteudoEtapa.querySelectorAll(".erro-documento").forEach((item) => item.classList.remove("erro-documento"));
    conteudoEtapa.querySelectorAll(".mensagem-erro").forEach((erro) => erro.remove());
}

function configurarMascaras() {
    conteudoEtapa.querySelectorAll(".cpf").forEach((campo) => {
        campo.addEventListener("input", () => campo.value = mascaraCPF(campo.value));
    });

    conteudoEtapa.querySelectorAll(".rg").forEach((campo) => {
        campo.addEventListener("input", () => campo.value = mascaraRG(campo.value));
    });

    conteudoEtapa.querySelectorAll(".celular").forEach((campo) => {
        campo.addEventListener("input", () => campo.value = mascaraCelular(campo.value));
    });

    conteudoEtapa.querySelectorAll(".cep").forEach((campo) => {
        campo.addEventListener("input", () => campo.value = mascaraCEP(campo.value));
    });
}

function mascaraCPF(valor) {
    return valor
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .slice(0, 14);
}

function mascaraRG(valor) {
    return valor
        .replace(/[^\dXx]/g, "")
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})([\dXx])$/, ".$1-$2")
        .slice(0, 12);
}

function mascaraCelular(valor) {
    return valor
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
        .slice(0, 15);
}

function mascaraCEP(valor) {
    return valor
        .replace(/\D/g, "")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 9);
}

function configurarBuscaCEP() {
    conteudoEtapa.querySelectorAll(".cep").forEach((campo) => {
        let tempoConsultaCEP;

        campo.addEventListener("input", () => {
            const cep = campo.value.replace(/\D/g, "");
            const sufixo = obterSufixoEndereco(campo);

            dadosFormulario[`cep_validado_${sufixo}`] = "nao";
            limparMensagemCEP(campo);
            clearTimeout(tempoConsultaCEP);

            if (cep.length === 8) {
                tempoConsultaCEP = setTimeout(() => consultarCEP(campo), 500);
            }
        });

        campo.addEventListener("blur", () => {
            const cep = campo.value.replace(/\D/g, "");
            if (cep.length === 8) {
                consultarCEP(campo);
            }
        });
    });
}

async function validarCEPsDaEtapa() {
    const camposCEP = conteudoEtapa.querySelectorAll(".cep");
    let valido = true;

    for (const campo of camposCEP) {
        const cep = campo.value.replace(/\D/g, "");

        if (!cep) {
            continue;
        }

        if (cep.length !== 8) {
            campo.classList.add("erro");
            exibirMensagemCEP(campo, "Informe um CEP com 8 números.", "erro");
            valido = false;
            continue;
        }

        const cepValido = await consultarCEP(campo, true);
        if (!cepValido) {
            valido = false;
        }
    }

    return valido;
}

async function consultarCEP(campo, forcarConsulta = false) {
    const cep = campo.value.replace(/\D/g, "");
    const sufixo = obterSufixoEndereco(campo);
    const chaveValidacao = `cep_validado_${sufixo}`;

    if (cep.length !== 8) {
        return false;
    }

    if (!forcarConsulta && campo.dataset.ultimoCepConsultado === cep && dadosFormulario[chaveValidacao] === "sim") {
        return true;
    }

    campo.dataset.ultimoCepConsultado = cep;
    exibirMensagemCEP(campo, "Consultando CEP na API...", "carregando");

    try {
        const resposta = await fetch(`${API_CEP_URL}/${cep}`);
        const dadosCEP = await resposta.json();

        if (resposta.status === 403) {
            throw new Error(dadosCEP.erro || "Apenas endereços de Osasco/SP são aceitos por este cartório.");
        }

        if (!resposta.ok) {
            throw new Error(dadosCEP.erro || "CEP não validado pela API.");
        }

        preencherEnderecoPeloCEP(sufixo, dadosCEP);
        campo.classList.remove("erro");
        dadosFormulario[chaveValidacao] = "sim";
        dadosFormulario[campo.name] = campo.value;

        exibirMensagemCEP(
            campo,
            `CEP validado: ${dadosCEP.logradouro || "endereço sem logradouro"}, ${dadosCEP.localidade}/${dadosCEP.uf}.`,
            "sucesso"
        );

        return true;
    } catch (error) {
        campo.classList.add("erro");
        dadosFormulario[chaveValidacao] = "nao";

        const mensagemErro = error instanceof TypeError
            ? "Não foi possível conectar à API. Inicie o servidor com npm start."
            : error.message || "CEP não validado pela API.";

        exibirMensagemCEP(campo, mensagemErro, "erro");
        return false;
    }
}

function obterSufixoEndereco(campo) {
    return campo.id.replace("cep_", "");
}

function preencherEnderecoPeloCEP(sufixo, dadosCEP) {
    const camposEndereco = {
        [`logradouro_${sufixo}`]: dadosCEP.logradouro || "",
        [`bairro_${sufixo}`]: dadosCEP.bairro || "",
        [`cidade_${sufixo}`]: dadosCEP.localidade || "",
        [`uf_${sufixo}`]: dadosCEP.uf || ""
    };

    Object.entries(camposEndereco).forEach(([idCampo, valor]) => {
        const campoEndereco = document.getElementById(idCampo);

        if (!campoEndereco) {
            return;
        }

        campoEndereco.value = valor;
        dadosFormulario[campoEndereco.name] = valor;
    });

    const campoEnderecoCompleto = document.getElementById(`endereco_${sufixo}`);
    if (campoEnderecoCompleto) {
        let texto = "";
        if (dadosCEP.logradouro) texto += dadosCEP.logradouro;
        if (dadosCEP.bairro) texto += (texto ? ", " : "") + dadosCEP.bairro;
        if (dadosCEP.localidade) texto += (texto ? " - " : "") + dadosCEP.localidade;
        if (dadosCEP.uf) texto += " / " + dadosCEP.uf;
        
        campoEnderecoCompleto.value = texto;
        dadosFormulario[campoEnderecoCompleto.name] = texto;
    }
}

function exibirMensagemCEP(campo, mensagem, tipo) {
    limparMensagemCEP(campo);

    const elemento = document.createElement("span");
    elemento.className = `mensagem-cep mensagem-cep-${tipo}`;
    elemento.textContent = mensagem;

    campo.parentElement.appendChild(elemento);
}

function limparMensagemCEP(campo) {
    campo.parentElement.querySelectorAll(".mensagem-cep").forEach((mensagem) => mensagem.remove());
}

function configurarCalculoDeIdade() {
    conteudoEtapa.querySelectorAll("[data-calcula-idade]").forEach((campoData) => {
        campoData.addEventListener("change", () => {
            const campoIdade = document.getElementById(campoData.dataset.calculaIdade);

            if (!campoData.value || !campoIdade) {
                return;
            }

            campoIdade.value = calcularIdade(campoData.value);
            dadosFormulario[campoIdade.name] = campoIdade.value;
        });
    });
}

function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const [ano, mes, dia] = dataNascimento.split("-");
    const nascimento = new Date(parseInt(ano, 10), parseInt(mes, 10) - 1, parseInt(dia, 10));

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    return idade;
}

function configurarCamposCondicionais() {
    conteudoEtapa.querySelectorAll("[data-condicional]").forEach((select) => {
        controlarCondicionalEstadoCivil(select);
        select.addEventListener("change", () => controlarCondicionalEstadoCivil(select));
    });

    conteudoEtapa.querySelectorAll("[data-falecido]").forEach((select) => {
        controlarCondicionalFalecido(select);
        select.addEventListener("change", () => controlarCondicionalFalecido(select));
    });
}

function controlarCondicionalEstadoCivil(select) {
    const box = document.getElementById(select.dataset.condicional);

    if (!box) {
        return;
    }

    const valor = select.value.toLowerCase();
    box.classList.toggle("oculto", !(valor.includes("divorciado") || valor.includes("viúvo") || valor.includes("viuvo")));
}

function controlarCondicionalFalecido(select) {
    const box = document.getElementById(select.dataset.falecido);

    if (!box) {
        return;
    }

    box.classList.toggle("oculto", select.value !== "Sim");
}

function configurarAnexosDocumentos() {
    conteudoEtapa.querySelectorAll(".arquivo-documento").forEach((inputArquivo) => {
        const checkId = inputArquivo.dataset.check;
        const checkbox = document.getElementById(checkId);
        const itemDocumento = inputArquivo.closest(".item-documento");
        const botaoAnexo = inputArquivo.closest(".btn-anexo");
        const infoArquivo = itemDocumento.querySelector(`[data-info="${inputArquivo.name}"]`);
        const nomeArquivo = infoArquivo.querySelector(".nome-arquivo");
        const btnVer = infoArquivo.querySelector(".btn-ver-arquivo");
        const btnRemover = infoArquivo.querySelector(".btn-remover-arquivo");

        atualizarVisualArquivo();

        inputArquivo.addEventListener("change", () => {
            if (!checkbox || !botaoAnexo || !infoArquivo) {
                return;
            }

            if (inputArquivo.files.length > 0) {
                const arquivo = inputArquivo.files[0];

                if (dadosFormulario[inputArquivo.name]?.url) {
                    URL.revokeObjectURL(dadosFormulario[inputArquivo.name].url);
                }

                const leitor = new FileReader();
                leitor.onload = (e) => {
                    dadosFormulario[inputArquivo.name] = {
                        nome: arquivo.name,
                        tipo: arquivo.type,
                        tamanho: arquivo.size,
                        url: URL.createObjectURL(arquivo),
                        dados: e.target.result
                    };
                    dadosFormulario[checkbox.name] = true;
                    atualizarVisualArquivo();
                };
                leitor.readAsDataURL(arquivo);
            }
        });

        btnVer.addEventListener("click", () => {
            const arquivoSalvo = dadosFormulario[inputArquivo.name];

            if (!arquivoSalvo || !arquivoSalvo.url) {
                exibirMensagemFormulario("Nenhum arquivo foi anexado neste item.", "erro");
                return;
            }

            window.open(arquivoSalvo.url, "_blank");
        });

        btnRemover.addEventListener("click", () => {
            const arquivoSalvo = dadosFormulario[inputArquivo.name];

            if (arquivoSalvo?.url) {
                URL.revokeObjectURL(arquivoSalvo.url);
            }

            delete dadosFormulario[inputArquivo.name];

            if (checkbox) {
                checkbox.checked = false;
                dadosFormulario[checkbox.name] = false;
            }

            inputArquivo.value = "";
            atualizarVisualArquivo();
        });

        function atualizarVisualArquivo() {
            const arquivoSalvo = dadosFormulario[inputArquivo.name];

            if (arquivoSalvo && arquivoSalvo.nome) {
                checkbox.checked = true;
                nomeArquivo.textContent = arquivoSalvo.nome;
                infoArquivo.classList.remove("oculto");
                botaoAnexo.childNodes[0].textContent = "Trocar arquivo";
            } else {
                checkbox.checked = false;
                nomeArquivo.textContent = "";
                infoArquivo.classList.add("oculto");
                botaoAnexo.childNodes[0].textContent = "Anexar documento";
            }
        }
    });
}

function gerarResumo() {
    const resumo = document.getElementById("resumo");

    if (!resumo) {
        return;
    }

    const documentos = montarListaDocumentosParaPedido();

    resumo.innerHTML = `
        <h3>Resumo do formulário</h3>
        <ul>
            <li><strong>Data provável:</strong> ${dadosFormulario.data_casamento || "Não informada"}</li>
            <li><strong>Tipo de cerimônia:</strong> ${dadosFormulario.tipo_cerimonia || "Não informado"}</li>
            <li><strong>Regime de bens:</strong> ${dadosFormulario.regime_bens || "Não informado"}</li>
            <li><strong>1º contraente:</strong> ${dadosFormulario.nome_contraente1 || "Não informado"}</li>
            <li><strong>2º contraente:</strong> ${dadosFormulario.nome_contraente2 || "Não informado"}</li>
            <li><strong>Testemunha 1:</strong> ${dadosFormulario.testemunha1_nome || "Não informada"}</li>
            <li><strong>Testemunha 2:</strong> ${dadosFormulario.testemunha2_nome || "Não informada"}</li>
            <li><strong>Documentos anexados:</strong> ${documentos.filter((doc) => doc.anexado).length} de ${documentos.length}</li>
        </ul>
    `;
}

function montarListaDocumentosParaPedido() {
    const todosDocumentos = [
        ...documentosObrigatoriosBase,
        { check: "doc_pacto", arquivo: "arquivo_pacto", nomeDocumento: "Pacto antenupcial" },
        { check: "doc_religioso", arquivo: "arquivo_religioso", nomeDocumento: "Requerimento religioso com efeito civil" }
    ];

    return todosDocumentos.map((doc) => ({
        nomeDocumento: doc.nomeDocumento,
        nomeArquivo: dadosFormulario[doc.arquivo]?.nome || "",
        anexado: Boolean(dadosFormulario[doc.arquivo]?.nome),
        obrigatorio: obterDocumentosObrigatorios().some((obrigatorio) => obrigatorio.arquivo === doc.arquivo)
    }));
}

function montarDadosLimpos() {
    const dadosLimpos = {};

    Object.entries(dadosFormulario).forEach(([chave, valor]) => {
        if (chave.startsWith("arquivo_")) {
            dadosLimpos[chave] = valor?.nome || "";
            return;
        }

        dadosLimpos[chave] = valor;
    });

    return dadosLimpos;
}

function montarAnexosBase64ParaPedido() {
    const anexos = [];
    Object.keys(dadosFormulario).forEach((chave) => {
        if (chave.startsWith("arquivo_") && dadosFormulario[chave]?.dados) {
            anexos.push({
                id: chave,
                rotulo: chave.replace("arquivo_", "Documento: "),
                nome: dadosFormulario[chave].nome,
                dados: dadosFormulario[chave].dados
            });
        }
    });
    return anexos;
}

function montarPedidoParaEnvio() {
    const cliente = SIGACRC.clienteLogado() || {
        nome: dadosFormulario.nome_contraente1 || "Cliente não identificado",
        email: dadosFormulario.email_contraente1 || "",
        cpf: dadosFormulario.cpf_contraente1 ? dadosFormulario.cpf_contraente1.replace(/\D/g, "") : ""
    };

    const protocolo = SIGACRC.gerarProtocolo();

    return {
        protocolo,
        status: "Pendente",
        enviadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        cliente,
        resumo: {
            contraente1: dadosFormulario.nome_contraente1 || "Não informado",
            contraente2: dadosFormulario.nome_contraente2 || "Não informado",
            tipoCerimonia: dadosFormulario.tipo_cerimonia || "Não informado",
            regimeBens: dadosFormulario.regime_bens || "Não informado",
            dataCasamento: dadosFormulario.data_casamento || "Não informada"
        },
        dados: montarDadosLimpos(),
        documentos: montarListaDocumentosParaPedido(),
        documentosAnexos: montarAnexosBase64ParaPedido(),
        observacaoEscrevente: "",
        historico: [
            {
                data: new Date().toISOString(),
                descricao: "Pedido enviado pelo cliente e registrado no SIGACRC."
            }
        ]
    };
}

function exibirMensagemFormulario(texto, tipo = "") {
    if (!mensagemFormulario) {
        return;
    }

    mensagemFormulario.className = `aviso mensagem-formulario ${tipo}`;
    mensagemFormulario.textContent = texto;
    mensagemFormulario.classList.remove("oculto");
}

function limparMensagemFormulario() {
    if (mensagemFormulario) {
        mensagemFormulario.classList.add("oculto");
        mensagemFormulario.textContent = "";
    }
}

if (localStorage.getItem("altoContraste") === "sim") {
    document.body.classList.add("alto-contraste");
    btnContraste.setAttribute("aria-label", "Ativar tema normal");
}

let protocoloEdicao = null;

async function inicializarFormulario() {
    const urlParams = new URLSearchParams(window.location.search);
    const editar = urlParams.get("editar");

    if (editar) {
        try {
            const resposta = await fetch(`/api/pedidos`);
            const pedidos = await resposta.json();
            const p = pedidos.find(x => x.id === editar);
            if (p) {
                if (p.dadosCompletos) {
                    dadosFormulario = { ...p.dadosCompletos };
                } else {
                    // Fallback to minimal data
                    dadosFormulario = {
                        data_casamento: p.data,
                        tipo_cerimonia: p.tipo,
                        nome_contraente1: p.solicitante,
                        cpf_contraente1: p.cpf,
                        nome_contraente2: p.conjuge,
                    };
                }
                protocoloEdicao = p.id;
            }
        } catch (error) {
            console.error("Erro ao carregar pedido para edição:", error);
        }
    }
    carregarEtapa();
}

inicializarFormulario();
