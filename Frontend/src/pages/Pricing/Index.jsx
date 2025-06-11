import './pricing.scss';
import { useState } from 'react';

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // 'monthly' ou 'annual'

  const plans = {
    monthly: {
      price: 30,
      period: 'mois',
      savings: null,
      billingLabel: 'Facturation mensuelle'
    },
    annual: {
      price: 100,
      period: 'an',
      savings: '16%',
      billingLabel: 'Facturation annuelle'
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Tarification Simple et Transparente</h1>
        <p>Choisissez le plan qui correspond à vos besoins</p>
      </div>

      <div className="plan-toggle">
        <button 
          className={`toggle-btn ${selectedPlan === 'monthly' ? 'active' : ''}`}
          onClick={() => setSelectedPlan('monthly')}
        >
          Mensuel
        </button>
        <button 
          className={`toggle-btn ${selectedPlan === 'annual' ? 'active' : ''}`}
          onClick={() => setSelectedPlan('annual')}
        >
          Annuel <span className="savings-badge">Économisez {plans.annual.savings}</span>
        </button>
      </div>

      <div className="pricing-container">
        <div className="pricing-card">
          <div className="pricing-badge">Offre Complète</div>
          <h2 className="pricing-title">Abonnement Pro</h2>
          <div className="pricing-price">
            <span className="price-amount">{plans[selectedPlan].price}€</span>
            <span className="price-period">/{plans[selectedPlan].period}</span>
          </div>
          <p className="pricing-billing">{plans[selectedPlan].billingLabel}</p>
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
            Vous avez le choix entre une facturation mensuelle à 30€ par mois ou annuelle à 100€ par an.
            Vous pouvez annuler à tout moment sans engagement ni frais supplémentaires.
          </p>
        </div>
        
        <div className="faq-item">
          <h3>Puis-je changer de plan à tout moment ?</h3>
          <p>
            Oui, vous pouvez passer du plan mensuel au plan annuel (ou inversement) à tout moment
            depuis les paramètres de votre compte.
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
              <p>"CRM Pro a transformé ma gestion client. L'abonnement annuel est un excellent investissement qui m'a permis de développer mon activité."</p>
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
};

export default Pricing;