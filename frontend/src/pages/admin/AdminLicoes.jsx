import React, { useState, useEffect, useRef } from "react";

export default function AdminLicoes() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [nivelSelecionado, setNivelSelecionado] = useState(null);
  const [questaoSelecionada, setQuestaoSelecionada] = useState(null);
  const [mostrarModulos, setMostrarModulos] = useState(true);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("https://ingleja-backend.onrender.com/api/admin/licoes")
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

  const handleDeletarNivel = () => {
    if (!nivelSelecionado || !dados) return;
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o módulo "${nivelSelecionado.titulo}" e TODAS as suas questões?`,
    );
    if (!confirmar) return;

    const niveisRestantes = dados.niveis.filter(
      (n) => n.id !== nivelSelecionado.id,
    );
    setDados({ ...dados, niveis: niveisRestantes });
    setNivelSelecionado(null);
    setQuestaoSelecionada(null);
  };

  const handleAdicionarNivel = () => {
    if (!dados) return;
    const novoId =
      dados.niveis.length > 0
        ? Math.max(...dados.niveis.map((n) => n.id)) + 1
        : 1;
    const novoNivel = {
      id: novoId,
      slug: `novo-nivel-${novoId}`,
      titulo: `Novo Nível ${novoId}`,
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

  const handleAlterarOpcaoString = (index, novoValor) => {
    if (!questaoSelecionada.opcoes) return;
    const novasOpcoes = [...questaoSelecionada.opcoes];
    novasOpcoes[index] = novoValor;
    handleAlterarCampoQuestao("opcoes", novasOpcoes);
  };

  const handleAlterarOpcaoObjeto = (index, campo, novoValor) => {
    if (!questaoSelecionada.opcoes) return;
    const novasOpcoes = [...questaoSelecionada.opcoes];
    novasOpcoes[index] = { ...novasOpcoes[index], [campo]: novoValor };
    handleAlterarCampoQuestao("opcoes", novasOpcoes);
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

  const handleDeletarQuestao = (idQuestao) => {
    const confirmar = window.confirm(
      "Certeza que deseja excluir esta questão permanentemente?",
    );
    if (!confirmar) return;

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
  };

  const handleSalvarAlteracoes = async () => {
    try {
      const response = await fetch("https://ingleja-backend.onrender.com/api/admin/licoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const result = await response.json();
      if (result.sucesso) alert("✅ " + result.mensagem);
      else alert("❌ Erro ao salvar: " + result.erro);
    } catch (err) {
      console.error(err);
      alert("❌ Erro de conexão ao tentar salvar as alterações.");
    }
  };

  const handleUploadImagem = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("imagem", file);
    try {
      const response = await fetch("https://ingleja-backend.onrender.com/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.sucesso) handleAlterarCampoQuestao("img", data.filename);
      else alert("Erro no upload: " + data.erro);
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor para upload.");
    }
  };

  if (loading)
    return (
      <div className="flex h-full items-center justify-center font-bold text-gray-500 gap-2">
        <span className="material-symbols-outlined animate-spin">sync</span>{" "}
        Carregando painel...
      </div>
    );
  if (erro)
    return (
      <div className="p-8 font-bold text-red-500 bg-red-50 rounded-xl m-8">
        Erro: {erro}
      </div>
    );

  return (
    <div className="p-6 md:p-8 max-w-[1800px] mx-auto h-full flex flex-col overflow-hidden">
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
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined">save</span> Salvar
            Alterações Globais
          </button>
          <button
            onClick={handleAdicionarNivel}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined">add</span> Novo Nível
          </button>
        </div>
      </header>

      <div className="flex gap-6 flex-1 min-h-0 w-full overflow-hidden">
        {mostrarModulos && (
          <div className="w-[280px] shrink-0 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden transition-all duration-300">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center flex-shrink-0">
              <h2 className="font-bold text-gray-700">Módulos Cadastrados</h2>
              <button
                onClick={() => setMostrarModulos(false)}
                className="text-gray-400 hover:text-primary-600 transition-colors cursor-pointer bg-transparent border-none p-1 rounded-md hover:bg-primary-50 flex"
                title="Recolher painel"
              >
                <span className="material-symbols-outlined">
                  keyboard_double_arrow_left
                </span>
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {dados?.niveis?.map((nivel) => (
                <div
                  key={nivel.id}
                  onClick={() => handleSelecionarNivel(nivel)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${nivelSelecionado?.id === nivel.id ? "border-primary-500 bg-primary-50 ring-4 ring-primary-50/50" : "border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3
                      className={`font-bold ${nivelSelecionado?.id === nivel.id ? "text-primary-700" : "text-gray-800"}`}
                    >
                      {nivel.titulo}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                      {nivel.questoes.length} Questões
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!mostrarModulos && (
          <div className="flex flex-col justify-start shrink-0">
            <button
              onClick={() => setMostrarModulos(true)}
              className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-400 hover:text-primary-600 transition-all cursor-pointer hover:bg-primary-50"
              title="Mostrar Módulos"
            >
              <span className="material-symbols-outlined">menu_open</span>
            </button>
          </div>
        )}

        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden min-w-0 transition-all duration-300">
          {nivelSelecionado ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-4 px-6 border-b border-gray-100 flex-shrink-0 bg-white z-10 flex justify-between items-center">
                <div className="flex items-center gap-3 flex-1">
                  <span className="material-symbols-outlined text-primary-500">
                    edit_document
                  </span>
                  <input
                    type="text"
                    value={nivelSelecionado.titulo}
                    onChange={(e) => handleAlterarTituloNivel(e.target.value)}
                    className="text-xl font-bold text-gray-800 border-none outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 w-full max-w-md bg-transparent hover:bg-gray-50 transition-colors"
                    title="Clique para renomear o módulo"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDeletarNivel}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer border-none bg-transparent flex items-center"
                    title="Excluir Módulo"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      delete
                    </span>
                  </button>
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

              <div className="flex flex-1 min-h-0 w-full overflow-hidden bg-gray-50/30">
                {/* 1. LADO ESQUERDO: Lista de Questões (Ajustado para 25%) */}
                <div className="w-[25%] min-w-[260px] border-r border-gray-100 p-4 overflow-y-auto">
                  <div className="space-y-3">
                    {nivelSelecionado.questoes.map((questao, index) => (
                      <div
                        key={questao.id}
                        onClick={() => setQuestaoSelecionada(questao)}
                        className={`p-4 bg-white border-2 rounded-xl flex items-center gap-4 cursor-pointer transition-all shadow-sm ${questaoSelecionada?.id === questao.id ? "border-primary-500 ring-2 ring-primary-50" : "border-gray-100 hover:border-gray-300"}`}
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
                            <span className="text-[10px] font-bold text-gray-400 capitalize border border-gray-200 px-2 py-0.5 rounded bg-gray-50 whitespace-nowrap">
                              {questao.tipo.replace("_", " ")}
                            </span>
                            {questao.img && (
                              <span className="material-symbols-outlined text-[14px] text-gray-400">
                                image
                              </span>
                            )}
                            {questao.audio && (
                              <span className="material-symbols-outlined text-[14px] text-gray-400">
                                volume_up
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. MEIO: Formulário de Edição */}
                <div className="flex-1 p-6 overflow-y-auto bg-white min-w-[350px]">
                  {questaoSelecionada ? (
                    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] pb-12">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-bold text-gray-800">
                          Formulário de Edição
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold bg-primary-100 text-primary-700 px-3 py-1 rounded-full uppercase tracking-widest">
                            ID: {questaoSelecionada.id}
                          </span>
                          <button
                            onClick={() =>
                              handleDeletarQuestao(questaoSelecionada.id)
                            }
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer border-none bg-transparent flex"
                            title="Excluir Questão"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Pergunta para o aluno
                          </label>
                          <input
                            type="text"
                            value={questaoSelecionada.pergunta_exibicao || ""}
                            onChange={(e) =>
                              handleAlterarCampoQuestao(
                                "pergunta_exibicao",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 outline-none transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Tipo de Questão
                            </label>
                            <select
                              value={questaoSelecionada.tipo || ""}
                              onChange={(e) =>
                                handleAlterarCampoQuestao(
                                  "tipo",
                                  e.target.value,
                                )
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
                                  Parte 1 (Antes)
                                </label>
                                <input
                                  type="text"
                                  value={questaoSelecionada.frase_parte_1 || ""}
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
                                  Parte 2 (Depois)
                                </label>
                                <input
                                  type="text"
                                  value={questaoSelecionada.frase_parte_2 || ""}
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
                          <div>
                            <label className="flex items-center gap-1 text-sm font-bold text-gray-700 mb-2">
                              <span className="material-symbols-outlined text-[16px]">
                                image
                              </span>{" "}
                              Imagem Principal
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={questaoSelecionada.img || ""}
                                onChange={(e) =>
                                  handleAlterarCampoQuestao(
                                    "img",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 outline-none"
                              />
                              <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleUploadImagem}
                                className="hidden"
                              />
                              <button
                                onClick={() => fileInputRef.current.click()}
                                className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 rounded-xl font-bold transition-colors cursor-pointer"
                                title="Fazer Upload"
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  upload
                                </span>
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="flex items-center gap-1 text-sm font-bold text-gray-700 mb-2">
                              <span className="material-symbols-outlined text-[16px]">
                                volume_up
                              </span>{" "}
                              Áudio
                            </label>
                            <input
                              type="text"
                              value={questaoSelecionada.audio || ""}
                              onChange={(e) =>
                                handleAlterarCampoQuestao(
                                  "audio",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none"
                            />
                          </div>
                        </div>

                        {questaoSelecionada.opcoes && (
                          <div className="pt-4 border-t border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                              Opções / Alternativas
                            </label>
                            <div className="space-y-3">
                              {questaoSelecionada.opcoes.map((opcao, index) => (
                                <div
                                  key={index}
                                  className="flex gap-3 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200"
                                >
                                  <span className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-md text-xs font-bold text-gray-500 shrink-0 shadow-sm">
                                    {index + 1}
                                  </span>
                                  {typeof opcao === "string" ? (
                                    <input
                                      type="text"
                                      value={opcao}
                                      onChange={(e) =>
                                        handleAlterarOpcaoString(
                                          index,
                                          e.target.value,
                                        )
                                      }
                                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 outline-none bg-white"
                                    />
                                  ) : (
                                    <div className="flex-1 flex gap-2">
                                      <input
                                        type="text"
                                        value={opcao.texto || ""}
                                        placeholder="Texto"
                                        onChange={(e) =>
                                          handleAlterarOpcaoObjeto(
                                            index,
                                            "texto",
                                            e.target.value,
                                          )
                                        }
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 outline-none bg-white"
                                      />
                                      <input
                                        type="text"
                                        value={opcao.img || ""}
                                        placeholder="Nome da imagem"
                                        onChange={(e) =>
                                          handleAlterarOpcaoObjeto(
                                            index,
                                            "img",
                                            e.target.value,
                                          )
                                        }
                                        className="w-1/3 px-3 py-2 rounded-lg border border-gray-300 focus:border-primary-500 outline-none bg-white font-mono text-sm"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
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

                {/* 3. LADO DIREITO: Live Preview (Mobile Mockup) ajustado para 35% */}
                <div className="w-[35%] min-w-[380px] bg-slate-100 border-l border-gray-200 p-6 overflow-y-auto flex flex-col items-center">
                  <div className="w-full border-b border-gray-200 pb-4 mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">
                      Live Preview
                    </h3>
                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        smartphone
                      </span>{" "}
                      Tela do Aluno
                    </span>
                  </div>

                  {questaoSelecionada ? (
                    <div className="relative w-[320px] h-[650px] bg-white rounded-[3rem] shadow-[0_15px_50px_rgba(0,0,0,0.15)] border-[10px] border-slate-800 flex flex-col overflow-hidden animate-[fadeIn_0.5s_ease-out] shrink-0">
                      {/* Notch do celular */}
                      <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 w-32 mx-auto rounded-b-2xl z-10 flex justify-center items-end pb-1">
                        <div className="w-10 h-1.5 bg-slate-700 rounded-full"></div>
                      </div>

                      {/* Área visível do Preview */}
                      <div className="flex-1 overflow-y-auto bg-slate-50 pt-10 pb-6 px-5 flex flex-col items-center">
                        {/* Barra de progresso fake */}
                        <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
                          <div className="w-1/2 h-full bg-orange-500 rounded-full"></div>
                        </div>

                        <h2 className="text-xl font-extrabold text-slate-800 text-center leading-tight mb-6">
                          {questaoSelecionada.pergunta_exibicao ||
                            "A pergunta aparecerá aqui..."}
                        </h2>

                        {questaoSelecionada.img && (
                          <div className="w-full h-32 mb-6 rounded-2xl flex items-center justify-center bg-white border border-gray-100 p-2 shadow-sm">
                            <img
                              src={`/images/${questaoSelecionada.img}`}
                              alt="Preview"
                              className="max-h-full object-contain rounded-xl"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          </div>
                        )}

                        {questaoSelecionada.tipo === "preencher_lacuna" && (
                          <div className="flex items-end gap-2 text-xl font-bold text-slate-700 mb-6 flex-wrap justify-center w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <span>{questaoSelecionada.frase_parte_1}</span>
                            <span className="border-b-4 border-gray-300 w-16 mx-1 inline-block"></span>
                            <span>{questaoSelecionada.frase_parte_2}</span>
                          </div>
                        )}

                        <div className="w-full space-y-3 mt-auto">
                          {questaoSelecionada.opcoes?.map((opt, i) => (
                            <div
                              key={i}
                              className={`p-4 border-2 border-gray-200 rounded-2xl text-center text-sm font-bold text-slate-600 bg-white shadow-sm ${questaoSelecionada.tipo === "escolha_imagem" ? "flex flex-col items-center gap-2" : ""}`}
                            >
                              {questaoSelecionada.tipo === "escolha_imagem" &&
                                opt.img && (
                                  <img
                                    src={`/images/${opt.img}`}
                                    className="h-20 object-contain rounded drop-shadow-sm mb-2"
                                    onError={(e) =>
                                      (e.target.style.display = "none")
                                    }
                                  />
                                )}
                              {typeof opt === "string" ? opt : opt.texto}
                            </div>
                          ))}
                        </div>

                        <button className="w-full mt-6 bg-orange-500 text-white font-bold py-4 rounded-2xl opacity-50 cursor-not-allowed">
                          Verificar resposta
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 w-full">
                      <div className="w-[320px] h-[650px] border-4 border-dashed border-gray-300 rounded-[3rem] flex flex-col items-center justify-center p-8 text-center bg-white/50">
                        <span className="material-symbols-outlined text-[64px] mb-4 opacity-30 text-gray-400">
                          touch_app
                        </span>
                        <p className="font-bold text-gray-400">
                          Mockup do Celular
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Selecione uma questão para visualizar como o aluno
                          verá na tela.
                        </p>
                      </div>
                    </div>
                  )}
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
