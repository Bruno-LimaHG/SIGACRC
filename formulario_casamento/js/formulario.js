/*
    FORMULÁRIO DE CASAMENTO - VERSÃO MODULAR

    Estrutura:
    - index.html: página principal
    - etapas/etapa1.html até etapas/etapa8.html: conteúdo de cada etapa
    - css/formulario.css: estilo único
    - js/formulario.js: lógica única

    Importante:
    Para carregar os arquivos da pasta etapas, use o Live Server do VS Code
    ou outro servidor local. Abrir direto pelo file:// pode bloquear o fetch.
*/

// Linka cada arquivo de etapa com o formulario.js
const etapas = [
    "etapas/etapa1-dados-casamento.html", // Carrega a etapa 1: dados do casamento
    "etapas/etapa2-primeiro-contraente.html", // Carrega a etapa 2: primeiro contraente
    "etapas/etapa3-pais-primeiro-contraente.html", // Carrega a etapa 3: pais do primeiro contraente
    "etapas/etapa4-segundo-contraente.html", // Carrega a etapa 4: segundo contraente
    "etapas/etapa5-pais-segundo-contraente.html", // Carrega a etapa 5: pais do segundo contraente
    "etapas/etapa6-sobrenome.html", // Carrega a etapa 6: alteração de sobrenome
    "etapas/etapa7-testemunhas.html", // Carrega a etapa 7: testemunhas
    "etapas/etapa8-documentos-revisao.html" // Carrega a etapa 8: documentos e revisão
];

// Busca no HTML a área onde a etapa será exibida
const conteudoEtapa = document.getElementById("conteudoEtapa");
// Busca os botões de navegação do formulário
const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");
const btnFinalizar = document.getElementById("btnFinalizar");
const textoEtapa = document.getElementById("textoEtapa");
const porcentagem = document.getElementById("porcentagem");
const barraProgresso = document.getElementById("barraProgresso");
const btnContraste = document.getElementById("btnContraste");
const form = document.getElementById("formCasamento");

// Guarda qual etapa está sendo exibida no momento
let etapaAtual = 0;
// Guarda os dados preenchidos ao avançar e voltar
let dadosFormulario = {};

/* Carrega a etapa atual dentro do index.html */
// Carrega o HTML da etapa atual dentro do formulário
async function carregarEtapa() {
    salvarDadosDaEtapaAtual();

    const resposta = await fetch(etapas[etapaAtual]);
    const html = await resposta.text();

    conteudoEtapa.innerHTML = html;

    preencherCamposDaEtapa();
    atualizarProgresso();
    configurarEventosDaEtapa();

    if (etapaAtual === etapas.length - 1) {
        gerarResumo();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* Atualiza texto, porcentagem, barra e botões */
// Atualiza barra, porcentagem e botões conforme a etapa
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

/* Guarda os dados preenchidos antes de mudar de etapa */
// Salva os campos preenchidos antes de trocar de etapa
function salvarDadosDaEtapaAtual() {
    const campos = conteudoEtapa.querySelectorAll("input, select, textarea");

    campos.forEach((campo) => {
        if (campo.type === "checkbox") {
            dadosFormulario[campo.name] = campo.checked;
        } else if (campo.type === "file") {
            if (campo.files.length > 0) {
                dadosFormulario[campo.name] = campo.files[0].name;
            }
        } else {
            dadosFormulario[campo.name] = campo.value;
        }
    });
}

/* Recoloca os dados quando o usuário volta para uma etapa */
// Recoloca os dados salvos quando o usuário volta para uma etapa
function preencherCamposDaEtapa() {
    const campos = conteudoEtapa.querySelectorAll("input, select, textarea");

    campos.forEach((campo) => {
        if (dadosFormulario[campo.name] === undefined) {
            return;
        }

        if (campo.type === "checkbox") {
            campo.checked = dadosFormulario[campo.name];
        } else if (campo.type === "file") {
            return;
        } else {
            campo.value = dadosFormulario[campo.name];
        }
    });
}

/* Eventos dos botões principais */
// Avança para a próxima etapa
btnProximo.addEventListener("click", () => {
    if (validarEtapaAtual()) {
        salvarDadosDaEtapaAtual();
        etapaAtual++;
        // Inicia o formulário carregando a primeira etapa
carregarEtapa();
    }
});

// Volta para a etapa anterior
btnAnterior.addEventListener("click", () => {
    salvarDadosDaEtapaAtual();

    if (etapaAtual > 0) {
        etapaAtual--;
        carregarEtapa();
    }
});

// Finaliza o formulário sem recarregar a página
form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validarEtapaAtual()) {
        return;
    }

    salvarDadosDaEtapaAtual();
    gerarResumo();

    alert("Formulário finalizado no navegador. Depois podemos integrar com banco de dados, impressão ou envio.");
});

