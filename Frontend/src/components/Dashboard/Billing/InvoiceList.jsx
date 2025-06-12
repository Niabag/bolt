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

  useEffect(() => {
    fetchInvoices();
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
      
      await apiRequest(API_ENDPOINTS.INVOICES.UPDATE(updatedInvoice._id), {
        method: 'PUT',
        body: JSON.stringify(updatedInvoice)
      });
      
      await fetchInvoices();
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

  return (
    <div className="invoice-list-container">
      <div className="invoice-list-header">
        <h2>📋 Factures émises</h2>
        <p>Historique de vos factures</p>
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
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Aucune facture émise</h3>
          <p>Vos factures créées apparaîtront ici</p>
        </div>
      ) : (
        <div className="invoices-grid">
          {invoices.map((invoice) => (
            <div 
              key={invoice._id || invoice.id} 
              className="invoice-card"
              onClick={() => handleViewInvoice(invoice)}
            >
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