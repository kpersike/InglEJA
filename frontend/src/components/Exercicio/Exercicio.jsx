import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Exercicio.css";

function Exercicio() {
  const navigate = useNavigate();
  const [exercicio, setExercicio] = useState(null);
  const [selecionada, setSelecionada] = useState(null);
  const [feedback, setFeedback] = useState({ msg: "", color: "", acertou: false });
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const idLicao = localStorage.getItem("licaoAtualId") || "1";
    const dadosUsuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    
    if (!dadosUsuario) {
      navigate("/");
      return;
    }

    setUsuario(dadosUsuario);
    carregarExercicio(idLicao);
  }, [navigate]);

  const carregarExercicio = async (id) => {
    try {
      // Busca o arquivo JSON na pasta public
      const res = await fetch('/full_lessons.json');
      const data = await res.json();
      
      // Procura a lição pelo ID (convertendo para String para garantir)
      const encontrado = data.find(item => String(item.id) === String(id));
      
      if (encontrado) {
        setExercicio(encontrado);
        setSelecionada(null);
        setFeedback({ msg: "", color: "", acertou: false });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Erro ao carregar lição:", err);
    }
  };

  const validar = (opcaoTexto) => {
    if (feedback.acertou) return;

    setSelecionada(opcaoTexto);
    const correta = exercicio.respostaCorreta.toLowerCase().trim();
    const escolhida = opcaoTexto.toLowerCase().trim();

    if (escolhida === correta) {
      // Atualiza pontos do Marcel
      const novosPontos = (usuario.pontos || 0) + (exercicio.pontos || 10);
      const usuarioAtualizado = { ...usuario, pontos: novosPontos };
      
      setUsuario(usuarioAtualizado);
      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioAtualizado));
      
      setFeedback({ msg: "🎉 boaaa!", color: "#10b981", acertou: true });

      // Avanço automático para a próxima lição
      setTimeout(() => {
        const proximoId = parseInt(exercicio.id) + 1;
        if (proximoId <= 20) {
          localStorage.setItem("licaoAtualId", proximoId);
          carregarExercicio(proximoId);
        } else {
          alert("🏆 Parabéns, Marcel! Você completou o Nível 1!");
          navigate("/dashboard");
        }
      }, 1500);
    } else {
      setFeedback({ msg: "❌ Tente novamente!", color: "#ef4444", acertou: false });
    }
  };

  if (!exercicio) return <div className="container-exercicio">Carregando...</div>;

  return (
    <div className="container-exercicio">
      <button className="btn-voltar-simples" onClick={() => navigate("/dashboard")}>
        ⬅ Voltar
      </button>

      <div className="exercicio-header">
        <h2 className="titulo-licao">{exercicio.titulo}</h2>
      </div>

      <div className="exercicio-enunciado">
        <p className="pergunta-texto">{exercicio.pergunta}</p>
      </div>

      {/* CAIXAS DE CLICAR (BOTÕES) */}
      <div className="opcoes-container">
        {[exercicio.opcao_a, exercicio.opcao_b, exercicio.opcao_c, exercicio.opcao_d].map((opt, i) => (
          <button
            key={i}
            className={`opcao-btn ${selecionada === opt ? 'selecionada' : ''} ${feedback.acertou && opt === exercicio.respostaCorreta ? 'correta' : ''}`}
            onClick={() => validar(opt)}
            disabled={feedback.acertou}
          >
            {opt}
          </button>
        ))}
      </div>

      {feedback.msg && (
        <p className="feedback-msg" style={{ color: feedback.color }}>
          {feedback.msg}
        </p>
      )}
    </div>
  );
}

export default Exercicio;