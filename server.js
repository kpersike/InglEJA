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
// app.use(express.static("public"));

// --- 🚨 AJUSTE DE ROTA DEFINITIVO 🚨 ---
// 1. Tenta o caminho mais provável (Saindo de backend e entrando em frontend/public)
const publicPath = path.resolve(__dirname, "frontend", "public");

app.use(express.static(publicPath));

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
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);

    if (usuario) {
      res.json({
        sucesso: true,
        usuario: {
          nome: usuario.nome,
          email: usuario.email,
          pontos: usuario.pontos || 0,
          // IMPORTANTE: Enviar o progresso que está no JSON
          progresso: usuario.progresso || {} 
        },
      });
    } else {
      res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }
  } catch (err) {
    res.status(500).json({ erro: "Erro ao processar login." });
  }
});

// 1. Rota para pegar todos os dados de uma FASE específica pelo SLUG
app.get("/api/fase/:slug", (req, res) => {
  try {
    const content = fs.readFileSync(LESSONS_PATH, "utf8");
    const db = JSON.parse(content);
    
    // Procura a fase pelo slug (ex: 'saudacoes' ou 'cores')
    const fase = db.niveis.find((n) => n.slug === req.params.slug);

    if (fase) {
      // Removemos a resposta correta para o aluno não ver no F12/Inspect
      const questoesSeguras = fase.questoes.map(({ respostaCorreta, ...resto }) => resto);
      res.json({
        titulo: fase.titulo,
        slug: fase.slug,
        questoes: questoesSeguras
      });
    } else {
      res.status(404).json({ erro: "Fase não encontrada" });
    }
  } catch (err) {
    res.status(500).json({ erro: "Erro ao carregar a fase" });
  }
});

app.post("/api/validar-resposta-v2", (req, res) => {
  try {
    const { usuarioEmail, slugFase, questaoId, respostaUsuario, eUltimaQuestao } = req.body;

    const db = JSON.parse(fs.readFileSync(LESSONS_PATH, "utf8"));
    const fase = db.niveis.find(n => n.slug === slugFase);
    if (!fase) return res.status(404).json({ erro: "Fase não encontrada" });

    const questao = fase.questoes.find(q => q.id == questaoId);
    if (!questao) return res.status(404).json({ erro: "Questão não encontrada" });

    const acertou = respostaUsuario?.toLowerCase().trim() === questao.resposta?.toLowerCase().trim();

    if (acertou) {
      let usuarios = getUsers();
      const userIndex = usuarios.findIndex((u) => u.email === usuarioEmail);
      
      if (userIndex !== -1) {
        // Incrementa pontos
        usuarios[userIndex].pontos = (usuarios[userIndex].pontos || 0) + (questao.pontos || 10);

        // SE FOR A ÚLTIMA QUESTÃO, MARCA COMO CONCLUÍDO NO BANCO
        if (eUltimaQuestao) {
          if (!usuarios[userIndex].progresso) usuarios[userIndex].progresso = {};
          usuarios[userIndex].progresso[slugFase] = true;
          
          // Atualiza também o objeto do usuário na resposta para o front atualizar o localStorage
          console.log(`✅ Fase ${slugFase} concluída para ${usuarioEmail}`);
        }

        fs.writeFileSync(DATA_PATH, JSON.stringify(usuarios, null, 2));
        
        // Retornamos os dados atualizados do usuário para o Front-end sincronizar
        return res.json({ acertou, usuarioAtualizado: usuarios[userIndex] });
      }
    }

    res.json({ acertou });
  } catch (err) {
    console.error("❌ ERRO NO SERVIDOR:", err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 InglEJA Online na porta: ${PORT}`);
});
