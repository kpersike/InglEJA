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
    if (!resposta.trim()) {
      setFeedback({ msg: "Por favor, digite uma resposta!", color: "orange", acertou: false });
      return;
    }

    const questaoAtual = questoes[indiceAtual];

    try {
      // 1. Enviamos a resposta para o servidor validar
      const response = await fetch("http://localhost:3000/api/validar-resposta-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioEmail: usuario.email,
          slugFase: slug, // Esse 'slug' vem do useParams() lá no topo
          questaoId: questaoAtual.id,
          respostaUsuario: resposta,
        }),
      });

      const data = await response.json();

      // 2. O servidor agora é quem diz se acertou ou não
      if (data.acertou) {
        setFeedback({
          msg: "Incrível! Você acertou!",
          color: "green",
          acertou: true
        });
      } else {
        setFeedback({
          msg: "Ops! Resposta incorreta. Tente novamente!",
          color: "red",
          acertou: false
        });
      }
    } catch (err) {
      console.error("Erro ao validar:", err);
      setFeedback({
        msg: "Erro ao conectar com o servidor.",
        color: "red",
        acertou: false
      });
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
        <div
          className="progresso-barra"
          style={{
            width: `${questoes.length > 0 ? ((indiceAtual + 1) / questoes.length) * 100 : 0}%`,
            transition: "width 0.3s ease-in-out" // Para a barra deslizar suavemente
          }}
        ></div>
        <div className="progresso-texto">
          <span>Questão <strong>{indiceAtual + 1}</strong> de {questoes.length}</span>
        </div>
      </div>

      <button className="btn-voltar-simples" onClick={() => navigate("/dashboard")}>⬅ Sair</button>

      <h2>{questaoAtual.tipo === 'audio' ? 'Ouvir e Escrever' : 'Traduza'}</h2>

      {questaoAtual.audio && (
        <>
          <button className="btn-audio" onClick={() => audioRef.current.play()}>🔊 Ouvir</button>
          <audio ref={audioRef} src={`http://localhost:3000${questaoAtual.audio}`} />
        </>
      )}

      <p className="pergunta-texto">{questaoAtual.pergunta}</p>

      <input
        type="text"
        value={resposta}
        onChange={(e) => setResposta(e.target.value)}
        placeholder="Digite sua resposta..."
        disabled={feedback.acertou}
      />

      {!feedback.acertou ? (
        <button className="btn-concluir" onClick={finalizarExercicio}>Verificar</button>
      ) : (
        <button className="btn-concluir btn-proximo" onClick={proximaQuestao}>
          {indiceAtual + 1 === questoes.length ? "Finalizar Fase" : "Próxima Questão ➔"}
        </button>
      )}

      <div id="feedback-area" style={{ color: feedback.color }}>{feedback.msg}</div>
    </div>
  );
}

export default Exercicio;