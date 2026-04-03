// Fora da função Exercicio
const API_BASE = window.location.hostname === "localhost" 
  ? "http://localhost:3000" 
  : ""; // Em produção, ele usará a rota relativa do próprio servidor

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Importamos useParams
import "./Exercicio.css";

function Exercicio() {
  const navigate = useNavigate();
  const { slug } = useParams(); // Pega o nome da fase da URL
  const audioRef = useRef(null);

  // ESTADOS
  const [questoes, setQuestoes] = useState([]); // Array com as 10 questões
  const [indiceAtual, setIndiceAtual] = useState(0); // Controla qual questão estamos vendo
  const [resposta, setResposta] = useState("");
  const [feedback, setFeedback] = useState({ msg: "", color: "", acertou: false });
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dadosUsuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!dadosUsuario) {
      navigate("/dashboard");
      return;
    }
    setUsuario(dadosUsuario);
    carregarFase();
  }, [slug]);

  const carregarFase = async () => {
    try {
      // Chamada para a nova rota que criamos no server.js
      const response = await fetch(`http://localhost:3000/api/fase/${slug}`);
      const data = await response.json();
      
      if (data.questoes) {
        setQuestoes(data.questoes);
      }
      setLoading(false);
    } catch (err) {
      console.error("Erro ao carregar fase:", err);
      setLoading(false);
    }
  };

  const questaoAtual = questoes[indiceAtual];

  const finalizarExercicio = async () => {
    if (!resposta.trim()) return;

    const questaoAtual = questoes[indiceAtual];
    // Verifica se é a última questão
    const eUltima = indiceAtual === questoes.length - 1;

    try {
      const response = await fetch("http://localhost:3000/api/validar-resposta-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioEmail: usuario.email,
          slugFase: slug,
          questaoId: questaoAtual.id,
          respostaUsuario: resposta,
          eUltimaQuestao: eUltima // Informamos ao servidor se acabou a fase
        }),
      });

      const data = await response.json();

      if (data.acertou) {
        setFeedback({ msg: "Incrível! Você acertou!", color: "green", acertou: true });

        // Se acabou a fase e o servidor mandou o usuário atualizado, salvamos no localStorage
        if (eUltima && data.usuarioAtualizado) {
          localStorage.removeItem("fase_em_revisao");
          localStorage.setItem("usuarioLogado", JSON.stringify(data.usuarioAtualizado));
        }
      } else {
        setFeedback({ msg: "Ops! Resposta incorreta. Tente novamente!", color: "red", acertou: false });
      }
    } catch (err) {
      console.error("Erro ao validar:", err);
    }
  };

  const proximaQuestao = () => {
    if (indiceAtual < questoes.length - 1) {
      // Avança para a próxima pergunta
      setIndiceAtual(indiceAtual + 1);
      setResposta("");
      setFeedback({ msg: "", color: "", acertou: false });
    } else {
      // --- FINALIZAÇÃO DA FASE ---
      const chaveProgresso = `progresso_${usuario.email}`;
      const progressoAtual = JSON.parse(localStorage.getItem(chaveProgresso)) || {};

      // Marca este slug como concluído
      progressoAtual[slug] = true;
      localStorage.setItem(chaveProgresso, JSON.stringify(progressoAtual));

      alert("Parabéns! Você completou este nível com sucesso!");
      navigate("/dashboard");
    }
  };

  if (loading) return <div className="container-exercicio">Carregando fase...</div>;
  if (!questaoAtual) return <div className="container-exercicio">Nenhuma questão encontrada.</div>;

  return (
    <div className="container-exercicio">
      {/* Barra de progresso visual baseada no índice */}
      {/* Barra de Progresso Interna */}
      <div className="progresso-container">
        <div className="progresso-texto">
          <span style={{color: "#64748B"}}>PROGRESSO DA LIÇÃO</span>
          <span>Questão <strong>{indiceAtual + 1}</strong> de {questoes.length}</span>
        </div>
        <div
          className="progresso-barra"
          style={{
            width: `${questoes.length > 0 ? ((indiceAtual + 1) / questoes.length) * 100 : 0}%`,
            transition: "width 0.3s ease-in-out" // Para a barra deslizar suavemente
          }}
        ></div>
      </div>

      <div className="area-pergunta">
        {/* Título Dinâmico */}
        <h2 className="titulo-questao">
          {questaoAtual.pergunta_exibicao || (questaoAtual.tipo === 'audio_input' ? 'Ouvir e Escrever' : 'Traduza')}
        </h2>
        {questaoAtual.subtitulo && <p className="subtitulo-exercicio">{questaoAtual.subtitulo}</p>}
        {/* Layout 1: Imagem + Opções de Clique (Baseado na sua Foto 1) */}
        {questaoAtual.tipo === "escolha_palavra" ? (
          <div className="layout-multipla-escolha">

            <div className="container-imagem-central">
              <img
                src={`http://localhost:3000/images/${questaoAtual.img}`}
                alt="Exercício"
                className="img-pergunta-principal"
              />
            </div>

            <div className="lista-botoes-opcoes">
              {questaoAtual.opcoes.map((opcao, idx) => (
                <button
                  key={idx}
                  className={`btn-opcao-item ${resposta === opcao ? 'selecionada' : ''}`}
                  onClick={() => setResposta(opcao)}
                  disabled={feedback.acertou}
                >
                  <span className="numero-indicador">{idx + 1}</span>
                  {opcao}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Layout Antigo/Padrão (Para não quebrar o Nível 1) */
          <div className="layout-texto">
            {questaoAtual.audio && (
              <button className="btn-audio" onClick={() => audioRef.current.play()}>🔊 Ouvir</button>
            )}
            <p className="pergunta-texto">{questaoAtual.pergunta}</p>
            <input
              type="text"
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder="Digite sua resposta..."
              disabled={feedback.acertou}
              className="input-estilizado"
            />
          </div>
        )}
      </div>

      {/* Barra de Ação Inferior */}
      <div className="barra-navegacao-inferior">

        {/* Botão Esquerdo: Sair ou Voltar */}
        {indiceAtual === 0 ? (
          <button className="btn-navegacao secundario" onClick={() => navigate("/dashboard")}>
            ⬅ Sair
          </button>
        ) : (
          <button className="btn-navegacao secundario" onClick={() => setIndiceAtual(prev => prev - 1)}>
            ⬅ Voltar
          </button>
        )}

        {/* Botão Direito: Verificar ou Próximo/Finalizar */}
        {!feedback.acertou ? (
          <button
            className="btn-navegacao primario"
            onClick={finalizarExercicio}
            disabled={!resposta.trim()}
          >
            Verificar
          </button>
        ) : (
          <button className="btn-navegacao sucesso" onClick={proximaQuestao}>
            {indiceAtual === questoes.length - 1 ? "Finalizar ✨" : "Próximo ➡"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Exercicio;