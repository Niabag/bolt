import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import DynamicInvoice from '../Billing/DynamicInvoice';
import './clientBilling.scss';
import { calculateTTC } from '../../../utils/calculateTTC';

const ClientBilling = ({ client, onBack }) => {
  const navigate = useNavigate();
  const [devisList, setDevisList] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const invoicePreviewRef = useRef(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDevis: 0,
    totalInvoices: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0
  });
  
  // État pour la prévisualisation de facture existante
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceDevis, setSelectedInvoiceDevis] = useState([]);
  const invoiceEditPreviewRef = useRef(null);

  useEffect(() => {
    if (client && client._id) {
      fetchClientData();
    }
  }, [client]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // Récupérer les devis du client
      const devisData = await apiRequest(API_ENDPOINTS.DEVIS.BY_CLIENT(client._id));
      setDevisList(Array.isArray(devisData) ? devisData : []);
      
      // Récupérer les factures du client
      const invoicesData = await apiRequest(API_ENDPOINTS.INVOICES.BY_CLIENT(client._id));
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      
      // Calculer les statistiques
      const totalDevis = devisData.length;
      const totalInvoices = invoicesData.length;
      const totalAmount = devisData.reduce((sum, devis) => sum + calculateTTC(devis), 0);
      const pendingAmount = invoicesData
        .filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + inv.amount, 0);
      const paidAmount = invoicesData
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0);
      
      setStats({
        totalDevis,
        totalInvoices,
        totalAmount,
        pendingAmount,
        paidAmount
      });
      
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données du client");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = (devis) => {
    setSelectedDevis(devis);
    setSelectedInvoice(null); // Réinitialiser la facture sélectionnée
    
    // Faire défiler jusqu'à la prévisualisation
    setTimeout(() => {
      if (invoicePreviewRef.current) {
        invoicePreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleViewInvoice = async (invoice) => {
    try {
      setLoading(true);
      setSelectedDevis(null); // Réinitialiser le devis sélectionné
      setSelectedInvoice(invoice);
      
      // Récupérer les devis liés à cette facture
      const devisDetails = await Promise.all(
        (invoice.devisIds || []).map(async (devisId) => {
          try {
            return await apiRequest(API_ENDPOINTS.DEVIS.BY_ID(devisId));
          } catch (err) {
            console.error(`Erreur récupération devis ${devisId}:`, err);
            return null;
          }
        })
      );
      
      // Filtrer les devis null (en cas d'erreur)
      setSelectedInvoiceDevis(devisDetails.filter(Boolean));
      
      // Faire défiler jusqu'à la prévisualisation
      setTimeout(() => {
        if (invoiceEditPreviewRef.current) {
          invoiceEditPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      console.error('Erreur récupération des détails de facture:', err);
      setError("Erreur lors de la récupération des détails de la facture");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Logique de soumission du formulaire
  };

  const handleSaveInvoice = async (invoice) => {
    try {
      setLoading(true);
      
      // Préparer les données de la facture
      const invoiceData = {
        ...invoice,
        clientId: client._id,
        devisIds: [selectedDevis._id]
      };
      
      // Envoyer la requête à l'API
      const response = await apiRequest(API_ENDPOINTS.INVOICES.BASE, {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      });
      
      // Rafraîchir les données
      await fetchClientData();
      
      // Réinitialiser la sélection
      setSelectedDevis(null);
      
      alert('✅ Facture créée avec succès !');
    } catch (err) {
      console.error('Erreur création facture:', err);
      alert(`❌ Erreur lors de la création de la facture: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour une facture existante
  const handleUpdateInvoice = async (updatedInvoice) => {
    try {
      setLoading(true);
      
      // Préparer les données de la facture
      const invoiceData = {
        ...updatedInvoice,
        clientId: client._id
      };
      
      // Envoyer la requête à l'API
      const response = await apiRequest(API_ENDPOINTS.INVOICES.UPDATE(updatedInvoice._id || updatedInvoice.id), {
        method: 'PUT',
        body: JSON.stringify(invoiceData)
      });
      
      // Rafraîchir les données
      await fetchClientData();
      
      // Réinitialiser la sélection
      setSelectedInvoice(null);
      setSelectedInvoiceDevis([]);
      
      alert('✅ Facture mise à jour avec succès !');
    } catch (err) {
      console.error('Erreur mise à jour facture:', err);
      alert(`❌ Erreur lors de la mise à jour de la facture: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Changer le statut d'un devis depuis la facturation client
  const handleDevisStatusClick = async (devisId, currentStatus) => {
    let newStatus;

    // Cycle: nouveau -> en_attente -> fini -> inactif -> nouveau
    switch (currentStatus) {
      case 'nouveau':
        newStatus = 'en_attente';
        break;
      case 'en_attente':
        newStatus = 'fini';
        break;
      case 'fini':
        newStatus = 'inactif';
        break;
      case 'inactif':
        newStatus = 'nouveau';
        break;
      default:
        newStatus = 'en_attente';
    }

    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.DEVIS.UPDATE_STATUS(devisId), {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      await fetchClientData();
      console.log(`✅ Statut du devis mis à jour: ${currentStatus} → ${newStatus}`);
    } catch (err) {
      console.error('Erreur changement statut devis:', err);
      alert(`❌ Erreur lors du changement de statut: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Changer le statut d'une facture
  const handleInvoiceStatusClick = async (invoiceId, currentStatus) => {
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

      await fetchClientData();
      alert(`✅ Statut de la facture mis à jour : ${getStatusLabel(newStatus)}`);
    } catch (err) {
      console.error("Erreur changement statut facture:", err);
      alert(`❌ Erreur lors du changement de statut: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (devis) => {
    try {
      setLoading(true);
      
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
              <h1 style="font-size: 3rem; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: 2px;">DEVIS</h1>
            </div>
          </div>
        </div>
      `, true);

      // 2. INFORMATIONS PARTIES
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
              <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${client.name || 'Nom du client'}</div>
              <div>${client.email || 'Email du client'}</div>
              <div>${client.phone || 'Téléphone du client'}</div>
              <div>${client.address || 'Adresse du client'}</div>
              <div>${client.postalCode || ''} ${client.city || ''}</div>
            </div>
          </div>
        </div>
      `);

      // 3. MÉTADONNÉES
      await addSectionToPDF(`
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 30px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Date du devis :</div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${formatDate(devis.dateDevis)}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Numéro de devis :</div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${devis._id || 'À définir'}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Date de validité :</div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${formatDate(devis.dateValidite)}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Client :</div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${client.name || 'Client non défini'}</div>
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
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 6px; font-weight: 500;">
              <span>Total HT :</span>
              <span>${totalHT.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 6px; font-weight: 500;">
              <span>Total TVA :</span>
              <span>${totalTVA.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; font-weight: 700; font-size: 1.1rem; border-radius: 6px; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);">
              <span>Total TTC :</span>
              <span>${totalTTC.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      `);

      // 6. CONDITIONS
      await addSectionToPDF(`
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea; margin-top: 30px;">
          <div style="margin-bottom: 2rem;">
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;"><strong>Conditions :</strong></p>
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• Devis valable jusqu'au ${formatDate(devis.dateValidite) || "date à définir"}</p>
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• Règlement à 30 jours fin de mois</p>
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• TVA non applicable, art. 293 B du CGI (si applicable)</p>
          </div>
          
          <div style="text-align: center;">
            <p style="font-style: italic; color: #718096; margin-bottom: 2rem;">
              <em>Bon pour accord - Date et signature du client :</em>
            </p>
            <div style="display: flex; justify-content: space-around; gap: 2rem;">
              <div style="flex: 1; padding: 1rem; border-bottom: 2px solid #2d3748; color: #4a5568; font-weight: 500;">
                <span>Date : _______________</span>
              </div>
              <div style="flex: 1; padding: 1rem; border-bottom: 2px solid #2d3748; color: #4a5568; font-weight: 500;">
                <span>Signature :</span>
              </div>
            </div>
          </div>
        </div>
      `);

      // Télécharger le PDF
      const fileName = devis.title?.replace(/[^a-zA-Z0-9]/g, '-') || `devis-${devis._id}`;
      pdf.save(`${fileName}.pdf`);

      // Nettoyer
      document.body.removeChild(tempDiv);
      
      console.log("✅ PDF généré avec succès");

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Télécharger une facture en PDF
  const handleDownloadInvoicePDF = async (invoice) => {
    try {
      setLoading(true);

      const [{ default: jsPDF }] = await Promise.all([
        import('jspdf')
      ]);

      // Récupérer les détails des devis liés à la facture
      const devisDetails = await Promise.all(
        (invoice.devisIds || []).map(async (id) => {
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

      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.setFontSize(18);
      pdf.text(`Facture ${invoice.invoiceNumber}`, 105, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text(`Client : ${client.name}`, 20, 40);
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

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm("Supprimer cette facture ?")) {
      try {
        setLoading(true);
        await apiRequest(API_ENDPOINTS.INVOICES.DELETE(invoiceId), {
          method: 'DELETE'
        });
        
        await fetchClientData();
        alert('✅ Facture supprimée avec succès');
        
        // Réinitialiser la sélection si c'est la facture actuellement sélectionnée
        if (selectedInvoice && (selectedInvoice.id === invoiceId || selectedInvoice._id === invoiceId)) {
          setSelectedInvoice(null);
          setSelectedInvoiceDevis([]);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('❌ Erreur lors de la suppression de la facture');
      } finally {
        setLoading(false);
      }
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

  return (
    <div className="client-billing-container">
      <div className="client-billing-header">
        <button onClick={onBack} className="back-button">
          ← Retour aux prospects
        </button>
        
        <div className="client-info">
          <div className="client-avatar">
            {client.name ? client.name.charAt(0).toUpperCase() : "C"}
          </div>
          <div className="client-details">
            <h2>{client.name}</h2>
            <div className="client-contact">
              <span>{client.email}</span>
              <span>•</span>
              <span>{client.phone}</span>
              {client.company && (
                <>
                  <span>•</span>
                  <span>{client.company}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="billing-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{stats.totalAmount.toFixed(2)} €</h3>
            <p>Montant total</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>{stats.totalDevis}</h3>
            <p>Devis</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalInvoices}</h3>
            <p>Factures</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingAmount.toFixed(2)} €</h3>
            <p>En attente</p>
          </div>
        </div>
      </div>

      <div className="client-billing-actions">
        <button className="create-invoice-btn" onClick={() => setSelectedDevis(devisList[0])}>
          + Créer une nouvelle facture
        </button>
      </div>

      {/* Section des devis */}
      <div className="devis-section">
        <h3>Devis ({devisList.length})</h3>
        
        {loading && devisList.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Chargement des devis...</p>
          </div>
        ) : devisList.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-icon">📄</div>
            <h3>Aucun devis</h3>
            <p>Créez votre premier devis pour ce client</p>
          </div>
        ) : (
          <div className="devis-grid">
            {devisList.map((devis) => {
              const ttc = calculateTTC(devis);
              
              return (
                <div 
                  key={devis._id} 
                  className="devis-card"
                  onClick={() => handleCreateInvoice(devis)}
                >
                  <div className="devis-card-top">
                    <div className="devis-avatar">
                      {devis.title ? devis.title.charAt(0).toUpperCase() : "D"}
                    </div>
                    
                    <div 
                      className="status-indicator clickable"
                      style={{ 
                        backgroundColor: getDevisStatusColor(devis.status),
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem'
                      }}
                      title={`Cliquer pour changer le statut`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDevisStatusClick(devis._id, devis.status);
                      }}
                    >
                      {getDevisStatusIcon(devis.status)}
                    </div>
                  </div>
                  
                  <div className="devis-card-content">
                    <div className="devis-card-header">
                      <h3 className="devis-card-title">Devis {formatDate(devis.dateDevis)}</h3>
                      
                      <div className="devis-card-meta">
                        <div className="devis-card-date">
                          <span>📅</span>
                          <span>{formatDate(devis.dateDevis)}</span>
                        </div>
                        <div className="devis-card-amount">
                          <span>💰</span>
                          <span>{ttc.toFixed(2)} € TTC</span>
                        </div>
                      </div>
                    </div>

                    <div className="devis-client-info">
                      <span className="devis-client-icon">👤</span>
                      <span className="devis-client-name">{client.name}</span>
                    </div>
                    
                    <div 
                      className="devis-status-badge"
                      style={{ 
                        backgroundColor: getDevisStatusColor(devis.status),
                        color: 'white'
                      }}
                    >
                      {getDevisStatusIcon(devis.status)} {getDevisStatusLabel(devis.status)}
                    </div>
                    
                    <div className="devis-card-actions">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(devis);
                        }}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded px-3 py-1 text-sm"
                        disabled={loading}
                        title="Télécharger PDF"
                      >
                        {loading ? "⏳" : "📄"} PDF
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateInvoice(devis);
                        }}
                        className="bg-green-50 text-green-600 hover:bg-green-100 rounded px-3 py-1 text-sm"
                        title="Créer une facture"
                      >
                        💶 Facture
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section des factures */}
      <div className="invoices-section">
        <h3>Factures ({invoices.length})</h3>
        
        {loading && invoices.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Chargement des factures...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-icon">📋</div>
            <h3>Aucune facture</h3>
            <p>Créez votre première facture pour ce client</p>
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
                      handleInvoiceStatusClick(invoice._id || invoice.id, invoice.status);
                    }}
                  >
                    {getStatusIcon(invoice.status)} {getStatusLabel(invoice.status)}
                  </div>
                </div>
                
                <div className="invoice-content">
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
                </div>
                
                <div className="invoice-actions flex gap-2">
                  <button
                    className="bg-green-50 text-green-600 hover:bg-green-100 rounded px-3 py-1 text-sm"
                    title="Télécharger PDF"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadInvoicePDF(invoice);
                    }}
                  >
                    📥 PDF
                  </button>

                  <button
                    className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded px-3 py-1 text-sm"
                    title="Envoyer par email"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📧 Envoyer
                  </button>

                  <button
                    className="bg-red-50 text-red-600 hover:bg-red-100 rounded px-3 py-1 text-sm"
                    title="Supprimer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteInvoice(invoice._id || invoice.id);
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Affichage de la facture directement dans la page */}
      {selectedDevis && (
        <div className="invoice-preview-section" ref={invoicePreviewRef}>
          <div className="section-header">
            <h3>Création de facture</h3>
            <p>Basée sur le devis: {selectedDevis.title || formatDate(selectedDevis.dateDevis)}</p>
          </div>
          
          <DynamicInvoice
            invoice={{
              invoiceNumber: `FACT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              createdAt: new Date().toISOString().split('T')[0]
            }}
            client={client}
            devisDetails={[selectedDevis]}
            onSave={handleSaveInvoice}
            onCancel={() => setSelectedDevis(null)}
          />
        </div>
      )}

      {/* Prévisualisation de facture existante */}
      {selectedInvoice && (
        <div className="invoice-preview-section" ref={invoiceEditPreviewRef}>
          <div className="section-header">
            <h3>Modification de facture</h3>
            <p>Facture: {selectedInvoice.invoiceNumber}</p>
          </div>
          
          <DynamicInvoice
            invoice={selectedInvoice}
            client={client}
            devisDetails={selectedInvoiceDevis}
            onSave={handleUpdateInvoice}
            onCancel={() => {
              setSelectedInvoice(null);
              setSelectedInvoiceDevis([]);
            }}
          />
        </div>
      )}
    </div>
  );
};

// Fonctions utilitaires pour les statuts de devis
const getDevisStatusColor = (status) => {
  switch (status) {
    case 'nouveau': return '#3b82f6'; // Bleu
    case 'en_attente': return '#8b5cf6'; // Violet
    case 'fini': return '#10b981'; // Vert
    case 'inactif': return '#ef4444'; // Rouge
    default: return '#3b82f6';
  }
};

const getDevisStatusLabel = (status) => {
  switch (status) {
    case 'nouveau': return 'Nouveau';
    case 'en_attente': return 'En attente';
    case 'fini': return 'Finalisé';
    case 'inactif': return 'Inactif';
    default: return 'Nouveau';
  }
};

const getDevisStatusIcon = (status) => {
  switch (status) {
    case 'nouveau': return '🔵';
    case 'en_attente': return '🟣';
    case 'fini': return '🟢';
    case 'inactif': return '🔴';
    default: return '🔵';
  }
};

export default ClientBilling;