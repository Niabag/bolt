import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Devis from "../../components/Dashboard/Devis/devisPage";
import DevisListPage from "../../components/Dashboard/Devis/devisListPage";
import ProspectsPage from "../../components/Dashboard/Prospects/prospectsPage";
import ProspectEditPage from "../../components/Dashboard/Prospects/prospectEditPage";
import ProspectCreatePage from "../../components/Dashboard/Prospects/prospectCreatePage";
import ClientBilling from "../../components/Dashboard/ClientBilling/clientBilling";
import Analytics from "../../components/Dashboard/Analytics/analytics";
import Settings from "../../components/Dashboard/Settings/settings";
import Notifications from "../../components/Dashboard/Notifications/notifications";
import BusinessCard from "../../components/Dashboard/BusinessCard/businessCard";
import Billing from "../../components/Dashboard/Billing/billing";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./dashboard.scss";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({});
  const [selectedClientForDevis, setSelectedClientForDevis] = useState(null);
  const [selectedClientForBilling, setSelectedClientForBilling] = useState(null);
  const [editingDevis, setEditingDevis] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const userMenuRef = useRef(null);
  const socketRef = useRef(null);

  // Fermer le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Extraire l'ID utilisateur du token JWT
  const decodeToken = (token) => {
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = atob(payloadBase64);
      return JSON.parse(payload);
    } catch (error) {
      console.error("Erreur lors du décodage du token:", error);
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = decodeToken(token);
      if (decodedToken && decodedToken.userId) {
        setUserId(decodedToken.userId);
      } else {
        console.error("❌ Impossible de décoder userId du token");
      }
    } else {
      console.error("❌ Aucun token trouvé");
    }
    
    fetchUserData();
    
    // Vérifier si un onglet est spécifié dans l'URL (hash)
    const hash = location.hash.replace('#', '');
    if (hash && ['dashboard', 'clients', 'devis', 'notifications', 'carte', 'settings'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location]);

  const fetchUserData = async () => {
    try {
      const userData = await apiRequest(API_ENDPOINTS.AUTH.ME);
      setUser(userData);
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(API_ENDPOINTS.CLIENTS.BASE);
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur lors de la récupération des clients:", err);
      setError("Erreur lors de la récupération des clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleViewClientDevis = (client) => {
    setSelectedClientForDevis(client);
    setActiveTab("devis-creation");
  };

  const handleViewClientBilling = (client) => {
    setSelectedClientForBilling(client);
    setActiveTab("client-billing");
  };

  const handleEditDevisFromList = (devis) => {
    setEditingDevis(devis);
    setActiveTab("devis-creation");
  };

  const handleCreateNewDevis = () => {
    setEditingDevis(null);
    setSelectedClientForDevis(null);
    // Redirect to prospects page to select a client before creating a quote
    setActiveTab("clients");
  };

  const handleCreateProspect = () => {
    setSelectedProspect(null);
    setActiveTab("prospect-create");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Mettre à jour le compteur de notifications non lues
  const updateUnreadNotifications = () => {
    const storedNotifications = localStorage.getItem('notificationsData');
    if (storedNotifications) {
      try {
        const notifications = JSON.parse(storedNotifications);
        const unreadCount = notifications.filter(n => !n.read).length;
        setUnreadNotifications(unreadCount);
      } catch (err) {
        console.error('Erreur lors du calcul des notifications non lues:', err);
      }
    }
  };

  // Mettre à jour le compteur au chargement
  useEffect(() => {
    updateUnreadNotifications();
  }, []);

  // Connexion en temps réel pour mettre à jour les notifications
  useEffect(() => {
    const connectSocket = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const decoded = decodeToken(token);
      if (!decoded || !decoded.userId) return;

      try {
        const { io } = await import('socket.io-client');
        const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        const socket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('authenticate', decoded.userId);
        });

        socket.on('notification', (notification) => {
          let stored = localStorage.getItem('notificationsData');
          let notifications = [];
          if (stored) {
            try { notifications = JSON.parse(stored); } catch (e) { notifications = []; }
          }
          const notifWithId = { ...notification, id: notification.id || `${notification.type}_${notification.category}_${Date.now()}` };
          notifications = [notifWithId, ...notifications];
          localStorage.setItem('notificationsData', JSON.stringify(notifications));
          const unreadCount = notifications.filter(n => !n.read).length;
          setUnreadNotifications(unreadCount);
        });
      } catch (err) {
        console.error('Erreur lors de la connexion au socket:', err);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Gérer l'édition d'un prospect
  const handleEditProspect = (prospect) => {
    setSelectedProspect(prospect);
    setActiveTab("prospect-edit");
  };

  // Définition des sections de navigation
  const navSections = [
    {
      title: "Principal",
      items: [
        { id: "dashboard", icon: "📊", label: "Tableau de bord" },
        { id: "clients", icon: "👥", label: "Prospects" },
        { id: "devis", icon: "📄", label: "Devis et Facturation" },
      ]
    },
    {
      title: "Outils",
      items: [
        { id: "notifications", icon: "🔔", label: "Notifications", badge: unreadNotifications },
        { id: "carte", icon: "💼", label: "Carte de visite" },
      ]
    },
    {
      title: "Compte",
      items: [
        { id: "settings", icon: "⚙️", label: "Paramètres" },
      ]
    }
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard": return "Tableau de bord";
      case "clients": return "Mes Prospects";
      case "devis": return "Devis et Facturation";
      case "devis-creation": return "Création de Devis";
      case "client-billing": return `Facturation - ${selectedClientForBilling?.name || 'Client'}`;
      case "notifications": return "Notifications";
      case "carte": return "Carte de Visite";
      case "settings": return "Paramètres";
      case "prospect-edit": return "Modification Prospect";
      case "prospect-create": return "Nouveau Prospect";
      default: return "CRM Pro";
    }
  };

  const getPageIcon = () => {
    switch (activeTab) {
      case "dashboard": return "📊";
      case "clients": return "👥";
      case "devis": return "📄";
      case "devis-creation": return "📝";
      case "client-billing": return "💰";
      case "notifications": return "🔔";
      case "carte": return "💼";
      case "settings": return "⚙️";
      case "prospect-edit": return "✏️";
      case "prospect-create": return "➕";
      default: return "📊";
    }
  };

  return (
    <div className="dashboard-layout">
      
      {/* ✅ SIDEBAR MODERNE */}
      <aside className={`dashboard-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo">CRM</div>
            <div className="brand-text">CRM Pro</div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="nav-section">
              <div className="nav-section-title">{section.title}</div>
              
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${
                    activeTab === item.id || 
                    (activeTab === "devis-creation" && item.id === "devis") ||
                    (activeTab === "prospect-edit" && item.id === "clients") ||
                    (activeTab === "prospect-create" && item.id === "clients") ||
                    (activeTab === "client-billing" && item.id === "devis")
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setActiveTab(item.id);
                    // Mettre à jour le hash de l'URL
                    window.location.hash = item.id;
                    if (item.id !== "devis" && item.id !== "devis-creation") {
                      setSelectedClientForDevis(null);
                      setEditingDevis(null);
                    }
                    if (item.id !== "clients" && item.id !== "prospect-edit" && item.id !== "prospect-create") {
                      setSelectedProspect(null);
                    }
                    if (item.id !== "client-billing") {
                      setSelectedClientForBilling(null);
                    }
                  }}
                  title={item.label}
                >
                  <span className="nav-icon">
                    {item.icon}
                    {item.badge && item.badge > 0 && (
                      <span className="notifications-badge">{item.badge}</span>
                    )}
                  </span>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Développer" : "Réduire"}
        >
          {isSidebarCollapsed ? "→" : "←"}
        </button>
      </aside>

      {/* ✅ CONTENU PRINCIPAL */}
      <main className="dashboard-main">
        {/* ✅ HEADER MODERNE */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="page-title">
              <span>{getPageIcon()}</span> {getPageTitle()}
            </h1>
            <div className="page-breadcrumb">
              <span>CRM Pro</span>
              <span className="breadcrumb-separator">/</span>
              <span>{getPageTitle()}</span>
            </div>
          </div>
          
          <div className="header-right">
            <div className="header-actions">
              <button 
                onClick={() => navigate("/")} 
                className="header-btn"
                title="Retour à l'accueil"
              >
                🏠 Accueil
              </button>
              
            </div>
            
            <div className="user-profile" onClick={toggleUserMenu} ref={userMenuRef}>
              <div className="user-avatar">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profil" />
                ) : (
                  user.name ? user.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name || "Utilisateur"}</span>
                <span className="user-email">{user.email || ""}</span>
              </div>
              
              {/* ✅ MENU UTILISATEUR */}
              <div className={`user-menu ${isUserMenuOpen ? 'active' : ''}`}>
                <div className="user-menu-header">
                  <div className="menu-avatar">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="Profil" />
                    ) : (
                      user.name ? user.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <h3 className="menu-user-name">{user.name || "Utilisateur"}</h3>
                  <p className="menu-user-email">{user.email || ""}</p>
                </div>
                
                <div className="user-menu-items">
                  <a href="#settings" className="menu-item" onClick={() => {
                    setActiveTab("settings");
                    setIsUserMenuOpen(false);
                  }}>
                    <span className="menu-item-icon">⚙️</span>
                    <span>Paramètres</span>
                  </a>
                  <a href="#carte" className="menu-item" onClick={() => {
                    setActiveTab("carte");
                    setIsUserMenuOpen(false);
                  }}>
                    <span className="menu-item-icon">💼</span>
                    <span>Ma carte de visite</span>
                  </a>
                  <div className="menu-divider"></div>
                  <button onClick={handleLogout} className="menu-logout">
                    <span className="menu-item-icon">🚪</span>
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ✅ CONTENU DES PAGES */}
        <div className="dashboard-content">
          <div className="content-wrapper">
            {activeTab === "dashboard" && <Analytics />}

            {activeTab === "clients" && (
              <ProspectsPage
                clients={clients}
                onRefresh={fetchClients}
                onViewClientDevis={handleViewClientDevis}
                onViewClientBilling={handleViewClientBilling}
                onEditProspect={handleEditProspect}
                onCreateProspect={handleCreateProspect}
              />
            )}

            {activeTab === "prospect-edit" && selectedProspect && (
              <ProspectEditPage
                prospect={selectedProspect}
                onBack={() => {
                  setSelectedProspect(null);
                  setActiveTab("clients");
                }}
                onSave={() => {
                  fetchClients();
                  setSelectedProspect(null);
                  setActiveTab("clients");
                }}
              />
            )}

            {activeTab === "prospect-create" && (
              <ProspectCreatePage
                userId={userId}
                onBack={() => setActiveTab("clients")}
                onCreated={() => {
                  fetchClients();
                  setActiveTab("clients");
                }}
              />
            )}

            {activeTab === "devis" && (
              <DevisListPage 
                clients={clients}
                onEditDevis={handleEditDevisFromList}
                onCreateDevis={handleCreateNewDevis}
              />
            )}

            {activeTab === "devis-creation" && (
              <Devis 
                clients={clients}
                initialDevisFromClient={editingDevis}
                selectedClientId={selectedClientForDevis?._id}
                onBack={selectedClientForDevis ? () => {
                  setSelectedClientForDevis(null);
                  setEditingDevis(null);
                  setActiveTab("clients");
                } : editingDevis ? () => {
                  setEditingDevis(null);
                  setActiveTab("devis");
                } : null}
              />
            )}

            {activeTab === "client-billing" && selectedClientForBilling && (
              <ClientBilling 
                client={selectedClientForBilling}
                onBack={() => {
                  setSelectedClientForBilling(null);
                  setActiveTab("clients");
                }}
              />
            )}

            {activeTab === "notifications" && (
              <Notifications 
                onNotificationsUpdate={updateUnreadNotifications}
              />
            )}
            
            {activeTab === "settings" && <Settings />}
            
            {activeTab === "carte" && (
              <BusinessCard 
                userId={userId} 
                user={user}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;