import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./registerUser.scss";

const RegisterUser = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();

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
    if (!formData.name.trim()) {
      setError("Le nom est requis");
      return false;
    }
    if (formData.name.trim().length < 2) {
      setError("Le nom doit contenir au moins 2 caractères");
      return false;
    }
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
    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return false;
    }
    if (!acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation");
      return false;
    }
    return true;
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: "", color: "#e5e7eb" };
    if (password.length < 6) return { strength: 1, label: "Faible", color: "#ef4444" };
    if (password.length < 8) return { strength: 2, label: "Moyen", color: "#f59e0b" };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 4, label: "Très fort", color: "#10b981" };
    }
    return { strength: 3, label: "Fort", color: "#3b82f6" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setError("");
    setLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.AUTH.REGISTER, {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password
        }),
      });

      console.log("✅ Inscription réussie");
      
      // Redirection vers la page de connexion avec message de succès
      navigate("/login", { 
        state: { 
          message: "Compte créé avec succès ! Vous pouvez maintenant vous connecter." 
        }
      });
    } catch (err) {
      console.error("❌ Erreur d'inscription:", err);
      setError(err.message || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page register-page">
      <div className="auth-container">
        {/* Section gauche - Illustration */}
        <div className="auth-visual">
          <div className="visual-content">
            <div className="visual-icon">✨</div>
            <h2>Rejoignez CRM Pro</h2>
            <p>Créez votre compte gratuitement et commencez à développer votre business dès aujourd'hui.</p>
            <div className="visual-features">
              <div className="feature-item">
                <span className="feature-icon">🚀</span>
                <span>Configuration en 2 minutes</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💼</span>
                <span>Outils professionnels</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📈</span>
                <span>Croissance garantie</span>
              </div>
            </div>
            <div className="testimonial">
              <p>"CRM Pro a transformé ma façon de gérer mes clients. Indispensable !"</p>
              <div className="testimonial-author">
                <div className="author-avatar">M</div>
                <div>
                  <strong>Marie Dubois</strong>
                  <span>Consultante</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaire */}
        <div className="auth-form-section">
          <div className="auth-form-container">
            <div className="auth-header">
              <h1>Créer un compte</h1>
              <p>Commencez votre essai gratuit dès maintenant</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  <span className="label-icon">👤</span>
                  Nom complet
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Votre nom et prénom"
                  required
                  autoComplete="name"
                />
              </div>

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
                    placeholder="Minimum 6 caractères"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill"
                        style={{ 
                          width: `${(passwordStrength.strength / 4) * 100}%`,
                          backgroundColor: passwordStrength.color
                        }}
                      ></div>
                    </div>
                    <span 
                      className="strength-label"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  <span className="label-icon">🔐</span>
                  Confirmer le mot de passe
                </label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Répétez votre mot de passe"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <div className="password-mismatch">
                    ⚠️ Les mots de passe ne correspondent pas
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  J'accepte les{" "}
                  <Link to="/terms" className="terms-link" target="_blank">
                    conditions d'utilisation
                  </Link>
                  {" "}et la{" "}
                  <Link to="/privacy" className="terms-link" target="_blank">
                    politique de confidentialité
                  </Link>
                </label>
              </div>

              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={loading || !acceptTerms}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    Créer mon compte gratuitement
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Déjà un compte ?{" "}
                <Link to="/login" className="auth-link">
                  Se connecter
                </Link>
              </p>
            </div>

            <div className="security-info">
              <div className="security-item">
                <span className="security-icon">🔒</span>
                <span>Données sécurisées</span>
              </div>
              <div className="security-item">
                <span className="security-icon">🚫</span>
                <span>Aucun spam</span>
              </div>
              <div className="security-item">
                <span className="security-icon">✨</span>
                <span>Gratuit à vie</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterUser;