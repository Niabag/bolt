import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./navbar.scss";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  // Fermer le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await apiRequest(API_ENDPOINTS.AUTH.ME);
      setUser(userData);
    } catch (error) {
      console.error("Erreur lors du chargement de l'utilisateur:", error);
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Masquer la navbar sur la page dashboard et sur les pages de scan QR code
  if (location.pathname === "/dashboard" || location.pathname.startsWith("/register-client/")) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link" onClick={closeMenu}>
            <span className="brand-icon">💼</span>
            <span className="brand-text">CRM Pro</span>
          </Link>
        </div>

        {/* Menu burger pour mobile */}
        <button 
          className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          {!token ? (
            <>
              <Link to="/\" className="nav-link\" onClick={closeMenu}>
                🏠 Accueil
              </Link>
              <Link to="/pricing" className="nav-link" onClick={closeMenu}>
                💰 Tarifs
              </Link>
              <Link to="/about" className="nav-link" onClick={closeMenu}>
                ℹ️ À propos
              </Link>
              <Link to="/contact" className="nav-link" onClick={closeMenu}>
                📞 Contact
              </Link>
              <Link to="/register-user" className="nav-link register-btn" onClick={closeMenu}>
                ✨ Créer un compte
              </Link>
              <Link to="/login" className="nav-link login-btn" onClick={closeMenu}>
                🔐 Se connecter
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link" onClick={closeMenu}>
                🏠 Accueil
              </Link>
              <Link to="/features" className="nav-link" onClick={closeMenu}>
                ⭐ Fonctionnalités
              </Link>
              <Link to="/pricing" className="nav-link" onClick={closeMenu}>
                💰 Tarifs
              </Link>
              <Link to="/about" className="nav-link" onClick={closeMenu}>
                ℹ️ À propos
              </Link>
              <Link to="/contact" className="nav-link" onClick={closeMenu}>
                📞 Contact
              </Link>
              <Link to="/dashboard" className="nav-link dashboard-btn" onClick={closeMenu}>
                📊 Dashboard
              </Link>
              
              {/* Profil utilisateur */}
              <div className="user-profile" onClick={toggleUserMenu} ref={userMenuRef}>
                <div className="user-avatar">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profil" />
                  ) : (
                    user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.name || "Utilisateur"}</span>
                  <span className="user-email">{user?.email || ""}</span>
                </div>

                {/* Menu utilisateur */}
                <div
                  className={`user-menu ${isUserMenuOpen ? 'active' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="user-menu-header">
                    <div className="menu-avatar">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="Profil" />
                      ) : (
                        user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <h3 className="menu-user-name">{user?.name || "Utilisateur"}</h3>
                    <p className="menu-user-email">{user?.email || ""}</p>
                  </div>
                  
                  <div className="user-menu-items">
                    <Link to="/dashboard" className="menu-item" onClick={() => {
                      setIsUserMenuOpen(false);
                      closeMenu();
                    }}>
                      <span className="menu-item-icon">📊</span>
                      <span>Tableau de bord</span>
                    </Link>
                    <Link to="/dashboard#settings" className="menu-item" onClick={() => {
                      setIsUserMenuOpen(false);
                      closeMenu();
                    }}>
                      <span className="menu-item-icon">⚙️</span>
                      <span>Paramètres</span>
                    </Link>
                    <Link to="/dashboard#carte" className="menu-item" onClick={() => {
                      setIsUserMenuOpen(false);
                      closeMenu();
                    }}>
                      <span className="menu-item-icon">💼</span>
                      <span>Ma carte de visite</span>
                    </Link>
                    <div className="menu-divider"></div>
                    <button onClick={() => { handleLogout(); closeMenu(); }} className="menu-logout">
                      <span className="menu-item-icon">🚪</span>
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Overlay pour fermer le menu mobile */}
        {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
      </div>
    </nav>
  );
};

export default Navbar;