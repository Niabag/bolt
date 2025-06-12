import { getSubscriptionStatus, SUBSCRIPTION_STATUS } from '../services/subscription';

// Middleware pour vérifier si l'utilisateur a un abonnement valide
export const checkImportAccess = async () => {
  try {
    const status = await getSubscriptionStatus();
    
    // L'utilisateur a accès s'il a un abonnement actif ou est en période d'essai
    return status.status === SUBSCRIPTION_STATUS.ACTIVE || 
           status.status === SUBSCRIPTION_STATUS.TRIAL;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'accès à l'import:", error);
    return false;
  }
};

export default {
  checkImportAccess
};