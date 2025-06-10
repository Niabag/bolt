import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Devis from "../../components/Dashboard/Devis/devisPage";
import DevisListPage from "../../components/Dashboard/Devis/devisListPage";
import ProspectsPage from "../../components/Dashboard/Prospects/prospectsPage";
import Analytics from "../../components/Dashboard/Analytics/analytics";
import Settings from "../../components/Dashboard/Settings/settings";
import Notifications from "../../components/Dashboard/Notifications/notifications";
import BusinessCard from "../../components/Dashboard/BusinessCard/businessCard";
import Billing from "../../components/Dashboard/Billing/billing";
import { API_ENDPOINTS, FRONTEND_ROUTES, apiRequest } from "../../config/api";
import { useNavigate } from "react-router-dom";
import "./dashboard.scss";

const Dashboard = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [qrValue, setQrValue] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState({});
  const [selectedClientForDevis, setSelectedClientForDevis] = useState(null);
  const [editingDevis, setEditingDevis] = useState(null);

  const toggleSidebar = () => setIsOpen(!isOpen);

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
  }, []);

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

  const generateQRCode = () => {
    if (userId) {
      const generatedLink = FRONTEND_ROUTES.CLIENT_REGISTER(userId);
      setQrValue(generatedLink);
      setError(null);
    } else {
      setError("L'ID utilisateur n'est pas encore disponible.");
    }
  };

  const handleViewClientDevis = (client) => {
    setSelectedClientForDevis(client);
    setActiveTab("devis-creation");
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const menuItems = [
    { id: "dashboard", icon: "📊", label: "Tableau de bord" },
    { id: "clients", icon: "👥", label: "Prospects" },
    { id: "devis", icon: "📄", label: "Devis" },
    { id: "billing", icon: "💰", label: "Facturation" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "carte", icon: "💼", label: "Carte de visite" },
    { id: "settings", icon: "⚙️", label: "Paramètres" }
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard": return "📊 Tableau de bord";
      case "clients": return "👥 Mes Prospects";
      case "devis": return "📄 Mes Devis";
      case "devis-creation": return "📝 Création de Devis";
      case "billing": return "💰 Facturation";
      case "notifications": return "🔔 Notifications";
      case "carte": return "💼 Carte de Visite";
      case "settings": return "⚙️ Paramètres";
      default: return "CRM Pro";
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Header avec navigation */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isOpen ? "◀" : "▶"}
          </button>
          <div className="brand">
            <span className="brand-icon">💼</span>
            <span className="brand-text">CRM Pro</span>
          </div>
        </div>
        
        <div className="header-center">
          <h1 className="page-title">{getPageTitle()}</h1>
        </div>
        
        <div className="header-right">
          <button 
            onClick={() => navigate("/")} 
            className="home-btn"
            title="Retour à l'accueil"
          >
            🏠 Accueil
          </button>
          <div className="user-profile">
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name || "Utilisateur"}</span>
              <span className="user-email">{user.email || ""}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Déconnexion">
              🚪
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${
                  activeTab === item.id || 
                  (activeTab === "devis-creation" && item.id === "devis") 
                    ? "active" 
                    : ""
                }`}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== "devis" && item.id !== "devis-creation") {
                    setSelectedClientForDevis(null);
                    setEditingDevis(null);
                  }
                }}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {isOpen && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeTab === "dashboard" && <Analytics />}

          {activeTab === "clients" && (
            <ProspectsPage 
              clients={clients}
              onRefresh={fetchClients}
              onViewClientDevis={handleViewClientDevis}
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

          {activeTab === "billing" && (
            <Billing 
              clients={clients}
              onRefresh={fetchClients}
            />
          )}

          {activeTab === "notifications" && <Notifications />}
          {activeTab === "settings" && <Settings />}
          {activeTab === "carte" && (
            <BusinessCard 
              userId={userId} 
              user={user}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;