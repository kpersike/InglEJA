const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// Configurações
const PORT = 3000;
const DATA_PATH = path.join(__dirname, "data", "users.json");
const LESSONS_PATH = path.join(__dirname, "data", "lessons.json");

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// --- 🚨 AJUSTE DE ROTA DEFINITIVO 🚨 ---
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

// Rota de Cadastro (Alunos)
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

// Rota para atualizar o perfil do usuário
app.put("/api/atualizar-perfil", (req, res) => {
  const { email, novoNome, avatar } = req.body;
  let usuarios = getUsers();
  const index = usuarios.findIndex((u) => u.email === email);

  if (index !== -1) {
    if (novoNome) usuarios[index].nome = novoNome;
    if (avatar !== undefined) usuarios[index].avatar = avatar;
    
    fs.writeFileSync(DATA_PATH, JSON.stringify(usuarios, null, 2));
    return res.json({ sucesso: true, usuario: usuarios[index] });
  }
  res.status(404).json({ erro: "Usuário não encontrado" });
});

// Rota de Login (Alunos)
app.post("/api/login", (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuarios = getUsers();
    const usuario = usuarios.find(
      (u) => u.email === email && u.senha === senha,
    );

    if (usuario) {
      res.json({
        sucesso: true,
        usuario: {
          nome: usuario.nome,
          email: usuario.email,
          pontos: usuario.pontos || 0,
          progresso: usuario.progresso || {},
          avatar: usuario.avatar || null,
        },
      });
    } else {
      res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }
  } catch (err) {
    res.status(500).json({ erro: "Erro ao processar login." });
  }
});

// --- INÍCIO DA NOVA ROTA DO GOOGLE ---
app.post("/api/login-google", (req, res) => {
  try {
    const { email, nome, foto } = req.body;
    let usuarios = getUsers();

    let usuario = usuarios.find((u) => u && u.email === email);
    let novoUsuario = false;

    if (!usuario) {
      usuario = {
        nome: nome,
        email: email,
        senha: "GOOGLE_AUTH",
        pontos: 0,
        progresso: {},
      };
      usuarios.push(usuario);
      fs.writeFileSync(DATA_PATH, JSON.stringify(usuarios, null, 2));
      novoUsuario = true;
    }

    res.json({
      sucesso: true,
      novoUsuario: novoUsuario,
      usuario: {
        nome: usuario.nome,
        email: usuario.email,
        pontos: usuario.pontos || 0,
        progresso: usuario.progresso || {},
        avatar: usuario.avatar || null,
      },
    });
  } catch (err) {
    console.error("❌ Erro no login com Google:", err);
    res.status(500).json({ erro: "Erro ao processar login com Google." });
  }
});

// Rota para pegar todos os dados de uma FASE específica pelo SLUG
app.get("/api/fase/:slug", (req, res) => {
  try {
    const content = fs.readFileSync(LESSONS_PATH, "utf8");
    const db = JSON.parse(content);

    const fase = db.niveis.find((n) => n.slug === req.params.slug);

    if (fase) {
      const questoesSeguras = fase.questoes.map(
        ({ respostaCorreta, ...resto }) => resto,
      );
      res.json({
        titulo: fase.titulo,
        slug: fase.slug,
        questoes: questoesSeguras,
      });
    } else {
      res.status(404).json({ erro: "Fase não encontrada" });
    }
  } catch (err) {
    res.status(500).json({ erro: "Erro ao carregar a fase" });
  }
});


