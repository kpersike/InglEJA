// Fora da função Exercicio
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : ""; // Em produção, ele usará a rota relativa do próprio servidor

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
  const [feedback, setFeedback] = useState({ msg: "", color: "", acertou: false });
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [faseConcluida, setFaseConcluida] = useState(false);

  const [startTime] = useState(Date.now()); // Marca quando começou a lição
  const [pontos, setPontos] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [tempoFinal, setTempoFinal] = useState("");

  useEffect(() => {
    const dadosUsuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!dadosUsuario) {
      navigate("/dashboard");
      return;
    }
    setUsuario(dadosUsuario);
    carregarFase();
  }, [slug]);

  // EFEITO 2: Resetar tudo quando mudar de questão (O que faltava)
  useEffect(() => {
    setResposta("");
    setFeedback({ msg: "", color: "", acertou: false });
    setMostrarDica(false);
    setMostrarTraducao(false);
  }, [indiceAtual]);

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

  const carregarFase = async () => {
    try {
      // Chamada para a nova rota que criamos no server.js
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

  const tocarAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error("Erro ao tocar áudio: O navegador bloqueou o autoplay ou o arquivo não existe.", err);
      });
    }
  };

  const questaoAtual = questoes[indiceAtual];

  const finalizarExercicio = async () => {
    if (!resposta.trim()) return;

    const questaoAtual = questoes[indiceAtual];
    // Verifica se é a última questão
    const eUltima = indiceAtual === questoes.length - 1;

    try {
      const response = await fetch("http://localhost:3000/api/validar-resposta-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioEmail: usuario.email,
          slugFase: slug,
          questaoId: questaoAtual.id,
          respostaUsuario: resposta,
          eUltimaQuestao: eUltima // Informamos ao servidor se acabou a fase
        }),
      });

      const data = await response.json();

      if (data.acertou) {
        tocarSFX('acerto.mp3');

        // Lógica de Pontos e Combo
        setPontos(prev => prev + 10); // Ganha 10 pontos por acerto
        setCombo(prev => {
          const novoCombo = prev + 1;
          if (novoCombo > maxCombo) setMaxCombo(novoCombo); // Salva o maior combo da sessão
          return novoCombo;
        });

        setFeedback({ msg: "Incrível! Você acertou!", color: "green", acertou: true });

        // Se acabou a fase e o servidor mandou o usuário atualizado, salvamos no localStorage
        if (eUltima && data.usuarioAtualizado) {
          localStorage.removeItem("fase_em_revisao");
          localStorage.setItem("usuarioLogado", JSON.stringify(data.usuarioAtualizado));
        }
      } else {
        tocarSFX('erro.mp3');
        setFeedback({ msg: "Ops! Resposta incorreta. Tente novamente!", color: "red", acertou: false });
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

      // Se houver algum input de texto ou ordenação, é bom resetar aqui também
      // setPalavrasSelecionadas([]); // Caso use no layout de ordenar
    } else {
      // Cálculo do Tempo Total
      const endTime = Date.now();
      const totalSegundos = Math.floor((endTime - startTime) / 1000);
      const minutos = Math.floor(totalSegundos / 60);
      const segundos = totalSegundos % 60;
      const tempoFormatado = `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;

      setTempoFinal(tempoFormatado);

      // Se já está na última questão e clicou em Próximo/Finalizar
      console.log("Fase concluída! Mudando estado..."); // Debug para você ver no console
      setFaseConcluida(true);
    }
  };

  // Função para adicionar palavra à frase
  const adicionarPalavra = (palavra) => {
    if (feedback.acertou) return;

    // Criamos um array das palavras que já estão na resposta
    const palavrasAtuais = resposta.split(" ");

    // TRAVA: Se a palavra já existe na frase montada, não faz nada
    if (palavrasAtuais.includes(palavra)) {
      console.log("Palavra já utilizada!");
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
    const audio = new Audio(`${API_BASE}/audios/sfx/${arquivo}`);
    audio.volume = 0.4; // Deixa o som do sistema mais suave para não sustar o aluno
    audio.play();
  };

  if (loading) return <div className="container-exercicio">Carregando fase...</div>;
  if (!questaoAtual) return <div className="container-exercicio">Nenhuma questão encontrada.</div>;

  return (
    <div className="container-exercicio">
      {faseConcluida ? (
        <TelaConquista questoesTotais={questoes.length}
          xpGanhos={pontos}
          tempoTotal={tempoFinal}
          comboAtual={maxCombo}
          tituloNivel={tituloNivel} // Passando o nome dinâmico
        />
      ) : (
        <>
          {/* Barra de progresso visual baseada no índice */}
          {/* Barra de Progresso Interna */}
          <div className="progresso-container">
            <div className="progresso-texto">
              <span style={{ color: "#64748B" }}>PROGRESSO DA LIÇÃO</span>
              <span>Questão <strong>{indiceAtual + 1}</strong> de {questoes.length}</span>
            </div>

            {/* Este é o "trilho" (o fundo vazio) */}
            <div className="progresso-fundo">
              <div
                className="progresso-barra"
                style={{
                  width: `${questoes.length > 0 ? ((indiceAtual + 1) / questoes.length) * 100 : 0}%`,
                  transition: "width 0.3s ease-in-out"
                }}
              ></div>
            </div>
          </div>

          <div className="area-pergunta">

            {/* Elemento de áudio invisível que controlamos via Ref */}
            <audio
              ref={audioRef}
              key={`audio-${indiceAtual}`} // Isso força o reset do áudio a cada questão
            />

            {/*
        <div className="container-audio-principal">
          <button className="btn-audio-grande" onClick={tocarAudio} title="Ouvir pronúncia">
            <span className="icone-auto-falante">🔊</span>
          </button>
          <span className="texto-clique-ouvir">Clique para ouvir</span>
        </div>
        */}

            {/* Título Dinâmico */}
            <h2 className="titulo-questao">
              {questaoAtual.pergunta_exibicao || (questaoAtual.tipo === 'audio_input' ? 'Ouvir e Escrever' : 'Traduza')}
            </h2>
            {questaoAtual.subtitulo && <p className="subtitulo-exercicio">{questaoAtual.subtitulo}</p>}

            {/* BOTÃO DE DICA (HINT) */}
            {/*
        {questoes[indiceAtual]?.dica && (
          <div className="container-dica">
            <button
              className={`btn-dica ${mostrarDica ? 'ativo' : ''}`}
              onClick={() => setMostrarDica(!mostrarDica)}
            >
              💡 {mostrarDica ? "Esconder Dica" : "Ver Dica"}
            </button>

            {mostrarDica && (
              <div className="balao-dica">
                {questoes[indiceAtual].dica}
              </div>
            )}
          </div>
        )}
        */}

            {/* Layout 1: Imagem + Opções de Clique (Baseado na sua Foto 1) */}
            {questaoAtual.tipo === "escolha_palavra" && (
              <div className="layout-multipla-escolha">

                <div className="container-imagem-central">
                  <img
                    src={`http://localhost:3000/images/${questaoAtual.img}`}
                    alt="Exercício"
                    className="img-pergunta-principal"
                  />

                  {/* Campo de Áudio e Frase */}
                  <div className="container-audio-hint">
                    <button className="btn-audio-circular" onClick={() => audioRef.current.play()}>
                      <span class="material-symbols-outlined" style={{ margin: "0" }}>volume_up</span>
                    </button>
                    {/* Container da Dica para posicionamento lateral */}
                    <div className="wrapper-hint-relativo">
                      <button
                        className={`btn-hint-circular ${mostrarDica ? 'ativo' : ''}`}
                        onClick={() => setMostrarDica(!mostrarDica)}
                      >
                        <span className="material-symbols-outlined" style={{ margin: "0" }}>lightbulb</span>
                      </button>

                      {/* Balão de Dica Lateral */}
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
                      className={`btn-opcao-item ${resposta === opcao ? 'selecionada' : ''}`}
                      onClick={() => setResposta(opcao)}
                      disabled={feedback.acertou}
                    >
                      <span className="numero-indicador">{idx + 1}</span>
                      {opcao}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Layout 2: Grade de Imagens (Baseado no Tipo de questão 2) */}
            {questaoAtual.tipo === "escolha_imagem" && (
              <div className="layout-grade-imagens">
                <div className="container-translate-audio">
                  <button className="btn-audio-circular" onClick={() => audioRef.current.play()}>
                    <span class="material-symbols-outlined" style={{ margin: "0" }}>volume_up</span>
                  </button>
                  <div
                    className={`tag-palavra-ingles ${mostrarTraducao ? 'modo-pt' : ''}`}
                    onClick={() => setMostrarTraducao(!mostrarTraducao)}
                    style={{ cursor: 'pointer' }} // Garante que o mouse mude para a mãozinha
                  >
                    <span className="material-symbols-outlined" style={{ margin: "0" }}>
                      translate
                    </span>

                    {/* Lógica: Se mostrarTraducao for true, exibe a tradução, senão exibe o inglês */}
                    <span>
                      {mostrarTraducao ? questaoAtual.traducao : questaoAtual.palavra_ingles}
                    </span>
                  </div>
                </div>

                <div className="grade-cards">
                  {questaoAtual.opcoes.map((opcao, idx) => (
                    <button
                      key={idx}
                      className={`card-imagem-item ${resposta === opcao.texto ? 'selecionada' : ''}`}
                      onClick={() => setResposta(opcao.texto)}
                      disabled={feedback.acertou}
                    >
                      <div className="container-img-card">
                        <img src={`${API_BASE}/images/${opcao.img}`} alt={opcao.texto} />
                      </div>
                      <span className="legenda-card">{opcao.texto}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* --- LAYOUT 3: PREENCHER LACUNA (Baseado na Foto 3) --- */}
            {questaoAtual.tipo === "preencher_lacuna" && (
              <div className="layout-lacuna">
                <div className="container-imagem-lacuna">
                  <img src={`${API_BASE}/images/${questaoAtual.img}`} alt="Contexto" />
                  {/* Campo de Áudio e Frase */}
                  <div className="container-audio-hint">
                    <button className="btn-audio-circular" onClick={() => audioRef.current.play()}>
                      <span class="material-symbols-outlined" style={{ margin: "0" }}>volume_up</span>
                    </button>

                    <button className="btn-hint-circular">
                      <span class="material-symbols-outlined" style={{ margin: "0" }}>lightbulb</span>
                    </button>
                  </div>
                </div>

                <div className="frase-container">
                  <span className="texto-frase">{questaoAtual.frase_parte_1}</span>

                  {/* A mágica acontece aqui: mostra a resposta ou os tracinhos */}
                  <span className={`lacuna-vazia ${resposta ? 'preenchida' : ''}`}>
                    {resposta || "__"}
                  </span>

                  <span className="texto-frase">{questaoAtual.frase_parte_2}</span>
                </div>

                <div className="input-container-lacuna">
                  <input
                    type="text"
                    className="input-lacuna"
                    placeholder="Clique aqui para digitar..."
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    disabled={feedback.acertou}
                    autoFocus
                  />
                  <span id="icone-lapis" class="material-symbols-outlined">edit</span>
                </div>

                {questaoAtual.dica && <p className="dica-texto">Dica: {questaoAtual.dica}</p>}
              </div>
            )}

            {/* --- LAYOUT 5: PREENCHER COM BLOCOS (Baseado na Foto 5) --- */}
            {questaoAtual.tipo === "ordenar_frase" && (
              <div className="layout-ordenar">
                {/* Campo de Áudio e Frase */}
                <div className="container-audio-exibicao">
                  <button className="btn-audio-circular" onClick={() => audioRef.current.play()}>
                    <span class="material-symbols-outlined" style={{ margin: "0" }}>volume_up</span>
                  </button>
                  <div className="balao-frase">{questaoAtual.frase_exibicao}</div>
                </div>

                {/* Imagem de Contexto */}
                <div className="container-img-pequena">
                  <img src={`${API_BASE}/images/${questaoAtual.img}`} alt="Cena" />
                </div>

                {/* Área onde a frase é montada */}
                <div className="area-montagem" onClick={removerUltimaPalavra}>
                  {resposta ? (
                    resposta.split(" ").map((pal, i) => (
                      <span key={i} className="palavra-montada">{pal}</span>
                    ))
                  ) : (
                    <span className="placeholder-montagem">Toque nas palavras abaixo...</span>
                  )}
                </div>

                {/* Banco de Palavras (Quebra-cabeça) */}
                <div className="banco-palavras">
                  {questaoAtual.opcoes.map((palavra, idx) => {
                    // Lógica simples: se a palavra já está na frase, ela fica "apagada" (opcional)
                    const selecionada = resposta.split(" ").includes(palavra);
                    return (
                      <button
                        key={idx}
                        className={`btn-puzzle ${selecionada ? 'item-escondido' : ''}`}
                        onClick={() => adicionarPalavra(palavra)}
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

          {/* Barra de Ação Inferior */}
          <div className="barra-navegacao-inferior">

            {/* Botão Esquerdo: Sair ou Voltar */}
            {indiceAtual === 0 ? (
              <button className="btn-navegacao secundario" onClick={() => navigate("/dashboard")}>
                ⬅ Sair
              </button>
            ) : (
              <button
                className="btn-navegacao secundario"
                onClick={() => {
                  tocarSFX('voltar.mp3'); // Som de voltar
                  setIndiceAtual(prev => prev - 1);
                }}
              >
                ⬅ Voltar
              </button>
            )}

            {/* Botão Direito: Verificar ou Próximo/Finalizar */}
            {!feedback.acertou ? (
              <button
                className="btn-navegacao primario"
                onClick={finalizarExercicio} // A função finalizarExercicio já pode ter o som de acerto/erro dentro dela
                disabled={!resposta.trim()}
              >
                Verificar
              </button>
            ) : (
              <button
                className="btn-navegacao sucesso"
                onClick={() => {
                  if (indiceAtual === questoes.length - 1) {
                    tocarSFX('finalizar.mp3'); // Som especial de conclusão
                  } else {
                    tocarSFX('avancar.mp3');   // Som de próxima questão
                  }
                  proximaQuestao();
                }}
              >
                {indiceAtual === questoes.length - 1 ? "Finalizar ✨" : "Próximo ➡"}
              </button>
            )}
          </div>
        </>
      )}

    </div>
  );
}

export default Exercicio;