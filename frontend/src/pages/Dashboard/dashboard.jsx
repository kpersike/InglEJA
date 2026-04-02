import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [usuario] = useState(() => {
    const dadosSalvos = localStorage.getItem("usuarioLogado");
    return dadosSalvos
      ? JSON.parse(dadosSalvos)
      : {
          email: "visitante@teste.com",
          nome: "Aluno",
          nivel: 1,
          titulo: "Iniciante",
        };
  });

  const [loading] = useState(false);
  const [menuAberto, setMenuAberto] = useState(null);
  const menuRef = useRef(null);

  const [configuracoes, setConfiguracoes] = useState({
    som: true,
    modoEscuro: false,
  });

  const [notificacoes, setNotificacoes] = useState([]);

  // --- LÓGICA DE INICIALIZAÇÃO DA TRILHA DINÂMICA ---
  // Dentro da função Dashboard
  const [licoes, setLicoes] = useState(() => {
    // Pegamos o progresso que veio do banco de dados através do login
    const progressoDoBanco = usuario.progresso || {};

    const fasesBase = [
      { id: 1, slug: "saudacoes", titulo: "Nível 1: Saudações", iconeTema: "waving_hand" },
      { id: 2, slug: "cores", titulo: "Nível 2: Cores", iconeTema: "palette" },
      { id: 3, slug: "familia", titulo: "Nível 3: Família", iconeTema: "family_restroom" },
      { id: 4, slug: "comida", titulo: "Nível 4: Comida", iconeTema: "restaurant" },
      { id: 5, slug: "musica", titulo: "Nível 5: Música", iconeTema: "music_note" },
    ];

    return fasesBase.map((fase, index) => {
      const concluida = progressoDoBanco[fase.slug] === true;
      let status = "bloqueado";

      if (concluida) {
        status = "concluido";
      } else {
        // Liberado se for a primeira ou se a anterior foi concluída no banco
        const anteriorConcluida = index === 0 || progressoDoBanco[fasesBase[index - 1].slug] === true;
        if (anteriorConcluida) status = "atual";
      }
      return { ...fase, status };
    });
  });

  // --- CÁLCULOS DE PROGRESSO ---
  const missoesConcluidas = licoes.filter((l) => l.status === "concluido").length;
  const totalMissoes = licoes.length;
  const porcentagemProgresso = totalMissoes === 0 ? 0 : Math.round((missoesConcluidas / totalMissoes) * 100);
  const xpAcumulado = missoesConcluidas * 250;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (configuracoes.modoEscuro) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [configuracoes.modoEscuro]);

  const toggleMenu = (menu) => {
    setMenuAberto(menuAberto === menu ? null : menu);
  };

  const fazerLogout = () => {
    localStorage.removeItem("usuarioLogado");
    navigate("/");
  };

  const toggleConfig = (chave) => {
    setConfiguracoes((prev) => ({ ...prev, [chave]: !prev[chave] }));
  };

  const limparNotificacoes = () => {
    setNotificacoes([]);
  };

  // --- NAVEGAÇÃO ---
  const handleCliqueCirculo = (slug, status) => {
    if (status === "bloqueado") return;
    navigate(`/exercicio/${slug}`);
  };

  const handleContinuarBotao = (slug) => {
    navigate(`/exercicio/${slug}`);
  };

  const handleRevisarBotao = (slug) => {
    navigate(`/exercicio/${slug}`);
  };

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="material-symbols-outlined icon-blue">map</span>
          <h2>Missões de Inglês</h2>
        </div>

        <div className="header-right" ref={menuRef} style={{ position: "relative" }}>
          <div className="profile-info">
            <span className="profile-level">NÍVEL {missoesConcluidas + 1}</span>
            <span className="profile-title">{porcentagemProgresso === 100 ? "Mestre de Inglês" : "Explorador Aprendiz"}</span>
          </div>

          <button className={`icon-btn ${menuAberto === "config" ? "ativo" : ""}`} onClick={() => toggleMenu("config")}>
            <span className="material-symbols-outlined">settings</span>
          </button>

          <button className={`icon-btn ${menuAberto === "notificacoes" ? "ativo" : ""}`} onClick={() => toggleMenu("notificacoes")}>
            <span className="material-symbols-outlined">notifications</span>
            {notificacoes.length > 0 && <span className="notif-badge"></span>}
          </button>

          <button className="avatar-btn" onClick={() => toggleMenu("perfil")}>
            {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "U"}
          </button>

          {menuAberto === "config" && (
            <div className="dropdown-menu">
              <div className="dropdown-header">Configurações</div>
              <ul className="dropdown-list">
                <li onClick={() => toggleConfig("som")}>
                  <span className="material-symbols-outlined">volume_up</span>
                  Efeitos Sonoros
                  <input type="checkbox" checked={configuracoes.som} readOnly />
                </li>
                <li onClick={() => toggleConfig("modoEscuro")}>
                  <span className="material-symbols-outlined">dark_mode</span>
                  Modo Escuro
                  <input type="checkbox" checked={configuracoes.modoEscuro} readOnly />
                </li>
              </ul>
            </div>
          )}

          {menuAberto === "perfil" && (
            <div className="dropdown-menu profile-menu">
              <div className="dropdown-header">Meu Perfil</div>
              <div className="profile-stats">
                <p><strong>Nome:</strong> {usuario.nome}</p>
                <p><strong>XP Total:</strong> {xpAcumulado}</p>
              </div>
              <ul className="dropdown-list">
                <li className="logout-item" onClick={fazerLogout}>
                  <span className="material-symbols-outlined">logout</span> Sair do InglEJA
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      <section className="progress-card">
        <div className="progress-header">
          <div className="progress-texts">
            <h3>Seu Progresso Geral</h3>
            <p>{porcentagemProgresso === 100 ? "Parabéns! Você completou tudo!" : "Continue assim! Você está dominando o idioma."}</p>
          </div>
          <h2 className="progress-percentage">{porcentagemProgresso}%</h2>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${porcentagemProgresso}%` }}></div>
        </div>
        <div className="progress-footer">
          <span>{missoesConcluidas} de {totalMissoes} missões concluídas</span>
          <span className="streak-badge">
            <span className="material-symbols-outlined streak-icon">local_fire_department</span>
            Série de 5 dias!
          </span>
        </div>
      </section>

      <main className="timeline-container">
        {loading ? (
          <p>Carregando mapa...</p>
        ) : (
          licoes.map((licao, index) => (
            <div key={licao.id} className={`timeline-node ${licao.status}`}>
              <div className="node-circle" onClick={() => handleCliqueCirculo(licao.slug, licao.status)}>
                {licao.status === "atual" && <div className="node-badge">JOGANDO AGORA</div>}
                {licao.status === "concluido" && <div className="node-badge-green">CONCLUÍDO</div>}

                <span className="material-symbols-outlined node-icon">
                  {licao.status === "concluido" ? "check_circle" : licao.status === "bloqueado" ? "lock" : licao.iconeTema}
                </span>
              </div>

              <div className="node-content">
                <h3>{licao.titulo}</h3>
                <p>{licao.descricao}</p>

                {licao.status === "atual" && (
                  <button className="btn-start" onClick={() => handleContinuarBotao(licao.slug)}>
                    Continuar Missão
                  </button>
                )}

                {licao.status === "concluido" && (
                  <button className="btn-review" onClick={() => handleRevisarBotao(licao.slug)}>
                    Revisar Nível
                  </button>
                )}
              </div>

              {index !== licoes.length - 1 && <div className="timeline-line"></div>}
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default Dashboard;