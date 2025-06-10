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
              <h1 style="font-size: 3rem; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: 2px;">FACTURE</h1>
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
        <div style="background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; color: #64748b;">Date de la facture :</div>
              <div style="font-weight: 600; color: #0f172a;">${formatDate(formData.createdAt)}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; color: #64748b;">Numéro de facture :</div>
              <div style="font-weight: 600; color: #0f172a;">${formData.invoiceNumber}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; color: #64748b;">Date d'échéance :</div>
              <div style="font-weight: 600; color: #0f172a;">${formatDate(formData.dueDate)}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; color: #64748b;">Client :</div>
              <div style="font-weight: 600; color: #0f172a;">${client?.name || 'Client non défini'}</div>
            </div>
          </div>
        </div>
      `);

      // 4. TABLEAU DES ARTICLES
      await addSectionToPDF(`
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.3rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">DÉTAIL DES PRESTATIONS</h3>
          <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
            <thead>
              <tr style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white;">
                <th style="padding: 1rem; text-align: left; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
                <th style="padding: 1rem; text-align: center; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Quantité</th>
                <th style="padding: 1rem; text-align: center; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Prix unitaire</th>
                <th style="padding: 1rem; text-align: center; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">TVA</th>
                <th style="padding: 1rem; text-align: center; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${devisDetails.flatMap((devis, devisIndex) => 
                devis.articles && Array.isArray(devis.articles) ? 
                  devis.articles.map((article, index) => {
                    const price = parseFloat(article.unitPrice || 0);
                    const qty = parseFloat(article.quantity || 0);
                    const lineTotal = isNaN(price) || isNaN(qty) ? 0 : price * qty;
                    const bgColor = (devisIndex + index) % 2 === 0 ? '#ffffff' : '#f8fafc';
                    
                    return `
                      <tr style="background: ${bgColor};">
                        <td style="padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 0.95rem;">${article.description || "Article sans description"}</td>
                        <td style="padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 0.95rem; text-align: center;">${qty}</td>
                        <td style="padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 0.95rem; text-align: center;">${price.toFixed(2)} €</td>
                        <td style="padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 0.95rem; text-align: center;">${article.tvaRate || 0}%</td>
                        <td style="padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 0.95rem; text-align: center;">${lineTotal.toFixed(2)} €</td>
                      </tr>
                    `;
                  }).join('') : ''
              ).join('')}
            </tbody>
          </table>
        </div>
      `);

      // 5. RÉSUMÉ
      await addSectionToPDF(`
        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
          <div style="width: 300px;">
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-top-left-radius: 12px; border-top-right-radius: 12px; font-size: 0.95rem; color: #475569; border-bottom: 1px solid #e2e8f0;">
              <span>Sous-total:</span>
              <span>${subtotal.toFixed(2)} €</span>
            </div>
            ${formData.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #fff7ed; font-size: 0.95rem; color: #c2410c; border-bottom: 1px solid #e2e8f0;">
                <span>Remise (${formData.discount}%):</span>
                <span>-${discountAmount.toFixed(2)} €</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; font-size: 0.95rem; color: #475569; border-bottom: 1px solid #e2e8f0;">
              <span>TVA:</span>
              <span>${totalTax.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-weight: 700; font-size: 1.1rem; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);">
              <span>Total TTC:</span>
              <span>${total.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      `);

      // 6. NOTES
      await addSectionToPDF(`
        <div style="margin-bottom: 30px;">
          <div style="font-size: 0.9rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">NOTES</div>
          <div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; color: #475569; font-size: 0.95rem; border-left: 4px solid #f59e0b;">
            ${formData.notes || "Merci pour votre confiance. Paiement à réception de facture."}
          </div>
        </div>
      `);

      // 7. CONDITIONS DE PAIEMENT
      await addSectionToPDF(`
        <div style="margin-bottom: 30px;">
          <div style="font-size: 0.9rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">CONDITIONS DE PAIEMENT</div>
          <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; border-left: 4px solid #f59e0b; display: flex; align-items: center; gap: 1rem;">
            <span style="font-weight: 600; color: #475569; min-width: 150px;">Délai de paiement:</span>
            <span style="font-weight: 500; color: #0f172a;">${formData.paymentTerms} jours</span>
          </div>
        </div>
      `);

      // 8. PIED DE PAGE
      await addSectionToPDF(`
        <div style="text-align: center; padding-top: 2rem; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 0.85rem;">
          <p style="margin: 0;">
            ${formData.entrepriseName} - 
            ${formData.entrepriseAddress} - 
            ${formData.entrepriseCity}
          </p>
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