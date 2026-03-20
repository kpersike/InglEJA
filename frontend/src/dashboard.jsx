import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  // Estados para armazenar dados do usuário e a lista de lições
  const [usuario, setUsuario] = useState({ nome: "Aluno", pontos: 0 });
  const [licoes, setLicoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Pega os dados do usuário salvos no Login
    const dadosSalvos = localStorage.getItem("usuarioLogado");

    if (dadosSalvos) {
      setUsuario(JSON.parse(dadosSalvos));
    } else {
      // CORREÇÃO: Se NÃO estiver logado, volta para a tela inicial (Login)
      navigate("/");
      return; // Para a execução aqui
    }

    // 2. Busca as lições reais do seu backend Node
    carregarLicoes();
  }, [navigate]);

  const carregarLicoes = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/licoes");
      const data = await response.json();
      setLicoes(data);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar lições:", error);
      setLoading(false);
    }
  };

  const iniciarLicao = (id) => {
    localStorage.setItem("licaoAtualId", id);
    // MUDANÇA: Usando navigate em vez de window.location.href
    navigate("/exercicio");
  };

  const logout = () => {
    localStorage.removeItem("usuarioLogado");
    // MUDANÇA: Usando navigate para sair
    navigate("/");
  };

  return (
    <div className="dashboard-wrapper">
      <header className="header-dashboard">
        <div className="user-info">
          <h1>InglEJA</h1>
          <p>
            Olá, <strong>{usuario.nome}</strong>! O que vamos aprender hoje?
          </p>
        </div>
        <div className="stats">
          <span className="ponto-badge">🔥 {usuario.pontos} Pontos</span>
          <button onClick={logout} className="btn-sair">
            Sair
          </button>
        </div>
      </header>

      <main className="grid-licoes">
        {loading ? (
          <p>Carregando lições...</p>
        ) : (
          licoes.map((licao) => (
            <div key={licao.id} className="card-licao">
              <div className="card-content">
                <h3>{licao.titulo}</h3>
                <p>Recompensa: {licao.pontos} XP</p>
              </div>
              <button
                className="btn-sucess"
                onClick={() => iniciarLicao(licao.id)}
              >
                COMEÇAR
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default Dashboard;
