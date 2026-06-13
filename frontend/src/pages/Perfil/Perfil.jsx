import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";

function Perfil() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  // 🌟 Referência criada para monitorar o escopo do formulário de perfil
  const mainCardRef = useRef(null);

  const [usuario, setUsuario] = useState(() => {
    const dadosSalvos = localStorage.getItem("usuarioLogado");
    return dadosSalvos ? JSON.parse(dadosSalvos) : null;
  });

  const [novoNome, setNovoNome] = useState(usuario?.nome || "");
  const [novoAvatar, setNovoAvatar] = useState(usuario?.avatar || null);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  const avataresPredefinidos = [
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Milo`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Luna`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Bandit`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Coco`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=Robot1`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=Robot2`,
  ];

  useEffect(() => {
    if (!usuario) {
      navigate("/");
    }
  }, [usuario, navigate]);

  // 🌟 FOCUS TRAP: Prende a navegação do Tab estritamente dentro da página de perfil
  useEffect(() => {
    const tratarFocusTrap = (evento) => {
      // Executa apenas se a tecla pressionada for Tab e se o container do card existir
      if (evento.key !== "Tab" || !mainCardRef.current) {
        return;
      }

      // Localiza todos os elementos focáveis válidos dentro do card principal
      const elementosFocaveis = mainCardRef.current.querySelectorAll(
        'button:not([disabled]), [tabindex="0"]:not([tabindex="-1"]), input:not([tabindex="-1"]), select, textarea'
      );

      if (elementosFocaveis.length === 0) return;

      const primeiroElemento = elementosFocaveis[0];
      const ultimoElemento = elementosFocaveis[elementosFocaveis.length - 1];

      // Shift + Tab (Navegando para trás)
      if (evento.shiftKey) {
        if (document.activeElement === primeiroElemento) {
          ultimoElemento.focus(); // Retorna para o botão de Salvar Alterações
          evento.preventDefault(); // Impede o foco de escapar para o navegador
        }
      } 
      // Tab simples (Navegando para a frente)
      else {
        if (document.activeElement === ultimoElemento) {
          primeiroElemento.focus(); // Joga o foco de volta para o botão Voltar ao Painel
          evento.preventDefault(); // Impede o foco de escapar para o navegador
        }
      }
    };

    window.addEventListener("keydown", tratarFocusTrap);
    return () => {
      window.removeEventListener("keydown", tratarFocusTrap);
    };
  }, [usuario]); // Monitora após o carregamento inicial do DOM

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        const mensagemErro = "A imagem é muito grande. Escolha uma imagem de até 2MB.";
        setErro(mensagemErro);
        falarTextoDireto(mensagemErro); // 🌟 Feedback falado imediato
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNovoAvatar(reader.result);
        setErro("");
        falarTextoDireto("Foto de perfil carregada com sucesso."); // 🌟 Feedback falado imediato
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvar = async () => {
    if (!novoNome.trim()) {
      const mensagemErro = "O nome não pode estar vazio.";
      setErro(mensagemErro);
      falarTextoDireto(mensagemErro); // 🌟 Feedback falado imediato
      return;
    }

    setSalvando(true);
    setErro("");
    setSucesso(false);
    falarTextoDireto("Salvando alterações do perfil."); // 🌟 Feedback falado imediato

    try {
      const resposta = await fetch("https://ingleja-backend.onrender.com/api/atualizar-perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: usuario.email,
          novoNome: novoNome.trim(),
          avatar: novoAvatar
        }),
      });

      const dados = await resposta.json();

      if (dados.sucesso) {
        const usuarioAtualizado = { ...usuario, nome: dados.usuario.nome, avatar: dados.usuario.avatar };
        localStorage.setItem("usuarioLogado", JSON.stringify(usuarioAtualizado));
        setUsuario(usuarioAtualizado);
        setSucesso(true);
        falarTextoDireto("Perfil atualizado com sucesso!"); // 🌟 Feedback falado imediato
        setTimeout(() => setSucesso(false), 3000);
      } else {
        const mensagemErro = dados.erro || "Erro ao salvar perfil.";
        setErro(mensagemErro);
        falarTextoDireto(mensagemErro); // 🌟 Feedback falado imediato
      }
    } catch (err) {
      const mensagemErro = "Erro de conexão com o servidor.";
      setErro(mensagemErro);
      falarTextoDireto(mensagemErro); // 🌟 Feedback falado imediato
    } finally {
      setSalvando(false);
    }
  };

  if (!usuario) return null;

  // ==========================================
  // AUXILIAR: EMISSÃO DE VOZ DIRETA E CONDICIONAL
  // ==========================================
  const falarTextoDireto = (texto, idioma = "pt-BR") => {
    if (!window.speechSynthesis) return;

    const configSalvas = localStorage.getItem("configuracoes_ingleja");
    if (!configSalvas) return;
    const parsedConfig = JSON.parse(configSalvas);
    if (!parsedConfig.acessibilidadeAtiva) return;

    window.speechSynthesis.cancel();
    const mensagem = new SpeechSynthesisUtterance(texto);
    mensagem.lang = idioma;
    mensagem.rate = 1.15;
    window.speechSynthesis.speak(mensagem);
  };

  // ==========================================
  // MOTOR DE ACESSIBILIDADE: ANÚNCIO DE ENTRADA
  // ==========================================
  useEffect(() => {
    const configSalvas = localStorage.getItem("configuracoes_ingleja");
    if (!configSalvas) return;

    const parsedConfig = JSON.parse(configSalvas);
    if (!parsedConfig.acessibilidadeAtiva) return;

    const textoIntroducao = "Tela de Perfil. Aqui você pode alterar seu nome de usuário ou escolher um novo avatar. Use a tecla Tab para navegar pelos campos.";

    const tentarFalar = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const mensagem = new SpeechSynthesisUtterance(textoIntroducao);
        mensagem.lang = "pt-BR";
        mensagem.rate = 1.15;
        window.speechSynthesis.speak(mensagem);
      }
    };

    tentarFalar();

    const interacaoSalvaguarda = () => {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        removerEscutadores();
        return;
      }
      tentarFalar();
      removerEscutadores();
    };

    const removerEscutadores = () => {
      document.removeEventListener("click", interacaoSalvaguarda);
      document.removeEventListener("keydown", interacaoSalvaguarda);
    };

    document.addEventListener("click", interacaoSalvaguarda);
    document.addEventListener("keydown", interacaoSalvaguarda);

    return () => removerEscutadores();
  }, [usuario]);

  // ==========================================
  // MOTOR DE ACESSIBILIDADE: LEITURA DO FOCO (TAB)
  // ==========================================
  useEffect(() => {
    const configSalvas = localStorage.getItem("configuracoes_ingleja");
    if (!configSalvas) return;

    const parsedConfig = JSON.parse(configSalvas);
    if (!parsedConfig.acessibilidadeAtiva) return;

    const falarTextoFocado = (evento) => {
      const elemento = evento.target;

      let textoParaFalar =
        elemento.getAttribute("aria-label") ||
        elemento.placeholder ||
        elemento.innerText ||
        "";

      // Filtro para impedir a leitura crua dos nomes de ícones
      textoParaFalar = textoParaFalar
        .replace("arrow_back", "")
        .replace("person", "")
        .replace("photo_camera", "")
        .trim();

      if (textoParaFalar && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const mensagem = new SpeechSynthesisUtterance(textoParaFalar);
        mensagem.lang = "pt-BR";
        mensagem.rate = 1.2;
        window.speechSynthesis.speak(mensagem);
      }
    };

    document.addEventListener("focus", falarTextoFocado, true);
    return () => document.removeEventListener("focus", falarTextoFocado, true);
  }, []);