/* Tema alto contraste */
// Alterna entre tema normal e alto contraste
btnContraste.addEventListener("click", () => {
    document.body.classList.toggle("alto-contraste");

    const contrasteAtivo = document.body.classList.contains("alto-contraste");
    btnContraste.textContent = contrasteAtivo ? "Tema normal" : "Alto contraste";

    localStorage.setItem("altoContraste", contrasteAtivo ? "sim" : "nao");
});

/* Configura máscaras e campos condicionais sempre que uma etapa é carregada */
// Ativa máscaras, idade automática e campos condicionais da etapa
function configurarEventosDaEtapa() {
    configurarMascaras();
    configurarCalculoDeIdade();
    configurarCamposCondicionais();
    configurarAnexosDocumentos();
}

/* Validação simples */
// Verifica campos obrigatórios da etapa atual
function validarEtapaAtual() {
    limparErros();

    const camposObrigatorios = conteudoEtapa.querySelectorAll("[data-obrigatorio='true']");
    let valido = true;

    camposObrigatorios.forEach((campo) => {
        if (!campo.value.trim()) {
            mostrarErro(campo, "Este campo é obrigatório.");
            valido = false;
        }
    });

    return valido;
}

// Mostra mensagem de erro abaixo do campo
function mostrarErro(campo, mensagem) {
    campo.classList.add("erro");

    const erro = document.createElement("span");
    erro.className = "mensagem-erro";
    erro.textContent = mensagem;

    campo.parentElement.appendChild(erro);
}

// Remove erros antigos antes de validar novamente
function limparErros() {
    conteudoEtapa.querySelectorAll(".erro").forEach((campo) => campo.classList.remove("erro"));
    conteudoEtapa.querySelectorAll(".mensagem-erro").forEach((erro) => erro.remove());
}

/* Máscaras */
// Aplica máscaras nos campos da etapa carregada
function configurarMascaras() {
    conteudoEtapa.querySelectorAll(".cpf").forEach((campo) => {
        campo.addEventListener("input", () => {
            campo.value = mascaraCPF(campo.value);
        });
    });

    conteudoEtapa.querySelectorAll(".rg").forEach((campo) => {
        campo.addEventListener("input", () => {
            campo.value = mascaraRG(campo.value);
        });
    });

    conteudoEtapa.querySelectorAll(".celular").forEach((campo) => {
        campo.addEventListener("input", () => {
            campo.value = mascaraCelular(campo.value);
        });
    });

    conteudoEtapa.querySelectorAll(".cep").forEach((campo) => {
        campo.addEventListener("input", () => {
            campo.value = mascaraCEP(campo.value);
        });
    });
}

// Formata o CPF enquanto o usuário digita
function mascaraCPF(valor) {
    return valor
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .slice(0, 14);
}

// Formata o RG enquanto o usuário digita
function mascaraRG(valor) {
    return valor
        .replace(/[^\dXx]/g, "")
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})([\dXx])$/, ".$1-$2")
        .slice(0, 12);
}

