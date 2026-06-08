import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      const response = await fetch("https://ingleja-backend.onrender.com/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (data.sucesso) {
        localStorage.setItem("ingleja_admin_token", data.token);
        navigate("/admin/licoes");
      } else {
        setErro(data.erro || "Erro ao fazer login.");
      }
    } catch (err) {
      console.error("Erro na requisição de login:", err);
      setErro("Erro de conexão com o servidor.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 mb-2">
            InglEJA
          </h1>
          <h2 className="text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase text-sm">
            Painel do Administrador
          </h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              placeholder="admin@ingleja.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold text-center border border-red-100">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Acessar Painel
          </button>
        </form>
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-gray-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 mx-auto bg-transparent border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Voltar para área do aluno
          </button>
        </div>
      </div>
    </div>
  );
}