return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 font-nunito transition-colors duration-300 flex flex-col">
      <Navbar usuario={usuario}/>
      
      <main ref={mainCardRef} className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col pt-24 md:pt-32">
        
        {/* Botão Voltar com aria-label limpo */}
        <button 
          type="button"
          onClick={() => navigate("/dashboard")}
          aria-label="Voltar ao Painel Principal"
          className="self-start flex items-center gap-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 mb-6 transition-colors font-bold rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          Voltar ao Painel
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-800">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Personalizar Perfil</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-10">Escolha como você quer ser visto na plataforma.</p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12">
            
            {/* COLUNA ESQUERDA - AVATAR ATUAL */}
            <div className="flex flex-col items-center">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Alterar foto de perfil enviando um arquivo"
                className="relative group cursor-pointer mb-6 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-4 dark:focus-visible:ring-offset-gray-900 border-none bg-transparent p-0"
              >
                <div className="w-40 h-40 rounded-full bg-primary-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center text-6xl font-black overflow-hidden relative">
                  {novoAvatar ? (
                    <img src={novoAvatar} alt="Avatar Atual" className="w-full h-full object-cover" />
                  ) : (
                    <span aria-hidden="true">{novoNome ? novoNome.charAt(0).toUpperCase() : "U"}</span>
                  )}
                  
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-3xl" aria-hidden="true">photo_camera</span>
                    <span className="text-white text-sm font-bold mt-1">Alterar</span>
                  </div>
                </div>
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
                tabIndex="-1"
              />
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Fazer upload de uma nova imagem do computador"
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Fazer Upload
              </button>
              <p className="text-xs text-gray-400 mt-3 text-center" aria-hidden="true">Formato: JPG, PNG. Máx: 2MB.</p>
            </div>

            {/* COLUNA DIREITA - FORMULÁRIO */}
            <div className="flex flex-col">
              
              <div className="mb-8">
                <label htmlFor="nomeUsuario" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nome de Usuário</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">person</span>
                  <input
                    id="nomeUsuario"
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-gray-800 dark:text-gray-100 font-bold"
                    placeholder="Seu nome completo ou apelido"
                  />
                </div>
              </div>

              <div className="mb-10">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Ou escolha um avatar pré-montado</label>
                <div className="grid grid-cols-4 gap-4">
                  {avataresPredefinidos.map((url, i) => {
                    const isSelected = novoAvatar === url;
                    return (
                      <div 
                        key={i} 
                        tabIndex="0"
                        role="button"
                        aria-label={`Avatar pré-definido ${i + 1}. ${isSelected ? "Atualmente selecionado." : "Pressione Enter para selecionar."}`}
                        onClick={() => {
                          setNovoAvatar(url);
                          falarTextoDireto(`Avatar pré-definido ${i + 1} selecionado.`);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setNovoAvatar(url);
                            falarTextoDireto(`Avatar pré-definido ${i + 1} selecionado.`);
                          }
                        }}
                        className={`cursor-pointer rounded-full p-1 border-2 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                          isSelected 
                            ? "border-primary-500 shadow-md" 
                            : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <img src={url} alt={`Opção de Avatar ${i + 1}`} className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {erro && <p className="text-red-500 font-bold mb-4 text-sm" role="alert">{erro}</p>}
              {sucesso && <p className="text-green-500 font-bold mb-4 text-sm" role="status">Perfil updated com sucesso!</p>}

              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                aria-label={salvando ? "Salvando alterações" : "Salvar Alterações do perfil"}
                className={`mt-auto px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 ${
                  salvando 
                    ? "bg-primary-400 cursor-not-allowed" 
                    : "bg-primary-600 hover:bg-primary-700 hover:-translate-y-1"
                }`}
              >
                {salvando ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Perfil;