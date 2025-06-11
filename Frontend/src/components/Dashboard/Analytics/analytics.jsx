import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './analytics.scss';

const Analytics = () => {
  const [stats, setStats] = useState({
    // Prospects
    totalClients: 0,
    nouveauClients: 0,
    enAttenteClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    
    // Devis
    totalDevis: 0,
    nouveauDevis: 0,
    enAttenteDevis: 0,
    finiDevis: 0,
    inactifDevis: 0,
    
    // Chiffres d'affaires
    caRealise: 0,
    caPotentiel: 0,
    caTotal: 0,
    
    // Moyennes
    panierMoyen: 0,
    tauxConversion: 0,
    tauxReussite: 0,
    
    // Carte de visite
    cardScansTotal: 0,
    cardScansToday: 0,
    cardScansThisMonth: 0,
    cardConversions: 0,
    cardConversionRate: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState(null);
  const [cardStats, setCardStats] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    
    // Mettre en place un rafraîchissement automatique toutes les 5 minutes
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 5 * 60 * 1000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const calculateTTC = (devis) => {
    if (!devis || !Array.isArray(devis.articles)) return 0;
    
    return devis.articles.reduce((total, article) => {
      const price = parseFloat(article.unitPrice || 0);
      const qty = parseFloat(article.quantity || 0);
      const tva = parseFloat(article.tvaRate || 0);
      
      if (isNaN(price) || isNaN(qty) || isNaN(tva)) return total;
      
      const ht = price * qty;
      return total + ht + (ht * tva / 100);
    }, 0);
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les clients et devis
      const [clients, devis, cardStatsData] = await Promise.all([
        apiRequest(API_ENDPOINTS.CLIENTS.BASE),
        apiRequest(API_ENDPOINTS.DEVIS.BASE),
        fetchCardStats()
      ]);

      // ✅ STATISTIQUES PROSPECTS
      const totalClients = clients.length;
      const nouveauClients = clients.filter(c => c.status === 'nouveau').length;
      const enAttenteClients = clients.filter(c => c.status === 'en_attente').length;
      const activeClients = clients.filter(c => c.status === 'active').length;
      const inactiveClients = clients.filter(c => c.status === 'inactive').length;

      // ✅ STATISTIQUES DEVIS
      const totalDevis = devis.length;
      const nouveauDevis = devis.filter(d => d.status === 'nouveau').length;
      const enAttenteDevis = devis.filter(d => d.status === 'en_attente').length;
      const finiDevis = devis.filter(d => d.status === 'fini').length;
      const inactifDevis = devis.filter(d => d.status === 'inactif').length;

      // ✅ CHIFFRES D'AFFAIRES
      const caRealise = devis
        .filter(d => d.status === 'fini')
        .reduce((sum, d) => sum + calculateTTC(d), 0);
      
      const caPotentiel = devis
        .filter(d => ['nouveau', 'en_attente'].includes(d.status))
        .reduce((sum, d) => sum + calculateTTC(d), 0);
      
      const caTotal = caRealise + caPotentiel;

      // ✅ MOYENNES ET TAUX
      const panierMoyen = totalDevis > 0 ? caTotal / totalDevis : 0;
      const tauxConversion = totalClients > 0 ? (totalDevis / totalClients) * 100 : 0;
      const tauxReussite = totalDevis > 0 ? (finiDevis / totalDevis) * 100 : 0;

      // ✅ STATISTIQUES CARTE DE VISITE - Utiliser les données réelles de l'API
      let cardScansTotal = 0;
      let cardScansToday = 0;
      let cardScansThisMonth = 0;
      let cardConversions = 0;
      let cardConversionRate = 0;
      
      if (cardStatsData) {
        cardScansTotal = cardStatsData.totalScans || 0;
        cardScansToday = cardStatsData.scansToday || 0;
        cardScansThisMonth = cardStatsData.scansThisMonth || 0;
        cardConversions = cardStatsData.conversions || 0;
        cardConversionRate = cardScansTotal > 0 ? (cardConversions / cardScansTotal) * 100 : 0;
        
        // Stocker les statistiques de carte pour utilisation ultérieure
        setCardStats(cardStatsData);
      }

      setStats({
        totalClients,
        nouveauClients,
        enAttenteClients,
        activeClients,
        inactiveClients,
        totalDevis,
        nouveauDevis,
        enAttenteDevis,
        finiDevis,
        inactifDevis,
        caRealise,
        caPotentiel,
        caTotal,
        panierMoyen,
        tauxConversion,
        tauxReussite,
        cardScansTotal,
        cardScansToday,
        cardScansThisMonth,
        cardConversions,
        cardConversionRate
      });

      // ✅ ACTIVITÉ RÉCENTE (derniers devis et clients)
      const recentDevis = devis
        .sort((a, b) => new Date(b.date || b.dateDevis) - new Date(a.date || a.dateDevis))
        .slice(0, 3)
        .map(d => ({
          type: 'devis',
          title: d.title,
          date: d.date || d.dateDevis,
          amount: calculateTTC(d),
          status: d.status,
          client: clients.find(c => c._id === (typeof d.clientId === 'object' ? d.clientId._id : d.clientId))?.name || 'Client inconnu'
        }));

      const recentClients = clients
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2)
        .map(c => ({
          type: 'client',
          title: c.name,
          date: c.createdAt,
          status: c.status,
          company: c.company
        }));

      // ✅ AJOUTER LES SCANS RÉCENTS DE CARTE DE VISITE
      let cardActivity = [];
      if (cardStatsData && cardStatsData.lastScan) {
        cardActivity = [{
          type: 'card',
          title: 'Scan de QR code',
          date: cardStatsData.lastScan,
          status: 'active',
          details: `Votre carte de visite a été scannée`
        }];
      }

      setRecentActivity([...recentDevis, ...recentClients, ...cardActivity].sort((a, b) => new Date(b.date) - new Date(a.date)));

      // ✅ TOP CLIENTS (par CA généré)
      const clientsCA = clients.map(client => {
        const clientDevis = devis.filter(d => {
          const devisClientId = typeof d.clientId === 'object' ? d.clientId._id : d.clientId;
          return devisClientId === client._id;
        });
        
        const ca = clientDevis.reduce((sum, d) => sum + calculateTTC(d), 0);
        const nbDevis = clientDevis.length;
        const nbFinis = clientDevis.filter(d => d.status === 'fini').length;
        
        return {
          ...client,
          ca,
          nbDevis,
          nbFinis
        };
      })
      .filter(c => c.ca > 0)
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 5);

      setTopClients(clientsCA);

      // ✅ DONNÉES MENSUELLES (6 derniers mois)
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthClients = clients.filter(c => {
          const createdAt = new Date(c.createdAt);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length;
        
        const monthDevis = devis.filter(d => {
          const createdAt = new Date(d.date || d.dateDevis);
          return createdAt >= monthStart && createdAt <= monthEnd;
        });
        
        const monthCA = monthDevis.reduce((sum, d) => sum + calculateTTC(d), 0);
        
        monthlyStats.push({
          month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          clients: monthClients,
          devis: monthDevis.length,
          ca: monthCA
        });
      }
      
      setMonthlyData(monthlyStats);
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les statistiques de la carte de visite
  const fetchCardStats = async () => {
    try {
      // Récupérer l'ID utilisateur du token
      const token = localStorage.getItem("token");
      if (!token) return null;
      
      const decodedToken = decodeToken(token);
      if (!decodedToken || !decodedToken.userId) return null;
      
      const userId = decodedToken.userId;
      
      // Récupérer les statistiques
      const stats = await apiRequest(API_ENDPOINTS.BUSINESS_CARDS.STATS(userId));
      return stats;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de carte:', error);
      return null;
    }
  };

  // Décoder le token JWT
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

  const getStatusIcon = (status, type = 'client') => {
    if (type === 'devis') {
      switch (status) {
        case 'nouveau': return '🔵';
        case 'en_attente': return '🟣';
        case 'fini': return '🟢';
        case 'inactif': return '🔴';
        default: return '📄';
      }
    } else if (type === 'card') {
      return '📱';
    } else {
      switch (status) {
        case 'nouveau': return '🔵';
        case 'en_attente': return '🟣';
        case 'active': return '🟢';
        case 'inactive': return '🔴';
        default: return '👤';
      }
    }
  };

  const getStatusLabel = (status, type = 'client') => {
    if (type === 'devis') {
      switch (status) {
        case 'nouveau': return 'Nouveau';
        case 'en_attente': return 'En attente';
        case 'fini': return 'Fini';
        case 'inactif': return 'Inactif';
        default: return 'Inconnu';
      }
    } else if (type === 'card') {
      return 'Scan QR';
    } else {
      switch (status) {
        case 'nouveau': return 'Nouveau';
        case 'en_attente': return 'En attente';
        case 'active': return 'Actif';
        case 'inactive': return 'Inactif';
        default: return 'Inconnu';
      }
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'à l\'instant';
    }
  };

  if (loading && !stats.totalClients) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner">⏳</div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="dashboard-header">
        <div className="header-top">
          <h1>📊 Tableau de Bord</h1>
          <div className="refresh-info">
            <span>Dernière mise à jour: {formatTimeAgo(lastRefresh)}</span>
            <button onClick={fetchAnalytics} className="refresh-button" disabled={loading}>
              {loading ? '⏳' : '🔄'} {loading ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>
        </div>
        <p className="dashboard-subtitle">Vue d'ensemble de votre activité commerciale</p>
      </div>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={fetchAnalytics} className="retry-button">Réessayer</button>
        </div>
      )}
      
      {/* ✅ SECTION 1: KPIs PRINCIPAUX */}
      <div className="kpi-section">
        <h2>🎯 Indicateurs Clés</h2>
        <div className="kpi-grid">
          <div className="kpi-card highlight">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <h3>{stats.caRealise.toLocaleString('fr-FR')} €</h3>
              <p>CA Réalisé</p>
              <span className="kpi-trend positive">+{stats.finiDevis} devis finalisés</span>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon">🎯</div>
            <div className="kpi-content">
              <h3>{stats.caPotentiel.toLocaleString('fr-FR')} €</h3>
              <p>CA Potentiel</p>
              <span className="kpi-trend neutral">{stats.nouveauDevis + stats.enAttenteDevis} devis en cours</span>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon">📈</div>
            <div className="kpi-content">
              <h3>{stats.tauxReussite.toFixed(1)}%</h3>
              <p>Taux de Réussite</p>
              <span className="kpi-trend">{stats.finiDevis}/{stats.totalDevis} devis finalisés</span>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon">🛒</div>
            <div className="kpi-content">
              <h3>{stats.panierMoyen.toLocaleString('fr-FR')} €</h3>
              <p>Panier Moyen</p>
              <span className="kpi-trend">{stats.tauxConversion.toFixed(1)}% conversion</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NOUVELLE SECTION: STATISTIQUES CARTE DE VISITE */}
      <div className="kpi-section">
        <h2>💼 Carte de Visite Numérique</h2>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">📱</div>
            <div className="kpi-content">
              <h3>{stats.cardScansTotal}</h3>
              <p>Scans Totaux</p>
              <span className="kpi-trend positive">+{stats.cardScansToday} aujourd'hui</span>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon">📅</div>
            <div className="kpi-content">
              <h3>{stats.cardScansThisMonth}</h3>
              <p>Scans ce mois</p>
              <span className="kpi-trend">{(stats.cardScansThisMonth / 30).toFixed(1)} par jour</span>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon">🔄</div>
            <div className="kpi-content">
              <h3>{stats.cardConversions}</h3>
              <p>Conversions</p>
              <span className="kpi-trend">{stats.cardConversionRate.toFixed(1)}% de taux</span>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon">🔗</div>
            <div className="kpi-content">
              <h3>{cardStats?.lastScan ? formatTimeAgo(cardStats.lastScan) : 'Aucun'}</h3>
              <p>Dernier Scan</p>
              <span className="kpi-trend">
                <a href="#carte" style={{color: 'inherit', textDecoration: 'none'}}>Voir les détails →</a>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SECTION 2: PROSPECTS ET DEVIS */}
      <div className="stats-section">
        <div className="stats-row">
          {/* Prospects */}
          <div className="stats-group">
            <h3>👥 Prospects ({stats.totalClients})</h3>
            <div className="stats-grid">
              <div className="stat-card nouveau">
                <div className="stat-icon">🔵</div>
                <div className="stat-content">
                  <h4>{stats.nouveauClients}</h4>
                  <p>Nouveaux</p>
                </div>
              </div>
              
              <div className="stat-card en-attente">
                <div className="stat-icon">🟣</div>
                <div className="stat-content">
                  <h4>{stats.enAttenteClients}</h4>
                  <p>En attente</p>
                </div>
              </div>
              
              <div className="stat-card active">
                <div className="stat-icon">🟢</div>
                <div className="stat-content">
                  <h4>{stats.activeClients}</h4>
                  <p>Actifs</p>
                </div>
              </div>
              
              <div className="stat-card inactive">
                <div className="stat-icon">🔴</div>
                <div className="stat-content">
                  <h4>{stats.inactiveClients}</h4>
                  <p>Inactifs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Devis */}
          <div className="stats-group">
            <h3>📄 Devis ({stats.totalDevis})</h3>
            <div className="stats-grid">
              <div className="stat-card nouveau">
                <div className="stat-icon">🔵</div>
                <div className="stat-content">
                  <h4>{stats.nouveauDevis}</h4>
                  <p>Nouveaux</p>
                </div>
              </div>
              
              <div className="stat-card en-attente">
                <div className="stat-icon">🟣</div>
                <div className="stat-content">
                  <h4>{stats.enAttenteDevis}</h4>
                  <p>En attente</p>
                </div>
              </div>
              
              <div className="stat-card fini">
                <div className="stat-icon">🟢</div>
                <div className="stat-content">
                  <h4>{stats.finiDevis}</h4>
                  <p>Finis</p>
                </div>
              </div>
              
              <div className="stat-card inactif">
                <div className="stat-icon">🔴</div>
                <div className="stat-content">
                  <h4>{stats.inactifDevis}</h4>
                  <p>Inactifs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SECTION 3: ÉVOLUTION MENSUELLE */}
      <div className="evolution-section">
        <h3>📈 Évolution sur 6 mois</h3>
        <div className="evolution-chart">
          {monthlyData.map((month, index) => (
            <div key={index} className="month-bar">
              <div className="month-data">
                <div className="bar-container">
                  <div 
                    className="bar clients-bar" 
                    style={{ height: `${Math.max(5, (month.clients / Math.max(...monthlyData.map(m => m.clients || 1))) * 100)}%` }}
                    title={`${month.clients} prospects`}
                  ></div>
                  <div 
                    className="bar devis-bar" 
                    style={{ height: `${Math.max(5, (month.devis / Math.max(...monthlyData.map(m => m.devis || 1))) * 100)}%` }}
                    title={`${month.devis} devis`}
                  ></div>
                </div>
                <div className="month-stats">
                  <span className="month-clients">👥 {month.clients}</span>
                  <span className="month-devis">📄 {month.devis}</span>
                  <span className="month-ca">💰 {month.ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</span>
                </div>
              </div>
              <div className="month-label">{month.month}</div>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-color clients"></span> Prospects</span>
          <span className="legend-item"><span className="legend-color devis"></span> Devis</span>
        </div>
      </div>

      {/* ✅ SECTION 4: TOP CLIENTS ET ACTIVITÉ RÉCENTE */}
      <div className="bottom-section">
        <div className="bottom-row">
          {/* Top Clients */}
          <div className="top-clients">
            <h3>🏆 Top Clients</h3>
            {topClients.length === 0 ? (
              <p className="no-data">Aucun client avec CA pour le moment</p>
            ) : (
              <div className="clients-list">
                {topClients.map((client, index) => (
                  <div key={client._id} className="client-item">
                    <div className="client-rank">#{index + 1}</div>
                    <div className="client-avatar">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="client-info">
                      <h4>{client.name}</h4>
                      <p>{client.company || 'Particulier'}</p>
                      <div className="client-stats">
                        <span className="client-ca">{client.ca.toLocaleString('fr-FR')} €</span>
                        <span className="client-devis">{client.nbDevis} devis ({client.nbFinis} finis)</span>
                      </div>
                    </div>
                    <div className="client-status">
                      {getStatusIcon(client.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activité Récente */}
          <div className="recent-activity">
            <h3>🕒 Activité Récente</h3>
            {recentActivity.length === 0 ? (
              <p className="no-data">Aucune activité récente</p>
            ) : (
              <div className="activity-list">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'devis' ? '📄' : activity.type === 'card' ? '📱' : '👤'}
                    </div>
                    <div className="activity-content">
                      <h4>{activity.title}</h4>
                      {activity.type === 'devis' ? (
                        <p>
                          <span className="activity-client">{activity.client}</span>
                          <span className="activity-amount">{activity.amount?.toLocaleString('fr-FR')} €</span>
                          <span className={`activity-status ${activity.status}`}>
                            {getStatusIcon(activity.status, 'devis')} {getStatusLabel(activity.status, 'devis')}
                          </span>
                        </p>
                      ) : activity.type === 'card' ? (
                        <p>
                          <span className={`activity-status active`}>
                            {getStatusIcon(activity.status, 'card')} {getStatusLabel(activity.status, 'card')}
                          </span>
                          <span className="activity-details">{activity.details}</span>
                        </p>
                      ) : (
                        <p>
                          <span className="activity-company">{activity.company || 'Particulier'}</span>
                          <span className={`activity-status ${activity.status}`}>
                            {getStatusIcon(activity.status)} {getStatusLabel(activity.status)}
                          </span>
                        </p>
                      )}
                      <span className="activity-date">
                        {formatTimeAgo(activity.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;