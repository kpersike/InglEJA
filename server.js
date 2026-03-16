const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Configurações
const PORT = 3000;
const DATA_PATH = path.join(__dirname, 'data', 'users.json');

app.use(express.json());
app.use(express.static('public'));

// Função de leitura robusta
const getUsers = () => {
    try {
        if (!fs.existsSync(DATA_PATH)) return [];
        const content = fs.readFileSync(DATA_PATH, 'utf8');
        if (!content.trim()) return [];
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("❌ Erro na leitura do JSON:", error.message);
        return [];
    }
};

// Rota de Cadastro
app.post('/api/cadastro', (req, res) => {
    try {
        console.log("📥 [Cadastro] Dados recebidos:", req.body);
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
        }

        let usuarios = getUsers();
        const usuarioExiste = usuarios.some(u => u && u.email === email);
        
        if (usuarioExiste) {
            return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
        }

        usuarios.push({ nome, email, senha });
        fs.writeFileSync(DATA_PATH, JSON.stringify(usuarios, null, 2));
        
        console.log("✅ [Cadastro] Usuário salvo com sucesso!");
        res.json({ mensagem: "Cadastro realizado com sucesso!" });
    } catch (err) {
        console.error("🔥 [Cadastro] Erro crítico:", err);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

// Rota de Login
app.post('/api/login', (req, res) => {
    try {
        console.log("🔑 [Login] Tentativa para:", req.body.email);
        const { email, senha } = req.body;
        const usuarios = getUsers();
        
        // Procura usuário com e-mail e senha correspondentes
        const usuario = usuarios.find(u => u && u.email === email && u.senha === senha);

        if (usuario) {
            console.log("✨ [Login] Sucesso:", usuario.nome);
            res.json({ mensagem: `Bem-vindo, ${usuario.nome}!`, sucesso: true });
        } else {
            console.log("⚠️ [Login] Falha: Credenciais inválidas.");
            res.status(401).json({ erro: "E-mail ou senha incorretos." });
        }
    } catch (err) {
        console.error("🔥 [Login] Erro crítico:", err);
        res.status(500).json({ erro: "Erro ao processar login." });
    }
});

// --- O CORAÇÃO DO SERVIDOR (Não esqueça disso!) ---
app.listen(PORT, () => {
    console.log(`---`);
    console.log(`🚀 InglEJA Online!`);
    console.log(`📍 Link: http://localhost:${PORT}`);
    console.log(`---`);
});