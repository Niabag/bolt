import { Link } from 'react-router-dom';
import './Footer.scss';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Section principale */}
        <div className="footer-main">
          <div className="footer-brand">
            <div className="brand-logo">
              <span className="brand-icon">💼</span>
              <span className="brand-name">CRM Pro</span>
            </div>
            <p className="brand-description">
              La solution CRM complète pour les entrepreneurs et freelances. 
              Gérez vos prospects, créez des devis professionnels et développez votre business.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" title="LinkedIn">
                <span>💼</span>
              </a>
              <a href="#" className="social-link" title="Twitter">
                <span>🐦</span>
              </a>
              <a href="#" className="social-link" title="Facebook">
                <span>📘</span>
              </a>
              <a href="#" className="social-link" title="Instagram">
                <span>📷</span>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Produit</h4>
              <ul>
                <li><Link to="/features">Fonctionnalités</Link></li>
                <li><Link to="/pricing">Tarifs</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Ressources</h4>
              <ul>
                <li><Link to="/tutorials">Tutoriels</Link></li>
                <li><Link to="/api-docs">Documentation API</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Entreprise</h4>
              <ul>
                <li><Link to="/about">À propos</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Légal</h4>
              <ul>
                <li><Link to="/privacy">Confidentialité</Link></li>
                <li><Link to="/terms">Conditions d'utilisation</Link></li>
                <li><Link to="/cookies">Politique des cookies</Link></li>
                <li><Link to="/gdpr">RGPD</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section newsletter */}
        <div className="footer-newsletter">
          <div className="newsletter-content">
            <h4>Restez informé</h4>
            <p>Recevez nos dernières actualités et conseils pour développer votre business</p>
          </div>
          <div className="newsletter-form">
            <input 
              type="email" 
              placeholder="Votre adresse email"
              className="newsletter-input"
            />
            <button className="newsletter-btn">
              S'abonner
            </button>
          </div>
        </div>

        {/* Section copyright */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; {currentYear} CRM Pro. Tous droits réservés.</p>
          </div>
          <div className="footer-meta">
            <span className="version">Version 1.0.0</span>
            <span className="status">
              <span className="status-dot"></span>
              Tous les systèmes opérationnels
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
