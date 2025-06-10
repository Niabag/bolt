import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../config/api';
import QRCode from 'react-qr-code';
import ActionButtons from '../../components/ActionButtons/ActionButtons';
import StatusMessages from '../../components/StatusMessages/StatusMessages';
import SchemaDisplay from '../../components/SchemaDisplay/SchemaDisplay';
import './registerClient.scss';

const RegisterClient = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    postalCode: '',
    city: '',
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [businessCard, setBusinessCard] = useState(null);
  const [executionStatus, setExecutionStatus] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [pendingActions, setPendingActions] = useState([]);
  const [hasRedirectedFromWebsite, setHasRedirectedFromWebsite] = useState(false);
  const [schemaType, setSchemaType] = useState('');

  const trackCardView = async () => {
    try {
      await apiRequest(
        API_ENDPOINTS.BUSINESS_CARDS.TRACK_VIEW(userId),
        { method: 'POST' }
      );
      console.log("✅ Vue de carte enregistrée");
    } catch (err) {
      console.error('Erreur suivi carte:', err);
    }
  };

  useEffect(() => {
    if (userId) {
      trackCardView();
      fetchBusinessCard();
      checkRedirectionSource();
    } else {
      setError('ID utilisateur manquant');
      setLoading(false);
    }
  }, [userId]);

  const checkRedirectionSource = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromWebsite = urlParams.get('from') === 'website' || 
                       urlParams.get('from') === 'qr' ||
                       document.referrer.includes('votre-site.com') ||
                       sessionStorage.getItem('redirectedFromWebsite') === 'true';
    
    if (fromWebsite) {
      setHasRedirectedFromWebsite(true);
      sessionStorage.setItem('redirectedFromWebsite', 'true');
      console.log('✅ Détection: Retour depuis le site web');
    }
  };

  const fetchBusinessCard = async () => {
    try {
      setLoading(true);
      // Utiliser l'API publique pour récupérer la carte de visite
      const response = await apiRequest(`${API_ENDPOINTS.BUSINESS_CARDS.BASE}/public/${userId}`);
      
      if (response && response.businessCard) {
        setBusinessCard(response.businessCard);
        
        if (response.businessCard.cardConfig && response.businessCard.cardConfig.actions) {
          await executeActions(response.businessCard.cardConfig.actions, response.businessCard);
        } else {
          console.log('Aucune action configurée - Affichage du formulaire par défaut');
          setShowForm(true);
          setLoading(false);
        }
      } else {
        throw new Error('Carte de visite non trouvée');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la carte:', error);
      // En cas d'erreur, afficher le formulaire par défaut
      console.log('Erreur chargement carte - Affichage du formulaire par défaut');
      setShowForm(true);
      setLoading(false);
    }
  };

  const executeActions = async (actions, cardData) => {
    if (!actions || actions.length === 0) {
      console.log('Aucune action - Formulaire par défaut');
      setShowForm(true);
      setLoading(false);
      return;
    }

    const activeActions = actions.filter(action => action.active);
    const sortedActions = activeActions.sort((a, b) => (a.order || 1) - (b.order || 1));

    console.log('🎯 Actions actives à exécuter:', sortedActions);

    if (sortedActions.length === 0) {
      console.log('Aucune action active - Formulaire par défaut');
      setShowForm(true);
      setLoading(false);
      return;
    }

    // DÉTECTION DU TYPE DE SCHÉMA
    const hasWebsite = sortedActions.some(a => a.type === 'website');
    const hasForm = sortedActions.some(a => a.type === 'form');
    const hasDownload = sortedActions.some(a => a.type === 'download');
    const websiteIndex = sortedActions.findIndex(a => a.type === 'website');
    const formIndex = sortedActions.findIndex(a => a.type === 'form');
    const downloadIndex = sortedActions.findIndex(a => a.type === 'download');

    let detectedSchema = '';
    if (hasWebsite && !hasForm && !hasDownload) {
      detectedSchema = 'website-only';
    } else if (hasWebsite && hasForm && !hasDownload) {
      detectedSchema = websiteIndex < formIndex ? 'website-form' : 'form-website';
    } else if (!hasWebsite && hasForm && hasDownload) {
      detectedSchema = 'contact-download';
    } else if (hasWebsite && hasForm && hasDownload) {
      detectedSchema = (websiteIndex > formIndex && websiteIndex > downloadIndex) ? 'funnel-site-last' : 'complete-funnel';
    } else if (!hasWebsite && hasForm && !hasDownload) {
      detectedSchema = 'contact-only';
    } else if (!hasWebsite && !hasForm && hasDownload) {
      detectedSchema = 'card-download';
    } else {
      detectedSchema = 'custom';
    }

    setSchemaType(detectedSchema);
    console.log(`📋 Schéma détecté: ${detectedSchema}`);

    // EXÉCUTION SELON LE SCHÉMA
    switch (detectedSchema) {
      case 'website-only':
        await executeWebsiteOnlySchema(sortedActions);
        break;
      
      case 'website-form':
        await executeWebsiteFormSchema(sortedActions);
        break;

      case 'form-website':
        await executeFormWebsiteSchema(sortedActions);
        break;
      
      case 'contact-download':
        await executeContactDownloadSchema(sortedActions);
        break;

      case 'complete-funnel':
        await executeCompleteFunnelSchema(sortedActions);
        break;

      case 'funnel-site-last':
        await executeFunnelSiteLastSchema(sortedActions);
        break;
      
      case 'contact-only':
        await executeContactOnlySchema(sortedActions);
        break;
      
      case 'card-download':
        await executeCardDownloadSchema(sortedActions, cardData);
        break;
      
      default:
        await executeCustomSchema(sortedActions);
        break;
    }

    setLoading(false);
  };

  // SCHÉMA 1: Site Web Direct (website uniquement)
  const executeWebsiteOnlySchema = async (actions) => {
    console.log('🌐 Exécution: Site Web Direct');
    const websiteAction = actions.find(a => a.type === 'website');
    
    if (websiteAction && websiteAction.url) {
      setExecutionStatus([{
        action: 'website',
        status: 'executing',
        message: 'Redirection vers le site web en cours...'
      }]);
      
      setTimeout(() => {
        console.log('🌐 Redirection vers:', websiteAction.url);
        window.location.href = websiteAction.url;
      }, 1500);
    } else {
      setError('URL du site web non configurée');
      setShowForm(true);
    }
  };

  // SCHÉMA 2: Site web puis Formulaire (website → form)
  const executeWebsiteFormSchema = async (actions) => {
    console.log('🚀 Exécution: Site web puis Formulaire');
    
    if (!hasRedirectedFromWebsite) {
      // Première visite: redirection vers le site web
      const websiteAction = actions.find(a => a.type === 'website');
      if (websiteAction && websiteAction.url) {
        setExecutionStatus([{
          action: 'website',
          status: 'executing',
          message: 'Redirection vers le site web...'
        }]);
        
        setTimeout(() => {
          const redirectUrl = new URL(websiteAction.url);
          redirectUrl.searchParams.set('from', 'qr');
          redirectUrl.searchParams.set('return', window.location.href);
          console.log('🌐 Redirection Lead Gen vers:', redirectUrl.toString());
          window.location.href = redirectUrl.toString();
        }, 1500);
        return;
      }
    } else {
      // Retour du site web: afficher le formulaire
      console.log('📝 Retour du site web - Affichage du formulaire');
      setShowForm(true);
      setExecutionStatus([{
        action: 'form',
        status: 'form-shown',
        message: 'Formulaire de contact affiché'
      }]);
    }
  };

  // SCHÉMA 3: Formulaire puis Site Web (form → website)
  const executeFormWebsiteSchema = async (actions) => {
    console.log('📝🌐 Exécution: Formulaire puis Site Web');
    setShowForm(true);

    const websiteAction = actions.find(a => a.type === 'website');
    if (websiteAction) {
      setPendingActions([websiteAction]);
    }

    setExecutionStatus([{ 
      action: 'form',
      status: 'form-shown',
      message: 'Formulaire affiché - Site web après soumission'
    }]);
  };

  // SCHÉMA 4: Contact → Carte (form → download)
  const executeContactDownloadSchema = async (actions) => {
    console.log('📝 Exécution: Contact → Carte');
    setShowForm(true);
    
    const downloadAction = actions.find(a => a.type === 'download');
    if (downloadAction) {
      setPendingActions([downloadAction]);
    }
    
    setExecutionStatus([{
      action: 'form',
      status: 'form-shown',
      message: 'Formulaire affiché - Téléchargement après soumission'
    }]);
  };

  // SCHÉMA 5: Tunnel Complet (website → form → download)
  const executeCompleteFunnelSchema = async (actions) => {
    console.log('🎯 Exécution: Tunnel Complet');
    
    if (!hasRedirectedFromWebsite) {
      // Première visite: redirection vers le site web
      const websiteAction = actions.find(a => a.type === 'website');
      if (websiteAction && websiteAction.url) {
        setExecutionStatus([{
          action: 'website',
          status: 'executing',
          message: 'Redirection vers le site web...'
        }]);
        
        setTimeout(() => {
          const redirectUrl = new URL(websiteAction.url);
          redirectUrl.searchParams.set('from', 'qr');
          redirectUrl.searchParams.set('return', window.location.href);
          console.log('🌐 Redirection Tunnel Complet vers:', redirectUrl.toString());
          window.location.href = redirectUrl.toString();
        }, 1500);
        return;
      }
    } else {
      // Retour du site web: formulaire + téléchargement en attente
      console.log('📝 Retour du site web - Formulaire + téléchargement en attente');
      setShowForm(true);
      
      const downloadAction = actions.find(a => a.type === 'download');
      if (downloadAction) {
        setPendingActions([downloadAction]);
      }
      
      setExecutionStatus([{
        action: 'form',
        status: 'form-shown',
        message: 'Formulaire affiché - Téléchargement après soumission'
      }]);
    }
  };

  // SCHÉMA 5bis: Tunnel Complet, site en dernier (form → download → website)
  const executeFunnelSiteLastSchema = async (actions) => {
    console.log('🎯🌐 Exécution: Tunnel Complet - Site en dernier');
    setShowForm(true);

    const downloadAction = actions.find(a => a.type === 'download');
    const websiteAction = actions.find(a => a.type === 'website');
    const pending = [];
    if (downloadAction) pending.push(downloadAction);
    if (websiteAction) pending.push(websiteAction);

    if (pending.length > 0) {
      setPendingActions(pending);
    }

    setExecutionStatus([{
      action: 'form',
      status: 'form-shown',
      message: 'Formulaire affiché - Actions après soumission'
    }]);
  };

  // SCHÉMA 6: Contact Uniquement (form seulement)
  const executeContactOnlySchema = async (actions) => {
    console.log('📝 Exécution: Contact Uniquement');
    setShowForm(true);
    setExecutionStatus([{
      action: 'form',
      status: 'form-shown',
      message: 'Formulaire de contact affiché'
    }]);
  };

  // SCHÉMA 7: Carte de Visite (download seulement)
  const executeCardDownloadSchema = async (actions, cardData) => {
    console.log('📥 Exécution: Carte de Visite');
    const downloadAction = actions.find(a => a.type === 'download');
    
    if (downloadAction) {
      setExecutionStatus([{
        action: 'download',
        status: 'executing',
        message: 'Téléchargement de votre carte de visite...'
      }]);
      
      setTimeout(async () => {
        await handleDownloadAction(downloadAction, cardData);
      }, 1000);
    }
  };

  // SCHÉMA PERSONNALISÉ
  const executeCustomSchema = async (actions) => {
    console.log('🔧 Exécution: Schéma Personnalisé');
    // Pour les schémas personnalisés, on affiche le formulaire par défaut
    setShowForm(true);
    
    // Préparer toutes les actions non-form en attente
    const nonFormActions = actions.filter(a => a.type !== 'form');
    if (nonFormActions.length > 0) {
      setPendingActions(nonFormActions);
    }
    
    setExecutionStatus([{
      action: 'custom',
      status: 'form-shown',
      message: 'Schéma personnalisé - Formulaire affiché'
    }]);
  };

  const executeRemainingActions = async () => {
    if (pendingActions.length === 0) return;

    console.log('🔄 Exécution des actions restantes:', pendingActions);

    for (const action of pendingActions) {
      await new Promise(resolve => setTimeout(resolve, action.delay || 1000));

      if (action.type === 'download') {
        await handleDownloadAction(action, businessCard);
      } else if (action.type === 'website') {
        window.location.href = action.url;
        setExecutionStatus(prev => [...prev, {
          action: 'website',
          status: 'completed',
          message: 'Redirection vers le site web'
        }]);
      }
    }

    setPendingActions([]);
  };

  const handleDownloadAction = async (action, card = businessCard) => {
    try {
      setExecutionStatus(prev => [...prev, {
        action: 'download',
        status: 'executing',
        message: 'Génération de votre carte de visite...'
      }]);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Télécharger l'image de la carte de visite avec QR code intégré
      if (card && card.cardImage) {
        // Créer un canvas pour intégrer le QR code sur l'image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Charger l'image de la carte
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        img.onload = async () => {
          // Définir les dimensions du canvas
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Dessiner l'image de base
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Ajouter le QR code si configuré
          if (card.cardConfig && card.cardConfig.showQR) {
            // Générer le QR code
            const qrSize = card.cardConfig.qrSize || 120;
            const position = card.cardConfig.qrPosition || 'top-right';
            
            let qrX, qrY;
            const margin = 30;
            
            switch (position) {
              case 'bottom-right':
                qrX = canvas.width - qrSize - margin;
                qrY = canvas.height - qrSize - margin;
                break;
              case 'bottom-left':
                qrX = margin;
                qrY = canvas.height - qrSize - margin;
                break;
              case 'top-right':
                qrX = canvas.width - qrSize - margin;
                qrY = margin;
                break;
              case 'top-left':
                qrX = margin;
                qrY = margin;
                break;
              default:
                qrX = canvas.width - qrSize - margin;
                qrY = margin;
            }
            
            // Générer le QR code
            const qrUrl = `${window.location.origin}/register-client/${userId}`;
            
            try {
              const QRCode = await import('qrcode');
              const qrDataUrl = await QRCode.default.toDataURL(qrUrl, {
                width: qrSize,
                margin: 2,
                color: {
                  dark: '#1f2937',
                  light: '#ffffff'
                },
                errorCorrectionLevel: 'M'
              });
              
              const qrImage = new Image();
              qrImage.onload = () => {
                // Fond blanc avec bordure pour le QR code
                ctx.fillStyle = 'white';
                ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
                
                // Bordure subtile
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 2;
                ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
                
                // QR code
                ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
                
                // Télécharger l'image finale
                const finalImage = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'carte-visite-numerique.png';
                link.href = finalImage;
                link.click();
                
                setExecutionStatus(prev => [...prev, {
                  action: 'download',
                  status: 'completed',
                  message: 'Carte de visite téléchargée avec succès !'
                }]);
              };
              
              qrImage.src = qrDataUrl;
              
            } catch (qrError) {
              console.error('Erreur génération QR code:', qrError);
              // Fallback: télécharger l'image sans QR code
              const link = document.createElement('a');
              link.download = 'carte-visite-numerique.png';
              link.href = card.cardImage;
              link.click();
              
              setExecutionStatus(prev => [...prev, {
                action: 'download',
                status: 'completed',
                message: 'Carte de visite téléchargée (sans QR code)'
              }]);
            }
          } else {
            // Télécharger l'image sans QR code
            const link = document.createElement('a');
            link.download = 'carte-visite-numerique.png';
            link.href = card.cardImage;
            link.click();
            
            setExecutionStatus(prev => [...prev, {
              action: 'download',
              status: 'completed',
              message: 'Carte de visite téléchargée avec succès !'
            }]);
          }
        };
        
        img.onerror = () => {
          console.error('Erreur chargement image');
          // Fallback: télécharger l'image brute
          const link = document.createElement('a');
          link.download = 'carte-visite-numerique.png';
          link.href = card.cardImage;
          link.click();
          
          setExecutionStatus(prev => [...prev, {
            action: 'download',
            status: 'completed',
            message: 'Carte de visite téléchargée (sans QR code)'
          }]);
        };
        
        img.src = card.cardImage;
      } else {
        // Fallback sur une image par défaut
        const link = document.createElement('a');
        link.download = 'carte-visite-numerique.png';
        link.href = '/images/modern-business-card-design-template-42551612346d5b08984f0b61a8044609_screen.jpg';
        link.click();
        
        setExecutionStatus(prev => [...prev, {
          action: 'download',
          status: 'completed',
          message: 'Carte de visite téléchargée (image par défaut)'
        }]);
      }

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setExecutionStatus(prev => [...prev, {
        action: 'download',
        status: 'error',
        message: 'Erreur lors du téléchargement'
      }]);
    }
  };

  const handleManualWebsiteVisit = () => {
    const websiteAction = businessCard?.cardConfig?.actions?.find(action => action.type === 'website');
    if (websiteAction && websiteAction.url) {
      window.location.href = websiteAction.url;
    }
  };

  const handleManualDownload = async () => {
    const downloadAction = businessCard?.cardConfig?.actions?.find(action => action.type === 'download');
    if (downloadAction) {
      await handleDownloadAction(downloadAction, businessCard);
    } else {
      // Téléchargement direct de la carte si aucune action de téléchargement n'est configurée
      try {
        setExecutionStatus(prev => [...prev, {
          action: 'download',
          status: 'executing',
          message: 'Téléchargement de votre carte de visite...'
        }]);

        // Télécharger l'image de la carte de visite avec QR code intégré
        if (businessCard && businessCard.cardImage) {
          // Créer un canvas pour intégrer le QR code sur l'image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Charger l'image de la carte
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          
          img.onload = async () => {
            // Définir les dimensions du canvas
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Dessiner l'image de base
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Ajouter le QR code si configuré
            if (businessCard.cardConfig && businessCard.cardConfig.showQR) {
              // Générer le QR code
              const qrSize = businessCard.cardConfig.qrSize || 120;
              const position = businessCard.cardConfig.qrPosition || 'top-right';
              
              let qrX, qrY;
              const margin = 30;
              
              switch (position) {
                case 'bottom-right':
                  qrX = canvas.width - qrSize - margin;
                  qrY = canvas.height - qrSize - margin;
                  break;
                case 'bottom-left':
                  qrX = margin;
                  qrY = canvas.height - qrSize - margin;
                  break;
                case 'top-right':
                  qrX = canvas.width - qrSize - margin;
                  qrY = margin;
                  break;
                case 'top-left':
                  qrX = margin;
                  qrY = margin;
                  break;
                default:
                  qrX = canvas.width - qrSize - margin;
                  qrY = margin;
              }
              
              // Générer le QR code
              const qrUrl = `${window.location.origin}/register-client/${userId}`;
              
              try {
                const QRCode = await import('qrcode');
                const qrDataUrl = await QRCode.default.toDataURL(qrUrl, {
                  width: qrSize,
                  margin: 2,
                  color: {
                    dark: '#1f2937',
                    light: '#ffffff'
                  },
                  errorCorrectionLevel: 'M'
                });
                
                const qrImage = new Image();
                qrImage.onload = () => {
                  // Fond blanc avec bordure pour le QR code
                  ctx.fillStyle = 'white';
                  ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
                  
                  // Bordure subtile
                  ctx.strokeStyle = '#e5e7eb';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
                  
                  // QR code
                  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
                  
                  // Télécharger l'image finale
                  const finalImage = canvas.toDataURL('image/png');
                  const link = document.createElement('a');
                  link.download = 'carte-visite-numerique.png';
                  link.href = finalImage;
                  link.click();
                  
                  setExecutionStatus(prev => [...prev, {
                    action: 'download',
                    status: 'completed',
                    message: 'Carte de visite téléchargée avec succès !'
                  }]);
                };
                
                qrImage.src = qrDataUrl;
                
              } catch (qrError) {
                console.error('Erreur génération QR code:', qrError);
                // Fallback: télécharger l'image sans QR code
                const link = document.createElement('a');
                link.download = 'carte-visite-numerique.png';
                link.href = businessCard.cardImage;
                link.click();
                
                setExecutionStatus(prev => [...prev, {
                  action: 'download',
                  status: 'completed',
                  message: 'Carte de visite téléchargée (sans QR code)'
                }]);
              }
            } else {
              // Télécharger l'image sans QR code
              const link = document.createElement('a');
              link.download = 'carte-visite-numerique.png';
              link.href = businessCard.cardImage;
              link.click();
              
              setExecutionStatus(prev => [...prev, {
                action: 'download',
                status: 'completed',
                message: 'Carte de visite téléchargée avec succès !'
              }]);
            }
          };
          
          img.onerror = () => {
            console.error('Erreur chargement image');
            // Fallback: télécharger l'image brute
            const link = document.createElement('a');
            link.download = 'carte-visite-numerique.png';
            link.href = businessCard.cardImage;
            link.click();
            
            setExecutionStatus(prev => [...prev, {
              action: 'download',
              status: 'completed',
              message: 'Carte de visite téléchargée (sans QR code)'
            }]);
          };
          
          img.src = businessCard.cardImage;
        } else {
          // Fallback sur une image par défaut
          const link = document.createElement('a');
          link.download = 'carte-visite-numerique.png';
          link.href = '/images/modern-business-card-design-template-42551612346d5b08984f0b61a8044609_screen.jpg';
          link.click();
          
          setExecutionStatus(prev => [...prev, {
            action: 'download',
            status: 'completed',
            message: 'Carte de visite téléchargée (image par défaut)'
          }]);
        }
      } catch (error) {
        console.error('Erreur téléchargement:', error);
        setExecutionStatus(prev => [...prev, {
          action: 'download',
          status: 'error',
          message: 'Erreur lors du téléchargement'
        }]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.REGISTER(userId), {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setSubmitted(true);
      setExecutionStatus(prev => [...prev, {
        action: 'form',
        status: 'completed',
        message: 'Formulaire soumis avec succès !'
      }]);

      // Exécuter les actions restantes après soumission
      await executeRemainingActions();

    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Affichage du QR code
  const renderQRCode = () => {
    // Construire l'URL pour le QR code
    const qrUrl = `${window.location.origin}/register-client/${userId}`;

    return (
      <div className="qr-code-display">
        <div className="qr-code-container">
          <div className="qr-code-wrapper">
            <QRCode 
              value={qrUrl}
              size={200}
              bgColor="white"
              fgColor="#1f2937"
            />
          </div>
          <div className="qr-code-info">
            <h3>Scannez ce QR code pour me contacter</h3>
            <p>Ou téléchargez ma carte de visite numérique</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !showForm) {
    return (
      <div className="professional-contact-page">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2>Chargement...</h2>
            <p>Préparation de votre expérience personnalisée</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !showForm) {
    return (
      <div className="professional-contact-page">
        <div className="contact-container">
          <div className="contact-header">
            <h1 className="contact-title">❌ Erreur</h1>
            <p className="contact-subtitle">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="professional-contact-page">
      <div className="contact-container">
        {/* En-tête professionnel */}
        <div className="contact-header">
          <h1 className="contact-title">💼 CRM Pro</h1>
          <p className="contact-subtitle">Découvrez nos services et entrons en contact</p>
        </div>

        {/* Affichage du schéma actif */}
        {businessCard?.cardConfig?.actions && (
          <SchemaDisplay 
            schema={schemaType}
            actions={businessCard.cardConfig.actions}
          />
        )}

        {/* Message de redirection depuis le site web */}
        {hasRedirectedFromWebsite && showForm && (
          <div className="redirection-info">
            <div className="redirection-icon">✅</div>
            <div className="redirection-content">
              <h4>Vous avez été redirigé depuis notre site web</h4>
              <p>Merci de votre intérêt ! Veuillez remplir le formulaire ci-dessous pour nous contacter.</p>
              <div className="website-badge">
                <span className="website-icon">🌐</span>
                <a 
                  href={businessCard?.cardConfig?.actions?.find(a => a.type === 'website')?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {businessCard?.cardConfig?.actions?.find(a => a.type === 'website')?.url || 'https://www.votre-site.com'}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Affichage du QR code - TOUJOURS AFFICHER POUR LE SCHÉMA CARD-DOWNLOAD */}
        {(schemaType === 'card-download' || !showForm) && renderQRCode()}

        {/* Actions manuelles disponibles (uniquement si pas de formulaire automatique) */}
        {businessCard?.cardConfig?.actions && !showForm && !submitted && schemaType !== 'website-only' && schemaType !== 'card-download' && (
          <ActionButtons 
            actions={businessCard.cardConfig.actions}
            onWebsiteVisit={handleManualWebsiteVisit}
            onDownload={handleManualDownload}
          />
        )}

        {/* Statut d'exécution */}
        {executionStatus.length > 0 && (
          <StatusMessages messages={executionStatus} />
        )}

        {/* Actions en attente */}
        {pendingActions.length > 0 && showForm && !submitted && (
          <div className="pending-actions">
            <h4>🕒 Actions en attente après soumission :</h4>
            <ul>
              {pendingActions.map((action, index) => (
                <li key={index}>
                  {action.type === 'download' && '📥 Téléchargement de votre carte de visite'}
                  {action.type === 'website' && '🌐 Ouverture de notre site web'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Message de succès */}
        {submitted && (
          <div className="success-message">
            <div className="success-icon">🎉</div>
            <div className="success-content">
              <h4>Merci pour votre inscription !</h4>
              <p>Nous avons bien reçu vos informations et vous recontacterons très prochainement.</p>
              {pendingActions.length > 0 && (
                <div className="pending-actions-info">
                  Les actions configurées ont été exécutées automatiquement.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulaire de contact */}
        {showForm && !submitted && (
          <div className="contact-form-section">
            <div className="form-header">
              <h2 className="form-title">📝 Formulaire de Contact</h2>
              <p className="form-description">Laissez-nous vos coordonnées et nous vous recontacterons rapidement</p>
            </div>

            <form onSubmit={handleSubmit} className="contact-form">
              {/* Informations de base */}
              <div className="form-section">
                <h3>👤 Informations Personnelles</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">👤</span>
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Votre nom et prénom"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">📧</span>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">📞</span>
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="06 12 34 56 78"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">🏢</span>
                      Entreprise
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Nom de votre entreprise (optionnel)"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="form-section">
                <h3>📍 Adresse</h3>
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🏠</span>
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Rue, numéro, bâtiment..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">📮</span>
                      Code postal
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="75000"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">🏙️</span>
                      Ville
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Paris"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="form-section">
                <h3>📝 Notes</h3>
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">💬</span>
                    Message ou commentaires
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Décrivez votre demande ou votre projet..."
                    rows={4}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                <span className="btn-icon">📤</span>
                <span className="btn-text">
                  {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* Message général si aucune action configurée */}
        {!businessCard?.cardConfig?.actions?.length && !showForm && (
          <div className="general-message">
            <p>Aucune action spécifique configurée. Contactez-nous directement pour plus d'informations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterClient;