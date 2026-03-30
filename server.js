const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); //permissao para o react pegar os dados do servidor

const app = express();

// Configurações
const PORT = 3000;
const DATA_PATH = path.join(__dirname, "data", "users.json");
const LESSONS_PATH = path.join(__dirname, "data", "lessons.json");

// Middlewares
app.use(cors()); // Habilita o React (porta 5173) a falar com o Node (porta 3000)
app.use(express.json()); // Permite que o servidor entenda JSON enviado pelo React
app.use(express.static("public"));
app.use('/audio', express.static("frontend/public"));

// Função de leitura de usuários
const getUsers = () => {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const content = fs.readFileSync(DATA_PATH, "utf8");
    if (!content.trim()) return [];
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("❌ Erro na leitura do JSON:", error.message);
    return [];
  }
};

// Rota de Cadastro
app.post("/api/cadastro", (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res
        .status(400)
        .json({ erro: "Todos os campos são obrigatórios." });
    }

    let usuarios = getUsers();
    if (usuarios.some((u) => u && u.email === email)) {
      return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
    }

    usuarios.push({ nome, email, senha, pontos: 0 });
    fs.writeFileSync(DATA_PATH, JSON.stringify(usuarios, null, 2));
    res.json({ mensagem: "Cadastro realizado com sucesso!" });
  } catch (err) {
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

// Rota para atualizar o nome do usuário
app.put("/api/atualizar-nome", (req, res) => {
  const { email, novoNome } = req.body;
  let usuarios = getUsers();
  const index = usuarios.findIndex(u => u.email === email);

  if (index !== -1) {
    usuarios[index].nome = novoNome;
    fs.writeFileSync(DATA_PATH, JSON.stringify(usuarios, null, 2));
    return res.json({ sucesso: true, usuario: usuarios[index] });
  }
  res.status(404).json({ erro: "Usuário não encontrado" });
});

// Rota de Login
app.post("/api/login", (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuarios = getUsers();
    const usuario = usuarios.find(
      (u) => u && u.email === email && u.senha === senha,
    );

    if (usuario) {
      res.json({
        sucesso: true,
        usuario: {
          nome: usuario.nome,
          email: usuario.email,
          pontos: usuario.pontos || 0,
        },
      });
    } else {
      res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }
  } catch (err) {
    res.status(500).json({ erro: "Erro ao processar login." });
  }
});

// Rota para listar todas as lições
app.get("/api/licoes", (req, res) => {
  try {
    if (!fs.existsSync(LESSONS_PATH)) return res.json([]);
    const content = fs.readFileSync(LESSONS_PATH, "utf8");
    const lessons = JSON.parse(content);
    const dadosSeguros = lessons.map(({ respostaCorreta, ...resto }) => resto);
    res.json(dadosSeguros);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao carregar lições" });
  }
});

// Rota para pegar uma lição específica pelo ID
app.get("/api/licao/:id", (req, res) => {
  try {
    const lessons = JSON.parse(fs.readFileSync(LESSONS_PATH, "utf8"));
    const licao = lessons.find((l) => l.id == req.params.id);

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

// Rota para validar resposta
app.post("/api/validar-resposta", (req, res) => {
  const { usuarioEmail, licaoId, respostaUsuario } = req.body;
  const lessons = JSON.parse(fs.readFileSync(LESSONS_PATH, "utf8"));
  const licao = lessons.find((l) => l.id == licaoId);

  if (!licao) return res.status(404).json({ erro: "Lição inválida" });
  if (!respostaUsuario || respostaUsuario.trim() === "") {
    return res.status(400).json({ erro: "Você precisa responder a pergunta" });
  }

  const acertou =
    respostaUsuario.toLowerCase().trim() ===
    licao.respostaCorreta.toLowerCase().trim();

  if (acertou) {
    let usuarios = getUsers();
    const userIndex = usuarios.findIndex((u) => u.email === usuarioEmail);
    if (userIndex !== -1) {
      usuarios[userIndex].pontos =
        (usuarios[userIndex].pontos || 0) + licao.pontos;
      fs.writeFileSync(DATA_PATH, JSON.stringify(usuarios, null, 2));
    }
    res.json({
      feedback: "Correto! Well done!",
      acertou: true,
      pontos: licao.pontos,
    });
  } else {
    res.json({ feedback: "Ops! Tente novamente.", acertou: false });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 InglEJA Online na porta: ${PORT}`);
});
