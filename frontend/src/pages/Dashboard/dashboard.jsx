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

  // Referências para fechar o menu e para o scroll do carrossel
  const menuRef = useRef(null);
  const timelineRef = useRef(null);

  // Salva as configurações (Som, Modo Escuro e Layout Horizontal) no LocalStorage
  const [configuracoes, setConfiguracoes] = useState(() => {
    const configSalvas = localStorage.getItem("configuracoes_ingleja");
    let config = configSalvas 
      ? JSON.parse(configSalvas) 
      : { som: true, modoEscuro: false, layoutHorizontal: false };

    // Usa sessionStorage para saber se a página acabou de ser aberta ou se é só um refresh
    const jaEstavaNestaSessao = sessionStorage.getItem("sessao_ingleja_ativa");
    
    if (!jaEstavaNestaSessao) {
      // O usuário acabou de abrir o site (nova aba/janela), forçamos o som a vir ticado
      config.som = true;
      sessionStorage.setItem("sessao_ingleja_ativa", "true");
    }

    return config;
  });

  useEffect(() => {
    localStorage.setItem(
      "configuracoes_ingleja",
      JSON.stringify(configuracoes),
    );
  }, [configuracoes]);

  // Inicializa lendo do localStorage, se não tiver nada, inicia vazio
  const [notificacoes, setNotificacoes] = useState(() => {
    const salvas = localStorage.getItem("notificacoes_ingleja");
    return salvas ? JSON.parse(salvas) : [];
  });

  // Sempre que a lista de notificações mudar, salva no localStorage
  useEffect(() => {
    localStorage.setItem("notificacoes_ingleja", JSON.stringify(notificacoes));
  }, [notificacoes]);

  // Crie um estado para a revisão persistir enquanto o usuário navega
  const [, setFaseEmRevisao] = useState(() => {
    return localStorage.getItem("fase_em_revisao") || null;
  });

  const [licoes, setLicoes] = useState(() => {
    const progressoDoBanco = usuario.progresso || {};

    const fasesBase = [
      {
        id: 1,
        slug: "saudacoes",
        titulo: "Nível 1: Saudações",
        iconeTema: "waving_hand",
        descricao: "Saudações básicas.",
      },
      {
        id: 2,
        slug: "cores",
        titulo: "Nível 2: Cores",
        iconeTema: "palette",
        descricao: "Cores e descrições.",
      },
      {
        id: 3,
        slug: "familia",
        titulo: "Nível 3: Família",
        iconeTema: "family_restroom",
        descricao: "Membros da família.",
      },
      {
        id: 4,
        slug: "comida",
        titulo: "Nível 4: Comida",
        iconeTema: "restaurant",
        descricao: "Alimentos e restaurantes.",
      },
      {
        id: 5,
        slug: "musica",
        titulo: "Nível 5: Música",
        iconeTema: "music_note",
        descricao: "Ritmos e instrumentos.",
      },
    ];

    // Recupera qual fase estava sendo revisada (salvo no passo anterior)
    const slugSendoRevisado = localStorage.getItem("fase_em_revisao");

    return fasesBase.map((fase, index) => {
      const concluida = progressoDoBanco[fase.slug] === true;
      let status = "bloqueado";

      if (fase.slug === slugSendoRevisado) {
        status = "revisando"; // Prioridade visual para revisão
      } else if (concluida) {
        status = "concluido";
      } else {
        const anteriorConcluida =
          index === 0 || progressoDoBanco[fasesBase[index - 1].slug] === true;
        if (anteriorConcluida) status = "atual";
      }
      return { ...fase, status };
    });
  });

  // --- CÁLCULOS DE PROGRESSO ---
  const missoesConcluidas = licoes.filter(
    (l) => l.status === "concluido",
  ).length;
  const totalMissoes = licoes.length;
  const porcentagemProgresso =
    totalMissoes === 0
      ? 0
      : Math.round((missoesConcluidas / totalMissoes) * 100);
  const xpAcumulado = missoesConcluidas * 250;

  // Lógica de filtro removida: Agora usamos 'licoes' diretamente para que
  // todos os níveis (mesmo bloqueados) apareçam no carrossel.

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

  // ... seus outros estados e hooks ...

  // Efeito para tocar som ao entrar no Dashboard
  useEffect(() => {
    if (configuracoes.som) {
      const audio = new Audio("/audios/sfx/entrada_mapa.mp3"); 
      audio.volume = 0.2; // Opcional: define o volume em 50%
      audio.play().catch(err => console.warn("Aguardando interação para tocar som."));
    }
  }, []); // Executa apenas no mount

  // ... resto do componente ...

  const toggleMenu = (menu) => {
    const novoEstado = menuAberto === menu ? null : menu;

    // Tocar som se estiver abrindo um menu e o som estiver ligado
    if (novoEstado !== null && configuracoes.som) {
      const audio = new Audio("/audios/sfx/clique_menu.mp3"); // ou o seu arquivo de preferência
      audio.volume = 0.5;
      audio.play().catch(err => console.log("Erro ao tocar som:", err));
    }

    setMenuAberto(novoEstado);
  };

  const fazerLogout = () => {
    localStorage.removeItem("usuarioLogado");
    navigate("/");
  };

  const toggleConfig = (chave) => {
    setConfiguracoes((prev) => {
      const novoEstado = !prev[chave];

      if (chave === "som" && novoEstado === true) {
        const audio = new Audio("/audios/sfx/acerto.mp3");
        audio.play().catch((err) => console.log("Erro ao tocar áudio:", err));
      }

      return { ...prev, [chave]: novoEstado };
    });
  };

  const limparNotificacoes = () => {
    setNotificacoes([]);
  };

  const handleNotificacaoClick = (slug) => {
    if (slug) {
      setMenuAberto(null);
      setTimeout(() => {
        const elementoLicao = document.getElementById(`licao-${slug}`);
        if (elementoLicao) {
          elementoLicao.scrollIntoView({
            behavior: "smooth",
            block: configuracoes.layoutHorizontal ? "nearest" : "center",
          });
          elementoLicao.style.transition = "transform 0.3s";
          elementoLicao.style.transform = "scale(1.05)";
          setTimeout(() => (elementoLicao.style.transform = "scale(1)"), 400);
        }
      }, 50);
    }
  };

  const dispararNotificacao = (
    titulo,
    desc,
    icone = "info",
    tipo = "info",
    acaoSlug = null,
  ) => {
    const novaNotificacao = {
      id: Date.now(),
      titulo,
      desc,
      icone,
      tipo,
      acaoSlug,
    };
    setNotificacoes((prev) => [novaNotificacao, ...prev]);
  };

  // --- NAVEGAÇÃO ---
  const handleCliqueCirculo = (slug, status) => {
    if (status === "bloqueado") return;
    navigate(`/exercicio/${slug}`);
  };

  const handleRevisarBotao = (slug) => {
    localStorage.setItem("fase_em_revisao", slug);
    setFaseEmRevisao(slug);

    setLicoes((prev) =>
      prev.map((l) => {
        if (l.slug === slug) return { ...l, status: "revisando" };
        return l;
      }),
    );

    dispararNotificacao(
      "Modo Revisão",
      `Você ativou a revisão da missão: ${slug}`,
      "history",
      "info",
      slug,
    );
  };

  const handleCancelarRevisao = (slug) => {
    localStorage.removeItem("fase_em_revisao");
    setFaseEmRevisao(null);

    setLicoes((prev) =>
      prev.map((l) => {
        if (l.slug === slug) return { ...l, status: "concluido" };
        return l;
      }),
    );
  };

  // Função para mover o carrossel horizontalmente nas setas
  const scrollTimeline = (direcao) => {
    if (timelineRef.current) {
      const scrollAmount = 320; // Quantidade de pixels que a tela desliza por clique
      timelineRef.current.scrollBy({
        left: direcao === "esquerda" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const tocarSom = (arquivo) => {
  if (configuracoes.som) {
    const audio = new Audio(`/audios/sfx/${arquivo}`);
    audio.volume = 0.3; // Volume mais baixo para não irritar no hover
    audio.play().catch(() => {}); // Catch vazio para ignorar erros de autoplay
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
            <span className="profile-level">NÍVEL {missoesConcluidas + 1}</span>
            <span className="profile-title">
              {porcentagemProgresso === 100
                ? "Mestre de Inglês"
                : "Explorador Aprendiz"}
            </span>
          </div>

          <button
            className={`icon-btn ${menuAberto === "config" ? "ativo" : ""}`}
            onClick={() => toggleMenu("config")}
          >
            <span className="material-symbols-outlined anim-spin">settings</span>
          </button>

          <button
            className={`icon-btn ${menuAberto === "notificacoes" ? "ativo" : ""}`}
            onClick={() => toggleMenu("notificacoes")}
          >
            <span className="material-symbols-outlined anim-shake">notifications</span>
            {notificacoes.length > 0 && <span className="notif-badge"></span>}
          </button>

          <button className="avatar-btn" onClick={() => toggleMenu("perfil")} onMouseEnter={() => tocarSom("hover_mapa.mp3")}>
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
                  <input
                    type="checkbox"
                    checked={configuracoes.modoEscuro}
                    readOnly
                  />
                </li>
                <li onClick={() => toggleConfig("layoutHorizontal")}>
                  <span className="material-symbols-outlined">
                    {configuracoes.layoutHorizontal
                      ? "view_column"
                      : "view_stream"}
                  </span>
                  Visão Horizontal
                  <input
                    type="checkbox"
                    checked={configuracoes.layoutHorizontal || false}
                    readOnly
                  />
                </li>
              </ul>
            </div>
          )}

          {menuAberto === "notificacoes" && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                Notificações
                {notificacoes.length > 0 && (
                  <button onClick={limparNotificacoes} className="btn-limpar">
                    Limpar
                  </button>
                )}
              </div>
              <ul className="dropdown-list notifications-list">
                {notificacoes.length > 0 ? (
                  notificacoes.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => handleNotificacaoClick(n.acaoSlug)}
                      style={{ cursor: n.acaoSlug ? "pointer" : "default" }}
                    >
                      <div className={`notif-icon ${n.tipo}`}>
                        <span className="material-symbols-outlined">
                          {n.icone}
                        </span>
                      </div>
                      <div>
                        <strong>{n.titulo}</strong>
                        <p>{n.desc}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="notif-vazia">Nenhuma novidade por aqui.</li>
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
            <p>
              {porcentagemProgresso === 100
                ? "Parabéns! Você completou tudo!"
                : "Continue assim! Você está dominando o idioma."}
            </p>
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

      {/* Container wrapper que exibe as setas apenas se for modo horizontal */}
      <div
        className={`timeline-wrapper ${configuracoes.layoutHorizontal ? "horizontal-mode" : ""}`}
      >
        {configuracoes.layoutHorizontal && licoes.length > 2 && (
          <button
            className="scroll-arrow left"
            onClick={() => scrollTimeline("esquerda")}
          >
            <span className="material-symbols-outlined" style={{margin: 0}}>chevron_left</span>
          </button>
        )}

        <main
          className={`timeline-container ${configuracoes.layoutHorizontal ? "horizontal" : ""}`}
          ref={timelineRef}
        >
          {loading ? (
            <p>Carregando mapa...</p>
          ) : (
            // AQUI ESTÁ A CORREÇÃO: Usando 'licoes' direto para renderizar TUDO, inclusive os bloqueados
            licoes.map((licao, index) => (
              <div
                key={licao.id}
                id={`licao-${licao.slug}`}
                className={`timeline-node ${licao.status}`}
              >
                <div
                  className={`node-circle ${licao.status} ${licao.iconeTema === "palette" && licao.status !== "bloqueado" ? "effect-colors" : ""}`}
                  onClick={() => handleCliqueCirculo(licao.slug, licao.status)}
                  // ADICIONE ESTA LINHA ABAIXO:
                  onMouseEnter={() => licao.status !== "bloqueado" && tocarSom("hover_mapa.mp3")}
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

                  <span className={`material-symbols-outlined node-icon ${
                    licao.status !== "concluido" && licao.status !== "bloqueado" && licao.iconeTema === "waving_hand"
                      ? "anim-wave" 
                      : ""
                  }`}>
                    {licao.status === "concluido"
                      ? "check_circle"
                      : licao.status === "bloqueado"
                        ? "lock"
                        : licao.iconeTema}
                  </span>
                </div>

                <div className="node-content" onMouseEnter={() => licao.status !== "bloqueado" && tocarSom("hover_mapa.mp3")}>
                  <h3>{licao.titulo}</h3>
                  <p>{licao.descricao}</p>

                  {licao.status === "atual" && (
                    <button
                      className="btn-start"
                      onClick={() => navigate(`/exercicio/${licao.slug}`)}
                    >
                      Continuar Missão
                    </button>
                  )}

                  {licao.status === "concluido" && (
                    <button
                      className="btn-review"
                      onClick={() => handleRevisarBotao(licao.slug)}
                    >
                      Revisar Nível
                    </button>
                  )}

                  {licao.status === "revisando" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                      }}
                    >
                      <button
                        className="btn-start-review"
                        onClick={() => navigate(`/exercicio/${licao.slug}`)}
                      >
                        Continuar Revisão
                      </button>
                      <button
                        className="btn-review"
                        style={{ color: "#6b7280" }}
                        onClick={() => handleCancelarRevisao(licao.slug)}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
                {/* A linha se estende sempre, exceto após a última lição do array */}
                {index !== licoes.length - 1 && (
                  <div className="timeline-line"></div>
                )}
              </div>
            ))
          )}
        </main>

        {configuracoes.layoutHorizontal && licoes.length > 2 && (
          <button
            className="scroll-arrow right"
            onClick={() => scrollTimeline("direita")}
          >
            <span className="material-symbols-outlined" style={{margin: 0}}>chevron_right</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
