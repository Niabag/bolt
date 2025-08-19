import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import DynamicInvoice from './DynamicInvoice';
import InvoiceCard from './InvoiceCard';
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
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      
      // Créer un conteneur temporaire pour le PDF
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.fontSize = '14px';
      tempContainer.style.lineHeight = '1.4';
      tempContainer.style.color = '#2d3748';
      document.body.appendChild(tempContainer);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      let currentY = 0;
      
      // Fonction pour ajouter une section au PDF
      const addSectionToPDF = async (htmlContent, isFirstSection = false) => {
        tempContainer.innerHTML = `
          <div style="padding: ${margin}px; width: ${794 - (margin * 2)}px; box-sizing: border-box;">
            ${htmlContent}
          </div>
        `;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794,
          height: tempContainer.scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (!isFirstSection && currentY + imgHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        } else if (isFirstSection) {
          currentY = margin;
        }
        
        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
        
        return currentY;
      };
      
      // Fusionner tous les articles des devis
      const allArticles = devisDetails.flatMap(devis => devis.articles || []);
      
      // Calculer les totaux
      const tauxTVA = {
        "20": { ht: 0, tva: 0 },
        "10": { ht: 0, tva: 0 },
        "5.5": { ht: 0, tva: 0 },
      };
      
      allArticles.forEach((item) => {
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
      
      // 1. EN-TÊTE
      await addSectionToPDF(`
        <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              ${devisDetails[0]?.logoUrl ? `<img src="${devisDetails[0].logoUrl}" alt="Logo" style="max-width: 200px; max-height: 100px; object-fit: contain; border-radius: 8px;">` : ''}
            </div>
            <div style="flex: 1; text-align: right;">
              <h1 style="font-size: 3rem; font-weight: 700; margin: 0; color: #2d3748; letter-spacing: 2px;">FACTURE</h1>
            </div>
          </div>
        </div>
      `, true);
      
      // 2. INFORMATIONS DES PARTIES
      await addSectionToPDF(`
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 25px; border-radius: 15px; border: 2px solid #e2e8f0; border-left: 5px solid #3182ce;">
            <h3 style="font-size: 16px; font-weight: 700; color: #2d3748; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">ÉMETTEUR</h3>
            <div style="font-size: 14px; line-height: 1.6; color: #2d3748;">
              <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">${devisDetails[0]?.entrepriseName || 'Votre Entreprise'}</div>
              <div>${devisDetails[0]?.entrepriseAddress || '123 Rue Exemple'}</div>
              <div>${devisDetails[0]?.entrepriseCity || '75000 Paris'}</div>
              ${devisDetails[0]?.entrepriseSiret ? `<div>SIRET/SIREN: ${devisDetails[0].entrepriseSiret}</div>` : ''}
              ${devisDetails[0]?.entrepriseTva ? `<div>N° TVA: ${devisDetails[0].entrepriseTva}</div>` : ''}
              <div>${devisDetails[0]?.entreprisePhone || '01 23 45 67 89'}</div>
              <div>${devisDetails[0]?.entrepriseEmail || 'contact@entreprise.com'}</div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 25px; border-radius: 15px; border: 2px solid #e2e8f0; border-left: 5px solid #3182ce;">
            <h3 style="font-size: 16px; font-weight: 700; color: #2d3748; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">DESTINATAIRE</h3>
            <div style="font-size: 14px; line-height: 1.6; color: #2d3748;">
              <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">${client?.name || 'Client inconnu'}</div>
              <div>${client?.email || ''}</div>
              <div>${client?.phone || ''}</div>
              <div>${client?.address || ''}</div>
              <div>${client?.postalCode || ''} ${client?.city || ''}</div>
              ${client?.company ? `<div style="font-weight: 600; color: #3182ce;">${client.company}</div>` : ''}
            </div>
          </div>
        </div>
      `);
      
      // 3. MÉTADONNÉES
      await addSectionToPDF(`
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 15px; margin-bottom: 30px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: rgba(255, 255, 255, 0.15); padding: 15px; border-radius: 10px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);">
              <div style="font-weight: 600; color: white; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Date de la facture :</div>
              <div style="font-weight: 700; color: white; font-size: 16px;">${formatDate(invoice.createdAt)}</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.15); padding: 15px; border-radius: 10px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);">
              <div style="font-weight: 600; color: white; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Numéro de facture :</div>
              <div style="font-weight: 700; color: white; font-size: 16px;">${invoice.invoiceNumber}</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.15); padding: 15px; border-radius: 10px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);">
              <div style="font-weight: 600; color: white; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Date d'échéance :</div>
              <div style="font-weight: 700; color: white; font-size: 16px;">${formatDate(invoice.dueDate)}</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.15); padding: 15px; border-radius: 10px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);">
              <div style="font-weight: 600; color: white; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Statut :</div>
              <div style="font-weight: 700; color: white; font-size: 16px;">${getStatusLabel(invoice.status)}</div>
            </div>
          </div>
        </div>
      `);
      
      // 4. TABLEAU DES PRESTATIONS
      if (allArticles.length > 0) {
        await addSectionToPDF(`
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: 700; color: #2d3748; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">DÉTAIL DES PRESTATIONS</h3>
            <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
              <thead>
                <tr style="background: #2d3748; color: white;">
                  <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; width: 35%;">Description</th>
                  <th style="padding: 15px 12px; text-align: center; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">Unité</th>
                  <th style="padding: 15px 12px; text-align: center; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">Qté</th>
                  <th style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; width: 15%;">Prix unitaire HT</th>
                  <th style="padding: 15px 12px; text-align: center; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">TVA</th>
                  <th style="padding: 15px 12px; text-align: right; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; width: 20%;">Total HT</th>
                </tr>
              </thead>
              <tbody>
                ${allArticles.map((article, index) => {
                  const price = parseFloat(article.unitPrice || 0);
                  const qty = parseFloat(article.quantity || 0);
                  const lineTotal = isNaN(price) || isNaN(qty) ? 0 : price * qty;
                  const isEven = index % 2 === 0;
                  
                  return `
                    <tr style="background: ${isEven ? '#f8fafc' : 'white'}; border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 12px; font-size: 14px; color: #2d3748; font-weight: 500;">${article.description || 'Article sans description'}</td>
                      <td style="padding: 12px; font-size: 14px; color: #2d3748; text-align: center;">${article.unit || 'u'}</td>
                      <td style="padding: 12px; font-size: 14px; color: #2d3748; text-align: center;">${qty}</td>
                      <td style="padding: 12px; font-size: 14px; color: #2d3748; text-align: right; font-weight: 600;">${price.toFixed(2)} €</td>
                      <td style="padding: 12px; font-size: 14px; color: #2d3748; text-align: center;">${article.tvaRate || 0}%</td>
                      <td style="padding: 12px; font-size: 14px; color: #2d3748; text-align: right; font-weight: 600;">${lineTotal.toFixed(2)} €</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `);
      }
      
      // 5. TOTAUX
      await addSectionToPDF(`
        <div style="margin-bottom: 30px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
              <h4 style="font-size: 16px; font-weight: 700; color: #2d3748; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Récapitulatif TVA</h4>
              <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                <thead>
                  <tr style="background: #3182ce; color: white;">
                    <th style="padding: 12px; font-weight: 600; font-size: 14px; text-align: center;">Base HT</th>
                    <th style="padding: 12px; font-weight: 600; font-size: 14px; text-align: center;">Taux TVA</th>
                    <th style="padding: 12px; font-weight: 600; font-size: 14px; text-align: center;">Montant TVA</th>
                    <th style="padding: 12px; font-weight: 600; font-size: 14px; text-align: center;">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(tauxTVA)
                    .filter(([, { ht }]) => ht > 0)
                    .map(([rate, { ht, tva }]) => `
                      <tr style="background: white; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px; text-align: center; color: #2d3748; font-weight: 500;">${ht.toFixed(2)} €</td>
                        <td style="padding: 12px; text-align: center; color: #2d3748; font-weight: 500;">${rate}%</td>
                        <td style="padding: 12px; text-align: center; color: #2d3748; font-weight: 500;">${tva.toFixed(2)} €</td>
                        <td style="padding: 12px; text-align: center; color: #2d3748; font-weight: 500;">${(ht + tva).toFixed(2)} €</td>
                      </tr>
                    `).join('')}
                </tbody>
              </table>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px; align-self: end; margin-left: auto; width: 350px;">
              <div style="display: flex; justify-content: space-between; padding: 12px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 15px; color: #2d3748; border-top-left-radius: 12px; border-top-right-radius: 12px;">
                <span>Total HT :</span>
                <span>${totalHT.toFixed(2)} €</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 15px; color: #2d3748;">
                <span>Total TVA :</span>
                <span>${totalTVA.toFixed(2)} €</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 20px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                <span>Total TTC :</span>
                <span>${totalTTC.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
      `);
      
      // 6. CONDITIONS
      await addSectionToPDF(`
        <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 25px; border-radius: 15px; border: 2px solid #e2e8f0; border-left: 5px solid #3182ce;">
          <div style="margin-bottom: 25px;">
            <p style="font-size: 16px; font-weight: 700; color: #2d3748; margin-bottom: 15px;"><strong>Conditions :</strong></p>
            <p style="margin-bottom: 8px; font-size: 14px; color: #2d3748; line-height: 1.5;">• Facture payable sous ${invoice.paymentTerms || 30} jours</p>
            <p style="margin-bottom: 8px; font-size: 14px; color: #2d3748; line-height: 1.5;">• Date d'échéance : ${formatDate(invoice.dueDate)}</p>
            <p style="margin-bottom: 8px; font-size: 14px; color: #2d3748; line-height: 1.5;">• ${invoice.notes || 'Merci pour votre confiance'}</p>
          </div>
          
          <div style="border-top: 2px solid #e2e8f0; padding-top: 20px;">
            <p style="font-size: 14px; color: #2d3748; margin-bottom: 15px; text-align: center;">
              <em>Bon pour accord - Date et signature du client :</em>
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
              <div style="text-align: center; padding: 15px; border: 2px solid #e2e8f0; border-radius: 10px; background: white; min-height: 60px; display: flex; align-items: flex-end; justify-content: center;">
                <span style="font-size: 14px; color: #718096; font-weight: 500;">Date : _______________</span>
              </div>
              <div style="text-align: center; padding: 15px; border: 2px solid #e2e8f0; border-radius: 10px; background: white; min-height: 60px; display: flex; align-items: flex-end; justify-content: center;">
                <span style="font-size: 14px; color: #718096; font-weight: 500;">Signature :</span>
              </div>
            </div>
          </div>
        </div>
      `);
      
      // Nettoyer le conteneur temporaire
      document.body.removeChild(tempContainer);
      
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
              <InvoiceCard
                key={invoice._id || invoice.id}
                invoice={invoice}

                onView={handleViewInvoice}
                onPdf={handleDownloadPDF}
                onDelete={handleDeleteInvoice}
                onStatusChange={handleStatusChange}
                loading={loading}
                clients={clients}
              />
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
