import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './prospects.scss';

const ProspectsPage = ({ clients = [], onRefresh, onViewClientDevis }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState([]);
  
  // ✅ NOUVEAU: États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9; // Maximum 9 clients par page

  // Filtrer et trier les prospects
  const filteredProspects = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.phone.includes(searchTerm) ||
                           (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase())) || // ✅ NOUVEAU
                           (client.city && client.city.toLowerCase().includes(searchTerm.toLowerCase())); // ✅ NOUVEAU
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && client.status === 'active') ||
                           (statusFilter === 'inactive' && client.status === 'inactive') ||
                           (statusFilter === 'nouveau' && client.status === 'nouveau') ||
                           (statusFilter === 'en_attente' && client.status === 'en_attente'); // ✅ CORRIGÉ
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'date':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

  // ✅ NOUVEAU: Calculs de pagination
  const totalPages = Math.ceil(filteredProspects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProspects = filteredProspects.slice(startIndex, endIndex);

  // ✅ NOUVEAU: Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  // ✅ NOUVEAU: Réinitialiser la sélection quand on change de page
  useEffect(() => {
    setSelectedProspects([]);
  }, [currentPage]);

  const handleDeleteClient = async (clientId) => {
    const client = clients.find(c => c._id === clientId);
    const confirmDelete = window.confirm(
      `❗ Supprimer le prospect "${client?.name}" et tous ses devis ?`
    );
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.DELETE(clientId), {
        method: "DELETE",
      });

      onRefresh && onRefresh();
      alert("✅ Prospect supprimé avec succès");
      
      // ✅ NOUVEAU: Ajuster la page si nécessaire après suppression
      const newFilteredLength = filteredProspects.length - 1;
      const newTotalPages = Math.ceil(newFilteredLength / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("Erreur suppression prospect:", err);
      alert(`❌ Échec suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FONCTION CORRIGÉE: Changement de statut avec cycle correct
  const handleStatusClick = async (clientId, currentStatus) => {
    let newStatus;
    
    // ✅ CYCLE FINAL SIMPLIFIÉ: nouveau -> en_attente -> active -> inactive -> nouveau
    switch (currentStatus) {
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
    
    console.log(`🔄 Changement de statut: ${currentStatus} → ${newStatus}`); // ✅ DEBUG
    
    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.UPDATE_STATUS(clientId), {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      onRefresh && onRefresh();
      console.log(`✅ Statut changé: ${currentStatus} → ${newStatus}`);
    } catch (err) {
      console.error("Erreur changement statut:", err);
      alert(`❌ Erreur lors du changement de statut: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProspect = (prospect) => {
    navigate(`/prospect/edit/${prospect._id}`);
  };

  const handleSelectProspect = (clientId) => {
    setSelectedProspects(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProspects.length === currentProspects.length) {
      setSelectedProspects([]);
    } else {
      setSelectedProspects(currentProspects.map(p => p._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProspects.length === 0) return;
    
    const confirmDelete = window.confirm(
      `❗ Supprimer ${selectedProspects.length} prospect(s) sélectionné(s) ?`
    );
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await Promise.all(
        selectedProspects.map(id => 
          apiRequest(API_ENDPOINTS.CLIENTS.DELETE(id), { method: "DELETE" })
        )
      );

      setSelectedProspects([]);
      onRefresh && onRefresh();
      alert(`✅ ${selectedProspects.length} prospect(s) supprimé(s)`);
      
      // ✅ NOUVEAU: Ajuster la page après suppression en masse
      const newFilteredLength = filteredProspects.length - selectedProspects.length;
      const newTotalPages = Math.ceil(newFilteredLength / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("Erreur suppression en masse:", err);
      alert(`❌ Erreur lors de la suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU: Fonctions de navigation de pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // ✅ NOUVEAU: Générer les numéros de pages à afficher
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
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
      case 'nouveau': return 'Cliquer pour passer en Attente';
      case 'en_attente': return 'Cliquer pour passer en Actif'; // ✅ CORRIGÉ
      case 'active': return 'Cliquer pour passer en Inactif';
      case 'inactive': return 'Cliquer pour remettre en Nouveau';
      // ✅ GESTION DES ANCIENS STATUTS (MIGRATION)
      case 'pending': return 'Cliquer pour convertir en Attente';
      default: return 'Cliquer pour changer le statut';
    }
  };

  // ✅ NOUVELLE FONCTION: Formater l'adresse complète
  const formatAddress = (prospect) => {
    const parts = [];
    if (prospect.address) parts.push(prospect.address);
    if (prospect.postalCode && prospect.city) {
      parts.push(`${prospect.postalCode} ${prospect.city}`);
    } else if (prospect.city) {
      parts.push(prospect.city);
    }
    return parts.join(', ');
  };

  return (
    <div className="prospects-page">
      {/* En-tête avec titre et statistiques */}
      <div className="prospects-header">
        <div className="header-content">
          <h1 className="page-title">👥 Mes Prospects</h1>
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-number">{clients.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{filteredProspects.length}</span>
              <span className="stat-label">Affichés</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{selectedProspects.length}</span>
              <span className="stat-label">Sélectionnés</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{clients.filter(c => c.status === 'nouveau').length}</span>
              <span className="stat-label">🔵 Nouveaux</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{clients.filter(c => c.status === 'en_attente').length}</span>
              <span className="stat-label">🟣 En attente</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{clients.filter(c => c.status === 'active').length}</span>
              <span className="stat-label">🟢 Actifs</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{clients.filter(c => c.status === 'inactive').length}</span>
              <span className="stat-label">🔴 Inactifs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="filters-section">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone, entreprise ou ville..." // ✅ MISE À JOUR
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Statut :</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous</option>
              <option value="nouveau">🔵 Nouveaux</option>
              <option value="en_attente">🟣 En attente</option>
              <option value="active">🟢 Actifs</option>
              <option value="inactive">🔴 Inactifs</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Trier par :</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Nom A-Z</option>
              <option value="email">Email A-Z</option>
              <option value="date">Plus récent</option>
            </select>
          </div>

          {selectedProspects.length > 0 && (
            <div className="bulk-actions">
              <button 
                onClick={handleBulkDelete}
                className="bulk-delete-btn"
                disabled={loading}
              >
                🗑️ Supprimer ({selectedProspects.length})
              </button>
            </div>
          )}
        </div>

        {/* ✅ NOUVEAU: Informations de pagination */}
        {filteredProspects.length > 0 && (
          <div className="pagination-info">
            <span>
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredProspects.length)} sur {filteredProspects.length} prospects
              {totalPages > 1 && ` (Page ${currentPage} sur ${totalPages})`}
            </span>
          </div>
        )}
      </div>

      {/* Liste des prospects */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Chargement...</p>
        </div>
      ) : filteredProspects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>
            {searchTerm || statusFilter !== 'all' 
              ? "Aucun prospect trouvé" 
              : "Aucun prospect enregistré"
            }
          </h3>
          <p>
            {searchTerm || statusFilter !== 'all'
              ? "Essayez de modifier vos critères de recherche"
              : "Utilisez votre QR code pour permettre à vos prospects de s'inscrire !"
            }
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <button 
              onClick={() => window.location.hash = '#carte'} 
              className="cta-button"
            >
              🎯 Générer mon QR code
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Actions en masse */}
          {currentProspects.length > 0 && (
            <div className="bulk-select-bar">
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectedProspects.length === currentProspects.length && currentProspects.length > 0}
                  onChange={handleSelectAll}
                />
                <span>Sélectionner tout sur cette page ({currentProspects.length})</span>
              </label>
            </div>
          )}

          {/* ✅ NOUVEAU DESIGN: Grille des cartes prospects */}
          <div className="prospects-grid">
            {currentProspects.map((prospect) => (
              <div 
                key={prospect._id} 
                className={`prospect-card ${selectedProspects.includes(prospect._id) ? 'selected' : ''}`}
              >
                {/* ✅ NOUVEAU: Section supérieure avec design moderne */}
                <div className="card-top-section">
                  {/* Checkbox de sélection */}
                  <div className="card-select">
                    <input
                      type="checkbox"
                      checked={selectedProspects.includes(prospect._id)}
                      onChange={() => handleSelectProspect(prospect._id)}
                    />
                  </div>

                  {/* Avatar centré */}
                  <div className="prospect-avatar">
                    {prospect.name ? prospect.name.charAt(0).toUpperCase() : "?"}
                  </div>

                  {/* Indicateur de statut */}
                  <div 
                    className="status-indicator clickable"
                    style={{ backgroundColor: getStatusColor(prospect.status) }}
                    title={getNextStatusLabel(prospect.status)}
                    onClick={() => handleStatusClick(prospect._id, prospect.status)}
                  >
                    {getStatusIcon(prospect.status)}
                  </div>
                </div>

                {/* ✅ NOUVEAU: Section contenu principal */}
                <div className="card-content">
                  <h3 className="prospect-name">{prospect.name || "N/A"}</h3>
                  
                  <div className="contact-info">
                    <div className="contact-item">
                      <span className="contact-icon">📧</span>
                      <span className="contact-text">{prospect.email || "N/A"}</span>
                    </div>
                    <div className="contact-item">
                      <span className="contact-icon">📞</span>
                      <span className="contact-text">{prospect.phone || "N/A"}</span>
                    </div>
                    {/* ✅ NOUVEAU: Affichage de l'adresse */}
                    {formatAddress(prospect) && (
                      <div className="contact-item">
                        <span className="contact-icon">📍</span>
                        <span className="contact-text">{formatAddress(prospect)}</span>
                      </div>
                    )}
                  </div>

                  {prospect.company && (
                    <div className="company-info">
                      <span className="company-icon">🏢</span>
                      <span className="company-name">{prospect.company}</span>
                    </div>
                  )}

                  {prospect.notes && (
                    <div className="notes-preview">
                      <span className="notes-icon">📝</span>
                      <span className="notes-text">{prospect.notes}</span>
                    </div>
                  )}

                  {/* ✅ NOUVEAU: Badge de statut moderne */}
                  <div className="status-text">
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(prospect.status),
                        color: 'white'
                      }}
                    >
                      {getStatusIcon(prospect.status)} {getStatusLabel(prospect.status)}
                    </span>
                  </div>

                  {/* ✅ NOUVEAU: Actions modernes */}
                  <div className="card-actions">
                    <button 
                      onClick={() => onViewClientDevis && onViewClientDevis(prospect)}
                      className="action-btn primary-action"
                      title="Voir les devis"
                    >
                      📄
                    </button>
                    
                    <button 
                      onClick={() => handleEditProspect(prospect)}
                      className="action-btn edit-action"
                      title="Modifier le prospect"
                    >
                      ✏️
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteClient(prospect._id)}
                      className="action-btn delete-action"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* ✅ NOUVEAU: Footer avec date */}
                <div className="card-footer">
                  <span className="join-date">
                    Inscrit le {new Date(prospect.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ NOUVEAU: Contrôles de pagination */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <div className="pagination-wrapper">
                {/* Bouton Précédent */}
                <button 
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="pagination-btn pagination-prev"
                  title="Page précédente"
                >
                  ← Précédent
                </button>

                {/* Numéros de pages */}
                <div className="pagination-numbers">
                  {currentPage > 3 && totalPages > 5 && (
                    <>
                      <button 
                        onClick={() => goToPage(1)}
                        className="pagination-number"
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className="pagination-ellipsis">...</span>}
                    </>
                  )}

                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {currentPage < totalPages - 2 && totalPages > 5 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="pagination-ellipsis">...</span>}
                      <button 
                        onClick={() => goToPage(totalPages)}
                        className="pagination-number"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                {/* Bouton Suivant */}
                <button 
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="pagination-btn pagination-next"
                  title="Page suivante"
                >
                  Suivant →
                </button>
              </div>

              {/* Informations de pagination détaillées */}
              <div className="pagination-details">
                <span>
                  Page {currentPage} sur {totalPages} • {filteredProspects.length} prospect{filteredProspects.length > 1 ? 's' : ''} au total
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProspectsPage;