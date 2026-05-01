import React, { useEffect } from 'react';
import confetti from 'canvas-confetti'; // Importa a biblioteca
import { useNavigate } from 'react-router-dom';
import "./TelaConquista.css";

// Adicionando valores padrão para as estatísticas para simular a imagem
const TelaConquista = ({ xpGanhos, tempoTotal, comboAtual, tituloNivel, proximoSlug, proximoTitulo }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Configuração do disparo de confetes
    const duration = 5 * 1000; // 3 segundos de duração
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Dispara dois jatos laterais
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval); // Limpa o intervalo se o usuário sair da tela
  }, []);

  const irParaProximo = () => {
    if (proximoSlug) {
      // Navega para http://localhost:5173/exercicio/[slug-da-vez]
      navigate(`/exercicio/${proximoSlug}`);

      window.location.reload();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="md-tela-conquista-overlay">
      <div className="md-card-conquista">
        
        {/* Ícone de Troféu no Círculo Azul */}
        <div className="md-trophy-wrapper">
          <div className="md-trophy-circle">
            <span class="material-symbols-outlined" style={{color: "white", fontSize: "5em"}}>trophy</span>
          </div>
        </div>

        {/* Textos Principais */}
        <h1 className="md-parabens-title">Parabéns!</h1>
        <p className="md-concluiu-subtitle">Você concluiu o {tituloNivel}!</p>
        
        {/* Container das Estatísticas */}
        <div className="md-stats-container">
          
          {/* Pontos Ganhos */}
          <div id="pontos-ganhos" className="md-stat-box">
            <div className="md-stat-header">
              <span id="material-symbols-outlined-star" class="material-symbols-outlined">star</span>
              <span>PONTOS GANHOS</span>
            </div>
            <strong className="md-stat-value">+{xpGanhos} XP</strong>
            <span className="md-stat-badge md-stat-recorde">↗ +15% Recorde</span>
          </div>

          {/* Tempo Total */}
          <div id="tempo-total" className="md-stat-box">
            <div className="md-stat-header">
              <span id="material-symbols-outlined-timer" class="material-symbols-outlined">timer</span>
              <span>TEMPO TOTAL</span>
            </div>
            <strong className="md-stat-value">{tempoTotal}</strong>
            <span className="md-stat-detail">Média do nível</span>
          </div>

          {/* Combo Atual */}
          <div id="combo-atual" className="md-stat-box">
            <div className="md-stat-header">
              <span id="material-symbols-outlined-bolt" class="material-symbols-outlined">bolt</span>
              <span>COMBO ATUAL</span>
            </div>
            <strong className="md-stat-value">x{comboAtual}</strong>
            <span className="md-stat-detail">Sequência perfeita</span>
          </div>

        </div>

        {/* Botões de Ação */}
        <div className="md-action-buttons">
          <button className="md-btn-continuar" onClick={irParaProximo}>
            <span className="material-symbols-outlined">
              {proximoSlug ? "play_arrow" : "celebration"}
            </span>
            {proximoSlug ? `Continuar para o ${proximoTitulo}` : "Concluir Jornada"}
          </button>
          
          <button className="md-btn-mapa" onClick={() => navigate('/dashboard')}>
            <span class="material-symbols-outlined">map</span>
            Voltar ao Mapa
          </button>
        </div>

      </div>
    </div>
  );
};

export default TelaConquista;