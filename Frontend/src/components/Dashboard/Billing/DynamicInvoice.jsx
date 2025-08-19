import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import './DynamicInvoice.scss';

const DynamicInvoice = ({ 
  invoice, 
  client, 
  devisDetails = [], 
  onSave,
  onCancel
}) => {
  const invoiceRef = useRef(null);
  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || `FACT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    dueDate: invoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: invoice?.createdAt || new Date().toISOString().split('T')[0],
    notes: invoice?.notes || 'Merci pour votre confiance.',
    paymentTerms: invoice?.paymentTerms || '30',
    discount: invoice?.discount || 0,
    taxRate: invoice?.taxRate || 20,
    status: invoice?.status || 'draft',
    entrepriseName: devisDetails[0]?.entrepriseName || "Votre Entreprise",
    entrepriseAddress: devisDetails[0]?.entrepriseAddress || "123 Rue Exemple",
    entrepriseCity: devisDetails[0]?.entrepriseCity || "75000 Paris",
    entreprisePhone: devisDetails[0]?.entreprisePhone || "01 23 45 67 89",
    entrepriseEmail: devisDetails[0]?.entrepriseEmail || "contact@entreprise.com",
    entrepriseSiret: devisDetails[0]?.entrepriseSiret || "",
    entrepriseTva: devisDetails[0]?.entrepriseTva || "",
    logoUrl: devisDetails[0]?.logoUrl || ""
  });

  // Mettre à jour le formulaire si les props changent
  useEffect(() => {
    if (invoice || devisDetails.length > 0) {
      setFormData(prev => ({
        ...prev,
        invoiceNumber: invoice?.invoiceNumber || prev.invoiceNumber,
        dueDate: invoice?.dueDate || prev.dueDate,
        createdAt: invoice?.createdAt || prev.createdAt,
        notes: invoice?.notes || prev.notes,
        paymentTerms: invoice?.paymentTerms || prev.paymentTerms,
        discount: invoice?.discount || prev.discount,
        taxRate: invoice?.taxRate || prev.taxRate,
        status: invoice?.status || prev.status,
        entrepriseName: devisDetails[0]?.entrepriseName || prev.entrepriseName,
        entrepriseAddress: devisDetails[0]?.entrepriseAddress || prev.entrepriseAddress,
        entrepriseCity: devisDetails[0]?.entrepriseCity || prev.entrepriseCity,
        entreprisePhone: devisDetails[0]?.entreprisePhone || prev.entreprisePhone,
        entrepriseEmail: devisDetails[0]?.entrepriseEmail || prev.entrepriseEmail,
        entrepriseSiret: devisDetails[0]?.entrepriseSiret || prev.entrepriseSiret,
        entrepriseTva: devisDetails[0]?.entrepriseTva || prev.entrepriseTva,
        logoUrl: devisDetails[0]?.logoUrl || prev.logoUrl
      }));
    }
  }, [invoice, devisDetails]);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `facture-${formData.invoiceNumber}`,
    onAfterPrint: () => console.log('Impression terminée')
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange("logoUrl", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calcul des totaux
  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    devisDetails.forEach(devis => {
      if (devis.articles && Array.isArray(devis.articles)) {
        devis.articles.forEach(article => {
          const price = parseFloat(article.unitPrice || 0);
          const qty = parseFloat(article.quantity || 0);
          const tvaRate = parseFloat(article.tvaRate || 0);
          
          if (!isNaN(price) && !isNaN(qty)) {
            const lineTotal = price * qty;
            subtotal += lineTotal;
            totalTax += lineTotal * (tvaRate / 100);
          }
        });
      }
    });

    // Appliquer la remise
    const discountAmount = subtotal * (formData.discount / 100);
    const discountedSubtotal = subtotal - discountAmount;
    
    // Recalculer la TVA après remise si nécessaire
    const finalTax = totalTax * (1 - formData.discount / 100);
    
    const total = discountedSubtotal + finalTax;
    return { subtotal, discountAmount, discountedSubtotal, totalTax: finalTax, total };
  };

  const { subtotal, discountAmount, discountedSubtotal, totalTax, total } = calculateTotals();

  // Formatage de la date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch (error) {
      return "";
    }
  };

  const handleSave = () => {
    if (onSave) {
      const updatedInvoice = {
        ...invoice,
        ...formData,
        amount: total
      };
      onSave(updatedInvoice);
    }
  };

  // Fonction pour générer un PDF
  const handleDownloadPDF = async () => {
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
              ${formData.logoUrl ? `<img src="${formData.logoUrl}" alt="Logo" style="max-width: 200px; max-height: 100px; object-fit: contain; border-radius: 8px;">` : ''}
            </div>
            <div style="flex: 1; text-align: right;">
              <h1 style="font-size: 3rem; font-weight: 700; margin: 0; color: #2d3748; letter-spacing: 2px;">FACTURE</h1>
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
              <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${formData.entrepriseName}</div>
              <div>${formData.entrepriseAddress}</div>
              <div>${formData.entrepriseCity}</div>
              ${formData.entrepriseSiret ? `<div>SIRET/SIREN: ${formData.entrepriseSiret}</div>` : ''}
              ${formData.entrepriseTva ? `<div>N° TVA: ${formData.entrepriseTva}</div>` : ''}
              <div>${formData.entreprisePhone}</div>
              <div>${formData.entrepriseEmail}</div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea;">
            <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">DESTINATAIRE</h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${client?.name || 'Nom du client'}</div>
              <div>${client?.email || 'Email du client'}</div>
              <div>${client?.phone || 'Téléphone du client'}</div>
              <div>${client?.address || 'Adresse du client'}</div>
              <div>${client?.postalCode || ''} ${client?.city || ''}</div>
            </div>
          </div>
        </div>
      `);

      // 3. MÉTADONNÉES
      await addSectionToPDF(`
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 30px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Date de la facture :</div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${formatDate(formData.createdAt)}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Numéro de facture :</div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${formData.invoiceNumber}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Date d'échéance :</div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${formatDate(formData.dueDate)}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Client :</div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${client?.name || 'Client non défini'}</div>
            </div>
          </div>
        </div>
      `);

      // 4. TABLEAU - EN-TÊTE
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

      // 5. TRAITER CHAQUE LIGNE INDIVIDUELLEMENT (comme dans les devis)
      let rowIndex = 0;
      for (const devis of devisDetails) {
        if (devis.articles && Array.isArray(devis.articles)) {
          for (const article of devis.articles) {
            const price = parseFloat(article.unitPrice || "0");
            const qty = parseFloat(article.quantity || "0");
            const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
            const bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa';

            const rowHTML = `
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  <tr style="background-color: ${bgColor};">
                    <td style="padding: 12px; border: 1px solid #e2e8f0; width: 35%;">${article.description || ''}</td>
                    <td style="padding: 12px; border: 1px solid #e2e8f0; width: 10%; text-align: center;">${article.unit || 'u'}</td>
                    <td style="padding: 12px; border: 1px solid #e2e8f0; width: 10%; text-align: center;">${article.quantity || '1'}</td>
                    <td style="padding: 12px; border: 1px solid #e2e8f0; width: 15%; text-align: right;">${(article.unitPrice || 0)} €</td>
                    <td style="padding: 12px; border: 1px solid #e2e8f0; width: 10%; text-align: center;">${article.tvaRate || '20'}%</td>
                    <td style="padding: 12px; border: 1px solid #e2e8f0; width: 20%; text-align: right; font-weight: 600;">${total.toFixed(2)} €</td>
                  </tr>
                </tbody>
              </table>
            `;
            
            await addSectionToPDF(rowHTML);
            rowIndex++;
          }
        }
      }

      // 6. TOTAUX (style devis)
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
                <tr>
                  <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">${subtotal.toFixed(2)} €</td>
                  <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">20%</td>
                  <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">${totalTax.toFixed(2)} €</td>
                  <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">${total.toFixed(2)} €</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; align-self: end;">
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 6px; font-weight: 500;">
              <span>Total HT :</span>
              <span>${subtotal.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 6px; font-weight: 500;">
              <span>Total TVA :</span>
              <span>${totalTax.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; font-weight: 700; font-size: 1.1rem; border-radius: 6px; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);">
              <span>Total TTC :</span>
              <span>${total.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      `);

      // 7. CONDITIONS (style devis)
      await addSectionToPDF(`
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea; margin-top: 30px;">
          <div style="margin-bottom: 2rem;">
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;"><strong>Conditions :</strong></p>
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• Facture payable sous ${formData.paymentTerms} jours</p>
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• Date d'échéance : ${formatDate(formData.dueDate)}</p>
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• ${formData.notes || "Merci pour votre confiance"}</p>
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
      const fileName = `facture-${formData.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-')}`;
      pdf.save(`${fileName}.pdf`);

      // Nettoyer
      document.body.removeChild(tempDiv);
      
      console.log("✅ PDF généré avec succès");

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF: ' + error.message);
    }
  };

  return (
    <div className="dynamic-invoice">
      <div className="invoice-actions">
        <button onClick={handleDownloadPDF} className="invoice-action-btn print-btn">
          📄 Télécharger PDF
        </button>
        <button onClick={handleSave} className="invoice-action-btn save-btn">
          💾 Enregistrer
        </button>
        {onCancel && (
          <button onClick={onCancel} className="invoice-action-btn cancel-btn" title="Annuler">
            ✕
          </button>
        )}
      </div>
      <div className="invoice-document" ref={invoiceRef}>
        <div className="document-header">
          <div className="company-info">
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo" className="company-logo" />
            ) : (
              <label className="logo-upload-area">
                📷 Cliquez pour ajouter un logo
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleLogoUpload}
                />
              </label>
            )}
            <div className="company-details">
              <input
                type="text"
                className="editable-input company-name"
                value={formData.entrepriseName}
                onChange={(e) => handleInputChange("entrepriseName", e.target.value)}
                placeholder="Nom de l'entreprise"
              />
              <input
                type="text"
                className="editable-input"
                value={formData.entrepriseAddress}
                onChange={(e) => handleInputChange("entrepriseAddress", e.target.value)}
                placeholder="Adresse"
              />
              <input
                type="text"
                className="editable-input"
                value={formData.entrepriseCity}
                onChange={(e) => handleInputChange("entrepriseCity", e.target.value)}
                placeholder="Code postal et ville"
              />
              <input
                type="text"
                className="editable-input"
                value={formData.entrepriseSiret}
                onChange={(e) => handleInputChange("entrepriseSiret", e.target.value)}
                placeholder="SIRET / SIREN"
              />
              <input
                type="text"
                className="editable-input"
                value={formData.entrepriseTva}
                onChange={(e) => handleInputChange("entrepriseTva", e.target.value)}
                placeholder="Numéro de TVA"
              />
              <input
                type="text"
                className="editable-input"
                value={formData.entreprisePhone}
                onChange={(e) => handleInputChange("entreprisePhone", e.target.value)}
                placeholder="Téléphone"
              />
              <input
                type="text"
                className="editable-input"
                value={formData.entrepriseEmail}
                onChange={(e) => handleInputChange("entrepriseEmail", e.target.value)}
                placeholder="Email"
              />
            </div>
          </div>
          <div className="invoice-info">
            <h1>FACTURE</h1>
            <div className="invoice-number-container">
              <span className="label">N°</span>
              <input
                type="text"
                className="editable-input invoice-number-input"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                placeholder="Numéro de facture"
              />
            </div>
            <div className="invoice-date-container">
              <span className="label">Date:</span>
              <input
                type="date"
                className="editable-input date-input"
                value={formData.createdAt}
                onChange={(e) => handleInputChange("createdAt", e.target.value)}
              />
            </div>
            <div className="invoice-due-container">
              <span className="label">Échéance:</span>
              <input
                type="date"
                className="editable-input date-input"
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="client-section">
          <div className="section-title">FACTURER À</div>
          <div className="client-details">
            <p className="client-name">{client?.name}</p>
            <p>{client?.email}</p>
            <p>{client?.phone}</p>
            <p>{client?.address}</p>
            <p>{client?.postalCode} {client?.city}</p>
            {client?.company && <p className="client-company">{client.company}</p>}
          </div>
        </div>

        <div className="invoice-items">
          <table>
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
              {devisDetails.flatMap((devis, devisIndex) => 
                devis.articles && Array.isArray(devis.articles) ? 
                  devis.articles.map((article, index) => {
                    const price = parseFloat(article.unitPrice || 0);
                    const qty = parseFloat(article.quantity || 0);
                    const lineTotal = isNaN(price) || isNaN(qty) ? 0 : price * qty;
                    
                    return (
                      <tr key={`${devisIndex}-${index}`}>
                        <td>{article.description || "Article sans description"}</td>
                        <td>{qty}</td>
                        <td>{price.toFixed(2)} €</td>
                        <td>{article.tvaRate || 0}%</td>
                        <td>{lineTotal.toFixed(2)} €</td>
                      </tr>
                    );
                  }) : []
              )}
            </tbody>
          </table>
        </div>

        <div className="invoice-summary">
          <div className="summary-row">
            <span>Sous-total:</span>
            <span>{subtotal.toFixed(2)} €</span>
          </div>
          {formData.discount > 0 && (
            <div className="summary-row discount">
              <span>Remise ({formData.discount}%):</span>
              <span>-{discountAmount.toFixed(2)} €</span>
            </div>
          )}
          <div className="summary-row">
            <span>TVA:</span>
            <span>{totalTax.toFixed(2)} €</span>
          </div>
          <div className="summary-row total">
            <span>Total TTC:</span>
            <span>{total.toFixed(2)} €</span>
          </div>
        </div>

        <div className="invoice-notes">
          <div className="section-title">NOTES</div>
          <textarea
            className="editable-textarea"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Notes ou conditions particulières..."
            rows={3}
          />
        </div>

        <div className="payment-terms">
          <div className="section-title">CONDITIONS DE PAIEMENT</div>
          <div className="terms-row">
            <span className="terms-label">Délai de paiement:</span>
            <select
              value={formData.paymentTerms}
              onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
              className="terms-select"
            >
              <option value="15">15 jours</option>
              <option value="30">30 jours</option>
              <option value="45">45 jours</option>
              <option value="60">60 jours</option>
            </select>
          </div>
        </div>

        <div className="invoice-footer">
          <p>
            {formData.entrepriseName} - 
            {formData.entrepriseAddress} - 
            {formData.entrepriseCity}
          </p>
        </div>
      </div>

    </div>
  );
};

export default DynamicInvoice;