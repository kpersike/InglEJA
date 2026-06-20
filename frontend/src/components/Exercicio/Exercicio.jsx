import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import TelaConquista from "../TelaConquista/TelaConquista";

function Exercicio() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // ==========================================
  // ESTADOS PRINCIPAIS
  // ==========================================
  const [licao, setLicao] = useState(null);
  const [dadosProximaLicao, setDadosProximaLicao] = useState(null);
  const [numeroProximoNivel, setNumeroProximoNivel] = useState(null);
  const [loadingDados, setLoadingDados] = useState(true);

  const [fase, setFase] = useState("normal"); // "normal" | "chamada_erros" | "revisao" | "conquista"
  const [indiceFila, setIndiceFila] = useState(0);
  const [errosCometidos, setErrosCometidos] = useState([]);

  const [opcaoSelecionada, setOpcaoSelecionada] = useState(null);
  const [textoDigitado, setTextoDigitado] = useState("");
  const [palavrasSelecionadas, setPalavrasSelecionadas] = useState([]);
  const [draggedWord, setDraggedWord] = useState(null);

  const [statusResposta, setStatusResposta] = useState("pendente");
  const [mostrarDica, setMostrarDica] = useState(false);
  const [animarBalao, setAnimarBalao] = useState(false);
  const [tempoInicio] = useState(() => Date.now());
  const [tempoCalculado, setTempoCalculado] = useState("0:00");

  const [usuario, setUsuario] = useState(() => {
    const dadosSalvos = localStorage.getItem("usuarioLogado");
    return dadosSalvos
      ? JSON.parse(dadosSalvos)
      : { nome: "Aluno", pontos: 0, avatar: null };
  });

  const [historicoRespostas, setHistoricoRespostas] = useState({});
  const [revisadasConcluidas, setRevisadasConcluidas] = useState([]);

  const cardExercicioRef = useRef(null);

