import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './notifications.scss';

const Notifications = ({ onNotificationsUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, client, devis, system
  const [sortBy, setSortBy] = useState('date'); // date, type, priority
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [lastGeneratedTime, setLastGeneratedTime] = useState(null);
  const [deletedNotificationIds, setDeletedNotificationIds] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [nextRefreshIn, setNextRefreshIn] = useState(60);
  const [notificationSound] = useState(new Audio('/notification-sound.mp3')); // Assurez-vous d'ajouter ce fichier audio
  const socketRef = useRef(null);

  // Charger les notifications au démarrage
  useEffect(() => {
    loadNotifications();
    
    // Charger les IDs des notifications supprimées
    const deletedIds = localStorage.getItem('deletedNotificationIds');
    if (deletedIds) {
      try {
        setDeletedNotificationIds(JSON.parse(deletedIds));
      } catch (err) {
        console.error('Erreur lors du chargement des IDs supprimés:', err);
        setDeletedNotificationIds([]);
      }
    }

    // Configurer l'actualisation automatique toutes les 60 secondes
    const interval = setInterval(() => {
      if (autoRefreshEnabled) {
        generateNotifications(false);
        console.log("🔄 Actualisation automatique des notifications");
      }
    }, 60 * 1000); // 60 secondes
    
    setRefreshInterval(interval);

    // Configurer le compte à rebours
    const countdownInterval = setInterval(() => {
      if (autoRefreshEnabled) {
        setNextRefreshIn(prev => {
          if (prev <= 1) {
            return 60;
          }
          return prev - 1;
        });
      }
    }, 1000);

    // ✅ NOUVEAU: Initialiser la connexion WebSocket
    // Nous utilisons une approche différente pour éviter les problèmes d'importation
    initializeSocketConnection();

    // Nettoyage
    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [autoRefreshEnabled]);

  // ✅ NOUVELLE FONCTION: Initialiser la connexion WebSocket
  const initializeSocketConnection = async () => {
    try {
      // Vérifier si nous sommes dans un environnement navigateur
      if (typeof window !== 'undefined') {
        // Récupérer l'ID utilisateur du token
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const userId = getUserIdFromToken(token);
        if (!userId) return;
        
        console.log('🔌 Tentative de connexion au serveur de notifications...');
        
        // Utiliser un import dynamique pour éviter les problèmes de build
        try {
          const io = (await import('socket.io-client')).io;
          const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          
          // Créer la connexion
          const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket']
          });
          
          // Stocker la référence du socket
          socketRef.current = socket;
          
          // Événements de connexion
          socket.on('connect', () => {
            console.log('✅ Connecté au serveur de notifications en temps réel');
            
            // Authentifier l'utilisateur
            socket.emit('authenticate', userId);
            console.log('🔐 Authentification socket envoyée pour userId:', userId);
          });
          
          // Écouter les nouvelles notifications
          socket.on('notification', (notification) => {
            console.log('🔔 Nouvelle notification reçue:', notification);
            
            // Ajouter la notification à la liste
            setNotifications(prev => {
              // Vérifier si la notification existe déjà
              const exists = prev.some(n => 
                n.id === notification.id || 
                (n.type === notification.type && 
                 n.category === notification.category && 
                 n.title === notification.title &&
                 n.date === notification.date)
              );
              
              if (exists) return prev;
              
              // Ajouter l'ID unique si manquant
              const notifWithId = {
                ...notification,
                id: notification.id || `${notification.type}_${notification.category}_${Date.now()}`
              };
              
              // Jouer le son de notification
              try {
                notificationSound.play();
              } catch (error) {
                console.error("Erreur lors de la lecture du son:", error);
              }
              
              // Mettre à jour le compteur
              if (onNotificationsUpdate) {
                onNotificationsUpdate();
              }
              
              return [notifWithId, ...prev];
            });
          });
          
          // Erreurs de connexion
          socket.on('connect_error', (error) => {
            console.error('❌ Erreur de connexion au serveur de notifications:', error);
          });
          
          socket.on('disconnect', () => {
            console.log('❌ Déconnecté du serveur de notifications');
          });
        } catch (err) {
          console.error('❌ Erreur lors du chargement de socket.io-client:', err);
          console.log('Continuons sans notifications en temps réel');
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du socket:', error);
    }
  };

  // Extraire l'ID utilisateur du token JWT
  const getUserIdFromToken = (token) => {
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = atob(payloadBase64);
      return JSON.parse(payload).userId;
    } catch (error) {
      console.error("Erreur lors du décodage du token:", error);
      return null;
    }
  };

  // Persistance des notifications et des IDs supprimés
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('notificationsData', JSON.stringify(notifications));
      localStorage.setItem('lastGeneratedTime', lastGeneratedTime ? lastGeneratedTime.toISOString() : null);
      localStorage.setItem('deletedNotificationIds', JSON.stringify(deletedNotificationIds));
      
      // Mettre à jour le compteur de notifications non lues dans le parent
      if (onNotificationsUpdate) {
        onNotificationsUpdate();
      }
    }
  }, [notifications, loading, onNotificationsUpdate, lastGeneratedTime, deletedNotificationIds]);

  const loadNotifications = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer les notifications stockées
      const stored = localStorage.getItem('notificationsData');
      const lastGenTime = localStorage.getItem('lastGeneratedTime');
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // S'assurer que les dates sont des objets Date
          const withDates = parsed.map((n) => ({
            ...n,
            date: n.date ? new Date(n.date) : new Date(),
          }));
          
          // Filtrer les notifications supprimées
          const filteredNotifications = withDates.filter(
            notif => !deletedNotificationIds.includes(notif.id)
          );
          
          setNotifications(filteredNotifications);
          
          if (lastGenTime) {
            setLastGeneratedTime(new Date(lastGenTime));
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Failed to parse notifications from localStorage', err);
          generateNotifications(true);
        }
      } else {
        generateNotifications(true);
      }
    } catch (err) {
      setError("Erreur lors du chargement des notifications");
      setLoading(false);
    }
  };

  const generateNotifications = async (isFirstLoad = false) => {
    try {
      setLoading(true);
      
      // Récupérer les données réelles
      const [clients, devis, cardStats] = await Promise.all([
        apiRequest(API_ENDPOINTS.CLIENTS.BASE),
        apiRequest(API_ENDPOINTS.DEVIS.BASE),
        fetchCardStats()
      ]);

      // Si ce n'est pas le premier chargement, conserver les notifications existantes
      // et leur statut de lecture
      const existingNotifications = isFirstLoad ? [] : [...notifications];
      const existingIds = new Set(existingNotifications.map(n => n.id));
      
      const newNotifications = [];
      let notificationId = Date.now();
      let hasNewUnreadNotification = false;

      // ✅ NOTIFICATIONS BASÉES SUR LES STATISTIQUES DE CARTE DE VISITE - Uniquement si des données réelles existent
      if (cardStats) {
        // Notification pour les scans récents
        if (cardStats.scansToday > 0) {
          const notifId = `card_scans_today_${Date.now()}`;
          if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
            newNotifications.push({
              id: notifId,
              type: 'system',
              category: 'card_stats',
              priority: 'medium',
              title: 'Activité sur votre carte de visite',
              message: `${cardStats.scansToday} scan${cardStats.scansToday > 1 ? 's' : ''} de votre QR code aujourd'hui`,
              details: `Total: ${cardStats.totalScans} scans • ${cardStats.conversions} conversion${cardStats.conversions > 1 ? 's' : ''}`,
              date: new Date(),
              read: false,
              actionUrl: '#carte',
              actionLabel: 'Voir les statistiques'
            });
            hasNewUnreadNotification = true;
          }
        }

        // Notification pour les conversions - Uniquement si des conversions réelles existent
        if (cardStats.conversions > 0) {
          const notifId = `card_conversions_${Date.now()}`;
          if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
            newNotifications.push({
              id: notifId,
              type: 'system',
              category: 'card_conversions',
              priority: 'high',
              title: 'Conversions via votre carte de visite',
              message: `${cardStats.conversions} prospect${cardStats.conversions > 1 ? 's' : ''} inscrit${cardStats.conversions > 1 ? 's' : ''} via votre QR code`,
              details: `Taux de conversion: ${((cardStats.conversions / Math.max(cardStats.totalScans, 1)) * 100).toFixed(1)}%`,
              date: new Date(),
              read: false,
              actionUrl: '#clients',
              actionLabel: 'Voir les prospects'
            });
            hasNewUnreadNotification = true;
          }
        }

        // Notification pour le dernier scan - Uniquement si un scan réel existe
        if (cardStats.lastScan) {
          const lastScanDate = new Date(cardStats.lastScan);
          const now = new Date();
          const diffHours = Math.floor((now - lastScanDate) / (1000 * 60 * 60));
          
          if (diffHours < 24) {
            const notifId = `card_last_scan_${Date.now()}`;
            if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
              newNotifications.push({
                id: notifId,
                type: 'system',
                category: 'card_last_scan',
                priority: 'low',
                title: 'Scan récent de votre carte',
                message: `Quelqu'un a scanné votre QR code il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`,
                details: `Date: ${lastScanDate.toLocaleDateString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}`,
                date: new Date(),
                read: false,
                actionUrl: '#carte',
                actionLabel: 'Voir les détails'
              });
              hasNewUnreadNotification = true;
            }
          }
        }
      }

      // ✅ NOTIFICATIONS BASÉES SUR LES VRAIS CLIENTS
      clients.forEach(client => {
        const daysSinceCreation = Math.floor((new Date() - new Date(client.createdAt)) / (1000 * 60 * 60 * 24));
        
        // Nouveau client inscrit
        if (daysSinceCreation <= 7) {
          const notifId = `client_new_${client._id}`;
          if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
            newNotifications.push({
              id: notifId,
              type: 'client',
              category: 'nouveau_client',
              priority: 'high',
              title: 'Nouveau prospect inscrit',
              message: `${client.name} s'est inscrit via votre QR code`,
              details: `Email: ${client.email} • Téléphone: ${client.phone}${client.company ? ` • Entreprise: ${client.company}` : ''}`,
              date: new Date(client.createdAt),
              read: false, // Toujours non lu pour les nouveaux clients
              actionUrl: `/prospect/edit/${client._id}`,
              actionLabel: 'Voir le prospect',
              clientId: client._id,
              clientName: client.name
            });
            hasNewUnreadNotification = true;
          }
        }

        // Client inactif depuis longtemps
        if (client.status === 'inactive' && daysSinceCreation > 30) {
          const notifId = `client_inactive_${client._id}`;
          if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
            newNotifications.push({
              id: notifId,
              type: 'client',
              category: 'relance',
              priority: 'medium',
              title: 'Client inactif à relancer',
              message: `${client.name} est inactif depuis plus de 30 jours`,
              details: `Dernière activité: ${new Date(client.updatedAt).toLocaleDateString('fr-FR')}`,
              date: new Date(),
              read: false, // Non lu pour encourager l'action
              actionUrl: `/prospect/edit/${client._id}`,
              actionLabel: 'Relancer le client',
              clientId: client._id,
              clientName: client.name
            });
            hasNewUnreadNotification = true;
          }
        }

        // Prospect en attente
        if (client.status === 'en_attente') {
          const notifId = `client_pending_${client._id}`;
          if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
            newNotifications.push({
              id: notifId,
              type: 'client',
              category: 'action_requise',
              priority: 'high',
              title: 'Prospect en attente de suivi',
              message: `${client.name} nécessite un suivi commercial`,
              details: `Statut: En attente • ${client.company ? `Entreprise: ${client.company}` : 'Particulier'}`,
              date: new Date(),
              read: false, // Non lu pour encourager l'action
              actionUrl: `/prospect/edit/${client._id}`,
              actionLabel: 'Suivre le prospect',
              clientId: client._id,
              clientName: client.name
            });
            hasNewUnreadNotification = true;
          }
        }
      });

      // ✅ NOTIFICATIONS BASÉES SUR LES VRAIS DEVIS
      devis.forEach(devisItem => {
        const client = clients.find(c => c._id === (typeof devisItem.clientId === 'object' ? devisItem.clientId._id : devisItem.clientId));
        const daysSinceCreation = Math.floor((new Date() - new Date(devisItem.dateDevis || devisItem.date)) / (1000 * 60 * 60 * 24));
        
        // Nouveau devis créé
        if (daysSinceCreation <= 3) {
          const notifId = `devis_new_${devisItem._id}`;
          if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
            newNotifications.push({
              id: notifId,
              type: 'devis',
              category: 'nouveau_devis',
              priority: 'medium',
              title: 'Nouveau devis créé',
              message: `Devis "${devisItem.title}" créé pour ${client?.name || 'Client inconnu'}`,
              details: `Montant: ${calculateTTC(devisItem).toFixed(2)} € TTC • Statut: ${getStatusLabel(devisItem.status)}`,
              date: new Date(devisItem.dateDevis || devisItem.date),
              read: false, // Non lu pour les nouveaux devis
              actionUrl: '#devis',
              actionLabel: 'Voir le devis',
              devisId: devisItem._id,
              devisTitle: devisItem.title,
              clientName: client?.name
            });
            hasNewUnreadNotification = true;
          }
        }

        // Devis en attente depuis longtemps
        if (devisItem.status === 'en_attente' && daysSinceCreation > 7) {
          const notifId = `devis_waiting_${devisItem._id}`;
          if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
            newNotifications.push({
              id: notifId,
              type: 'devis',
              category: 'devis_attente',
              priority: 'high',
              title: 'Devis en attente de validation',
              message: `Le devis "${devisItem.title}" attend une réponse depuis ${daysSinceCreation} jours`,
              details: `Client: ${client?.name || 'Inconnu'} • Montant: ${calculateTTC(devisItem).toFixed(2)} € TTC`,
              date: new Date(),
              read: false, // Non lu pour encourager l'action
              actionUrl: '#devis',
              actionLabel: 'Relancer le client',
              devisId: devisItem._id,
              devisTitle: devisItem.title,
              clientName: client?.name
            });
            hasNewUnreadNotification = true;
          }
        }

        // Devis finalisé (succès)
        if (devisItem.status === 'fini' && daysSinceCreation <= 7) {
          const notifId = `devis_success_${devisItem._id}`;
          if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
            newNotifications.push({
              id: notifId,
              type: 'devis',
              category: 'devis_accepte',
              priority: 'low',
              title: 'Devis finalisé avec succès',
              message: `Le devis "${devisItem.title}" a été finalisé`,
              details: `Client: ${client?.name || 'Inconnu'} • CA réalisé: ${calculateTTC(devisItem).toFixed(2)} € TTC`,
              date: new Date(),
              read: false, // Non lu pour les bonnes nouvelles aussi
              actionUrl: '#devis',
              actionLabel: 'Voir le devis',
              devisId: devisItem._id,
              devisTitle: devisItem.title,
              clientName: client?.name
            });
            hasNewUnreadNotification = true;
          }
        }

        // Devis expirant bientôt
        if (devisItem.dateValidite) {
          const daysUntilExpiry = Math.floor((new Date(devisItem.dateValidite) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0 && devisItem.status !== 'fini') {
            const notifId = `devis_expiring_${devisItem._id}`;
            if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
              newNotifications.push({
                id: notifId,
                type: 'devis',
                category: 'devis_expire',
                priority: 'high',
                title: 'Devis expirant bientôt',
                message: `Le devis "${devisItem.title}" expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}`,
                details: `Client: ${client?.name || 'Inconnu'} • Date limite: ${new Date(devisItem.dateValidite).toLocaleDateString('fr-FR')}`,
                date: new Date(),
                read: false, // Non lu pour encourager l'action
                actionUrl: '#devis',
                actionLabel: 'Prolonger le devis',
                devisId: devisItem._id,
                devisTitle: devisItem.title,
                clientName: client?.name
              });
              hasNewUnreadNotification = true;
            }
          }
        }
      });

      // ✅ NOTIFICATIONS SYSTÈME INTELLIGENTES - Basées uniquement sur des données réelles
      const totalCA = devis.filter(d => d.status === 'fini').reduce((sum, d) => sum + calculateTTC(d), 0);
      const newClientsThisWeek = clients.filter(c => {
        const daysSince = Math.floor((new Date() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
        return daysSince <= 7;
      }).length;

      // Objectif CA atteint - Uniquement si le CA est réel et significatif
      if (totalCA > 10000) {
        const notifId = 'system_ca_goal';
        if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
          newNotifications.push({
            id: notifId,
            type: 'system',
            category: 'objectif_ca',
            priority: 'low',
            title: 'Objectif de chiffre d\'affaires atteint',
            message: `Félicitations ! Vous avez dépassé les 10 000 € de CA`,
            details: `CA total réalisé: ${totalCA.toFixed(2)} € • ${devis.filter(d => d.status === 'fini').length} devis finalisés`,
            date: new Date(),
            read: false, // Non lu pour les bonnes nouvelles
            actionUrl: '#dashboard',
            actionLabel: 'Voir le tableau de bord'
          });
          hasNewUnreadNotification = true;
        }
      }

      // Pic d'inscriptions - Uniquement si des inscriptions réelles existent
      if (newClientsThisWeek >= 5) {
        const notifId = 'system_new_clients_peak';
        if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
          newNotifications.push({
            id: notifId,
            type: 'system',
            category: 'pic_inscriptions',
            priority: 'medium',
            title: 'Pic d\'inscriptions cette semaine',
            message: `${newClientsThisWeek} nouveaux prospects se sont inscrits cette semaine`,
            details: 'Votre QR code fonctionne bien ! Pensez à les contacter rapidement.',
            date: new Date(),
            read: false, // Non lu pour encourager l'action
            actionUrl: '#clients',
            actionLabel: 'Voir les prospects'
          });
          hasNewUnreadNotification = true;
        }
      }

      // Rappel sauvegarde (une fois par semaine)
      const lastBackupReminder = existingNotifications.find(n => n.category === 'sauvegarde');
      const needsBackupReminder = !lastBackupReminder || 
                                 ((new Date() - new Date(lastBackupReminder.date)) / (1000 * 60 * 60 * 24) > 7);
      
      if (needsBackupReminder && clients.length > 0) {
        const notifId = 'system_backup_reminder';
        if (!existingIds.has(notifId) && !deletedNotificationIds.includes(notifId)) {
          newNotifications.push({
            id: notifId,
            type: 'system',
            category: 'sauvegarde',
            priority: 'low',
            title: 'Sauvegarde recommandée',
            message: 'Il est recommandé d\'exporter vos données régulièrement',
            details: `${clients.length} prospects et ${devis.length} devis à sauvegarder`,
            date: new Date(),
            read: false, // Non lu pour encourager l'action
            actionUrl: '#settings',
            actionLabel: 'Exporter les données'
          });
          hasNewUnreadNotification = true;
        }
      }

      // Fusionner les nouvelles notifications avec les existantes
      // en préservant l'état de lecture des notifications existantes
      const mergedNotifications = [...existingNotifications];
      
      // Ajouter uniquement les nouvelles notifications
      newNotifications.forEach(newNotif => {
        const existingIndex = mergedNotifications.findIndex(n => n.id === newNotif.id);
        if (existingIndex === -1) {
          // C'est une nouvelle notification, l'ajouter
          mergedNotifications.push(newNotif);
        }
      });

      // Filtrer les notifications supprimées
      const filteredNotifications = mergedNotifications.filter(
        notif => !deletedNotificationIds.includes(notif.id)
      );

      // Trier par date (plus récent en premier)
      filteredNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

      setNotifications(filteredNotifications);
      setLastGeneratedTime(new Date());
      
      // Jouer un son si de nouvelles notifications non lues ont été ajoutées
      if (hasNewUnreadNotification && !isFirstLoad) {
        try {
          notificationSound.play();
        } catch (error) {
          console.error("Erreur lors de la lecture du son:", error);
        }
      }
      
      // Mettre à jour le compteur dans le parent
      if (onNotificationsUpdate) {
        onNotificationsUpdate();
      }
    } catch (error) {
      console.error('Erreur lors de la génération des notifications:', error);
      setError("Erreur lors du chargement des notifications");
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
    // Ajouter l'ID à la liste des notifications supprimées
    setDeletedNotificationIds(prev => [...prev, id]);
    // Supprimer la notification de la liste actuelle
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

    // Ajouter tous les IDs sélectionnés à la liste des notifications supprimées
    setDeletedNotificationIds(prev => [...prev, ...selectedNotifications]);
    
    // Supprimer les notifications de la liste actuelle
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
        case 'card_stats': return '📊';
        case 'card_conversions': return '🔄';
        case 'card_last_scan': return '👁️';
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

  const handleRefresh = () => {
    generateNotifications(false);
    setNextRefreshIn(60);
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };


  if (loading && notifications.length === 0) {
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
          <div className="header-top">
            <h1 className="page-title">🔔 Centre de Notifications</h1>
            <div className="auto-refresh-control">
              <div className="refresh-status">
                <span className={`refresh-indicator ${autoRefreshEnabled ? 'active' : 'inactive'}`}></span>
                {autoRefreshEnabled 
                  ? `Actualisation dans ${nextRefreshIn}s` 
                  : 'Actualisation auto désactivée'}
              </div>
              <button 
                onClick={toggleAutoRefresh} 
                className={`auto-refresh-toggle ${autoRefreshEnabled ? 'enabled' : 'disabled'}`}
              >
                {autoRefreshEnabled ? '⏸️ Pause' : '▶️ Activer'}
              </button>
            </div>
          </div>
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

      {/* Afficher l'erreur si présente */}
      {error && (
        <div className="error-message-container">
          <div className="error-icon">⚠️</div>
          <div className="error-text">{error}</div>
          <button onClick={handleRefresh} className="retry-button">Réessayer</button>
        </div>
      )}

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
            {deletedNotificationIds.length > 0 && ` • ${deletedNotificationIds.length} supprimée${deletedNotificationIds.length > 1 ? 's' : ''}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;