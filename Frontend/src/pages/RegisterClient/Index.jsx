import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./registerClient.scss";
import { Html5QrcodeScanner } from "html5-qrcode";

const RegisterClient = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // ✅ NOUVEAU: Références pour éviter les exécutions multiples
  const actionsExecutedRef = useRef(false);
  const dataLoadedRef = useRef(false);
  const currentActionsRef = useRef([]);
  
  // États pour contrôler l'affichage
  const [showForm, setShowForm] = useState(false);
  const [actionsCompleted, setActionsCompleted] = useState(false);
  const [hasActions, setHasActions] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [businessCardActions, setBusinessCardActions] = useState([]);
  const [businessCardData, setBusinessCardData] = useState(null);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const scannerRef = useRef(null);

  // Ajout d'un état pour stocker les actions à afficher
  const [websiteAction, setWebsiteAction] = useState(null);
  const [downloadAction, setDownloadAction] = useState(null);

  // ✅ NOUVEAU: Fonction pour réinitialiser l'état
  const resetState = () => {
    console.log('🔄 Réinitialisation de l\'état');
    actionsExecutedRef.current = false;
    dataLoadedRef.current = false;
    currentActionsRef.current = [];
    setBusinessCardActions([]);
    setBusinessCardData(null);
    setHasActions(false);
    setShowForm(false);
    setActionsCompleted(false);
    setDataLoaded(false);
    setWebsiteAction(null);
    setDownloadAction(null);
    setMessage("");
  };

  // ✅ NOUVEAU: Fonction pour comparer les actions et détecter les changements
  const actionsHaveChanged = (newActions) => {
    const currentActions = currentActionsRef.current;
    
    if (currentActions.length !== newActions.length) {
      return true;
    }
    
    return newActions.some((newAction, index) => {
      const currentAction = currentActions[index];
      return !currentAction || 
             currentAction.type !== newAction.type || 
             currentAction.url !== newAction.url || 
             currentAction.active !== newAction.active ||
             currentAction.order !== newAction.order;
    });
  };

  // Gestion des actions
  useEffect(() => {
    const detectActions = async () => {
      try {
        console.log('🔍 Détection des actions...');
        
        // Extraire la destination de l'URL
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        
        // Vérifier si c'est une URL encodée
        if (lastPart && lastPart.includes('%')) {
          try {
            // Décoder l'URL du site web
            const decodedUrl = decodeURIComponent(lastPart);
            if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
              console.log('🌐 URL détectée:', decodedUrl);
              
              // Créer une action de type website avec délai par défaut
              const websiteAction = {
                id: Date.now(),
                type: 'website',
                url: decodedUrl,
                active: true,
                order: 1,
                delay: 1000
              };
              
              console.log('🎯 Création de l\'action website:', websiteAction);
              
              // ✅ NOUVEAU: Vérifier si les actions ont changé
              if (actionsHaveChanged([websiteAction])) {
                resetState();
                setBusinessCardActions([websiteAction]);
                setWebsiteAction(websiteAction);
                setHasActions(true);
                setDataLoaded(true);
                currentActionsRef.current = [websiteAction];
              }
              return;
            }
          } catch (error) {
            console.error('❌ Erreur lors du décodage de l\'URL:', error);
          }
        }
        
        // Si ce n'est pas une URL, c'est un userId
        const actualUserId = userId || lastPart;
        console.log('🔍 Vérification du userId:', actualUserId);
        
        if (actualUserId && actualUserId.length === 24 && actualUserId.match(/^[0-9a-fA-F]{24}$/)) {
          console.log('🔍 Récupération des données de carte pour userId:', actualUserId);
          
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/business-cards/public/${actualUserId}`);
          const data = await response.json();
          
          console.log("📦 Données reçues de l'API:", data);
          
          if (!data.businessCard) {
            console.log("❌ Pas de carte de visite dans la réponse");
            setMessage("ℹ️ Aucune action configurée. Cette carte de visite n'a pas d'actions configurées.");
            setDataLoaded(true);
            return;
          }

          const businessCard = data.businessCard;
          console.log("📋 Carte de visite trouvée:", businessCard);
          
          if (!businessCard.cardConfig?.actions || businessCard.cardConfig.actions.length === 0) {
            console.log("❌ Pas d'actions dans la carte de visite");
            setMessage("ℹ️ Aucune action configurée. Cette carte de visite n'a pas d'actions configurées.");
            setDataLoaded(true);
            return;
          }

          // ✅ CORRECTION CRITIQUE: Filtrer les actions actives et les trier correctement par ordre
          let activeActions = businessCard.cardConfig.actions
            .filter(action => action.active)
            .map((action, idx) => ({
              ...action,
              // ✅ IMPORTANT: Utiliser l'ordre configuré, pas l'index du tableau
              order: action.order !== undefined ? action.order : (idx + 1)
            }))
            // ✅ CORRECTION: Trier par l'ordre configuré (pas par l'index du tableau)
            .sort((a, b) => (a.order || 1) - (b.order || 1));
          
          console.log("✅ Actions actives triées par ordre:", activeActions);
          console.log("📊 Ordre d'exécution prévu:", activeActions.map(a => `${a.order}: ${a.type}`));
          
          // ✅ NOUVEAU: Vérifier si les actions ont changé
          if (actionsHaveChanged(activeActions)) {
            console.log('🔄 Actions ont changé, réinitialisation...');
            resetState();
            
            if (activeActions.length > 0) {
              console.log("🎯 Nouvelles actions à configurer:", activeActions);
              setBusinessCardActions(activeActions);
              setBusinessCardData(businessCard);
              setHasActions(true);
              setShowForm(activeActions.some(a => a.type === 'form'));
              currentActionsRef.current = activeActions;
            } else {
              console.log("ℹ️ Aucune action active trouvée");
              setHasActions(false);
              setShowForm(false);
            }
          } else {
            console.log('✅ Actions inchangées, pas de réinitialisation');
          }
        } else {
          console.log('❌ ID utilisateur invalide');
          setHasActions(false);
          setShowForm(false);
        }
      } catch (error) {
        console.error('❌ Erreur:', error);
        setHasActions(false);
        setShowForm(false);
      } finally {
        if (!dataLoadedRef.current) {
          setDataLoaded(true);
          dataLoadedRef.current = true;
        }
      }
    };

    // ✅ NOUVEAU: Toujours exécuter la détection pour vérifier les changements
    detectActions();
  }, [userId]); // Supprimer dataLoaded de la dépendance

  // ✅ NOUVEAU: Effet séparé pour mettre à jour les actions individuelles
  useEffect(() => {
    if (businessCardActions && businessCardActions.length > 0) {
      setWebsiteAction(businessCardActions.find(a => a.type === 'website'));
      setDownloadAction(businessCardActions.find(a => a.type === 'download'));
    } else {
      setWebsiteAction(null);
      setDownloadAction(null);
    }
  }, [businessCardActions]);

  // ✅ NOUVEAU: Exécution des actions avec meilleure gestion
  useEffect(() => {
    const executeActions = async () => {
      // Vérifier toutes les conditions nécessaires
      if (!dataLoaded || 
          !hasActions || 
          !businessCardActions || 
          businessCardActions.length === 0 || 
          actionsExecutedRef.current) {
        return;
      }
      
      console.log('🎬 Conditions remplies pour l\'exécution des actions');
      console.log('📋 Actions à exécuter:', businessCardActions);
      
      // Marquer comme exécuté AVANT l'exécution pour éviter les doublons
      actionsExecutedRef.current = true;
      
      // Attendre un délai initial avant de commencer
      setTimeout(() => {
        executeBusinessCardActions(businessCardActions);
      }, 500);
    };

    executeActions();
  }, [dataLoaded, hasActions, businessCardActions]);

  // ✅ FONCTION CORRIGÉE: Exécution des actions dans le bon ordre
  const executeBusinessCardActions = async (actions) => {
    try {
      console.log('🎬 Démarrage de l\'exécution des actions configurées');
      console.log('📋 Actions reçues:', actions);

      if (!actions || actions.length === 0) {
        console.log('❌ Aucune action à exécuter');
        return;
      }

      // ✅ CORRECTION CRITIQUE: Trier les actions par ordre configuré
      const sortedActions = [...actions].sort((a, b) => {
        const orderA = a.order || 1;
        const orderB = b.order || 1;
        return orderA - orderB;
      });
      
      console.log('📊 Actions triées par ordre d\'exécution:', sortedActions);
      console.log('🎯 Séquence d\'exécution:', sortedActions.map((a, i) => `${i + 1}. Ordre ${a.order}: ${a.type} ${a.url ? `(${a.url})` : ''}`));
      
      // Exécuter chaque action avec son délai basé sur sa POSITION dans l'ordre trié
      for (let i = 0; i < sortedActions.length; i++) {
        const action = sortedActions[i];
        
        // ✅ CORRECTION: Délai basé sur la position dans l'ordre trié (pas sur l'ordre configuré)
        const delayMs = (i + 1) * 1000;
        console.log(`⏳ Attente de ${delayMs}ms pour l'action ${i + 1}/${sortedActions.length} (ordre configuré: ${action.order})`);
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        console.log(`🎯 Exécution de l'action ${i + 1} (ordre ${action.order}):`, action);
        
        try {
          switch (action.type) {
            case 'form':
              console.log('📝 Affichage du formulaire (ordre ' + action.order + ')');
              setShowForm(true);
              break;
              
            case 'download':
              console.log('📥 Démarrage du téléchargement (ordre ' + action.order + ')');
              await executeDownloadAction(action);
              break;
              
            case 'website':
              console.log('🌐 Ouverture du site web (ordre ' + action.order + '):', action.url);
              if (action.url) {
                // ✅ CORRECTION: Utiliser window.open avec les bons paramètres
                const newWindow = window.open(action.url, '_blank', 'noopener,noreferrer');
                if (newWindow) {
                  console.log('✅ Site web ouvert avec succès');
                } else {
                  console.warn('⚠️ Popup bloqué, tentative alternative');
                  window.location.href = action.url;
                }
              } else {
                console.warn('⚠️ Aucune URL fournie pour l\'action website');
              }
              break;
              
            default:
              console.warn('⚠️ Type d\'action non reconnu:', action.type);
          }
        } catch (actionError) {
          console.error(`❌ Erreur lors de l'exécution de l'action ${action.type}:`, actionError);
        }
      }
      
      console.log('✅ Toutes les actions ont été exécutées dans l\'ordre configuré');
      setActionsCompleted(true);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution des actions:', error);
    }
  };

  // ✅ FONCTION AMÉLIORÉE: Téléchargement avec les vraies données
  const executeDownloadAction = async (action) => {
    try {
      console.log('📥 Génération de la carte de visite pour téléchargement...');
      
      if (action.file === 'carte-apercu' || !action.file) {
        console.log('🖼️ Génération de la carte avec les données configurées...');
        const cardImageData = await generateBusinessCardFromData();
        
        if (cardImageData) {
          // Télécharger l'image générée
          const link = document.createElement('a');
          link.href = cardImageData;
          link.download = 'carte-de-visite-qr.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ Carte de visite téléchargée avec succès');
          showDownloadMessage();
        } else {
          console.error('❌ Impossible de générer la carte de visite');
        }
      } else {
        // Téléchargement d'un fichier spécifique
        console.log('📁 Téléchargement du fichier:', action.file);
        const link = document.createElement('a');
        link.href = action.file;
        link.download = action.file.split('/').pop() || 'fichier';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showDownloadMessage();
      }
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
    }
  };

  // Génération basée sur les vraies données de la carte
  const generateBusinessCardFromData = async () => {
    return new Promise(async (resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Dimensions de carte de visite standard
        canvas.width = 1012;
        canvas.height = 638;
        
        console.log('🖼️ Démarrage de la génération de carte...');
        
        // Utiliser les vraies données de la carte
        if (businessCardData && businessCardData.cardImage) {
          console.log('🖼️ Chargement de l\'image de carte configurée');
          
          try {
            await new Promise((resolveImage, rejectImage) => {
              const cardImage = new Image();
              cardImage.onload = async () => {
                console.log('✅ Image de carte chargée');
                // Dessiner l'image de carte de visite
                ctx.drawImage(cardImage, 0, 0, canvas.width, canvas.height);
                
                // Ajouter le QR code si configuré
                if (businessCardData.cardConfig && businessCardData.cardConfig.showQR) {
                  await addQRCodeToCard(ctx, canvas, businessCardData.cardConfig);
                }
                
                resolveImage();
              };
              
              cardImage.onerror = () => {
                console.log('❌ Erreur chargement image, utilisation du fallback');
                rejectImage();
              };
              
              cardImage.src = businessCardData.cardImage;
            });
          } catch (imageError) {
            console.log('📝 Génération d\'une carte par défaut');
            await generateFallbackCard(ctx, canvas);
          }
        } else {
          console.log('📝 Aucune image, génération d\'une carte par défaut');
          await generateFallbackCard(ctx, canvas);
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        console.log('✅ Carte de visite générée avec succès');
        resolve(dataUrl);
        
      } catch (error) {
        console.error('❌ Erreur lors de la génération:', error);
        resolve(null);
      }
    });
  };

  // Ajouter le QR code sur la carte
  const addQRCodeToCard = async (ctx, canvas, config) => {
    try {
      const qrSize = config.qrSize || 100;
      const position = config.qrPosition || 'top-right';
      
      // Calculer la position du QR code
      let qrX, qrY;
      const margin = 20;
      
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
      
      console.log(`📍 Position QR: ${position} (${qrX}, ${qrY}) taille: ${qrSize}px`);
      
      // Générer le QR code avec la vraie URL
      const qrUrl = window.location.href;
      
      // Utiliser la bibliothèque QRCode
      try {
        const QRCode = await import('qrcode');
        const qrDataUrl = await QRCode.default.toDataURL(qrUrl, {
          width: qrSize,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        await new Promise((resolve) => {
          const qrImage = new Image();
          qrImage.onload = () => {
            // Fond blanc pour le QR code
            ctx.fillStyle = 'white';
            ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
            
            // Dessiner le QR code
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
            
            console.log('✅ QR code ajouté à la carte');
            resolve();
          };
          qrImage.src = qrDataUrl;
        });
        
      } catch (qrError) {
        console.log('⚠️ Erreur QRCode, utilisation du fallback');
        drawFallbackQR(ctx, qrX, qrY, qrSize);
      }
    } catch (error) {
      console.error('❌ Erreur ajout QR code:', error);
    }
  };

  // Dessiner un QR code de fallback
  const drawFallbackQR = (ctx, x, y, size) => {
    // Fond blanc
    ctx.fillStyle = 'white';
    ctx.fillRect(x - 5, y - 5, size + 10, size + 10);
    
    // QR code simplifié
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, size, size);
    
    // Motif de QR code basique
    const cellSize = size / 21;
    ctx.fillStyle = 'white';
    
    for (let i = 0; i < 21; i++) {
      for (let j = 0; j < 21; j++) {
        if ((i + j) % 3 === 0) {
          ctx.fillRect(x + i * cellSize, y + j * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Texte au centre
    ctx.fillStyle = 'black';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR', x + size/2, y + size/2);
    
    console.log('✅ QR code fallback ajouté');
  };

  // Générer une carte par défaut
  const generateFallbackCard = async (ctx, canvas) => {
    // Fond dégradé
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Titre principal
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CARTE DE VISITE NUMÉRIQUE', canvas.width / 2, 80);
    
    // Informations de contact
    ctx.font = '32px Arial';
    ctx.fillText('Votre Nom', canvas.width / 2, 140);
    
    ctx.font = '24px Arial';
    ctx.fillText('votre.email@exemple.com', canvas.width / 2, 180);
    ctx.fillText('06 12 34 56 78', canvas.width / 2, 210);
    
    // Ajouter le QR code si configuré
    if (businessCardData && businessCardData.cardConfig && businessCardData.cardConfig.showQR) {
      await addQRCodeToCard(ctx, canvas, businessCardData.cardConfig);
    }
    
    // Texte d'instruction
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('📱 Scannez le QR code pour vous inscrire', 40, canvas.height - 80);
    ctx.fillText('💼 Recevez automatiquement nos informations', 40, canvas.height - 50);
  };

  // Fonction de téléchargement manuel
  const handleManualDownload = async () => {
    console.log('📥 Téléchargement manuel demandé');
    await executeDownloadAction({ type: 'download', file: 'carte-apercu' });
  };

  // Afficher le message de téléchargement
  const showDownloadMessage = () => {
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
        z-index: 9999;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      ">
        <span style="font-size: 1.2rem;">📥</span>
        <span>Carte de visite téléchargée !</span>
      </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      if (document.body.contains(messageDiv)) {
        document.body.removeChild(messageDiv);
      }
    }, 4000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const pathParts = window.location.pathname.split('/');
      let actualUserId = userId;
      
      await apiRequest(API_ENDPOINTS.CLIENTS.REGISTER(actualUserId), {
        method: "POST",
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          company,
          address,
          postalCode,
          city,
          notes
        }),
      });

      setSuccess(true);
      
      // Redirection finale
      setTimeout(() => {
        window.location.href = 'https://google.com';
      }, 2000);
      
    } catch (err) {
      console.error("❌ Erreur inscription client:", err);
      setError(err.message || "Erreur d'inscription du client");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attendre que le DOM soit prêt
    const timer = setTimeout(() => {
      if (!hasActions && !scannerRef.current) {
        try {
          const scanner = new Html5QrcodeScanner("qr-reader", {
            qrbox: {
              width: 250,
              height: 250
            },
            fps: 10
          });

          scanner.render(handleScan, handleError);
          scannerRef.current = scanner;
        } catch (error) {
          console.error("❌ Erreur lors de l'initialisation du scanner:", error);
        }
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [hasActions]);

  // ✅ FONCTION AMÉLIORÉE: Gestion du scan
  const handleScan = (decodedText) => {
    if (!decodedText) return;
    
    console.log('📱 QR Code scanné:', decodedText);
    
    // ✅ NOUVEAU: Réinitialiser l'état avant de traiter le nouveau scan
    resetState();
    
    // Traitement des URLs directes
    if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
      console.log('🌐 URL détectée dans le QR code:', decodedText);
      
      const websiteAction = {
        id: Date.now(),
        type: 'website',
        url: decodedText,
        active: true,
        order: 1,
        delay: 1000
      };
      
      setBusinessCardActions([websiteAction]);
      setWebsiteAction(websiteAction);
      setHasActions(true);
      setDataLoaded(true);
      setShowForm(false);
      setDownloadAction(null);
      currentActionsRef.current = [websiteAction];
      
      // Nettoyer le scanner
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      
      return;
    }
    
    // Traitement des userId (logique existante)
    // ... (le reste du code pour gérer les userId, etc.)
  };

  const handleError = (error) => {
    console.error("❌ Erreur de scan:", error);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ici, vous pouvez ajouter la logique pour envoyer les données du formulaire
      console.log("📤 Envoi du formulaire:", formData);
      setMessage("✅ Formulaire envoyé avec succès !");
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi du formulaire:", error);
      setMessage("❌ Erreur lors de l'envoi du formulaire");
    } finally {
      setLoading(false);
    }
  };

  // ✅ AFFICHAGE CONDITIONNEL AMÉLIORÉ
  
  // Attendre le chargement des données
  if (!dataLoaded) {
    return (
      <div className="register-client">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2>⏳ Chargement...</h2>
            <p>Récupération de la configuration...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Si aucune action configurée → Scanner QR
  if (!hasActions && !showForm) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Scanner une carte de visite
            </h2>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div id="qr-reader" className="w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si actions configurées → Affichage des actions avec boutons manuels
  if (hasActions) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Actions de la carte de visite
            </h2>
            
            {/* Affichage des actions configurées avec boutons */}
            <div className="bg-white p-6 rounded-lg shadow-md mt-4">
              <h3 className="text-lg font-semibold mb-4">Actions configurées :</h3>
              
              {/* ✅ NOUVEAU: Affichage de toutes les actions dans l'ordre configuré */}
              <div className="space-y-3">
                {businessCardActions
                  .sort((a, b) => (a.order || 1) - (b.order || 1)) // Trier par ordre pour l'affichage
                  .map((action, index) => (
                  <div key={action.id} className="action-item">
                    {action.type === 'form' && (
                      <div className="text-sm text-gray-600 p-3 bg-indigo-50 rounded border-l-4 border-indigo-400">
                        📝 <strong>Action {action.order}:</strong> Formulaire de contact - Affiché ci-dessous
                      </div>
                    )}
                    
                    {action.type === 'download' && (
                      <button
                        type="button"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        onClick={() => {
                          console.log('🟢 Clic manuel sur le bouton téléchargement');
                          executeDownloadAction(action);
                        }}
                      >
                        📥 <strong>Action {action.order}:</strong> Télécharger la carte de visite
                      </button>
                    )}
                    
                    {action.type === 'website' && action.url && (
                      <button
                        type="button"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => {
                          console.log('🔵 Clic manuel sur le bouton site web', action.url);
                          const newWindow = window.open(action.url, '_blank', 'noopener,noreferrer');
                          if (!newWindow) {
                            window.location.href = action.url;
                          }
                        }}
                      >
                        🌐 <strong>Action {action.order}:</strong> Ouvrir le site web
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {/* ✅ NOUVEAU: Statut d'exécution automatique */}
              <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                {actionsCompleted ? (
                  <span>✅ Actions automatiques exécutées dans l'ordre configuré</span>
                ) : (
                  <span>⏳ Exécution automatique en cours dans l'ordre configuré...</span>
                )}
              </div>
            </div>

            {/* Formulaire affiché automatiquement si présent */}
            {showForm && (
              <div className="bg-white p-6 rounded-lg shadow-md mt-4">
                <h3 className="text-xl font-semibold mb-4">Formulaire de contact</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="4"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Envoyer
                  </button>
                </form>
              </div>
            )}

            {message && (
              <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Chargement...
          </h2>
        </div>
      </div>
    </div>
  );
};

export default RegisterClient;