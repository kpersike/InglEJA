import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("ingleja_admin_token");

  // NOVO ESTADO: Controla se a sidebar principal está aberta ou fechada
  const [sidebarAberta, setSidebarAberta] = useState(true);

  useEffect(() => {
    if (!token) navigate("/admin", { replace: true });
  }, [navigate, location, token]);

  const handleLogout = () => {
    localStorage.removeItem("ingleja_admin_token");
    navigate("/admin", { replace: true });
  };

  if (!token) return null;

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 font-sans font-medium overflow-hidden">
      {/* Sidebar Principal Dinâmica (Expande e Recolhe) */}
      <aside
        className={`${sidebarAberta ? "w-64" : "w-20"} bg-white border-r border-gray-200 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 transition-all duration-300 ease-in-out shrink-0`}
      >
        <div
          className={`p-5 flex items-center ${sidebarAberta ? "justify-between" : "justify-center"} border-b border-gray-50 h-[84px]`}
        >
          {/* Mostra Logo apenas se estiver aberta */}
          {sidebarAberta && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0">
                I
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900 whitespace-nowrap">
                InglEJA{" "}
                <span className="text-[10px] text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-1 rounded-md ml-1 font-bold">
                  Admin
                </span>
              </span>
            </div>
          )}

          {/* Botão de Toggle */}
          <button
            onClick={() => setSidebarAberta(!sidebarAberta)}
            className="text-gray-400 hover:text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
            title={sidebarAberta ? "Recolher Menu" : "Expandir Menu"}
          >
            <span className="material-symbols-outlined">
              {sidebarAberta ? "menu_open" : "menu"}
            </span>
          </button>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 overflow-y-auto overflow-x-hidden px-3">
          <div
            className="flex items-center gap-3 px-3 py-3 bg-primary-50 text-primary-700 rounded-xl font-bold cursor-pointer transition-all whitespace-nowrap"
            title="Lições"
          >
            <span className="material-symbols-outlined shrink-0">
              menu_book
            </span>
            {sidebarAberta && <span>Lições</span>}
          </div>
          <div
            className="flex items-center gap-3 px-3 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl font-bold cursor-pointer transition-colors whitespace-nowrap"
            title="Alunos"
          >
            <span className="material-symbols-outlined shrink-0">group</span>
            {sidebarAberta && <span>Alunos</span>}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarAberta ? "gap-3 px-4" : "justify-center px-0"} py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors cursor-pointer border-none bg-transparent`}
            title="Sair"
          >
            <span className="material-symbols-outlined shrink-0">logout</span>
            {sidebarAberta && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Área Principal que se expande quando a sidebar recolhe */}
      <main className="flex-1 overflow-y-auto h-full bg-slate-50 relative min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
