import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './billing.scss';

const Billing = ({ clients = [], onRefresh }) => {
  const [devisList, setDevisList] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    devisIds: [],
    invoiceNumber: '',
    dueDate: '',
    notes: '',
    paymentTerms: '30',
    discount: 0,
    taxRate: 20
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchDevis();
      await fetchInvoices();
    };
    loadData();
  }, []);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(API_ENDPOINTS.DEVIS.BASE);
      setDevisList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des devis:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      // Simulation des factures - à remplacer par un vrai endpoint
      const mockInvoices = [
        {
          id: 'INV-001',
          clientId: clients[0]?._id,
          clientName: clients[0]?.name || 'Client Test',
          amount: 2500.0,
          status: 'paid',
          dueDate: '2024-02-15',
          createdAt: '2024-01-15',
          invoiceNumber: 'FACT-2024-001',
          devisIds: [devisList[0]?._id, devisList[1]?._id].filter(Boolean)
        },
        {
          id: 'INV-002',
          clientId: clients[1]?._id,
          clientName: clients[1]?.name || 'Client Test 2',
          amount: 1800.0,
          status: 'pending',
          dueDate: '2024-02-20',
          createdAt: '2024-01-20',
          invoiceNumber: 'FACT-2024-002',
          devisIds: [devisList[2]?._id].filter(Boolean)
        },
        {
          id: 'INV-003',
          clientId: clients[2]?._id,
          clientName: clients[2]?.name || 'Client Test 3',
          amount: 3200.0,
          status: 'overdue',
          dueDate: '2024-01-30',
          createdAt: '2024-01-01',
          invoiceNumber: 'FACT-2024-003',
          devisIds: [devisList[3]?._id, devisList[4]?._id].filter(Boolean)
        }
      ];

      setInvoices(mockInvoices);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    }
  };

  const calculateTTC = (devis) => {
    if (!devis || !Array.isArray(devis.articles)) return 0;
    
    return devis.articles.reduce((total, article) => {
      const price = parseFloat(article.unitPrice || 0);
      const qty = parseFloat(article.quantity || 0);
      const tva = parseFloat(article.tvaRate || 0);
      
      if (isNaN(price) || isNaN(qty) || isNaN(tva)) return total;
      
      const ht = price * qty;
      return total + ht + (ht * tva / 100);
    }, 0);
  };

  const getFinishedDevis = () => {
    return devisList.filter(devis => devis.status === 'fini');
  };

  const filteredDevis = getFinishedDevis().filter(devis => {
    const client = clients.find(c => c._id === (typeof devis.clientId === "object" ? devis.clientId?._id : devis.clientId));
    const clientName = client?.name || "Client inconnu";
    
    const matchesSearch = devis.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return (a.title || "").localeCompare(b.title || "");
      case 'client':
        const clientA = clients.find(c => c._id === (typeof a.clientId === "object" ? a.clientId?._id : a.clientId))?.name || "";
        const clientB = clients.find(c => c._id === (typeof b.clientId === "object" ? b.clientId?._id : b.clientId))?.name || "";
        return clientA.localeCompare(clientB);
      case 'amount':
        return calculateTTC(b) - calculateTTC(a);
      case 'date':
      default:
        return new Date(b.dateDevis || 0) - new Date(a.dateDevis || 0);
    }
  });

  const handleSelectDevis = (devisId) => {
    setSelectedDevis(prev => 
      prev.includes(devisId) 
        ? prev.filter(id => id !== devisId)
        : [...prev, devisId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDevis.length === filteredDevis.length) {
      setSelectedDevis([]);
    } else {
      setSelectedDevis(filteredDevis.map(d => d._id));
    }
  };

  const handleCreateInvoice = () => {
    if (selectedDevis.length === 0) {
      alert('Veuillez sélectionner au moins un devis');
      return;
    }

    // Déterminer le client principal
    const firstDevis = devisList.find(d => d._id === selectedDevis[0]);
    const clientId = typeof firstDevis.clientId === "object" ? firstDevis.clientId._id : firstDevis.clientId;
    
    // Générer un numéro de facture
    const invoiceNumber = `FACT-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    
    // Date d'échéance par défaut (30 jours)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    setNewInvoice({
      clientId,
      devisIds: selectedDevis,
      invoiceNumber,
      dueDate: dueDate.toISOString().split('T')[0],
      notes: '',
      paymentTerms: '30',
      discount: 0,
      taxRate: 20
    });

    setShowCreateInvoice(true);
  };

  const calculateInvoiceTotal = () => {
    const selectedDevisData = devisList.filter(d => newInvoice.devisIds.includes(d._id));
    const subtotal = selectedDevisData.reduce((sum, devis) => sum + calculateTTC(devis), 0);
    const discountAmount = subtotal * (newInvoice.discount / 100);
    return subtotal - discountAmount;
  };

  const saveInvoice = async () => {
    try {
      setLoading(true);
      
      const client = clients.find(c => c._id === newInvoice.clientId);
      const selectedDevisData = devisList.filter(d => newInvoice.devisIds.includes(d._id));
      const total = calculateInvoiceTotal();

      const invoice = {
        id: `INV-${Date.now()}`,
        clientId: newInvoice.clientId,
        clientName: client?.name || 'Client inconnu',
        amount: total,
        status: 'pending',
        dueDate: newInvoice.dueDate,
        createdAt: new Date().toISOString(),
        invoiceNumber: newInvoice.invoiceNumber,
        devisIds: newInvoice.devisIds,
        notes: newInvoice.notes,
        paymentTerms: newInvoice.paymentTerms,
        discount: newInvoice.discount,
        taxRate: newInvoice.taxRate
      };

      // Ajouter à la liste locale (en attendant l'API)
      setInvoices(prev => [invoice, ...prev]);
      
      // Réinitialiser
      setSelectedDevis([]);
      setShowCreateInvoice(false);
      setNewInvoice({
        clientId: '',
        devisIds: [],
        invoiceNumber: '',
        dueDate: '',
        notes: '',
        paymentTerms: '30',
        discount: 0,
        taxRate: 20
      });

      alert('✅ Facture créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      alert('❌ Erreur lors de la création de la facture');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoicePDF = async (invoice) => {
    try {
      setLoading(true);

      const [{ default: jsPDF }] = await Promise.all([
        import('jspdf')
      ]);

      // Récupérer les détails des devis liés à la facture
      const devisDetails = await Promise.all(

        invoice.devisIds.map(async (id) => {
          try {
            return await apiRequest(API_ENDPOINTS.DEVIS.BY_ID(id));
          } catch (err) {
            console.error('Erreur récupération devis:', err);
            return null;
          }
        })
      );

      const validDevis = devisDetails.filter(Boolean);

      // Fusionner tous les articles
      const articles = validDevis.flatMap((d) => d.articles || []);

      const client = clients.find(c => c._id === invoice.clientId) || {};

      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.setFontSize(18);
      pdf.text(`Facture ${invoice.invoiceNumber}`, 105, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text(`Client : ${client.name || invoice.clientName}`, 20, 40);
      pdf.text(`Émise le : ${formatDate(invoice.createdAt)}`, 20, 48);
      pdf.text(`Échéance : ${formatDate(invoice.dueDate)}`, 20, 56);

      let currentY = 70;
      pdf.text('Articles :', 20, currentY);
      currentY += 8;

      articles.forEach((article) => {
        const price = parseFloat(article.unitPrice || 0);
        const qty = parseFloat(article.quantity || 0);
        const total = price * qty;

        pdf.text(article.description || '', 20, currentY);
        pdf.text(`${qty}`, 110, currentY, { align: 'right' });
        pdf.text(`${price.toFixed(2)} €`, 130, currentY, { align: 'right' });
        pdf.text(`${total.toFixed(2)} €`, 190, currentY, { align: 'right' });

        currentY += 6;
        if (currentY > 280) { pdf.addPage(); currentY = 20; }
      });

      const totalHT = articles.reduce(
        (sum, a) => sum + parseFloat(a.unitPrice || 0) * parseFloat(a.quantity || 0),
        0
      );
      const totalTVA = articles.reduce(
        (sum, a) => sum + (
          parseFloat(a.unitPrice || 0) * parseFloat(a.quantity || 0) * (parseFloat(a.tvaRate || 0) / 100)
        ),
        0
      );
      const totalTTC = totalHT + totalTVA;

      currentY += 10;
      pdf.text(`Total HT : ${totalHT.toFixed(2)} €`, 20, currentY);
      currentY += 8;
      pdf.text(`Total TVA : ${totalTVA.toFixed(2)} €`, 20, currentY);
      currentY += 8;
      pdf.setFontSize(14);
      pdf.text(`Total TTC : ${totalTTC.toFixed(2)} €`, 20, currentY);

      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      alert('❌ Erreur lors de la génération du PDF');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'overdue': return '#ef4444';
      case 'draft': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'pending': return 'En attente';
      case 'overdue': return 'En retard';
      case 'draft': return 'Brouillon';
      default: return 'Inconnu';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return '✅';
      case 'pending': return '⏳';
      case 'overdue': return '⚠️';
      case 'draft': return '📝';
      default: return '❓';
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

  // Calculs pour les statistiques
  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingRevenue = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueRevenue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);
  const totalInvoices = invoices.length;

  return (
    <div className="billing-container">
      {/* En-tête avec statistiques */}
      <div className="billing-header">
        <div className="header-content">
          <h1 className="page-title">💰 Facturation</h1>
          <div className="billing-stats">
            <div className="stat-card revenue">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>{totalRevenue.toLocaleString('fr-FR')} €</h3>
                <p>Chiffre d'affaires</p>
                <span className="stat-trend">Factures payées</span>
              </div>
            </div>
            
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{pendingRevenue.toLocaleString('fr-FR')} €</h3>
                <p>En attente</p>
                <span className="stat-trend">À encaisser</span>
              </div>
            </div>
            
            <div className="stat-card overdue">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>{overdueRevenue.toLocaleString('fr-FR')} €</h3>
                <p>En retard</p>
                <span className="stat-trend">Relances nécessaires</span>
              </div>
            </div>
            
            <div className="stat-card total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{totalInvoices}</h3>
                <p>Factures totales</p>
                <span className="stat-trend">Toutes périodes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section de création de factures */}
      <div className="billing-section">
        <div className="section-header">
          <h2>📄 Devis finalisés</h2>
          <p>Sélectionnez les devis à facturer</p>
        </div>

        {/* Filtres et recherche */}
        <div className="filters-section">
          <div className="search-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Rechercher par titre ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label>Trier par :</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="date">Plus récent</option>
                <option value="title">Titre A-Z</option>
                <option value="client">Client A-Z</option>
                <option value="amount">Montant décroissant</option>
              </select>
            </div>

            {selectedDevis.length > 0 && (
              <div className="bulk-actions">
                <button 
                  onClick={handleCreateInvoice}
                  className="create-invoice-btn"
                  disabled={loading}
                >
                  💰 Créer une facture ({selectedDevis.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sélection en masse */}
        {filteredDevis.length > 0 && (
          <div className="bulk-select-bar">
            <label className="select-all-checkbox">
              <input
                type="checkbox"
                checked={selectedDevis.length === filteredDevis.length && filteredDevis.length > 0}
                onChange={handleSelectAll}
              />
              <span>Sélectionner tous les devis ({filteredDevis.length})</span>
            </label>
          </div>
        )}

        {/* Liste des devis finalisés */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Chargement...</p>
          </div>
        ) : filteredDevis.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Aucun devis finalisé</h3>
            <p>Les devis avec le statut "Fini" apparaîtront ici pour être facturés</p>
          </div>
        ) : (
          <div className="devis-grid">
            {filteredDevis.map((devis) => {
              const client = clients.find(c => c._id === (typeof devis.clientId === "object" ? devis.clientId?._id : devis.clientId));
              
              return (
                <div 
                  key={devis._id} 
                  className={`devis-card ${selectedDevis.includes(devis._id) ? 'selected' : ''}`}
                >
                  <div className="card-select">
                    <input
                      type="checkbox"
                      checked={selectedDevis.includes(devis._id)}
                      onChange={() => handleSelectDevis(devis._id)}
                    />
                  </div>

                  <div className="devis-card-content">
                    <h3 className="devis-title">{devis.title || "Devis sans titre"}</h3>
                    
                    <div className="devis-meta">
                      <div className="devis-client">
                        <span className="client-icon">👤</span>
                        <span>{client?.name || "Client inconnu"}</span>
                      </div>
                      
                      <div className="devis-date">
                        <span className="date-icon">📅</span>
                        <span>{formatDate(devis.dateDevis)}</span>
                      </div>
                    </div>

                    <div className="devis-amount">
                      <span className="amount-label">Montant TTC :</span>
                      <span className="amount-value">{calculateTTC(devis).toFixed(2)} €</span>
                    </div>

                    <div className="devis-status">
                      <span className="status-badge fini">
                        ✅ Finalisé
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section des factures existantes */}
      <div className="billing-section">
        <div className="section-header">
          <h2>📋 Factures émises</h2>
          <p>Historique de vos factures</p>
        </div>

        {invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Aucune facture émise</h3>
            <p>Vos factures créées apparaîtront ici</p>
          </div>
        ) : (
          <div className="invoices-grid">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="invoice-card">
                <div className="invoice-header">
                  <div className="invoice-number">{invoice.invoiceNumber}</div>
                  <div 
                    className="invoice-status"
                    style={{ backgroundColor: getStatusColor(invoice.status), color: 'white' }}
                  >
                    {getStatusIcon(invoice.status)} {getStatusLabel(invoice.status)}
                  </div>
                </div>

                <div className="invoice-content">
                  <div className="invoice-client">
                    <span className="client-icon">👤</span>
                    <span>{invoice.clientName}</span>
                  </div>

                  <div className="invoice-amount">
                    <span className="amount-label">Montant :</span>
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

                  <div className="invoice-devis">
                    <span>📄 Devis inclus : {invoice.devisIds.length}</span>
                  </div>
                </div>

                <div className="invoice-actions">
                  <button className="action-btn view-btn" title="Voir la facture">
                    👁️
                  </button>
                  <button
                    onClick={() => handleDownloadInvoicePDF(invoice)}
                    className="action-btn download-btn"
                    title="Télécharger PDF"
                  >
                    📥
                  </button>
                  <button className="action-btn send-btn" title="Envoyer par email">
                    📧
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création de facture */}
      {showCreateInvoice && (
        <div className="modal-overlay" onClick={() => setShowCreateInvoice(false)}>
          <div className="modal-content create-invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Créer une nouvelle facture</h3>
              <button 
                onClick={() => setShowCreateInvoice(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="invoice-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Numéro de facture :</label>
                    <input
                      type="text"
                      value={newInvoice.invoiceNumber}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Date d'échéance :</label>
                    <input
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Conditions de paiement :</label>
                    <select
                      value={newInvoice.paymentTerms}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      className="form-select"
                    >
                      <option value="15">15 jours</option>
                      <option value="30">30 jours</option>
                      <option value="45">45 jours</option>
                      <option value="60">60 jours</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Remise (%) :</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newInvoice.discount}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes :</label>
                  <textarea
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                    className="form-textarea"
                    rows={3}
                    placeholder="Notes ou conditions particulières..."
                  />
                </div>

                <div className="invoice-summary">
                  <h4>Résumé de la facture :</h4>
                  <div className="summary-details">
                    <div className="summary-line">
                      <span>Devis sélectionnés :</span>
                      <span>{newInvoice.devisIds.length}</span>
                    </div>
                    <div className="summary-line">
                      <span>Sous-total :</span>
                      <span>{(calculateInvoiceTotal() / (1 - newInvoice.discount / 100)).toFixed(2)} €</span>
                    </div>
                    {newInvoice.discount > 0 && (
                      <div className="summary-line discount">
                        <span>Remise ({newInvoice.discount}%) :</span>
                        <span>-{((calculateInvoiceTotal() / (1 - newInvoice.discount / 100)) * newInvoice.discount / 100).toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="summary-line total">
                      <span>Total TTC :</span>
                      <span>{calculateInvoiceTotal().toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowCreateInvoice(false)}
                className="btn-cancel"
              >
                Annuler
              </button>
              <button 
                onClick={saveInvoice}
                className="btn-save"
                disabled={loading}
              >
                {loading ? 'Création...' : '💰 Créer la facture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;