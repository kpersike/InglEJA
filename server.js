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

// ==========================================
// 📚 NOVA ROTA: Listar todas as lições para a Dashboard
// ==========================================
app.get("/api/licoes", async (req, res) => {
  try {
    // Busca o ID, título e slug de todas as lições ordenadas pelo ID sequencial
    const resultado = await pool.query("SELECT id, titulo, slug FROM niveis_licoes ORDER BY id ASC");
    res.json(resultado.rows);
  } catch (err) {
    console.error("❌ Erro ao listar lições:", err.message);
    res.status(500).json({ erro: "Erro interno no servidor ao buscar lições." });
  }
});

// ==========================================
// Rota unificada para carregar fase filtrando loops e duplicados (CORRIGIDA)
// ==========================================
app.get("/api/fase/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const query = `
      SELECT 
        l.id AS licao_id, l.titulo AS licao_titulo, l.slug AS licao_slug,
        q.id AS questao_id, q.tipo, q.pergunta_exibicao, q.dica, q.traducao, 
        q.audio, q.img, q.resposta, q.opcoes, q.frase_parte_1, q.frase_parte_2, 
        q.frase_exibicao, q.palavra_ingles
      FROM niveis_licoes l
      LEFT JOIN questoes q ON l.id = q.nivel_id
      WHERE l.slug = $1
    `;
    
    const resultado = await pool.query(query, [slug]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: "Fase não encontrada" });
    }

    // Objeto pai baseado nos dados da lição
    const licaoFormatada = {
      id: resultado.rows[0].licao_id,
      titulo: resultado.rows[0].licao_titulo,
      slug: resultado.rows[0].licao_slug,
      questoes: []
    };

    // Mapa de controle indexado pelo CONTEÚDO da questão para remover duplicatas físicas reais
    const questoesMap = {};

    resultado.rows.forEach(linha => {
      if (linha.questao_id) {
        
        // 🌟 CHAVE ÚNICA COM BASE NO CONTEÚDO (Evita IDs diferentes para perguntas idênticas)
        const chaveUnicaConteudo = `${linha.tipo}_${linha.pergunta_exibicao}`;

        if (!questoesMap[chaveUnicaConteudo]) {
          
          // Garante a integridade e parsing correto do array de opções
          let opcoesTratadas = linha.opcoes;
          if (typeof linha.opcoes === 'string') {
            try { 
              opcoesTratadas = JSON.parse(linha.opcoes); 
            } catch (e) { 
              opcoesTratadas = []; 
            }
          }

          // Adiciona no mapa usando a chave textual.
          questoesMap[chaveUnicaConteudo] = {
            id: linha.questao_id,
            tipo: linha.tipo,
            pergunta_exibicao: linha.pergunta_exibicao,
            dica: linha.dica,
            traducao: linha.traducao,
            audio: linha.audio,
            img: linha.img, // 🌟 CORRIGIDO: de inlineha.img para linha.img
            resposta: linha.resposta,
            opcoes: opcoesTratadas,
            frase_parte_1: linha.frase_parte_1,
            frase_parte_2: linha.frase_parte_2,
            frase_exibicao: linha.frase_exibicao,
            palavra_ingles: linha.palavra_ingles
          };
        }
      }
    });

    // Transforma o mapa de questões de conteúdo único de volta em um array limpo
    licaoFormatada.questoes = Object.values(questoesMap);

    res.json(licaoFormatada);

  } catch (erro) {
    console.error("Erro ao buscar fase no banco:", erro);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

app.post("/api/validar-resposta-v2", async (req, res) => {
  try {
    const { usuarioEmail, slugFase, questaoId, respostaUsuario, eUltimaQuestao, pontosGanhos } = req.body;

    let usuario;
    let acertou = false;

    if (eUltimaQuestao === true || eUltimaQuestao === "true") {
      acertou = true;
      const pontosParaSomar = Number(pontosGanhos) || 40;

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

    // Busca todos os progressos do usuário para atualizar o mapa do frontend
    const progressoRes = await pool.query(
      "SELECT nivel_slug FROM progresso_usuarios WHERE usuario_id = $1",
      [usuario.id]
    );

    const progressoObj = {};
    progressoRes.rows.forEach(row => {
      progressoObj[row.nivel_slug] = true;
    });

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
      progressoRes.rows.forEach(p => p.nivel_slug = true);

      return res.json({ 
        sucesso: true, 
        usuarioAtualizado: { ...usuario, progresso: progressoObj, avatar: null } 
      });
    }
    res.status(404).json({ erro: "Usuário não encontrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno no servidor." });
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
        // Para colunas do tipo JSON/JSONB no Postgres, passamos o próprio array/objeto se o driver suportar,
        // ou convertemos para string se a coluna for do tipo TEXT. Aqui passamos o array diretamente:
        const opcoesParam = Array.isArray(q.opcoes) ? q.opcoes : [];

        await client.query(
          `INSERT INTO questoes (nivel_id, tipo, pergunta_exibicao, dica, traducao, audio, img, resposta, opcoes, frase_parte_1, frase_parte_2, frase_exibicao, palavra_ingles)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT DO NOTHING`, 
          [
            nivelId, q.tipo, q.pergunta_exibicao, q.dica, q.traducao, q.audio, q.img, q.resposta, 
            opcoesParam, q.frase_parte_1, q.frase_parte_2, q.frase_exibicao, q.palavra_ingles
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

// 🚨 ROTA GET DO ADMINISTRADOR (CORRIGIDA CONTRA DUPLICATAS)
app.get("/api/admin/licoes", async (req, res) => {
  try {
    // 1. Puxa todos os níveis ordenados pelo ID correto
    const niveisRes = await pool.query("SELECT id, slug, titulo FROM niveis_licoes ORDER BY id ASC");
    
    // 2. Puxa todas as questões do banco
    const questoesRes = await pool.query("SELECT * FROM questoes");

    // 3. Agrupa e separa as questões por nível de forma estrita no JavaScript
    const niveisEstruturados = niveisRes.rows.map(nivel => {
      
      // Filtra apenas as questões que pertencem estritamente a este nível_id
      const questoesDoNivel = questoesRes.rows.filter(q => Number(q.nivel_id) === Number(nivel.id));

      // Mapa para eliminar qualquer duplicidade física de conteúdo dentro do próprio nível
      const mapaQuestoesUnicas = {};
      
      questoesDoNivel.forEach(q => {
        // Cria uma chave única baseada no tipo e na pergunta para evitar clones visuais
        const chaveUnica = `${q.tipo}_${q.pergunta_exibicao}`.trim().toLowerCase();
        
        if (!mapaQuestoesUnicas[chaveUnica]) {
          // Trata o array de opções (se veio como string do banco, faz o parse)
          let opcoesTratadas = q.opcoes;
          if (typeof q.opcoes === "string") {
            try { opcoesTratadas = JSON.parse(q.opcoes); } catch (e) { opcoesTratadas = []; }
          }
          
          mapaQuestoesUnicas[chaveUnica] = {
            ...q,
            opcoes: opcoesTratadas
          };
        }
      });

      // Retorna o nível estruturado com seu array de questões limpo e real
      return {
        id: nivel.id,
        slug: nivel.slug,
        titulo: nivel.titulo,
        questoes: Object.values(mapaQuestoesUnicas) // Transforma o mapa limpo de volta em Array
      };
    });

    // Devolve o JSON limpo para o Frontend
    res.json({ niveis: niveisEstruturados });

  } catch (err) {
    console.error("❌ Erro ao processar lições do admin:", err);
    res.status(500).json({ erro: "Erro interno ao carregar dados estruturados." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 InglEJA Online integrado com Postgres na porta: ${PORT}`);
});