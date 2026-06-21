import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import Navbar from "../../components/Navbar/Navbar";
import "./dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const timelineRef = useRef(null);
  const menuRef = useRef(null);
  const dropdownContainerRef = useRef(null);

  const [menuAberto, setMenuAberto] = useState(null);
  const [niveisDoBanco, setNiveisDoBanco] = useState([]);

  // Estado para controlar a revisão
  const [faseEmRevisao, setFaseEmRevisao] = useState(
    () => localStorage.getItem("fase_em_revisao") || null,
  );

  // 1. Altere o useState para permitir atualização (adicionando o setUsuario)
  const [usuario, setUsuario] = useState(() => {
    const dadosSalvos = localStorage.getItem("usuarioLogado");
    return dadosSalvos ? JSON.parse(dadosSalvos) : { nome: "Aluno", nivel: 1 }; // Mudei o padrão para 1
  });

// 2. Adicione este useEffect para escutar quando o usuário volta para a tela e buscar dados dinâmicos do Neon
useEffect(() => {
  const atualizarDadosUsuario = () => {
    const dadosSalvos = localStorage.getItem("usuarioLogado");
    if (dadosSalvos) {
      const usuarioAtualizado = JSON.parse(dadosSalvos);
      setUsuario(usuarioAtualizado);
      console.log(
        "Dashboard updated com o progresso real:",
        usuarioAtualizado,
      );
    }
  };

  // 🌟 Sincroniza apontando para a nova rota GET que criamos no Postgres
  fetch("https://ingleja-backend.onrender.com/api/licoes")
    .then((res) => {
      if (!res.ok) throw new Error("Erro ao buscar níveis");
      return res.json();
    })
    .then((data) => {
      // Como a rota retorna diretamente o array rows da query:
      if (Array.isArray(data)) {
        setNiveisDoBanco(data);
      }
    })
    .catch((err) => console.error("Erro ao carregar níveis da nuvem:", err));

  // Executa imediatamente ao montar a tela
  atualizarDadosUsuario();

  // Opcional: Escuta mudanças caso você use abas diferentes
  window.addEventListener("storage", atualizarDadosUsuario);
  return () => window.removeEventListener("storage", atualizarDadosUsuario);
}, []); // Executa sempre que a Dashboard ganhar foco/for montada

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
    // Verifica se o usuário já fez o tour antes
    const tutorialVisto = localStorage.getItem("tutorial_ingleja_visto");
    let driverObj = null;

    if (!tutorialVisto) {
      driverObj = driver({
        showProgress: true,
        animate: true,
        nextBtnText: "Próximo &rarr;",
        prevBtnText: "&larr; Anterior",
        doneBtnText: "Começar!",
        allowClose: true, // Permite fechar clicando fora
        // Quando o usuário termina ou clica em fechar/pular, salvamos no localStorage
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
                "No menu superior, você pode ativar/desativar sons,alterar entre modo escuro e claro, alterar orientação de visualização de grid e visualizar suas notificações.",
              side: "bottom",
              align: "end",
            },
          },
        ],
      });

      // Um tempo um pouco maior garante que a tela foi totalmente renderizada antes do tour iniciar
      setTimeout(() => {
        driverObj.drive();
      }, 800);
    }

    // Função de limpeza para evitar bugs no React Strict Mode
    return () => {
      if (driverObj) {
        driverObj.destroy();
      }
    };
  }, []);

  // Substituindo a estrutura estática por uma união dos dados dinâmicos do Neon com os metadados decorativos
  const licoes = useMemo(() => {
    const progressoDoBanco = usuario.progresso || {};

    const dadosVisuaisFases = {
      saudacoes: {
        iconeTema: "waving_hand",
        descricao:
          "Aprenda a iniciar conversas e cumprimentar pessoas no dia a dia.",
        tempo: "15 min",
      },
      cores: {
        iconeTema: "palette",
        descricao:
          "Explore o vocabulário visual e aprenda a descrever o mundo ao seu redor.",
        tempo: "20 min",
      },
      familia: {
        iconeTema: "family_restroom",
        descricao:
          "Saiba como apresentar seus parentes e falar sobre sua árvore genealógica.",
        tempo: "25 min",
      },
      comida: {
        iconeTema: "restaurant",
        descricao:
          "Domine o vocabulário essencial para ir a restaurantes e fazer compras.",
        tempo: "30 min",
      },
      musica: {
        iconeTema: "music_note",
        descricao:
          "Conheça instrumentos musicais e expressões culturais em inglês.",
        tempo: "20 min",
      },
    };

    // Caso a requisição do banco ainda esteja processando, mantém as fases bases como fallback de segurança
    const listaFasesTrilha =
      niveisDoBanco.length > 0
        ? niveisDoBanco
        : Object.keys(dadosVisuaisFases).map((slug, idx) => ({
            id: idx + 1,
            slug,
            titulo:
              slug === "saudacoes"
                ? "Saudações Básicas"
                : slug === "cores"
                  ? "Cores e Descrições"
                  : slug === "familia"
                    ? "Membros da Família"
                    : slug === "comida"
                      ? "Alimentos e Bebidas"
                      : "Ritmos e Cultura",
          }));

    return listaFasesTrilha.map((fase, index) => {
      const complementosVisuais = dadosVisuaisFases[fase.slug] || {
        iconeTema: "menu_book", // Livro genérico para módulos criados de forma dinâmica pelo Admin
        descricao:
          "Aproveite novos conteúdos e exercícios estruturados pela administração.",
        tempo: "20 min",
      };

      const concluida = progressoDoBanco[fase.slug] === true;
      let status = "bloqueado";

      if (fase.slug === faseEmRevisao) {
        status = "revisando";
      } else if (concluida) {
        status = "concluido";
      } else {
        const anteriorConcluida =
          index === 0 ||
          progressoDoBanco[listaFasesTrilha[index - 1]?.slug] === true;
        if (anteriorConcluida) status = "atual";
      }
      return {
        id: fase.id,
        slug: fase.slug,
        titulo: fase.titulo,
        ...complementosVisuais,
        status,
      };
    });
  }, [niveisDoBanco, usuario.progresso, faseEmRevisao]);

  // A lição ativa prioriza a que está sendo revisada
  const licaoAtual = licoes.find((l) => l.status === "revisando") ||
    licoes.find((l) => l.status === "atual") ||
    licoes[licoes.length - 1] || { descricao: "", tempo: "" };

  // Progresso conta as concluídas E as em revisão, para não frustrar o usuário (Cálculo Dinâmico Autônomo)
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

    // Aplica o Tema Principal
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

  // Impede o Tab de vazar do Dashboard para a barra do navegador
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== "Tab" || !menuRef.current) return;

      // Busca todos os botões e links activos na tela inteira do Dashboard
      const elementosFocaveis = menuRef.current.querySelectorAll(
        'button:not([disabled]), a:not([disabled]), [tabindex="0"]',
      );

      if (elementosFocaveis.length === 0) return;

      const primeiroElemento = elementosFocaveis[0];
      const ultimoElemento = elementosFocaveis[elementosFocaveis.length - 1];

      // Se estiver voltando (Shift + Tab) no primeiro elemento, vai para o último
      if (e.shiftKey) {
        if (document.activeElement === primeiroElemento) {
          ultimoElemento.focus();
          e.preventDefault();
        }
      }
      // Se estiver avançando (Tab) no último elemento, volta para o primeiro
      else {
        if (document.activeElement === ultimoElemento) {
          primeiroElemento.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Crie esta referência logo acima, junto com as outras (ex: menuRef, dropdownContainerRef)

  useEffect(() => {
    if (menuAberto && dropdownContainerRef.current) {
      // O setTimeout força o navegador a executar isso LOGO APÓS o menu aparecer na tela
      const timer = setTimeout(() => {
        if (dropdownContainerRef.current) {
          const primeiroItemFocavel =
            dropdownContainerRef.current.querySelector(
              'button, [tabindex="0"]',
            );
          if (primeiroItemFocavel) {
            primeiroItemFocavel.focus();
          }
        }
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [menuAberto]); // Simplificado para monitorar diretamente a abertura do menu

  // Fecha o menu aberto ao pressionar a tecla 'Esc'
  useEffect(() => {
    const tratarPressionamentoEsc = (evento) => {
      if (evento.key === "Escape") {
        // Se houver qualquer menu aberto, fecha-o (ajuste o valor para null ou falso dependendo do seu padrão)
        if (menuAberto) {
          setMenuAberto(null);
        }
      }
    };

    // Registra o evento de teclado na janela (window)
    window.addEventListener("keydown", tratarPressionamentoEsc);

    // Limpa o evento quando o componente for desmontado para evitar vazamento de memória
    return () => {
      window.removeEventListener("keydown", tratarPressionamentoEsc);
    };
  }, [menuAberto]);

  useEffect(() => {
    const tratarPressionamentoEsc = (evento) => {
      if (evento.key === "Escape" && menuAberto) {
        // 1. Encontra o botão que está ativo/focado no momento em que o menu abriu
        // Normalmente, o usuário abriu o menu clicando ou dando Enter no próprio botão do cabeçalho
        const idBotaoOrigem = `btn-${menuAberto}`;
        const botaoOrigem = document.getElementById(idBotaoOrigem);

        // 2. Fecha o menu
        setMenuAberto(null);

        // 3. Devolve o foco para o botão do cabeçalho
        if (botaoOrigem) {
          // Um pequeno timeout garante que o foco mude após o menu sumir da tela
          setTimeout(() => botaoOrigem.focus(), 50);
        }
      }
    };

    window.addEventListener("keydown", tratarPressionamentoEsc);
    return () => window.removeEventListener("keydown", tratarPressionamentoEsc);
  }, [menuAberto]);

  useEffect(() => {
    if (!configuracoes.acessibilidadeAtiva) return;

    const falarTexto = (evento) => {
      const elemento = evento.target;

      // 🌟 CORREÇÃO AQUI: Prioriza o aria-label ou o placeholder antes do innerText
      let textoParaFalar =
        elemento.getAttribute("aria-label") ||
        elemento.placeholder ||
        elemento.innerText ||
        "";

      // Remove resíduos de ícones caso algum elemento ainda passe com texto direto
      textoParaFalar = textoParaFalar
        .replace("volume_up", "")
        .replace("dark_mode", "")
        .replace("accessibility_new", "")
        .replace("settings", "") // Salvaguarda extra
        .trim();

      if (textoParaFalar && window.speechSynthesis) {
        window.speechSynthesis.cancel();

        const mensagem = new SpeechSynthesisUtterance(textoParaFalar);
        mensagem.lang = "pt-BR";
        mensagem.rate = 1.2;

        window.speechSynthesis.speak(mensagem);
      }
    };

    document.addEventListener("focus", falarTexto, true);

    return () => {
      document.removeEventListener("focus", falarTexto, true);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [configuracoes.acessibilidadeAtiva]);

  useEffect(() => {
    if (!configuracoes.acessibilidadeAtiva) return;

    const nivel = usuario.nivel || 0;
    const porcentagem = porcentagemProgresso || 0;
    const feitas = missoesConcluidas || 0;
    const totais = totalMissoes || 0;

    const tituloUsuario =
      porcentagemProgresso === 100 ? "Mestre de Inglês" : "Explorador Aprendiz";
    const introducao = `Módulo: Fundamentos de Inglês. Seu nível atual é ${tituloUsuario}, Nível ${nivel}. Seu Progresso Geral é de ${porcentagem}%, ${feitas} de ${totais} missões concluídas.`;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const mensagem = new SpeechSynthesisUtterance(introducao);
      mensagem.lang = "pt-BR";
      mensagem.rate = 1.1;
      window.speechSynthesis.speak(mensagem);
    }

    // O segredo: Monitoramos apenas a ativação da acessibilidade ou a mudança drástica do progresso
  }, [
    configuracoes.acessibilidadeAtiva,
    porcentagemProgresso,
    usuario.nivel,
    missoesConcluidas,
    totalMissoes,
  ]);

  // Assegura o estado correto do VLibras assim que o componente monta
  useEffect(() => {
    const widgetVLibras = document.querySelector("[vw]");
    if (widgetVLibras) {
      widgetVLibras.style.display = configuracoes.vlibrasAtivo
        ? "block"
        : "none";
    }
  }, [configuracoes.vlibrasAtivo]); // Executa apenas uma vez no carregamento da tela

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

      // Cria o novo objeto de configurações atualizado
      const novasConfigs = { ...prev, [chave]: novoEstado };

      // 1. Mantém seu efeito sonoro original do botão de som
      if (chave === "som" && novoEstado === true) {
        const audio = new Audio("/audios/sfx/acerto.mp3");
        audio.play().catch(() => {});
      }

      // 2. 🌟 CONTROLE COMPLEMENTAR DO VLIBRAS:
      // Se a chave alterada for o VLibras, altera a visibilidade do widget na hora
      if (chave === "vlibrasAtivo") {
        const widgetVLibras = document.querySelector("[vw]");
        if (widgetVLibras) {
          widgetVLibras.style.display = novoEstado ? "block" : "none";
        }
      }

      // 3. 🌟 PERSISTÊNCIA: Grava as novas configurações de volta no LocalStorage
      localStorage.setItem(
        "configuracoes_ingleja",
        JSON.stringify(novasConfigs),
      );

      return novasConfigs;
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

  const nomesDosTemas = {
    "theme-blue": "Tema Azul",
    "theme-green": "Tema Verde",
    "theme-purple": "Tema Roxo",
    "theme-rose": "Tema Rosa",
    "theme-orange": "Tema Laranja",
  };

  const nomesDasLicoes = {
    waving_hand: "Saudações",
    restaurant: "Alimentação",
    palette: "Cores e Arte",
    family_restroom: "Família",
    music_note: "Música",
    menu_book: "Conteúdo Extra",
  };

  const statusTraduzido = {
    bloqueado: "Bloqueada",
    concluido: "Concluída",
    atual: "Disponível, lição atual",
    revisando: "Disponível, para revisão",
  };

  return (
    <div
      ref={menuRef}
      className="min-h-screen bg-transparent transition-colors duration-300"
    >
      <Navbar usuario={usuario} />

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
            id="tour-menu" // <--- ID ADICIONADO AQUI
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
              aria-label="Configurações"
              aria-expanded={menuAberto === "config"}
              className={`w-11 h-11 rounded-full text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex justify-center items-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50 ${menuAberto === "config" ? "bg-gray-100 dark:bg-gray-800 text-primary-500" : ""}`}
              onClick={() =>
                setMenuAberto(menuAberto === "config" ? null : "config")
              }
            >
              <span
                aria-hidden="true"
                className={`material-symbols-outlined text-[24px] ${menuAberto === "config" ? "anim-spin" : ""}`}
              >
                settings
              </span>
            </button>

            <button
              aria-label="Notificações"
              className={`relative w-11 h-11 rounded-full text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex justify-center items-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50 ${menuAberto === "notificacoes" ? "bg-gray-100 dark:bg-gray-800 text-primary-500" : ""}`}
              onClick={() => toggleMenu("notificacoes")}
            >
              <span
                aria-hidden="true"
                className={`material-symbols-outlined text-[24px] ${menuAberto === "notificacoes" ? "anim-shake" : ""}`}
              >
                notifications
              </span>
              {notificacoes.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
              )}
            </button>

            <button
              aria-label="Perfil"
              className="w-11 h-11 rounded-full bg-primary-600 text-white font-bold text-[15px] flex items-center justify-center shadow-md hover:scale-105 transition-transform ml-2 overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50"
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
                <ul ref={dropdownContainerRef} className="py-2 m-0 list-none">
                  <li
                    tabIndex="0"
                    className="px-5 py-2.5 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:bg-gray-50 dark:focus-visible:bg-gray-700"
                    onClick={() => toggleConfig("som")}
                    onKeyDown={(e) => e.key === "Enter" && toggleConfig("som")}
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
                      tabIndex="-1"
                      className="accent-blue-500 pointer-events-none"
                    />
                  </li>
                  <li
                    tabIndex="0"
                    className="px-5 py-2.5 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:bg-gray-50 dark:focus-visible:bg-gray-700"
                    onClick={() => toggleConfig("modoEscuro")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && toggleConfig("modoEscuro")
                    }
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
                      tabIndex="-1"
                      className="accent-blue-500 pointer-events-none"
                    />
                  </li>
                  <li
                    aria-label="Visão Horizontal"
                    tabIndex="0"
                    className="px-5 py-2.5 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:bg-gray-50 dark:focus-visible:bg-gray-700"
                    onClick={() => toggleConfig("layoutHorizontal")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && toggleConfig("layoutHorizontal")
                    }
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
                      tabIndex="-1"
                      className="accent-blue-500 pointer-events-none"
                    />
                  </li>
                  <li
                    className="px-5 pt-3 pb-1 flex items-center gap-3 text-xs font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase select-none border-t border-gray-100 dark:border-gray-800"
                    aria-hidden="true"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      accessibility_new
                    </span>
                    Acessibilidade
                  </li>
                  <li
                    tabIndex="0"
                    role="checkbox"
                    aria-checked={configuracoes.acessibilidadeAtiva}
                    aria-label="Acessibilidade: Ativar leitor de tela"
                    className="px-5 pl-9 py-2.5 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:bg-gray-50 dark:focus-visible:bg-gray-700"
                    onClick={() => toggleConfig("acessibilidadeAtiva")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && toggleConfig("acessibilidadeAtiva")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-gray-400">
                        speech_to_text
                      </span>
                      Leitor de Tela
                    </div>
                    <input
                      type="checkbox"
                      checked={configuracoes.acessibilidadeAtiva}
                      readOnly
                      tabIndex="-1"
                      className="accent-blue-500 pointer-events-none"
                    />
                  </li>
                  <li
                    tabIndex="0"
                    role="checkbox"
                    aria-checked={configuracoes.vlibrasAtivo}
                    aria-label="Acessibilidade: Exibir assistente de Libras"
                    className="px-5 pl-9 py-2.5 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:bg-gray-50 dark:focus-visible:bg-gray-700 border-b border-gray-100 dark:border-gray-800"
                    onClick={() => toggleConfig("vlibrasAtivo")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && toggleConfig("vlibrasAtivo")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-gray-400">
                        sign_language
                      </span>
                      Avatar VLibras
                    </div>
                    <input
                      type="checkbox"
                      checked={configuracoes.vlibrasAtivo}
                      readOnly
                      tabIndex="-1"
                      className="accent-blue-500 pointer-events-none"
                    />
                  </li>
                </ul>
              </div>
            )}

            {menuAberto === "notificacoes" && (
              <div className="absolute top-14 right-0 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden transition-colors">
                <div
                  ref={dropdownContainerRef}
                  className="px-5 py-3 bg-gray-50 dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center"
                >
                  Notificações
                  {notificacoes.length > 0 && (
                    <button
                      onClick={() => setNotificacoes([])}
                      tabIndex="0"
                      className="text-xs text-primary-500 hover:underline border-none bg-transparent cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
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
                        tabIndex="0"
                        className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 last:border-0 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:bg-gray-50 dark:focus-visible:bg-gray-700"
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
              <div
                ref={dropdownContainerRef}
                className="absolute top-14 right-0 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden transition-colors"
              >
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
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-[20px]"
                      >
                        palette
                      </span>
                      Cores do Tema
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {[
                        { classe: "theme-blue", corBotao: "bg-blue-500" },
                        { classe: "theme-green", corBotao: "bg-green-500" },
                        { classe: "theme-purple", corBotao: "bg-purple-500" },
                        { classe: "theme-rose", corBotao: "bg-rose-500" },
                        { classe: "theme-orange", corBotao: "bg-orange-500" },
                      ].map((tema) => {
                        const estaAtivo =
                          configuracoes.temaPrincipal === tema.classe;
                        const nomeTraduzido =
                          nomesDosTemas[tema.classe] || "Tema";
                        const textoAcessivel = estaAtivo
                          ? `${nomeTraduzido}, selecionado`
                          : nomeTraduzido;

                        return (
                          <button
                            key={tema.classe}
                            type="button"
                            aria-label={textoAcessivel}
                            onClick={() =>
                              setConfiguracoes({
                                ...configuracoes,
                                temaPrincipal: tema.classe,
                              })
                            }
                            className={`w-6 h-6 rounded-full ${tema.corBotao} transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 dark:focus-visible:ring-offset-gray-800 ${
                              estaAtivo
                                ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800"
                                : ""
                            }`}
                            title={nomeTraduzido}
                          />
                        );
                      })}
                    </div>
                  </li>
                  <li
                    aria-label="Personalizar perfil"
                    tabIndex="0"
                    className="px-5 py-2.5 text-sm text-gray-600 dark:text-gray-300 font-semibold flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors text-left border-b border-gray-100 dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:bg-gray-50 dark:focus-visible:bg-gray-700"
                    onClick={() => navigate("/perfil")}
                    onKeyDown={(e) => e.key === "Enter" && navigate("/perfil")}
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[20px]"
                    >
                      manage_accounts
                    </span>{" "}
                    Personalizar Perfil
                  </li>
                  <li
                    aria-label="Sair da conta"
                    tabIndex="0"
                    className="px-5 py-2.5 text-sm text-red-500 font-semibold flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:bg-red-50 dark:focus-visible:bg-red-900/20"
                    onClick={fazerLogout}
                    onKeyDown={(e) => e.key === "Enter" && fazerLogout()}
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[20px]"
                    >
                      logout
                    </span>{" "}
                    Sair
                  </li>
                </ul>
              </div>
            )}
          </div>
        </header>

        {/* CARD DE PROGRESSO GERAL (MATEMÁTICA ATUALIZADA) */}
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

        {/* TRILHA DINÂMICA INTEGRADA COM BANCO NEON */}
        <div id="tour-trilha" className="relative w-full mb-16 group">
          {configuracoes.layoutHorizontal && (
            <button
              type="button"
              aria-label="Seta esquerda Visão Horizontal"
              className={`absolute -left-4 md:-left-16 top-[85px] -translate-y-1/2 z-30 w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex justify-center items-center text-gray-500 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:text-primary-600 dark:hover:text-primary-400 hover:scale-110 hover:border-primary-200 dark:hover:border-primary-900/50 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50 focus-visible:scale-110`}
              onClick={() => scrollTimeline("esquerda")}
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[28px]"
              >
                chevron_left
              </span>
            </button>
          )}

          <main
            tabIndex="-1"
            className={`relative w-full py-10 ${
              configuracoes.layoutHorizontal
                ? "flex flex-row items-start overflow-x-auto hide-scrollbar scroll-smooth"
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
                {/* LINHA DE CONEXÃO (Pontilhada Dinâmica) */}
                {index !== licoes.length - 1 && (
                  <div
                    className={`absolute z-0 transition-all duration-700 ${
                      configuracoes.layoutHorizontal
                        ? "top-[43px] left-[50%] w-full h-[4px]"
                        : "top-[43px] left-[50%] h-[calc(100%+64px)] w-[4px] -translate-x-1/2"
                    }`}
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

                {/* CÍRCULO DA LIÇÃO */}
                <button
                  type="button"
                  aria-label={`Lição: ${nomesDasLicoes[licao.iconeTema] || "Geral"}. Status: ${statusTraduzido[licao.status] || licao.status}`}
                  tabIndex="0"
                  aria-disabled={licao.status === "bloqueado"}
                  onClick={(e) => {
                    if (licao.status === "bloqueado") {
                      e.preventDefault();
                      return;
                    }
                    handleCliqueCirculo(licao.slug, licao.status);
                  }}
                  onMouseEnter={() =>
                    licao.status !== "bloqueado" && tocarSom("hover_mapa.mp3")
                  }
                  className={`
                    relative flex items-center justify-center rounded-full transition-all duration-500 z-10 group circle-icon
                    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50 focus-visible:scale-105
                    ${licao.status !== "bloqueado" ? "cursor-pointer hover:-translate-y-1" : "cursor-not-allowed opacity-60"}
                    ${
                      licao.status === "atual" || licao.status === "revisando"
                        ? "w-[90px] h-[90px] bg-white dark:bg-gray-900 shadow-[0_0_0_10px_rgba(255,255,255,1),0_0_40px_15px_rgba(59,130,246,0.25)] dark:shadow-[0_0_0_10px_rgba(17,24,39,1),0_0_40px_15px_rgba(59,130,246,0.4)] border border-primary-50 dark:border-gray-800"
                        : "w-[85px] h-[85px] bg-white dark:bg-gray-900 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-gray-50 dark:border-gray-800 mt-[2.5px]"
                    }
                  `}
                >
                  {licao.iconeTema === "restaurant" &&
                  licao.status !== "concluido" &&
                  licao.status !== "bloqueado" ? (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={`w-[1em] h-[1em] anim-cross transition-colors duration-300 ${licao.status === "atual" || licao.status === "revisando" ? "text-[40px] text-primary-500 dark:text-primary-400" : "text-[36px]"}`}
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
                      aria-hidden="true"
                      className={`
                        material-symbols-outlined transition-colors duration-300
                        ${licao.status === "atual" || licao.status === "revisando" ? "text-[40px] text-primary-500 dark:text-primary-400" : "text-[36px]"}
                        ${licao.status === "concluido" ? "text-primary-600 dark:text-primary-500 anim-check" : ""}
                        ${licao.status === "bloqueado" ? "text-gray-400 dark:text-gray-500" : ""}
                        ${licao.iconeTema === "waving_hand" && licao.status !== "concluido" && licao.status !== "bloqueado" ? "anim-wave" : ""}
                        ${licao.iconeTema === "palette" && licao.status !== "concluido" && licao.status !== "bloqueado" ? "anim-palette" : ""}
                        ${licao.iconeTema === "family_restroom" && licao.status !== "concluido" && licao.status !== "bloqueado" ? "anim-jump" : ""}
                        ${licao.iconeTema === "music_note" && licao.status !== "concluido" && licao.status !== "bloqueado" ? "anim-music-main" : ""}
                      `}
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
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 pointer-events-none flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined absolute text-primary-500/70 dark:text-primary-400/70 text-[18px] m-note m-note-1">
                          music_note
                        </span>
                        <span className="material-symbols-outlined absolute text-primary-500/70 dark:text-primary-400/70 text-[22px] m-note m-note-2">
                          music_note
                        </span>
                        <span className="material-symbols-outlined absolute text-primary-500/70 dark:text-primary-400/70 text-[16px] m-note m-note-3">
                          music_note
                        </span>
                      </div>
                    )}
                </button>

                {/* TEXTOS DA LIÇÃO */}
                <div
                  className={`
                    mt-8 text-center flex flex-col items-center px-4 py-3 z-10 w-full
                    ${!configuracoes.layoutHorizontal ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 dark:border-gray-800 mt-6" : ""}
                  `}
                >
                  <span
                    className={`text-[12px] font-bold mb-1.5 transition-colors uppercase tracking-widest ${
                      licao.status === "atual" || licao.status === "revisando"
                        ? "text-primary-500 dark:text-primary-400"
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
                    ${licao.status === "atual" || licao.status === "concluido" ? "text-primary-600 dark:text-primary-500" : ""}
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
                      className="mt-3 text-[12px] font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 px-5 py-2 rounded-full cursor-pointer border-none shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      Revisar Lição
                    </button>
                  )}

                  {licao.status === "revisando" && (
                    <button
                      onClick={(e) => handleCancelarRevisao(e)}
                      className="mt-3 text-[12px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 px-5 py-2 rounded-full cursor-pointer border-none shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
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
              aria-label="Seta direita Visão Horizontal"
              className={`absolute -right-4 md:-right-16 top-[85px] -translate-y-1/2 z-30 w-12 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex justify-center items-center text-gray-500 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:text-primary-600 dark:hover:text-primary-400 hover:scale-110 hover:border-primary-200 dark:hover:border-primary-900/50 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50 focus-visible:scale-110`}
              onClick={() => scrollTimeline("direita")}
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[28px]"
              >
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
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400 font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-colors text-[14px] border-none cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50"
                >
                  Revisar Nível
                </button>
              )}

              {licaoAtual.status === "revisando" && (
                <>
                  <button
                    onClick={(e) => handleCancelarRevisao(e)}
                    className="bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-semibold py-2.5 px-3 rounded-lg transition-colors text-[14px] border-none cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() =>
                      handleCliqueCirculo(licaoAtual.slug, licaoAtual.status)
                    }
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-[14px] border-none cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/50"
                  >
                    Continuar Revisão
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-lg"
                    >
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
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-[14px] border-none cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50"
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
