document.addEventListener("DOMContentLoaded", function() {

    // BOTÕES
    document.getElementById("voltar").onclick = function() {
        window.location.href = "../formulario_1/formulario_1.html";
    };

    document.getElementById("proximo").onclick = function() {
        window.location.href = "../formulario_3/formulario_3.html";
    };

    // CAMPOS
    const cpf = document.querySelector('input[name="cpf_contraente1"]');
    const rg = document.querySelector('input[name="rg_contraente1"]');
    const celular = document.querySelector('input[name="celular_contraente1"]');
    const cep = document.querySelector('input[name="cep_contraente1"]');

    // CPF: 000.000.000-00
    cpf.addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, '').slice(0, 11);

        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

        e.target.value = value;
    });

    // RG: 00.000.000-0
    rg.addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, '').slice(0, 9);

        value = value.replace(/(\d{2})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1})$/, '$1-$2');

        e.target.value = value;
    });

    // CELULAR: (00) 00000-0000
    celular.addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, '').slice(0, 11);

        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2')
        e.target.value = value;
    });

    // CEP: 00000-000
    cep.addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, '').slice(0, 8);

        value = value.replace(/(\d{5})(\d)/, '$1-$2');

        e.target.value = value;
    });

});