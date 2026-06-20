import React, { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AdminLicoes() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [salvando, setSalvando] = useState(false);
  const [notificacao, setNotificacao] = useState(null);

  // 🌟 NOVO ESTADO: Controla o Pop-up moderno de confirmação
  const [modalConfirmacao, setModalConfirmacao] = useState(null);

  const [nivelSelecionado, setNivelSelecionado] = useState(null);
  const [questaoSelecionada, setQuestaoSelecionada] = useState(null);
  const [mostrarModulos, setMostrarModulos] = useState(true);

  const [draggedNivel, setDraggedNivel] = useState(null);
  const [draggedQuestao, setDraggedQuestao] = useState(null);

  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/licoes`)
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar");
        return res.json();
      })
      .then((data) => {
        setDados(data);
        setLoading(false);
      })
      .catch((err) => {
        setErro(err.message);
        setLoading(false);
      });
  }, []);

  const handleSelecionarNivel = (nivel) => {
    setNivelSelecionado(nivel);
    setQuestaoSelecionada(null);
  };

  const handleAlterarTituloNivel = (novoTitulo) => {
    if (!nivelSelecionado || !dados) return;
    const nivelAtualizado = { ...nivelSelecionado, titulo: novoTitulo };
    setNivelSelecionado(nivelAtualizado);
    setDados({
      ...dados,
      niveis: dados.niveis.map((n) =>
        n.id === nivelAtualizado.id ? nivelAtualizado : n,
      ),
    });
  };

  // 🌟 SUBSTITUÍDO: Agora usa o Modal Moderno em vez do window.confirm
  const handleDeletarNivel = () => {
    if (!nivelSelecionado || !dados) return;

    setModalConfirmacao({
      titulo: "Excluir Módulo",
      mensagem: `Tem certeza que deseja excluir o módulo "${nivelSelecionado.titulo}" e TODAS as suas questões?`,
      onConfirm: () => {
        const niveisRestantes = dados.niveis.filter(
          (n) => n.slug !== nivelSelecionado.slug,
        );
        setDados({ ...dados, niveis: niveisRestantes });
        setNivelSelecionado(null);
        setQuestaoSelecionada(null);
        setModalConfirmacao(null); // Fecha o modal
      },
      onCancel: () => setModalConfirmacao(null), // Fecha o modal
    });
  };

  const handleAdicionarNivel = () => {
    if (!dados) return;

    const proximoNumeroSequencial = dados.niveis.length + 1;
    const novoIdTemp = Date.now();
    const uniqueSlug = `nivel-${proximoNumeroSequencial}-${novoIdTemp}`;

    const novoNivel = {
      id: novoIdTemp,
      slug: uniqueSlug,
      titulo: `Nível ${proximoNumeroSequencial}: Novo Assunto`,
      questoes: [],
    };

    const novosDados = { ...dados, niveis: [...dados.niveis, novoNivel] };
    setDados(novosDados);
    setNivelSelecionado(novoNivel);
    setQuestaoSelecionada(null);
  };

  const handleAlterarCampoQuestao = (campo, valor) => {
    if (!questaoSelecionada || !nivelSelecionado || !dados) return;

    const questaoAtualizada = { ...questaoSelecionada, [campo]: valor };
    setQuestaoSelecionada(questaoAtualizada);

    const questoesAtualizadas = nivelSelecionado.questoes.map((q) =>
      q.id === questaoAtualizada.id ? questaoAtualizada : q,
    );
    const nivelAtualizado = {
      ...nivelSelecionado,
      questoes: questoesAtualizadas,
    };

    setNivelSelecionado(nivelAtualizado);
    setDados({
      ...dados,
      niveis: dados.niveis.map((n) =>
        n.id === nivelAtualizado.id ? nivelAtualizado : n,
      ),
    });
  };

  const handleChangeTipoQuestao = (novoTipo) => {
    if (!questaoSelecionada) return;

    let novasOpcoes = [...(questaoSelecionada.opcoes || [])];
    novasOpcoes = novasOpcoes.map((opt) =>
      typeof opt === "object" ? opt.texto || "" : opt,
    );

    const questaoAtualizada = {
      ...questaoSelecionada,
      tipo: novoTipo,
      opcoes: novasOpcoes,
    };

    setQuestaoSelecionada(questaoAtualizada);

    const questoesAtualizadas = nivelSelecionado.questoes.map((q) =>
      q.id === questaoAtualizada.id ? questaoAtualizada : q,
    );
    const nivelAtualizado = {
      ...nivelSelecionado,
      questoes: questoesAtualizadas,
    };

    setNivelSelecionado(nivelAtualizado);
    setDados({
      ...dados,
      niveis: dados.niveis.map((n) =>
        n.id === nivelAtualizado.id ? nivelAtualizado : n,
      ),
    });
  };

  const handleAlterarOpcaoString = (index, novoValor) => {
    if (!questaoSelecionada.opcoes) return;
    const novasOpcoes = [...questaoSelecionada.opcoes];
    novasOpcoes[index] = novoValor;
    handleAlterarCampoQuestao("opcoes", novasOpcoes);
  };

  const handleDragStartNivel = (e, index) => {
    setDraggedNivel(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropNivel = (e, index) => {
    e.preventDefault();
    if (draggedNivel === null || draggedNivel === index) return;
    const novosNiveis = [...dados.niveis];
    const item = novosNiveis.splice(draggedNivel, 1)[0];
    novosNiveis.splice(index, 0, item);
    setDados({ ...dados, niveis: novosNiveis });
    setDraggedNivel(null);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDragStartQuestao = (e, index) => {
    setDraggedQuestao(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropQuestao = (e, index) => {
    e.preventDefault();
    if (draggedQuestao === null || draggedQuestao === index) return;
    if (!nivelSelecionado) return;

    const novasQuestoes = [...nivelSelecionado.questoes];
    const item = novasQuestoes.splice(draggedQuestao, 1)[0];
    novasQuestoes.splice(index, 0, item);

    const nivelAtualizado = { ...nivelSelecionado, questoes: novasQuestoes };
    setNivelSelecionado(nivelAtualizado);
    setDados({
      ...dados,
      niveis: dados.niveis.map((n) =>
        n.id === nivelAtualizado.id ? nivelAtualizado : n,
      ),
    });
    setDraggedQuestao(null);
  };

  const handleAdicionarQuestao = () => {
    if (!nivelSelecionado || !dados) return;
    const novoId =
      nivelSelecionado.questoes.length > 0
        ? Math.max(...nivelSelecionado.questoes.map((q) => q.id)) + 1
        : 1;

    const novaQuestao = {
      id: novoId,
      tipo: "escolha_palavra",
      pergunta_exibicao: "Nova Pergunta...",
      resposta: "Opção 1",
      opcoes: ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
    };

    const questoesAtualizadas = [...nivelSelecionado.questoes, novaQuestao];
    const nivelAtualizado = {
      ...nivelSelecionado,
      questoes: questoesAtualizadas,
    };

    setNivelSelecionado(nivelAtualizado);
    setQuestaoSelecionada(novaQuestao);
    setDados({
      ...dados,
      niveis: dados.niveis.map((n) =>
        n.id === nivelAtualizado.id ? nivelAtualizado : n,
      ),
    });
  };

  // 🌟 SUBSTITUÍDO: Agora usa o Modal Moderno em vez do window.confirm
  const handleDeletarQuestao = (idQuestao) => {
    setModalConfirmacao({
      titulo: "Excluir Questão",
      mensagem: "Tem certeza que deseja excluir esta questão permanentemente?",
      onConfirm: () => {
        const questoesRestantes = nivelSelecionado.questoes.filter(
          (q) => q.id !== idQuestao,
        );
        const nivelAtualizado = {
          ...nivelSelecionado,
          questoes: questoesRestantes,
        };
        setNivelSelecionado(nivelAtualizado);
        setQuestaoSelecionada(null);
        setDados({
          ...dados,
          niveis: dados.niveis.map((n) =>
            n.id === nivelAtualizado.id ? nivelAtualizado : n,
          ),
        });
        setModalConfirmacao(null); // Fecha o modal
      },
      onCancel: () => setModalConfirmacao(null), // Fecha o modal
    });
  };

  const handleSalvarAlteracoes = async () => {
    setSalvando(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/licoes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const result = await response.json();

      if (response.ok && result.sucesso) {
        setNotificacao({ tipo: "sucesso", texto: result.mensagem });
      } else {
        setNotificacao({
          tipo: "erro",
          texto: result.erro || "Erro ao salvar.",
        });
      }
    } catch (err) {
      console.error(err);
      setNotificacao({
        tipo: "erro",
        texto: "Servidor indisponível no momento.",
      });
    } finally {
      setSalvando(false);
      setTimeout(() => setNotificacao(null), 4000);
    }
  };

  const handleUploadArquivo = (e, campoArquivo) => {
    const file = e.target.files[0];
    if (!file) return;

    setSalvando(true);
    setNotificacao({ tipo: "sucesso", texto: "Carregando arquivo..." });

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/upload-base64`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            base64: reader.result,
            tipo: campoArquivo,
          }),
        });
        const data = await response.json();

        if (response.ok && data.sucesso) {
          handleAlterarCampoQuestao(campoArquivo, data.filename);
          setNotificacao({
            tipo: "sucesso",
            texto: "Arquivo anexado com sucesso!",
          });
        } else {
          setNotificacao({ tipo: "erro", texto: "Erro: " + data.erro });
        }
      } catch (err) {
        console.error("Erro detalhado do upload:", err);
        setNotificacao({ tipo: "erro", texto: "Falha ao enviar arquivo." });
      } finally {
        setSalvando(false);
        setTimeout(() => setNotificacao(null), 3000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center font-bold text-gray-500 gap-2">
        <span className="material-symbols-outlined animate-spin">sync</span>{" "}
        Carregando painel...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-8 font-bold text-red-500 bg-red-50 rounded-xl m-8">
        Erro: {erro}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full h-full flex flex-col overflow-hidden relative">
      {/* 🌟 OVERLAY DO MODAL MODERNO DE CONFIRMAÇÃO */}
      {modalConfirmacao && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-6 md:p-8 max-w-sm w-full mx-4 transform transition-all animate-[fadeIn_0.2s_ease-out]">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 border-4 border-white shadow-sm">
                <span className="material-symbols-outlined text-[32px]">
                  warning
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-800 mb-2">
                {modalConfirmacao.titulo}
              </h3>
              <p className="text-gray-500 font-medium mb-8">
                {modalConfirmacao.mensagem}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={modalConfirmacao.onCancel}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={modalConfirmacao.onConfirm}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-md shadow-red-500/30"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 TOAST NOTIFICATION MODERNO E ANIMADO */}
      {notificacao && (
        <div
          className={`fixed top-8 right-8 md:right-10 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] z-[100] transition-all duration-300 border border-white/20 backdrop-blur-md text-white font-extrabold tracking-wide ${
            notificacao.tipo === "sucesso"
              ? "bg-gradient-to-r from-emerald-500 to-green-500 shadow-green-500/40"
              : "bg-gradient-to-r from-rose-500 to-red-500 shadow-red-500/40"
          }`}
        >
          <span className="material-symbols-outlined text-[28px] drop-shadow-sm">
            {notificacao.tipo === "sucesso" ? "check_circle" : "error"}
          </span>
          <span className="drop-shadow-sm text-[15px]">
            {notificacao.texto}
          </span>
        </div>
      )}

      <header className="flex justify-between items-end mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Gerenciamento de Lições
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Crie, edite e organize o conteúdo das aulas em tempo real.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleSalvarAlteracoes}
            disabled={salvando}
            className={`text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm border-none ${salvando ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 active:scale-95 cursor-pointer"}`}
          >
            <span
              className={`material-symbols-outlined ${salvando ? "animate-spin" : ""}`}
            >
              {salvando ? "sync" : "save"}
            </span>
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </button>

          <button
            onClick={handleAdicionarNivel}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined">add</span> Novo Nível
          </button>
        </div>
      </header>

      <div className="flex gap-4 flex-1 min-h-0 w-full overflow-hidden">
        {mostrarModulos && (
          <div className="w-[280px] shrink-0 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-bold text-gray-700">Módulos Cadastrados</h2>
              <button
                onClick={() => setMostrarModulos(false)}
                className="text-gray-400 hover:text-primary-600 cursor-pointer bg-transparent border-none p-1 rounded-md hover:bg-primary-50"
              >
                <span className="material-symbols-outlined">
                  keyboard_double_arrow_left
                </span>
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {dados?.niveis?.map((nivel, index) => (
                <div
                  key={nivel.id}
                  draggable
                  onDragStart={(e) => handleDragStartNivel(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropNivel(e, index)}
                  onClick={() => handleSelecionarNivel(nivel)}
                  className={`p-4 rounded-xl border-2 cursor-grab transition-all ${nivelSelecionado?.slug === nivel.slug ? "border-primary-500 bg-primary-50 ring-4 ring-primary-50/50" : "border-transparent bg-gray-50 hover:bg-gray-100"}`}
                >
                  <h3
                    className={`font-bold ${nivelSelecionado?.slug === nivel.slug ? "text-primary-700" : "text-gray-800"}`}
                  >
                    {nivel.titulo}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 mt-2 inline-block">
                    {nivel.questoes.length} Questões
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!mostrarModulos && (
          <div className="flex flex-col shrink-0">
            <button
              onClick={() => setMostrarModulos(true)}
              className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-400 hover:text-primary-600 transition-all cursor-pointer hover:bg-primary-50"
            >
              <span className="material-symbols-outlined">
                keyboard_double_arrow_right
              </span>
            </button>
          </div>
        )}

        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden min-w-0">
          {nivelSelecionado ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-4 px-6 border-b border-gray-100 flex-shrink-0 bg-white z-10">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="material-symbols-outlined text-primary-500">
                      edit_document
                    </span>
                    <input
                      type="text"
                      value={nivelSelecionado.titulo}
                      onChange={(e) => handleAlterarTituloNivel(e.target.value)}
                      className="text-xl font-bold text-gray-800 border-none outline-none rounded px-2 w-full max-w-md bg-transparent hover:bg-gray-50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeletarNivel}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer border-none bg-transparent"
                      title="Excluir Nível"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                    <button
                      onClick={() => {
                        setNivelSelecionado(null);
                        setQuestaoSelecionada(null);
                      }}
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer border-none bg-transparent"
                      title="Fechar Editor"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAdicionarQuestao}
                    className="bg-primary-50 hover:bg-primary-100 text-primary-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all cursor-pointer border border-primary-200"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      add
                    </span>{" "}
                    Adicionar Questão
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50/30">
                <div className="flex h-full min-w-[950px]">
                  <div className="w-1/4 border-r border-gray-100 p-4 overflow-y-auto bg-gray-50/30">
                    <div className="space-y-3">
                      {nivelSelecionado.questoes.map((questao, index) => (
                        <div
                          key={questao.id}
                          draggable
                          onDragStart={(e) => handleDragStartQuestao(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropQuestao(e, index)}
                          onClick={() => setQuestaoSelecionada(questao)}
                          className={`p-4 bg-white border-2 rounded-xl flex items-center gap-4 cursor-grab transition-all shadow-sm ${questaoSelecionada?.id === questao.id ? "border-primary-500 ring-2 ring-primary-50" : "border-gray-100 hover:border-gray-300"}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate text-sm">
                              {questao.pergunta_exibicao ||
                                "Questão sem pergunta"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-gray-400 capitalize border border-gray-200 px-2 py-0.5 rounded bg-white whitespace-nowrap">
                                {questao.tipo?.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-[40%] p-6 overflow-y-auto bg-white">
                    {questaoSelecionada ? (
                      <div className="space-y-6 pb-12">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                          <h3 className="text-lg font-bold text-gray-800">
                            Formulário de Edição
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold bg-primary-100 text-primary-700 px-3 py-1 rounded-full uppercase">
                              ID: {questaoSelecionada.id}
                            </span>
                            <button
                              onClick={() =>
                                handleDeletarQuestao(questaoSelecionada.id)
                              }
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer border-none bg-transparent"
                              title="Excluir Questão"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Pergunta para o aluno
                              </label>
                              <input
                                type="text"
                                value={
                                  questaoSelecionada.pergunta_exibicao || ""
                                }
                                onChange={(e) =>
                                  handleAlterarCampoQuestao(
                                    "pergunta_exibicao",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 outline-none"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Dica Didática
                              </label>
                              <textarea
                                value={questaoSelecionada.dica || ""}
                                onChange={(e) =>
                                  handleAlterarCampoQuestao(
                                    "dica",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-yellow-500 outline-none resize-none min-h-[80px]"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Tipo de Questão
                              </label>
                              <select
                                value={questaoSelecionada.tipo || ""}
                                onChange={(e) =>
                                  handleChangeTipoQuestao(e.target.value)
                                }
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 outline-none bg-white cursor-pointer"
                              >
                                <option value="escolha_palavra">
                                  Escolha Palavra
                                </option>
                                <option value="escolha_imagem">
                                  Escolha com Imagem
                                </option>
                                <option value="preencher_lacuna">
                                  Preencher Lacuna
                                </option>
                                <option value="ordenar_frase">
                                  Ordenar Frase
                                </option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Resposta Correta Exata
                              </label>
                              <input
                                type="text"
                                value={questaoSelecionada.resposta || ""}
                                onChange={(e) =>
                                  handleAlterarCampoQuestao(
                                    "resposta",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 outline-none font-mono text-green-700 bg-green-50/30"
                              />
                            </div>
                          </div>

                          {questaoSelecionada.tipo === "preencher_lacuna" && (
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                              <div className="flex gap-4">
                                <div className="flex-1">
                                  <label className="block text-xs font-bold text-purple-700 mb-1">
                                    Parte 1 (Antes da lacuna)
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      questaoSelecionada.frase_parte_1 || ""
                                    }
                                    onChange={(e) =>
                                      handleAlterarCampoQuestao(
                                        "frase_parte_1",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-purple-300 focus:border-purple-500 outline-none bg-white"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs font-bold text-purple-700 mb-1">
                                    Parte 2 (Depois da lacuna)
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      questaoSelecionada.frase_parte_2 || ""
                                    }
                                    onChange={(e) =>
                                      handleAlterarCampoQuestao(
                                        "frase_parte_2",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-purple-300 focus:border-purple-500 outline-none bg-white"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {questaoSelecionada.tipo === "ordenar_frase" && (
                            <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                              <label className="block text-xs font-bold text-primary-700 mb-1">
                                Frase Exibição (Dica visual)
                              </label>
                              <input
                                type="text"
                                value={questaoSelecionada.frase_exibicao || ""}
                                onChange={(e) =>
                                  handleAlterarCampoQuestao(
                                    "frase_exibicao",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg border border-primary-300 focus:border-primary-500 outline-none bg-white"
                              />
                            </div>
                          )}

                          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 xl:grid-cols-2 gap-4">
                            <div className="flex flex-col w-full">
                              <label className="flex items-center gap-1 text-sm font-bold text-gray-700 mb-2">
                                <span className="material-symbols-outlined text-[16px]">
                                  image
                                </span>{" "}
                                Imagem Principal
                              </label>
                              <div className="flex w-full gap-2">
                                <input
                                  type="text"
                                  value={questaoSelecionada.img || ""}
                                  onChange={(e) =>
                                    handleAlterarCampoQuestao(
                                      "img",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Caminho..."
                                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 outline-none min-w-0"
                                />
                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={imageInputRef}
                                  onChange={(e) =>
                                    handleUploadArquivo(e, "img")
                                  }
                                  className="hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => imageInputRef.current?.click()}
                                  className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 rounded-xl font-bold cursor-pointer shrink-0"
                                >
                                  <span className="material-symbols-outlined text-[20px]">
                                    folder_open
                                  </span>
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col w-full">
                              <label className="flex items-center gap-1 text-sm font-bold text-gray-700 mb-2">
                                <span className="material-symbols-outlined text-[16px]">
                                  volume_up
                                </span>{" "}
                                Áudio
                              </label>
                              <div className="flex w-full gap-2">
                                <input
                                  type="text"
                                  value={questaoSelecionada.audio || ""}
                                  onChange={(e) =>
                                    handleAlterarCampoQuestao(
                                      "audio",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Caminho..."
                                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 outline-none min-w-0"
                                />
                                <input
                                  type="file"
                                  accept="audio/*"
                                  ref={audioInputRef}
                                  onChange={(e) =>
                                    handleUploadArquivo(e, "audio")
                                  }
                                  className="hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => audioInputRef.current?.click()}
                                  className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 rounded-xl font-bold cursor-pointer shrink-0"
                                >
                                  <span className="material-symbols-outlined text-[20px]">
                                    folder_open
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {questaoSelecionada.opcoes && (
                            <div className="pt-4 border-t border-gray-100">
                              <label className="block text-sm font-bold text-gray-700 mb-3">
                                Opções / Alternativas
                              </label>
                              <div className="space-y-3">
                                {questaoSelecionada.opcoes.map(
                                  (opcao, index) => (
                                    <div
                                      key={index}
                                      className="flex gap-3 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200"
                                    >
                                      <span className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-md text-xs font-bold text-gray-500 shrink-0">
                                        {index + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={
                                          typeof opcao === "string"
                                            ? opcao
                                            : opcao.texto || ""
                                        }
                                        onChange={(e) =>
                                          handleAlterarOpcaoString(
                                            index,
                                            e.target.value,
                                          )
                                        }
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 outline-none bg-white"
                                        placeholder="Digite a alternativa..."
                                      />
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-[48px] mb-4 opacity-30">
                          rule
                        </span>
                        <p className="font-bold text-lg text-gray-500">
                          Formulário de Edição
                        </p>
                        <p className="text-sm">
                          Selecione uma questão na lista à esquerda.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="w-[35%] bg-slate-100 border-l border-gray-200 p-6 overflow-y-auto flex flex-col items-center justify-start">
                    <div className="w-full border-b border-gray-200 pb-4 mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800">
                        Live Preview
                      </h3>
                      <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          desktop_windows
                        </span>{" "}
                        Visão do Aluno
                      </span>
                    </div>

                    {questaoSelecionada ? (
                      <div className="relative w-full max-w-[600px] h-[480px] bg-white rounded-xl shadow-md border border-gray-200 flex flex-col overflow-hidden shrink-0">
                        <div className="bg-gray-100 border-b border-gray-200 h-10 flex items-center px-4 gap-2 shrink-0">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          <div className="mx-auto flex items-center gap-2 bg-white px-4 py-1 text-[11px] text-gray-400 rounded-md shadow-sm border border-gray-200 font-mono">
                            <span className="material-symbols-outlined text-[12px]">
                              lock
                            </span>{" "}
                            ingleja.com/aluno/licao
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-slate-50 pt-8 pb-6 px-10 flex flex-col items-center">
                          <div className="w-full max-w-md h-3 bg-gray-200 rounded-full mb-8 overflow-hidden">
                            <div className="w-1/2 h-full bg-orange-500 rounded-full"></div>
                          </div>

                          <h2 className="text-2xl font-extrabold text-slate-800 text-center leading-tight mb-8">
                            {questaoSelecionada.pergunta_exibicao ||
                              "A pergunta aparecerá aqui..."}
                          </h2>

                          {questaoSelecionada.img && (
                            <div className="w-full max-w-sm h-40 mb-8 rounded-2xl flex items-center justify-center bg-white border p-2 shadow-sm">
                              <img
                                src={`/images/${questaoSelecionada.img}`}
                                alt="Preview"
                                className="max-h-full object-contain rounded-xl"
                                onError={(e) =>
                                  (e.target.style.display = "none")
                                }
                              />
                            </div>
                          )}

                          {questaoSelecionada.tipo === "preencher_lacuna" && (
                            <div className="flex items-end gap-3 text-2xl font-bold text-slate-700 mb-8 flex-wrap justify-center w-full max-w-md bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                              <span>{questaoSelecionada.frase_parte_1}</span>
                              <span className="border-b-4 border-gray-300 w-20 mx-2 inline-block"></span>
                              <span>{questaoSelecionada.frase_parte_2}</span>
                            </div>
                          )}

                          <div className="w-full max-w-md grid grid-cols-1 gap-3 mt-auto">
                            {questaoSelecionada.opcoes?.map((opt, i) => (
                              <div
                                key={i}
                                className={`p-4 border-2 border-gray-200 rounded-2xl text-center text-base font-bold text-slate-600 bg-white shadow-sm hover:bg-gray-50 transition-colors cursor-pointer ${questaoSelecionada.tipo === "escolha_imagem" ? "flex flex-col items-center gap-2" : ""}`}
                              >
                                {questaoSelecionada.tipo === "escolha_imagem" &&
                                  opt.img && (
                                    <img
                                      src={`/images/${opt.img}`}
                                      className="h-24 object-contain rounded drop-shadow-sm mb-2"
                                      onError={(e) =>
                                        (e.target.style.display = "none")
                                      }
                                    />
                                  )}
                                {typeof opt === "string" ? opt : opt.texto}
                              </div>
                            ))}
                          </div>

                          <button className="w-full max-w-md mt-8 bg-orange-500 text-white font-bold py-4 rounded-2xl opacity-50 cursor-not-allowed text-lg">
                            Verificar resposta
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 w-full">
                        <div className="w-full max-w-[600px] h-[480px] border-4 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-white/50">
                          <span className="material-symbols-outlined text-[64px] mb-4 opacity-30 text-gray-400">
                            web
                          </span>
                          <p className="font-bold text-gray-400 text-lg">
                            Mockup do Navegador
                          </p>
                          <p className="text-sm text-gray-400 mt-2">
                            Selecione uma questão para visualizar.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
              <span className="material-symbols-outlined text-[64px] mb-4 opacity-20">
                inventory_2
              </span>
              <p className="font-bold text-xl text-gray-500">
                Nenhum módulo selecionado
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
