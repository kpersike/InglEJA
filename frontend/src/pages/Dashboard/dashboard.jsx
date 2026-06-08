import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import Navbar from "../../components/Navbar/Navbar";
import "./dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "https://ingleja-backend.onrender.com";

function Dashboard() {
  const navigate = useNavigate();
  const timelineRef = useRef(null);
  const menuRef = useRef(null);

  const [menuAberto, setMenuAberto] = useState(null);

  // Estado para controlar a revisão
  const [faseEmRevisao, setFaseEmRevisao] = useState(
    () => localStorage.getItem("fase_em_revisao") || null,
  );

  const [dadosLicoes, setDadosLicoes] = useState(null);

  // NOVO: Estado para armazenar simulados disponíveis
  const [simuladosDisponiveis, setSimuladosDisponiveis] = useState([]);

  const [usuario] = useState(() => {
    const dadosSalvos = localStorage.getItem("usuarioLogado");
    return dadosSalvos ? JSON.parse(dadosSalvos) : { nome: "Aluno", nivel: 4 };
  });

  const [configuracoes, setConfiguracoes] = useState(() => {
    const configSalvas = localStorage.getItem("configuracoes_ingleja");
    if (configSalvas) {
      const parsed = JSON.parse(configSalvas);
      if (parsed.layoutHorizontal === undefined) parsed.layoutHorizontal = true;
      if (parsed.temaPrincipal === undefined)
        parsed.temaPrincipal = "theme-blue";
      if (parsed.acessibilidadeAtiva === undefined)
        parsed.acessibilidadeAtiva = false;
      if (parsed.vlibrasAtivo === undefined) parsed.vlibrasAtivo = false;
      return parsed;
    }
    return {
      som: true,
      modoEscuro: false,
      layoutHorizontal: true,
      temaPrincipal: "theme-blue",
      acessibilidadeAtiva: false,
      vlibrasAtivo: false,
    };
  });

  const [notificacoes, setNotificacoes] = useState(() => {
    const salvas = localStorage.getItem("notificacoes_ingleja");
    return salvas ? JSON.parse(salvas) : [];
  });

  useEffect(() => {
    const tutorialVisto = localStorage.getItem("tutorial_ingleja_visto");
    let driverObj = null;

    if (!tutorialVisto) {
      driverObj = driver({
        showProgress: true,
        animate: true,
        nextBtnText: "Próximo &rarr;",
        prevBtnText: "&larr; Anterior",
        doneBtnText: "Começar!",
        allowClose: true,
        onDestroyStarted: () => {
          if (!driverObj.hasNextStep() || confirm("Deseja pular o tutorial?")) {
            localStorage.setItem("tutorial_ingleja_visto", "true");
            driverObj.destroy();
          }
        },
        steps: [
          {
            popover: {
              title: "🚀 Bem-vindo ao InglEJA!",
              description:
                "Vamos fazer um tour rápido pela sua nova plataforma de estudos? Prometo que é jogo rápido!",
            },
          },
          {
            element: "#tour-progresso",
            popover: {
              title: "Seu Progresso",
              description:
                "Aqui você acompanha o seu nível atual e o quanto falta para dominar o módulo.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#tour-trilha",
            popover: {
              title: "Trilha de Lições",
              description:
                "Este é o seu mapa. Clique nas lições azuis para aprender coisas novas ou revise lições já concluídas.",
              side: "top",
              align: "center",
            },
          },
          {
            element: "#tour-menu",
            popover: {
              title: "Ajustes e Avisos",
              description:
                "No menu superior, você pode ativar/desativar sons, alterar entre modo escuro e claro, alterar orientação e visualizar notificações.",
              side: "bottom",
              align: "end",
            },
          },
        ],
      });

      setTimeout(() => {
        driverObj.drive();
      }, 800);
    }

    return () => {
      if (driverObj) {
        driverObj.destroy();
      }
    };
  }, []);

  // Busca lições e simulados da API
  useEffect(() => {
    fetch(`${API_URL}/api/admin/licoes`)
      .then((res) => res.json())
      .then((data) => {
        setDadosLicoes(data);
      })
      .catch((err) => console.error("Erro ao carregar lições:", err));

    // NOVO: Busca simulados ativos
    fetch(`${API_URL}/api/admin/simulados`)
      .then((res) => res.json())
      .then((data) => {
        if (data.simulados) {
          const ativos = data.simulados.filter((sim) => sim.ativo === true);
          setSimuladosDisponiveis(ativos);
        }
      })
      .catch((err) => console.error("Erro ao carregar simulados:", err));
  }, []);

  const licoes = useMemo(() => {
    if (!dadosLicoes || !dadosLicoes.niveis) return [];

    const progressoDoBanco = usuario.progresso || {};
    const iconesPadrao = [
      "waving_hand",
      "palette",
      "family_restroom",
      "restaurant",
      "music_note",
      "star",
      "school",
      "bolt",
      "flag",
      "extension",
    ];

    const fasesBase = (dadosLicoes?.niveis || []).map((nivel, index) => ({
      id: nivel.id,
      slug: nivel.slug,
      titulo: nivel.titulo,
      iconeTema: nivel.iconeTema || iconesPadrao[index % iconesPadrao.length],
      descricao:
        nivel.descricao || `Aprenda sobre ${nivel.titulo.toLowerCase()}`,
      tempo: nivel.tempo || "20 min",
    }));

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
  }, [usuario.progresso, faseEmRevisao, dadosLicoes]);

  const licaoAtual =
    licoes.find((l) => l.status === "revisando") ||
    licoes.find((l) => l.status === "atual") ||
    licoes[licoes.length - 1];

  const missoesConcluidas = licoes.filter(
    (l) => l.status === "concluido" || l.status === "revisando",
  ).length;
  const totalMissoes = licoes.length;
  const porcentagemProgresso =
    totalMissoes === 0
      ? 0
      : Math.round((missoesConcluidas / totalMissoes) * 100);

  const tocarSom = (arquivo, volume = 0.3) => {
    if (configuracoes.som) {
      const audio = new Audio(`/audios/sfx/${arquivo}`);
      audio.volume = volume;
      audio.play().catch(() => {});
    }
  };

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

    const todosTemas = [
      "theme-blue",
      "theme-green",
      "theme-purple",
      "theme-rose",
      "theme-orange",
    ];
    document.documentElement.classList.remove(...todosTemas);
    document.documentElement.classList.add(
      configuracoes.temaPrincipal || "theme-blue",
    );

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

  const toggleMenu = (menu) => {
    if (menuAberto !== menu) tocarSom("clique_menu.mp3", 0.5);
    setMenuAberto(menuAberto === menu ? null : menu);
  };

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
    localStorage.removeItem("emailUsuario");
    localStorage.removeItem("fase_em_revisao");
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
    <div className="min-h-screen bg-transparent transition-colors duration-300 flex flex-col">
      <Navbar usuario={usuario} />

      {/* NOVO: BANNER DE SIMULADO ATIVO */}
      {simuladosDisponiveis.length > 0 && (
        <div className="w-full bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 p-4 sticky top-[72px] z-40 animate-[fadeIn_0.5s_ease-out]">
          <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined anim-shake">
                  quiz
                </span>
              </div>
              <div>
                <h3 className="font-bold text-orange-800 dark:text-orange-400 text-sm md:text-base m-0 leading-tight">
                  Novo Simulado Disponível!
                </h3>
                <p className="text-orange-600 dark:text-orange-500 text-xs md:text-sm font-medium m-0">
                  {simuladosDisponiveis[0].titulo} - Teste seus conhecimentos
                  agora.
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                alert(
                  `A tela do Simulado "${simuladosDisponiveis[0].titulo}" será implementada na Fase 2.`,
                )
              }
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full shadow-sm hover:-translate-y-0.5 transition-all w-full sm:w-auto cursor-pointer border-none text-sm"
            >
              Começar Simulado
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-10 flex flex-col flex-1">
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
            id="tour-menu"
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
              className={`w-11 h-11 rounded-full text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex justify-center items-center cursor-pointer border-none ${menuAberto === "config" ? "bg-gray-100 dark:bg-gray-800 text-primary-500" : ""}`}
              onClick={() => toggleMenu("config")}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${menuAberto === "config" ? "anim-spin" : ""}`}
              >
                settings
              </span>
            </button>

            <button
              className={`relative w-11 h-11 rounded-full text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex justify-center items-center cursor-pointer border-none ${menuAberto === "notificacoes" ? "bg-gray-100 dark:bg-gray-800 text-primary-500" : ""}`}
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
              className="w-11 h-11 rounded-full bg-primary-600 text-white font-bold text-[15px] flex items-center justify-center shadow-md hover:scale-105 transition-transform ml-2 overflow-hidden cursor-pointer border-none"
              onClick={() => toggleMenu("perfil")}
            >
              {usuario.avatar ? (
                <img
                  src={usuario.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : usuario.nome ? (
                usuario.nome.charAt(0).toUpperCase()
              ) : (
                "U"
              )}
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
                      className="text-xs text-primary-500 hover:underline border-none bg-transparent cursor-pointer"
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
                  <li className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 font-semibold flex flex-col gap-3 cursor-default transition-colors text-left border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]">
                        palette
                      </span>{" "}
                      Cores do Tema
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {[
                        { classe: "theme-blue", corBotao: "bg-blue-500" },
                        { classe: "theme-green", corBotao: "bg-green-500" },
                        { classe: "theme-purple", corBotao: "bg-purple-500" },
                        { classe: "theme-rose", corBotao: "bg-rose-500" },
                        { classe: "theme-orange", corBotao: "bg-orange-500" },
                      ].map((tema) => (
                        <button
                          key={tema.classe}
                          onClick={() =>
                            setConfiguracoes({
                              ...configuracoes,
                              temaPrincipal: tema.classe,
                            })
                          }
                          className={`w-6 h-6 rounded-full ${tema.corBotao} transition-all hover:scale-110 border-none cursor-pointer ${configuracoes.temaPrincipal === tema.classe ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800" : ""}`}
                          title={tema.classe.replace("theme-", "")}
                        />
                      ))}
                    </div>
                  </li>
                  <li
                    className="px-5 py-2.5 text-sm text-gray-600 dark:text-gray-300 font-semibold flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors text-left border-b border-gray-100 dark:border-gray-700"
                    onClick={() => navigate("/perfil")}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      manage_accounts
                    </span>{" "}
                    Personalizar Perfil
                  </li>
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
        <section
          id="tour-progresso"
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 mb-16 shadow-sm border border-gray-100 dark:border-gray-800 w-full transition-colors duration-300"
        >
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
              <h2 className="text-3xl font-extrabold text-primary-500 m-0">
                {porcentagemProgresso}%
              </h2>
            </div>
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4 transition-colors">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${porcentagemProgresso}%` }}
              ></div>
            </div>
            <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider transition-colors text-left">
              {missoesConcluidas} DE {totalMissoes} MISSÕES CONCLUÍDAS
            </div>
          </div>
        </section>

        {/* TRILHA DINÂMICA */}
        <div id="tour-trilha" className="relative w-full mb-16 group">
          {configuracoes.layoutHorizontal && (
            <button
              className="absolute -left-4 md:-left-16 top-[85px] -translate-y-1/2 z-30 w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex justify-center items-center text-gray-500 shadow-[0_4px_20px_rgba(0,0,0,0.08)] cursor-pointer hover:text-primary-600 hover:scale-110 transition-all"
              onClick={() => scrollTimeline("esquerda")}
            >
              <span className="material-symbols-outlined text-[28px]">
                chevron_left
              </span>
            </button>
          )}

          <main
            className={`relative w-full py-10 ${configuracoes.layoutHorizontal ? "flex flex-row items-start overflow-x-auto hide-scrollbar scroll-smooth" : "flex flex-col items-center gap-16"}`}
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
                className={`flex flex-col items-center relative shrink-0 ${configuracoes.layoutHorizontal ? "w-[250px]" : "w-full max-w-[350px]"}`}
                style={
                  configuracoes.layoutHorizontal
                    ? { scrollSnapAlign: "center" }
                    : {}
                }
              >
                {index !== licoes.length - 1 && (
                  <div
                    className={`absolute z-0 transition-all duration-700 ${configuracoes.layoutHorizontal ? "top-[43px] left-[50%] w-full h-[4px]" : "top-[43px] left-[50%] h-[calc(100%+64px)] w-[4px] -translate-x-1/2"}`}
                    style={{
                      background:
                        licao.status === "concluido" ||
                        licao.status === "revisando"
                          ? "linear-gradient(to right, #3b82f6 0%, #93c5fd 100%)"
                          : licao.status === "atual"
                            ? "linear-gradient(to right, #3b82f6 0%, transparent 100%)"
                            : "#e5e7eb",
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

                <div
                  onClick={() => handleCliqueCirculo(licao.slug, licao.status)}
                  onMouseEnter={() =>
                    licao.status !== "bloqueado" && tocarSom("hover_mapa.mp3")
                  }
                  className={`relative flex items-center justify-center rounded-full transition-all duration-500 z-10 group circle-icon ${licao.status !== "bloqueado" ? "cursor-pointer hover:-translate-y-1" : "cursor-not-allowed"} ${licao.status === "atual" || licao.status === "revisando" ? "w-[90px] h-[90px] bg-white dark:bg-gray-900 shadow-[0_0_0_10px_rgba(255,255,255,1),0_0_40px_15px_rgba(59,130,246,0.25)] border border-primary-50" : "w-[85px] h-[85px] bg-white dark:bg-gray-900 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-50 mt-[2.5px]"}`}
                >
                  {licao.iconeTema === "restaurant" &&
                  licao.status !== "concluido" &&
                  licao.status !== "bloqueado" ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={`w-[1em] h-[1em] anim-cross transition-colors duration-300 ${licao.status === "atual" || licao.status === "revisando" ? "text-[40px] text-primary-500" : "text-[36px]"}`}
                    >
                      <path
                        className="fork"
                        d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.88 3.75 3.99V22h2.5v-9.01C11.34 12.88 13 11.12 13 9V2h-2v7z"
                      />
                      <path
                        className="knife"
                        d="M16 6v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"
                      />
                    </svg>
                  ) : (
                    <span
                      className={`material-symbols-outlined transition-colors duration-300 ${licao.status === "atual" || licao.status === "revisando" ? "text-[40px] text-primary-500" : "text-[36px]"} ${licao.status === "concluido" ? "text-primary-600 anim-check" : ""} ${licao.status === "bloqueado" ? "text-gray-400" : ""} ${licao.iconeTema === "waving_hand" && licao.status !== "concluido" && licao.status !== "bloqueado" ? "anim-wave" : ""} ${licao.iconeTema === "palette" && licao.status !== "concluido" && licao.status !== "bloqueado" ? "anim-palette" : ""} ${licao.iconeTema === "family_restroom" && licao.status !== "concluido" && licao.status !== "bloqueado" ? "anim-jump" : ""} ${licao.iconeTema === "music_note" && licao.status !== "concluido" && licao.status !== "bloqueado" ? "anim-music-main" : ""}`}
                    >
                      {licao.status === "concluido"
                        ? "check"
                        : licao.status === "bloqueado"
                          ? "lock"
                          : licao.iconeTema}
                    </span>
                  )}
                  {licao.iconeTema === "music_note" &&
                    licao.status !== "concluido" &&
                    licao.status !== "bloqueado" && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <span className="material-symbols-outlined absolute text-primary-500/70 text-[18px] m-note m-note-1">
                          music_note
                        </span>
                        <span className="material-symbols-outlined absolute text-primary-500/70 text-[22px] m-note m-note-2">
                          music_note
                        </span>
                        <span className="material-symbols-outlined absolute text-primary-500/70 text-[16px] m-note m-note-3">
                          music_note
                        </span>
                      </div>
                    )}
                </div>

                <div
                  className={`mt-8 text-center flex flex-col items-center px-4 py-3 z-10 w-full ${!configuracoes.layoutHorizontal ? "bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 mt-6" : ""}`}
                >
                  <span
                    className={`text-[12px] font-bold mb-1.5 transition-colors uppercase tracking-widest ${licao.status === "atual" || licao.status === "revisando" ? "text-primary-500" : "text-gray-400"}`}
                  >
                    Lição {index + 1}
                  </span>
                  <h3
                    className={`text-[16px] font-extrabold m-0 mb-2 leading-tight transition-colors ${licao.status === "atual" || licao.status === "revisando" ? "text-slate-800 dark:text-white" : "text-slate-600"}`}
                  >
                    {licao.titulo}
                  </h3>
                  <span
                    className={`text-[13px] font-semibold transition-colors ${licao.status === "atual" || licao.status === "concluido" ? "text-primary-600" : ""} ${licao.status === "revisando" ? "text-purple-600" : ""} ${licao.status === "bloqueado" ? "text-gray-400" : ""}`}
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
                      className="mt-3 text-[12px] font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-5 py-2 rounded-full cursor-pointer border-none shadow-sm"
                    >
                      Revisar Lição
                    </button>
                  )}
                  {licao.status === "revisando" && (
                    <button
                      onClick={(e) => handleCancelarRevisao(e)}
                      className="mt-3 text-[12px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-5 py-2 rounded-full cursor-pointer border-none shadow-sm"
                    >
                      Cancelar Revisão
                    </button>
                  )}
                </div>
              </div>
            ))}
          </main>

          {configuracoes.layoutHorizontal && (
            <button
              type="button"
              className={`absolute -right-4 md:-right-16 top-[85px] -translate-y-1/2 z-30 w-12 h-12 bg-white border border-gray-200 rounded-full flex justify-center items-center text-gray-500 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:text-primary-600 hover:scale-110 transition-all cursor-pointer`}
              onClick={() => scrollTimeline("direita")}
            >
              <span className="material-symbols-outlined text-[28px]">
                chevron_right
              </span>
            </button>
          )}
        </div>

        {/* CARD INFERIOR DA LIÇÃO ATIVA */}
        {licaoAtual && (
          <section className="mt-auto w-full bg-white dark:bg-gray-900 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-gray-800 p-7 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-300">
            <div className="flex-1 text-left">
              <h4 className="text-[14px] font-bold text-gray-900 dark:text-white mb-1.5 transition-colors">
                Sobre esta lição
              </h4>
              <p className="text-gray-500 dark:text-gray-400 text-[13.5px] leading-relaxed max-w-2xl m-0 transition-colors">
                {licaoAtual.descricao}
              </p>
            </div>
            <div className="flex items-center gap-8 md:border-l md:border-gray-100 md:pl-8 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">
                    schedule
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Tempo Estimado
                  </span>
                  <span className="text-[14px] font-bold text-gray-900 dark:text-white">
                    {licaoAtual.tempo}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {licaoAtual.status === "concluido" && (
                  <button
                    onClick={() =>
                      handleRevisarBotao(licaoAtual.slug, licaoAtual.titulo)
                    }
                    className="bg-gray-100 text-primary-600 font-semibold py-2.5 px-6 rounded-lg shadow-sm border-none cursor-pointer"
                  >
                    Revisar Nível
                  </button>
                )}
                {licaoAtual.status === "revisando" && (
                  <>
                    <button
                      onClick={(e) => handleCancelarRevisao(e)}
                      className="bg-transparent text-gray-400 font-semibold py-2.5 px-3 rounded-lg border-none cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() =>
                        handleCliqueCirculo(licaoAtual.slug, licaoAtual.status)
                      }
                      className="bg-purple-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm flex items-center gap-2 border-none cursor-pointer"
                    >
                      Continuar Revisão{" "}
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
                    className="bg-[#2563eb] text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm flex items-center gap-2 border-none cursor-pointer"
                  >
                    Continuar Lição{" "}
                    <span className="material-symbols-outlined text-lg">
                      chevron_right
                    </span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
