import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="main-navbar">
      <div className="nav-logo">
        <div className="logo-dot"></div>
        <span className="logo-name">InglEJA</span>
      </div>
    </nav>
  );
};

export default Navbar;