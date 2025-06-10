import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './prospectEdit.scss';

const ProspectCreatePage = ({ userId, onBack, onCreated }) => {
  const navigate = useNavigate();
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.REGISTER(userId), {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      alert('✅ Prospect créé avec succès');
      if (onCreated) {
        onCreated();
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error('Erreur création prospect:', err);
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="prospect-edit-page in-dashboard">
      <div className="edit-container">
        <div className="edit-header">
          <button onClick={onBack || (() => navigate(-1))} className="btn-back">
            ← Retour
          </button>
          <div className="prospect-header-info">
            <div className="prospect-avatar-large">+</div>
            <div className="prospect-title">
              <h1>Nouveau prospect</h1>
              <p className="prospect-subtitle">Ajout manuel d'un prospect</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-container">
            <p>❌ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-section">
            <h3>📋 Informations principales</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nom complet *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="Nom et prénom"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="email@exemple.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Téléphone *</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="form-group">
                <label htmlFor="company">Entreprise</label>
                <input
                  type="text"
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Nom de l'entreprise"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>📍 Adresse</h3>
            <div className="form-group">
              <label htmlFor="address">Adresse</label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Rue, numéro, bâtiment..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="postalCode">Code postal</label>
                <input
                  type="text"
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="75000"
                  maxLength={5}
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">Ville</label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Paris"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>📝 Notes et commentaires</h3>
            <div className="form-group">
              <label htmlFor="notes">Notes internes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notes sur le prospect, besoins, historique des échanges..."
                rows={4}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onBack || (() => navigate(-1))}
              className="btn-cancel"
            >
              Annuler
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Enregistrement...' : '💾 Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProspectCreatePage;
