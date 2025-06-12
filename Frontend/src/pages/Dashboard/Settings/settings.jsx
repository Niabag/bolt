import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import { getSubscriptionStatus, createPortalSession, createCheckoutSession, startFreeTrial, SUBSCRIPTION_STATUS, getTrialDaysRemaining, DEFAULT_TRIAL_DAYS, SUBSCRIPTION_PLANS } from '../../../services/subscription';
import { generateExportPdf } from '../../../utils/generateExportPdf';
import './settings.scss';

const Settings = ({ onDataImported }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [subscription, setSubscription] = useState(null);
  const [processingSubscription, setProcessingSubscription] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS.MONTHLY.id);
  const currentPlan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === selectedPlan);
  const fileInputRef = useRef(null);
  const profileImageInputRef = useRef(null);
  const [importFormat, setImportFormat] = useState('csv');
  const subscriptionSectionRef = useRef(null);
  
  useEffect(() => {
    fetchUserData();
    fetchSubscriptionData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await apiRequest(API_ENDPOINTS.AUTH.ME);
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        name: userData.name || '',
        email: userData.email || '',
        profileImage: userData.profileImage || ''
      }));
      // Update localStorage and notify other components about the change
      localStorage.setItem('user', JSON.stringify(userData));
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: userData }));
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    }
  };

  const fetchSubscriptionData = async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscription(status);
    } catch (error) {
      console.error("Erreur lors du chargement des données d'abonnement:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setFormData(prev => ({ ...prev, profileImage: dataUrl }));
      handleProfileImageUpload(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImageButtonClick = () => {
    if (!formData.profileImage) {
      profileImageInputRef.current?.click();
    } else {
      handleProfileImageUpload();
    }
  };

  const handleProfileImageUpload = async (imageData = formData.profileImage) => {
    if (!imageData) return;
    setLoading(true);
    setMessage('');
    try {
      await apiRequest(API_ENDPOINTS.AUTH.UPDATE_PROFILE_PICTURE, {
        method: 'PUT',
        body: JSON.stringify({ profileImage: imageData })
      });
      setMessage('✅ Photo de profil mise à jour');
      fetchUserData();
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await apiRequest(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      });

      setMessage('✅ Profil mis à jour avec succès');
      fetchUserData();
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('❌ Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage('❌ Le nouveau mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      await apiRequest(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      setMessage('✅ Mot de passe modifié avec succès');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setProcessingSubscription(true);
    try {
      const { url } = await createPortalSession();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      setMessage("❌ Erreur: Impossible d'accéder au portail d'abonnement");
    } finally {
      setProcessingSubscription(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessingCheckout(true);
    setMessage('');
    try {
      const { url } = await createCheckoutSession(selectedPlan);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setMessage("❌ Erreur: Impossible de créer la session de paiement");
    } finally {
      setProcessingCheckout(false);
    }
  };

  const handleStartTrial = async () => {
    setProcessingCheckout(true);
    setMessage('');
    try {
      await startFreeTrial(DEFAULT_TRIAL_DAYS);
      await fetchSubscriptionData();
    } catch (error) {
      console.error('Error starting free trial:', error);
      setMessage("❌ Erreur: Impossible de démarrer l'essai gratuit");
    } finally {
      setProcessingCheckout(false);
    }
  };

  const [exportFormat, setExportFormat] = useState('json');

  const exportData = async () => {
    try {
      setLoading(true);
      const [clients, devis, invoices] = await Promise.all([
        apiRequest(API_ENDPOINTS.CLIENTS.BASE),
        apiRequest(API_ENDPOINTS.DEVIS.BASE),
        apiRequest(API_ENDPOINTS.INVOICES.BASE)
      ]);

      const exportData = {
        user: user,
        clients: clients,
        devis: devis,
        invoices: invoices,
        exportDate: new Date().toISOString()
      };

      const dateStr = new Date().toISOString().split('T')[0];

      if (exportFormat === 'pdf') {
        await generateExportPdf(exportData, dateStr);
      } else if (exportFormat === 'xlsx') {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        const wsClients = XLSX.utils.json_to_sheet(clients);
        XLSX.utils.book_append_sheet(wb, wsClients, 'Clients');
        const wsDevis = XLSX.utils.json_to_sheet(devis);
        XLSX.utils.book_append_sheet(wb, wsDevis, 'Devis');
        const wsInvoices = XLSX.utils.json_to_sheet(invoices);
        XLSX.utils.book_append_sheet(wb, wsInvoices, 'Factures');
        XLSX.writeFile(wb, `crm-export-${dateStr}.xlsx`);
      } else if (exportFormat === 'vcf') {
        const vcardStr = clients.map(c => `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nEMAIL:${c.email}\nTEL:${c.phone}\nORG:${c.company || ''}\nEND:VCARD`).join('\n');
        const blob = new Blob([vcardStr], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `crm-export-${dateStr}.vcf`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `crm-export-${dateStr}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      setMessage('✅ Données exportées avec succès');
    } catch (error) {
      setMessage(`❌ Erreur lors de l'export: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProspectsFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier que le format du fichier correspond au format sélectionné
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const expectedExtension = importFormat === 'xlsx' ? 'xlsx' : 'csv';
      
      if (fileExtension !== expectedExtension) {
        setMessage(`❌ Format de fichier incorrect. Vous avez sélectionné un fichier .${fileExtension} mais le format choisi est ${importFormat}`);
        // Réinitialiser le champ de fichier
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      // Tout est bon, procéder à l'import
      importData(file);
    }
  };

  const importData = async (selectedFile) => {
    const file = selectedFile || fileInputRef.current?.files[0];
    if (!file) {
      setMessage('❌ Sélectionnez un fichier à importer');
      return;
    }
    
    // Vérifier si l'utilisateur a un abonnement actif
    if (!hasValidSubscription()) {
      setMessage('❌ L\'importation de prospects est réservée aux utilisateurs avec un abonnement actif');
      if (subscriptionSectionRef.current) {
        subscriptionSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      // Créer un FormData pour l'envoi du fichier
      const form = new FormData();
      form.append('file', file);
      
      // Ajouter explicitement le format dans la requête
      console.log(`📊 Import de prospects au format ${importFormat}`);
      form.append('format', importFormat);
      
      const response = await apiRequest(API_ENDPOINTS.CLIENTS.IMPORT, {
        method: 'POST',
        // Ne pas inclure Content-Type ici, il sera automatiquement défini avec le boundary
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: form,
      });
      
      // Afficher un message de succès avec les détails
      setMessage(`✅ Import réussi : ${response.created} prospect(s) importé(s) sur ${response.total} entrée(s)`);
      
      // Forcer un rafraîchissement complet des clients
      if (typeof onDataImported === 'function') {
        onDataImported();
      }
      
      // Réinitialiser le champ de fichier
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      
      // Message d'erreur plus détaillé
      let errorMessage = `❌ Erreur lors de l'import: ${error.message}`;
      
      // Ajouter des informations spécifiques selon le format
      if (importFormat === 'xlsx' && error.message.includes('xlsx')) {
        errorMessage += ". Vérifiez que votre fichier Excel est au format XLSX valide.";
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur a un abonnement valide
  const hasValidSubscription = () => {
    if (!subscription) return false;
    
    return subscription.status === SUBSCRIPTION_STATUS.ACTIVE;
  };

  const getSubscriptionStatusText = () => {
    if (!subscription) return "Chargement...";

    switch (subscription.status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return "Actif";
      case SUBSCRIPTION_STATUS.TRIAL:
        const daysRemaining = getTrialDaysRemaining(subscription.trialEndDate);
        return `Essai gratuit (${daysRemaining} jour${daysRemaining !== 1 ? 's' : ''} restant${daysRemaining !== 1 ? 's' : ''})`;
      case SUBSCRIPTION_STATUS.EXPIRED:
        return "Essai expiré";
      case SUBSCRIPTION_STATUS.CANCELED:
        return "Annulé";
      case SUBSCRIPTION_STATUS.PAST_DUE:
        return "Paiement en retard";
      default:
        return "Inconnu";
    }
  };

  const getSubscriptionStatusColor = () => {
    if (!subscription) return "#64748b";

    switch (subscription.status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return "#10b981";
      case SUBSCRIPTION_STATUS.TRIAL:
        return "#f59e0b";
      case SUBSCRIPTION_STATUS.EXPIRED:
      case SUBSCRIPTION_STATUS.CANCELED:
      case SUBSCRIPTION_STATUS.PAST_DUE:
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  return (
    <div className="settings-container">
      <h2>⚙️ Paramètres</h2>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="settings-sections">
        <section className="settings-section subscription-section" ref={subscriptionSectionRef}>
          <h3>💳 Abonnement</h3>
          <div className="subscription-info">
            <div className="subscription-status">
              <div className="info-label">Statut de l'abonnement:</div>
              <div
                className="status-value"
                style={{ color: getSubscriptionStatusColor() }}
              >
                {getSubscriptionStatusText()}
              </div>
            </div>

            {subscription && subscription.currentPeriodEnd && (
              <div className="subscription-period">
                <div className="info-label">Prochaine facturation:</div>
                <div className="period-value">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}

            {subscription && subscription.trialStartDate && (
              <div className="trial-period">
                <div className="info-label">Période d'essai:</div>
                <div className="period-value">
                  {new Date(subscription.trialStartDate).toLocaleDateString('fr-FR')} - {new Date(subscription.trialEndDate).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}

            {subscription && subscription.status !== SUBSCRIPTION_STATUS.ACTIVE && (
              <div className="plan-selector">
                <h4>Choisissez votre plan</h4>
                <div className="plan-toggle">
                  <button
                    className={`toggle-btn ${selectedPlan === SUBSCRIPTION_PLANS.MONTHLY.id ? 'active' : ''}`}
                    onClick={() => setSelectedPlan(SUBSCRIPTION_PLANS.MONTHLY.id)}
                  >
                    Mensuel
                  </button>
                  <button
                    className={`toggle-btn ${selectedPlan === SUBSCRIPTION_PLANS.QUARTERLY.id ? 'active' : ''}`}
                    onClick={() => setSelectedPlan(SUBSCRIPTION_PLANS.QUARTERLY.id)}
                  >
                    Trimestriel <span className="savings-badge">Économisez {SUBSCRIPTION_PLANS.QUARTERLY.savings}</span>
                  </button>
                  <button
                    className={`toggle-btn ${selectedPlan === SUBSCRIPTION_PLANS.ANNUAL.id ? 'active' : ''}`}
                    onClick={() => setSelectedPlan(SUBSCRIPTION_PLANS.ANNUAL.id)}
                  >
                    Annuel <span className="savings-badge">Économisez {SUBSCRIPTION_PLANS.ANNUAL.savings}</span>
                  </button>
                </div>
                <div className="selected-plan-price">
                  {currentPlan.price}€/{currentPlan.period}
                </div>
              </div>
            )}

            {subscription &&
              subscription.status !== SUBSCRIPTION_STATUS.ACTIVE &&
              !subscription.hasHadTrial && (
                <button
                  onClick={handleStartTrial}
                  className="trial-button"
                  disabled={processingCheckout}
                >
                  {processingCheckout ?
                    'Activation...' : `Commencer l'essai gratuit (${DEFAULT_TRIAL_DAYS} jours)`}
                </button>
            )}

            {subscription && subscription.status !== SUBSCRIPTION_STATUS.ACTIVE && (
              <button
                onClick={handleSubscribe}
                className="subscribe-btn"
                disabled={processingCheckout}
              >
                {processingCheckout ? 'Redirection...' : "S'abonner"}
              </button>
            )}

            {subscription && subscription.status === SUBSCRIPTION_STATUS.ACTIVE && (
              <button
                onClick={handleManageSubscription}
                className="manage-subscription-btn"
                disabled={processingSubscription}
              >
                {processingSubscription ? 'Chargement...' : 'Gérer mon abonnement'}
              </button>
            )}
          </div>
        </section>

        <section className="settings-section">
          <h3>👤 Informations du profil</h3>
          <form onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label htmlFor="name">Nom</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="profileImage">Photo de profil</label>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                ref={profileImageInputRef}
                onChange={handleProfileImageChange}
                style={{ display: 'none' }}
              />
              {formData.profileImage && (
                <img src={formData.profileImage} alt="Aperçu" className="profile-preview" />
              )}
              <button
                onClick={handleProfileImageButtonClick}
                disabled={loading}
                style={{ marginTop: '0.5rem' }}
              >
                {loading ? 'Envoi...' : 'Mettre à jour la photo'}
              </button>
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
            </button>
          </form>
        </section>

        <section className="settings-section">
          <h3>🔒 Changer le mot de passe</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label htmlFor="currentPassword">Mot de passe actuel</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">Nouveau mot de passe</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                minLength={6}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                minLength={6}
                required
              />
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </form>
        </section>

        <section className="settings-section">
          <h3>📊 Gestion des données</h3>
          <div className="data-actions">
            <h4 className="data-section-title">📥 Exporter vos données</h4>
            <div className="export-options">
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="data-select">
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel</option>
                <option value="vcf">vCard</option>
              </select>
              <button onClick={exportData} disabled={loading} className="export-btn">
                📥 Exporter mes données
              </button>
            </div>
            <p className="help-text">
              Téléchargez toutes vos données (clients, devis) dans le format sélectionné
            </p>
            
            <div className="import-actions">
              <div className="import-header">
                <h4>Importer des prospects</h4>
                <p className="import-description">
                  {hasValidSubscription() 
                    ? "Importez vos prospects depuis un fichier CSV ou Excel" 
                    : "⚠️ Fonctionnalité réservée aux abonnés"}
                </p>
              </div>
              
              {hasValidSubscription() ? (
                <>
                  <div className="import-controls">
                    <div className="format-selector">
                      <label htmlFor="importFormat">Format du fichier :</label>
                      <select
                        id="importFormat"
                        value={importFormat}
                        onChange={(e) => setImportFormat(e.target.value)}
                        className="format-select"
                      >
                        <option value="csv">CSV</option>
                        <option value="xlsx">Excel (XLSX)</option>
                      </select>
                    </div>
                    
                    <div className="file-upload-container">
                      <input
                        type="file"
                        id="prospects-file"
                        ref={fileInputRef}
                        accept={importFormat === 'xlsx' ? '.xlsx' : '.csv'}
                        onChange={handleProspectsFileChange}
                        className="file-input"
                        disabled={loading}
                      />
                      <label htmlFor="prospects-file" className="file-upload-btn">
                        {loading ? '⏳ Chargement...' : '📂 Sélectionner un fichier'}
                      </label>
                    </div>
                  </div>
                  
                  <div className="import-help">
                    <p>Formats supportés :</p>
                    <ul className="format-list">
                      <li><strong>CSV</strong> - Fichier texte avec valeurs séparées par des virgules ou points-virgules</li>
                      <li><strong>XLSX</strong> - Fichier Excel</li>
                    </ul>
                    <a href="/docs/ImportProspects.md" target="_blank" className="help-link">Voir la documentation d'import</a>
                  </div>
                </>
              ) : (
                <div className="subscription-required-notice">
                  <div className="notice-icon">🔒</div>
                  <div className="notice-content">
                    <h5>Fonctionnalité Premium</h5>
                    <p>L'importation de prospects est disponible uniquement avec un abonnement actif.</p>
                    <button 
                      onClick={handleSubscribe}
                      className="upgrade-btn"
                      disabled={processingCheckout}
                    >
                      {processingCheckout 
                        ? 'Chargement...' 
                        : "S'abonner maintenant"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h3>ℹ️ Informations de l'application</h3>
          <div className="app-info">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Dernière mise à jour:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
            <p><strong>ID utilisateur:</strong> {user.userId}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;