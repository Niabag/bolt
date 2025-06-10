import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './prospectEdit.scss';

const ProspectEditPage = ({ prospect, onBack, onSave }) => {
  const navigate = useNavigate();
  const [prospectData, setProspectData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Initialiser les données du prospect
  useEffect(() => {
    if (prospect) {
      setProspectData({
        ...prospect,
        company: prospect.company || '',
        notes: prospect.notes || '',
        address: prospect.address || '',
        postalCode: prospect.postalCode || '',
        city: prospect.city || ''
      });
    }
  }, [prospect]);

  const handleInputChange = (field, value) => {
    setProspectData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ FONCTION CORRIGÉE: Changement de statut avec cycle harmonisé
  const handleStatusClick = async () => {
    if (!prospectData) return;
    
    let newStatus;
    
    // ✅ CYCLE FINAL SIMPLIFIÉ: nouveau -> en_attente -> active -> inactive -> nouveau
    switch (prospectData.status) {
      case 'nouveau':
        newStatus = 'en_attente';
        break;
      case 'en_attente':
        newStatus = 'active';
        break;
      case 'active':
        newStatus = 'inactive';
        break;
      case 'inactive':
        newStatus = 'nouveau';
        break;
      // ✅ GESTION DES ANCIENS STATUTS (MIGRATION)
      case 'pending':
        newStatus = 'en_attente'; // Convertir pending vers en_attente
        break;
      default:
        newStatus = 'en_attente';
    }
    
    console.log(`🔄 Changement de statut: ${prospectData.status} → ${newStatus}`); // ✅ DEBUG
    
    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.UPDATE_STATUS(prospectData._id), {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      // Mettre à jour l'état local
      setProspectData(prev => ({ ...prev, status: newStatus }));
      
      console.log(`✅ Statut changé: ${prospectData.status} → ${newStatus}`);
    } catch (err) {
      console.error("Erreur changement statut:", err);
      alert(`❌ Erreur lors du changement de statut: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!prospectData) return;

    setSaving(true);
    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.UPDATE(prospectData._id), {
        method: "PUT",
        body: JSON.stringify({
          name: prospectData.name,
          email: prospectData.email,
          phone: prospectData.phone,
          company: prospectData.company,
          notes: prospectData.notes,
          address: prospectData.address,
          postalCode: prospectData.postalCode,
          city: prospectData.city,
          status: prospectData.status
        }),
      });

      alert("✅ Prospect modifié avec succès");
      if (onSave) {
        onSave();
      } else {
        onBack ? onBack() : navigate(-1);
      }
    } catch (err) {
      console.error("Erreur modification prospect:", err);
      alert(`❌ Erreur lors de la modification: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!prospectData) return;
    
    const confirmDelete = window.confirm(
      `❗ Supprimer définitivement le prospect "${prospectData.name}" et tous ses devis ?`
    );
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.DELETE(prospectData._id), {
        method: "DELETE",
      });

      alert("✅ Prospect supprimé avec succès");
      if (onBack) {
        onBack();
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error("Erreur suppression prospect:", err);
      alert(`❌ Échec suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FONCTIONS CORRIGÉES: Gestion des statuts harmonisée
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#48bb78';
      case 'inactive': return '#f56565';
      case 'nouveau': return '#4299e1';
      case 'en_attente': return '#9f7aea'; // ✅ Violet pour "en attente"
      // ✅ GESTION DES ANCIENS STATUTS (MIGRATION)
      case 'pending': return '#ed8936'; // Orange pour pending (ancien)
      default: return '#4299e1';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'nouveau': return 'Nouveau';
      case 'en_attente': return 'En attente'; // ✅ CORRIGÉ
      // ✅ GESTION DES ANCIENS STATUTS (MIGRATION)
      case 'pending': return 'En cours'; // Ancien statut
      default: return 'Nouveau';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '🔴';
      case 'nouveau': return '🔵';
      case 'en_attente': return '🟣'; // ✅ Violet pour "en attente"
      // ✅ GESTION DES ANCIENS STATUTS (MIGRATION)
      case 'pending': return '🟡'; // Orange pour pending (ancien)
      default: return '🔵';
    }
  };

  const getNextStatusLabel = (status) => {
    switch (status) {
      case 'nouveau': return 'Passer en Attente';
      case 'en_attente': return 'Passer en Actif'; // ✅ CORRIGÉ
      case 'active': return 'Passer en Inactif';
      case 'inactive': return 'Remettre en Nouveau';
      // ✅ GESTION DES ANCIENS STATUTS (MIGRATION)
      case 'pending': return 'Convertir en Attente';
      default: return 'Changer le statut';
    }
  };

  if (error) {
    return (
      <div className="prospect-edit-page">
        <div className="error-container">
          <h2>❌ Erreur</h2>
          <p>{error}</p>
          <button onClick={onBack || (() => navigate(-1))} className="btn-back">
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  if (loading && !prospectData) {
    return (
      <div className="prospect-edit-page">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Chargement du prospect...</p>
        </div>
      </div>
    );
  }

  if (!prospectData) {
    return (
      <div className="prospect-edit-page">
        <div className="error-container">
          <h2>❌ Prospect introuvable</h2>
          <p>Le prospect demandé n'existe pas ou a été supprimé.</p>
          <button onClick={onBack || (() => navigate(-1))} className="btn-back">
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="prospect-edit-page">
      <div className="edit-container">
        {/* En-tête avec avatar et statut */}
        <div className="edit-header">
          <button onClick={onBack || (() => navigate(-1))} className="btn-back">
            ← Retour
          </button>
          
          <div className="prospect-header-info">
            <div className="prospect-avatar-large">
              {prospectData.name ? prospectData.name.charAt(0).toUpperCase() : "?"}
            </div>
            
            <div className="prospect-title">
              <h1>{prospectData.name}</h1>
              <p className="prospect-subtitle">Modification du prospect</p>
            </div>

            {/* ✅ INDICATEUR DE STATUT CLIQUABLE (SANS POPUP) */}
            <div 
              className="status-indicator-large clickable"
              style={{ backgroundColor: getStatusColor(prospectData.status) }}
              onClick={handleStatusClick}
              title={getNextStatusLabel(prospectData.status)}
            >
              <div className="status-icon">{getStatusIcon(prospectData.status)}</div>
              <div className="status-text">{getStatusLabel(prospectData.status)}</div>
              <div className="status-hint">Cliquer pour changer</div>
            </div>
          </div>
        </div>

        {/* Formulaire de modification */}
        <form onSubmit={handleSave} className="edit-form">
          <div className="form-section">
            <h3>📋 Informations principales</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nom complet *</label>
                <input
                  type="text"
                  id="name"
                  value={prospectData.name}
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
                  value={prospectData.email}
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
                  value={prospectData.phone}
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
                  value={prospectData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Nom de l'entreprise"
                />
              </div>
            </div>
          </div>

          {/* ✅ NOUVELLE SECTION: Adresse */}
          <div className="form-section">
            <h3>📍 Adresse</h3>
            
            <div className="form-group">
              <label htmlFor="address">Adresse</label>
              <input
                type="text"
                id="address"
                value={prospectData.address}
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
                  value={prospectData.postalCode}
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
                  value={prospectData.city}
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
                value={prospectData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notes sur le prospect, besoins, historique des échanges..."
                rows={4}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>⚙️ Paramètres</h3>
            
            <div className="form-group">
              <label htmlFor="status">Statut du prospect</label>
              <select
                id="status"
                value={prospectData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="nouveau">🔵 Nouveau</option>
                <option value="en_attente">🟣 En attente</option>
                <option value="active">🟢 Actif</option>
                <option value="inactive">🔴 Inactif</option>
              </select>
            </div>

            <div className="info-section">
              <div className="info-item">
                <span className="info-label">Date d'inscription :</span>
                <span className="info-value">
                  {new Date(prospectData.createdAt || Date.now()).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Dernière modification :</span>
                <span className="info-value">
                  {new Date(prospectData.updatedAt || prospectData.createdAt || Date.now()).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">ID Prospect :</span>
                <span className="info-value">{prospectData._id}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onBack || (() => navigate(-1))}
              className="btn-cancel"
              title="Annuler"
            >
              ✕
            </button>
            
            <button 
              type="button" 
              onClick={handleDelete}
              className="btn-delete"
              disabled={loading}
            >
              {loading ? "Suppression..." : "🗑️ Supprimer"}
            </button>
            
            <button 
              type="submit" 
              className="btn-save"
              disabled={saving}
            >
              {saving ? "Enregistrement..." : "💾 Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProspectEditPage;