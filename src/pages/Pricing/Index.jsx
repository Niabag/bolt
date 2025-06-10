import './pricing.scss';
import { SUBSCRIPTION_PRICE } from '../../services/subscription';

const Pricing = () => (
  <div className="pricing-page">
    <div className="pricing-header">
      <h1>Tarification Simple et Transparente</h1>
      <p>Une seule offre complète pour tous vos besoins de gestion client</p>
    </div>

    <div className="pricing-container">
      <div className="pricing-card">
        <div className="pricing-badge">Offre Unique</div>
        <h2 className="pricing-title">Abonnement Pro</h2>
        <div className="pricing-price">
          <span className="price-amount">{SUBSCRIPTION_PRICE}€</span>
          <span className="price-period">/mois</span>
        </div>
        <p className="pricing-description">
          Accès complet à toutes les fonctionnalités pour développer votre activité
        </p>
        <ul className="pricing-features">
          <li>✅ Nombre illimité de prospects</li>
          <li>✅ Création illimitée de devis professionnels</li>
          <li>✅ Génération de factures</li>
          <li>✅ Carte de visite numérique avec QR code</li>
          <li>✅ Tableaux de bord et analytics</li>
          <li>✅ Notifications intelligentes</li>
          <li>✅ Export PDF et partage</li>
          <li>✅ Support prioritaire</li>
          <li>✅ Mises à jour régulières</li>
        </ul>
        <a href="/register-user" className="pricing-cta">
          Commencer maintenant
        </a>
        <p className="pricing-guarantee">Satisfait ou remboursé pendant 30 jours</p>
      </div>
    </div>

    <div className="pricing-faq">
      <h2>Questions fréquentes</h2>
      
      <div className="faq-item">
        <h3>Existe-t-il une version gratuite ?</h3>
        <p>
          Nous proposons une période d'essai gratuite de 14 jours avec toutes les fonctionnalités. 
          Aucune carte bancaire n'est requise pour l'essai.
        </p>
      </div>
      
      <div className="faq-item">
        <h3>Comment fonctionne la facturation ?</h3>
        <p>
          La facturation est mensuelle à {SUBSCRIPTION_PRICE}€ par mois. Vous pouvez annuler à tout moment
          sans engagement ni frais supplémentaires.
        </p>
      </div>
      
      <div className="faq-item">
        <h3>Puis-je exporter mes données ?</h3>
        <p>
          Oui, vous pouvez exporter toutes vos données (prospects, devis, factures) 
          à tout moment au format JSON ou CSV depuis les paramètres de votre compte.
        </p>
      </div>
      
      <div className="faq-item">
        <h3>Comment fonctionne le support client ?</h3>
        <p>
          Notre équipe de support est disponible par email et chat en direct du lundi au vendredi, 
          de 9h à 18h. Le temps de réponse moyen est inférieur à 4 heures.
        </p>
      </div>
    </div>

    <div className="pricing-testimonials">
      <h2>Ce que disent nos clients</h2>
      
      <div className="testimonials-grid">
        <div className="testimonial-card">
          <div className="testimonial-content">
            <p>{`"CRM Pro a transformé ma gestion client. Pour seulement ${SUBSCRIPTION_PRICE}€ par mois, j'ai tous les outils dont j'ai besoin pour développer mon activité."`}</p>
          </div>
          <div className="testimonial-author">
            <div className="author-avatar">M</div>
            <div className="author-info">
              <h4>Marie Dupont</h4>
              <span>Consultante indépendante</span>
            </div>
          </div>
        </div>
        
        <div className="testimonial-card">
          <div className="testimonial-content">
            <p>"Le rapport qualité-prix est imbattable. J'ai essayé d'autres CRM à 50€ par mois qui offraient moins de fonctionnalités."</p>
          </div>
          <div className="testimonial-author">
            <div className="author-avatar">T</div>
            <div className="author-info">
              <h4>Thomas Martin</h4>
              <span>Architecte d'intérieur</span>
            </div>
          </div>
        </div>
        
        <div className="testimonial-card">
          <div className="testimonial-content">
            <p>"La carte de visite numérique avec QR code a considérablement augmenté mes conversions. Un investissement rentabilisé dès le premier mois."</p>
          </div>
          <div className="testimonial-author">
            <div className="author-avatar">S</div>
            <div className="author-info">
              <h4>Sophie Legrand</h4>
              <span>Coach professionnelle</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="pricing-cta-section">
      <h2>Prêt à développer votre activité ?</h2>
      <p>Rejoignez des milliers d'entrepreneurs qui utilisent CRM Pro</p>
      <a href="/register-user" className="pricing-cta-button">
        Commencer votre essai gratuit
      </a>
      <p className="pricing-no-cc">Aucune carte bancaire requise</p>
    </div>
  </div>
);

export default Pricing;