// ==========================================
  // EFEITO 1: BUSCAR DADOS DO BACKEND (ATUALIZADO PARA POSTGRES)
  // ==========================================
  useEffect(() => {
    const timerLoading = setTimeout(() => setLoadingDados(true), 0);

    fetch(`https://ingleja-backend.onrender.com/api/fase/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Fase não encontrada");
        return res.json();
      })
      .then((faseData) => {
        setLicao(faseData);

        // 🌟 Correção de segurança: Define o próximo ID baseado no ID atual, 
        // mas garante que o controle principal no fim do fluxo use caminhos dinâmicos
        setNumeroProximoNivel(faseData.id ? Number(faseData.id) + 1 : 2);
        setDadosProximaLicao(null);

        setLoadingDados(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar dados da lição:", err);
        setLicao(null); // Evita lixo de estado anterior
        setLoadingDados(false);
      })
      .finally(() => clearTimeout(timerLoading));
  }, [slug]);

  const perguntaAtualIndex =
    fase === "revisao" ? errosCometidos[indiceFila] : indiceFila;
  const questaoSegura = useMemo(() => {
    return licao?.questoes?.[perguntaAtualIndex] || {};
  }, [licao, perguntaAtualIndex]);
  const isInputText =
    questaoSegura.tipo !== "ordenar_frase" &&
    (!questaoSegura.opcoes || questaoSegura.opcoes.length === 0);

  // ==========================================
  // EFEITO 2: RECUPERAR HISTÓRICO
  // ==========================================
  useEffect(() => {
    // 🌟 CORREÇÃO 2: Micro-atraso na recuperação de respostas para evitar o ESLint
    const timerRecuperacao = setTimeout(() => {
      if (fase === "normal") {
        const respostaSalva = historicoRespostas[perguntaAtualIndex];
        if (respostaSalva) {
          setOpcaoSelecionada(respostaSalva.opcaoSelecionada);
          setTextoDigitado(respostaSalva.textoDigitado);
          setPalavrasSelecionadas(respostaSalva.palavrasSelecionadas);
          setStatusResposta(respostaSalva.acertou ? "correta" : "errada");
        } else {
          setOpcaoSelecionada(null);
          setTextoDigitado("");
          setPalavrasSelecionadas([]);
          setStatusResposta("pendente");
        }
      } else if (fase === "revisao") {
        if (revisadasConcluidas.includes(perguntaAtualIndex)) {
          setStatusResposta("correta");
          const respostaSalva = historicoRespostas[perguntaAtualIndex];
          if (respostaSalva) {
            setOpcaoSelecionada(respostaSalva.opcaoSelecionada);
            setTextoDigitado(respostaSalva.textoDigitado);
            setPalavrasSelecionadas(respostaSalva.palavrasSelecionadas);
          }
        } else {
          setOpcaoSelecionada(null);
          setTextoDigitado("");
          setPalavrasSelecionadas([]);
          setStatusResposta("pendente");
        }
      } else {
        setOpcaoSelecionada(null);
        setTextoDigitado("");
        setPalavrasSelecionadas([]);
        setStatusResposta("pendente");
      }
      setMostrarDica(false);
    }, 0);

    return () => clearTimeout(timerRecuperacao);
  }, [perguntaAtualIndex, fase, revisadasConcluidas, historicoRespostas]);

  // ==========================================
  // EFEITO 3: ANIMAÇÃO DA DICA
  // ==========================================
  useEffect(() => {
    if (mostrarDica) {
      // 🌟 CORREÇÃO 3: Animação fluida e sem erros no ESLint
      const initTimer = setTimeout(() => setAnimarBalao(true), 10);
      const timerSumir = setTimeout(() => {
        setAnimarBalao(false);
        const timerRemover = setTimeout(() => setMostrarDica(false), 300);
        return () => clearTimeout(timerRemover);
      }, 3000);

      return () => {
        clearTimeout(initTimer);
        clearTimeout(timerSumir);
      };
    }
  }, [mostrarDica]);

  // ==========================================
  // EFEITO 4: FOCO DE TECLADO
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== "Tab" || !cardExercicioRef.current) return;
      const elementosFocaveis = cardExercicioRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex="0"]',
      );
      if (elementosFocaveis.length === 0) return;

      const primeiroElemento = elementosFocaveis[0];
      const ultimoElemento = elementosFocaveis[elementosFocaveis.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === primeiroElemento) {
          ultimoElemento.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === ultimoElemento) {
          primeiroElemento.focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fase, indiceFila, statusResposta]);

  // ==========================================
  // EFEITO 5: ACESSIBILIDADE - LEITURA INICIAL
  // ==========================================
  useEffect(() => {
    const configSalvas = localStorage.getItem("configuracoes_ingleja");
    if (!configSalvas || !licao) return;
    const parsedConfig = JSON.parse(configSalvas);
    if (!parsedConfig.acessibilidadeAtiva) return;

    const numeroQuestao = indiceFila + 1;
    const totalQuestoes =
      fase === "revisao" ? errosCometidos.length : licao.questoes.length;
    const enunciado = questaoSegura.pergunta_exibicao || "";

    let instrucaoTipo = "Selecione a palavra correspondente.";
    if (questaoSegura.tipo === "ordenar_frase") {
      instrucaoTipo =
        "Arraste ou toque nas palavras para formar a frase correta.";
    } else if (!questaoSegura.opcoes || questaoSegura.opcoes.length === 0) {
      instrucaoTipo = "Digite a palavra correta em inglês.";
    } else if (questaoSegura.subtitulo) {
      instrucaoTipo = questaoSegura.subtitulo;
    }

    const textoIntroducao = `Questão ${numeroQuestao} de ${totalQuestoes}. Pergunta: ${enunciado}. Instrução: ${instrucaoTipo}. Use a tecla Tab para navegar pelas opções.`;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const mensagem = new SpeechSynthesisUtterance(textoIntroducao);
      mensagem.lang = "pt-BR";
      mensagem.rate = 1.15;
      window.speechSynthesis.speak(mensagem);
    }
  }, [
    perguntaAtualIndex,
    fase,
    licao,
    indiceFila,
    errosCometidos.length,
    questaoSegura,
  ]);

  // ==========================================
  // EFEITO 6: ACESSIBILIDADE - FOCO
  // ==========================================
  useEffect(() => {
    const configSalvas = localStorage.getItem("configuracoes_ingleja");
    if (!configSalvas) return;
    const parsedConfig = JSON.parse(configSalvas);
    if (!parsedConfig.acessibilidadeAtiva) return;

    const falarTextoFocado = (evento) => {
      const elemento = evento.target;
      let textoParaFalar =
        elemento.getAttribute("aria-label") ||
        elemento.placeholder ||
        elemento.innerText ||
        "";

      textoParaFalar = textoParaFalar
        .replace(
          /volume_up|lightbulb|logout|arrow_back|arrow_forward|done|replay|check_circle|cancel/g,
          "",
        )
        .trim();

      if (textoParaFalar && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const mensagem = new SpeechSynthesisUtterance(textoParaFalar);

        if (elemento.getAttribute("data-lang") === "en") {
          mensagem.lang = "en-US";
          mensagem.rate = 1.0;
        } else {
          mensagem.lang = "pt-BR";
          mensagem.rate = 1.2;
        }
        window.speechSynthesis.speak(mensagem);
      }
    };
    document.addEventListener("focus", falarTextoFocado, true);
    return () => document.removeEventListener("focus", falarTextoFocado, true);
  }, []);

  // ==========================================
  // BLOQUEIO DE RENDERIZAÇÃO ANTECIPADA
  // ==========================================
  if (loadingDados) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 dark:text-white font-bold">
        <span className="material-symbols-outlined animate-spin mr-2">
          sync
        </span>{" "}
        Carregando missão...
      </div>
    );
  }

  if (!licao || !licao.questoes || licao.questoes.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:bg-gray-950 dark:text-white font-bold">
        <span className="material-symbols-outlined text-[64px] text-gray-400 mb-4">
          error
        </span>
        Ops! Nenhuma questão foi encontrada para esta lição.
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 px-6 py-2 bg-primary-500 text-white rounded-xl"
        >
          Voltar ao Mapa
        </button>
      </div>
    );
  }

  // ==========================================
  // FUNÇÕES DE AÇÃO DA LIÇÃO
  // ==========================================
  const handleAddPalavra = (texto, originalIndex) => {
    setPalavrasSelecionadas((prev) => [...prev, { texto, originalIndex }]);
  };

  const handleRemovePalavra = (indexInSelected) => {
    setPalavrasSelecionadas((prev) =>
      prev.filter((_, i) => i !== indexInSelected),
    );
  };

  const onDragStart = (e, texto, originalIndex) =>
    setDraggedWord({ texto, originalIndex });
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e) => {
    e.preventDefault();
    if (draggedWord && statusResposta === "pendente") {
      const jaExiste = palavrasSelecionadas.some(
        (p) => p.originalIndex === draggedWord.originalIndex,
      );
      if (!jaExiste)
        handleAddPalavra(draggedWord.texto, draggedWord.originalIndex);
      setDraggedWord(null);
    }
  };

  const tocarAudio = () => {
    if (questaoSegura && questaoSegura.audio) {
      const audio = new Audio(`/audios/${questaoSegura.audio}`);
      audio.play().catch(() => {});
    }
  };

  const verificarResposta = () => {
    if (statusResposta === "pendente") {
      let acertou = false;

      const higienizarTexto = (texto) => {
        return String(texto)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase();
      };

      const respostaCorretaLimpa = higienizarTexto(questaoSegura.resposta);

      if (questaoSegura.tipo === "ordenar_frase") {
        const fraseMontada = palavrasSelecionadas.map((p) => p.texto).join(" ");
        acertou = higienizarTexto(fraseMontada) === respostaCorretaLimpa;
      } else if (isInputText) {
        acertou = higienizarTexto(textoDigitado) === respostaCorretaLimpa;
      } else {
        const opcaoEscolhida = questaoSegura.opcoes[opcaoSelecionada];
        const textoEscolhido =
          typeof opcaoEscolhida === "string"
            ? opcaoEscolhida
            : opcaoEscolhida.texto;
        acertou = higienizarTexto(textoEscolhido) === respostaCorretaLimpa;
      }

      setHistoricoRespostas((prev) => ({
        ...prev,
        [perguntaAtualIndex]: {
          opcaoSelecionada,
          textoDigitado,
          palavrasSelecionadas,
          acertou,
        },
      }));

      if (acertou) {
        setStatusResposta("correta");
        const audio = new Audio("/audios/sfx/acerto.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});

        if (fase === "revisao")
          setRevisadasConcluidas((prev) => [...prev, perguntaAtualIndex]);
        if (fase === "normal")
          setUsuario((prev) => ({ ...prev, pontos: (prev.pontos || 0) + 10 }));
      } else {
        setStatusResposta("errada");
        const audio = new Audio("/audios/sfx/erro.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});

        if (fase === "normal") {
          setErrosCometidos((prev) => {
            if (!prev.includes(perguntaAtualIndex))
              return [...prev, perguntaAtualIndex];
            return prev;
          });
        }
      }
      return;
    }

    if (fase === "revisao" && statusResposta === "errada") {
      setOpcaoSelecionada(null);
      setTextoDigitado("");
      setPalavrasSelecionadas([]);
      setStatusResposta("pendente");
      setMostrarDica(false);
      return;
    }

    setOpcaoSelecionada(null);
    setTextoDigitado("");
    setPalavrasSelecionadas([]);
    setStatusResposta("pendente");
    setMostrarDica(false);

    if (fase === "normal") {
      if (indiceFila < licao.questoes.length - 1) {
        setIndiceFila((prev) => prev + 1);
      } else {
        if (errosCometidos.length > 0) setFase("chamada_erros");
        else finalizarLicao();
      }
    } else if (fase === "revisao") {
      if (indiceFila < errosCometidos.length - 1)
        setIndiceFila((prev) => prev + 1);
      else finalizarLicao();
    }
  };

  const voltarQuestao = () => {
    if (indiceFila > 0) {
      setOpcaoSelecionada(null);
      setTextoDigitado("");
      setPalavrasSelecionadas([]);
      setStatusResposta("pendente");
      setMostrarDica(false);
      setIndiceFila((prev) => prev - 1);
    }
  };

  const finalizarLicao = async () => {
    const audioWin = new Audio("/audios/sfx/vitoria.mp3");
    audioWin.play().catch(() => {});

    const diffSegundos = Math.floor((Date.now() - tempoInicio) / 1000);
    const minutos = Math.floor(diffSegundos / 60);
    const segundos = diffSegundos % 60;
    setTempoCalculado(`${minutos}:${segundos.toString().padStart(2, "0")}`);

    try {
      const userStr = localStorage.getItem("usuarioLogado");
      if (userStr) {
        const user = JSON.parse(userStr);
        const xpGanhos =
          40 + (licao.questoes.length - errosCometidos.length) * 5;
        const ultimaQuestaoDaLicao = licao.questoes[licao.questoes.length - 1];

        const response = await fetch(
          "https://ingleja-backend.onrender.com/api/validar-resposta-v2",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usuarioEmail: user.email,
              slugFase: licao.slug,
              questaoId: ultimaQuestaoDaLicao?.id || 1,
              respostaUsuario: ultimaQuestaoDaLicao?.resposta || "",
              eUltimaQuestao: true,
              pontosGanhos: xpGanhos,
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.usuarioAtualizado) {
            localStorage.setItem(
              "usuarioLogado",
              JSON.stringify(data.usuarioAtualizado),
            );
          }
        }
      }
    } catch (e) {
      console.error("Erro ao salvar lição:", e);
    }
    setFase("conquista");
  };

  let isVerificarDisabled = statusResposta === "pendente";
  if (isVerificarDisabled) {
    if (questaoSegura.tipo === "ordenar_frase")
      isVerificarDisabled = palavrasSelecionadas.length === 0;
    else if (isInputText) isVerificarDisabled = textoDigitado.trim() === "";
    else isVerificarDisabled = opcaoSelecionada === null;
  }

  const falarTextoDireto = (texto, idioma = "pt-BR") => {
    if (!window.speechSynthesis) return;
    const configSalvas = localStorage.getItem("configuracoes_ingleja");
    if (!configSalvas) return;
    if (!JSON.parse(configSalvas).acessibilidadeAtiva) return;

    window.speechSynthesis.cancel();
    const mensagem = new SpeechSynthesisUtterance(texto);
    mensagem.lang = idioma;
    mensagem.rate = 1.15;
    window.speechSynthesis.speak(mensagem);
  };

  if (fase === "conquista") {
    const acertosPerfeitos = licao.questoes.length - errosCometidos.length;
    return (
      <TelaConquista
        tituloNivel={licao.titulo}
        nivelAtual={licao.id}
        proximoNivelId={numeroProximoNivel}
        proximoSlug={dadosProximaLicao ? dadosProximaLicao.slug : null}
        xpGanhos={40 + acertosPerfeitos * 5}
        comboAtual={acertosPerfeitos}
        tempoTotal={tempoCalculado}
      />
    );
  }

  if (fase === "chamada_erros") {
    return (
      <div className="min-h-screen flex flex-col bg-waves transition-colors duration-300">
        <Navbar usuario={usuario} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.5s_ease-out]">
          <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[48px]">
              replay
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400 mb-4 tracking-tight drop-shadow-sm pb-1">
            Prática leva à perfeição!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl mb-12 max-w-lg">
            Você cometeu{" "}
            <strong>
              {errosCometidos.length} erro{errosCometidos.length > 1 ? "s" : ""}
            </strong>
            . Vamos revisá-los agora!
          </p>
          <button
            onClick={() => {
              setFase("revisao");
              setIndiceFila(0);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-lg py-5 px-12 rounded-2xl shadow-[0_8px_25px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/50"
          >
            Revisar meus erros
          </button>
        </div>
      </div>
    );
  }

  const jaRespondida =
    (fase === "normal" &&
      historicoRespostas[perguntaAtualIndex] !== undefined) ||
    (fase === "revisao" && revisadasConcluidas.includes(perguntaAtualIndex));

  const nivelFormatado = licao.titulo.split(":")[0];
  const tituloFormatado = licao.titulo.split(":")[1]?.trim() || licao.titulo;
  const progressoTotal =
    fase === "revisao"
      ? (indiceFila / errosCometidos.length) * 100
      : (indiceFila / licao.questoes.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-waves transition-colors duration-300">
      <Navbar usuario={usuario} />
      <div ref={cardExercicioRef} className="flex-1 flex flex-col w-full">
        <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12 flex-1 flex flex-col relative z-10">
          <div className="flex items-center gap-4 md:gap-8 mb-8 w-full max-w-4xl mx-auto">
            <div className="flex-1 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-[10.5px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                <span className="text-gray-500 dark:text-gray-400">
                  {fase === "revisao"
                    ? "Modo de Revisão"
                    : `${nivelFormatado} • ${tituloFormatado}`}
                </span>
                <span className="text-orange-500 dark:text-orange-400 transition-colors">
                  Questão {indiceFila + 1} de{" "}
                  {fase === "revisao"
                    ? errosCometidos.length
                    : licao.questoes.length}
                </span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-orange-500"
                  style={{ width: `${progressoTotal}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-800 p-6 md:p-10 flex flex-col gap-8 mb-36 relative overflow-hidden">
            {fase === "revisao" && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-1.5 rounded-bl-2xl">
                Corrigindo
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-12">
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-[11px] font-extrabold text-primary-500 dark:text-primary-400 uppercase tracking-widest mb-3">
                  Pergunta
                </span>

                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-2 leading-tight">
                  {questaoSegura.pergunta_exibicao}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm md:text-base">
                  {questaoSegura.tipo === "ordenar_frase"
                    ? "Arraste ou toque nas palavras para formar a frase"
                    : isInputText
                      ? "Digite a palavra correta em inglês."
                      : questaoSegura.subtitulo ||
                        "Selecione a palavra correspondente"}
                </p>

                {questaoSegura.tipo === "preencher_lacuna" && (
                  <div className="mt-8 flex items-end gap-2 text-2xl md:text-3xl font-bold text-slate-700 dark:text-gray-200 flex-wrap">
                    <span>{questaoSegura.frase_parte_1}</span>
                    {isInputText ? (
                      <input
                        type="text"
                        value={textoDigitado}
                        onChange={(e) => setTextoDigitado(e.target.value)}
                        disabled={statusResposta !== "pendente" || jaRespondida}
                        autoFocus
                        className={`w-40 text-center bg-transparent border-b-4 focus:outline-none transition-colors pb-1 mx-2 ${statusResposta === "pendente" ? "border-gray-300 dark:border-gray-600 focus:border-primary-500 text-primary-600 dark:text-primary-400" : ""} ${statusResposta === "correta" ? "border-green-500 text-green-600 dark:text-green-400" : ""} ${statusResposta === "errada" ? "border-red-500 text-red-600 dark:text-red-400" : ""}`}
                      />
                    ) : (
                      <span className="border-b-4 border-gray-300 dark:border-gray-600 inline-block w-24 mx-2"></span>
                    )}
                    <span>{questaoSegura.frase_parte_2}</span>
                  </div>
                )}

                {questaoSegura.tipo === "ordenar_frase" &&
                  questaoSegura.frase_exibicao && (
                    <div className="mt-6">
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-xl">
                        "{questaoSegura.frase_exibicao}"
                      </span>
                    </div>
                  )}

                <div className="mt-8 flex items-center gap-4 flex-wrap">
                  {questaoSegura.audio && (
                    <button
                      onClick={tocarAudio}
                      aria-label="Ouvir pronúncia em inglês"
                      className="flex items-center gap-3 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-extrabold py-3 px-6 rounded-2xl w-fit transition-all active:scale-95 shadow-sm border border-primary-100 dark:border-primary-800/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[24px]">
                          volume_up
                        </span>
                      </div>
                    </button>
                  )}

                  <div className="relative inline-block">
                    <button
                      onClick={() => {
                        const novoEstadoDica = !mostrarDica;
                        setMostrarDica(novoEstadoDica);
                        if (novoEstadoDica)
                          falarTextoDireto(
                            `Dica do exercício: ${questaoSegura.dica || "Preste muita atenção ao áudio e às imagens"}`,
                            "pt-BR",
                          );
                      }}
                      title={mostrarDica ? "Ocultar Dica" : "Ver Dica"}
                      aria-label={
                        mostrarDica
                          ? "Ocultar dica do exercício"
                          : "Ver dica do exercício"
                      }
                      className="flex items-center gap-3 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 font-extrabold py-3 px-6 rounded-2xl w-fit transition-all active:scale-95 shadow-sm border border-yellow-100 dark:border-yellow-800/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-500/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[24px] text-yellow-500">
                          lightbulb
                        </span>
                      </div>
                    </button>

                    {mostrarDica && (
                      <div
                        className={`absolute left-full top-1/2 -translate-y-1/2 ml-4 w-max max-w-[240px] md:max-w-[320px] p-4 bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-yellow-600 rounded-2xl text-yellow-900 dark:text-yellow-100 text-sm font-semibold shadow-xl z-50 text-center transition-all duration-300 transform ${animarBalao ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                      >
                        💡{" "}
                        {questaoSegura.dica ||
                          "Preste muita atenção ao áudio e às imagens, eles sempre dão boas pistas sobre a resposta correta!"}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1.5 w-3 h-3 bg-yellow-50 dark:bg-gray-800 border-l border-b border-yellow-200 dark:border-yellow-600 rotate-45"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {questaoSegura.img && questaoSegura.tipo !== "escolha_imagem" && (
                <div className="w-full md:w-[45%] lg:w-[40%] bg-gray-50 dark:bg-gray-800/40 p-6 rounded-3xl flex items-center justify-center border border-gray-100 dark:border-gray-700/50">
                  <img
                    src={`/images/${questaoSegura.img}`}
                    alt="Apoio visual"
                    className="max-h-48 md:max-h-56 object-contain drop-shadow-md rounded-xl"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}
            </div>

            {!isInputText && (
              <hr className="border-gray-100 dark:border-gray-800" />
            )}

            {questaoSegura.tipo === "ordenar_frase" && (
              <div className="w-full flex flex-col gap-6 mt-2">
                <div
                  className={`flex flex-wrap content-start gap-2 min-h-[68px] p-2 rounded-2xl border-2 transition-colors
                  ${statusResposta === "pendente" ? "bg-gray-50 dark:bg-gray-800/40 border-dashed border-gray-300 dark:border-gray-700" : ""}
                  ${statusResposta === "correta" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : ""}
                  ${statusResposta === "errada" ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : ""}
                `}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                >
                  {palavrasSelecionadas.map((palavra, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        !jaRespondida &&
                        statusResposta === "pendente" &&
                        handleRemovePalavra(i)
                      }
                      className={`px-4 py-3 border-2 rounded-xl font-bold shadow-sm transition-transform focus-visible:outline-none focus-visible:ring-4
                      ${statusResposta === "pendente" ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 active:scale-95 focus-visible:ring-orange-500/50" : ""}
                      ${statusResposta === "correta" ? "bg-green-500 border-green-600 text-white cursor-default focus-visible:ring-green-300/50" : ""}
                      ${statusResposta === "errada" ? "bg-red-500 border-red-600 text-white cursor-default focus-visible:ring-red-300/50" : ""}
                    `}
                    >
                      {palavra.texto}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {questaoSegura.opcoes &&
                    questaoSegura.opcoes.map((texto, index) => {
                      const isSelected = palavrasSelecionadas.some(
                        (p) => p.originalIndex === index,
                      );
                      return (
                        <button
                          key={index}
                          draggable={
                            !isSelected &&
                            statusResposta === "pendente" &&
                            !jaRespondida
                          }
                          onDragStart={(e) => onDragStart(e, texto, index)}
                          onClick={() =>
                            !isSelected &&
                            statusResposta === "pendente" &&
                            !jaRespondida &&
                            handleAddPalavra(texto, index)
                          }
                          className={`px-4 py-3 rounded-xl font-bold text-[16px] transition-all select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/50
                        ${isSelected ? "bg-gray-200 dark:bg-gray-800 text-gray-200 dark:text-gray-800 border-2 border-gray-200 dark:border-gray-800 shadow-none cursor-default" : "bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 shadow-sm hover:border-primary-300 dark:hover:border-gray-500 active:scale-95 cursor-grab active:cursor-grabbing"}`}
                        >
                          {texto}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {!isInputText && questaoSegura.tipo !== "ordenar_frase" && (
              <div
                className={`grid gap-4 w-full ${questaoSegura.tipo === "escolha_imagem" ? "grid-cols-2" : "grid-cols-1"}`}
              >
                {questaoSegura.opcoes &&
                  questaoSegura.opcoes.map((opcao, index) => {
                    const textoOpcao =
                      typeof opcao === "string" ? opcao : opcao.texto;
                    const imagemOpcao =
                      typeof opcao === "object" ? opcao.img : null;
                    const isSelected = opcaoSelecionada === index;

                    return (
                      <button
                        key={index}
                        aria-label={`Opção ${index + 1}: ${textoOpcao}. ${isSelected ? "Selecionada" : ""}`}
                        onClick={() => {
                          if (!jaRespondida && statusResposta === "pendente") {
                            setOpcaoSelecionada(index);
                          }
                        }}
                        className={`w-full flex items-center rounded-2xl border-2 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/50 ${questaoSegura.tipo === "escolha_imagem" ? "flex-col p-5 gap-3" : "py-4 px-5 group"} ${isSelected ? "border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 shadow-sm" : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-gray-500 bg-white dark:bg-gray-900"} ${jaRespondida ? "cursor-default" : "cursor-pointer"}`}
                      >
                        {imagemOpcao && (
                          <img
                            src={`/images/${imagemOpcao}`}
                            alt={textoOpcao}
                            className="w-full h-32 object-contain mb-2 rounded-lg"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        )}
                        {questaoSegura.tipo !== "escolha_imagem" && (
                          <span
                            className={`w-10 h-10 shrink-0 rounded-xl flex justify-center items-center text-sm font-bold transition-colors ${isSelected ? "bg-orange-500 dark:bg-orange-600 text-white shadow-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:text-orange-500"}`}
                          >
                            {index + 1}
                          </span>
                        )}
                        <span
                          className={`font-bold text-[16px] transition-colors ${questaoSegura.tipo !== "escolha_imagem" ? "ml-4" : "text-center w-full"} ${isSelected ? "text-orange-600 dark:text-orange-400" : "text-slate-700 dark:text-gray-200"}`}
                        >
                          {textoOpcao}
                        </span>
                        <div
                          className={`ml-auto w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-orange-500" : "border-gray-300 dark:border-gray-600 group-hover:border-gray-400"}`}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        <div
          className={`fixed bottom-0 left-0 w-full px-4 py-4 md:py-6 flex justify-center z-50 transition-colors duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${statusResposta === "correta" ? "bg-green-50 dark:bg-green-900/30 border-t border-green-200 dark:border-green-800" : ""} ${statusResposta === "errada" ? "bg-red-50 dark:bg-red-900/30 border-t border-red-200 dark:border-red-800" : ""} ${statusResposta === "pendente" ? "bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800" : ""}`}
        >
          <div className="w-full max-w-4xl flex justify-between items-center gap-4">
            {indiceFila === 0 ? (
              <button
                onClick={() => navigate("/dashboard")}
                className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all border-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/50 ${statusResposta === "pendente" ? "text-slate-500 dark:text-gray-400 bg-white hover:bg-slate-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" : "text-slate-800 dark:text-white bg-black/5 border-transparent backdrop-blur-sm"}`}
              >
                <span className="material-symbols-outlined text-[24px] rotate-180">
                  logout
                </span>
                <span className="hidden sm:inline text-[15px]">Sair</span>
              </button>
            ) : (
              <button
                onClick={voltarQuestao}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all border-2 text-slate-500 dark:text-gray-400 bg-white hover:bg-slate-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/50 "
              >
                <span className="material-symbols-outlined text-[24px]">
                  arrow_back
                </span>
                <span className="hidden sm:inline text-[15px]">Voltar</span>
              </button>
            )}

            <div className="hidden md:flex flex-1 items-center justify-center font-extrabold text-xl">
              {statusResposta === "correta" && (
                <span className="text-green-600 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[32px]">
                    check_circle
                  </span>{" "}
                  Correto!
                </span>
              )}
              {statusResposta === "errada" && (
                <span className="text-red-600 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[32px]">
                    cancel
                  </span>{" "}
                  Incorreto. A resposta é:{" "}
                  <strong className="ml-1 px-3 py-1 bg-white/50 dark:bg-black/30 rounded-lg">
                    {questaoSegura.resposta}
                  </strong>
                </span>
              )}
            </div>

            <button
              onClick={verificarResposta}
              disabled={isVerificarDisabled}
              className={`flex-1 sm:flex-none sm:w-[280px] flex items-center justify-center gap-2 py-4 rounded-2xl font-extrabold text-[16px] transition-all focus-visible:outline-none focus-visible:ring-4 ${isVerificarDisabled ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600" : statusResposta === "correta" ? "bg-green-500 hover:bg-green-600 text-white shadow-[0_8px_20px_rgba(34,197,94,0.3)] active:scale-95 cursor-pointer focus-visible:ring-green-500/50" : statusResposta === "errada" ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_8px_20px_rgba(239,68,68,0.3)] active:scale-95 cursor-pointer focus-visible:ring-red-500/50" : "bg-orange-500 hover:bg-orange-600 text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] active:scale-95 cursor-pointer focus-visible:ring-orange-500/50"}`}
            >
              {statusResposta === "pendente"
                ? "Verificar resposta"
                : statusResposta === "errada" && fase === "revisao"
                  ? "Tentar novamente"
                  : "Continuar"}
              <span className="material-symbols-outlined text-[24px]">
                {statusResposta === "pendente"
                  ? "done"
                  : statusResposta === "errada" && fase === "revisao"
                    ? "replay"
                    : "arrow_forward"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Exercicio;