// Formata o celular enquanto o usuário digita
function mascaraCelular(valor) {
    return valor
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
        .slice(0, 15);
}

// Formata o CEP enquanto o usuário digita
function mascaraCEP(valor) {
    return valor
        .replace(/\D/g, "")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 9);
}

/* Cálculo automático de idade */
// Calcula a idade pela data de nascimento
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

// Retorna a idade com base na data informada
function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    return idade;
}

/* Campos que aparecem somente em alguns casos */
// Configura campos que aparecem apenas em certas respostas
function configurarCamposCondicionais() {
    conteudoEtapa.querySelectorAll("[data-condicional]").forEach((select) => {
        controlarCondicionalEstadoCivil(select);

        select.addEventListener("change", () => {
            controlarCondicionalEstadoCivil(select);
        });
    });

    conteudoEtapa.querySelectorAll("[data-falecido]").forEach((select) => {
        controlarCondicionalFalecido(select);

        select.addEventListener("change", () => {
            controlarCondicionalFalecido(select);
        });
    });
}

// Mostra campos extras para divorciado ou viúvo
function controlarCondicionalEstadoCivil(select) {
    const box = document.getElementById(select.dataset.condicional);

    if (!box) {
        return;
    }

    const valor = select.value.toLowerCase();

    if (valor.includes("divorciado") || valor.includes("viúvo") || valor.includes("viuvo")) {
        box.classList.remove("oculto");
    } else {
        box.classList.add("oculto");
    }
}

// Mostra data de falecimento quando marcado como falecido
function controlarCondicionalFalecido(select) {
    const box = document.getElementById(select.dataset.falecido);

    if (!box) {
        return;
    }

    if (select.value === "Sim") {
        box.classList.remove("oculto");
    } else {
        box.classList.add("oculto");
    }
}


/* Marca automaticamente o checklist quando um documento é anexado */
function configurarAnexosDocumentos() {
    conteudoEtapa.querySelectorAll(".arquivo-documento").forEach((inputArquivo) => {
        inputArquivo.addEventListener("change", () => {
            const checkId = inputArquivo.dataset.check;
            const checkbox = document.getElementById(checkId);
            const botaoAnexo = inputArquivo.closest(".btn-anexo");

            if (!checkbox || !botaoAnexo) {
                return;
            }

            if (inputArquivo.files.length > 0) {
                checkbox.checked = true;
                dadosFormulario[checkbox.name] = true;
                dadosFormulario[inputArquivo.name] = inputArquivo.files[0].name;
                botaoAnexo.childNodes[0].textContent = "Arquivo anexado";
            } else {
                checkbox.checked = false;
                dadosFormulario[checkbox.name] = false;
                dadosFormulario[inputArquivo.name] = "";
                botaoAnexo.childNodes[0].textContent = "Anexar documento";
            }
        });

        const nomeArquivoSalvo = dadosFormulario[inputArquivo.name];

        if (nomeArquivoSalvo) {
            const checkId = inputArquivo.dataset.check;
            const checkbox = document.getElementById(checkId);
            const botaoAnexo = inputArquivo.closest(".btn-anexo");

            if (checkbox) {
                checkbox.checked = true;
            }

            if (botaoAnexo) {
                botaoAnexo.childNodes[0].textContent = "Arquivo anexado";
            }
        }
    });
}

/* Resumo final */
// Monta o resumo final com os principais dados preenchidos
function gerarResumo() {
    const resumo = document.getElementById("resumo");

    if (!resumo) {
        return;
    }

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
        </ul>
    `;
}

/* Início */
// Recupera a preferência de alto contraste salva no navegador
if (localStorage.getItem("altoContraste") === "sim") {
    document.body.classList.add("alto-contraste");
    btnContraste.textContent = "Tema normal";
}

carregarEtapa();
