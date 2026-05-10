import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [feedback, setFeedback] = useState({ msg: "", color: "" });

  const alternarTela = () => {
    setIsLogin(!isLogin);
    setFeedback({ msg: "", color: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const fazerCadastro = async (e) => {
    if (e) e.preventDefault();
    const { email, senha, confirmarSenha } = formData;
    if (!email || !senha || !confirmarSenha) {
      setFeedback({ msg: "Preencha todos os campos.", color: "text-blue-500" });
      return;
    }
    if (senha !== confirmarSenha) {
      setFeedback({ msg: "As senhas não coincidem!", color: "text-red-500" });
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: "Aluno InglEJA", email, senha }),
      });
      if (response.ok) {
        setFeedback({
          msg: "Conta criada com sucesso!",
          color: "text-green-500",
        });
        setTimeout(() => navigate("/welcome"), 1500);
      } else {
        const data = await response.json();
        setFeedback({
          msg: data.erro || "Erro ao cadastrar.",
          color: "text-red-500",
        });
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setFeedback({
        msg: "Erro ao conectar com servidor.",
        color: "text-red-500",
      });
    }
  };

  const fazerLogin = async (e) => {
    if (e) e.preventDefault();
    const { email, senha } = formData;
    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));
        setFeedback({
          msg: `Bem-vindo, ${data.usuario.nome}!`,
          color: "text-blue-500",
        });
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setFeedback({
          msg: data.erro || "E-mail ou senha incorretos.",
          color: "text-red-500",
        });
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setFeedback({ msg: "Erro de conexão.", color: "text-red-500" });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const response = await fetch("http://localhost:3000/api/login-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: decoded.email,
          nome: decoded.name,
          foto: decoded.picture,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));
        navigate(data.novoUsuario ? "/welcome" : "/dashboard");
      }
    } catch (error) {
      console.error("Erro na autenticação Google:", error);
      setFeedback({
        msg: "Erro na autenticação Google.",
        color: "text-red-500",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      {/* CARD PRINCIPAL DE LOGIN */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-10 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-full"></div>
            <span className="font-black text-3xl text-gray-900 dark:text-white tracking-tighter">
              InglEJA
            </span>
          </div>
          <h2 className="text-2xl font-bold dark:text-white">
            {isLogin ? "Entrar" : "Crie sua conta"}
          </h2>
        </div>

        <form
          onSubmit={isLogin ? fazerLogin : fazerCadastro}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              onChange={handleChange}
              required
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:border-blue-500 transition-all"
              placeholder="exemplo@gmail.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
              Senha
            </label>
            <input
              type="password"
              id="senha"
              onChange={handleChange}
              required
              className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:border-blue-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                id="confirmarSenha"
                onChange={handleChange}
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:border-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all mt-2"
          >
            {isLogin ? "LOGAR" : "CADASTRAR"}
          </button>
        </form>

        {feedback.msg && (
          <p className={`mt-4 text-center text-sm font-bold ${feedback.color}`}>
            {feedback.msg}
          </p>
        )}

        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            ou
          </span>
          <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
        </div>

        <div className="flex justify-center w-full">
          <div className="w-[300px]">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() =>
                setFeedback({ msg: "Erro Google", color: "text-red-500" })
              }
              theme="filled_blue"
              shape="pill"
            />
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10">
          {isLogin ? "Ainda não tem uma conta?" : "Já possui cadastro?"}
          <button
            onClick={alternarTela}
            className="ml-2 text-blue-600 dark:text-blue-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
          >
            {isLogin ? "Crie uma aqui" : "Entre aqui"}
          </button>
        </p>
      </div>

      {/* BOTÃO DISCRETO PARA PROFESSORES */}
      <div className="mt-8 text-center animate-[fadeIn_1s_ease-in]">
        <button
          onClick={() => navigate("/admin")}
          className="text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer border-none bg-transparent"
        >
          <span className="material-symbols-outlined text-[18px]">
            admin_panel_settings
          </span>
          Acesso para Professores
        </button>
      </div>
    </div>
  );
}

export default Auth;
