import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './devis.scss';
import { calculateTTC } from '../../../utils/calculateTTC';

const DevisListPage = ({
  clients = [],
  onEditDevis,
  onCreateDevis
}) => {
  const navigate = useNavigate();
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Stats pour le header
  const [stats, setStats] = useState({
    total: 0,
    nouveau: 0,
    en_attente: 0,
    fini: 0,
    inactif: 0
  });
  
  // États pour filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  
  // États pour pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9; // Maximum 9 devis par page

  // États pour la prévisualisation de devis
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const devisPreviewRef = useRef(null);

  useEffect(() => {
    fetchAllDevis();
  }, []);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  // Effet pour faire défiler jusqu'à la prévisualisation quand un devis est sélectionné
  useEffect(() => {
    if (selectedDevis && devisPreviewRef.current) {
      setTimeout(() => {
        devisPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedDevis]);

  const fetchAllDevis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(API_ENDPOINTS.DEVIS.BASE);
      const devisArray = Array.isArray(data) ? data : [];
      setDevisList(devisArray);
      
      // Calculer les statistiques
      const statsData = {
        total: devisArray.length,
        nouveau: devisArray.filter(d => d.status === 'nouveau').length,
        en_attente: devisArray.filter(d => d.status === 'en_attente').length,
        fini: devisArray.filter(d => d.status === 'fini').length,
        inactif: devisArray.filter(d => d.status === 'inactif').length
      };
      setStats(statsData);
      
      console.log("📋 Devis récupérés:", devisArray.length);
      
    } catch (err) {
      console.error("Erreur récupération des devis:", err);
      setError("Erreur lors de la récupération des devis");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer et trier les devis
  const filteredDevis = devisList
    .filter(devis => {
      const client = clients.find(c => c._id === (typeof devis.clientId === "object" ? devis.clientId?._id : devis.clientId));
      const clientName = client?.name || "Client inconnu";
      
      const matchesSearch = devis.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           devis.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'nouveau' && devis.status === 'nouveau') ||
                           (statusFilter === 'en_attente' && devis.status === 'en_attente') ||
                           (statusFilter === 'fini' && devis.status === 'fini') ||
                           (statusFilter === 'inactif' && devis.status === 'inactif');
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
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

  // Calculs de pagination
  const totalPages = Math.ceil(filteredDevis.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDevis = filteredDevis.slice(startIndex, endIndex);

  const handleDelete = async (id) => {
    const confirm = window.confirm("❗ Supprimer ce devis ?");
    if (!confirm) return;

    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.DEVIS.DELETE(id), {
        method: "DELETE",
      });

      await fetchAllDevis();
      alert("✅ Devis supprimé");
      
      // Ajuster la page si nécessaire après suppression
      const newFilteredLength = filteredDevis.length - 1;
      const newTotalPages = Math.ceil(newFilteredLength / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert(`❌ Erreur lors de la suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Changer le statut d'un devis
  const handleStatusClick = async (devisId, currentStatus) => {
    let newStatus;
    
    // CYCLE: nouveau -> en_attente -> fini -> inactif -> nouveau
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
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      await fetchAllDevis();
      console.log(`✅ Statut changé: ${currentStatus} → ${newStatus}`);
    } catch (err) {
      console.error("Erreur changement statut:", err);
      alert(`❌ Erreur lors du changement de statut: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sélectionner un devis pour prévisualisation
  const handleSelectDevis = (devis) => {
    const clientInfo = clients.find(c => c._id === (typeof devis.clientId === 'object' ? devis.clientId?._id : devis.clientId));
    setSelectedDevis(devis);
    setSelectedClient(clientInfo);
  };

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

  // FONCTIONS POUR LES STATUTS
  const getStatusColor = (status) => {
    switch (status) {
      case 'nouveau': return '#3b82f6'; // Bleu
      case 'en_attente': return '#8b5cf6'; // Violet
      case 'fini': return '#10b981'; // Vert
      case 'inactif': return '#ef4444'; // Rouge
      default: return '#3b82f6';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'nouveau': return 'Nouveau';
      case 'en_attente': return 'En attente';
      case 'fini': return 'Finalisé';
      case 'inactif': return 'Inactif';
      default: return 'Nouveau';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'nouveau': return '🔵';
      case 'en_attente': return '🟣';
      case 'fini': return '🟢';
      case 'inactif': return '🔴';
      default: return '🔵';
    }
  };

  const getNextStatusLabel = (status) => {
    switch (status) {
      case 'nouveau': return 'Cliquer pour passer en Attente';
      case 'en_attente': return 'Cliquer pour marquer Finalisé';
      case 'fini': return 'Cliquer pour passer en Inactif';
      case 'inactif': return 'Cliquer pour remettre en Nouveau';
      default: return 'Cliquer pour changer le statut';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch (error) {
      return dateStr;
    }
  };

  // ✅ GÉNÉRATION PDF AVEC COUPURES AU NIVEAU DES LIGNES DE TABLEAU
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
              <h1 style="font-size: 3rem; font-weight: 700; margin: 0; color: #0f172a; letter-spacing: 2px;">DEVIS</h1>
            </div>
          </div>
        </div>
      `, true);

      // 2. INFORMATIONS PARTIES
      await addSectionToPDF(generatePartiesHTML(devis));

      // 3. MÉTADONNÉES
      await addSectionToPDF(generateMetadataHTML(devis));

      // 4. TABLEAU - TRAITEMENT LIGNE PAR LIGNE
      // En-tête du tableau
      await addSectionToPDF(generateTableHeaderHTML());

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
      await addSectionToPDF(generateTotalsHTML(devis));

      // 6. CONDITIONS
      await addSectionToPDF(generateConditionsHTML(devis));

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

  // ✅ FONCTIONS POUR GÉNÉRER CHAQUE SECTION HTML
  const generateHeaderHTML = (devis) => `
    <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #e2e8f0;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          ${devis.logoUrl ? `<img src="${devis.logoUrl}" alt="Logo" style="max-width: 200px; max-height: 100px; object-fit: contain; border-radius: 8px;">` : ''}
        </div>
        <div style="flex: 1; text-align: right;">
          <h1 style="font-size: 3rem; font-weight: 700; margin: 0; color: #2d3748; letter-spacing: 2px;">DEVIS</h1>
        </div>
      </div>
    </div>
  `;

  const generatePartiesHTML = (devis) => {
    const clientInfo = clients.find(c => c._id === (typeof devis.clientId === 'object' ? devis.clientId?._id : devis.clientId)) || {};
    
    return `
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
          </div>
        </div>
      </div>
    `;
  };

  const generateMetadataHTML = (devis) => {
    const clientInfo = clients.find(c => c._id === (typeof devis.clientId === 'object' ? devis.clientId?._id : devis.clientId)) || {};
    
    return `
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
    `;
  };

  const generateTableHeaderHTML = () => `
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
  `;

  const generateTotalsHTML = (devis) => {
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

    return `
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
    `;
  };

  const generateConditionsHTML = (devis) => `
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
  `;

  const handleSendEmail = async (devisId) => {
    try {
      setLoading(true);
      
      await apiRequest(API_ENDPOINTS.DEVIS.SEND_BY_EMAIL(devisId), {
        method: 'POST'
      });
      
      alert('✅ Devis envoyé par email avec succès');
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      alert(`❌ Erreur lors de l'envoi de l'email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !devisList.length) {
    return (
      <div className="loading-state">
        <div className="loading-spinner">⏳</div>
        <p>Chargement des devis...</p>
      </div>
    );
  }

  return (
    <div className="devis-page">
      {/* En-tête avec titre et statistiques métier */}
      <div className="prospects-header">
        <div className="header-content">
          <h1 className="page-title">📄 Mes Devis</h1>
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{filteredDevis.length}</span>
              <span className="stat-label">Affichés</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.nouveau}</span>
              <span className="stat-label">🔵 Nouveaux</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.en_attente}</span>
              <span className="stat-label">🟣 En attente</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.fini}</span>
              <span className="stat-label">🟢 Finalisés</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.inactif}</span>
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
              placeholder="Rechercher par titre, client ou description..."
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
              <option value="fini">🟢 Finalisés</option>
              <option value="inactif">🔴 Inactifs</option>
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
              <option value="title">Titre A-Z</option>
              <option value="client">Client A-Z</option>
              <option value="amount">Montant décroissant</option>
            </select>
          </div>

          <div className="filter-actions">
            <button 
              onClick={onCreateDevis}
              className="cta-button"
            >
              ✨ Créer un devis
            </button>
          </div>
        </div>

        {/* Informations de pagination */}
        {filteredDevis.length > 0 && (
          <div className="pagination-info">
            <span>
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredDevis.length)} sur {filteredDevis.length} devis
              {totalPages > 1 && ` (Page ${currentPage} sur ${totalPages})`}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-state">{error}</div>
      )}

      {loading && devisList.length === 0 ? (
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Chargement...</p>
        </div>
      ) : filteredDevis.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>
            {searchTerm || statusFilter !== 'all' 
              ? "Aucun devis trouvé" 
              : "Aucun devis créé"
            }
          </h3>
          <p>
            {searchTerm || statusFilter !== 'all'
              ? "Essayez de modifier vos critères de recherche"
              : "Commencez par créer votre premier devis !"
            }
          </p>
          {onCreateDevis && (!searchTerm && statusFilter === 'all') && (
            <button onClick={onCreateDevis} className="cta-button">
              🆕 Créer un nouveau devis
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grille des cartes devis */}
          <div className="devis-grid">
            {currentDevis.map((devisItem) => {
              const clientInfo = clients.find(c => c._id === (typeof devisItem.clientId === "object" ? devisItem.clientId?._id : devisItem.clientId));
              const ttc = calculateTTC(devisItem);
              
              return (
                <div 
                  key={devisItem._id} 
                  className="devis-card"
                  onClick={() => handleSelectDevis(devisItem)}
                >
                  {/* Section supérieure */}
                  <div className="devis-card-top">
                    {/* Avatar pour le devis */}
                    <div className="devis-avatar">
                      {devisItem.title ? devisItem.title.charAt(0).toUpperCase() : "D"}
                    </div>

                    {/* Indicateur de statut */}
                    <div 
                      className="status-indicator clickable"
                      style={{ 
                        backgroundColor: getStatusColor(devisItem.status),
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem'
                      }}
                      title={getNextStatusLabel(devisItem.status)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusClick(devisItem._id, devisItem.status);
                      }}
                    >
                      {getStatusIcon(devisItem.status)}
                    </div>
                  </div>

                  {/* Section contenu principal */}
                  <div className="devis-card-content">
                    <div className="devis-card-header">
                      <h3 className="devis-card-title">Devis {formatDate(devisItem.dateDevis)}</h3>
                      
                      <div className="devis-card-meta">
                        <div className="devis-card-date">
                          <span>📅</span>
                          <span>{formatDate(devisItem.dateDevis)}</span>
                        </div>
                        <div className="devis-card-amount">
                          <span>💰</span>
                          <span>{ttc.toFixed(2)} € TTC</span>
                        </div>
                      </div>
                    </div>

                    {/* Informations client */}
                    <div className="devis-client-info">
                      <span className="devis-client-icon">👤</span>
                      <span className="devis-client-name">{clientInfo?.name || "Client inconnu"}</span>
                    </div>

                    {/* Badge de statut */}
                    <div className="devis-status-badge" style={{ backgroundColor: getStatusColor(devisItem.status), color: 'white' }}>
                      {getStatusIcon(devisItem.status)} {getStatusLabel(devisItem.status)}
                    </div>

                    {/* Actions */}
                    <div className="devis-card-actions">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(devisItem);
                        }}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded px-3 py-1 text-sm"
                        disabled={loading}
                      >
                        {loading ? "⏳" : "📄"} PDF
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendEmail(devisItem._id);
                        }}
                        className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded px-3 py-1 text-sm"
                        disabled={loading}
                      >
                        {loading ? "⏳" : "📧"} Email
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditDevis && onEditDevis(devisItem);
                        }}
                        className="bg-green-50 text-green-600 hover:bg-green-100 rounded px-3 py-1 text-sm"
                      >
                        ✏️ Éditer
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(devisItem._id);
                        }}
                        className="bg-red-50 text-red-600 hover:bg-red-100 rounded px-3 py-1 text-sm"
                        title="Supprimer"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  Page {currentPage} sur {totalPages} • {filteredDevis.length} devis au total
                </span>
              </div>
            </div>
          )}

          {/* Prévisualisation de devis */}
          {selectedDevis && (
            <div className="devis-preview-section" ref={devisPreviewRef}>
              <div className="section-header">
                <h3>Prévisualisation du devis</h3>
                <p>Devis: {selectedDevis.title || formatDate(selectedDevis.dateDevis)}</p>
                <button 
                  onClick={() => setSelectedDevis(null)}
                  className="close-preview-btn"
                >
                  ✕ Fermer
                </button>
              </div>
              
              {/* Ici, nous utilisons un composant de prévisualisation de devis au lieu de facture */}
              <div className="devis-preview-container">
                {/* En-tête */}
                <div className="preview-header">
                  <div className="company-info">
                    {selectedDevis.logoUrl && (
                      <img src={selectedDevis.logoUrl} alt="Logo" className="company-logo" />
                    )}
                    <div className="company-details">
                      <div className="company-name">{selectedDevis.entrepriseName || "Votre Entreprise"}</div>
                      <div>{selectedDevis.entrepriseAddress || "123 Rue Exemple"}</div>
                      <div>{selectedDevis.entrepriseCity || "75000 Paris"}</div>
                      <div>{selectedDevis.entreprisePhone || "01 23 45 67 89"}</div>
                      <div>{selectedDevis.entrepriseEmail || "contact@entreprise.com"}</div>
                    </div>
                  </div>
                  <div className="document-info">
                    <h1>DEVIS</h1>
                    <div className="document-number">N° {selectedDevis._id}</div>
                    <div className="document-date">Date: {formatDate(selectedDevis.dateDevis)}</div>
                    <div className="document-validity">Validité: {formatDate(selectedDevis.dateValidite)}</div>
                  </div>
                </div>

                {/* Client */}
                <div className="client-section">
                  <div className="section-title">DESTINATAIRE</div>
                  <div className="client-details">
                    <p className="client-name">{selectedClient?.name || "Client"}</p>
                    <p>{selectedClient?.email}</p>
                    <p>{selectedClient?.phone}</p>
                    <p>{selectedClient?.address}</p>
                    <p>{selectedClient?.postalCode} {selectedClient?.city}</p>
                  </div>
                </div>

                {/* Articles */}
                <div className="articles-section">
                  <table className="articles-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Quantité</th>
                        <th>Prix unitaire</th>
                        <th>TVA</th>
                        <th>Total HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDevis.articles && selectedDevis.articles.map((article, index) => {
                        const price = parseFloat(article.unitPrice || 0);
                        const qty = parseFloat(article.quantity || 0);
                        const lineTotal = isNaN(price) || isNaN(qty) ? 0 : price * qty;
                        
                        return (
                          <tr key={index}>
                            <td>{article.description || "Article sans description"}</td>
                            <td>{qty}</td>
                            <td>{price.toFixed(2)} €</td>
                            <td>{article.tvaRate || 0}%</td>
                            <td>{lineTotal.toFixed(2)} €</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totaux */}
                <div className="totals-section">
                  <div className="totals-summary">
                    <div className="total-row">
                      <span>Total HT:</span>
                      <span>{calculateTTC(selectedDevis).toFixed(2)} €</span>
                    </div>
                    <div className="total-row">
                      <span>Total TVA:</span>
                      <span>{(calculateTTC(selectedDevis) * 0.2).toFixed(2)} €</span>
                    </div>
                    <div className="total-row final">
                      <span>Total TTC:</span>
                      <span>{(calculateTTC(selectedDevis) * 1.2).toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div className="conditions-section">
                  <div className="section-title">CONDITIONS</div>
                  <p>• Devis valable jusqu'au {formatDate(selectedDevis.dateValidite)}</p>
                  <p>• Règlement à 30 jours fin de mois</p>
                  <p>• TVA non applicable, art. 293 B du CGI (si applicable)</p>
                </div>

                {/* Actions */}
                <div className="preview-actions">
                  <button 
                    onClick={() => handleDownloadPDF(selectedDevis)}
                    className="action-btn pdf-btn"
                  >
                    📄 Télécharger PDF
                  </button>
                  <button 
                    onClick={() => handleSendEmail(selectedDevis._id)}
                    className="action-btn pdf-btn"
                    style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                  >
                    📧 Envoyer par email
                  </button>
                  <button 
                    onClick={() => setSelectedDevis(null)}
                    className="action-btn close-btn"
                  >
                    ✕ Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DevisListPage;