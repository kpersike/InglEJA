import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./TelaConquista.css";

// Adicionando valores padrão para as estatísticas para simular a imagem
const TelaConquista = ({ xpGanhos, tempoTotal, comboAtual, tituloNivel }) => {
  const navigate = useNavigate();

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
          <div className="md-stat-box">
            <div className="md-stat-header">
              <span class="material-symbols-outlined" style={{color: "#1a73e8"}}>star</span>
              <span>PONTOS GANHOS</span>
            </div>
            <strong className="md-stat-value">+{xpGanhos} XP</strong>
            <span className="md-stat-badge md-stat-recorde">↗ +15% Recorde</span>
          </div>

          {/* Tempo Total */}
          <div className="md-stat-box">
            <div className="md-stat-header">
              <span class="material-symbols-outlined" style={{color: "#1a73e8"}}>timer</span>
              <span>TEMPO TOTAL</span>
            </div>
            <strong className="md-stat-value">{tempoTotal}</strong>
            <span className="md-stat-detail">Média do nível</span>
          </div>

          {/* Combo Atual */}
          <div className="md-stat-box">
            <div className="md-stat-header">
              <span class="material-symbols-outlined" style={{color: "#1a73e8"}}>bolt</span>
              <span>COMBO ATUAL</span>
            </div>
            <strong className="md-stat-value">x{comboAtual}</strong>
            <span className="md-stat-detail">Sequência perfeita</span>
          </div>

        </div>

        {/* Botões de Ação */}
        <div className="md-action-buttons">
          <button className="md-btn-continuar" onClick={() => navigate('/dashboard')}>
            <span class="material-symbols-outlined">play_arrow</span>
            Continuar para o Nível 2
          </button>
          
          <button className="md-btn-mapa" onClick={() => navigate('/mapa')}>
            <span class="material-symbols-outlined">map</span>
            Voltar ao Mapa
          </button>
        </div>

      </div>
    </div>
  );
};

export default TelaConquista;