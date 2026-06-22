const OPCOES_FORMULARIO = {
    estadoCivil: [
        "Solteiro(a)",
        "Divorciado(a)",
        "Viúvo(a)",
        "Casado(a)",
        "Separado(a) judicialmente"
    ],
    nacionalidade: [
        "Brasileiro(a)",
        "Português(a)",
        "Italiano(a)",
        "Espanhol(a)",
        "Argentino(a)",
        "Boliviano(a)",
        "Chileno(a)",
        "Paraguaio(a)",
        "Uruguaio(a)",
        "Outra"
    ],
    ufs: [
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
        "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
        "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ],
    rotulosDocumentos: {
        arquivo_certidoes: "Certidões atualizadas",
        arquivo_rg_noivos: "RG, CPF ou CNH dos noivos",
        arquivo_rg_testemunhas: "RG ou CNH das testemunhas",
        arquivo_residencia: "Comprovante de residência",
        arquivo_pacto: "Pacto antenupcial",
        arquivo_religioso: "Requerimento casamento religioso"
    }
};

function preencherSelectComOpcoes(select, opcoes, valorSalvo) {
    const valorAtual = valorSalvo ?? select.value ?? "";

    select.innerHTML = '<option value="">Selecione</option>';

    opcoes.forEach((opcao) => {
        const option = document.createElement("option");
        option.value = opcao;
        option.textContent = opcao;
        select.appendChild(option);
    });

    if (valorAtual) {
        select.value = valorAtual;
    }
}