app.post("/api/salvar-progresso", (req, res) => {
  try {
    const { email, slugFase, pontos } = req.body;
    let usuarios = getUsers();
    const userIndex = usuarios.findIndex((u) => u.email === email);

    if (userIndex !== -1) {
      if (!usuarios[userIndex].progresso) usuarios[userIndex].progresso = {};
      usuarios[userIndex].progresso[slugFase] = true;
      usuarios[userIndex].pontos = (usuarios[userIndex].pontos || 0) + (pontos || 0);

      fs.writeFileSync(DATA_PATH, JSON.stringify(usuarios, null, 2));
      return res.json({ sucesso: true, usuarioAtualizado: usuarios[userIndex] });
    }
    res.status(404).json({ erro: "Usuário não encontrado" });
  } catch (err) {
    console.error("Erro ao salvar progresso:", err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

app.post("/api/validar-resposta-v2", (req, res) => {
  try {
    const {
      usuarioEmail,
      slugFase,
      questaoId,
      respostaUsuario,
      eUltimaQuestao,
    } = req.body;

    const db = JSON.parse(fs.readFileSync(LESSONS_PATH, "utf8"));
    const fase = db.niveis.find((n) => n.slug === slugFase);
    if (!fase) return res.status(404).json({ erro: "Fase não encontrada" });

    const questao = fase.questoes.find((q) => q.id == questaoId);
    if (!questao)
      return res.status(404).json({ erro: "Questão não encontrada" });

    const acertou =
      respostaUsuario?.toLowerCase().trim() ===
      questao.resposta?.toLowerCase().trim();

    if (acertou) {
      let usuarios = getUsers();
      const userIndex = usuarios.findIndex((u) => u.email === usuarioEmail);

      if (userIndex !== -1) {
        usuarios[userIndex].pontos =
          (usuarios[userIndex].pontos || 0) + (questao.pontos || 10);

        if (eUltimaQuestao) {
          if (!usuarios[userIndex].progresso)
            usuarios[userIndex].progresso = {};
          usuarios[userIndex].progresso[slugFase] = true;
          console.log(`✅ Fase ${slugFase} concluída para ${usuarioEmail}`);
        }

        fs.writeFileSync(DATA_PATH, JSON.stringify(usuarios, null, 2));
        return res.json({ acertou, usuarioAtualizado: usuarios[userIndex] });
      }
    }

    res.json({ acertou });
  } catch (err) {
    console.error("❌ ERRO NO SERVIDOR:", err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// ==========================================
// 🚨 ROTAS DO ADMINISTRADOR 🚨
// ==========================================

// 1. Rota de Login exclusiva para o Administrador
app.post("/api/admin/login", (req, res) => {
  const { email, senha } = req.body;

  // Credenciais fixas de Admin
  const ADMIN_EMAIL = "admin@ingleja.com";
  const ADMIN_SENHA = "admin";

  if (email === ADMIN_EMAIL && senha === ADMIN_SENHA) {
    res.json({ sucesso: true, token: "admin_token_autorizado" });
  } else {
    res.status(401).json({ erro: "Acesso negado. Credenciais inválidas." });
  }
});

// 2. Rota para o Admin carregar TODAS as lições
app.get("/api/admin/licoes", (req, res) => {
  try {
    if (!fs.existsSync(LESSONS_PATH)) {
      return res
        .status(404)
        .json({ erro: "Arquivo de lições não encontrado." });
    }
    const content = fs.readFileSync(LESSONS_PATH, "utf8");
    const db = JSON.parse(content);
    res.json(db);
  } catch (err) {
    console.error("❌ Erro ao carregar lições para o admin:", err);
    res.status(500).json({ erro: "Erro ao carregar lições" });
  }
});

// 3. Rota para o Admin SALVAR as alterações (Substitui o JSON atual)
app.put("/api/admin/licoes", (req, res) => {
  try {
    const novosDados = req.body;

    if (!novosDados || !novosDados.niveis) {
      return res.status(400).json({ erro: "Formato de dados inválido." });
    }

    fs.writeFileSync(LESSONS_PATH, JSON.stringify(novosDados, null, 2));
    console.log("✅ Lições atualizadas pelo Administrador!");

    res.json({ sucesso: true, mensagem: "Lições salvas com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao salvar lições:", err);
    res.status(500).json({ erro: "Erro ao salvar as lições" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 InglEJA Online na porta: ${PORT}`);
});
