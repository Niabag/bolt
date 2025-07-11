import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../config/api';
import { getSubscriptionStatus, createPortalSession, createCheckoutSession, startFreeTrial, SUBSCRIPTION_STATUS, getTrialDaysRemaining, DEFAULT_TRIAL_DAYS } from '../../services/subscription';
import { generateExportPdf } from '../../utils/generateExportPdf';

import './settings.scss';

const Settings = () => {
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
      console.error('Erreur lors du chargement des données d\'abonnement:', error);
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
      setFormData(prev => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImageUpload = async (e) => {
    e.preventDefault();
    if (!formData.profileImage) return;
    setLoading(true);
    setMessage('');
    try {
      await apiRequest(API_ENDPOINTS.AUTH.UPDATE_PROFILE_PICTURE, {
        method: 'PUT',
        body: JSON.stringify({ profileImage: formData.profileImage })
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
      console.error("Error creating portal session:", error);
      setMessage(`❌ Erreur: Impossible d'accéder au portail d'abonnement`);
    } finally {
      setProcessingSubscription(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessingCheckout(true);
    setMessage('');
    try {
      const priceId = 'price_1OqXYZHGJMCmVBnT8YgYbL3M';
      const { url } = await createCheckoutSession(priceId);
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
  const [importFormat, setImportFormat] = useState('csv');
  const fileInputRef = useRef(null);

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

  const importData = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) {
      setMessage('❌ Sélectionnez un fichier à importer');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('format', importFormat);
      await apiRequest(API_ENDPOINTS.CLIENTS.IMPORT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: form,
      });
      setMessage('✅ Prospects importés avec succès');
    } catch (error) {
      setMessage(`❌ Erreur lors de l'import: ${error.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        {/* Subscription Section */}
        <section className="settings-section subscription-section">
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
                onChange={handleProfileImageChange}
              />
              {formData.profileImage && (
                <img src={formData.profileImage} alt="Aperçu" className="profile-preview" />
              )}
              <button onClick={handleProfileImageUpload} disabled={loading || !formData.profileImage} style={{marginTop:'0.5rem'}}>
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
            <div className="export-options">
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
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
              <div className="import-options" style={{ marginTop: '0.5rem' }}>
                <select value={importFormat} onChange={e => setImportFormat(e.target.value)}>
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel</option>
                  <option value="json">JSON</option>
                  <option value="pdf">PDF</option>
                  <option value="vcf">vCard</option>
                </select>
              </div>
              <div className="file-upload" style={{ marginTop: '0.5rem' }}>
                <input
                  type="file"
                  id="prospects-file"
                  ref={fileInputRef}
                  accept={importFormat === 'vcf' ? '.vcf,.vcard' : `.${importFormat}`}
                  disabled={loading}
                />
                <label htmlFor="prospects-file" className="upload-btn">
                  📂 Choisir un fichier
                </label>
              </div>
              <button onClick={importData} disabled={loading} className="import-btn" style={{ marginTop: '0.5rem' }}>
                📤 Importer des prospects
              </button>
            </div>
          </section>

        <section className="settings-section">
          <h3>ℹ️ Informations de l'application</h3>
          <div className="app-info">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Dernière connexion:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
            <p><strong>ID utilisateur:</strong> {user.userId}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
