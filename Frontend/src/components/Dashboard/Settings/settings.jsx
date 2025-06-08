import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './settings.scss';

const Settings = () => {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await apiRequest(API_ENDPOINTS.AUTH.ME);
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        name: userData.name || '',
        email: userData.email || ''
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const exportData = async () => {
    try {
      setLoading(true);
      const [clients, devis] = await Promise.all([
        apiRequest(API_ENDPOINTS.CLIENTS.BASE),
        apiRequest(API_ENDPOINTS.DEVIS.BASE)
      ]);

      const exportData = {
        user: user,
        clients: clients,
        devis: devis,
        exportDate: new Date().toISOString()
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `crm-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      setMessage('✅ Données exportées avec succès');
    } catch (error) {
      setMessage(`❌ Erreur lors de l'export: ${error.message}`);
    } finally {
      setLoading(false);
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
            <button onClick={exportData} disabled={loading} className="export-btn">
              📥 Exporter mes données
            </button>
            <p className="help-text">
              Téléchargez toutes vos données (clients, devis) au format JSON
            </p>
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