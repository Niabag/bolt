// Configuration centralisée de l'API
const API_CONFIG = {
  // Use relative path by default so Vite's proxy works in development
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  TIMEOUT: 10000, // 10 secondes
};

// URLs des endpoints
export const API_ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: `${API_CONFIG.BASE_URL}/users/login`,
    REGISTER: `${API_CONFIG.BASE_URL}/users/register`,
    ME: `${API_CONFIG.BASE_URL}/users/me`,
    UPDATE_PROFILE: `${API_CONFIG.BASE_URL}/users/profile`,
    CHANGE_PASSWORD: `${API_CONFIG.BASE_URL}/users/password`,
  },
  
  // Clients
  CLIENTS: {
    BASE: `${API_CONFIG.BASE_URL}/clients`,
    REGISTER: (userId) => `${API_CONFIG.BASE_URL}/clients/register/${userId}`,
    DELETE: (clientId) => `${API_CONFIG.BASE_URL}/clients/${clientId}`,
    UPDATE: (clientId) => `${API_CONFIG.BASE_URL}/clients/${clientId}`,
    UPDATE_STATUS: (clientId) => `${API_CONFIG.BASE_URL}/clients/${clientId}/status`,
  },
  
  // Devis
  DEVIS: {
    BASE: `${API_CONFIG.BASE_URL}/devis`,
    BY_CLIENT: (clientId) => `${API_CONFIG.BASE_URL}/devis/client/${clientId}`,
    BY_ID: (devisId) => `${API_CONFIG.BASE_URL}/devis/${devisId}`,
    UPDATE: (devisId) => `${API_CONFIG.BASE_URL}/devis/${devisId}`,
    UPDATE_STATUS: (devisId) => `${API_CONFIG.BASE_URL}/devis/${devisId}/status`,
    DELETE: (devisId) => `${API_CONFIG.BASE_URL}/devis/${devisId}`,
  },

  // ✅ NOUVEAU: Cartes de visite
  BUSINESS_CARDS: {
    BASE: `${API_CONFIG.BASE_URL}/business-cards`,
    CONFIG: `${API_CONFIG.BASE_URL}/business-cards/config`,
    TRACK_VIEW: (userId) => `${API_CONFIG.BASE_URL}/business-cards/track-view/${userId}`,
    STATS: (userId) => `${API_CONFIG.BASE_URL}/business-cards/stats/${userId}`,
  },
};

// URLs frontend
export const FRONTEND_ROUTES = {
  CLIENT_REGISTER: (userId) => `${API_CONFIG.FRONTEND_URL}/register-client/${userId}`,
  DASHBOARD: `${API_CONFIG.FRONTEND_URL}/dashboard`,
  LOGIN: `${API_CONFIG.FRONTEND_URL}/login`,
};

// Fonction utilitaire pour créer les headers d'authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Fonction utilitaire pour les requêtes API
export const apiRequest = async (url, options = {}) => {
  const config = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ API Error ${response.status}:`, errorData);
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Success:`, data);
    return data;
  } catch (error) {
    console.error('❌ Erreur API:', error);
    throw error;
  }
};

