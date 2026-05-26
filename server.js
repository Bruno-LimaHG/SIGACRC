const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(__dirname)); // serve HTML, CSS e JS

// rota raiz
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// rota da API
app.get("/cep/:cep", async (req, res) => {
    const { cep } = req.params;

    if (!/^\d{8}$/.test(cep)) {
        return res.status(400).json({
            erro: "CEP inválido"
        });
    }

    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

        if (response.data.erro) {
            return res.status(404).json({
                erro: "CEP não encontrado"
            });
        }

        const cidade = response.data.localidade || "";
        const uf = response.data.uf || "";

        if (cidade.toUpperCase() !== "OSASCO" || uf.toUpperCase() !== "SP") {
            return res.status(403).json({
                erro: "CEP fora do município de Osasco"
            });
        }

        res.json(response.data);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            erro: "Erro ao se comunicar com a API"
        });
    }
});

app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
});