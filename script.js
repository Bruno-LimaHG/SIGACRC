// Máscara automática no campo CEP
const cepInput = document.getElementById("cep");

cepInput.addEventListener("input", function () {
    let valor = cepInput.value.replace(/\D/g, ""); // tira tudo que não for número

    if (valor.length > 5) {
        valor = valor.slice(0, 5) + "-" + valor.slice(5, 8);
    }

    cepInput.value = valor;
});


// Função para buscar CEP
async function buscarCEP() {
    // Remove o hífen antes de enviar
    const cep = document.getElementById("cep").value.replace(/\D/g, "");
    const resultado = document.getElementById("resultado");

    // Validação
    if (cep.length !== 8) {
        resultado.innerHTML = `<p>CEP inválido</p>`;
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/cep/${cep}`);
        const data = await response.json();

        if (!response.ok) {
            resultado.innerHTML = `<p>${data.erro}</p>`;
            return;
        }

        resultado.innerHTML = `
            <p><strong>CEP:</strong> ${data.cep}</p>
            <p><strong>Rua:</strong> ${data.logradouro}</p>
            <p><strong>Bairro:</strong> ${data.bairro}</p>
            <p><strong>Cidade:</strong> ${data.localidade}</p>
        `;

    } catch (error) {
        resultado.innerHTML = `<p>Erro ao conectar com a API</p>`;
    }
}