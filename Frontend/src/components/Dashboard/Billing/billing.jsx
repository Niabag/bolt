import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import DynamicInvoice from './DynamicInvoice';
import InvoiceList from './InvoiceList';
import './billing.scss';

const Billing = ({ clients = [], onRefresh }) => {
  const navigate = useNavigate();
  const [devisList, setDevisList] = useState([]);
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
  // État pour l'onglet actif
  const [activeTab, setActiveTab] = useState('devis'); // 'devis' ou 'factures'

  useEffect(() => {
    const loadData = async () => {
      await fetchDevis();
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

      // Préparer les données de la facture
      const invoiceData = {
        invoiceNumber: invoiceToSave.invoiceNumber,
        clientId: invoiceToSave.clientId,
        devisIds: invoiceToSave.devisIds,
        amount: total,
        status: invoiceToSave.status || 'draft',
        dueDate: invoiceToSave.dueDate,
        notes: invoiceToSave.notes,
        paymentTerms: invoiceToSave.paymentTerms,
        discount: invoiceToSave.discount,
        taxRate: invoiceToSave.taxRate,
        entrepriseName: invoiceToSave.entrepriseName,
        entrepriseAddress: invoiceToSave.entrepriseAddress,
        entrepriseCity: invoiceToSave.entrepriseCity,
        entreprisePhone: invoiceToSave.entreprisePhone,
        entrepriseEmail: invoiceToSave.entrepriseEmail,
        logoUrl: invoiceToSave.logoUrl
      };

      // Envoyer la requête à l'API
      const response = await apiRequest(API_ENDPOINTS.INVOICES.BASE, {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      });
      
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
      
      // Passer à l'onglet des factures
      setActiveTab('factures');
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      alert('❌ Erreur lors de la création de la facture');
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
      const clientInfo = clients.find(c => c._id === devis.clientId) || {};
      
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
              <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${clientInfo.name || 'Nom du client'}</div>
              <div>${clientInfo.email || 'Email du client'}</div>
              <div>${clientInfo.phone || 'Téléphone du client'}</div>
              <div>${devis.clientAddress || 'Adresse du client'}</div>
              <div>${clientInfo.postalCode || ''} ${clientInfo.city || ''}</div>
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
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${clientInfo.name || 'Client non défini'}</div>
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
                <h3>0.00 € TTC</h3>
                <p>Chiffre d'affaires</p>
                <span className="stat-trend">Factures payées</span>
              </div>
            </div>
            
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>0.00 € TTC</h3>
                <p>En attente</p>
                <span className="stat-trend">À encaisser</span>
              </div>
            </div>
            
            <div className="stat-card overdue">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>0.00 € TTC</h3>
                <p>En retard</p>
                <span className="stat-trend">Relances nécessaires</span>
              </div>
            </div>
            
            <div className="stat-card total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>0</h3>
                <p>Factures totales</p>
                <span className="stat-trend">Toutes périodes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="billing-tabs">
        <button 
          className={`tab-button ${activeTab === 'devis' ? 'active' : ''}`}
          onClick={() => setActiveTab('devis')}
        >
          📄 Devis disponibles
        </button>
        <button 
          className={`tab-button ${activeTab === 'factures' ? 'active' : ''}`}
          onClick={() => setActiveTab('factures')}
        >
          💰 Factures émises
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'devis' ? (
        <>
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
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded px-3 py-1 text-sm"
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
                    invoiceNumber: `FACT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
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
        </>
      ) : (
        <InvoiceList clients={clients} />
      )}
    </div>
  );
};

export default Billing;