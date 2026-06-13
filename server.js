require("dotenv").config(); // Carrega as variáveis do arquivo .env
const express = require("express");
const path = require("path");
const cors = require("cors");
const { Pool } = require("pg"); // Importa o cliente do Postgres

const app = express();
const PORT = 3000;

// Configuração da conexão com o Postgres (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Obrigatório para conexões seguras na nuvem
});

// Testar conexão com o Banco ao iniciar
pool.connect((err, client, release) => {
  if (err) {
    return console.error("❌ Erro ao conectar ao Postgres:", err.message);
  }
  console.log("✅ Conexão com o Postgres estabelecida com sucesso!");
  release();
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const publicPath = path.resolve(__dirname, "frontend", "public");
app.use(express.static(publicPath));

// ==========================================
// 🧑‍🎓 ROTAS DE USUÁRIOS & ALUNOS
// ==========================================

// Rota de Cadastro (Alunos)
app.post("/api/cadastro", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }

    // Verifica se o email já existe no banco
    const userCheck = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
    }

    // Insere o novo usuário
    await pool.query(
      "INSERT INTO usuarios (nome, email, senha, pontos, nivel) VALUES ($1, $2, $3, 0, 1)",
      [nome, email, senha]
    );

    res.json({ mensagem: "Cadastro realizado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

// Rota para atualizar o perfil do usuário
app.put("/api/atualizar-perfil", async (req, res) => {
  try {
    const { email, novoNome, avatar } = req.body;

    // COALESCE garante que se o novoNome ou avatar vierem vazios/undefined, o banco mantém o valor que já estava lá
    const resultado = await pool.query(
      "UPDATE usuarios SET nome = COALESCE($1, nome), avatar = COALESCE($2, avatar) WHERE email = $3 RETURNING id, nome, email, pontos, avatar, nivel",
      [novoNome, avatar, email]
    );

    if (resultado.rows.length > 0) {
      // Busca o progresso atualizado para retornar junto
      const progressoRes = await pool.query("SELECT nivel_slug FROM progresso_usuarios WHERE usuario_id = $1", [resultado.rows[0].id]);
      const progressoObj = {};
      progressoRes.rows.forEach(p => progressoObj[p.nivel_slug] = true);

      return res.json({ 
        sucesso: true, 
        usuario: { 
          nome: resultado.rows[0].nome,
          email: resultado.rows[0].email,
          pontos: resultado.rows[0].pontos,
          avatar: resultado.rows[0].avatar, // Agora retorna o avatar real do banco
          nivel: resultado.rows[0].nivel,
          progresso: progressoObj
        } 
      });
    }
    res.status(404).json({ erro: "Usuário não encontrado" });
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

// Rota de Login (Alunos)
app.post("/api/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Agora selecionamos também a coluna avatar
    const userRes = await pool.query(
      "SELECT id, nome, email, pontos, avatar, nivel FROM usuarios WHERE email = $1 AND senha = $2",
      [email, senha]
    );

    if (userRes.rows.length > 0) {
      const usuario = userRes.rows[0];

      // Busca o progresso do usuário no banco
      const progressoRes = await pool.query("SELECT nivel_slug FROM progresso_usuarios WHERE usuario_id = $1", [usuario.id]);
      const progressoObj = {};
      progressoRes.rows.forEach(p => progressoObj[p.nivel_slug] = true);

      res.json({
        sucesso: true,
        usuario: {
          nome: usuario.nome,
          email: usuario.email,
          pontos: usuario.pontos,
          avatar: usuario.avatar, // Retorna o avatar do banco (ou null se não tiver)
          nivel: usuario.nivel,
          progresso: progressoObj
        },
      });
    } else {
      res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ erro: "Erro ao processar login." });
  }
});

// Rota do Google Auth
app.post("/api/login-google", async (req, res) => {
  try {
    const { email, nome, foto } = req.body; // 'foto' vem da API do Google se for um novo cadastro
    
    let userRes = await pool.query("SELECT id, nome, email, pontos, avatar, nivel FROM usuarios WHERE email = $1", [email]);
    let novoUsuario = false;

    if (userRes.rows.length === 0) {
      // Se for a primeira vez, salva a foto do Google como o avatar inicial do banco
      userRes = await pool.query(
        "INSERT INTO usuarios (nome, email, senha, pontos, avatar, nivel) VALUES ($1, $2, 'GOOGLE_AUTH', 0, $3, 1) RETURNING id, nome, email, pontos, avatar, nivel",
        [nome, email, foto || null]
      );
      novoUsuario = true;
    }

    const usuario = userRes.rows[0];
    
    // Busca o progresso
    const progressoRes = await pool.query("SELECT nivel_slug FROM progresso_usuarios WHERE usuario_id = $1", [usuario.id]);
    const progressoObj = {};
    progressoRes.rows.forEach(p => progressoObj[p.nivel_slug] = true);

    res.json({
      sucesso: true,
      novoUsuario: novoUsuario,
      usuario: {
        nome: usuario.nome,
        email: usuario.email,
        pontos: usuario.pontos,
        avatar: usuario.avatar, // Retorna o avatar salvo
        nivel: usuario.nivel,
        progresso: progressoObj
      },
    });
  } catch (err) {
    console.error("❌ Erro no login com Google:", err);
    res.status(500).json({ erro: "Erro ao processar login com Google." });
  }
});

// ==========================================
// 📚 ROTAS DE LIÇÕES & PROGRESSO (Consumindo do Banco)
// ==========================================

// Rota para pegar todos os dados de uma FASE específica pelo SLUG
app.get("/api/fase/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Busca o nível pelo slug
    const nivelRes = await pool.query("SELECT id, titulo, slug FROM niveis_licoes WHERE slug = $1", [slug]);
    if (nivelRes.rows.length === 0) return res.status(404).json({ erro: "Fase não encontrada" });

    const nivel = nivelRes.rows[0];

    // Busca as questões atreladas a esse nível (Sem expor o campo 'resposta')
    const questoesRes = await pool.query(
      `SELECT id, tipo, pergunta_exibicao, dica, traducao, audio, img, opcoes, 
              frase_parte_1, frase_parte_2, frase_exibicao, palavra_ingles 
       FROM questoes WHERE nivel_id = $1`,
      [nivel.id]
    );

    res.json({
      titulo: nivel.titulo,
      slug: nivel.slug,
      questoes: questoesRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao carregar a fase" });
  }
});

app.post("/api/validar-resposta-v2", async (req, res) => {
  try {
    // 🌟 CAPTURA A PROPRIEDADE pontosGanhos VINDA DO CORPO DA REQUISIÇÃO
    const { usuarioEmail, slugFase, questaoId, respostaUsuario, eUltimaQuestao, pontosGanhos } = req.body;

    let usuario;
    let acertou = false;

    if (eUltimaQuestao === true || eUltimaQuestao === "true") {
      acertou = true;

      // 🌟 VALIDAÇÃO DE SEGURANÇA: Garante um valor numérico se pontosGanhos falhar ou vier nulo
      const pontosParaSomar = Number(pontosGanhos) || 40;

      // 🌟 SQL ATUALIZADO: Agora usa $2 (pontosParaSomar) no lugar do "+ 10" estático
      const usuarioRes = await pool.query(
        "UPDATE usuarios SET pontos = pontos + $2, nivel = nivel + 1 WHERE email = $1 RETURNING id, nome, email, pontos, nivel, avatar",
        [usuarioEmail, pontosParaSomar]
      );
      usuario = usuarioRes.rows[0];

      // Registra a fase concluída na tabela de progresso
      await pool.query(
        "INSERT INTO progresso_usuarios (usuario_id, nivel_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [usuario.id, slugFase]
      );

    } else {
      // 🌟 SE FOR UMA QUESTÃO NORMAL NO MEIO DO EXERCÍCIO, MANTÉM A VALIDAÇÃO TRADICIONAL:
      const questaoRes = await pool.query("SELECT resposta FROM questoes WHERE id = $1", [questaoId]);
      if (questaoRes.rows.length === 0) {
        return res.status(404).json({ erro: "Questão não encontrada" });
      }

      const respostaCorreta = questaoRes.rows[0].resposta;
      acertou = respostaUsuario.trim().toLowerCase() === respostaCorreta.trim().toLowerCase();

      if (acertou) {
        const usuarioRes = await pool.query(
          "UPDATE usuarios SET pontos = pontos + 10 WHERE email = $1 RETURNING id, nome, email, pontos, nivel, avatar",
          [usuarioEmail]
        );
        usuario = usuarioRes.rows[0];
      } else {
        const usuarioRes = await pool.query(
          "SELECT id, nome, email, pontos, nivel, avatar FROM usuarios WHERE email = $1",
          [usuarioEmail]
        );
        usuario = usuarioRes.rows[0];
      }
    }

    // 3. Busca todos os progressos do usuário para atualizar o mapa do frontend
    const progressoRes = await pool.query(
      "SELECT nivel_slug FROM progresso_usuarios WHERE usuario_id = $1",
      [usuario.id]
    );

    const progressoObj = {};
    progressoRes.rows.forEach(row => {
      progressoObj[row.nivel_slug] = true;
    });

    // Retorna o objeto com nível incrementado e progresso preenchido!
    return res.json({
      acertou,
      usuarioAtualizado: {
        nome: usuario.nome,
        email: usuario.email,
        pontos: usuario.pontos,
        avatar: usuario.avatar,
        nivel: usuario.nivel,
        progresso: progressoObj
      }
    });

  } catch (err) {
    console.error("❌ Erro na rota validar-resposta-v2:", err.message);
    return res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// Rota legada de salvar progresso mantida para compatibilidade
app.post("/api/salvar-progresso", async (req, res) => {
  try {
    const { email, slugFase, pontos } = req.body;

    const userUpdate = await pool.query(
      "UPDATE usuarios SET pontos = pontos + $1 WHERE email = $2 RETURNING id, nome, email, pontos, nivel",
      [pontos || 0, email]
    );

    if (userUpdate.rows.length > 0) {
      const usuario = userUpdate.rows[0];
      await pool.query(
        "INSERT INTO progresso_usuarios (usuario_id, nivel_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [usuario.id, slugFase]
      );

      const progressoRes = await pool.query("SELECT nivel_slug FROM progresso_usuarios WHERE usuario_id = $1", [usuario.id]);
      const progressoObj = {};
      progressoRes.rows.forEach(p => progressoObj[p.nivel_slug] = true);

      return res.json({ 
        sucesso: true, 
        usuarioAtualizado: { ...usuario, progresso: progressoObj, avatar: null } 
      });
    }
    res.status(404).json({ erro: "Usuário não encontrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// ==========================================
// 🚨 ROTAS DO ADMINISTRADOR
// ==========================================

app.post("/api/admin/login", (req, res) => {
  const { email, senha } = req.body;
  const ADMIN_EMAIL = "admin@ingleja.com";
  const ADMIN_SENHA = "admin";

  if (email === ADMIN_EMAIL && senha === ADMIN_SENHA) {
    res.json({ sucesso: true, token: "admin_token_autorizado" });
  } else {
    res.status(401).json({ erro: "Acesso negado. Credenciais inválidas." });
  }
});

// Admin ver todos os níveis e questões direto do Banco
app.get("/api/admin/licoes", async (req, res) => {
  try {
    const niveisRes = await pool.query("SELECT * FROM niveis_licoes");
    const licoesCompletas = [];

    for (let nivel of niveisRes.rows) {
      const questoesRes = await pool.query("SELECT * FROM questoes WHERE nivel_id = $1", [nivel.id]);
      licoesCompletas.push({
        titulo: nivel.titulo,
        slug: nivel.slug,
        questoes: questoesRes.rows
      });
    }

    res.json({ niveis: licoesCompletas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao carregar lições" });
  }
});

// Admin atualizar/inserir lições no Banco de Dados
app.put("/api/admin/licoes", async (req, res) => {
  const client = await pool.connect();
  try {
    const novosDados = req.body;
    if (!novosDados || !novosDados.niveis) return res.status(400).json({ erro: "Formato de dados inválido." });

    await client.query("BEGIN"); // Inicia Transação SQL

    for (let nivel of novosDados.niveis) {
      // Atualiza ou Insere o Nível
      const nivelIns = await client.query(
        `INSERT INTO niveis_licoes (slug, titulo) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET titulo = EXCLUDED.titulo RETURNING id`,
        [nivel.slug, nivel.titulo]
      );
      
      const nivelId = nivelIns.rows[0].id;

      // Trata as questões daquele nível
      for (let q of nivel.questoes) {
        await client.query(
          `INSERT INTO questoes (nivel_id, tipo, pergunta_exibicao, dica, traducao, audio, img, resposta, opcoes, frase_parte_1, frase_parte_2, frase_exibicao, palavra_ingles)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT DO NOTHING`, // Evita duplicar se já existir
          [
            nivelId, q.tipo, q.pergunta_exibicao, q.dica, q.traducao, q.audio, q.img, q.resposta, 
            JSON.stringify(q.opcoes || []), q.frase_parte_1, q.frase_parte_2, q.frase_exibicao, q.palavra_ingles
          ]
        );
      }
    }

    await client.query("COMMIT"); // Confirma as alterações no banco
    res.json({ sucesso: true, mensagem: "Lições salvas no Postgres com sucesso!" });
  } catch (err) {
    await client.query("ROLLBACK"); // Cancela tudo se der erro no loop
    console.error("❌ Erro ao salvar lições no Banco:", err);
    res.status(500).json({ erro: "Erro ao salvar as lições" });
  } finally {
    client.release();
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 InglEJA Online integrado com Postgres na porta: ${PORT}`);
});