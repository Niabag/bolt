import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSubscriptionStatus, createCheckoutSession, startFreeTrial, SUBSCRIPTION_STATUS, DEFAULT_TRIAL_DAYS, SUBSCRIPTION_PRICE } from '../../services/subscription';
import Navbar from '../Navbar';
import './SubscriptionRequired.scss';

const SubscriptionRequired = () => {
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [processingTrial, setProcessingTrial] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const status = await getSubscriptionStatus();
        setSubscriptionStatus(status);
      } catch (error) {
        console.error("Error fetching subscription status:", error);
        setError("Impossible de récupérer les informations d'abonnement");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, []);

  const handleStartTrial = async () => {
    setProcessingTrial(true);
    setError('');
    
    try {
      await startFreeTrial(DEFAULT_TRIAL_DAYS);
      // Refresh status after starting trial
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
      
      if (status.status === SUBSCRIPTION_STATUS.TRIAL) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Error starting free trial:", error);
      setError("Impossible de démarrer votre période d'essai. Veuillez réessayer.");
    } finally {
      setProcessingTrial(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessingCheckout(true);
    setError('');
    
    try {
      // Price ID for the monthly subscription plan
      const priceId = 'price_1OqXYZHGJMCmVBnT8YgYbL3M';
      
      const { url } = await createCheckoutSession(priceId);
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError("Impossible de créer la session de paiement. Veuillez réessayer.");
      setProcessingCheckout(false);
    }
  };

  const getStatusMessage = () => {
    if (!subscriptionStatus) return null;
    
    switch (subscriptionStatus.status) {
      case SUBSCRIPTION_STATUS.EXPIRED:
        return "Votre période d'essai est expirée";
      case SUBSCRIPTION_STATUS.CANCELED:
        return "Votre abonnement a été annulé";
      case SUBSCRIPTION_STATUS.PAST_DUE:
        return "Votre paiement est en retard";
      default:
        return null;
    }
  };

  const canStartTrial = subscriptionStatus && 
                        !subscriptionStatus.hasHadTrial && 
                        subscriptionStatus.status !== SUBSCRIPTION_STATUS.TRIAL && 
                        subscriptionStatus.status !== SUBSCRIPTION_STATUS.ACTIVE;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="subscription-required-page">
          <div className="subscription-container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Chargement des informations d'abonnement...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="subscription-required-page">
        <div className="subscription-container">
          <div className="subscription-header">
            <h1>Abonnement requis</h1>
            <p>Pour accéder à toutes les fonctionnalités de CRM Pro</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="status-message">
            {getStatusMessage()}
          </div>

          <div className="subscription-options">
            <div className="subscription-card">
              <div className="subscription-badge">Offre Unique</div>
              <h2 className="subscription-title">Abonnement Pro</h2>
              <div className="subscription-price">
                <span className="price-amount">{SUBSCRIPTION_PRICE}€</span>
                <span className="price-period">/mois</span>
              </div>
              <p className="subscription-description">
                Accès complet à toutes les fonctionnalités pour développer votre activité
              </p>
              <ul className="subscription-features">
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
              <button 
                className="subscription-cta"
                onClick={handleSubscribe}
                disabled={processingCheckout}
              >
                {processingCheckout ? 'Redirection...' : 'S\'abonner maintenant'}
              </button>
              <p className="subscription-guarantee">Satisfait ou remboursé pendant 30 jours</p>
            </div>

            {canStartTrial && (
              <div className="trial-card">
                <div className="trial-icon">🎁</div>
                <h2>Essai gratuit de {DEFAULT_TRIAL_DAYS} jours</h2>
                <p>Essayez toutes les fonctionnalités sans engagement</p>
                <button 
                  className="trial-button"
                  onClick={handleStartTrial}
                  disabled={processingTrial}
                >
                  {processingTrial ? 'Activation...' : 'Commencer l\'essai gratuit'}
                </button>
                <p className="trial-note">Aucune carte bancaire requise</p>
              </div>
            )}
          </div>

          <div className="subscription-footer">
            <p>
              Vous avez des questions ? <Link to="/contact">Contactez notre équipe</Link>
            </p>
            <button 
              className="back-button"
              onClick={() => navigate('/')}
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionRequired;