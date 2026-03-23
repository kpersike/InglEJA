import React, { useState } from "react"; // Adicionei o useState aqui
import { useNavigate } from "react-router-dom";
import mascoteImg from "../../assets/mascote.png";
import "./Welcome.css";

const Welcome = () => {
  const navigate = useNavigate();
  
  // 1. Estado para capturar o nome do input
  const [nomeDigitado, setNomeDigitado] = useState("");

  // 2. Função para salvar o nome e ir para o Dashboard
  const finalizarWelcome = async () => {
    const emailUsuario = localStorage.getItem("emailUsuario");
    console.log("Tentando atualizar o email:", emailUsuario);

    if (!nomeDigitado.trim()) {
      alert("Por favor, digite seu nome para continuar!");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/atualizar-nome", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: emailUsuario, 
          novoNome: nomeDigitado 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // CRUCIAL: Atualiza o usuarioLogado para o Dashboard permitir a entrada
        localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));
        
        // Agora sim, navegamos com tudo pronto!
        navigate("/dashboard");
      } else {
        alert("Erro ao salvar o nome. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Erro ao falar com o servidor.");
    }
  };

  return (
    <div className="welcome-container">
      {/* Cabeçalho Principal */}
      <header className="welcome-header">
        <h1>Bem-vindo ao <span>InglEJA</span></h1>
        <p>Aprender inglês nunca foi tão divertido e simples. Vamos começar sua jornada agora mesmo?</p>
      </header>

      {/* Card Central com a Ilustração */}
      <div className="illustration-card">
        <div className="image-placeholder">
           <img src={mascoteImg} alt="Mascot Illustration" className="mascote-img" />
        </div>
      </div>

      {/* Card de Input (Pergunta o nome) */}
      <div className="name-card">
        <div className="input-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#318ff5" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Como podemos te chamar?</span>
        </div>
        
        <input 
          type="text" 
          placeholder="Ex: Maria Oliveira" 
          className="welcome-input"
          value={nomeDigitado} // Liga o input ao estado
          onChange={(e) => setNomeDigitado(e.target.value)} // Atualiza o estado ao digitar
        />
        
        {/* Chamamos a função finalizarWelcome no clique */}
        <button className="btn-start" onClick={finalizarWelcome}>
          Começar Jogar
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </button>
      </div>

      {/* Grid de Benefícios no Rodapé */}
      <footer className="welcome-features">
        <div className="feature-item">
          <div className="icon-circle azul">😊</div>
          <h3>Divertido</h3>
          <p>Aprenda brincando com desafios interativos.</p>
        </div>
        <div className="feature-item">
          <div className="icon-circle claro">✨</div>
          <h3>Simples</h3>
          <p>Design pensado para quem não tem prática com tecnologia.</p>
        </div>
        <div className="feature-item">
          <div className="icon-circle relogio">🕒</div>
          <h3>No seu tempo</h3>
          <p>Pratique alguns minutos por dia e veja a evolução.</p>
        </div>
      </footer>
      
      <p className="copyright">© 2026 InglEJA. Todos os direitos reservados.</p>
    </div>
  );
};

export default Welcome;