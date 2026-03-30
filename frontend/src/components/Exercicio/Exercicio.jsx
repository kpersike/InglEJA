import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Exercicio.css";

function Exercicio() {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const tocarAudio = () => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play();
    } else {
      alert("Áudio não disponível.");
    }
  };

  // Estados
  const [licao, setLicao] = useState(null);
  const [resposta, setResposta] = useState("");
  const [feedback, setFeedback] = useState({
    msg: "",
    color: "",
    acertou: false,
  });
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const idLicao = localStorage.getItem("licaoAtualId");
    const dadosUsuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    if (!idLicao || !dadosUsuario) {
      navigate("/dashboard");
      return;
    }

    setUsuario(dadosUsuario);
    carregarDadosLicao(idLicao);
  }, [navigate]);

  const carregarDadosLicao = async (id) => {
    try {
      // Importante: use a URL completa do seu backend
      const response = await fetch(`http://localhost:3000/api/licao/${id}`);
      const data = await response.json();
      setLicao(data);
    } catch (err) {
      console.error("Erro ao carregar lição:", err);
    }
  };

  const finalizarExercicio = async () => {
    if (resposta.trim() === "") {
      setFeedback({
        msg: "⚠️ Por favor, preencha o campo antes de concluir.",
        color: "orange",
      });
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/api/validar-resposta",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuarioEmail: usuario.email,
            licaoId: licao.id,
            respostaUsuario: resposta,
          }),
        },
      );

      const data = await response.json();

      if (data.acertou) {
        setFeedback({
          msg: `✅ ${data.feedback} | +${data.pontos} pontos!`,
          color: "#58cc02",
          acertou: true,
        });

        // Atualiza localStorage para o Dashboard ler os novos pontos
        const usuarioAtualizado = {
          ...usuario,
          pontos: (usuario.pontos || 0) + data.pontos,
        };
        localStorage.setItem(
          "usuarioLogado",
          JSON.stringify(usuarioAtualizado),
        );
        setUsuario(usuarioAtualizado);
      } else {
        setFeedback({
          msg: `❌ ${data.feedback}`,
          color: "red",
          acertou: false,
        });
      }
    } catch (err) {
      setFeedback({ msg: "Erro ao validar resposta.", color: "red" });
    }
  };

  if (!licao) return <div className="container-exercicio">Carregando...</div>;

  return (
    <div className="container-exercicio">

      <h2>{licao.titulo}</h2>
      <p>Clique no botão abaixo para ouvir e escreva o que entendeu:</p>

      <button className="btn-audio" onClick={tocarAudio}>
        🔊 Ouvir Pronúncia
      </button>

      {/* Áudio invisível controlado pelo Ref */}
      <audio ref={audioRef} src={`http://localhost:3000${licao.audio}`} />

      <p className="pergunta-texto">{licao.pergunta}</p>

      <input
        type="text" className="caixa-resposta"
        value={resposta}
        onChange={(e) => setResposta(e.target.value)}
        placeholder="Digite sua resposta aqui..."
        disabled={feedback.acertou}
      />

      {!feedback.acertou ? (
        <button className="btn-concluir" onClick={finalizarExercicio}>
          Concluir Exercício
        </button>
      ) : (
        <button
          className="btn-concluir btn-proximo"
          onClick={() => navigate("/dashboard")}
        >
          Continuar para Dashboard
        </button>
      )}

      <button
        className="btn-voltar-seta"
        onClick={() => navigate("/dashboard")}
      >
        ⬅ Voltar
      </button>

      <div id="feedback-area" style={{ color: feedback.color }}>
        {feedback.msg}
      </div>
    </div>
  );
}

export default Exercicio;
