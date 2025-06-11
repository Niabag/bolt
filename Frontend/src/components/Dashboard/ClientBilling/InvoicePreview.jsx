import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import './InvoicePreview.scss';

const InvoicePreview = ({ invoice, client, devisDetails = [], onSave, onCancel }) => {
  const invoiceRef = useRef(null);
  
  const [formData, setFormData] = React.useState({
    invoiceNumber: invoice?.invoiceNumber || `FACT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    dueDate: invoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: invoice?.createdAt || new Date().toISOString().split('T')[0],
    notes: invoice?.notes || 'Merci pour votre confiance.',
    paymentTerms: invoice?.paymentTerms || '30',
    discount: invoice?.discount || 0,
    taxRate: invoice?.taxRate || 20,
    status: invoice?.status || 'pending',
    entrepriseName: devisDetails[0]?.entrepriseName || "Votre Entreprise",
    entrepriseAddress: devisDetails[0]?.entrepriseAddress || "123 Rue Exemple",
    entrepriseCity: devisDetails[0]?.entrepriseCity || "75000 Paris",
    entreprisePhone: devisDetails[0]?.entreprisePhone || "01 23 45 67 89",
    entrepriseEmail: devisDetails[0]?.entrepriseEmail || "contact@entreprise.com",
    logoUrl: devisDetails[0]?.logoUrl || ""
  });

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
      return dateStr;
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

  return (
    <div className="invoice-preview-container">
      <div className="preview-toolbar">
        <button onClick={handlePrint} className="toolbar-btn print-btn">
          📄 Imprimer / PDF
        </button>
        <button onClick={handleSave} className="toolbar-btn save-btn">
          💾 Enregistrer
        </button>
        <button onClick={onCancel} className="toolbar-btn cancel-btn" title="Annuler">
          ✕
        </button>
      </div>

      <div className="invoice-document" ref={invoiceRef}>
        <div className="invoice-header">
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
            <div className="invoice-status-selector">
              <span className="label">Statut:</span>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="status-select"
                style={{ backgroundColor: getStatusColor(formData.status), color: 'white' }}
              >
                <option value="draft">Brouillon</option>
                <option value="pending">En attente</option>
                <option value="paid">Payée</option>
                <option value="overdue">En retard</option>
              </select>
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

export default InvoicePreview;