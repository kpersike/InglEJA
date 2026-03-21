import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth/Auth.jsx";
import Dashboard from "./pages/Dashboard/dashboard.jsx";
import Exercicio from "./components/Exercicio/Exercicio.jsx";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/exercicio" element={<Exercicio />} />
      </Routes>
    </Router>
  );
}

export default App;
