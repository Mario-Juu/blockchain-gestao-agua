import React from 'react';
import { NavLink } from 'react-router-dom';

const Header = () => {
  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          {/* Logo com Link para Home */}
          <NavLink className="navbar-brand" to="/">
            Gestão da Qualidade da Água - Blockchain 
          </NavLink>

          {/* Botão Toggle para telas pequenas */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Links de navegação */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <NavLink 
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'active' : ''}`
                  } 
                  to="/"
                >
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink 
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'active' : ''}`
                  } 
                  to="/create-update"
                >
                  Criar/Atualizar Ativo
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
