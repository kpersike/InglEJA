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

  // 1. Controle dos Menus e "Clique Fora"
  const [menuAberto, setMenuAberto] = useState(null);
  const menuRef = useRef(null);

  // 2. Lógica de Configurações Dinâmicas
  const [configuracoes, setConfiguracoes] = useState({
    som: true,
    modoEscuro: false,
  });

  // 3. Lógica de Notificações
  const [notificacoes, setNotificacoes] = useState([]);

  // --- LÓGICA DE INICIALIZAÇÃO DA TRILHA ---
  const [licoes, setLicoes] = useState(() => {
    const chaveProgresso = `progresso_${usuario.email}`;
    const progressoSalvo = localStorage.getItem(chaveProgresso);

    if (progressoSalvo) {
      return JSON.parse(progressoSalvo);
    }

    return [
      {
        id: 1,
        titulo: "Nível 1: Saudações",
        descricao: '"Hello", "Good Morning" e cortesias básicas.',
        iconeTema: "waving_hand",
        status: "atual",
      },
      {
        id: 2,
        titulo: "Nível 2: Cores",
        descricao: "Aprenda a descrever o mundo ao seu redor.",
        iconeTema: "palette",
        status: "bloqueado",
      },
      {
        id: 3,
        titulo: "Nível 3: Família",
        descricao: "Bloqueado. Complete 'Cores' para liberar.",
        iconeTema: "family_restroom",
        status: "bloqueado",
      },
      {
        id: 4,
        titulo: "Nível 4: Comida",
        descricao: "Bloqueado.",
        iconeTema: "restaurant",
        status: "bloqueado",
      },
      {
        id: 5,
        titulo: "Nível 5: Música",
        descricao: "Bloqueado.",
        iconeTema: "music_note",
        status: "bloqueado",
      },
    ];
  });

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

  // --- LÓGICA DE PROGRESSO ATUALIZADA ---
  // Agora ele conta como concluída tanto as que estão "concluido" quanto as que estão "revisando"
  const missoesConcluidas = licoes.filter(
    (l) => l.status === "concluido" || l.status === "revisando",
  ).length;

  const totalMissoes = licoes.length;
  const porcentagemProgresso =
    totalMissoes === 0
      ? 0
      : Math.round((missoesConcluidas / totalMissoes) * 100);
  const xpAcumulado = missoesConcluidas * 250;

  // ==========================================
  // NOVAS FUNÇÕES DE LÓGICA DA TRILHA
  // ==========================================

  // 1. LÓGICA DE CLIQUE NO CÍRCULO (Navegação)
  const handleCliqueCirculo = (id, status) => {
    if (status === "bloqueado") return;

    // Se estiver atual, concluido ou revisando, vai para os exercícios
    localStorage.setItem("licaoAtualId", id);
    navigate("/exercicio");
  };

  // 2. LÓGICA DO BOTÃO "CONTINUAR MISSÃO"
  const handleContinuarBotao = (id) => {
    const novasLicoes = licoes.map((licao, index) => {
      if (licao.id === id) return { ...licao, status: "concluido" };
      if (index > 0 && licoes[index - 1].id === id)
        return { ...licao, status: "atual" };
      return licao;
    });

    setLicoes(novasLicoes);
    const chaveProgresso = `progresso_${usuario.email}`;
    localStorage.setItem(chaveProgresso, JSON.stringify(novasLicoes));

    setNotificacoes((prev) => [
      {
        id: Date.now(),
        tipo: "sucesso",
        titulo: "Novo Nível Liberado!",
        msg: `Você avançou no mapa.`,
      },
      ...prev,
    ]);
  };

  // 3. LÓGICA DO BOTÃO "REVISAR NÍVEL" (Altera o Status)
  const handleRevisarBotao = (id, atualStatus) => {
    // Alterna entre "concluido" e "revisando"
    const novoStatus = atualStatus === "concluido" ? "revisando" : "concluido";

    const novasLicoes = licoes.map((licao) => {
      if (licao.id === id) {
        return { ...licao, status: novoStatus };
      }
      return licao;
    });

    setLicoes(novasLicoes);

    // Salva o novo status roxo no navegador
    const chaveProgresso = `progresso_${usuario.email}`;
    localStorage.setItem(chaveProgresso, JSON.stringify(novasLicoes));

    // Só dispara a notificação se estiver entrando no modo de revisão
    if (novoStatus === "revisando") {
      setNotificacoes((prev) => [
        {
          id: Date.now(),
          tipo: "sucesso",
          titulo: "Modo Revisão",
          msg: "Nível liberado! Clique no círculo roxo para acessar os exercícios.",
        },
        ...prev,
      ]);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="material-symbols-outlined icon-blue">map</span>
          <h2>Missões de Inglês</h2>
        </div>

        <div
          className="header-right"
          ref={menuRef}
          style={{ position: "relative" }}
        >
          <div className="profile-info">
            <span className="profile-level">NÍVEL 5</span>
            <span className="profile-title">Explorador Aprendiz</span>
          </div>

          <button
            className={`icon-btn ${menuAberto === "config" ? "ativo" : ""}`}
            onClick={() => toggleMenu("config")}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>

          <button
            className={`icon-btn ${menuAberto === "notificacoes" ? "ativo" : ""}`}
            onClick={() => toggleMenu("notificacoes")}
            style={{ position: "relative" }}
          >
            <span className="material-symbols-outlined">notifications</span>
            {notificacoes.length > 0 && <span className="notif-badge"></span>}
          </button>

          <button className="avatar-btn" onClick={() => toggleMenu("perfil")}>
            {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "U"}
          </button>

          {/* --- MENUS FLUTUANTES --- */}
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
                  <input
                    type="checkbox"
                    checked={configuracoes.modoEscuro}
                    readOnly
                  />
                </li>
              </ul>
            </div>
          )}

          {menuAberto === "notificacoes" && (
            <div className="dropdown-menu">
              <div
                className="dropdown-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                Notificações
                {notificacoes.length > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#3b82f6",
                      cursor: "pointer",
                    }}
                    onClick={limparNotificacoes}
                  >
                    Limpar
                  </span>
                )}
              </div>
              <ul className="dropdown-list notifications-list">
                {notificacoes.length > 0 ? (
                  notificacoes.map((notif) => (
                    <li key={notif.id}>
                      <div
                        className={`notif-icon ${notif.tipo === "sucesso" ? "green" : "orange"}`}
                      >
                        <span className="material-symbols-outlined">
                          {notif.tipo === "sucesso"
                            ? "check_circle"
                            : "local_fire_department"}
                        </span>
                      </div>
                      <div>
                        <strong>{notif.titulo}</strong>
                        <p>{notif.msg}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li
                    style={{
                      justifyContent: "center",
                      color: "#9ca3af",
                      padding: "20px",
                    }}
                  >
                    Nenhuma notificação.
                  </li>
                )}
              </ul>
            </div>
          )}

          {menuAberto === "perfil" && (
            <div className="dropdown-menu profile-menu">
              <div className="dropdown-header">Meu Perfil</div>
              <div className="profile-stats">
                <p>
                  <strong>Nome:</strong> {usuario.nome}
                </p>
                <p>
                  <strong>XP Total:</strong> {xpAcumulado}
                </p>
              </div>
              <ul className="dropdown-list">
                <li>
                  <span className="material-symbols-outlined">edit</span> Editar
                  Conta
                </li>
                <li className="logout-item" onClick={fazerLogout}>
                  <span className="material-symbols-outlined">logout</span> Sair
                  do InglEJA
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
            <p>Continue assim! Você está dominando o idioma.</p>
          </div>
          <h2 className="progress-percentage">{porcentagemProgresso}%</h2>
        </div>

        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{ width: `${porcentagemProgresso}%` }}
          ></div>
        </div>

        <div className="progress-footer">
          <span>
            {missoesConcluidas} de {totalMissoes} missões concluídas
          </span>
          <span className="streak-badge">
            <span className="material-symbols-outlined streak-icon">
              local_fire_department
            </span>
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
              <div
                className="node-circle"
                onClick={() => handleCliqueCirculo(licao.id, licao.status)}
              >
                {licao.status === "atual" && (
                  <div className="node-badge">JOGANDO AGORA</div>
                )}
                {licao.status === "concluido" && (
                  <div className="node-badge-green">CONCLUÍDO</div>
                )}
                {licao.status === "revisando" && (
                  <div className="node-badge-purple">REVISANDO</div>
                )}

                <span className="material-symbols-outlined node-icon">
                  {licao.status === "concluido"
                    ? "check_circle"
                    : licao.status === "bloqueado"
                      ? "lock"
                      : licao.iconeTema}
                </span>
              </div>

              <div className="node-content">
                <h3>{licao.titulo}</h3>
                <p>{licao.descricao}</p>

                {licao.status === "atual" && (
                  <button
                    className="btn-start"
                    onClick={() => handleContinuarBotao(licao.id)}
                  >
                    Continuar Missão
                  </button>
                )}

                {licao.status === "concluido" && (
                  <button
                    className="btn-review"
                    onClick={() => handleRevisarBotao(licao.id, licao.status)}
                  >
                    Revisar Nível
                  </button>
                )}

                {/* Permite cancelar a revisão caso o usuário mude de ideia */}
                {licao.status === "revisando" && (
                  <button
                    className="btn-review"
                    style={{ color: "#8b5cf6" }}
                    onClick={() => handleRevisarBotao(licao.id, licao.status)}
                  >
                    Cancelar Revisão
                  </button>
                )}
              </div>

              {index !== licoes.length - 1 && (
                <div className="timeline-line"></div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default Dashboard;
