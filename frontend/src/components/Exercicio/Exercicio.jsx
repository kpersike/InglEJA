// Fora da função Exercicio
const API_BASE =
  window.location.hostname === "localhost" ? "http://localhost:3000" : ""; // Em produção, ele usará a rota relativa do próprio servidor

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Importamos useParams
import TelaConquista from "../TelaConquista/TelaConquista";
import "./Exercicio.css";

function Exercicio() {
  const navigate = useNavigate();
  const { slug } = useParams(); // Pega o nome da fase da URL
  const audioRef = useRef(null);

  // ESTADOS
  const [questoes, setQuestoes] = useState([]); // Array com as 10 questões
  const [indiceAtual, setIndiceAtual] = useState(0); // Controla qual questão estamos vendo
  const [tituloNivel, setTituloNivel] = useState("");
  const [resposta, setResposta] = useState("");
  const [mostrarDica, setMostrarDica] = useState(false);
  const [mostrarTraducao, setMostrarTraducao] = useState(false);
  const [feedback, setFeedback] = useState({
    msg: "",
    color: "",
    acertou: false,
  });
  const [usuario] = useState(() => {
    const dadosSalvos = localStorage.getItem("usuarioLogado");
    return dadosSalvos ? JSON.parse(dadosSalvos) : null;
  });
  const [loading, setLoading] = useState(true);
  const [faseConcluida, setFaseConcluida] = useState(false);

  const [startTime] = useState(() => Date.now());
  const [pontos, setPontos] = useState(0);
  const [, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [tempoFinal, setTempoFinal] = useState("");

  useEffect(() => {
    const dadosUsuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!dadosUsuario) {
      navigate("/dashboard");
      return;
    }
    // Trazemos a função PARA DENTRO do useEffect
    const carregarFase = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/fase/${slug}`);
        const data = await response.json();

        if (data.questoes) {
          setQuestoes(data.questoes);
          setTituloNivel(data.titulo || slug.toUpperCase());
        }
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar fase:", err);
        setLoading(false);
      }
    };

    carregarFase();
  }, [slug, navigate]);

  // Dentro do componente Exercicio
  useEffect(() => {
    // 1. Verificamos se a questão atual existe e tem áudio
    const questaoAt = questoes[indiceAtual];

    if (questaoAt && questaoAt.audio) {
      const novoAudioUrl = `${API_BASE}/audios/${questaoAt.audio}`;

      if (audioRef.current) {
        // 2. Atualizamos o src e carregamos o novo ficheiro
        audioRef.current.src = novoAudioUrl;
        audioRef.current.load();
        console.log("Áudio atualizado para:", questaoAt.audio);
      }
    }
  }, [indiceAtual, questoes]); // Sempre que o índice mudar, ele corre isto

  // Limpa o alerta vermelho das bordas caso o usuário tente digitar ou selecionar de nov

  const questaoAtual = questoes[indiceAtual];

  const finalizarExercicio = async () => {
    if (!resposta.trim()) return;

    const questaoAtual = questoes[indiceAtual];
    const eUltima = indiceAtual === questoes.length - 1;

    try {
      const response = await fetch(
        "http://localhost:3000/api/validar-resposta-v2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuarioEmail: usuario.email,
            slugFase: slug,
            questaoId: questaoAtual.id,
            respostaUsuario: resposta,
            eUltimaQuestao: eUltima,
          }),
        },
      );

      const data = await response.json();

      if (data.acertou) {
        tocarSFX("acerto.mp3");

        setPontos((prev) => prev + 10);
        setCombo((prev) => {
          const novoCombo = prev + 1;
          if (novoCombo > maxCombo) setMaxCombo(novoCombo);
          return novoCombo;
        });

        setFeedback({
          msg: "Incrível! Você acertou!",
          color: "green",
          acertou: true,
        });

        // --- BLOCO COM A LÓGICA DE SALVAR O USUÁRIO E A NOTIFICAÇÃO ---
        if (eUltima && data.usuarioAtualizado) {
          localStorage.removeItem("fase_em_revisao");
          localStorage.setItem(
            "usuarioLogado",
            JSON.stringify(data.usuarioAtualizado),
          );

          // Cria a notificação de conclusão
          const notificacoesAntigas = JSON.parse(
            localStorage.getItem("notificacoes_ingleja") || "[]",
          );
          const novaNotificacao = {
            id: new Date().getTime(),
            titulo: "Missão Concluída!",
            desc: `Você finalizou a missão "${tituloNivel}" com sucesso. Mais ${pontos + 10} XP pra conta!`,
            icone: "emoji_events",
            tipo: "sucesso",
            acaoSlug: slug, // ADICIONADO PARA ROLAGEM FUNCIONAR NA NOTIFICAÇÃO DE CONCLUSÃO!
          };

          localStorage.setItem(
            "notificacoes_ingleja",
            JSON.stringify([novaNotificacao, ...notificacoesAntigas]),
          );
        }
      } else {
        tocarSFX("erro.mp3");
        setFeedback({
          msg: "Ops! Resposta incorreta. Tente novamente!",
          color: "red",
          acertou: false,
        });
      }
    } catch (err) {
      console.error("Erro ao validar:", err);
    }
  };

  const proximaQuestao = () => {
    // Se ainda não chegou na última, avança
    if (indiceAtual < questoes.length - 1) {
      setIndiceAtual((prev) => prev + 1);
      setResposta("");
      setFeedback({ msg: "", color: "", acertou: false });
      setMostrarDica(false);
      setMostrarTraducao(false);
    } else {
      // Cálculo do Tempo Total
      const endTime = Date.now();
      const totalSegundos = Math.floor((endTime - startTime) / 1000);
      const minutos = Math.floor(totalSegundos / 60);
      const segundos = totalSegundos % 60;
      const tempoFormatado = `${minutos}:${segundos < 10 ? "0" : ""}${segundos}`;

      setTempoFinal(tempoFormatado);

      // Se já está na última questão e clicou em Próximo/Finalizar
      setFaseConcluida(true);
    }
  };

  // Função para adicionar palavra à frase
  const adicionarPalavra = (palavra) => {
    if (feedback.acertou) return;

    const palavrasAtuais = resposta.split(" ");
    if (palavrasAtuais.includes(palavra)) {
      return;
    }

    const novaFrase = resposta ? `${resposta} ${palavra}` : palavra;
    setResposta(novaFrase);
  };

  // Função para remover a ÚLTIMA palavra (caso o aluno erre)
  const removerUltimaPalavra = () => {
    if (feedback.acertou) return;
    const palavras = resposta.split(" ");
    palavras.pop();
    setResposta(palavras.join(" "));
  };

  const tocarSFX = (arquivo) => {
    // Lê a configuração salva no Dashboard
    const configTexto = localStorage.getItem("configuracoes_ingleja");
    const config = configTexto ? JSON.parse(configTexto) : { som: true };

    // Trava de segurança: Se o som estiver desativado (false), aborta a função aqui!
    if (config.som === false) return;

    const audio = new Audio(`${API_BASE}/audios/sfx/${arquivo}`);
    audio.volume = 0.4;
    audio.play().catch((err) => console.log("Erro ao tocar:", err));
  };

  // Dicionário rápido de detecção de português
  const descobrirIdioma = (texto) => {
    if (!texto) return "en-US";
    // 1. Se tem acentos/cedilha, é português com certeza
    if (/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(texto)) return "pt-BR";

    const txtLower = texto.toLowerCase().trim();

    // 2. Se for igual à tradução da questão atual
    if (
      questaoAtual?.traducao &&
      txtLower === questaoAtual.traducao.toLowerCase()
    )
      return "pt-BR";

    // 3. Mini-dicionário de palavras usadas como opções incorretas frequentemente em PT
    const armadilhasPT = [
      "casa",
      "carro",
      "cachorro",
      "gato",
      "homem",
      "mulher",
      "menino",
      "menina",
      "sol",
      "lua",
      "livro",
      "água",
    ];
    if (armadilhasPT.includes(txtLower)) return "pt-BR";

    // Se não caiu em nenhuma regra, assume que é a palavra em inglês
    return "en-US";
  };

  const falarTextoOpcao = (texto) => {
    const configTexto = localStorage.getItem("configuracoes_ingleja");
    const config = configTexto ? JSON.parse(configTexto) : { som: true };
    if (config.som === false) return;

    const textoLimpo = texto.replace(/[.,/#!?$%^&*;:{}=\-_`~()]/g, "").trim();

    if (textoLimpo && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textoLimpo);
      const idiomaDetectado = descobrirIdioma(textoLimpo);
      utterance.lang = idiomaDetectado;
      utterance.rate = 0.9;

      // Obtendo vozes. Os navegadores muitas vezes requerem um pequeno setup para não retornar array vazio.
      let vozes = window.speechSynthesis.getVoices();

      let vozEscolhida = null;
      if (idiomaDetectado === "pt-BR") {
        // Para português, buscamos a voz premium do Google ou as vozes masculinas do Windows
        vozEscolhida =
          vozes.find((v) => v.lang === "pt-BR" && v.name.includes("Google")) ||
          vozes.find(
            (v) =>
              v.lang === "pt-BR" &&
              (v.name.includes("Antonio") ||
                v.name.includes("Luciano") ||
                v.name.includes("Daniel")),
          ) ||
          vozes.find((v) => v.lang.startsWith("pt"));
      } else {
        // Para Inglês
        vozEscolhida =
          vozes.find((v) => v.lang === "en-US" && v.name.includes("Google")) ||
          vozes.find(
            (v) =>
              v.lang === "en-US" &&
              (v.name.includes("David") ||
                v.name.includes("Guy") ||
                v.name.includes("Mark")),
          ) ||
          vozes.find((v) => v.lang.startsWith("en"));
      }

      if (vozEscolhida) {
        utterance.voice = vozEscolhida;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  // Garante que o navegador carregue as vozes assim que possível
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  if (loading)
    return <div className="container-exercicio">Carregando fase...</div>;
  if (!questaoAtual)
    return (
      <div className="container-exercicio">Nenhuma questão encontrada.</div>
    );

  return (
    <div className="container-exercicio">
      {faseConcluida ? (
        <TelaConquista
          questoesTotais={questoes.length}
          xpGanhos={pontos}
          tempoTotal={tempoFinal}
          comboAtual={maxCombo}
          tituloNivel={tituloNivel}
        />
      ) : (
        <>
          <div className="progresso-container">
            <div className="progresso-texto">
              <span style={{ color: "#64748B" }}>PROGRESSO DA LIÇÃO</span>
              <span>
                Questão <strong>{indiceAtual + 1}</strong> de {questoes.length}
              </span>
            </div>

            <div className="progresso-fundo">
              <div
                className="progresso-barra"
                style={{
                  width: `${questoes.length > 0 ? ((indiceAtual + 1) / questoes.length) * 100 : 0}%`,
                  transition: "width 0.3s ease-in-out",
                }}
              ></div>
            </div>
          </div>

          <div className="area-pergunta">
            <audio ref={audioRef} key={`audio-${indiceAtual}`} />

            <h2 className="titulo-questao">
              {questaoAtual.pergunta_exibicao ||
                (questaoAtual.tipo === "audio_input"
                  ? "Ouvir e Escrever"
                  : "Traduza")}
            </h2>
            {questaoAtual.subtitulo && (
              <p className="subtitulo-exercicio">{questaoAtual.subtitulo}</p>
            )}

            {/* Layout 1: Imagem + Opções de Clique */}
            {questaoAtual.tipo === "escolha_palavra" && (
              <div className="layout-multipla-escolha">
                <div className="container-imagem-central">
                  <img
                    src={`http://localhost:3000/images/${questaoAtual.img}`}
                    alt="Exercício"
                    className="img-pergunta-principal"
                  />

                  <div className="container-audio-hint">
                    <button
                      className="btn-audio-circular"
                      onClick={() => audioRef.current.play()}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ margin: "0" }}
                      >
                        volume_up
                      </span>
                    </button>
                    <div className="wrapper-hint-relativo">
                      <button
                        className={`btn-hint-circular ${mostrarDica ? "ativo" : ""}`}
                        onClick={() => setMostrarDica(!mostrarDica)}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ margin: "0" }}
                        >
                          lightbulb
                        </span>
                      </button>

                      {mostrarDica && (
                        <div className="balao-hint-lateral">
                          {questaoAtual.dica}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="lista-botoes-opcoes">
                  {questaoAtual.opcoes.map((opcao, idx) => (
                    <button
                      key={idx}
                      className={`btn-opcao-item ${resposta === opcao ? "selecionada" : ""} ${resposta === opcao && feedback.color === "red" ? "erro anim-shake-erro" : ""}`}
                      onClick={() => {
                        setResposta(opcao);
                        tocarSFX("botao_selecionar_resposta.mp3"); // Som ao selecionar a opção
                        falarTextoOpcao(opcao); // Lê automaticamente a opção no idioma correto
                      }}
                      disabled={feedback.acertou}
                    >
                      <span className="numero-indicador">{idx + 1}</span>
                      {opcao}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Layout 2: Grade de Imagens */}
            {questaoAtual.tipo === "escolha_imagem" && (
              <div className="layout-grade-imagens">
                <div className="container-translate-audio">
                  <button
                    className="btn-audio-circular"
                    onClick={() => audioRef.current.play()}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ margin: "0" }}
                    >
                      volume_up
                    </span>
                  </button>
                  <div
                    className={`tag-palavra-ingles ${mostrarTraducao ? "modo-pt" : ""}`}
                    onClick={() => setMostrarTraducao(!mostrarTraducao)}
                    style={{ cursor: "pointer" }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ margin: "0" }}
                    >
                      translate
                    </span>

                    <span>
                      {mostrarTraducao
                        ? questaoAtual.traducao
                        : questaoAtual.palavra_ingles}
                    </span>
                  </div>
                </div>

                <div className="grade-cards">
                  {questaoAtual.opcoes.map((opcao, idx) => (
                    <button
                      key={idx}
                      className={`card-imagem-item ${resposta === opcao.texto ? "selecionada" : ""} ${resposta === opcao.texto && feedback.color === "red" ? "erro anim-shake-erro" : ""}`}
                      onClick={() => {
                        setResposta(opcao.texto);
                        tocarSFX("botao_selecionar_resposta.mp3");
                        falarTextoOpcao(opcao.texto);
                      }}
                      disabled={feedback.acertou}
                    >
                      <div className="container-img-card">
                        <img
                          src={`${API_BASE}/images/${opcao.img}`}
                          alt={opcao.texto}
                        />
                      </div>
                      <span className="legenda-card">{opcao.texto}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* --- LAYOUT 3: PREENCHER LACUNA --- */}
            {questaoAtual.tipo === "preencher_lacuna" && (
              <div className="layout-lacuna">
                <div className="container-imagem-lacuna">
                  <img
                    src={`${API_BASE}/images/${questaoAtual.img}`}
                    alt="Contexto"
                  />
                  <div className="container-audio-hint">
                    <button
                      className="btn-audio-circular"
                      onClick={() => audioRef.current.play()}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ margin: "0" }}
                      >
                        volume_up
                      </span>
                    </button>

                    <button className="btn-hint-circular">
                      <span
                        className="material-symbols-outlined"
                        style={{ margin: "0" }}
                      >
                        lightbulb
                      </span>
                    </button>
                  </div>
                </div>

                <div className="frase-container">
                  <span className="texto-frase">
                    {questaoAtual.frase_parte_1}
                  </span>

                  <span
                    className={`lacuna-vazia ${resposta ? "preenchida" : ""}`}
                  >
                    {resposta || "__"}
                  </span>

                  <span className="texto-frase">
                    {questaoAtual.frase_parte_2}
                  </span>
                </div>

                <div className="input-container-lacuna">
                  <input
                    type="text"
                    className={`input-lacuna ${feedback.color === "red" ? "erro anim-shake-erro" : ""}`}
                    placeholder="Clique aqui para digitar..."
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    disabled={feedback.acertou}
                    autoFocus
                  />
                  <span id="icone-lapis" className="material-symbols-outlined">
                    edit
                  </span>
                </div>

                {questaoAtual.dica && (
                  <p className="dica-texto">Dica: {questaoAtual.dica}</p>
                )}
              </div>
            )}

            {/* --- LAYOUT 5: PREENCHER COM BLOCOS --- */}
            {questaoAtual.tipo === "ordenar_frase" && (
              <div className="layout-ordenar">
                <div className="container-audio-exibicao">
                  <button
                    className="btn-audio-circular"
                    onClick={() => audioRef.current.play()}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ margin: "0" }}
                    >
                      volume_up
                    </span>
                  </button>
                  <div className="balao-frase">
                    {questaoAtual.frase_exibicao}
                  </div>
                </div>

                <div className="container-img-pequena">
                  <img
                    src={`${API_BASE}/images/${questaoAtual.img}`}
                    alt="Cena"
                  />
                </div>

                <div
                  className={`area-montagem ${feedback.color === "red" ? "erro anim-shake-erro" : ""}`}
                  onClick={removerUltimaPalavra}
                >
                  {resposta ? (
                    resposta.split(" ").map((pal, i) => (
                      <span
                        key={i}
                        className="palavra-montada"
                        onClick={() =>
                          tocarSFX("botao_deselecionar_resposta.mp3")
                        }
                      >
                        {pal}
                      </span>
                    ))
                  ) : (
                    <span className="placeholder-montagem">
                      Toque nas palavras abaixo...
                    </span>
                  )}
                </div>

                <div className="banco-palavras">
                  {questaoAtual.opcoes.map((palavra, idx) => {
                    const selecionada = resposta.split(" ").includes(palavra);
                    return (
                      <button
                        key={idx}
                        className={`btn-puzzle ${selecionada ? "item-escondido" : ""}`}
                        onClick={() => {
                          adicionarPalavra(palavra);
                          tocarSFX("botao_selecionar_resposta.mp3");
                          falarTextoOpcao(palavra);
                        }}
                        disabled={feedback.acertou || selecionada}
                      >
                        {palavra}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="barra-navegacao-inferior">
            {indiceAtual === 0 ? (
              <button
                className="btn-navegacao secundario"
                onClick={() => navigate("/dashboard")}
              >
                ⬅ Sair
              </button>
            ) : (
              <button
                className="btn-navegacao secundario"
                onClick={() => {
                  tocarSFX("voltar.mp3");
                  setIndiceAtual((prev) => prev - 1);
                }}
              >
                ⬅ Voltar
              </button>
            )}

            {!feedback.acertou ? (
              <button
                className={`btn-navegacao primario ${feedback.color === "red" ? "btn-erro anim-shake-erro" : ""}`}
                onClick={finalizarExercicio}
                disabled={!resposta.trim()}
              >
                Verificar
              </button>
            ) : (
              <button
                className="btn-navegacao sucesso"
                onClick={() => {
                  if (indiceAtual === questoes.length - 1) {
                    tocarSFX("finalizar.mp3");
                  } else {
                    tocarSFX("avancar.mp3");
                  }
                  proximaQuestao();
                }}
              >
                {indiceAtual === questoes.length - 1
                  ? "Finalizar ✨"
                  : "Próximo ➡"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Exercicio;
