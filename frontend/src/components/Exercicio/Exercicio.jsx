import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Exercicio.css";

function Exercicio() {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  const [exercicio, setExercicio] = useState(null);
  const [selecionada, setSelecionada] = useState(null);
  const [feedback, setFeedback] = useState({
    msg: "",
    color: "",
    acertou: false,
  });
  const [usuario, setUsuario] = useState(null);
  const [fullLessons, setFullLessons] = useState([]);

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
      console.log("Tentando carregar exercício ID:", id); // Debug no console (F12)
      
      // CORREÇÃO 1: Nome do arquivo ajustado para o que está na pasta public
      const response = await fetch('/full_lessons.json'); 
      if (!response.ok) throw new Error("Arquivo JSON não encontrado na pasta public!");
      
      const data = await response.json();
      
      // CORREÇÃO 2: Comparação de string para garantir que IDs maiores que 10 funcionem
      const licaoEncontrada = data.find(item => String(item.id) === String(id));
      
      if (licaoEncontrada) {
        console.log("Lição encontrada:", licaoEncontrada);
        setExercicio(licaoEncontrada);
      } else {
        console.error("ID não existe no JSON. Verifique se o ID no localStorage é de 1 a 20.");
      }
    } catch (err) {
      console.error("Erro crítico ao carregar:", err);
    }
  };

  const tocarAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Áudio não disponível'));
    }
  };

  const validarResposta = (texto) => {
    if (feedback.acertou) return;

    const respostaCorreta = exercicio.respostaCorreta.toLowerCase().trim();
    const respostaUsuario = texto.toLowerCase().trim();
    
    const acertou = respostaCorreta === respostaUsuario;
    
    setSelecionada(texto);
    
    if (acertou) {
      // Update points locally
      const pontos = exercicio.pontos || 10;
      const usuarioAtualizado = {
        ...usuario,
        pontos: (usuario.pontos || 0) + pontos,
      };
      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioAtualizado));
      setUsuario(usuarioAtualizado);

      setFeedback({
        msg: `🎉 boaaa! +${pontos} pontos!`,
        color: "#10b981",
        acertou: true,
      });

      // CORREÇÃO 3: Auto advance atualizado para suportar até a lição 20
      const currentId = parseInt(exercicio.id);
      if (currentId < 20) { 
        setTimeout(() => {
          const nextId = currentId + 1;
          localStorage.setItem('licaoAtualId', nextId);
          window.location.reload();
        }, 2000);
      } else {
        // Finalização ao chegar na 20
        setTimeout(() => {
          alert("🏆 Parabéns! Você completou todas as 20 lições de Saudações!");
          navigate("/dashboard");
        }, 2000);
      }
    } else {
      setFeedback({
        msg: "❌ Tente novamente!",
        color: "#ef4444",
        acertou: false,
      });
    }
  };

  if (!exercicio) return <div className="container-exercicio">Carregando...</div>;

  return (
    <div className="container-exercicio">
      <button className="btn-voltar-simples" onClick={() => navigate("/dashboard")}>
        ⬅ Voltar ao Dashboard
      </button>

      <div className="exercicio-header">
        <h2>{exercicio.titulo}</h2>
        <button className="btn-audio" onClick={tocarAudio}>
          🔊 Ouvir
        </button>
        <audio ref={audioRef} src={`http://localhost:3000${exercicio.audio}`} preload="auto" />
      </div>

      <div className="exercicio-enunciado">
        <p className="pergunta-texto">{exercicio.pergunta}</p>
      </div>

      <div className="opcoes-container">
        <button
          className={`opcao-btn ${selecionada === exercicio.opcao_a ? 'selecionada' : ''} ${feedback.acertou ? 'disabled' : ''}`}
          onClick={() => validarResposta(exercicio.opcao_a)}
          disabled={feedback.acertou}
        >
          {exercicio.opcao_a}
        </button>
        <button
          className={`opcao-btn ${selecionada === exercicio.opcao_b ? 'selecionada' : ''} ${feedback.acertou ? 'disabled' : ''}`}
          onClick={() => validarResposta(exercicio.opcao_b)}
          disabled={feedback.acertou}
        >
          {exercicio.opcao_b}
        </button>
        <button
          className={`opcao-btn ${selecionada === exercicio.opcao_c ? 'selecionada' : ''} ${feedback.acertou ? 'disabled' : ''}`}
          onClick={() => validarResposta(exercicio.opcao_c)}
          disabled={feedback.acertou}
        >
          {exercicio.opcao_c}
        </button>
        <button
          className={`opcao-btn ${selecionada === exercicio.opcao_d ? 'selecionada' : ''} ${feedback.acertou ? 'disabled' : ''}`}
          onClick={() => validarResposta(exercicio.opcao_d)}
          disabled={feedback.acertou}
        >
          {exercicio.opcao_d}
        </button>
      </div>

      {feedback.msg && (
        <div className="feedback" style={{color: feedback.color}}>
          {feedback.msg}
        </div>
      )}
    </div>
  );
};

export default Exercicio;