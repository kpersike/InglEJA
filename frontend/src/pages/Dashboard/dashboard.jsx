import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import "./dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const timelineRef = useRef(null);
  const menuRef = useRef(null);

  const [menuAberto, setMenuAberto] = useState(null);

  // Estado para controlar a revisão
  const [faseEmRevisao, setFaseEmRevisao] = useState(
    () => localStorage.getItem("fase_em_revisao") || null,
  );

  const [usuario] = useState(() => {
    const dadosSalvos = localStorage.getItem("usuarioLogado");
    return dadosSalvos ? JSON.parse(dadosSalvos) : { nome: "Aluno", nivel: 4 };
  });

  const [configuracoes, setConfiguracoes] = useState(() => {
    const configSalvas = localStorage.getItem("configuracoes_ingleja");
    if (configSalvas) {
      const parsed = JSON.parse(configSalvas);
      if (parsed.layoutHorizontal === undefined) parsed.layoutHorizontal = true;
      return parsed;
    }
    return { som: true, modoEscuro: false, layoutHorizontal: true };
  });

  const [notificacoes, setNotificacoes] = useState(() => {
    const salvas = localStorage.getItem("notificacoes_ingleja");
    return salvas ? JSON.parse(salvas) : [];
  });

  // Substituindo useState+useEffect por useMemo
  const licoes = useMemo(() => {
    const progressoDoBanco = usuario.progresso || {};
    const fasesBase = [
      {
        id: 1,
        slug: "saudacoes",
        titulo: "Saudações Básicas",
        iconeTema: "waving_hand",
        descricao:
          "Aprenda a iniciar conversas e cumprimentar pessoas no dia a dia.",
        tempo: "15 min",
      },
      {
        id: 2,
        slug: "cores",
        titulo: "Cores e Descrições",
        iconeTema: "palette",
        descricao:
          "Explore o vocabulário visual e aprenda a descrever o mundo ao seu redor.",
        tempo: "20 min",
      },
      {
        id: 3,
        slug: "familia",
        titulo: "Membros da Família",
        iconeTema: "family_restroom",
        descricao:
          "Saiba como apresentar seus parentes e falar sobre sua árvore genealógica.",
        tempo: "25 min",
      },
      {
        id: 4,
        slug: "comida",
        titulo: "Alimentos e Bebidas",
        iconeTema: "restaurant",
        descricao:
          "Domine o vocabulário essencial para ir a restaurantes e fazer compras.",
        tempo: "30 min",
      },
      {
        id: 5,
        slug: "musica",
        titulo: "Ritmos e Cultura",
        iconeTema: "music_note",
        descricao:
          "Conheça instrumentos musicais e expressões culturais em inglês.",
        tempo: "20 min",
      },
    ];

    return fasesBase.map((fase, index) => {
      const concluida = progressoDoBanco[fase.slug] === true;
      let status = "bloqueado";

      if (fase.slug === faseEmRevisao) {
        status = "revisando";
      } else if (concluida) {
        status = "concluido";
      } else {
        const anteriorConcluida =
          index === 0 || progressoDoBanco[fasesBase[index - 1].slug] === true;
        if (anteriorConcluida) status = "atual";
      }
      return { ...fase, status };
    });
  }, [usuario.progresso, faseEmRevisao]);

  // A lição ativa prioriza a que está sendo revisada
  const licaoAtual =
    licoes.find((l) => l.status === "revisando") ||
    licoes.find((l) => l.status === "atual") ||
    licoes[licoes.length - 1];

  // Progresso conta as concluídas E as em revisão, para não frustrar o usuário
  const missoesConcluidas = licoes.filter(
    (l) => l.status === "concluido" || l.status === "revisando",
  ).length;
  const totalMissoes = licoes.length;
  const porcentagemProgresso =
    totalMissoes === 0
      ? 0
      : Math.round((missoesConcluidas / totalMissoes) * 100);

  // --- EFEITOS E FUNÇÕES DE ÁUDIO E MENUS ---

  // Função centralizada para tocar sons
  const tocarSom = (arquivo, volume = 0.3) => {
    if (configuracoes.som) {
      const audio = new Audio(`/audios/sfx/${arquivo}`);
      audio.volume = volume;
      audio.play().catch(() => {}); // catch silencia erros se o navegador bloquear o autoplay
    }
  };

  // Efeito ao entrar no Dashboard
  useEffect(() => {
    if (configuracoes.som && !sessionStorage.getItem("sessao_ingleja_ativa")) {
      const audio = new Audio("/audios/sfx/entrada_mapa.mp3");
      audio.volume = 0.2;
      audio.play().catch(() => {});
      sessionStorage.setItem("sessao_ingleja_ativa", "true");
    }
  }, [configuracoes.som]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setMenuAberto(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (configuracoes.modoEscuro) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem(
      "configuracoes_ingleja",
      JSON.stringify(configuracoes),
    );
  }, [configuracoes]);

  useEffect(() => {
    localStorage.setItem("notificacoes_ingleja", JSON.stringify(notificacoes));
  }, [notificacoes]);

  const dispararNotificacao = (titulo, desc) => {
    const novaNotificacao = { id: Date.now(), titulo, desc };
    setNotificacoes((prev) => [novaNotificacao, ...prev]);
  };

  // Toggle do Menu com som
  const toggleMenu = (menu) => {
    if (menuAberto !== menu) tocarSom("clique_menu.mp3", 0.5);
    setMenuAberto(menuAberto === menu ? null : menu);
  };

  // Toggle de Configurações com som especial ao ativar o botão de som
  const toggleConfig = (chave) => {
    setConfiguracoes((prev) => {
      const novoEstado = !prev[chave];
      if (chave === "som" && novoEstado === true) {
        const audio = new Audio("/audios/sfx/acerto.mp3");
        audio.play().catch(() => {});
      }
      return { ...prev, [chave]: novoEstado };
    });
  };

  const fazerLogout = () => {
    localStorage.removeItem("usuarioLogado");
    navigate("/");
  };

  const handleCliqueCirculo = (slug, status) => {
    if (status === "bloqueado") return;
    navigate(`/exercicio/${slug}`);
  };

  const handleRevisarBotao = (slug, tituloLicao) => {
    localStorage.setItem("fase_em_revisao", slug);
    setFaseEmRevisao(slug);
    dispararNotificacao("Modo Revisão", `Você está revisando: ${tituloLicao}`);
  };

  const handleCancelarRevisao = (e) => {
    e.stopPropagation();
    localStorage.removeItem("fase_em_revisao");
    setFaseEmRevisao(null);
    dispararNotificacao(
      "Revisão Concluída",
      `Revisão encerrada. Continue sua jornada!`,
    );
  };

  const scrollTimeline = (direcao) => {
    if (timelineRef.current && configuracoes.layoutHorizontal) {
      const scrollAmount = 300;
      timelineRef.current.scrollBy({
        left: direcao === "esquerda" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      <Navbar />

      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-10 flex flex-col">
        {/* CABEÇALHO DO DASHBOARD */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center w-full mb-10 pl-2 gap-6">
          <div className="w-full md:w-auto text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1 transition-colors text-left">
              Fundamentos de Inglês
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-[15px] font-medium m-0 transition-colors text-left">
              Domine as habilidades essenciais para se comunicar no dia a dia.
            </p>
          </div>

          <div
            className="flex items-center gap-2 relative w-full md:w-auto justify-end"
            ref={menuRef}
          >
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                NÍVEL {missoesConcluidas + 1}
              </span>
              <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200">
                {porcentagemProgresso === 100
                  ? "Mestre de Inglês"
                  : "Explorador Aprendiz"}
              </span>
            </div>

            <button
              className={`w-11 h-11 rounded-full text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex justify-center items-center ${menuAberto === "config" ? "bg-gray-100 dark:bg-gray-800 text-blue-500" : ""}`}
              onClick={() => toggleMenu("config")}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${menuAberto === "config" ? "anim-spin" : ""}`}
              >
                settings
              </span>
            </button>

            <button
              className={`relative w-11 h-11 rounded-full text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex justify-center items-center ${menuAberto === "notificacoes" ? "bg-gray-100 dark:bg-gray-800 text-blue-500" : ""}`}
              onClick={() => toggleMenu("notificacoes")}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${menuAberto === "notificacoes" ? "anim-shake" : ""}`}
              >
                notifications
              </span>
              {notificacoes.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
              )}
            </button>

            <button
              className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-[15px] flex items-center justify-center shadow-md hover:scale-105 transition-transform ml-2"
              onClick={() => toggleMenu("perfil")}
            >
              {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "U"}
            </button>

            {/* DROPDOWNS */}
            {menuAberto === "config" && (
              <div className="absolute top-14 right-0 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-gray-700 z-50 overflow-hidden transition-colors">
                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 text-left">
                  Configurações
                </div>
                <ul className="py-2 m-0 list-none">
                  <li
                    className="px-5 py-2.5 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => toggleConfig("som")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]">
                        volume_up
                      </span>{" "}
                      Som
                    </div>
                    <input
                      type="checkbox"
                      checked={configuracoes.som}
                      readOnly
                      className="accent-blue-500 pointer-events-none"
                    />
                  </li>
                  <li
                    className="px-5 py-2.5 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => toggleConfig("modoEscuro")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]">
                        dark_mode
                      </span>{" "}
                      Tema Escuro
                    </div>
                    <input
                      type="checkbox"
                      checked={configuracoes.modoEscuro}
                      readOnly
                      className="accent-blue-500 pointer-events-none"
                    />
                  </li>
                  <li
                    className="px-5 py-2.5 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => toggleConfig("layoutHorizontal")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]">
                        {configuracoes.layoutHorizontal
                          ? "view_column"
                          : "view_stream"}
                      </span>{" "}
                      Visão Horizontal
                    </div>
                    <input
                      type="checkbox"
                      checked={configuracoes.layoutHorizontal}
                      readOnly
                      className="accent-blue-500 pointer-events-none"
                    />
                  </li>
                </ul>
              </div>
            )}

            {menuAberto === "notificacoes" && (
              <div className="absolute top-14 right-0 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden transition-colors">
                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  Notificações
                  {notificacoes.length > 0 && (
                    <button
                      onClick={() => setNotificacoes([])}
                      className="text-xs text-blue-500 hover:underline border-none bg-transparent cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <ul className="py-2 max-h-60 overflow-y-auto m-0 list-none text-left">
                  {notificacoes.length > 0 ? (
                    notificacoes.map((n) => (
                      <li
                        key={n.id}
                        className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 last:border-0 cursor-pointer transition-colors"
                      >
                        <strong className="block text-[13px] text-gray-800 dark:text-gray-200 mb-1">
                          {n.titulo}
                        </strong>
                        <p className="text-xs text-gray-500 dark:text-gray-400 m-0 leading-tight">
                          {n.desc}
                        </p>
                      </li>
                    ))
                  ) : (
                    <li className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">
                      Nenhuma novidade.
                    </li>
                  )}
                </ul>
              </div>
            )}

            {menuAberto === "perfil" && (
              <div className="absolute top-14 right-0 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden transition-colors">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 text-left">
                  <p className="text-sm font-bold text-gray-900 dark:text-white m-0">
                    {usuario.nome}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 m-0">
                    Nível {usuario.nivel || missoesConcluidas + 1}
                  </p>
                </div>
                <ul className="py-2 m-0 list-none">
                  <li
                    className="px-5 py-2.5 text-sm text-red-500 font-semibold flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors text-left"
                    onClick={fazerLogout}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      logout
                    </span>{" "}
                    Sair
                  </li>
                </ul>
              </div>
            )}
          </div>
        </header>

        {/* CARD DE PROGRESSO GERAL */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 mb-16 shadow-sm border border-gray-100 dark:border-gray-800 w-full transition-colors duration-300">
          <div className="w-full">
            <div className="flex justify-between items-end mb-3">
              <div className="text-left">
                <h3 className="text-[17px] font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                  Seu Progresso Geral
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm m-0 transition-colors">
                  Continue assim! Você está dominando o idioma.
                </p>
              </div>
              <h2 className="text-3xl font-extrabold text-blue-500 m-0">
                {porcentagemProgresso}%
              </h2>
            </div>
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4 transition-colors">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${porcentagemProgresso}%` }}
              ></div>
            </div>
            <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider transition-colors text-left">
              {missoesConcluidas} DE {totalMissoes} MISSÕES CONCLUÍDAS
            </div>
          </div>
        </section>

        {/* TRILHA DINÂMICA */}
        <div className="relative w-full mb-16 group">
          {configuracoes.layoutHorizontal && (
            <button
              className="absolute -left-4 md:-left-16 top-[85px] -translate-y-1/2 z-30 w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex justify-center items-center text-gray-500 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all"
              onClick={() => scrollTimeline("esquerda")}
            >
              <span className="material-symbols-outlined text-[28px]">
                chevron_left
              </span>
            </button>
          )}

          <main
            className={`relative w-full py-10 ${
              configuracoes.layoutHorizontal
                ? "flex flex-row items-start overflow-x-auto hide-scrollbar scroll-smooth" // px-10 foi removido daqui!
                : "flex flex-col items-center gap-16"
            }`}
            ref={timelineRef}
            style={
              configuracoes.layoutHorizontal
                ? { scrollSnapType: "x mandatory" }
                : {}
            }
          >
            {licoes.map((licao, index) => (
              <div
                key={licao.id}
                className={`flex flex-col items-center relative shrink-0 ${
                  configuracoes.layoutHorizontal
                    ? "w-[250px]"
                    : "w-full max-w-[350px]"
                }`}
                style={
                  configuracoes.layoutHorizontal
                    ? { scrollSnapAlign: "center" }
                    : {}
                }
              >
                {/* LINHA DE CONEXÃO (Pontilhada Refinada) - CORRIGIDA AQUI */}
                {/* LINHA DE CONEXÃO (Gradiente com Máscara de Pontos) */}
                {index !== licoes.length - 1 && (
                  <div
                    className={`absolute z-0 transition-all duration-700 ${
                      configuracoes.layoutHorizontal
                        ? "top-[43px] left-[50%] w-full h-[4px]"
                        : "top-[43px] left-[50%] h-[calc(100%+64px)] w-[4px] -translate-x-1/2"
                    }`}
                    style={{
                      // A mágica acontece aqui: criamos uma imagem de fundo (fundo linear)
                      // e mascaramos ela com bolinhas para formar a linha pontilhada moderna.
                      background:
                        licao.status === "concluido" ||
                        licao.status === "revisando"
                          ? "linear-gradient(to right, #3b82f6 0%, #93c5fd 100%)" // Azul escuro para claro
                          : licao.status === "atual"
                            ? "linear-gradient(to right, #3b82f6 0%, transparent 100%)" // Azul sumindo em direção à lição bloqueada
                            : "#e5e7eb", // Cinza estático para lições totalmente futuras

                      // Máscara SVG que corta o fundo gradiente em bolinhas
                      WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='12' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='black'/%3E%3C/svg%3E")`,
                      WebkitMaskRepeat: configuracoes.layoutHorizontal
                        ? "repeat-x"
                        : "repeat-y",
                      maskImage: `url("data:image/svg+xml,%3Csvg width='12' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='black'/%3E%3C/svg%3E")`,
                      maskRepeat: configuracoes.layoutHorizontal
                        ? "repeat-x"
                        : "repeat-y",
                    }}
                  ></div>
                )}

                {/* CÍRCULO DA LIÇÃO (Estilo Soft/Neumórfico) */}
                <div
                  onClick={() => handleCliqueCirculo(licao.slug, licao.status)}
                  onMouseEnter={() =>
                    licao.status !== "bloqueado" && tocarSom("hover_mapa.mp3")
                  }
                  className={`
                    relative flex items-center justify-center rounded-full transition-all duration-500 z-10
                    ${licao.status !== "bloqueado" ? "cursor-pointer hover:-translate-y-1" : "cursor-not-allowed"}
                    ${
                      licao.status === "atual" || licao.status === "revisando"
                        ? "w-[90px] h-[90px] bg-white dark:bg-gray-900 shadow-[0_0_0_10px_rgba(255,255,255,1),0_0_40px_15px_rgba(59,130,246,0.25)] dark:shadow-[0_0_0_10px_rgba(17,24,39,1),0_0_40px_15px_rgba(59,130,246,0.4)] border border-blue-50 dark:border-gray-800"
                        : "w-[85px] h-[85px] bg-white dark:bg-gray-900 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-gray-50 dark:border-gray-800 mt-[2.5px]"
                    }
                  `}
                >
                  <span
                    className={`
                    material-symbols-outlined transition-colors duration-300
                    ${licao.status === "atual" || licao.status === "revisando" ? "text-[40px] text-blue-500 dark:text-blue-400" : "text-[36px]"}
                    ${licao.status === "concluido" ? "text-blue-600 dark:text-blue-500" : ""}
                    ${licao.status === "bloqueado" ? "text-gray-400 dark:text-gray-500" : ""}
                    ${licao.iconeTema === "waving_hand" && licao.status !== "bloqueado" ? "anim-wave" : ""}
                  `}
                  >
                    {licao.status === "concluido"
                      ? "check"
                      : licao.status === "bloqueado"
                        ? "lock"
                        : licao.iconeTema}
                  </span>
                </div>

                {/* TEXTOS DA LIÇÃO (Tipografia Refinada) */}
                <div
                  className={`
                  mt-8 text-center flex flex-col items-center px-4 py-3 z-10 w-full
                  ${!configuracoes.layoutHorizontal ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 dark:border-gray-800 mt-6" : ""}
                `}
                >
                  <span
                    className={`text-[12px] font-bold mb-1.5 transition-colors uppercase tracking-widest ${
                      licao.status === "atual" || licao.status === "revisando"
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    Lição {index + 1}
                  </span>

                  <h3
                    className={`text-[16px] font-extrabold m-0 mb-2 leading-tight transition-colors ${
                      licao.status === "atual" || licao.status === "revisando"
                        ? "text-slate-800 dark:text-white"
                        : "text-slate-600 dark:text-gray-300"
                    }`}
                  >
                    {licao.titulo}
                  </h3>

                  <span
                    className={`text-[13px] font-semibold transition-colors
                    ${licao.status === "atual" || licao.status === "concluido" ? "text-blue-600 dark:text-blue-500" : ""}
                    ${licao.status === "revisando" ? "text-purple-600 dark:text-purple-400" : ""}
                    ${licao.status === "bloqueado" ? "text-gray-400 dark:text-gray-500" : ""}
                  `}
                  >
                    {licao.status === "atual"
                      ? "Em Progresso"
                      : licao.status === "revisando"
                        ? "Revisando"
                        : licao.status === "concluido"
                          ? "Concluída"
                          : "Bloqueada"}
                  </span>

                  {licao.status === "concluido" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevisarBotao(licao.slug, licao.titulo);
                      }}
                      className="mt-3 text-[12px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-5 py-2 rounded-full cursor-pointer border-none shadow-sm"
                    >
                      Revisar Lição
                    </button>
                  )}

                  {/* 👇👇👇 COLE O NOVO CÓDIGO EXATAMENTE AQUI 👇👇👇 */}
                  {licao.status === "revisando" && (
                    <button
                      onClick={(e) => handleCancelarRevisao(e)}
                      className="mt-3 text-[12px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 px-5 py-2 rounded-full cursor-pointer border-none shadow-sm"
                    >
                      Cancelar Revisão
                    </button>
                  )}
                  {/* 👆👆👆 ATÉ AQUI 👆👆👆 */}
                </div>
              </div>
            ))}
          </main>

          {configuracoes.layoutHorizontal && (
            <button
              className="absolute -right-4 md:-right-16 top-[85px] -translate-y-1/2 z-30 w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex justify-center items-center text-gray-500 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all"
              onClick={() => scrollTimeline("direita")}
            >
              <span className="material-symbols-outlined text-[28px]">
                chevron_right
              </span>
            </button>
          )}
        </div>

        {/* CARD INFERIOR DA LIÇÃO ATIVA */}
        <section className="mt-auto w-full bg-white dark:bg-gray-900 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-gray-800 p-7 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-300">
          <div className="flex-1 text-left">
            <h4 className="text-[14px] font-bold text-gray-900 dark:text-white mb-1.5 transition-colors">
              Sobre esta lição
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-[13.5px] leading-relaxed max-w-2xl m-0 transition-colors">
              {licaoAtual.descricao}
            </p>
          </div>

          <div className="flex items-center gap-8 md:border-l md:border-gray-100 dark:md:border-gray-800 md:pl-8 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  schedule
                </span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">
                  Tempo Estimado
                </span>
                <span className="text-[14px] font-bold text-gray-900 dark:text-white transition-colors">
                  {licaoAtual.tempo}
                </span>
              </div>
            </div>

            {/* BOTÕES DINÂMICOS BASEADOS NO STATUS */}
            <div className="flex items-center gap-3">
              {licaoAtual.status === "concluido" && (
                <button
                  onClick={() =>
                    handleRevisarBotao(licaoAtual.slug, licaoAtual.titulo)
                  }
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-colors text-[14px] border-none cursor-pointer"
                >
                  Revisar Nível
                </button>
              )}

              {licaoAtual.status === "revisando" && (
                <>
                  <button
                    onClick={(e) => handleCancelarRevisao(e)}
                    className="bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-semibold py-2.5 px-3 transition-colors text-[14px] border-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() =>
                      handleCliqueCirculo(licaoAtual.slug, licaoAtual.status)
                    }
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-[14px] border-none cursor-pointer"
                  >
                    Continuar Revisão
                    <span className="material-symbols-outlined text-lg">
                      chevron_right
                    </span>
                  </button>
                </>
              )}

              {licaoAtual.status === "atual" && (
                <button
                  onClick={() =>
                    handleCliqueCirculo(licaoAtual.slug, licaoAtual.status)
                  }
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-[14px] border-none cursor-pointer"
                >
                  Continuar Lição
                  <span className="material-symbols-outlined text-lg">
                    chevron_right
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
