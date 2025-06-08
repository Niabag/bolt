import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./home.scss";

const Home = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const features = [
    {
      icon: "👥",
      title: "Gestion des Prospects",
      description: "Centralisez tous vos prospects avec un système de suivi avancé et des statuts personnalisables."
    },
    {
      icon: "📄",
      title: "Devis Professionnels",
      description: "Créez des devis élégants avec calculs automatiques et export PDF professionnel."
    },
    {
      icon: "💼",
      title: "Cartes de Visite Numériques",
      description: "Générez des QR codes personnalisés pour capturer automatiquement vos prospects."
    },
    {
      icon: "📊",
      title: "Analytics Avancés",
      description: "Suivez vos performances avec des tableaux de bord détaillés et des métriques clés."
    },
    {
      icon: "🔔",
      title: "Notifications Intelligentes",
      description: "Restez informé des opportunités importantes avec des alertes personnalisées."
    },
    {
      icon: "⚙️",
      title: "Paramètres Flexibles",
      description: "Personnalisez votre expérience avec des options de configuration avancées."
    }
  ];

  const testimonials = [
    {
      name: "Sophie Martin",
      company: "Agence Créative",
      text: "CRM Pro a révolutionné ma gestion client. Je gagne 3h par jour !",
      avatar: "S"
    },
    {
      name: "Pierre Dubois",
      company: "Consultant IT",
      text: "Les devis automatiques et le suivi prospect sont parfaits.",
      avatar: "P"
    },
    {
      name: "Marie Leroy",
      company: "Studio Design",
      text: "Interface intuitive et fonctionnalités complètes. Excellent !",
      avatar: "M"
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Gérez vos <span className="gradient-text">prospects</span> et 
              <span className="gradient-text"> devis</span> comme un pro
            </h1>
            <p className="hero-subtitle">
              La solution CRM complète pour les entrepreneurs et freelances. 
              Capturez, suivez et convertissez vos prospects en clients avec des outils modernes.
            </p>
            <div className="hero-actions">
              {isLoggedIn ? (
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="btn-primary"
                >
                  📊 Accéder au Dashboard
                </button>
              ) : (
                <>
                  <Link to="/register-user" className="btn-primary">
                    🚀 Commencer gratuitement
                  </Link>
                  <Link to="/login" className="btn-secondary">
                    🔐 Se connecter
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="preview-title">CRM Pro Dashboard</span>
              </div>
              <div className="preview-content">
                <div className="preview-stats">
                  <div className="stat-card">
                    <span className="stat-number">127</span>
                    <span className="stat-label">Prospects</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">€45K</span>
                    <span className="stat-label">CA Réalisé</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">89%</span>
                    <span className="stat-label">Taux Conversion</span>
                  </div>
                </div>
                <div className="preview-chart">
                  <div className="chart-bars">
                    <div className="bar" style={{height: '60%'}}></div>
                    <div className="bar" style={{height: '80%'}}></div>
                    <div className="bar" style={{height: '45%'}}></div>
                    <div className="bar" style={{height: '90%'}}></div>
                    <div className="bar" style={{height: '70%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Tout ce dont vous avez besoin</h2>
            <p>Des outils puissants pour développer votre business</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>Comment ça marche ?</h2>
            <p>Trois étapes simples pour transformer votre gestion client</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>📱 Capturez</h3>
                <p>Générez votre QR code personnalisé et laissez vos prospects s'inscrire automatiquement</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>📊 Suivez</h3>
                <p>Organisez vos prospects avec des statuts, notes et un suivi personnalisé</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>💰 Convertissez</h3>
                <p>Créez des devis professionnels et suivez vos performances en temps réel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>Ils nous font confiance</h2>
            <p>Découvrez ce que nos utilisateurs pensent de CRM Pro</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  <p>"{testimonial.text}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <span>{testimonial.company}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Prêt à booster votre business ?</h2>
            <p>Rejoignez des milliers d'entrepreneurs qui utilisent déjà CRM Pro</p>
            <div className="cta-actions">
              {isLoggedIn ? (
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="btn-primary large"
                >
                  📊 Accéder au Dashboard
                </button>
              ) : (
                <Link to="/register-user" className="btn-primary large">
                  🚀 Commencer maintenant
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;