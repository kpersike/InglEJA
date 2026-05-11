import React from "react";

const Navbar = ({ usuario }) => {
  return (
    <nav className="w-full bg-white dark:bg-gray-900 flex items-center justify-between py-4 px-8 md:px-16 sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      {/* Lado Esquerdo: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-primary-500 rounded-full"></div>
        <span className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight transition-colors">
          InglEJA
        </span>
      </div>

      {/* Lado Direito: Status de Gamificação */}
      <div className="hidden md:flex items-center gap-6">
        <div
          className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-bold"
          title="Idioma"
        >
          <span className="material-symbols-outlined text-primary-500 text-[26px]">
            language
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-bold"
          title="Ofensiva"
        >
          <span className="material-symbols-outlined text-orange-500 text-[26px]">
            local_fire_department
          </span>
          <span>0</span>
        </div>

        <div
          className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-bold"
          title="Experiência Total"
        >
          <span className="material-symbols-outlined text-yellow-400 text-[26px]">
            stars
          </span>
          <span>{usuario?.pontos || 0}</span>
        </div>

        <div className="w-10 h-10 rounded-full bg-primary-500 text-white font-bold text-[15px] flex items-center justify-center shadow-sm ml-2">
          {usuario?.nome ? usuario.nome.charAt(0).toUpperCase() : "U"}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
