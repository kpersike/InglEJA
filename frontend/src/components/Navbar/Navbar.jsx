import React from "react";

const Navbar = ({ usuario }) => {
  return (
    <nav className="w-full bg-white dark:bg-gray-900 flex items-center justify-between py-4 px-8 md:px-16 sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      {/* Lado Esquerdo: Logo (Original mantido) */}
      <div className="flex items-center gap-3">
        <img
          src="images/logotipo_2.png"
          alt="Logo InglEJA"
          className="w-40 h-auto object-contain"
        />
      </div>

      {/* Lado Direito: Status e Perfil (Limpo e Refinado) */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Pontos de Experiência (Estrela) */}
        <div
          className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-2xl border border-yellow-100 dark:border-yellow-800/30 shadow-sm transition-transform hover:scale-105 cursor-default"
          title="Sua Pontuação Total"
        >
          <span className="material-symbols-outlined text-yellow-500 text-[24px]">
            stars
          </span>
          <span className="text-yellow-700 dark:text-yellow-400 font-extrabold text-[15px]">
            {usuario?.pontos || 0}
          </span>
        </div>

        {/* Avatar do Usuário */}
        <div
          className="w-11 h-11 rounded-full bg-primary-500 text-white font-extrabold text-[16px] flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800 hover:scale-105 transition-transform cursor-default overflow-hidden"
          title={usuario?.nome || "Aluno"}
        >
          {usuario?.avatar ? (
            <img
              src={usuario.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : usuario?.nome ? (
            usuario.nome.charAt(0).toUpperCase()
          ) : (
            "U"
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
