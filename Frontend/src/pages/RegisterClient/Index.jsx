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
  
  // ✅ Références pour éviter les exécutions multiples
  const actionsExecutedRef = useRef(false);
  const dataLoadedRef = useRef(false);
  const currentActionsRef = useRef([]);
  const redirectedToWebsiteRef = useRef(false);
  
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

  // ✅ État pour les actions triées pour l'affichage
  const [sortedActionsForDisplay, setSortedActionsForDisplay] = useState([]);
  
  // ✅ État pour gérer les actions en attente après le formulaire
  const [pendingActionsAfterForm, setPendingActionsAfterForm] = useState([]);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // ✅ NOUVEAU: État pour suivre si on vient d'une redirection
  const [isRedirectedFromWebsite, setIsRedirectedFromWebsite] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");

  // ✅ Fonction pour réinitialiser l'état
  const resetState = () => {
    console.log('🔄 Réinitialisation de l\'état');
    actionsExecutedRef.current = false;
    dataLoadedRef.current = false;
    currentActionsRef.current = [];
    redirectedToWebsiteRef.current = false;
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
    setIsRedirectedFromWebsite(false);
    setWebsiteUrl("");
  };

  // ✅ Fonction pour comparer les actions et détecter les changements
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

  // ✅ NOUVEAU: Vérifier si on vient d'une redirection
  useEffect(() => {
    const checkRedirection = () => {
      const referrer = document.referrer;
      if (referrer && referrer !== window.location.href) {
        console.log('🔄 Détection de redirection depuis:', referrer);
        setIsRedirectedFromWebsite(true);
        setWebsiteUrl(referrer);
      }
    };
    
    checkRedirection();
  }, []);

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
              
              // ✅ CORRECTION: Marquer comme redirection depuis un site web
              setIsRedirectedFromWebsite(true);
              setWebsiteUrl(decodedUrl);
              
              // Créer une action de type website avec délai par défaut
              const websiteAction = {
                id: Date.now(),
                type: 'website',
                url: decodedUrl,
                active: true,
                order: 1,
                delay: 1000
              };
              
              // ✅ NOUVEAU: Ajouter une action de formulaire après le site web
              const formAction = {
                id: Date.now() + 1,
                type: 'form',
                active: true,
                order: 2,
                delay: 2000
              };
              
              console.log('🎯 Création des actions:', [websiteAction, formAction]);
              
              // ✅ Vérifier si les actions ont changé
              if (actionsHaveChanged([websiteAction, formAction])) {
                resetState();
                setBusinessCardActions([websiteAction, formAction]);
                setSortedActionsForDisplay([websiteAction, formAction]);
                setHasActions(true);
                setDataLoaded(true);
                currentActionsRef.current = [websiteAction, formAction];
                
                // ✅ CORRECTION: Afficher le formulaire immédiatement puisqu'on vient du site web
                setShowForm(true);
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
          
          // ✅ Vérifier si les actions ont changé
          if (actionsHaveChanged(sortedActions)) {
            console.log('🔄 Actions ont changé, réinitialisation...');
            resetState();
            
            if (sortedActions.length > 0) {
              console.log("🎯 Nouvelles actions à configurer:", sortedActions);
              setBusinessCardActions(sortedActions);
              setSortedActionsForDisplay(sortedActions);
              setBusinessCardData(businessCard);
              setHasActions(true);
              
              // ✅ CORRECTION: Si on vient d'une redirection et qu'il y a une action de formulaire, l'afficher
              if (isRedirectedFromWebsite) {
                const hasFormAction = sortedActions.some(a => a.type === 'form');
                if (hasFormAction) {
                  console.log('📝 Affichage du formulaire après redirection');
                  setShowForm(true);
                }
              } else {
                // Comportement normal si on n'est pas redirigé
                setShowForm(sortedActions.some(a => a.type === 'form' && a.order === 1));
              }
              
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

    // ✅ Toujours exécuter la détection pour vérifier les changements
    detectActions();
  }, [userId, isRedirectedFromWebsite]);

  // ✅ CORRECTION CRITIQUE: Exécution des actions avec ordre correct
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
      
      // ✅ CORRECTION CRITIQUE: Exécuter immédiatement la première action
      const sortedActions = [...businessCardActions].sort((a, b) => (a.order || 1) - (b.order || 1));
      const firstAction = sortedActions[0];
      
      console.log(`🚀 EXÉCUTION IMMÉDIATE: Action ${firstAction.order} (${firstAction.type})`);
      
      // ✅ CORRECTION: Si on vient déjà d'une redirection, ne pas rediriger à nouveau
      if (firstAction.type === 'website' && firstAction.url && !isRedirectedFromWebsite && !redirectedToWebsiteRef.current) {
        console.log('🌐 REDIRECTION IMMÉDIATE vers:', firstAction.url);
        redirectedToWebsiteRef.current = true;
        window.location.href = firstAction.url;
        return; // Arrêter car on quitte la page
      }
      
      // ✅ CORRECTION: Si on vient d'une redirection et qu'il y a une action de formulaire, l'afficher
      if (isRedirectedFromWebsite) {
        const formAction = sortedActions.find(a => a.type === 'form');
        if (formAction) {
          console.log('📝 AFFICHAGE IMMÉDIAT du formulaire après redirection');
          setShowForm(true);
          
          // Gérer les actions suivantes après le formulaire
          const formIndex = sortedActions.findIndex(a => a.type === 'form');
          if (formIndex !== -1 && formIndex < sortedActions.length - 1) {
            const actionsAfterForm = sortedActions.slice(formIndex + 1);
            setPendingActionsAfterForm(actionsAfterForm);
            console.log('📋 Actions en attente après formulaire:', actionsAfterForm);
          }
          return;
        }
      }
      
      // ✅ CORRECTION: Pour le formulaire, l'afficher immédiatement
      if (firstAction.type === 'form') {
        console.log('📝 AFFICHAGE IMMÉDIAT du formulaire');
        setShowForm(true);
        
        // Gérer les actions suivantes
        const remainingActions = sortedActions.slice(1);
        if (remainingActions.length > 0) {
          setPendingActionsAfterForm(remainingActions);
          console.log('📋 Actions en attente après formulaire:', remainingActions);
        }
        return;
      }
      
      // ✅ CORRECTION: Pour le téléchargement, l'exécuter immédiatement
      if (firstAction.type === 'download') {
        console.log('📥 TÉLÉCHARGEMENT IMMÉDIAT');
        await executeDownloadAction(firstAction);
        
        // Continuer avec les actions suivantes
        const remainingActions = sortedActions.slice(1);
        if (remainingActions.length > 0) {
          setTimeout(() => {
            executeActionsSequence(remainingActions);
          }, 1000);
        } else {
          setActionsCompleted(true);
        }
      }
    };

    executeActions();
  }, [dataLoaded, hasActions, businessCardActions, isRedirectedFromWebsite]);

  // ✅ Exécuter une séquence d'actions DANS L'ORDRE CONFIGURÉ
  const executeActionsSequence = async (actionsToExecute) => {
    for (let i = 0; i < actionsToExecute.length; i++) {
      const action = actionsToExecute[i];
      
      // Délai basé sur la POSITION dans la séquence
      const delayMs = (i + 1) * 1000;
      console.log(`⏳ Attente de ${delayMs}ms pour l'action en position ${i + 1} (Action configurée ${action.order}: ${action.type})`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      console.log(`🎯 Exécution de l'action en position ${i + 1} (Action configurée ${action.order}: ${action.type}):`, action);
      
      try {
        switch (action.type) {
          case 'form':
            console.log(`📝 Affichage du formulaire (Position ${i + 1}, Action configurée ${action.order})`);
            setShowForm(true);
            
            // Gérer les actions suivantes
            const remainingActions = actionsToExecute.slice(i + 1);
            if (remainingActions.length > 0) {
              setPendingActionsAfterForm(remainingActions);
              console.log('📋 Actions en attente après formulaire:', remainingActions);
            }
            return; // Arrêter et attendre la soumission du formulaire
            
          case 'download':
            console.log(`📥 Démarrage du téléchargement (Position ${i + 1}, Action configurée ${action.order})`);
            await executeDownloadAction(action);
            break;
            
          case 'website':
            console.log(`🌐 Ouverture du site web (Position ${i + 1}, Action configurée ${action.order}):`, action.url);
            if (action.url && !redirectedToWebsiteRef.current) {
              console.log('🚀 Redirection directe vers:', action.url);
              redirectedToWebsiteRef.current = true;
              window.location.href = action.url;
              return; // Arrêter car on quitte la page
            } else {
              console.warn('⚠️ Redirection déjà effectuée ou aucune URL fournie');
            }
            break;
            
          default:
            console.warn('⚠️ Type d\'action non reconnu:', action.type);
        }
      } catch (actionError) {
        console.error(`❌ Erreur lors de l'exécution de l'action ${action.type}:`, actionError);
      }
    }
    
    setActionsCompleted(true);
  };

  // ✅ Exécuter les actions en attente après soumission du formulaire
  const executeActionsAfterForm = async () => {
    if (pendingActionsAfterForm.length === 0) {
      console.log('✅ Aucune action en attente après le formulaire');
      setActionsCompleted(true);
      return;
    }
    
    console.log('🎬 Exécution des actions en attente après soumission du formulaire');
    console.log('📋 Actions en attente:', pendingActionsAfterForm);
    
    // Exécuter les actions restantes avec délais
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
            if (action.url && !redirectedToWebsiteRef.current) {
              redirectedToWebsiteRef.current = true;
              window.location.href = action.url;
              return; // Arrêter car on quitte la page
            } else {
              console.warn('⚠️ Redirection déjà effectuée ou aucune URL fournie');
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

  // ✅ FONCTION CORRIGÉE: Téléchargement de la vraie carte de visite
  const executeDownloadAction = async (action) => {
    try {
      console.log('📥 Génération de la carte de visite pour téléchargement...');
      
      if (action.file === 'carte-visite' || action.file === 'carte-apercu' || !action.file) {
        console.log('🖼️ Génération de la carte avec les données configurées...');
        const cardImageData = await generateBusinessCardFromData();
        
        if (cardImageData) {
          // Télécharger l'image générée
          const link = document.createElement('a');
          link.href = cardImageData;
          link.download = 'carte-de-visite-numerique.png';
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
        
        showDownloadMessage();
      }
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
    }
  };

  // ✅ FONCTION CORRIGÉE: Génération de carte de visite professionnelle
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
                
                // Ajouter les informations utilisateur
                await addUserInfoToCard(ctx, canvas, businessCardData);
                
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
            await generateDefaultCard(ctx, canvas);
          }
        } else {
          console.log('📝 Aucune image, génération d\'une carte par défaut');
          await generateDefaultCard(ctx, canvas);
        }
        
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        console.log('✅ Carte de visite générée avec succès');
        resolve(dataUrl);
        
      } catch (error) {
        console.error('❌ Erreur lors de la génération:', error);
        resolve(null);
      }
    });
  };

  // ✅ NOUVELLE FONCTION: Ajouter les informations utilisateur sur la carte
  const addUserInfoToCard = async (ctx, canvas, businessCardData) => {
    try {
      // Récupérer les informations de l'utilisateur depuis les données de la carte
      const userId = businessCardData.userId;
      
      try {
        // Récupérer les informations de l'utilisateur depuis l'API
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/users/public/${userId}`);
        const userData = await response.json();
        
        if (userData && userData.user) {
          const user = userData.user;
          
          // Zone de texte (côté gauche de la carte)
          const textX = 50;
          const textY = 100;
          
          // Fond semi-transparent pour le texte
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(textX - 20, textY - 40, 400, 200);
          
          // Nom de l'utilisateur
          ctx.fillStyle = '#1f2937';
          ctx.font = 'bold 36px Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(user.name || 'Votre Nom', textX, textY);
          
          // Email
          ctx.fillStyle = '#4b5563';
          ctx.font = '24px Arial, sans-serif';
          ctx.fillText(user.email || 'votre@email.com', textX, textY + 50);
          
          // Ligne de séparation
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(textX, textY + 70);
          ctx.lineTo(textX + 360, textY + 70);
          ctx.stroke();
          
          // Informations supplémentaires
          ctx.fillStyle = '#6b7280';
          ctx.font = '20px Arial, sans-serif';
          ctx.fillText('📱 Scannez le QR code', textX, textY + 110);
          ctx.fillText('💼 Carte de visite numérique', textX, textY + 140);
        }
      } catch (userError) {
        console.error('❌ Erreur récupération utilisateur:', userError);
        
        // Fallback avec texte générique
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(50, 60, 400, 200);
        
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 36px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Carte de Visite', 70, 120);
        
        ctx.fillStyle = '#4b5563';
        ctx.font = '24px Arial, sans-serif';
        ctx.fillText('Professionnelle', 70, 160);
      }
    } catch (error) {
      console.error('❌ Erreur ajout informations utilisateur:', error);
    }
  };

  // ✅ FONCTION CORRIGÉE: Ajouter le QR code sur la carte
  const addQRCodeToCard = async (ctx, canvas, config) => {
    try {
      const qrSize = config.qrSize || 120;
      const position = config.qrPosition || 'top-right';
      
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
      
      console.log(`📍 Position QR: ${position} (${qrX}, ${qrY}) taille: ${qrSize}px`);
      
      // Générer le QR code avec la vraie URL
      const qrUrl = window.location.href;
      
      // Utiliser la bibliothèque QRCode
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
        
        await new Promise((resolve) => {
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
    ctx.fillStyle = '#1f2937';
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
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR', x + size/2, y + size/2);
    
    console.log('✅ QR code fallback ajouté');
  };

  // ✅ FONCTION CORRIGÉE: Générer une carte par défaut professionnelle
  const generateDefaultCard = async (ctx, canvas) => {
    // Fond dégradé professionnel
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e40af');
    gradient.addColorStop(0.5, '#3b82f6');
    gradient.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Motif géométrique subtil
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < canvas.width; i += 100) {
      for (let j = 0; j < canvas.height; j += 100) {
        ctx.fillRect(i, j, 2, 2);
      }
    }
    
    // Zone principale d'informations
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Titre principal
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CARTE DE VISITE NUMÉRIQUE', centerX, centerY - 80);
    
    // Informations génériques
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText('Professionnel', centerX, centerY - 20);
    
    ctx.font = '28px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('contact@entreprise.com', centerX, centerY + 20);
    
    // Ligne de séparation
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 200, centerY + 50);
    ctx.lineTo(centerX + 200, centerY + 50);
    ctx.stroke();
    
    // Instructions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '22px Arial, sans-serif';
    ctx.fillText('📱 Scannez le QR code pour me contacter', centerX, centerY + 90);
    
    // Ajouter le QR code si configuré
    if (businessCardData && businessCardData.cardConfig && businessCardData.cardConfig.showQR) {
      await addQRCodeToCard(ctx, canvas, businessCardData.cardConfig);
    }
    
    console.log('✅ Carte par défaut générée');
  };

  // Fonction de téléchargement manuel
  const handleManualDownload = async () => {
    console.log('📥 Téléchargement manuel demandé');
    await executeDownloadAction({ type: 'download', file: 'carte-visite' });
  };

  // Afficher le message de téléchargement
  const showDownloadMessage = () => {
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
        z-index: 9999;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 14px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      ">
        <span style="font-size: 1.5rem;">📥</span>
        <span>Carte de visite téléchargée avec succès !</span>
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
    
    // ✅ Réinitialiser l'état avant de traiter le nouveau scan
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
      
      // ✅ Exécuter les actions en attente après soumission du formulaire
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
      <div className="professional-contact-page">
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
      <div className="professional-contact-page">
        <div className="contact-container">
          <div className="contact-header">
            <h1 className="contact-title">
              📱 Scanner une Carte de Visite
            </h1>
            <p className="contact-subtitle">
              Positionnez le QR code dans la zone de scan
            </p>
          </div>
          
          <div className="scanner-container">
            <div id="qr-reader" className="qr-reader-area"></div>
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
          
          {/* ✅ NOUVEAU: Message de redirection */}
          {isRedirectedFromWebsite && websiteUrl && (
            <div className="redirection-info">
              <div className="redirection-icon">✅</div>
              <div className="redirection-content">
                <h4>Vous avez été redirigé depuis notre site web</h4>
                <p>Merci de votre intérêt ! Veuillez remplir le formulaire ci-dessous pour nous contacter.</p>
                <div className="website-badge">
                  <span className="website-icon">🌐</span>
                  <a href={websiteUrl} target="_blank" rel="noopener noreferrer">{websiteUrl}</a>
                </div>
              </div>
            </div>
          )}
          
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
    <div className="professional-contact-page">
      <div className="contact-container">
        <div className="contact-header">
          <h1 className="contact-title">
            ⏳ Chargement...
          </h1>
          <p className="contact-subtitle">
            Veuillez patienter pendant l'initialisation
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterClient;