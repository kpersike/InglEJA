import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./Auth.jsx";
import Dashboard from "./Dashboard.jsx";
import Exercicio from "./Exercicio.jsx";
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
