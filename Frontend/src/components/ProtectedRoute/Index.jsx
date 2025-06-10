import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { checkAccess } from "../../services/subscription";
import SubscriptionRequired from "../SubscriptionRequired/Index";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!token) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      
      try {
        const access = await checkAccess();
        setHasAccess(access);
      } catch (error) {
        console.error("Error checking subscription access:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };
    
    verifyAccess();
  }, [token]);

  if (loading) {
    return (
      <div className="access-checking">
        <div className="loading-spinner">⏳</div>
        <p>Vérification de votre accès...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Si l'utilisateur a accès (abonnement actif ou période d'essai), afficher le contenu
  if (hasAccess) {
    return children;
  }

  // Sinon, rediriger vers la page d'abonnement
  return <SubscriptionRequired />;
};

export default ProtectedRoute;