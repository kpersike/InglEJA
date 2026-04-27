import React from "react";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="main-navbar">
      <div className="nav-logo">
        <div className="logo-dot"></div>
        <span className="logo-name">InglEJA</span>
      </div>

      <div className="status-gamificacao">
        <div className="status-item idioma" title="Inglês">
          <span className="material-symbols-outlined icone-idioma">
            language
          </span>
        </div>

        <div className="status-item ofensiva" title="Ofensiva">
          <span className="material-symbols-outlined icone-fogo">
            local_fire_department
          </span>
          <span className="valor">5</span>
        </div>

        <div className="status-item xp" title="Experiência Total">
          <span className="material-symbols-outlined icone-estrela">stars</span>
          <span className="valor">420</span>
        </div>

        <div className="status-item perfil">
          <div className="avatar-circulo">F</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
