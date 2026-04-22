import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // Vamos colocar seu style.css aqui
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

function Auth() {
  const navigate = useNavigate();

  // 1. ESTADOS (Substituem o document.getElementById)
  const [isLogin, setIsLogin] = useState(true); // Controla se mostra Login ou Cadastro
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
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
  const fazerCadastro = async (e) => {
    if (e) e.preventDefault(); // Impede recarregamento do formulário
    const { email, senha, confirmarSenha } = formData;
    if (!email || !senha || !confirmarSenha) {
      setFeedback({ msg: "Preencha todos os campos.", color: "blue" });
      return;
    }

    if (senha !== confirmarSenha) {
      setFeedback({ msg: "As senhas não coincidem!", color: "red" });
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: "Aluno InglEJA", // Enviamos isso para o servidor não dar erro 400
          email: email,
          senha: senha,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("emailUsuario", email);
        setFeedback({ msg: "Conta criada com sucesso!", color: "#58cc02" });
        // setTimeout(alternarTela, 2000);
        setTimeout(() => {
          navigate("/welcome");
        }, 1500);
      } else {
        setFeedback({ msg: data.erro || "Erro ao cadastrar.", color: "red" });
      }
    } catch (error) {
      console.error("Erro na requisição:", error); // Agora a variável está sendo usada!
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
      console.error("Erro capturado:", error); // <-- Isso avisa ao ESLint que a variável está sendo usada!
      setFeedback({ msg: "Erro de conexão.", color: "red" });
    }
  };

  // 6. LÓGICA DE LOGIN COM GOOGLE
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Dados do Google decodificados:", decoded);

      // Aqui você faz a ponte com o seu Backend na porta 3000
      const response = await fetch("http://localhost:3000/api/login-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: decoded.email,
          nome: decoded.name,
          foto: decoded.picture
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));
        setFeedback({ msg: `Bem-vindo, ${decoded.name}!`, color: "#1cb0f6" });
        setTimeout(() => {
          if (data.novoUsuario) {
            navigate("/welcome");
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      } else {
        setFeedback({ msg: "Erro ao validar conta com o servidor.", color: "red" });
      }
    } catch (error) {
      console.error("Erro no Google Login:", error);
      setFeedback({ msg: "Erro na autenticação com o Google.", color: "red" });
    }
  };

  return (
    <main className="container">
      {isLogin ? (
        /* ÁREA DE LOGIN */
        <section id="login-area">
          <div className="form-title">
            <h2>Entrar</h2>
            <p>Bem-vindo! Faça login para continuar.</p>
          </div>

          <form className="form-container" onSubmit={fazerLogin}>
            <div className="form-group">
              <label>E-mail:</label>
              <div className="input-container">
                <span className="material-symbols-outlined">mail</span>
                <input
                  type="email"
                  id="email"
                  onChange={handleChange}
                  placeholder="exemplo@gmail.com"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Senha:</label>
              <div className="input-container">
                <span className="material-symbols-outlined">lock</span>
                <input
                  type="password"
                  id="senha"
                  onChange={handleChange}
                  placeholder="Digite sua senha"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">
              Logar
            </button>

            <div className="divider">
              <span>ou</span>
            </div>

            <div className="google-login-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setFeedback({ msg: "Erro no Google Auth", color: "red" })}
                theme="filled_blue"
                shape="pill"
                text="signin_with"
              />
            </div>
          </form>

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
          <div className="form-title">
            <h2>Crie sua conta</h2>
            <p>Comece agora de forma simples e rápida.</p>
          </div>
          <form className="form-container" onSubmit={fazerCadastro}>
            <div className="form-group">
              <label>Seu E-mail:</label>
              <div className="input-container">
                <span className="material-symbols-outlined">mail</span>
                <input
                  type="email"
                  id="email"
                  onChange={handleChange}
                  placeholder="Seu melhor e-mail"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Senha:</label>
              <div className="input-container">
                <span className="material-symbols-outlined">lock</span>
                <input
                  type="password"
                  id="senha"
                  onChange={handleChange}
                  placeholder="Crie uma senha forte"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Confirmar senha:</label>
              <div className="input-container">
                <span className="material-symbols-outlined">verified_user</span>
                <input
                  type="password"
                  id="confirmarSenha"
                  onChange={handleChange}
                  placeholder="Repita sua senha"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-sucess">
              CADASTRAR
            </button>
          </form>

          <p id="footer-links">
            Já tem uma conta?
            <span className="link" onClick={alternarTela}>
              Entrar aqui
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
