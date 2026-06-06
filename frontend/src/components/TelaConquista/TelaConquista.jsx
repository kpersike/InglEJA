import React, { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";

const TelaConquista = ({
  xpGanhos = 40,
  tempoTotal = "0:22",
  comboAtual = 4,
  tituloNivel = "Nível",
  proximoNivelId = 2,
  proximoSlug = null,
}) => {
  const navigate = useNavigate();
  const [mostrarConfetes, setMostrarConfetes] = useState(true);
  
  // ADICIONADO: Referência para prender o foco dentro do card de conquista
  const cardConquistaRef = useRef(null);

  // CORREÇÃO: Usamos o useState com uma função de inicialização "lazy" (preguiçosa).
  // O React aceita o Math.random() aqui porque isso garante que só vai rodar 1 vez na montagem!
  const [confetes] = useState(() => {
    const colors = ["#f97316", "#3b82f6", "#fbbf24", "#f43f5e", "#a855f7"];
    return [...Array(50)].map(() => ({
      color: colors[Math.floor(Math.random() * colors.length)],
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 3,
      size: 8 + Math.random() * 8,
      isCircle: Math.random() > 0.5,
    }));
  });

  // Desliga os confetes após 6 segundos
  useEffect(() => {
    const timer = setTimeout(() => setMostrarConfetes(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Configuração do disparo de confetes
    const duration = 5 * 1000; // 5 segundos de duração
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 10000,
    };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Dispara dois jatos laterais
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval); // Limpa o intervalo se o usuário sair da tela
  }, []);

  // ADICIONADO: Lógica de Focus Trap para capturar e ciclar o Tab nesta tela
  useEffect(() => {
    if (!cardConquistaRef.current) return;

    // Busca os botões disponíveis na tela de vitória
    const elementosFocaveis = cardConquistaRef.current.querySelectorAll(
      "button:not([disabled])"
    );
    
    if (elementosFocaveis.length > 0) {
      // Dá o foco inicial automaticamente no primeiro botão disponível (geralmente o de avançar)
      elementosFocaveis[0].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      const elementos = cardConquistaRef.current.querySelectorAll(
        "button:not([disabled])"
      );
      if (elementos.length === 0) return;

      const primeiroElemento = elementos[0];
      const ultimoElemento = elementos[elementos.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === primeiroElemento) {
          ultimoElemento.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === ultimoElemento) {
          primeiroElemento.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const irParaProximo = () => {
    if (proximoSlug) {
      navigate(`/exercicio/${proximoSlug}`);
      window.location.reload();
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-50/90 dark:bg-gray-950/95 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 transition-colors duration-300 overflow-hidden">
      <style>
        {`
          @keyframes spinY {
            0% { transform: perspective(1000px) rotateY(0deg); }
            100% { transform: perspective(1000px) rotateY(360deg); }
          }
          .trophy-spin {
            animation: spinY 4s linear infinite;
          }
          @keyframes fall {
            0% { transform: translateY(-10vh) rotate(0deg) scale(1); opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity: 0; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      {/* RENDERIZAÇÃO DOS CONFETES GERADOS NO STATE */}
      {mostrarConfetes && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {confetes.map((confete, i) => (
            <div
              key={i}
              className="absolute opacity-0"
              style={{
                left: `${confete.left}%`,
                top: "-5%",
                width: `${confete.size}px`,
                height: `${confete.size}px`,
                backgroundColor: confete.color,
                borderRadius: confete.isCircle ? "50%" : "3px",
                animation: `fall ${confete.duration}s linear ${confete.delay}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* CARD PRINCIPAL - ADICIONADA A REF AQUI */}
      <div 
        ref={cardConquistaRef}
        className="bg-white dark:bg-gray-900 w-full max-w-2xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center transition-colors relative z-10 animate-[scaleIn_0.4s_ease-out]"
      >
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-orange-400 blur-[35px] opacity-40 rounded-full animate-pulse"></div>

          <div className="relative w-32 h-32 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-full flex justify-center items-center shadow-[0_0_40px_rgba(249,115,22,0.4)] border-8 border-white dark:border-gray-900 transition-colors trophy-spin">
            <span className="material-symbols-outlined text-white text-[4.5rem]">
              trophy
            </span>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
          Vitória!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mb-10">
          Você dominou{" "}
          <strong className="text-orange-500 dark:text-orange-400">
            {tituloNivel}
          </strong>
        </p>

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12">
          <div className="bg-orange-50/60 dark:bg-orange-900/10 p-6 rounded-[1.5rem] border border-orange-100 dark:border-orange-900/30 flex flex-col items-center transition-colors hover:-translate-y-1 duration-300">
            <div className="flex flex-col items-center gap-2 text-orange-600 dark:text-orange-500 text-[10px] font-extrabold uppercase tracking-widest mb-3">
              <span className="material-symbols-outlined text-[28px] drop-shadow-sm">
                star
              </span>
              Experiência
            </div>
            <strong className="text-3xl font-black text-slate-800 dark:text-white mb-2">
              +{xpGanhos}
            </strong>
            <span className="text-[11px] font-bold text-orange-600 bg-orange-100/80 dark:bg-orange-900/40 dark:text-orange-400 px-3 py-1 rounded-full">
              XP Ganho
            </span>
          </div>

          <div className="bg-primary-50/60 dark:bg-primary-900/10 p-6 rounded-[1.5rem] border border-primary-100 dark:border-primary-900/30 flex flex-col items-center transition-colors hover:-translate-y-1 duration-300">
            <div className="flex flex-col items-center gap-2 text-primary-600 dark:text-primary-500 text-[10px] font-extrabold uppercase tracking-widest mb-3">
              <span className="material-symbols-outlined text-[28px] drop-shadow-sm">
                timer
              </span>
              Tempo
            </div>
            <strong className="text-3xl font-black text-slate-800 dark:text-white mb-2">
              {tempoTotal}
            </strong>
            <span className="text-[11px] font-bold text-primary-600 bg-primary-100/80 dark:bg-primary-900/40 dark:text-orange-400 px-3 py-1 rounded-full">
              Minutos
            </span>
          </div>

          <div className="bg-rose-50/60 dark:bg-rose-900/10 p-6 rounded-[1.5rem] border border-rose-100 dark:border-rose-900/30 flex flex-col items-center transition-colors hover:-translate-y-1 duration-300">
            <div className="flex flex-col items-center gap-2 text-rose-600 dark:text-rose-500 text-[10px] font-extrabold uppercase tracking-widest mb-3">
              <span className="material-symbols-outlined text-[28px] drop-shadow-sm">
                local_fire_department
              </span>
              Combo
            </div>
            <strong className="text-3xl font-black text-slate-800 dark:text-white mb-2">
              x{comboAtual}
            </strong>
            <span className="text-[11px] font-bold text-rose-600 bg-rose-100/80 dark:bg-rose-900/40 dark:text-orange-400 px-3 py-1 rounded-full">
              Sequência
            </span>
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {proximoSlug && (
            <button
              onClick={irParaProximo}
              // {/* ADICIONADO: focus-visible customizado acompanhando o estilo laranja */}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[16px] py-5 px-8 rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(249,115,22,0.35)] transition-all hover:-translate-y-1 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/50"
            >
              Ir para o Nível {proximoNivelId}
              <span className="material-symbols-outlined text-[26px]">
                fast_forward
              </span>
            </button>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            // {/* ADICIONADO: focus-visible customizado com tom cinza/slate */}
            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-extrabold text-[16px] py-5 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/50"
          >
            Voltar ao Mapa
            <span className="material-symbols-outlined text-[24px]">map</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelaConquista;