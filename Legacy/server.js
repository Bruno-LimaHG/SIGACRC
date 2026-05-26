const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());

// 🔥 LISTA DOS BAIRROS PERMITIDOS (os da imagem)
const bairrosPermitidos = [
    "JARDIM ADALGISA",
    "JARDIM BUSSOCABA",
    "JARDIM DAS FLORES",
    "JARDIM ESTER",
    "JARDIM IRACEMA",
    "JARDIM NOVO OSASCO",
    "JARDIM SANTO ANTONIO",
    "JARDIM SÃO PEDRO",
    "JARDIM SÃO MARCOS",
    "JARDIM VELOSO",
    "JARDIM BELA VISTA",
    "JARDIM ALVORADA",
    "JARDIM CALIFORNIA",
    "JARDIM D'ABRIL",
    "JARDIM FILIPINI",
    "JARDIM GUADALUPE",
    "JARDIM HELENA",
    "JARDIM MONACO",
    "JARDIM PADROEIRA",
    "JARDIM PRIMAVERA",
    "JARDIM SANTA MARIA",
    "JARDIM SÃO MIGUEL",
    "JARDIM UMUARAMA",
    "JARDIM YPE",

    "VILA YARA",
    "VILA BUSSOCABA",
    "VILA CAMPESINA",
    "VILA ISABEL",
    "VILA OSASCO",
    "VILA PESTANA",
    "VILA PRADO",
    "VILA SANTA TEREZINHA",
    "VILA SANTA CATARINA",
    "VILA YOLANDA",
    "VILA ANA MARIA",
    "VILA PIRES",
    "VILA ALIANÇA",
    "VILA JACY",
    "VILA DA CONQUISTA",

    "QUITÁUNA",
    "NOVO AMERICA",
    "KM 18",
    "METALURGICOS",
    "PARQUE DOS PRINCIPES"
];

// Rota inicial
app.get("/", (req, res) => {
    res.send("🚀 API de CEP funcionando!");
});

// 🔍 Rota para buscar CEP
app.get("/cep/:cep", async (req, res) => {
    const { cep } = req.params;

    // Validação do CEP
    if (!/^\d{8}$/.test(cep)) {
        return res.status(400).json({
            erro: "CEP inválido. Use 8 números."
        });
    }

    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

        if (response.data.erro) {
            return res.status(404).json({
                erro: "CEP não encontrado"
            });
        }

        // 👇 pega o bairro retornado pelo ViaCEP
        const bairro = response.data.bairro
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""); // remove acentos

        // 👇 verifica se o bairro está permitido
        const permitido = bairrosPermitidos.some(b =>
            bairro.includes(
                b.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            )
        );

        if (!permitido) {
            return res.status(403).json({
                erro: "CEP fora da área atendida pelo cartório"
            });
        }

        // Se estiver permitido, retorna normalmente
        res.json(response.data);

    } catch (error) {
        res.status(500).json({
            erro: "Erro ao buscar CEP"
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API rodando em http://localhost:${PORT}`);
});