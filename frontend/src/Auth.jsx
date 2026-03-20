import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // Vamos colocar seu style.css aqui

function Auth() {
  const navigate = useNavigate();

  // 1. ESTADOS (Substituem o document.getElementById)
  const [isLogin, setIsLogin] = useState(true); // Controla se mostra Login ou Cadastro
  const [formData, setFormData] = useState({ nome: "", email: "", senha: "" });
  const [feedback, setFeedback] = useState({ msg: "", color: "" });

  // 2. FUNÇÃO PARA ALTERNAR TELA
  const alternarTela = () => {
    setIsLogin(!isLogin);
    setFeedback({ msg: "", color: "" });
  };

  // 3. ATUALIZAR CAMPOS (Facilita pegar o que o usuário digita)
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // 4. LÓGICA DE CADASTRO
  const fazerCadastro = async () => {
    const { nome, email, senha } = formData;
    if (!nome || !email || !senha) {
      setFeedback({ msg: "Preencha todos os campos.", color: "blue" });
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await response.json();

      if (response.ok) {
        setFeedback({ msg: "Conta criada com sucesso!", color: "#58cc02" });
        setTimeout(alternarTela, 2000);
      } else {
        setFeedback({ msg: data.erro || "Erro ao cadastrar.", color: "red" });
      }
    } catch (error) {
      setFeedback({ msg: "Erro de conexão com o servidor.", color: "red" });
    }
  };

  // 5. LÓGICA DE LOGIN
  const fazerLogin = async (e) => {
    if (e) e.preventDefault(); // <--- ISSO impede a página de atualizar!
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
          color: "#1cb0f6",
        });
        // No lugar de window.location.href = '/dashboard'
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setFeedback({
          msg: data.erro || "E-mail ou senha incorretos.",
          color: "red",
        });
      }
    } catch (error) {
      setFeedback({ msg: "Erro de conexão.", color: "red" });
    }
  };

  return (
    <main className="container">
      <h1>Bem-vindo ao InglEJA</h1>

      {isLogin ? (
        /* ÁREA DE LOGIN */
        <section id="login-area">
          <h2>Entrar</h2>
          <div className="form-group">
            <label>Seu E-mail:</label>
            <input
              type="email"
              id="email"
              onChange={handleChange}
              placeholder="exemplo@email.com"
            />
          </div>
          <div className="form-group">
            <label>Sua senha:</label>
            <input
              type="password"
              id="senha"
              onChange={handleChange}
              placeholder="Digite sua senha"
            />
          </div>
          <button onClick={fazerLogin} className="btn-primary">
            Entrar no Curso
          </button>
          <p>
            Ainda não tem conta?{" "}
            <span className="link" onClick={alternarTela}>
              Clique aqui para criar uma
            </span>
          </p>
        </section>
      ) : (
        /* ÁREA DE CADASTRO */
        <section id="cadastro-area">
          <h2>Criar nova conta</h2>
          <div className="form-group">
            <label>Seu nome:</label>
            <input
              type="text"
              id="nome"
              onChange={handleChange}
              placeholder="Como quer ser chamado?"
            />
          </div>
          <div className="form-group">
            <label>Seu E-mail:</label>
            <input
              type="email"
              id="email"
              onChange={handleChange}
              placeholder="Seu melhor e-mail"
            />
          </div>
          <div className="form-group">
            <label>Crie uma Senha:</label>
            <input
              type="password"
              id="senha"
              onChange={handleChange}
              placeholder="Escolha uma senha fácil"
            />
          </div>
          <button onClick={fazerCadastro} className="btn-sucess">
            Finalizar Cadastro
          </button>
          <p>
            <span className="link" onClick={alternarTela}>
              Voltar para o Login
            </span>
          </p>
        </section>
      )}

      <div id="mensagem-feedback" style={{ color: feedback.color }}>
        {feedback.msg}
      </div>
    </main>
  );
}

export default Auth;
