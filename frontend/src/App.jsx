import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar/Navbar';
import Auth from "./pages/Auth/Auth.jsx";
import Welcome from "./pages/Welcome/Welcome";
import Dashboard from "./pages/Dashboard/dashboard.jsx";
import Exercicio from "./components/Exercicio/Exercicio.jsx";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container"> {/* Adicione essa div */}
        <Navbar />
        <main className="main-content"> {/* Adicione essa main */}
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/welcome" element={<Welcome />} /> 
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/exercicio/:slug" element={<Exercicio />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
