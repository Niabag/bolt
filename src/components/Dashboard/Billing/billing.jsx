import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import DynamicInvoice from './DynamicInvoice';
import './billing.scss';

const Billing = ({ clients = [], onRefresh }) => {
  const [devisList, setDevisList] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
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
  
  // Référence pour le conteneur de prévisualisation
  const previewContainerRef = useRef(null);
  // État pour la prévisualisation dynamique
  const [dynamicPreview, setDynamicPreview] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await fetchDevis();
      await fetchInvoices();
    };
    loadData();
  }, []);

  // Effet pour prévisualiser automatiquement quand des devis sont sélectionnés
  useEffect(() => {
    if (selectedDevis.length > 0 && dynamicPreview) {
      // Faire défiler jusqu'à la prévisualisation si elle est visible
      if (previewContainerRef.current) {
        setTimeout(() => {
          previewContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [selectedDevis, dynamicPreview]);

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
    // Retourner tous les devis, pas seulement ceux qui sont finalisés
    return devisList;
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
    
    // Faire défiler jusqu'à la prévisualisation si elle est visible
    if (dynamicPreview && previewContainerRef.current) {
      setTimeout(() => {
        previewContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  const handleSelectAll = () => {
    if (selectedDevis.length === filteredDevis.length) {
      setSelectedDevis([]);
    } else {
      setSelectedDevis(filteredDevis.map(d => d._id));
    }
  };

  const saveInvoice = async (updatedInvoice = null) => {
    try {
      setLoading(true);
      
      const invoiceToSave = updatedInvoice || newInvoice;
      const client = clients.find(c => c._id === invoiceToSave.clientId);
      const selectedDevisData = devisList.filter(d => invoiceToSave.devisIds.includes(d._id));
      const total = updatedInvoice ? updatedInvoice.amount : calculateInvoiceTotal();

      const invoice = {
        id: `INV-${Date.now()}`,
        clientId: invoiceToSave.clientId,
        clientName: client?.name || 'Client inconnu',
        amount: total,
        status: invoiceToSave.status || 'pending',
        dueDate: invoiceToSave.dueDate,
        createdAt: invoiceToSave.createdAt || new Date().toISOString(),
        invoiceNumber: invoiceToSave.invoiceNumber,
        devisIds: invoiceToSave.devisIds,
        notes: invoiceToSave.notes,
        paymentTerms: invoiceToSave.paymentTerms,
        discount: invoiceToSave.discount,
        taxRate: invoiceToSave.taxRate
      };

      // Ajouter à la liste locale (en attendant l'API)
      setInvoices(prev => [invoice, ...prev]);
      
      // Réinitialiser
      setSelectedDevis([]);
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

  const handleDeleteInvoice = (invoiceId) => {
    if (window.confirm("Supprimer cette facture ?")) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    }
  };

  const handleInvoiceStatusClick = (invoiceId, currentStatus) => {
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
        newStatus = 'draft';
        break;
      default:
        newStatus = 'pending';
    }

    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: newStatus } : inv
      )
    );

    alert(`Statut de la facture mis à jour : ${getStatusLabel(newStatus)}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch (error) {
      return "";
    }
  };

  const calculateInvoiceTotal = () => {
    const selectedDevisData = devisList.filter(d => selectedDevis.includes(d._id));
    const subtotal = selectedDevisData.reduce((sum, devis) => sum + calculateTTC(devis), 0);
    const discountAmount = subtotal * (newInvoice.discount / 100);
    return subtotal - discountAmount;
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

  const getNextStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Passer en Attente';
      case 'pending':
        return 'Marquer Payée';
      case 'paid':
        return 'Marquer En retard';
      case 'overdue':
        return 'Repasser en Brouillon';
      default:
        return 'Changer le statut';
    }
  };

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
                <h3>{invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('fr-FR')} € TTC</h3>
                <p>Chiffre d'affaires</p>
                <span className="stat-trend">Factures payées</span>
              </div>
            </div>
            
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('fr-FR')} € TTC</h3>
                <p>En attente</p>
                <span className="stat-trend">À encaisser</span>
              </div>
            </div>
            
            <div className="stat-card overdue">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>{invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('fr-FR')} € TTC</h3>
                <p>En retard</p>
                <span className="stat-trend">Relances nécessaires</span>
              </div>
            </div>
            
            <div className="stat-card total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{invoices.length}</h3>
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
          <h2>📄 Devis disponibles</h2>
          <p>Cliquez sur un devis pour générer une facture</p>
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
            
            <div className="filter-group">
              <label className="auto-preview-toggle">
                <input 
                  type="checkbox" 
                  checked={dynamicPreview} 
                  onChange={() => setDynamicPreview(!dynamicPreview)}
                />
                <span className="toggle-label">Affichage dynamique</span>
              </label>
            </div>
          </div>
        </div>

        {/* Liste des devis */}
        {loading && devisList.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Chargement...</p>
          </div>
        ) : filteredDevis.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Aucun devis disponible</h3>
            <p>Créez d'abord un devis pour pouvoir générer une facture</p>
          </div>
        ) : (
          <div className="devis-grid">
            {filteredDevis.map((devis) => {
              const client = clients.find(c => c._id === (typeof devis.clientId === "object" ? devis.clientId?._id : devis.clientId));
              
              return (
                <div 
                  key={devis._id} 
                  className={`devis-card ${selectedDevis.includes(devis._id) ? 'selected' : ''}`}
                  onClick={() => handleSelectDevis(devis._id)}
                >
                  <div className="devis-card-content">
                    <h3 className="devis-card-title">{devis.title || "Devis sans titre"}</h3>
                    
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

                    <div className="devis-card-actions">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Télécharger directement le PDF
                          handleDownloadPDF(devis);
                        }}
                        className="card-btn card-btn-pdf"
                        disabled={loading}
                      >
                        {loading ? "⏳" : "📄"} PDF
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Prévisualisation dynamique de la facture */}
      {dynamicPreview && selectedDevis.length > 0 && (
        <div className="dynamic-preview-container" ref={previewContainerRef}>
          <div className="dynamic-preview-header">
            <h2>📋 Prévisualisation de la facture</h2>
            <p>Modifiez directement les informations ci-dessous</p>
          </div>
          
          <div className="dynamic-preview-content">
            <DynamicInvoice
              invoice={{
                invoiceNumber: `FACT-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                createdAt: new Date().toISOString().split('T')[0],
                devisIds: selectedDevis
              }}
              client={(() => {
                const firstDevis = devisList.find(d => d._id === selectedDevis[0]);
                if (!firstDevis) return {};
                const clientId = typeof firstDevis.clientId === "object" ? firstDevis.clientId._id : firstDevis.clientId;
                return clients.find(c => c._id === clientId) || {};
              })()}
              devisDetails={devisList.filter(d => selectedDevis.includes(d._id))}
              onSave={saveInvoice}
            />
          </div>
        </div>
      )}

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
                    className="invoice-status clickable"
                    style={{ backgroundColor: getStatusColor(invoice.status), color: 'white' }}
                    title={getNextStatusLabel(invoice.status)}
                    onClick={() => handleInvoiceStatusClick(invoice.id, invoice.status)}
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

                  <div className="invoice-devis">
                    <span>📄 Devis inclus : {invoice.devisIds.length}</span>
                  </div>
                </div>

                <div className="invoice-actions">
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
                  <button
                    onClick={() => handleDeleteInvoice(invoice.id)}
                    className="action-btn delete-btn"
                    title="Supprimer la facture"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Fonction pour générer un PDF à partir d'un devis
const handleDownloadPDF = async (devis) => {
  try {
    // Créer un élément temporaire
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.background = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.color = 'black';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.4';
    document.body.appendChild(tempDiv);

    // Importer les modules nécessaires
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    let currentY = margin;

    // Fonction pour ajouter une section au PDF
    const addSectionToPDF = async (htmlContent, isFirstPage = false) => {
      tempDiv.innerHTML = htmlContent;
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Vérifier si on a besoin d'une nouvelle page
      if (currentY + imgHeight > pageHeight - margin && !isFirstPage) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 5;

      return imgHeight;
    };

    // 1. EN-TÊTE
    await addSectionToPDF(`
      <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            ${devis.logoUrl ? `<img src="${devis.logoUrl}" alt="Logo" style="max-width: 200px; max-height: 100px; object-fit: contain; border-radius: 8px;">` : ''}
          </div>
          <div style="flex: 1; text-align: right;">
            <h1 style="font-size: 3rem; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: 2px;">FACTURE</h1>
          </div>
        </div>
      </div>
    `, true);

    // 2. INFORMATIONS PARTIES
    const clientInfo = {
      name: "Client",
      email: "client@example.com",
      phone: "06 12 34 56 78",
      address: "123 Rue Client",
      postalCode: "75000",
      city: "Paris"
    };
    
    await addSectionToPDF(`
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">ÉMETTEUR</h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${devis.entrepriseName || 'Nom de l\'entreprise'}</div>
            <div>${devis.entrepriseAddress || 'Adresse'}</div>
            <div>${devis.entrepriseCity || 'Code postal et ville'}</div>
            <div>${devis.entreprisePhone || 'Téléphone'}</div>
            <div>${devis.entrepriseEmail || 'Email'}</div>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">DESTINATAIRE</h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${clientInfo.name || devis.clientName || 'Nom du client'}</div>
            <div>${clientInfo.email || devis.clientEmail || 'Email du client'}</div>
            <div>${clientInfo.phone || devis.clientPhone || 'Téléphone du client'}</div>
            <div>${devis.clientAddress || clientInfo.address || 'Adresse du client'}</div>
            <div>${clientInfo.postalCode || ''} ${clientInfo.city || ''}</div>
          </div>
        </div>
      </div>
    `);

    // 3. MÉTADONNÉES
    await addSectionToPDF(`
      <div style="background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; color: #64748b;">Date de la facture :</div>
            <div style="font-weight: 600; color: #0f172a;">${new Date().toLocaleDateString('fr-FR')}</div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; color: #64748b;">Numéro de facture :</div>
            <div style="font-weight: 600; color: #0f172a;">FACT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}</div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; color: #64748b;">Date d'échéance :</div>
            <div style="font-weight: 600; color: #0f172a;">${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; color: #64748b;">Client :</div>
            <div style="font-weight: 600; color: #0f172a;">${clientInfo.name || devis.clientName || 'Client non défini'}</div>
          </div>
        </div>
      </div>
    `);

    // 4. TABLEAU - TRAITEMENT LIGNE PAR LIGNE
    // En-tête du tableau
    await addSectionToPDF(`
      <div style="margin-bottom: 10px;">
        <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.3rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">DÉTAIL DES PRESTATIONS</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); color: white;">
              <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 35%;">Description</th>
              <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">Unité</th>
              <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">Qté</th>
              <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 15%;">Prix unitaire HT</th>
              <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">TVA</th>
              <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 20%;">Total HT</th>
            </tr>
          </thead>
        </table>
      </div>
    `);

    // TRAITER CHAQUE LIGNE INDIVIDUELLEMENT
    for (let i = 0; i < devis.articles.length; i++) {
      const article = devis.articles[i];
      const price = parseFloat(article.unitPrice || "0");
      const qty = parseFloat(article.quantity || "0");
      const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
      const bgColor = i % 2 === 0 ? '#ffffff' : '#f8f9fa';

      const rowHTML = `
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr style="background: ${bgColor};">
              <td style="padding: 1rem 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; width: 35%;">${article.description || ''}</td>
              <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 10%;">${article.unit || ''}</td>
              <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 10%;">${qty}</td>
              <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 15%;">${price.toFixed(2)} €</td>
              <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 10%;">${article.tvaRate || "20"}%</td>
              <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 20%; font-weight: 600; color: #48bb78;">${total.toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>
      `;

      await addSectionToPDF(rowHTML);
    }

    // 5. TOTAUX
    const tauxTVA = {
      "20": { ht: 0, tva: 0 },
      "10": { ht: 0, tva: 0 },
      "5.5": { ht: 0, tva: 0 },
    };

    devis.articles.forEach((item) => {
      const price = parseFloat(item.unitPrice || "0");
      const qty = parseFloat(item.quantity || "0");
      const taux = item.tvaRate || "20";

      if (!isNaN(price) && !isNaN(qty) && tauxTVA[taux]) {
        const ht = price * qty;
        tauxTVA[taux].ht += ht;
        tauxTVA[taux].tva += ht * (parseFloat(taux) / 100);
      }
    });

    const totalHT = Object.values(tauxTVA).reduce((sum, t) => sum + t.ht, 0);
    const totalTVA = Object.values(tauxTVA).reduce((sum, t) => sum + t.tva, 0);
    const totalTTC = totalHT + totalTVA;

    await addSectionToPDF(`
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 30px 0;">
        <div>
          <h4 style="margin: 0 0 1rem 0; color: #2d3748; font-weight: 600;">Récapitulatif TVA</h4>
          <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white;">
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Base HT</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Taux TVA</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Montant TVA</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(tauxTVA)
                .filter(([, { ht }]) => ht > 0)
                .map(([rate, { ht, tva }]) => `
                  <tr>
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">${ht.toFixed(2)} €</td>
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">${rate}%</td>
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">${tva.toFixed(2)} €</td>
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">${(ht + tva).toFixed(2)} €</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; align-self: end;">
          <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 10px; font-weight: 500; min-width: 250px;">
            <span>Total HT :</span>
            <span>${totalHT.toFixed(2)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 10px; font-weight: 500; min-width: 250px;">
            <span>Total TVA :</span>
            <span>${totalTVA.toFixed(2)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-weight: 700; font-size: 1.1rem; border-radius: 10px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); min-width: 250px;">
            <span>Total TTC :</span>
            <span>${totalTTC.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    `);

    // 6. CONDITIONS
    await addSectionToPDF(`
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #3b82f6; margin-top: 30px;">
        <div style="margin-bottom: 2rem;">
          <h4 style="margin: 0 0 1rem 0; color: #0f172a; font-size: 1.1rem; font-weight: 600;">Conditions</h4>
          <div style="color: #475569; line-height: 1.6; white-space: pre-line;">
            ${devis.conditions || `• Facture valable jusqu'au ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}\n• Règlement à 30 jours fin de mois\n• TVA non applicable, art. 293 B du CGI (si applicable)`}
          </div>
        </div>
        
        <div style="text-align: center;">
          <p style="font-style: italic; color: #64748b; margin-bottom: 2rem;">
            <em>Merci pour votre confiance</em>
          </p>
        </div>
      </div>
    `);

    // 7. PIED DE PAGE
    await addSectionToPDF(`
      <div style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 0.85rem; color: #64748b; font-style: italic; margin: 0;">
          ${devis.footerText || `${devis.entrepriseName || 'Votre entreprise'} - ${devis.entrepriseAddress || 'Adresse'} - ${devis.entrepriseCity || 'Ville'}`}
        </p>
      </div>
    `);

    // Télécharger le PDF
    const fileName = devis.title?.replace(/[^a-zA-Z0-9]/g, '-') || `facture-${devis._id}`;
    pdf.save(`${fileName}.pdf`);

    // Nettoyer
    document.body.removeChild(tempDiv);
    
    console.log("✅ PDF généré avec succès");

  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    alert('❌ Erreur lors de la génération du PDF: ' + error.message);
  }
};

export default Billing;