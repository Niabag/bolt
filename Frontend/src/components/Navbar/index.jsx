import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./navbar.scss";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

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

  // Masquer la navbar sur la page dashboard (elle a sa propre navigation)
  if (location.pathname === "/dashboard") {
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
              <Link to="/" className="nav-link" onClick={closeMenu}>
                🏠 Accueil
              </Link>
              <Link to="/register-user" className="nav-link" onClick={closeMenu}>
                ✨ Créer un compte
              </Link>
              <Link to="/login" className="nav-link login-btn" onClick={closeMenu}>
                🔐 Se connecter
              </Link>
            </>
          ) : (
            <div className="user-menu">
              <Link to="/" className="nav-link" onClick={closeMenu}>
                🏠 Accueil
              </Link>
              <Link to="/dashboard" className="nav-link dashboard-btn" onClick={closeMenu}>
                📊 Dashboard
              </Link>
              <div className="user-info">
                <div className="user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.name || "Utilisateur"}</span>
                  <span className="user-email">{user?.email || ""}</span>
                </div>
              </div>
              <button onClick={() => { handleLogout(); closeMenu(); }} className="logout-btn">
                🚪 Déconnexion
              </button>
            </div>
          )}
        </div>

        {/* Overlay pour fermer le menu mobile */}
        {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
      </div>
    </nav>
  );
};

export default Navbar;