import './pricing.scss';
import { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '../../services/subscription';

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // 'monthly', 'quarterly' ou 'annual'

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
          className={`toggle-btn ${selectedPlan === 'quarterly' ? 'active' : ''}`}
          onClick={() => setSelectedPlan('quarterly')}
        >
          Trimestriel <span className="savings-badge">Économisez {SUBSCRIPTION_PLANS.QUARTERLY.savings}</span>
        </button>
        <button 
          className={`toggle-btn ${selectedPlan === 'annual' ? 'active' : ''}`}
          onClick={() => setSelectedPlan('annual')}
        >
          Annuel <span className="savings-badge">Économisez {SUBSCRIPTION_PLANS.ANNUAL.savings}</span>
        </button>
      </div>

      <div className="pricing-plans">
        {/* Plan Mensuel */}
        {selectedPlan === 'monthly' && (
          <div className="pricing-card">
            <div className="pricing-badge">Flexibilité</div>
            <h2 className="pricing-title">{SUBSCRIPTION_PLANS.MONTHLY.name}</h2>
            <div className="pricing-price">
              <span className="price-amount">{SUBSCRIPTION_PLANS.MONTHLY.price}€</span>
              <span className="price-period">/{SUBSCRIPTION_PLANS.MONTHLY.period}</span>
            </div>
            <p className="pricing-description">
              Accès complet à toutes les fonctionnalités sans engagement
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
        )}

        {/* Plan Trimestriel */}
        {selectedPlan === 'quarterly' && (
          <div className="pricing-card highlight">
            <div className="pricing-badge">Populaire</div>
            <h2 className="pricing-title">{SUBSCRIPTION_PLANS.QUARTERLY.name}</h2>
            <div className="pricing-price">
              <span className="price-amount">{SUBSCRIPTION_PLANS.QUARTERLY.price}€</span>
              <span className="price-period">/{SUBSCRIPTION_PLANS.QUARTERLY.period}</span>
            </div>
            <p className="pricing-description">
              Économisez {SUBSCRIPTION_PLANS.QUARTERLY.savings} par rapport au plan mensuel
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
            <a href="/register-user" className="pricing-cta highlight">
              Choisir ce plan
            </a>
            <p className="pricing-guarantee">Satisfait ou remboursé pendant 30 jours</p>
          </div>
        )}

        {/* Plan Annuel */}
        {selectedPlan === 'annual' && (
          <div className="pricing-card">
            <div className="pricing-badge">Meilleure valeur</div>
            <h2 className="pricing-title">{SUBSCRIPTION_PLANS.ANNUAL.name}</h2>
            <div className="pricing-price">
              <span className="price-amount">{SUBSCRIPTION_PLANS.ANNUAL.price}€</span>
              <span className="price-period">/{SUBSCRIPTION_PLANS.ANNUAL.period}</span>
            </div>
            <p className="pricing-description">
              Économisez {SUBSCRIPTION_PLANS.ANNUAL.savings} par rapport au plan mensuel
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
              <li>✅ Accès prioritaire aux nouvelles fonctionnalités</li>
            </ul>
            <a href="/register-user" className="pricing-cta">
              Choisir ce plan
            </a>
            <p className="pricing-guarantee">Satisfait ou remboursé pendant 30 jours</p>
          </div>
        )}
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
            La facturation dépend du plan choisi : mensuelle à {SUBSCRIPTION_PLANS.MONTHLY.price}€/mois, trimestrielle à {SUBSCRIPTION_PLANS.QUARTERLY.price}€/3 mois, 
            ou annuelle à {SUBSCRIPTION_PLANS.ANNUAL.price}€/an. Vous pouvez annuler à tout moment sans frais supplémentaires.
          </p>
        </div>
        
        <div className="faq-item">
          <h3>Puis-je changer de plan ?</h3>
          <p>
            Oui, vous pouvez passer d'un plan à l'autre à tout moment. Si vous passez à un plan supérieur, 
            la différence sera calculée au prorata. Si vous passez à un plan inférieur, le changement prendra effet à la fin de votre période de facturation actuelle.
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
              <p>"J'ai choisi le plan annuel pour l'excellent rapport qualité-prix. L'investissement a été rentabilisé en moins de deux mois grâce aux nouveaux clients que j'ai pu convertir."</p>
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
              <p>"Le plan trimestriel est parfait pour mon activité saisonnière. Je peux facilement gérer mes prospects et créer des devis professionnels en quelques clics."</p>
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