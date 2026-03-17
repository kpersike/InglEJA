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
            res.json({ 
            sucesso: true,
            usuario: {
                nome: usuario.nome,
                email: usuario.email,
                pontos: usuario.pontos || 0
            }
    });
        } else {
            console.log("⚠️ [Login] Falha: Credenciais inválidas.");
            res.status(401).json({ erro: "E-mail ou senha incorretos." });
        }
    } catch (err) {
        console.error("🔥 [Login] Erro crítico:", err);
        res.status(500).json({ erro: "Erro ao processar login." });
    }
});

app.get('/api/licao/:id'), (req, res) => {
    const lessons = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'lessons.json'), 'utf8'));
    const licao = lessons.find (l => l.id == requestAnimationFrame.params.id);

    if(licao) {
        const { respostaCorreta, ...dadosPublicos } = licao;
        res.json(dadosPublicos);
    } else {
        res.status(404).json({ erro: "Lição não encontrada"})
    }
};

app.get('/api/licoes', (req, res) => {
    try {
        if (!fs.existsSync(LESSONS_PATH)) return res.json([]);
        const content = fs.readFileSync(LESSONS_PATH, 'utf8');
        const lessons = JSON.parse(content);
        
        // Remove a resposta correta para não "colarem" pelo console do navegador
        const dadosSeguros = lessons.map(({ respostaCorreta, ...resto }) => resto);
        res.json(dadosSeguros);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar lições" });
    }
});

app.get('/api/licao/:id', (req, res) => {
    try {
        const lessons = JSON.parse(fs.readFileSync(LESSONS_PATH, 'utf8'));
        // Corrigido: usamos req.params.id (o seu estava requestAnimationFrame)
        const licao = lessons.find(l => l.id == req.params.id);

        if (licao) {
            const { respostaCorreta, ...dadosPublicos } = licao;
            res.json(dadosPublicos);
        } else {
            res.status(404).json({ erro: "Lição não encontrada" });
        }
    } catch (err) {
        res.status(500).json({ erro: "Erro interno" });
    }
});


//rota para validar a resposta e dar pontos

app.post('/api/validar-resposta', (req, res) => {
    const { usuarioEmail, licaoId, respostaUsuario } = req.body;
    const lessons = JSON.parse(fs.readFileSync(LESSONS_PATH, 'utf8'));
    const licao = lessons.find(l => l.id == licaoId); // Corrigido licaoID para licaoId

    if (!licao) return res.status(404).json({ erro: "Lição inválida" });

    if (!respostaUsuario || respostaUsuario.trim() === "") {
        return res.status(400).json({ erro: "Você precisa responder a pergunta" });
    }

    const acertou = respostaUsuario.toLowerCase().trim() === licao.respostaCorreta.toLowerCase().trim();

    if (acertou) {
        let usuarios = getUsers();
        const userIndex = usuarios.findIndex(u => u.email === usuarioEmail);

        if (userIndex !== -1) {
            // Corrigido: usarIndex para userIndex
            usuarios[userIndex].pontos = (usuarios[userIndex].pontos || 0) + licao.pontos;
            fs.writeFileSync(DATA_PATH, JSON.stringify(usuarios, null, 2));
        }
        res.json({ feedback: "Correto! Well done!", acertou: true, pontos: licao.pontos });
    } else {
        res.json({ feedback: "Ops! Tente novamente.", acertou: false });
    }
});

// --- O CORAÇÃO DO SERVIDOR (Não esqueça disso!) ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`---`);
    console.log(`🚀 InglEJA Online!`);
    console.log(`📍 Servidor interno rodando na porta: ${PORT}`);
    console.log(`📢 Se estiver no Codespaces, use a aba 'Ports' para abrir o link.`);
    console.log(`---`);
});

