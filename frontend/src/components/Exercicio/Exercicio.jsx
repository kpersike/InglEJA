import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dadosLicoes from "../../../../data/lessons.json";
import Navbar from "../Navbar/Navbar";
import TelaConquista from "../TelaConquista/TelaConquista";

function Exercicio() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // ==========================================
  // ESTADOS DO FLUXO DA LIÇÃO E GAMIFICAÇÃO
  // ==========================================
  const [fase, setFase] = useState("normal"); // "normal" | "chamada_erros" | "revisao" | "conquista"
  const [indiceFila, setIndiceFila] = useState(0);
  const [errosCometidos, setErrosCometidos] = useState([]);

  const [opcaoSelecionada, setOpcaoSelecionada] = useState(null);
  const [textoDigitado, setTextoDigitado] = useState("");
  const [palavrasSelecionadas, setPalavrasSelecionadas] = useState([]);

  // Estado para o Drag and Drop
  const [draggedWord, setDraggedWord] = useState(null);

  
  const [statusResposta, setStatusResposta] = useState("pendente");
  const [mostrarDica, setMostrarDica] = useState(false);
  const [tempoInicio] = useState(Date.now());
  const [tempoCalculado, setTempoCalculado] = useState("0:00");

  // ==========================================
  // ESTADOS DO LIGAR PARES
  // ==========================================
  const [colunaPt, setColunaPt] = useState([]);
  const [colunaEn, setColunaEn] = useState([]);
  const [paresConcluidos, setParesConcluidos] = useState([]); // [{pt, en}]
  const [linhaAtiva, setLinhaAtiva] = useState(null); // { ptId, x1, y1, x2, y2 }
  const [linhasFixas, setLinhasFixas] = useState([]); // [{ x1, y1, x2, y2, pt, en }]
  const itemsRef = React.useRef({});
  const containerLigarRef = React.useRef(null);


  // ==========================================
  // CARREGAMENTO DOS DADOS DINÂMICOS
  // ==========================================
  const licao = useMemo(() => {
    if (!dadosLicoes || !dadosLicoes.niveis) return null;
    return dadosLicoes.niveis.find((m) => m.slug === slug);
  }, [slug]);

  const dadosProximaLicao = useMemo(() => {
    if (!dadosLicoes || !dadosLicoes.niveis || !licao) return null;
    const currentIndex = dadosLicoes.niveis.findIndex((n) => n.slug === slug);
    return dadosLicoes.niveis[currentIndex + 1] || null;
  }, [slug, licao]);

  if (!licao) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 dark:text-white font-bold">
        Carregando missão... (ou lição não encontrada)
      </div>
    );
  }

  const perguntaAtualIndex =
    fase === "revisao" ? errosCometidos[indiceFila] : indiceFila;
  const questao = licao.questoes[perguntaAtualIndex];
  const isInputText =
    questao.tipo !== "ordenar_frase" &&
    (!questao.opcoes || questao.opcoes.length === 0);

  const nivelFormatado = licao.titulo.split(":")[0];
  const tituloFormatado = licao.titulo.split(":")[1]?.trim() || licao.titulo;
  const progressoTotal =
    fase === "revisao"
      ? (indiceFila / errosCometidos.length) * 100
      : (indiceFila / licao.questoes.length) * 100;

  // ==========================================
  // AÇÕES: ORDENAR FRASE (Tap & Drag)
  // ==========================================
  const handleAddPalavra = (texto, originalIndex) => {
    setPalavrasSelecionadas((prev) => [...prev, { texto, originalIndex }]);
  };

  const handleRemovePalavra = (indexInSelected) => {
    setPalavrasSelecionadas((prev) =>
      prev.filter((_, i) => i !== indexInSelected),
    );
  };

  const onDragStart = (e, texto, originalIndex) => {
    setDraggedWord({ texto, originalIndex });
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (draggedWord && statusResposta === "pendente") {
      const jaExiste = palavrasSelecionadas.some(
        (p) => p.originalIndex === draggedWord.originalIndex,
      );
      if (!jaExiste) {
        handleAddPalavra(draggedWord.texto, draggedWord.originalIndex);
      }
      setDraggedWord(null);
    }
  };

  // ==========================================
  // LÓGICA DE VALIDAÇÃO E ÁUDIO
  // ==========================================
  const tocarAudio = () => {
    if (questao && questao.audio) {
      const audio = new Audio(`/audios/${questao.audio}`);
      audio.play().catch(() => {});
    }
  };

  const verificarResposta = () => {
    if (statusResposta === "pendente") {
      let acertou = false;

      if (questao.tipo === "ordenar_frase") {
        const fraseMontada = palavrasSelecionadas.map((p) => p.texto).join(" ");
        acertou = fraseMontada.trim() === questao.resposta.trim();
      } else if (isInputText) {
        acertou =
          textoDigitado.trim().toLowerCase() ===
          questao.resposta.trim().toLowerCase();
      } else {
        const opcaoEscolhida = questao.opcoes[opcaoSelecionada];
        const textoEscolhido =
          typeof opcaoEscolhida === "string"
            ? opcaoEscolhida
            : opcaoEscolhida.texto;
        acertou = textoEscolhido === questao.resposta;
      }

      if (acertou) {
        setStatusResposta("correta");
        const audio = new Audio("/audios/sfx/acerto.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } else {
        setStatusResposta("errada");
        const audio = new Audio("/audios/sfx/erro.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});

        // Só adiciona na lista de erros se estiver na fase normal
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

    // Avançar / Tentar Novamente
    if (fase === "revisao" && statusResposta === "errada") {
      // Limpa os campos para o usuário tentar novamente na mesma pergunta
      setOpcaoSelecionada(null);
      setTextoDigitado("");
      setPalavrasSelecionadas([]);
      setStatusResposta("pendente");
      setMostrarDica(false);
      return;
    }

    // Limpeza padrão para avançar de pergunta
    setOpcaoSelecionada(null);
    setTextoDigitado("");
    setPalavrasSelecionadas([]);
    setStatusResposta("pendente");
    setMostrarDica(false);

    if (fase === "normal") {
      if (indiceFila < licao.questoes.length - 1) {
        setIndiceFila((prev) => prev + 1);
      } else {
        if (errosCometidos.length > 0) {
          setFase("chamada_erros");
        } else {
          finalizarLicao();
        }
      }
    } else if (fase === "revisao") {
      // Se chegou aqui na revisão, é porque acertou, então avança
      if (indiceFila < errosCometidos.length - 1) {
        setIndiceFila((prev) => prev + 1);
      } else {
        finalizarLicao();
      }
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
        const xpGanhos = 40 + (licao.questoes.length - errosCometidos.length) * 5;
        
        const response = await fetch("http://localhost:3000/api/salvar-progresso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, slugFase: licao.slug, pontos: xpGanhos })
        });
        
        if (response.ok) {
           const data = await response.json();
           localStorage.setItem("usuarioLogado", JSON.stringify(data.usuarioAtualizado));
        }
      }
    } catch (e) {
      console.error("Erro ao salvar progresso", e);
    }
    
    setFase("conquista");
  };

  let isVerificarDisabled = statusResposta === "pendente";
  if (isVerificarDisabled) {
    if (questao.tipo === "ordenar_frase")
      isVerificarDisabled = palavrasSelecionadas.length === 0;
    else if (isInputText) isVerificarDisabled = textoDigitado.trim() === "";
    else isVerificarDisabled = opcaoSelecionada === null;
  }

  // ==========================================
  // RENDERIZAÇÃO: TELA FINAL DE CONQUISTA
  // ==========================================
  if (fase === "conquista") {
    const acertosPerfeitos = licao.questoes.length - errosCometidos.length;

    return (
      <TelaConquista
        tituloNivel={licao.titulo}
        nivelAtual={licao.id}
        proximoNivelId={dadosProximaLicao ? dadosProximaLicao.id : null}
        proximoSlug={dadosProximaLicao ? dadosProximaLicao.slug : null}
        xpGanhos={40 + acertosPerfeitos * 5}
        comboAtual={acertosPerfeitos}
        tempoTotal={tempoCalculado}
      />
    );
  }

  // ==========================================
  // RENDERIZAÇÃO: CHAMADA PARA CORREÇÃO
  // ==========================================
  if (fase === "chamada_erros") {
    return (
      <div className="min-h-screen flex flex-col bg-waves transition-colors duration-300">
        <Navbar />
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
            className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-lg py-5 px-12 rounded-2xl shadow-[0_8px_25px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95"
          >
            Revisar meus erros
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA PRINCIPAL (EXERCÍCIO)
  // ==========================================
  return (
    <div className="min-h-screen flex flex-col bg-waves transition-colors duration-300">
      <Navbar />

      <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12 flex-1 flex flex-col relative z-10">
        {/* BARRA DE PROGRESSO */}
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

        {/* CARD PRINCIPAL DA QUESTÃO */}
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
                {questao.pergunta_exibicao}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm md:text-base">
                {questao.tipo === "ordenar_frase"
                  ? "Arraste ou toque nas palavras para formar a frase"
                  : isInputText
                    ? "Digite a palavra correta em inglês."
                    : questao.subtitulo || "Selecione a palavra correspondente"}
              </p>

              {questao.tipo === "preencher_lacuna" && (
                <div className="mt-8 flex items-end gap-2 text-2xl md:text-3xl font-bold text-slate-700 dark:text-gray-200 flex-wrap">
                  <span>{questao.frase_parte_1}</span>
                  {isInputText ? (
                    <input
                      type="text"
                      value={textoDigitado}
                      onChange={(e) => setTextoDigitado(e.target.value)}
                      disabled={statusResposta !== "pendente"}
                      autoFocus
                      className={`w-40 text-center bg-transparent border-b-4 focus:outline-none transition-colors pb-1 mx-2 ${statusResposta === "pendente" ? "border-gray-300 dark:border-gray-600 focus:border-primary-500 text-primary-600 dark:text-primary-400" : ""} ${statusResposta === "correta" ? "border-green-500 text-green-600 dark:text-green-400" : ""} ${statusResposta === "errada" ? "border-red-500 text-red-600 dark:text-red-400" : ""}`}
                    />
                  ) : (
                    <span className="border-b-4 border-gray-300 dark:border-gray-600 inline-block w-24 mx-2"></span>
                  )}
                  <span>{questao.frase_parte_2}</span>
                </div>
              )}

              {questao.tipo === "ordenar_frase" && questao.frase_exibicao && (
                <div className="mt-6">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-xl">
                    "{questao.frase_exibicao}"
                  </span>
                </div>
              )}

              <div className="mt-8 flex items-center gap-4 flex-wrap">
                {questao.audio && (
                  <button
                    onClick={tocarAudio}
                    className="flex items-center gap-3 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-extrabold py-3 px-6 rounded-2xl w-fit transition-all active:scale-95 shadow-sm border border-primary-100 dark:border-primary-800/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">
                        volume_up
                      </span>
                    </div>
                    Ouvir Pronúncia
                  </button>
                )}

                <button
                  onClick={() => setMostrarDica(!mostrarDica)}
                  className="flex items-center gap-3 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 font-extrabold py-3 px-6 rounded-2xl w-fit transition-all active:scale-95 shadow-sm border border-yellow-100 dark:border-yellow-800/50"
                >
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[24px] text-yellow-500">
                      lightbulb
                    </span>
                  </div>
                  {mostrarDica ? "Ocultar Dica" : "Ver Dica"}
                </button>
              </div>

              {mostrarDica && (
                <div className="mt-6 p-5 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-xl text-yellow-800 dark:text-yellow-200 text-sm md:text-base font-semibold animate-[fadeIn_0.3s_ease-out] shadow-sm">
                  💡 {questao.dica || "Preste muita atenção ao áudio e às imagens, eles sempre dão boas pistas sobre a resposta correta!"}
                </div>
              )}
            </div>

            {questao.img && questao.tipo !== "escolha_imagem" && (
              <div className="w-full md:w-[45%] lg:w-[40%] bg-gray-50 dark:bg-gray-800/40 p-6 rounded-3xl flex items-center justify-center border border-gray-100 dark:border-gray-700/50">
                <img
                  src={`/images/${questao.img}`}
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

          {/* ========================================== */}
          {/* ORDENAR FRASE (Tap & Drag) */}
          {/* ========================================== */}
          {questao.tipo === "ordenar_frase" && (
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
                      statusResposta === "pendente" && handleRemovePalavra(i)
                    }
                    className={`px-4 py-3 border-2 rounded-xl font-bold shadow-sm transition-transform 
                      ${statusResposta === "pendente" ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 active:scale-95" : ""}
                      ${statusResposta === "correta" ? "bg-green-500 border-green-600 text-white cursor-default" : ""}
                      ${statusResposta === "errada" ? "bg-red-500 border-red-600 text-white cursor-default" : ""}
                    `}
                  >
                    {palavra.texto}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {questao.opcoes.map((texto, index) => {
                  const isSelected = palavrasSelecionadas.some(
                    (p) => p.originalIndex === index,
                  );

                  return (
                    <div
                      key={index}
                      draggable={!isSelected && statusResposta === "pendente"}
                      onDragStart={(e) => onDragStart(e, texto, index)}
                      onClick={() =>
                        !isSelected &&
                        statusResposta === "pendente" &&
                        handleAddPalavra(texto, index)
                      }
                      className={`px-4 py-3 rounded-xl font-bold text-[16px] transition-all select-none
                        ${
                          isSelected
                            ? "bg-gray-200 dark:bg-gray-800 text-gray-200 dark:text-gray-800 border-2 border-gray-200 dark:border-gray-800 shadow-none cursor-default"
                            : "bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 shadow-sm hover:border-primary-300 dark:hover:border-gray-500 active:scale-95 cursor-grab active:cursor-grabbing"
                        }
                      `}
                    >
                      {texto}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* MÚLTIPLA ESCOLHA COMUM */}
          {/* ========================================== */}
          {!isInputText && questao.tipo !== "ordenar_frase" && (
            <div
              className={`grid gap-4 w-full ${questao.tipo === "escolha_imagem" ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {questao.opcoes &&
                questao.opcoes.map((opcao, index) => {
                  const textoOpcao =
                    typeof opcao === "string" ? opcao : opcao.texto;
                  const imagemOpcao =
                    typeof opcao === "object" ? opcao.img : null;
                  const isSelected = opcaoSelecionada === index;

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        statusResposta === "pendente" &&
                        setOpcaoSelecionada(index)
                      }
                      className={`w-full flex items-center rounded-2xl border-2 transition-all duration-200 text-left ${questao.tipo === "escolha_imagem" ? "flex-col p-5 gap-3" : "py-4 px-5 group"} ${isSelected ? "border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 shadow-sm" : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-gray-500 bg-white dark:bg-gray-900"}`}
                    >
                      {imagemOpcao && (
                        <img
                          src={`/images/${imagemOpcao}`}
                          alt={textoOpcao}
                          className="w-full h-32 object-contain mb-2 rounded-lg"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      )}
                      {questao.tipo !== "escolha_imagem" && (
                        <span
                          className={`w-10 h-10 shrink-0 rounded-xl flex justify-center items-center text-sm font-bold transition-colors ${isSelected ? "bg-orange-500 dark:bg-orange-600 text-white shadow-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:text-orange-500"}`}
                        >
                          {index + 1}
                        </span>
                      )}
                      <span
                        className={`font-bold text-[16px] transition-colors ${questao.tipo !== "escolha_imagem" ? "ml-4" : "text-center w-full"} ${isSelected ? "text-orange-600 dark:text-orange-400" : "text-slate-700 dark:text-gray-200"}`}
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

      {/* BARRA DE AÇÕES INFERIOR - ALINHADA COM O CARD (max-w-4xl) */}
      <div
        className={`fixed bottom-0 left-0 w-full px-4 py-4 md:py-6 flex justify-center z-50 transition-colors duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]
          ${statusResposta === "correta" ? "bg-green-50 dark:bg-green-900/30 border-t border-green-200 dark:border-green-800" : ""}
          ${statusResposta === "errada" ? "bg-red-50 dark:bg-red-900/30 border-t border-red-200 dark:border-red-800" : ""}
          ${statusResposta === "pendente" ? "bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800" : ""}
        `}
      >
        <div className="w-full max-w-4xl flex justify-between items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all border-2 ${statusResposta === "pendente" ? "text-slate-500 dark:text-gray-400 bg-white hover:bg-slate-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" : "text-slate-800 dark:text-white bg-black/5 border-transparent backdrop-blur-sm"}`}
          >
            <span className="material-symbols-outlined text-[24px] rotate-180">
              logout
            </span>
            <span className="hidden sm:inline text-[15px]">Sair da lição</span>
          </button>

          <div className="hidden md:flex flex-1 items-center justify-center font-extrabold text-xl">
            {statusResposta === "correta" && (
              <span className="text-green-600 flex items-center gap-2">
                <span className="material-symbols-outlined text-[32px]">
                  check_circle
                </span>
                Correto!
              </span>
            )}
            {statusResposta === "errada" && (
              <span className="text-red-600 flex items-center gap-2">
                <span className="material-symbols-outlined text-[32px]">
                  cancel
                </span>
                Incorreto. A resposta é:{" "}
                <strong className="ml-1 px-3 py-1 bg-white/50 dark:bg-black/30 rounded-lg">
                  {questao.resposta}
                </strong>
              </span>
            )}
          </div>

          <button
            onClick={verificarResposta}
            disabled={isVerificarDisabled}
            className={`flex-1 sm:flex-none sm:w-[280px] flex items-center justify-center gap-2 py-4 rounded-2xl font-extrabold text-[16px] transition-all ${
              isVerificarDisabled
                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                : statusResposta === "correta"
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-[0_8px_20px_rgba(34,197,94,0.3)] active:scale-95 cursor-pointer"
                  : statusResposta === "errada"
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_8px_20px_rgba(239,68,68,0.3)] active:scale-95 cursor-pointer"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] active:scale-95 cursor-pointer"
            }`}
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
  );
}

export default Exercicio;
