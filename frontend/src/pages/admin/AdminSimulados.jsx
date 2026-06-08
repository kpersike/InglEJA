import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AdminSimulados() {
  const [simulados, setSimulados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simuladoSelecionado, setSimuladoSelecionado] = useState(null);

  useEffect(() => {
    // Busca simulados do backend (usaremos mock temporário para o MVP se a API não estiver pronta)
    fetch(`${API_URL}/api/admin/simulados`)
      .then((res) => res.json())
      .then((data) => {
        setSimulados(data.simulados || []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback temporário para ver a tela funcionar
        setSimulados([
          {
            id: 1,
            titulo: "Simulado Módulo 1 e 2",
            ativo: true,
            questoesIds: [1, 2, 5, 8],
          },
        ]);
        setLoading(false);
      });
  }, []);

  const handleCriarSimulado = () => {
    const novoSimulado = {
      id: Date.now(),
      titulo: "Novo Simulado",
      ativo: false,
      questoesIds: [],
    };
    setSimulados([...simulados, novoSimulado]);
    setSimuladoSelecionado(novoSimulado);
  };

  const handleSalvarSimulados = async () => {
    try {
      await fetch(`${API_URL}/api/admin/simulados`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulados }),
      });
      alert("✅ Simulados salvos com sucesso! Os alunos já serão notificados.");
    } catch (err) {
      // CORREÇÃO APLICADA AQUI: Utilizando a variável 'err' no console para o ESLint aprovar e facilitar debug.
      console.error("Falha na requisição ao salvar simulados:", err);
      alert("❌ Erro ao salvar simulados.");
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-6 md:p-8 w-full h-full flex flex-col">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Gerenciador de Simulados
          </h1>
          <p className="text-gray-500 mt-1">
            Crie avaliações e notifique os alunos automaticamente.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleSalvarSimulados}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined">campaign</span> Publicar
            Alterações
          </button>
          <button
            onClick={handleCriarSimulado}
            className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer border-none"
          >
            <span className="material-symbols-outlined">add</span> Criar
            Simulado
          </button>
        </div>
      </header>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Lista de Simulados */}
        <div className="w-[300px] bg-white border border-gray-200 rounded-2xl p-4 overflow-y-auto">
          {simulados.map((sim) => (
            <div
              key={sim.id}
              onClick={() => setSimuladoSelecionado(sim)}
              className={`p-4 border-2 rounded-xl mb-3 cursor-pointer ${simuladoSelecionado?.id === sim.id ? "border-orange-500 bg-orange-50" : "border-gray-100 hover:border-gray-300"}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800">{sim.titulo}</h3>
                {sim.ativo ? (
                  <span
                    className="w-2 h-2 rounded-full bg-green-500"
                    title="Ativo para os alunos"
                  ></span>
                ) : (
                  <span
                    className="w-2 h-2 rounded-full bg-gray-300"
                    title="Rascunho"
                  ></span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {sim.questoesIds.length} Questões selecionadas
              </p>
            </div>
          ))}
        </div>

        {/* Editor do Simulado */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6">
          {simuladoSelecionado ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <input
                  type="text"
                  value={simuladoSelecionado.titulo}
                  onChange={(e) =>
                    setSimulados(
                      simulados.map((s) =>
                        s.id === simuladoSelecionado.id
                          ? { ...s, titulo: e.target.value }
                          : s,
                      ),
                    )
                  }
                  className="text-2xl font-bold text-gray-800 outline-none border-b-2 border-transparent focus:border-orange-500 w-full max-w-md bg-transparent"
                />
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                  <input
                    type="checkbox"
                    checked={simuladoSelecionado.ativo}
                    onChange={(e) =>
                      setSimulados(
                        simulados.map((s) =>
                          s.id === simuladoSelecionado.id
                            ? { ...s, ativo: e.target.checked }
                            : s,
                        ),
                      )
                    }
                    className="w-4 h-4 accent-orange-500"
                  />
                  Visível para Alunos
                </label>
              </div>

              <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-500">
                <span className="material-symbols-outlined text-4xl mb-2">
                  format_list_bulleted
                </span>
                <p>
                  O recurso de arrastar questões do banco de lições para o
                  simulado será implementado na Fase 2.
                </p>
                <p className="text-sm mt-2">
                  Por enquanto, salve o simulado como "Ativo" para ativar a
                  notificação no Dashboard do aluno.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Selecione um simulado para editar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
