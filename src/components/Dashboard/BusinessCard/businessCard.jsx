import { useState, useEffect, useRef } from 'react';
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
  
  // États pour les schémas prédéfinis
  const [showSchemasModal, setShowSchemasModal] = useState(false);
  
  const [stats, setStats] = useState({
    scansToday: 0,
    scansThisMonth: 0,
    totalScans: 0,
    conversions: 0
  });

  // Référence pour l'aperçu de la carte
  const cardPreviewRef = useRef(null);

  // SCHÉMAS: Séquences d'actions prédéfinies
  const actionSchemas = {
    'website-only': {
      name: '🌐 Site Web Direct',
      description: 'Redirection immédiate vers votre site web principal',
      icon: '🌐',
      sequence: 'Site web (1s)',
      category: 'Redirection simple',
      actions: [
        { id: Date.now(), type: 'website', order: 1, delay: 1000, active: true, url: 'https://www.votre-site.com' }
      ]
    },
    'form-website': {
      name: '📝→🌐 Formulaire puis Site',
      description: 'Collecte des informations avant de rediriger vers votre site web',
      icon: '📝🌐',
      sequence: 'Formulaire (1s) → Site web (2s)',
      category: 'Engagement progressif',
      actions: [
        { id: Date.now(), type: 'form', order: 1, delay: 1000, active: true },
        { id: Date.now() + 1, type: 'website', order: 2, delay: 2000, active: true, url: 'https://www.votre-site.com' }
      ]
    },
    'contact-download': {
      name: '📝→📥 Contact → Carte',
      description: 'Formulaire de contact puis téléchargement de votre carte de visite',
      icon: '📝📥',
      sequence: 'Formulaire (1s) → Téléchargement carte (2s)',
      category: 'Capture de leads',
      actions: [
        { id: Date.now(), type: 'form', order: 1, delay: 1000, active: true },
        { id: Date.now() + 1, type: 'download', order: 2, delay: 2000, active: true, file: 'carte-visite' }
      ]
    },
    'funnel-site-last': {
      name: '🎯 Site en Dernier',
      description: 'Formulaire puis téléchargement avant d\'ouvrir le site web',
      icon: '📝📥🌐',
      sequence: 'Formulaire (1s) → Carte (2s) → Site web (3s)',
      category: 'Tunnel de conversion',
      actions: [
        { id: Date.now(), type: 'form', order: 1, delay: 1000, active: true },
        { id: Date.now() + 1, type: 'download', order: 2, delay: 2000, active: true, file: 'carte-visite' },
        { id: Date.now() + 2, type: 'website', order: 3, delay: 3000, active: true, url: 'https://www.votre-site.com' }
      ]
    },
    'contact-only': {
      name: '📝 Contact Uniquement',
      description: 'Formulaire de contact professionnel pour capturer les prospects',
      icon: '📝',
      sequence: 'Formulaire (1s)',
      category: 'Capture simple',
      actions: [
        { id: Date.now(), type: 'form', order: 1, delay: 1000, active: true }
      ]
    },
    'card-download': {
      name: '📥 Carte de Visite',
      description: 'Téléchargement direct de votre carte de visite personnalisée',
      icon: '📥',
      sequence: 'Téléchargement carte (1s)',
      category: 'Partage direct',
      actions: [
        { id: Date.now(), type: 'download', order: 1, delay: 1000, active: true, file: 'carte-visite' }
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
      // Générer l'URL de redirection pour le QR code
      const targetUrl = `${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}`;
      setQrValue(targetUrl);
      console.log("✅ QR code généré:", targetUrl);
    } catch (error) {
      console.error("❌ Erreur lors de la génération du QR code:", error);
      setQrValue(`${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}`);
    }
  };

  const fetchStats = async () => {
    try {
      // Récupérer les statistiques réelles depuis l'API
      const cardStats = await apiRequest(API_ENDPOINTS.BUSINESS_CARDS.STATS(userId));
      
      if (cardStats) {
        setStats({
          scansToday: cardStats.scansToday || 0,
          scansThisMonth: cardStats.scansThisMonth || 0,
          totalScans: cardStats.totalScans || 0,
          conversions: cardStats.conversions || 0
        });
        console.log("✅ Statistiques de carte chargées:", cardStats);
      }
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

  // Appliquer un schéma prédéfini
  const handleApplySchema = async (schemaKey) => {
    const schema = actionSchemas[schemaKey];
    if (!schema) return;

    console.log('🎯 Application du schéma:', schema.name);
    
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

  // Réinitialiser toutes les actions
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

  // Modifier l'URL d'un schéma
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
        qrSize: Math.max(100, Math.min(200, Number(configToSave.qrSize) || 100)),
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      z-index: 9999;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
      font-size: 14px;
      border: 1px solid rgba(255, 255, 255, 0.2);
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
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      z-index: 9999;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);
      font-size: 14px;
      border: 1px solid rgba(255, 255, 255, 0.2);
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

  // Téléchargement de la vraie carte de visite
  const downloadBusinessCard = async () => {
    try {
      setLoading(true);
      console.log('📥 Génération de la carte de visite personnalisée avec QR code...');
      
      // NOUVELLE APPROCHE: Utiliser l'aperçu de la carte directement
      if (cardPreviewRef.current) {
        // Utiliser html2canvas pour capturer l'aperçu
        const html2canvas = (await import('html2canvas')).default;
        
        const canvas = await html2canvas(cardPreviewRef.current, {
          scale: 2, // Meilleure qualité
          useCORS: true,
          allowTaint: true,
          backgroundColor: null
        });
        
        // Convertir le canvas en image
        const imageData = canvas.toDataURL('image/png');
        
        // Télécharger l'image
        const link = document.createElement('a');
        link.download = `carte-visite-${user?.name || 'numerique'}.png`;
        link.href = imageData;
        link.click();
        
        showSuccessMessage('✅ Votre carte de visite a été téléchargée !');
      } else {
        showErrorMessage('❌ Erreur: Impossible de générer l\'aperçu');
      }
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      showErrorMessage('❌ Erreur lors du téléchargement');
    } finally {
      setLoading(false);
    }
  };

  const downloadCardImageOnly = async () => {
    try {
      setLoading(true);
      console.log('📥 Téléchargement du template seul...');
      
      if (cardConfig.cardImage && cardConfig.cardImage !== '/images/modern-business-card-design-template-42551612346d5b08984f0b61a8044609_screen.jpg') {
        const link = document.createElement('a');
        link.download = `carte-template-${Date.now()}.png`;
        link.href = cardConfig.cardImage;
        link.click();
        
        showSuccessMessage('✅ Template de carte téléchargé !');
      } else {
        showErrorMessage('❌ Veuillez d\'abord importer votre propre image');
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
      showSuccessMessage('✅ Lien copié dans le presse-papiers !');
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
      case 'download': return 'Téléchargement carte';
      case 'form': return 'Formulaire contact';
      case 'website': return 'Site web';
      default: return 'Inconnu';
    }
  };

  const getFileDisplayName = (filePath) => {
    if (!filePath) return '';
    
    if (filePath === 'carte-visite' || filePath === 'carte-apercu') {
      return 'Carte de visite personnalisée';
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
        <p>Créez et personnalisez votre carte de visite intelligente avec QR code</p>
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
                    min="100"
                    max="200"
                    value={cardConfig.qrSize}
                    onChange={(e) => handleConfigChange('qrSize', parseInt(e.target.value))}
                  />
                  <span>{cardConfig.qrSize}px</span>
                </div>
              </>
            )}
          </div>

          {/* SECTION: Schémas prédéfinis professionnels */}
          <div className="config-section">
            <h3>🚀 Schémas de Conversion</h3>
            <p className="section-description">
              Choisissez une stratégie optimisée pour maximiser vos conversions
            </p>

            <div className="schemas-actions">
              <button 
                onClick={() => setShowSchemasModal(true)}
                className="schemas-btn"
              >
                🎯 Choisir une stratégie
              </button>
              
              {cardConfig.actions.length > 0 && (
                <button 
                  onClick={handleClearAllActions}
                  className="clear-all-btn"
                >
                  🗑️ Réinitialiser
                </button>
              )}
            </div>

            {/* Aperçu du schéma actuel */}
            {cardConfig.actions.length > 0 && (
              <div className="current-schema-preview">
                <h4>🎯 Stratégie Active :</h4>
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
                
                {/* Édition rapide des URLs */}
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
              <div className="business-card-preview" ref={cardPreviewRef}>
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
                      fgColor="#1f2937"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="preview-actions">
              <button onClick={downloadBusinessCard} className="btn-download" disabled={loading}>
                {loading ? '⏳ Génération...' : '💾 Télécharger la carte complète'}
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
                    fgColor="#1f2937"
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

      {/* MODAL: Sélection de schémas professionnels */}
      {showSchemasModal && (
        <div className="modal-overlay" onClick={() => setShowSchemasModal(false)}>
          <div className="modal-content schemas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚀 Stratégies de Conversion</h3>
              <button 
                onClick={() => setShowSchemasModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p className="schemas-description">
                Sélectionnez une stratégie optimisée pour maximiser la conversion de vos prospects :
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
                title="Annuler"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessCard;