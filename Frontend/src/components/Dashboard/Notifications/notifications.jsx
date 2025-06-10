import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './notifications.scss';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, client, devis, system
  const [sortBy, setSortBy] = useState('date'); // date, type, priority
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('notificationsData');
    if (stored) {
      setNotifications(JSON.parse(stored));
      setLoading(false);
    } else {
      generateNotifications();
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('notificationsData', JSON.stringify(notifications));
    }
  }, [notifications, loading]);

  const generateNotifications = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données réelles
      const [clients, devis] = await Promise.all([
        apiRequest(API_ENDPOINTS.CLIENTS.BASE),
        apiRequest(API_ENDPOINTS.DEVIS.BASE)
      ]);

      const notifications = [];
      let notificationId = 1;

      // ✅ NOTIFICATIONS BASÉES SUR LES VRAIS CLIENTS
      clients.forEach(client => {
        const daysSinceCreation = Math.floor((new Date() - new Date(client.createdAt)) / (1000 * 60 * 60 * 24));
        
        // Nouveau client inscrit
        if (daysSinceCreation <= 7) {
          notifications.push({
            id: notificationId++,
            type: 'client',
            category: 'nouveau_client',
            priority: 'high',
            title: 'Nouveau prospect inscrit',
            message: `${client.name} s'est inscrit via votre QR code`,
            details: `Email: ${client.email} • Téléphone: ${client.phone}${client.company ? ` • Entreprise: ${client.company}` : ''}`,
            date: new Date(client.createdAt),
            read: Math.random() > 0.7, // 30% lues
            actionUrl: `/prospect/edit/${client._id}`,
            actionLabel: 'Voir le prospect',
            clientId: client._id,
            clientName: client.name
          });
        }

        // Client inactif depuis longtemps
        if (client.status === 'inactive' && daysSinceCreation > 30) {
          notifications.push({
            id: notificationId++,
            type: 'client',
            category: 'relance',
            priority: 'medium',
            title: 'Client inactif à relancer',
            message: `${client.name} est inactif depuis plus de 30 jours`,
            details: `Dernière activité: ${new Date(client.updatedAt).toLocaleDateString('fr-FR')}`,
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            read: Math.random() > 0.5,
            actionUrl: `/prospect/edit/${client._id}`,
            actionLabel: 'Relancer le client',
            clientId: client._id,
            clientName: client.name
          });
        }

        // Prospect en attente
        if (client.status === 'en_attente') {
          notifications.push({
            id: notificationId++,
            type: 'client',
            category: 'action_requise',
            priority: 'high',
            title: 'Prospect en attente de suivi',
            message: `${client.name} nécessite un suivi commercial`,
            details: `Statut: En attente • ${client.company ? `Entreprise: ${client.company}` : 'Particulier'}`,
            date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
            read: Math.random() > 0.6,
            actionUrl: `/prospect/edit/${client._id}`,
            actionLabel: 'Suivre le prospect',
            clientId: client._id,
            clientName: client.name
          });
        }
      });

      // ✅ NOTIFICATIONS BASÉES SUR LES VRAIS DEVIS
      devis.forEach(devisItem => {
        const client = clients.find(c => c._id === (typeof devisItem.clientId === 'object' ? devisItem.clientId._id : devisItem.clientId));
        const daysSinceCreation = Math.floor((new Date() - new Date(devisItem.dateDevis || devisItem.date)) / (1000 * 60 * 60 * 24));
        
        // Nouveau devis créé
        if (daysSinceCreation <= 3) {
          notifications.push({
            id: notificationId++,
            type: 'devis',
            category: 'nouveau_devis',
            priority: 'medium',
            title: 'Nouveau devis créé',
            message: `Devis "${devisItem.title}" créé pour ${client?.name || 'Client inconnu'}`,
            details: `Montant: ${calculateTTC(devisItem).toFixed(2)} € TTC • Statut: ${getStatusLabel(devisItem.status)}`,
            date: new Date(devisItem.dateDevis || devisItem.date),
            read: Math.random() > 0.8,
            actionUrl: '#devis',
            actionLabel: 'Voir le devis',
            devisId: devisItem._id,
            devisTitle: devisItem.title,
            clientName: client?.name
          });
        }

        // Devis en attente depuis longtemps
        if (devisItem.status === 'en_attente' && daysSinceCreation > 7) {
          notifications.push({
            id: notificationId++,
            type: 'devis',
            category: 'devis_attente',
            priority: 'high',
            title: 'Devis en attente de validation',
            message: `Le devis "${devisItem.title}" attend une réponse depuis ${daysSinceCreation} jours`,
            details: `Client: ${client?.name || 'Inconnu'} • Montant: ${calculateTTC(devisItem).toFixed(2)} € TTC`,
            date: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
            read: Math.random() > 0.4,
            actionUrl: '#devis',
            actionLabel: 'Relancer le client',
            devisId: devisItem._id,
            devisTitle: devisItem.title,
            clientName: client?.name
          });
        }

        // Devis finalisé (succès)
        if (devisItem.status === 'fini' && daysSinceCreation <= 7) {
          notifications.push({
            id: notificationId++,
            type: 'devis',
            category: 'devis_accepte',
            priority: 'low',
            title: 'Devis finalisé avec succès',
            message: `Le devis "${devisItem.title}" a été finalisé`,
            details: `Client: ${client?.name || 'Inconnu'} • CA réalisé: ${calculateTTC(devisItem).toFixed(2)} € TTC`,
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            read: Math.random() > 0.3,
            actionUrl: '#devis',
            actionLabel: 'Voir le devis',
            devisId: devisItem._id,
            devisTitle: devisItem.title,
            clientName: client?.name
          });
        }

        // Devis expirant bientôt
        if (devisItem.dateValidite) {
          const daysUntilExpiry = Math.floor((new Date(devisItem.dateValidite) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0 && devisItem.status !== 'fini') {
            notifications.push({
              id: notificationId++,
              type: 'devis',
              category: 'devis_expire',
              priority: 'high',
              title: 'Devis expirant bientôt',
              message: `Le devis "${devisItem.title}" expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}`,
              details: `Client: ${client?.name || 'Inconnu'} • Date limite: ${new Date(devisItem.dateValidite).toLocaleDateString('fr-FR')}`,
              date: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
              read: Math.random() > 0.8,
              actionUrl: '#devis',
              actionLabel: 'Prolonger le devis',
              devisId: devisItem._id,
              devisTitle: devisItem.title,
              clientName: client?.name
            });
          }
        }
      });

      // ✅ NOTIFICATIONS SYSTÈME INTELLIGENTES
      const totalCA = devis.filter(d => d.status === 'fini').reduce((sum, d) => sum + calculateTTC(d), 0);
      const newClientsThisWeek = clients.filter(c => {
        const daysSince = Math.floor((new Date() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
        return daysSince <= 7;
      }).length;

      // Objectif CA atteint
      if (totalCA > 10000) {
        notifications.push({
          id: notificationId++,
          type: 'system',
          category: 'objectif_ca',
          priority: 'low',
          title: 'Objectif de chiffre d\'affaires atteint',
          message: `Félicitations ! Vous avez dépassé les 10 000 € de CA`,
          details: `CA total réalisé: ${totalCA.toFixed(2)} € • ${devis.filter(d => d.status === 'fini').length} devis finalisés`,
          date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          read: Math.random() > 0.9,
          actionUrl: '#dashboard',
          actionLabel: 'Voir le tableau de bord'
        });
      }

      // Pic d'inscriptions
      if (newClientsThisWeek >= 5) {
        notifications.push({
          id: notificationId++,
          type: 'system',
          category: 'pic_inscriptions',
          priority: 'medium',
          title: 'Pic d\'inscriptions cette semaine',
          message: `${newClientsThisWeek} nouveaux prospects se sont inscrits cette semaine`,
          details: 'Votre QR code fonctionne bien ! Pensez à les contacter rapidement.',
          date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          read: Math.random() > 0.7,
          actionUrl: '#clients',
          actionLabel: 'Voir les prospects'
        });
      }

      // Rappel sauvegarde
      notifications.push({
        id: notificationId++,
        type: 'system',
        category: 'sauvegarde',
        priority: 'low',
        title: 'Sauvegarde recommandée',
        message: 'Il est recommandé d\'exporter vos données régulièrement',
        details: `${clients.length} prospects et ${devis.length} devis à sauvegarder`,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: Math.random() > 0.5,
        actionUrl: '#settings',
        actionLabel: 'Exporter les données'
      });

      // Trier par date (plus récent en premier)
      notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

      setNotifications(notifications);
    } catch (error) {
      console.error('Erreur lors de la génération des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour calculer le TTC d'un devis
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'nouveau': return 'Nouveau';
      case 'en_attente': return 'En attente';
      case 'fini': return 'Fini';
      case 'inactif': return 'Inactif';
      default: return 'Inconnu';
    }
  };

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesReadFilter = filter === 'all' || 
                             (filter === 'read' && notification.read) ||
                             (filter === 'unread' && !notification.read);
    
    const matchesTypeFilter = typeFilter === 'all' || notification.type === typeFilter;
    
    return matchesReadFilter && matchesTypeFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'type':
        return a.type.localeCompare(b.type);
      case 'date':
      default:
        return new Date(b.date) - new Date(a.date);
    }
  });

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAsUnread = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: false } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(notifId => notifId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedNotifications.length === 0) return;
    
    const confirmDelete = window.confirm(
      `Supprimer ${selectedNotifications.length} notification(s) sélectionnée(s) ?`
    );
    if (!confirmDelete) return;

    setNotifications(prev => 
      prev.filter(notif => !selectedNotifications.includes(notif.id))
    );
    setSelectedNotifications([]);
  };

  const handleBulkMarkAsRead = () => {
    if (selectedNotifications.length === 0) return;
    
    setNotifications(prev => 
      prev.map(notif => 
        selectedNotifications.includes(notif.id) 
          ? { ...notif, read: true }
          : notif
      )
    );
    setSelectedNotifications([]);
  };

  const getNotificationIcon = (type, category) => {
    if (type === 'client') {
      switch (category) {
        case 'nouveau_client': return '👤';
        case 'relance': return '📞';
        case 'action_requise': return '⚡';
        default: return '👥';
      }
    } else if (type === 'devis') {
      switch (category) {
        case 'nouveau_devis': return '📄';
        case 'devis_accepte': return '✅';
        case 'devis_attente': return '⏳';
        case 'devis_expire': return '⚠️';
        default: return '📋';
      }
    } else {
      switch (category) {
        case 'objectif_ca': return '🎯';
        case 'pic_inscriptions': return '📈';
        case 'sauvegarde': return '💾';
        default: return 'ℹ️';
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f56565';
      case 'medium': return '#ed8936';
      case 'low': return '#48bb78';
      default: return '#4299e1';
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('fr-FR');
    } else if (days > 0) {
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      return 'À l\'instant';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length;

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner">⏳</div>
        <p>Chargement des notifications...</p>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      {/* En-tête avec statistiques */}
      <div className="notifications-header">
        <div className="header-content">
          <h1 className="page-title">🔔 Centre de Notifications</h1>
          <div className="notifications-stats">
            <div className="stat-item">
              <span className="stat-number">{notifications.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item unread">
              <span className="stat-number">{unreadCount}</span>
              <span className="stat-label">Non lues</span>
            </div>
            <div className="stat-item priority">
              <span className="stat-number">{highPriorityCount}</span>
              <span className="stat-label">Priorité haute</span>
            </div>
            <div className="stat-item filtered">
              <span className="stat-number">{filteredNotifications.length}</span>
              <span className="stat-label">Affichées</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et actions */}
      <div className="notifications-controls">
        <div className="filters-section">
          <div className="filter-group">
            <label>Statut :</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Type :</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">Tous types</option>
              <option value="client">👥 Prospects</option>
              <option value="devis">📄 Devis</option>
              <option value="system">⚙️ Système</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Trier par :</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Date</option>
              <option value="priority">Priorité</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>

        <div className="actions-section">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="action-btn mark-all-read">
              ✓ Tout marquer comme lu ({unreadCount})
            </button>
          )}
          
          {selectedNotifications.length > 0 && (
            <>
              <button onClick={handleBulkMarkAsRead} className="action-btn bulk-read">
                👁️ Marquer comme lues ({selectedNotifications.length})
              </button>
              <button onClick={handleBulkDelete} className="action-btn bulk-delete">
                🗑️ Supprimer ({selectedNotifications.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sélection en masse */}
      {filteredNotifications.length > 0 && (
        <div className="bulk-select-bar">
          <label className="select-all-checkbox">
            <input
              type="checkbox"
              checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
              onChange={handleSelectAll}
            />
            <span>Sélectionner toutes les notifications affichées ({filteredNotifications.length})</span>
          </label>
        </div>
      )}

      {/* Liste des notifications */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifications">
            <div className="no-notifications-icon">🔕</div>
            <h3>Aucune notification</h3>
            <p>
              {filter !== 'all' || typeFilter !== 'all' 
                ? "Aucune notification ne correspond à vos filtres"
                : "Vous n'avez aucune notification pour le moment"
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'} priority-${notification.priority} ${selectedNotifications.includes(notification.id) ? 'selected' : ''}`}
            >
              {/* Checkbox de sélection */}
              <div className="notification-select">
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification.id)}
                  onChange={() => handleSelectNotification(notification.id)}
                />
              </div>

              {/* Indicateur de priorité */}
              <div 
                className="priority-indicator"
                style={{ backgroundColor: getPriorityColor(notification.priority) }}
                title={`Priorité ${notification.priority}`}
              ></div>
              
              {/* Icône de type */}
              <div className="notification-icon">
                {getNotificationIcon(notification.type, notification.category)}
              </div>
              
              {/* Contenu principal */}
              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notification.title}</h4>
                  <div className="notification-meta">
                    <span className={`notification-type type-${notification.type}`}>
                      {notification.type === 'client' ? 'Prospect' : 
                       notification.type === 'devis' ? 'Devis' : 'Système'}
                    </span>
                    <span className="notification-date">
                      {formatDate(notification.date)}
                    </span>
                  </div>
                </div>
                
                <p className="notification-message">{notification.message}</p>
                
                {notification.details && (
                  <p className="notification-details">{notification.details}</p>
                )}

                {notification.actionUrl && (
                  <div className="notification-action">
                    <a href={notification.actionUrl} className="action-link">
                      {notification.actionLabel || 'Voir plus'}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="notification-actions">
                {!notification.read ? (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="action-btn mark-read"
                    title="Marquer comme lu"
                  >
                    👁️
                  </button>
                ) : (
                  <button 
                    onClick={() => markAsUnread(notification.id)}
                    className="action-btn mark-unread"
                    title="Marquer comme non lu"
                  >
                    📩
                  </button>
                )}
                
                <button 
                  onClick={() => deleteNotification(notification.id)}
                  className="action-btn delete"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Résumé en bas */}
      {filteredNotifications.length > 0 && (
        <div className="notifications-summary">
          <p>
            Affichage de {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''} 
            sur {notifications.length} au total
            {unreadCount > 0 && ` • ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
