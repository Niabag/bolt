import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./registerClient.scss";

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
  const actionsExecutedRef = useRef(false);
  
  // Gestion de la redirection finale
  const [finalRedirectUrl, setFinalRedirectUrl] = useState('');
  const [businessCardActions, setBusinessCardActions] = useState([]);
  const [businessCardData, setBusinessCardData] = useState(null);
  
  // États pour contrôler l'affichage
  const [showForm, setShowForm] = useState(false);
  const [actionsCompleted, setActionsCompleted] = useState(false);
  const [hasActions, setHasActions] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ✅ CORRECTION MAJEURE: Récupérer les actions avec la nouvelle route publique
  useEffect(() => {
    const detectRedirectAndActions = async () => {
      // Extraire la destination de l'URL
      const pathParts = window.location.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      
      // Si ce n'est pas un userId MongoDB, c'est une destination
      if (lastPart && lastPart.length !== 24 && !lastPart.match(/^[0-9a-fA-F]{24}$/)) {
        setFinalRedirectUrl(`https://${lastPart}`);
        console.log('🌐 Redirection finale détectée:', `https://${lastPart}`);
      }
      
      // ✅ CORRECTION: Utiliser la nouvelle route publique
      try {
        const actualUserId = userId || '507f1f77bcf86cd799439011';
        console.log('🔍 Récupération des données de carte pour userId:', actualUserId);
        
        // ✅ NOUVEAU: Utiliser la route publique spécifique
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/business-cards/public/${actualUserId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const cardData = await response.json();
          console.log('📋 Données de carte récupérées:', cardData);
          
          setBusinessCardData(cardData);
          
          if (cardData.cardConfig && cardData.cardConfig.actions && cardData.cardConfig.actions.length > 0) {
            // ✅ CORRECTION: Filtrer SEULEMENT les actions actives
            const activeActions = cardData.cardConfig.actions.filter(action => action.active === true);
            setBusinessCardActions(activeActions);
            setHasActions(activeActions.length > 0);
            
            console.log('✅ Actions actives trouvées:', activeActions);
            console.log('📊 Nombre d\'actions actives:', activeActions.length);
            
            // ✅ CORRECTION: Déterminer si on affiche le formulaire
            const hasFormAction = activeActions.some(action => action.type === 'form');
            setShowForm(hasFormAction);
            
            console.log(`📝 Affichage du formulaire: ${hasFormAction ? 'OUI' : 'NON'}`);
            
          } else {
            console.log('ℹ️ Aucune action configurée ou aucune action active');
            setBusinessCardActions([]);
            setHasActions(false);
            setShowForm(false);
          }
        } else if (response.status === 404) {
          console.log('ℹ️ Aucune carte de visite configurée pour cet utilisateur');
          setBusinessCardActions([]);
          setHasActions(false);
          setShowForm(false);
        } else {
          console.log('⚠️ Erreur lors de la récupération:', response.status);
          setBusinessCardActions([]);
          setHasActions(false);
          setShowForm(false);
        }
      } catch (error) {
        console.log('ℹ️ Erreur lors de la récupération des données de carte:', error);
        setBusinessCardActions([]);
        setHasActions(false);
        setShowForm(false);
      }
      
      setDataLoaded(true);
    };

    detectRedirectAndActions();
  }, [userId]);

  // ✅ CORRECTION: Exécuter les actions SEULEMENT après chargement complet
  useEffect(() => {
    if (dataLoaded && hasActions && businessCardActions.length > 0 && !actionsExecutedRef.current) {
      actionsExecutedRef.current = true;
      console.log('🎬 Démarrage de l\'exécution des actions configurées');
      console.log('📋 Actions à exécuter:', businessCardActions);
      
      setTimeout(() => {
        executeBusinessCardActions();
      }, 1000);
    } else if (dataLoaded && !hasActions) {
      console.log('ℹ️ Aucune action configurée - redirection directe');
      // Redirection immédiate si pas d'actions
      setTimeout(() => {
        if (finalRedirectUrl) {
          console.log('🌐 Redirection immédiate vers:', finalRedirectUrl);
          window.location.href = finalRedirectUrl;
        } else {
          console.log('🌐 Redirection par défaut vers Google');
          window.location.href = 'https://google.com';
        }
      }, 2000);
    }
  }, [dataLoaded, hasActions, businessCardActions, finalRedirectUrl]);

  // ✅ CORRECTION: Exécuter SEULEMENT les actions configurées
  const executeBusinessCardActions = async () => {
    if (!hasActions || businessCardActions.length === 0) {
      console.log('ℹ️ Aucune action à exécuter');
      return;
    }

    console.log('🎬 Début d\'exécution des actions:', businessCardActions);

    for (const action of businessCardActions) {
      try {
        console.log(`🎯 Exécution de l'action: ${action.type} (ID: ${action.id})`);
        
        // Attendre le délai configuré
        if (action.delay > 0) {
          console.log(`⏳ Attente de ${action.delay}ms pour l'action ${action.type}`);
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }

        switch (action.type) {
          case 'download':
            console.log('📥 Exécution de l\'action de téléchargement');
            await executeDownloadAction(action);
            break;
          case 'form':
            console.log('📝 Action formulaire - affichage du formulaire');
            setShowForm(true);
            break;
          case 'website':
            console.log(`🌐 Action de redirection vers: ${action.url}`);
            if (action.url) {
              setTimeout(() => {
                window.location.href = action.url;
              }, 1000);
            }
            break;
          default:
            console.log(`❓ Type d'action non reconnu: ${action.type}`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'exécution de l'action ${action.type}:`, error);
      }
    }
    
    setActionsCompleted(true);
    console.log('✅ Toutes les actions ont été exécutées');
    
    // Si pas de formulaire et redirection finale, rediriger après les actions
    if (!showForm && finalRedirectUrl) {
      setTimeout(() => {
        console.log('🌐 Redirection automatique vers:', finalRedirectUrl);
        window.location.href = finalRedirectUrl;
      }, 3000);
    } else if (!showForm && !finalRedirectUrl) {
      setTimeout(() => {
        console.log('🌐 Redirection par défaut vers Google');
        window.location.href = 'https://google.com';
      }, 3000);
    }
  };

  // Téléchargement avec les vraies données
  const executeDownloadAction = async (action) => {
    try {
      console.log('📥 Génération de la carte de visite pour téléchargement...');
      
      if (action.file === 'carte-apercu') {
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
      
      if (finalRedirectUrl) {
        actualUserId = userId || '507f1f77bcf86cd799439011';
      }

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
        if (finalRedirectUrl) {
          console.log('🌐 Redirection vers:', finalRedirectUrl);
          window.location.href = finalRedirectUrl;
        } else {
          window.location.href = 'https://google.com';
        }
      }, 2000);
      
    } catch (err) {
      console.error("❌ Erreur inscription client:", err);
      setError(err.message || "Erreur d'inscription du client");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU: Affichage conditionnel selon les actions configurées
  
  // Attendre le chargement des données
  if (!dataLoaded) {
    return (
      <div className="register-client-container">
        <div className="loading-container">
          <div className="loading-message">
            <h2>⏳ Chargement...</h2>
            <p>Récupération de la configuration...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Si aucune action configurée → Redirection directe
  if (!hasActions && !showForm) {
    return (
      <div className="register-client-container">
        <div className="no-actions-container">
          <div className="no-actions-message">
            <h2>🌐 Redirection en cours...</h2>
            <p>Aucune action configurée. Redirection automatique.</p>
            
            {finalRedirectUrl ? (
              <div className="redirect-info">
                <p>Redirection vers <strong>{finalRedirectUrl}</strong>...</p>
              </div>
            ) : (
              <div className="redirect-info">
                <p>Redirection vers <strong>Google</strong>...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Si actions configurées mais pas de formulaire → Actions uniquement
  if (hasActions && !showForm && !actionsCompleted) {
    return (
      <div className="register-client-container">
        <div className="download-only-container">
          <div className="download-message">
            <h2>📥 Actions en cours...</h2>
            <p>Exécution des actions configurées pour votre carte de visite.</p>
            
            <div className="actions-list">
              <h3>Actions configurées :</h3>
              <ul>
                {businessCardActions.map((action, index) => (
                  <li key={action.id}>
                    {action.type === 'download' && '📥 Téléchargement automatique'}
                    {action.type === 'website' && `🌐 Redirection vers ${action.url}`}
                    {action.type === 'form' && '📝 Formulaire d\'inscription'}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="manual-download-section">
              <button 
                onClick={handleManualDownload}
                className="manual-download-btn"
              >
                📥 Télécharger manuellement
              </button>
              <p className="download-help">Cliquez pour télécharger la carte de visite</p>
            </div>
            
            {finalRedirectUrl && (
              <div className="redirect-notice">
                <span className="redirect-icon">🌐</span>
                <span>Redirection vers <strong>{finalRedirectUrl}</strong> après les actions...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Si actions terminées sans formulaire → Message de fin
  if (hasActions && actionsCompleted && !showForm) {
    return (
      <div className="register-client-container">
        <div className="actions-completed">
          <div className="completion-message">
            <h2>✅ Actions terminées</h2>
            <p>Toutes les actions configurées ont été exécutées avec succès.</p>
            
            {finalRedirectUrl && (
              <div className="redirect-info">
                <p>Redirection vers <strong>{finalRedirectUrl}</strong> dans quelques secondes...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Affichage du formulaire (SEULEMENT si action form configurée)
  return (
    <div className="register-client-container">
      <form onSubmit={handleRegister} className="register-form">
        <h2>📝 Inscription Prospect</h2>
        <p className="form-subtitle">Remplissez vos informations pour être recontacté</p>
        
        {/* Bouton de téléchargement manuel si données disponibles */}
        {businessCardData && (
          <div className="manual-download-section">
            <button 
              type="button"
              onClick={handleManualDownload}
              className="manual-download-btn"
              disabled={loading || success}
            >
              📥 Télécharger la carte de visite
            </button>
            <p className="download-help">Cliquez pour télécharger votre carte de visite avec QR code</p>
          </div>
        )}
        
        {finalRedirectUrl && (
          <div className="redirect-notice">
            <span className="redirect-icon">🌐</span>
            <span>Après inscription, vous serez redirigé vers: <strong>{finalRedirectUrl}</strong></span>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            ✅ Inscription réussie ! 
            {finalRedirectUrl 
              ? ` Redirection vers ${finalRedirectUrl} dans 2 secondes...` 
              : ' Redirection vers Google dans 2 secondes...'
            }
          </div>
        )}
        
        {/* Informations principales */}
        <div className="form-section">
          <h3>👤 Informations personnelles</h3>
          
          <input
            type="text"
            placeholder="Nom et prénom *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={success}
          />
          
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={success}
          />
          
          <input
            type="tel"
            placeholder="Téléphone *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={success}
          />
        </div>

        {/* Adresse */}
        <div className="form-section">
          <h3>📍 Adresse</h3>
          
          <input
            type="text"
            placeholder="Adresse (rue, numéro)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={success}
          />
          
          <div className="form-row">
            <input
              type="text"
              placeholder="Code postal"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={success}
              maxLength={5}
            />
            
            <input
              type="text"
              placeholder="Ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={success}
            />
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="form-section">
          <h3>🏢 Informations complémentaires</h3>
          
          <input
            type="text"
            placeholder="Entreprise / Organisation"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={success}
          />
          
          <textarea
            placeholder="Votre projet, besoins, commentaires..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={success}
            rows={3}
          />
        </div>
        
        <button type="submit" disabled={loading || success} className="submit-btn">
          {loading ? "Inscription en cours..." : success ? "Inscription réussie !" : "✅ S'inscrire"}
        </button>
        
        <p className="form-footer">
          * Champs obligatoires • Vos données sont sécurisées
        </p>
      </form>
    </div>
  );
};

export default RegisterClient;