import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./login.scss";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for success message from registration
  const successMessage = location.state?.message || "";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur quand l'utilisateur tape
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError("L'email est requis");
      return false;
    }
    if (!formData.email.includes("@")) {
      setError("Veuillez entrer un email valide");
      return false;
    }
    if (!formData.password) {
      setError("Le mot de passe est requis");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        }),
      });

      // Stocker les données d'authentification
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      console.log("✅ Connexion réussie");
      
      // Redirection vers le dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Erreur de connexion:", err);
      setError(err.message || "Erreur de connexion. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Section gauche - Illustration */}
        <div className="auth-visual">
          <div className="visual-content">
            <div className="visual-icon">🔐</div>
            <h2>Bon retour !</h2>
            <p>Connectez-vous à votre compte CRM Pro pour gérer vos prospects et développer votre business.</p>
            <div className="visual-features">
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <span>Gestion des prospects</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📄</span>
                <span>Devis professionnels</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Analytics avancés</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaire */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            <div className="auth-header">
              <h1>Connexion</h1>
              <p>Accédez à votre espace CRM Pro</p>
            </div>

            {successMessage && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                {successMessage}
              </div>
            )}

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <span className="label-icon">📧</span>
                  Adresse email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <span className="label-icon">🔒</span>
                  Mot de passe
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Votre mot de passe"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? "👁" : "🙈"}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span className="checkbox-custom"></span>
                  Se souvenir de moi
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    Se connecter
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Pas encore de compte ?{" "}
                <Link to="/register-user" className="auth-link">
                  Créer un compte gratuitement
                </Link>
              </p>
            </div>

            <div className="auth-divider">
              <span>ou</span>
            </div>

            <div className="demo-section">
              <p className="demo-text">Découvrir CRM Pro</p>
              <Link to="/" className="demo-btn">
                <span className="demo-icon">🎯</span>
                Voir la démo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;