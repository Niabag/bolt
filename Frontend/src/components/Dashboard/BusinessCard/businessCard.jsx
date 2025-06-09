import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { API_ENDPOINTS, FRONTEND_ROUTES, apiRequest } from '../../../config/api';
import './businessCard.scss';

const BusinessCard = ({ userId, user }) => {
  const [cardConfig, setCardConfig] = useState({
    cardImage: '/images/modern-business-card-design-template-42551612346d5b08984f0b61a8044609_screen.jpg',
    showQR: true,
    qrPosition: 'top-right',
    qrSize: 100,
    actions: []
  });
  
  const [qrValue, setQrValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedCardData, setSavedCardData] = useState(null);
  
  // ✅ NOUVEAU: États pour les schémas prédéfinis
  const [showSchemasModal, setShowSchemasModal] = useState(false);
  
  const [stats, setStats] = useState({
    scansToday: 0,
    scansThisMonth: 0,
    totalScans: 0,
    conversions: 0
  });

  // ✅ NOUVEAU: Schémas d'actions prédéfinis professionnels
  const actionSchemas = {
    'contact-website': {
      name: '📝 Contact → Site Web',
      description: 'Formulaire de contact professionnel puis redirection vers votre site',
      icon: '📝🌐',
      sequence: 'Formulaire (1s) → Site web (2s)',
      category: 'Génération de leads',
      actions: [
        { type: 'form', order: 1, delay: 1000, active: true },
        { type: 'website', order: 2, delay: 2000, active: true, url: 'https://www.votre-site.com' }
      ]
    },
    'contact-download': {
      name: '📝 Contact → Téléchargement',
      description: 'Formulaire de contact puis téléchargement automatique de votre carte',
      icon: '📝📥',
      sequence: 'Formulaire (1s) → Téléchargement (2s)',
      category: 'Capture de leads',
      actions: [
        { type: 'form', order: 1, delay: 1000, active: true },
        { type: 'download', order: 2, delay: 2000, active: true, file: 'carte-apercu' }
      ]
    },
    'contact-download-website': {
      name: '📝 Contact → Téléchargement → Site',
      description: 'Séquence complète : contact, téléchargement puis redirection',
      icon: '📝📥🌐',
      sequence: 'Formulaire (1s) → Téléchargement (2s) → Site web (3s)',
      category: 'Conversion maximale',
      actions: [
        { type: 'form', order: 1, delay: 1000, active: true },
        { type: 'download', order: 2, delay: 2000, active: true, file: 'carte-apercu' },
        { type: 'website', order: 3, delay: 3000, active: true, url: 'https://www.votre-site.com' }
      ]
    },
    'website-direct': {
      name: '🌐 Site Web Direct',
      description: 'Redirection immédiate vers votre site web principal',
      icon: '🌐',
      sequence: 'Site web (1s)',
      category: 'Redirection simple',
      actions: [
        { type: 'website', order: 1, delay: 1000, active: true, url: 'https://www.votre-site.com' }
      ]
    },
    'contact-only': {
      name: '📝 Formulaire Uniquement',
      description: 'Affichage du formulaire de contact professionnel seulement',
      icon: '📝',
      sequence: 'Formulaire (1s)',
      category: 'Capture simple',
      actions: [
        { type: 'form', order: 1, delay: 1000, active: true }
      ]
    },
    'download-only': {
      name: '📥 Téléchargement Direct',
      description: 'Téléchargement automatique de votre carte de visite',
      icon: '📥',
      sequence: 'Téléchargement (1s)',
      category: 'Partage direct',
      actions: [
        { type: 'download', order: 1, delay: 1000, active: true, file: 'carte-apercu' }
      ]
    }
  };

  useEffect(() => {
    if (userId) {
      generateQRCode();
      fetchStats();
      loadSavedBusinessCard();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      generateQRCode();
    }
  }, [cardConfig.actions, userId]);

  const loadSavedBusinessCard = async () => {
    try {
      const savedCard = await apiRequest(API_ENDPOINTS.BUSINESS_CARDS.BASE);
      setSavedCardData(savedCard);
      
      if (savedCard.cardConfig) {
        setCardConfig(prev => ({
          ...prev,
          ...savedCard.cardConfig,
          cardImage: savedCard.cardImage || prev.cardImage
        }));
      }
      
      console.log('✅ Carte de visite chargée depuis la BDD');
    } catch (error) {
      console.log('ℹ️ Aucune carte de visite sauvegardée trouvée, utilisation des paramètres par défaut');
    }
  };

  const generateQRCode = () => {
    if (!userId) {
      console.error("❌ userId manquant pour générer le QR code");
      return;
    }
    
    try {
      const redirectAction = cardConfig.actions.find(action => 
        action.active && action.type === 'website'
      );
      
      let targetUrl;
      if (redirectAction && redirectAction.url) {
        try {
          const url = new URL(redirectAction.url);
          targetUrl = `${window.location.origin}/register-client/${encodeURIComponent(redirectAction.url)}`;
          console.log("🌐 URL de redirection construite:", targetUrl);
        } catch (urlError) {
          console.error("❌ URL invalide:", redirectAction.url);
          targetUrl = `${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}`;
        }
      } else {
        targetUrl = `${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}`;
      }
      
      setQrValue(targetUrl);
      console.log("✅ QR code généré:", targetUrl);
    } catch (error) {
      console.error("❌ Erreur lors de la génération du QR code:", error);
      setQrValue(`${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}`);
    }
  };

  const fetchStats = async () => {
    try {
      const mockStats = {
        scansToday: Math.floor(Math.random() * 50) + 10,
        scansThisMonth: Math.floor(Math.random() * 500) + 100,
        totalScans: Math.floor(Math.random() * 2000) + 500,
        conversions: Math.floor(Math.random() * 100) + 20
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleCardImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result;
        
        setCardConfig(prev => ({
          ...prev,
          cardImage: imageData
        }));
        
        await saveBusinessCardToDB(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ NOUVELLE FONCTION: Appliquer un schéma prédéfini
  const handleApplySchema = async (schemaKey) => {
    const schema = actionSchemas[schemaKey];
    if (!schema) return;

    console.log('🎯 Application du schéma:', schema.name);
    console.log('📋 Actions du schéma:', schema.actions);

    // Créer les actions avec des IDs uniques
    const actionsWithIds = schema.actions.map((action, index) => ({
      ...action,
      id: Date.now() + index,
      order: action.order || (index + 1),
      delay: action.delay || ((index + 1) * 1000)
    }));

    const updatedConfig = {
      ...cardConfig,
      actions: actionsWithIds
    };

    setCardConfig(updatedConfig);
    await saveBusinessCardToDB(null, updatedConfig);
    
    setShowSchemasModal(false);
    showSuccessMessage(`✅ Schéma "${schema.name}" appliqué avec succès !`);
  };

  // ✅ NOUVELLE FONCTION: Réinitialiser toutes les actions
  const handleClearAllActions = async () => {
    const confirmClear = window.confirm(
      "❗ Supprimer toutes les actions configurées ?"
    );
    if (!confirmClear) return;

    const updatedConfig = {
      ...cardConfig,
      actions: []
    };

    setCardConfig(updatedConfig);
    await saveBusinessCardToDB(null, updatedConfig);
    
    showSuccessMessage('✅ Toutes les actions ont été supprimées');
  };

  // ✅ FONCTION SIMPLIFIÉE: Modifier l'URL d'un schéma
  const handleEditSchemaUrl = async (actionId, newUrl) => {
    const updatedActions = cardConfig.actions.map(action =>
      action.id === actionId ? { ...action, url: newUrl } : action
    );
    
    const updatedConfig = {
      ...cardConfig,
      actions: updatedActions
    };
    
    setCardConfig(updatedConfig);
    await saveBusinessCardToDB(null, updatedConfig);
    
    showSuccessMessage('✅ URL mise à jour');
  };

  const saveBusinessCardToDB = async (cardImage = null, config = null) => {
    try {
      setLoading(true);
      
      const configToSave = config || cardConfig;
      
      const cleanedConfig = {
        showQR: Boolean(configToSave.showQR !== undefined ? configToSave.showQR : true),
        qrPosition: ['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(configToSave.qrPosition) 
          ? configToSave.qrPosition 
          : 'top-right',
        qrSize: Math.max(50, Math.min(200, Number(configToSave.qrSize) || 100)),
        actions: Array.isArray(configToSave.actions) ? configToSave.actions : []
      };
      
      const dataToSave = {
        cardImage: cardImage || cardConfig.cardImage,
        cardConfig: cleanedConfig
      };
      
      const response = await apiRequest(API_ENDPOINTS.BUSINESS_CARDS.BASE, {
        method: 'POST',
        body: JSON.stringify(dataToSave)
      });
      
      setSavedCardData(response.businessCard);
      setCardConfig(prev => ({
        ...prev,
        ...response.businessCard.cardConfig,
        cardImage: response.businessCard.cardImage
      }));
      console.log('✅ Carte de visite sauvegardée en BDD');
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde carte de visite:', error);
      showErrorMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    const successMsg = document.createElement('div');
    successMsg.textContent = message;
    successMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #48bb78;
      color: white;
      padding: 15px 25px;
      border-radius: 12px;
      z-index: 9999;
      font-weight: 600;
      box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
      font-size: 14px;
    `;
    document.body.appendChild(successMsg);
    setTimeout(() => {
      if (document.body.contains(successMsg)) {
        document.body.removeChild(successMsg);
      }
    }, 4000);
  };

  const showErrorMessage = (message) => {
    const errorMsg = document.createElement('div');
    errorMsg.textContent = message;
    errorMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f56565;
      color: white;
      padding: 15px 25px;
      border-radius: 12px;
      z-index: 9999;
      font-weight: 600;
      box-shadow: 0 8px 25px rgba(245, 101, 101, 0.4);
      font-size: 14px;
    `;
    document.body.appendChild(errorMsg);
    setTimeout(() => {
      if (document.body.contains(errorMsg)) {
        document.body.removeChild(errorMsg);
      }
    }, 4000);
  };

  const handleConfigChange = async (field, value) => {
    const newConfig = {
      ...cardConfig,
      [field]: value
    };
    
    setCardConfig(newConfig);
    
    if (savedCardData) {
      await saveBusinessCardToDB(null, newConfig);
    }
  };

  const downloadBusinessCard = async () => {
    try {
      setLoading(true);
      console.log('📥 Génération de la carte de visite avec QR code intégré...');
      
      const cardUrl = await captureCardPreviewWithQR();
      
      if (cardUrl) {
        const link = document.createElement('a');
        link.download = 'carte-de-visite-avec-qr.png';
        link.href = cardUrl;
        link.click();
        
        showSuccessMessage('✅ Carte avec QR code téléchargée !');
      }
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      showErrorMessage('❌ Erreur lors du téléchargement');
    } finally {
      setLoading(false);
    }
  };

  const captureCardPreviewWithQR = async () => {
    return new Promise(async (resolve) => {
      try {
        const { default: html2canvas } = await import('html2canvas');
        
        const previewElement = document.querySelector('.business-card-preview');
        
        if (!previewElement) {
          console.error('❌ Élément d\'aperçu non trouvé');
          const fallbackUrl = await generateBusinessCardWithQR();
          resolve(fallbackUrl);
          return;
        }

        console.log('📸 Capture de l\'aperçu de la carte avec QR code...');

        const canvas = await html2canvas(previewElement, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: previewElement.offsetWidth,
          height: previewElement.offsetHeight,
          logging: false
        });

        const dataUrl = canvas.toDataURL('image/png');
        console.log('✅ Aperçu de carte avec QR code capturé avec succès');
        resolve(dataUrl);
        
      } catch (error) {
        console.error('❌ Erreur lors de la capture:', error);
        const fallbackUrl = await generateBusinessCardWithQR();
        resolve(fallbackUrl);
      }
    });
  };

  const generateBusinessCardWithQR = async () => {
    return new Promise(async (resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 1012;
        canvas.height = 638;
        
        if (cardConfig.cardImage && cardConfig.cardImage !== '/images/modern-business-card-design-template-42551612346d5b08984f0b61a8044609_screen.jpg') {
          try {
            await new Promise((resolveImage, rejectImage) => {
              const cardImage = new Image();
              cardImage.onload = async () => {
                ctx.drawImage(cardImage, 0, 0, canvas.width, canvas.height);
                
                if (cardConfig.showQR && qrValue) {
                  await addQRCodeToCanvas(ctx, canvas);
                }
                
                resolveImage();
              };
              
              cardImage.onerror = () => {
                rejectImage();
              };
              
              cardImage.src = cardConfig.cardImage;
            });
          } catch (imageError) {
            await generateDefaultCard(ctx, canvas);
          }
        } else {
          await generateDefaultCard(ctx, canvas);
        }
        
        resolve(canvas.toDataURL('image/png'));
        
      } catch (error) {
        console.error('❌ Erreur génération carte:', error);
        resolve(null);
      }
    });
  };

  const addQRCodeToCanvas = async (ctx, canvas) => {
    try {
      const qrSize = cardConfig.qrSize || 100;
      const position = cardConfig.qrPosition || 'top-right';
      
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
      
      try {
        const QRCode = await import('qrcode');
        const qrDataUrl = await QRCode.default.toDataURL(qrValue, {
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
            ctx.fillStyle = 'white';
            ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
            
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
            resolve();
          };
          qrImage.src = qrDataUrl;
        });
        
      } catch (qrError) {
        console.log('⚠️ Erreur QRCode, utilisation du fallback');
        ctx.fillStyle = 'white';
        ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
        ctx.fillStyle = 'black';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR', qrX + qrSize/2, qrY + qrSize/2);
      }
    } catch (error) {
      console.error('❌ Erreur ajout QR code:', error);
    }
  };

  const generateDefaultCard = async (ctx, canvas) => {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CARTE DE VISITE NUMÉRIQUE', canvas.width / 2, 80);
    
    ctx.font = '32px Arial';
    ctx.fillText(user?.name || 'Votre Nom', canvas.width / 2, 140);
    
    ctx.font = '24px Arial';
    ctx.fillText(user?.email || 'votre.email@exemple.com', canvas.width / 2, 180);
    
    if (cardConfig.showQR && qrValue) {
      await addQRCodeToCanvas(ctx, canvas);
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('📱 Scannez le QR code pour vous inscrire', 40, canvas.height - 80);
    ctx.fillText('💼 Recevez automatiquement nos informations', 40, canvas.height - 50);
  };

  const downloadCardImageOnly = async () => {
    try {
      setLoading(true);
      console.log('📥 Téléchargement de l\'image de carte seule...');
      
      if (cardConfig.cardImage && cardConfig.cardImage !== '/images/modern-business-card-design-template-42551612346d5b08984f0b61a8044609_screen.jpg') {
        const link = document.createElement('a');
        link.download = 'carte-de-visite-image.png';
        link.href = cardConfig.cardImage;
        link.click();
        
        showSuccessMessage('✅ Image de carte téléchargée !');
      } else {
        showErrorMessage('❌ Utilisez l\'image par défaut ou importez votre propre image');
      }
    } catch (error) {
      console.error('❌ Erreur téléchargement image:', error);
      showErrorMessage('❌ Erreur lors du téléchargement');
    } finally {
      setLoading(false);
    }
  };

  const copyQRLink = () => {
    if (qrValue) {
      navigator.clipboard.writeText(qrValue);
      showSuccessMessage('✅ Lien copié !');
    } else {
      showErrorMessage('❌ Aucun QR code généré');
    }
  };

  const testQRCode = () => {
    if (qrValue) {
      window.open(qrValue, '_blank');
    } else {
      showErrorMessage('❌ Aucun QR code généré');
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'download': return '📥';
      case 'form': return '📝';
      case 'website': return '🌐';
      default: return '❓';
    }
  };

  const getActionLabel = (type) => {
    switch (type) {
      case 'download': return 'Téléchargement';
      case 'form': return 'Formulaire';
      case 'website': return 'Site web';
      default: return 'Inconnu';
    }
  };

  const getFileDisplayName = (filePath) => {
    if (!filePath) return '';
    
    if (filePath === 'carte-apercu') {
      return 'Carte de visite';
    }
    
    if (filePath === '/images/carte-de-visite.png') {
      return 'Carte de visite';
    }
    
    const fileName = filePath.split('/').pop();
    return fileName || filePath;
  };

  return (
    <div className="business-card-container">
      {/* Statistiques en haut */}
      <div className="stats-header">
        <div className="stats-overview">
          <div className="stat-card highlight">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.totalScans}</h3>
              <p>Scans totaux</p>
              <span className="stat-trend">+{stats.scansToday} aujourd'hui</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.scansThisMonth}</h3>
              <p>Ce mois</p>
              <span className="stat-trend">+{Math.round((stats.scansThisMonth / 30) * 100) / 100}/jour</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{stats.conversions}</h3>
              <p>Conversions</p>
              <span className="stat-trend">Prospects inscrits</span>
            </div>
          </div>
        </div>
      </div>

      {/* En-tête */}
      <div className="card-header">
        <h2>💼 Carte de Visite Numérique</h2>
        <p>Créez et personnalisez votre carte de visite avec QR code intelligent</p>
      </div>

      {/* Layout en colonnes */}
      <div className="card-main-content">
        {/* Colonne de gauche - Configuration */}
        <div className="card-config-column">
          <div className="config-section">
            <h3>🎨 Design de la carte</h3>
            
            <div className="form-group">
              <label>Image de la carte de visite :</label>
              <div className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCardImageUpload}
                  id="card-image-upload"
                  disabled={loading}
                />
                <label htmlFor="card-image-upload" className="upload-btn">
                  {loading ? '⏳ Sauvegarde...' : '📷 Choisir une image'}
                </label>
              </div>
              {savedCardData && (
                <p className="save-status">✅ Image sauvegardée en base de données</p>
              )}
              
              <div className="download-buttons">
                <button 
                  onClick={downloadCardImageOnly}
                  className="download-image-btn"
                  disabled={loading}
                  title="Télécharger l'image seule"
                >
                  📷 Image seule
                </button>
                <button 
                  onClick={downloadBusinessCard}
                  className="download-with-qr-btn"
                  disabled={loading}
                  title="Télécharger avec QR code"
                >
                  📥 Avec QR code
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={cardConfig.showQR}
                  onChange={(e) => handleConfigChange('showQR', e.target.checked)}
                />
                Afficher le QR code sur la carte
              </label>
            </div>

            {cardConfig.showQR && (
              <>
                <div className="form-group">
                  <label>Position du QR code :</label>
                  <select
                    value={cardConfig.qrPosition}
                    onChange={(e) => handleConfigChange('qrPosition', e.target.value)}
                  >
                    <option value="top-right">Haut droite</option>
                    <option value="top-left">Haut gauche</option>
                    <option value="bottom-right">Bas droite</option>
                    <option value="bottom-left">Bas gauche</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Taille du QR code :</label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={cardConfig.qrSize}
                    onChange={(e) => handleConfigChange('qrSize', parseInt(e.target.value))}
                  />
                  <span>{cardConfig.qrSize}px</span>
                </div>
              </>
            )}
          </div>

          {/* ✅ NOUVELLE SECTION: Schémas prédéfinis professionnels */}
          <div className="config-section">
            <h3>🎯 Schémas d'Actions Professionnels</h3>
            <p className="section-description">
              Choisissez un schéma prêt à l'emploi pour optimiser la conversion de vos prospects
            </p>

            <div className="schemas-actions">
              <button 
                onClick={() => setShowSchemasModal(true)}
                className="schemas-btn"
              >
                🎨 Choisir un schéma
              </button>
              
              {cardConfig.actions.length > 0 && (
                <button 
                  onClick={handleClearAllActions}
                  className="clear-all-btn"
                >
                  🗑️ Tout supprimer
                </button>
              )}
            </div>

            {/* Aperçu du schéma actuel */}
            {cardConfig.actions.length > 0 && (
              <div className="current-schema-preview">
                <h4>📋 Schéma actuel :</h4>
                <div className="schema-sequence">
                  {cardConfig.actions
                    .sort((a, b) => (a.order || 1) - (b.order || 1))
                    .map((action, index) => (
                      <span key={action.id} className="schema-step">
                        {getActionIcon(action.type)} {getActionLabel(action.type)}
                        {index < cardConfig.actions.length - 1 && ' → '}
                      </span>
                    ))}
                </div>
                
                {/* ✅ NOUVEAU: Édition rapide des URLs */}
                <div className="schema-edit-section">
                  {cardConfig.actions
                    .filter(action => action.type === 'website')
                    .map(action => (
                      <div key={action.id} className="url-edit-group">
                        <label>🌐 URL du site web :</label>
                        <input
                          type="url"
                          value={action.url || ''}
                          onChange={(e) => handleEditSchemaUrl(action.id, e.target.value)}
                          placeholder="https://www.votre-site.com"
                          className="url-edit-input"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colonne de droite - Aperçu */}
        <div className="card-preview-column">
          {/* Aperçu de la carte */}
          <div className="card-preview">
            <h3>👁️ Aperçu de la carte</h3>
            
            <div className="preview-container">
              <div className="business-card-preview">
                <img 
                  src={cardConfig.cardImage} 
                  alt="Carte de visite"
                  className="card-image"
                />
                
                {cardConfig.showQR && qrValue && (
                  <div className={`qr-overlay ${cardConfig.qrPosition}`}>
                    <QRCode 
                      value={qrValue} 
                      size={cardConfig.qrSize * 0.6}
                      bgColor="white"
                      fgColor="black"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="preview-actions">
              <button onClick={downloadBusinessCard} className="btn-download" disabled={loading}>
                {loading ? '⏳ Génération...' : '💾 Télécharger avec QR code'}
              </button>
            </div>
          </div>

          {/* QR Code et actions */}
          <div className="qr-section">
            <h3>📱 QR Code Intelligent</h3>
            
            <div className="qr-display">
              <div className="qr-code-wrapper">
                {qrValue ? (
                  <QRCode 
                    value={qrValue} 
                    size={200}
                    bgColor="white"
                    fgColor="black"
                  />
                ) : (
                  <div className="qr-placeholder">
                    <p>⏳ Génération du QR code...</p>
                    <button onClick={generateQRCode} className="btn-generate-qr">
                      🔄 Générer le QR code
                    </button>
                  </div>
                )}
              </div>
              
              <div className="qr-info">
                <div className="qr-details">
                  {qrValue && (
                    <div className="qr-link">
                      <strong>Lien :</strong>
                      <a href={qrValue} target="_blank" rel="noopener noreferrer">
                        {qrValue.length > 40 ? qrValue.substring(0, 40) + '...' : qrValue}
                      </a>
                    </div>
                  )}
                  {cardConfig.actions.filter(a => a.active).length > 0 && (
                    <div className="qr-actions-info">
                      <strong>Actions configurées :</strong>
                      <ul>
                        {cardConfig.actions
                          .filter(a => a.active)
                          .sort((a, b) => (a.order || 1) - (b.order || 1))
                          .map((action) => (
                            <li key={action.id}>
                              {getActionIcon(action.type)} {getActionLabel(action.type)}
                              {action.delay > 0 && ` (+${action.delay}ms)`}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="qr-actions">
                  <button onClick={copyQRLink} className="btn-copy" disabled={!qrValue}>
                    📋 Copier le lien
                  </button>
                  
                  <button onClick={testQRCode} className="btn-test" disabled={!qrValue}>
                    🧪 Tester le QR code
                  </button>
                  
                  <button onClick={generateQRCode} className="btn-refresh">
                    🔄 Régénérer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NOUVELLE MODAL: Sélection de schémas professionnels */}
      {showSchemasModal && (
        <div className="modal-overlay" onClick={() => setShowSchemasModal(false)}>
          <div className="modal-content schemas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎯 Schémas d'Actions Professionnels</h3>
              <button 
                onClick={() => setShowSchemasModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p className="schemas-description">
                Sélectionnez un schéma optimisé pour maximiser la conversion de vos prospects :
              </p>
              
              <div className="schemas-grid">
                {Object.entries(actionSchemas).map(([key, schema]) => (
                  <div 
                    key={key} 
                    className="schema-card"
                    onClick={() => handleApplySchema(key)}
                  >
                    <div className="schema-header">
                      <div className="schema-icon">{schema.icon}</div>
                      <div className="schema-category">{schema.category}</div>
                    </div>
                    <h4>{schema.name}</h4>
                    <p className="schema-description">{schema.description}</p>
                    <div className="schema-sequence-preview">
                      <strong>Séquence :</strong>
                      <span>{schema.sequence}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowSchemasModal(false)}
                className="btn-cancel"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessCard;