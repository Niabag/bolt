import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import DynamicInvoice from './DynamicInvoice';
import './InvoiceList.scss';

const InvoiceList = ({ clients = [] }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedDevis, setSelectedDevis] = useState([]);
  const invoicePreviewRef = useRef(null);

  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    canceled: 0,
    totalAmount: 0
  });
  
  // États pour filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  
  // États pour pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(API_ENDPOINTS.INVOICES.BASE);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err);
      setError("Erreur lors du chargement des factures");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.INVOICES.STATS);
      if (data) setStats(data);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques de factures:', err);
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      setLoading(true);
      
      // Récupérer les détails du client
      const client = clients.find(c => c._id === (typeof invoice.clientId === 'object' ? invoice.clientId._id : invoice.clientId));
      
      // Récupérer les détails des devis associés
      const devisDetails = [];
      if (invoice.devisIds && invoice.devisIds.length > 0) {
        for (const devisId of invoice.devisIds) {
          try {
            const devis = await apiRequest(API_ENDPOINTS.DEVIS.BY_ID(devisId));
            if (devis) {
              devisDetails.push(devis);
            }
          } catch (err) {
            console.error(`Erreur lors de la récupération du devis ${devisId}:`, err);
          }
        }
      }
      
      setSelectedInvoice(invoice);
      setSelectedClient(client);
      setSelectedDevis(devisDetails);
      
      // Faire défiler jusqu'à la prévisualisation
      setTimeout(() => {
        if (invoicePreviewRef.current) {
          invoicePreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
    } catch (err) {
      console.error('Erreur lors de la récupération des détails de la facture:', err);
      setError("Erreur lors de la récupération des détails de la facture");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInvoice = async (updatedInvoice) => {
    try {
      setLoading(true);
      
      await apiRequest(API_ENDPOINTS.INVOICES.UPDATE(updatedInvoice._id || updatedInvoice.id), {
        method: 'PUT',
        body: JSON.stringify(updatedInvoice)
      });

      await fetchInvoices();
      await fetchStats();
      setSelectedInvoice(null);
      setSelectedClient(null);
      setSelectedDevis([]);
      
      alert('✅ Facture mise à jour avec succès');
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la facture:', err);
      alert(`❌ Erreur lors de la mise à jour: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await apiRequest(API_ENDPOINTS.INVOICES.DELETE(invoiceId), {
        method: 'DELETE'
      });

      await fetchInvoices();
      await fetchStats();
      alert('✅ Facture supprimée avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression de la facture:', err);
      alert(`❌ Erreur lors de la suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId, currentStatus) => {
    let newStatus;

    switch (currentStatus) {
      case 'draft':
        newStatus = 'pending';
        break;
      case 'pending':
        newStatus = 'paid';
        break;
      case 'paid':
        newStatus = 'overdue';
        break;
      case 'overdue':
        newStatus = 'canceled';
        break;
      case 'canceled':
        newStatus = 'draft';
        break;
      default:
        newStatus = 'pending';
    }
    
    try {
      setLoading(true);
      
      await apiRequest(API_ENDPOINTS.INVOICES.UPDATE_STATUS(invoiceId), {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      await fetchInvoices();
      await fetchStats();
      alert(`✅ Statut de la facture mis à jour: ${getStatusLabel(newStatus)}`);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      alert(`❌ Erreur lors de la mise à jour du statut: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch (error) {
      return "";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'overdue': return '#ef4444';
      case 'canceled': return '#9ca3af';
      case 'draft':
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'pending': return 'En attente';
      case 'overdue': return 'En retard';
      case 'canceled': return 'Annulée';
      case 'draft':
      default:
        return 'Brouillon';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return '✅';
      case 'pending': return '⏳';
      case 'overdue': return '⚠️';
      case 'canceled': return '❌';
      case 'draft':
      default:
        return '📝';
    }
  };

  const getNextStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Passer en Attente';
      case 'pending':
        return 'Marquer Payée';
      case 'paid':
        return 'Marquer En retard';
      case 'overdue':
        return 'Annuler la facture';
      case 'canceled':
        return 'Repasser en Brouillon';
      default:
        return 'Changer le statut';
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      setLoading(true);
      
      // Récupérer les détails du client
      const client = clients.find(c => c._id === (typeof invoice.clientId === 'object' ? invoice.clientId._id : invoice.clientId));
      
      // Récupérer les détails des devis associés
      const devisDetails = [];
      if (invoice.devisIds && invoice.devisIds.length > 0) {
        for (const devisId of invoice.devisIds) {
          try {
            const devis = await apiRequest(API_ENDPOINTS.DEVIS.BY_ID(devisId));
            if (devis) {
              devisDetails.push(devis);
            }
          } catch (err) {
            console.error(`Erreur lors de la récupération du devis ${devisId}:`, err);
          }
        }
      }
      
      // Importer les modules nécessaires
      const [{ default: jsPDF }] = await Promise.all([
        import('jspdf')
      ]);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      let currentY = margin;
      
      // Fonction pour ajouter une section au PDF
      const addSectionToPDF = (text, y) => {
        pdf.text(text, margin, y);
        return y + 10;
      };
      
      // En-tête
      currentY = addSectionToPDF(`Facture ${invoice.invoiceNumber}`, currentY);
      currentY = addSectionToPDF(`Date: ${formatDate(invoice.createdAt)}`, currentY + 5);
      currentY = addSectionToPDF(`Échéance: ${formatDate(invoice.dueDate)}`, currentY + 5);
      currentY = addSectionToPDF(`Client: ${client?.name || 'Client inconnu'}`, currentY + 5);
      
      // Détails des articles
      currentY += 10;
      pdf.text("Articles:", margin, currentY);
      currentY += 10;
      
      // Fusionner tous les articles des devis
      const allArticles = devisDetails.flatMap(devis => devis.articles || []);
      
      allArticles.forEach(article => {
        const price = parseFloat(article.unitPrice || 0);
        const qty = parseFloat(article.quantity || 0);
        const total = price * qty;
        
        pdf.text(`${article.description || 'Article'} - ${qty} x ${price.toFixed(2)} € = ${total.toFixed(2)} €`, margin, currentY);
        currentY += 7;
        
        if (currentY > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
      });
      
      // Totaux
      currentY += 10;
      const totalHT = allArticles.reduce((sum, article) => {
        const price = parseFloat(article.unitPrice || 0);
        const qty = parseFloat(article.quantity || 0);
        return sum + (price * qty);
      }, 0);
      
      const totalTVA = allArticles.reduce((sum, article) => {
        const price = parseFloat(article.unitPrice || 0);
        const qty = parseFloat(article.quantity || 0);
        const tva = parseFloat(article.tvaRate || 0);
        return sum + (price * qty * tva / 100);
      }, 0);
      
      const totalTTC = totalHT + totalTVA;
      
      pdf.text(`Total HT: ${totalHT.toFixed(2)} €`, margin, currentY);
      currentY += 7;
      pdf.text(`Total TVA: ${totalTVA.toFixed(2)} €`, margin, currentY);
      currentY += 7;
      pdf.text(`Total TTC: ${totalTTC.toFixed(2)} €`, margin, currentY);
      
      // Télécharger le PDF
      pdf.save(`facture-${invoice.invoiceNumber}.pdf`);
      
    } catch (err) {
      console.error('Erreur lors de la génération du PDF:', err);
      alert(`❌ Erreur lors de la génération du PDF: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer et trier les factures
  const filteredInvoices = invoices.filter(invoice => {
    const client = clients.find(c => c._id === (typeof invoice.clientId === "object" ? invoice.clientId?._id : invoice.clientId));
    const clientName = client?.name || invoice.clientName || "Client inconnu";
    
    const matchesSearch = invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'paid' && invoice.status === 'paid') ||
                         (statusFilter === 'pending' && invoice.status === 'pending') ||
                         (statusFilter === 'overdue' && invoice.status === 'overdue') ||
                         (statusFilter === 'canceled' && invoice.status === 'canceled') ||
                         (statusFilter === 'draft' && invoice.status === 'draft');
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'number':
        return (a.invoiceNumber || "").localeCompare(b.invoiceNumber || "");
      case 'client':
        const clientA = clients.find(c => c._id === (typeof a.clientId === "object" ? a.clientId?._id : a.clientId))?.name || a.clientName || "";
        const clientB = clients.find(c => c._id === (typeof b.clientId === "object" ? b.clientId?._id : b.clientId))?.name || b.clientName || "";
        return clientA.localeCompare(clientB);
      case 'amount':
        return b.amount - a.amount;
      case 'date':
      default:
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  // Calculs de pagination
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Fonctions de navigation de pagination
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

  // Générer les numéros de pages à afficher
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

  return (
    <div className="invoice-list-container">
      <div className="invoice-list-header">
        <h2>📋 Mes Factures</h2>
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{filteredInvoices.length}</span>
            <span className="stat-label">Affichés</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.draft}</span>
            <span className="stat-label">📝 Brouillons</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">⏳ En attente</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.paid}</span>
            <span className="stat-label">✅ Payées</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.overdue}</span>
            <span className="stat-label">⚠️ En retard</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.canceled}</span>
            <span className="stat-label">❌ Annulées</span>
          </div>
        </div>
      </div>

      {/* Filtres pour les factures */}
      <div className="filters-section">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Rechercher par numéro ou client..."
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
              <option value="draft">📝 Brouillons</option>
              <option value="pending">⏳ En attente</option>
              <option value="paid">✅ Payées</option>
              <option value="overdue">⚠️ En retard</option>
              <option value="canceled">❌ Annulées</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Trier par :</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="date">Plus récent</option>
              <option value="number">Numéro</option>
              <option value="client">Client A-Z</option>
              <option value="amount">Montant décroissant</option>
            </select>
          </div>
        </div>

        {/* Informations de pagination */}
        {filteredInvoices.length > 0 && (
          <div className="pagination-info">
            <span>
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredInvoices.length)} sur {filteredInvoices.length} factures
              {totalPages > 1 && ` (Page ${currentPage} sur ${totalPages})`}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && invoices.length === 0 ? (
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Chargement des factures...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>
            {searchTerm || statusFilter !== 'all' 
              ? "Aucune facture trouvée" 
              : "Aucune facture émise"
            }
          </h3>
          <p>
            {searchTerm || statusFilter !== 'all'
              ? "Essayez de modifier vos critères de recherche"
              : "Créez votre première facture à partir d'un devis"
            }
          </p>
        </div>
      ) : (
        <>
          <div className="invoices-grid">
            {currentInvoices.map((invoice) => (
              <div
                key={invoice._id || invoice.id}
                className="invoice-card"
                onClick={() => handleViewInvoice(invoice)}
              >
                <div
                  className="status-indicator clickable"
                  style={{
                    backgroundColor: getStatusColor(invoice.status),
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem'
                  }}
                  title={getNextStatusLabel(invoice.status)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(invoice._id || invoice.id, invoice.status);
                  }}
                >
                  {getStatusIcon(invoice.status)}
                </div>
                <div className="invoice-header">
                  <div className="invoice-number">{invoice.invoiceNumber}</div>
                  <div
                    className="invoice-status clickable"
                    style={{ backgroundColor: getStatusColor(invoice.status), color: 'white' }}
                    title={getNextStatusLabel(invoice.status)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(invoice._id || invoice.id, invoice.status);
                    }}
                  >
                    {getStatusIcon(invoice.status)} {getStatusLabel(invoice.status)}
                  </div>
                </div>

                <div className="invoice-content">
                  <div className="invoice-amount">
                    <span className="amount-label">Montant TTC :</span>
                    <span className="amount-value">{invoice.amount.toFixed(2)} €</span>
                  </div>

                  <div className="invoice-dates">
                    <div className="invoice-date">
                      <span>📅 Émise le : {formatDate(invoice.createdAt)}</span>
                    </div>
                    <div className="invoice-due">
                      <span>⏰ Échéance : {formatDate(invoice.dueDate)}</span>
                    </div>
                  </div>

                  <div className="invoice-client">
                    <span>👤 Client : {
                      (() => {
                        const client = clients.find(c => c._id === (typeof invoice.clientId === 'object' ? invoice.clientId._id : invoice.clientId));
                        return client ? client.name : 'Client inconnu';
                      })()
                    }</span>
                  </div>

                  <div className="invoice-devis">
                    <span>📄 Devis inclus : {invoice.devisIds?.length || 0}</span>
                  </div>
                </div>

                <div className="invoice-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPDF(invoice);
                    }}
                    className="action-btn download-btn"
                    title="Télécharger PDF"
                  >
                    📥
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteInvoice(invoice._id || invoice.id);
                    }}
                    className="action-btn delete-btn"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Contrôles de pagination */}
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
                  Page {currentPage} sur {totalPages} • {filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''} au total
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Prévisualisation de la facture */}
      {selectedInvoice && (
        <div className="invoice-preview-section" ref={invoicePreviewRef}>
          <div className="preview-header">
            <h3>Détails de la facture</h3>
            <button 
              className="close-preview-btn"
              onClick={() => {
                setSelectedInvoice(null);
                setSelectedClient(null);
                setSelectedDevis([]);
              }}
            >
              ✕
            </button>
          </div>
          
          <DynamicInvoice
            invoice={selectedInvoice}
            client={selectedClient}
            devisDetails={selectedDevis}
            onSave={handleUpdateInvoice}
            onCancel={() => {
              setSelectedInvoice(null);
              setSelectedClient(null);
              setSelectedDevis([]);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
