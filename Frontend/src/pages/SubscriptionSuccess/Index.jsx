import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubscriptionStatus, SUBSCRIPTION_STATUS } from '../../services/subscription';
import './SubscriptionSuccess.scss';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const status = await getSubscriptionStatus();
        setSubscription(status);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, navigate]);

  if (loading) {
    return (
      <div className="subscription-success-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Vérification de votre abonnement...</p>
        </div>
      </div>
    );
  }

  const isActive = subscription?.status === SUBSCRIPTION_STATUS.ACTIVE;

  return (
    <div className="subscription-success-page">
      <div className="success-container">
        <div className="success-icon">
          {isActive ? '✅' : '⚠️'}
        </div>
        <h1>{isActive ? 'Abonnement activé avec succès !' : 'Paiement en cours de traitement'}</h1>
        <p>
          {isActive 
            ? 'Votre abonnement a été activé avec succès. Vous avez maintenant accès à toutes les fonctionnalités de CRM Pro.'
            : 'Votre paiement est en cours de traitement. Vous recevrez une confirmation par email dès que votre abonnement sera activé.'}
        </p>
        <div className="redirect-message">
          Redirection vers le dashboard dans {countdown} seconde{countdown !== 1 ? 's' : ''}...
        </div>
        <button 
          className="dashboard-button"
          onClick={() => navigate('/dashboard')}
        >
          Accéder au dashboard maintenant
        </button>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;