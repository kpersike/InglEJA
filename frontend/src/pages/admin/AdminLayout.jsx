import React from "react";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Aqui entrará a Sidebar Branca do seu wireframe */}
      <aside className="w-64 bg-white border-r">
        <div className="p-4 font-bold text-blue-600">InglEJA ADMIN</div>
        <nav className="p-4">Menu lateral aqui...</nav>
      </aside>

      {/* A tag Outlet renderiza as telas filhas (ex: AdminLicoes) aqui dentro */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
