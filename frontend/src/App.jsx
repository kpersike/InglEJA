import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth/Auth.jsx";
import Welcome from "./pages/Welcome/Welcome";
import Dashboard from "./pages/Dashboard/dashboard.jsx";
import Exercicio from "./components/Exercicio/Exercicio.jsx";
import Perfil from "./pages/Perfil/Perfil.jsx";

// Importações do Admin (Note o 'admin' em minúsculo na pasta se for assim que você criou)
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminLicoes from "./pages/admin/AdminLicoes.jsx";

import "./App.css";

function App() {
  useEffect(() => {
    const configSalvas = localStorage.getItem("configuracoes_ingleja");
    if (configSalvas) {
      try {
        const parsed = JSON.parse(configSalvas);
        if (parsed.modoEscuro) {
          document.documentElement.classList.add("dark");
        }
        if (parsed.temaPrincipal) {
          document.documentElement.classList.add(parsed.temaPrincipal);
        }
      } catch (e) {}
    }
  }, []);

  return (
    <Router>
      <div className="app-container">
        <main className="main-content">
          <Routes>
            {/* Rota normal do aluno */}
            <Route path="/" element={<Auth />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/exercicio/:slug" element={<Exercicio />} />

            {/* Rotas do Admin */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/licoes" element={<AdminLicoes />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
