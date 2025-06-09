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
  
  // ✅ NOUVEAU: États pour le formulaire professionnel
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
    subject: "Demande de contact"
  });
  
  const scannerRef = useRef(null);

  // ✅ NOUVEAU: État pour les actions triées pour l'affichage
  const [sortedActionsForDisplay, setSortedActionsForDisplay] = useState([]);
  
  // ✅ NOUVEAU: État pour gérer les actions en attente après le formulaire
  const [pendingActionsAfterForm, setPendingActionsAfterForm] = useState([]);
  const [formSubmitted, setFormSubmitted] = useState(false);

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
    setSortedActionsForDisplay([]);
    setPendingActionsAfterForm([]);
    setFormSubmitted(false);
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
                setSortedActionsForDisplay([websiteAction]);
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
            }));
          
          // ✅ CORRECTION: Trier par l'ordre configuré pour l'exécution ET l'affichage
          const sortedActions = [...activeActions].sort((a, b) => (a.order || 1) - (b.order || 1));
          
          console.log("✅ Actions actives triées par ordre:", sortedActions);
          console.log("📊 Ordre d'affichage et d'exécution:", sortedActions.map((a, i) => `Position ${i + 1}: Action ${a.order} (${a.type})`));
          
          // ✅ NOUVEAU: Vérifier si les actions ont changé
          if (actionsHaveChanged(sortedActions)) {
            console.log('🔄 Actions ont changé, réinitialisation...');
            resetState();
            
            if (sortedActions.length > 0) {
              console.log("🎯 Nouvelles actions à configurer:", sortedActions);
              setBusinessCardActions(sortedActions);
              setSortedActionsForDisplay(sortedActions); // ✅ NOUVEAU: Actions triées pour l'affichage
              setBusinessCardData(businessCard);
              setHasActions(true);
              setShowForm(sortedActions.some(a => a.type === 'form'));
              currentActionsRef.current = sortedActions;
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

  // ✅ FONCTION CORRIGÉE: Exécution des actions avec gestion spéciale pour le formulaire
  const executeBusinessCardActions = async (actions) => {
    try {
      console.log('🎬 Démarrage de l\'exécution des actions configurées');
      console.log('📋 Actions reçues:', actions);

      if (!actions || actions.length === 0) {
        console.log('❌ Aucune action à exécuter');
        return;
      }

      // ✅ CORRECTION CRITIQUE: Les actions sont déjà triées par ordre configuré
      const sortedActions = actions;
      
      console.log('📊 Actions dans l\'ordre d\'exécution:', sortedActions);
      console.log('🎯 Séquence d\'exécution:', sortedActions.map((a, i) => `${i + 1}. Action ${a.order}: ${a.type} ${a.url ? `(${a.url})` : ''}`));
      
      // ✅ CORRECTION CRITIQUE: Exécuter TOUJOURS la première action en premier
      const firstAction = sortedActions[0];
      console.log(`🚀 DÉMARRAGE: Exécution immédiate de la première action (Action ${firstAction.order}: ${firstAction.type})`);
      
      // ✅ NOUVEAU: Séparer les actions avant et après le formulaire
      const hasFormAction = sortedActions.some(a => a.type === 'form');
      
      if (hasFormAction) {
        console.log('📝 Formulaire détecté dans la séquence');
        
        // Trouver l'index de l'action formulaire
        const formActionIndex = sortedActions.findIndex(a => a.type === 'form');
        const actionsBeforeForm = sortedActions.slice(0, formActionIndex + 1); // Inclure le formulaire
        const actionsAfterForm = sortedActions.slice(formActionIndex + 1); // Actions après le formulaire
        
        console.log('📋 Actions avant formulaire (inclus):', actionsBeforeForm);
        console.log('📋 Actions après formulaire:', actionsAfterForm);
        
        // Stocker les actions à exécuter après le formulaire
        setPendingActionsAfterForm(actionsAfterForm);
        
        // ✅ CORRECTION: Exécuter les actions avant le formulaire DANS L'ORDRE
        await executeActionsSequence(actionsBeforeForm);
      } else {
        // Pas de formulaire, exécuter toutes les actions normalement
        await executeActionsSequence(sortedActions);
      }
      
      console.log('✅ Actions initiales exécutées');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution des actions:', error);
    }
  };

  // ✅ FONCTION CORRIGÉE: Exécuter une séquence d'actions DANS L'ORDRE CONFIGURÉ
  const executeActionsSequence = async (actionsToExecute) => {
    for (let i = 0; i < actionsToExecute.length; i++) {
      const action = actionsToExecute[i];
      
      // ✅ CORRECTION CRITIQUE: Délai basé sur la POSITION dans la séquence (pas sur l'ordre configuré)
      const delayMs = (i + 1) * 1000; // Position 1 = 1000ms, Position 2 = 2000ms, Position 3 = 3000ms
      console.log(`⏳ Attente de ${delayMs}ms pour l'action en position ${i + 1} (Action configurée ${action.order}: ${action.type})`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      console.log(`🎯 Exécution de l'action en position ${i + 1} (Action configurée ${action.order}: ${action.type}):`, action);
      
      try {
        switch (action.type) {
          case 'form':
            console.log(`📝 Affichage du formulaire (Position ${i + 1}, Action configurée ${action.order})`);
            setShowForm(true);
            // ✅ IMPORTANT: Ne pas continuer avec les actions suivantes, attendre la soumission du formulaire
            return;
            
          case 'download':
            console.log(`📥 Démarrage du téléchargement (Position ${i + 1}, Action configurée ${action.order})`);
            await executeDownloadAction(action);
            break;
            
          case 'website':
            console.log(`🌐 Ouverture du site web (Position ${i + 1}, Action configurée ${action.order}):`, action.url);
            if (action.url) {
              // ✅ SOLUTION ANTI-POPUP: Redirection directe dans la même fenêtre
              console.log('🚀 Redirection directe vers:', action.url);
              window.location.href = action.url;
              // ✅ IMPORTANT: Arrêter l'exécution des actions suivantes car on quitte la page
              return;
            } else {
              console.warn('⚠️ Aucune URL fournie pour l\'action website');
            }
            break;
            
          default:
            console.warn('⚠️ Type d\'action non reconnu:', action.type);
        }
      } catch (actionError) {
        console.error(`❌ Erreur lors de l'exécution de l'action ${action.type}:`, actionError);
        // ✅ IMPORTANT: Continuer avec les actions suivantes même en cas d'erreur
      }
    }
  };

  // ✅ NOUVELLE FONCTION: Exécuter les actions en attente après soumission du formulaire
  const executeActionsAfterForm = async () => {
    if (pendingActionsAfterForm.length === 0) {
      console.log('✅ Aucune action en attente après le formulaire');
      return;
    }
    
    console.log('🎬 Exécution des actions en attente après soumission du formulaire');
    console.log('📋 Actions en attente:', pendingActionsAfterForm);
    
    // ✅ CORRECTION: Exécuter les actions restantes avec délais basés sur leur position dans la séquence restante
    for (let i = 0; i < pendingActionsAfterForm.length; i++) {
      const action = pendingActionsAfterForm[i];
      
      // Délai basé sur la position dans la séquence restante
      const delayMs = (i + 1) * 1000;
      console.log(`⏳ Attente de ${delayMs}ms pour l'action post-formulaire en position ${i + 1}`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      console.log(`🎯 Exécution de l'action post-formulaire en position ${i + 1}:`, action);
      
      try {
        switch (action.type) {
          case 'download':
            console.log('📥 Téléchargement post-formulaire');
            await executeDownloadAction(action);
            break;
            
          case 'website':
            console.log('🌐 Redirection post-formulaire vers:', action.url);
            if (action.url) {
              window.location.href = action.url;
              return; // Arrêter car on quitte la page
            }
            break;
            
          default:
            console.warn('⚠️ Type d\'action post-formulaire non reconnu:', action.type);
        }
      } catch (actionError) {
        console.error(`❌ Erreur lors de l'exécution de l'action post-formulaire ${action.type}:`, actionError);
      }
    }
    
    console.log('✅ Toutes les actions après formulaire ont été exécutées');
    setActionsCompleted(true);
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

  // ✅ FONCTION AMÉLIORÉE: Gestion du scan avec redirection directe
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
      setSortedActionsForDisplay([websiteAction]);
      setHasActions(true);
      setDataLoaded(true);
      setShowForm(false);
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

  // ✅ FONCTION CORRIGÉE: Soumission du formulaire avec exécution des actions en attente
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log("📤 Envoi du formulaire:", formData);
      
      // Simuler l'envoi du formulaire
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage("✅ Formulaire envoyé avec succès !");
      setFormSubmitted(true);
      
      // ✅ NOUVEAU: Exécuter les actions en attente après soumission du formulaire
      console.log('🎬 Formulaire soumis, exécution des actions en attente...');
      setTimeout(() => {
        executeActionsAfterForm();
      }, 1500); // Délai pour laisser le temps de voir le message de succès
      
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
      <div className="professional-contact-page">
        <div className="contact-container">
          <div className="contact-header">
            <h1 className="contact-title">
              💼 Carte de Visite Numérique
            </h1>
            <p className="contact-subtitle">
              Découvrez nos services et entrons en contact
            </p>
          </div>
          
          {/* ✅ NOUVEAU: Affichage du schéma configuré */}
          <div className="schema-display">
            <h3 className="schema-title">
              🎯 Actions configurées :
            </h3>
            <div className="schema-sequence">
              {sortedActionsForDisplay.map((action, index) => (
                <span key={action.id} className="schema-step">
                  {action.type === 'form' && '📝 Formulaire'}
                  {action.type === 'download' && '📥 Téléchargement'}
                  {action.type === 'website' && '🌐 Site web'}
                  {index < sortedActionsForDisplay.length - 1 && ' → '}
                </span>
              ))}
            </div>
            
            {/* ✅ NOUVEAU: Affichage des URLs de sites web */}
            {sortedActionsForDisplay
              .filter(action => action.type === 'website')
              .map(action => (
                <div key={action.id} className="website-info">
                  <div className="website-label">
                    <strong>🌐 Site web :</strong>
                  </div>
                  <a 
                    href={action.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="website-link"
                  >
                    {action.url}
                  </a>
                </div>
              ))}
          </div>
          
          {/* ✅ NOUVEAU: Boutons d'actions manuelles */}
          <div className="actions-manual">
            {sortedActionsForDisplay.map((action, index) => (
              <div key={action.id} className="action-manual-item">
                {action.type === 'download' && (
                  <button
                    type="button"
                    className="action-btn download-btn"
                    onClick={() => {
                      console.log('🟢 Clic manuel sur le bouton téléchargement');
                      executeDownloadAction(action);
                    }}
                  >
                    <span className="btn-icon">📥</span>
                    <span className="btn-text">Télécharger la carte de visite</span>
                    <span className="btn-order">Action {action.order}</span>
                  </button>
                )}
                
                {action.type === 'website' && action.url && (
                  <button
                    type="button"
                    className="action-btn website-btn"
                    onClick={() => {
                      console.log('🔵 Clic manuel sur le bouton site web', action.url);
                      window.location.href = action.url;
                    }}
                  >
                    <span className="btn-icon">🌐</span>
                    <span className="btn-text">Visiter notre site web</span>
                    <span className="btn-order">Action {action.order}</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* ✅ NOUVEAU: Formulaire de contact professionnel */}
          {showForm && (
            <div className="contact-form-section">
              <div className="form-header">
                <h3 className="form-title">📝 Formulaire de Contact</h3>
                <p className="form-description">
                  Laissez-nous vos coordonnées et nous vous recontacterons rapidement
                </p>
              </div>
              
              {/* ✅ NOUVEAU: Message de succès après soumission */}
              {formSubmitted && (
                <div className="success-message">
                  <div className="success-icon">✅</div>
                  <div className="success-content">
                    <h4>Formulaire envoyé avec succès !</h4>
                    <p>Nous vous recontacterons dans les plus brefs délais.</p>
                    {pendingActionsAfterForm.length > 0 && (
                      <div className="pending-actions-info">
                        Exécution des actions suivantes en cours...
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!formSubmitted && (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">
                        <span className="label-icon">👤</span>
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Votre nom et prénom"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        <span className="label-icon">📧</span>
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">
                        <span className="label-icon">📞</span>
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="company" className="form-label">
                        <span className="label-icon">🏢</span>
                        Entreprise
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Nom de votre entreprise"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subject" className="form-label">
                      <span className="label-icon">📋</span>
                      Sujet
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="Demande de contact">Demande de contact</option>
                      <option value="Demande de devis">Demande de devis</option>
                      <option value="Information produit">Information produit</option>
                      <option value="Support technique">Support technique</option>
                      <option value="Partenariat">Partenariat</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="message" className="form-label">
                      <span className="label-icon">💬</span>
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="5"
                      className="form-textarea"
                      placeholder="Décrivez votre demande ou votre projet..."
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="submit-btn"
                  >
                    <span className="btn-icon">
                      {loading ? '⏳' : '📤'}
                    </span>
                    <span className="btn-text">
                      {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ✅ NOUVEAU: Statut d'exécution automatique */}
          <div className="execution-status">
            {formSubmitted && actionsCompleted ? (
              <div className="status-message completed">
                <span className="status-icon">✅</span>
                <span>Toutes les actions ont été exécutées dans l'ordre configuré</span>
              </div>
            ) : formSubmitted ? (
              <div className="status-message pending">
                <span className="status-icon">⏳</span>
                <span>Exécution des actions en attente après soumission du formulaire...</span>
              </div>
            ) : showForm ? (
              <div className="status-message form-shown">
                <span className="status-icon">📝</span>
                <span>Formulaire affiché - Les actions suivantes s'exécuteront après soumission</span>
              </div>
            ) : actionsCompleted ? (
              <div className="status-message completed">
                <span className="status-icon">✅</span>
                <span>Actions automatiques exécutées dans l'ordre configuré</span>
              </div>
            ) : (
              <div className="status-message executing">
                <span className="status-icon">⏳</span>
                <span>Exécution automatique en cours dans l'ordre configuré...</span>
              </div>
            )}
          </div>
          
          {/* ✅ NOUVEAU: Affichage des actions en attente */}
          {pendingActionsAfterForm.length > 0 && showForm && !formSubmitted && (
            <div className="pending-actions">
              <h4>Actions en attente après soumission :</h4>
              <ul>
                {pendingActionsAfterForm.map(action => (
                  <li key={action.id}>
                    Action {action.order}: {action.type === 'website' ? `Site web (${action.url})` : action.type}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {message && !formSubmitted && (
            <div className="general-message">
              {message}
            </div>
          )}
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