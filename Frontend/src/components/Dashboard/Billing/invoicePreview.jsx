import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import './invoicePreview.scss';

const InvoicePreview = ({ 
  invoice, 
  client, 
  devisDetails = [], 
  onClose, 
  onSave, 
  editable = false 
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
      reader.onload = (event) => {
        handleInputChange('logoUrl', event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculer les totaux
  const articles = devisDetails.flatMap(devis => devis.articles || []);
  
  const totalHT = articles.reduce((sum, article) => {
    const price = parseFloat(article.unitPrice || 0);
    const qty = parseFloat(article.quantity || 0);
    return sum + (price * qty);
  }, 0);

  const totalTVA = articles.reduce((sum, article) => {
    const price = parseFloat(article.unitPrice || 0);
    const qty = parseFloat(article.quantity || 0);
    const tva = parseFloat(article.tvaRate || 0);
    return sum + ((price * qty) * tva / 100);
  }, 0);

  const total = totalHT + totalTVA;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch (error) {
      return dateStr;
    }
  };

  const handleSave = () => {
    if (onSave) {
      const updatedInvoice = {
        ...invoice,
        ...formData,
        clientId: client?._id || invoice?.clientId,
        devisIds: devisDetails.map(d => d._id),
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
      default: return 'Brouillon';
    }
  };

  return (
    <div className="invoice-preview">
      <div className="preview-toolbar">
        <button onClick={handlePrint} className="toolbar-btn pdf-btn">
          📄 Imprimer / PDF
        </button>
        {editable && (
          <button onClick={handleSave} className="toolbar-btn save-btn">
            💾 Enregistrer
          </button>
        )}
        <button onClick={onClose} className="toolbar-btn close-btn">
          ✕ Fermer
        </button>
      </div>

      <div className="preview-content" ref={invoiceRef}>
        {/* EN-TÊTE */}
        <div className="invoice-header">
          <div className="header-content">
            <div className="logo-section">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="company-logo" />
              ) : (
                editable ? (
                  <label className="logo-upload-area">
                    📷 Cliquez pour ajouter un logo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLogoUpload}
                    />
                  </label>
                ) : (
                  <div className="logo-placeholder">LOGO</div>
                )
              )}
            </div>
            <div className="title-section">
              <h1 className="invoice-title">FACTURE</h1>
            </div>
          </div>
        </div>

        {/* INFORMATIONS PARTIES - Design Image 2 */}
        <div className="parties-section-v2">
          <div className="parties-grid">
            <div className="emetteur-card">
              <h3 className="card-title">ÉMETTEUR</h3>
              <div className="card-content">
                {editable ? (
                  <>
                    <input
                      type="text"
                      className="editable-input company-name-input"
                      value={formData.entrepriseName}
                      onChange={(e) => handleInputChange("entrepriseName", e.target.value)}
                      placeholder="Votre Entreprise"
                    />
                    <input
                      type="text"
                      className="editable-input"
                      value={formData.entrepriseAddress}
                      onChange={(e) => handleInputChange("entrepriseAddress", e.target.value)}
                      placeholder="123 Rue Exemple"
                    />
                    <input
                      type="text"
                      className="editable-input"
                      value={formData.entrepriseCity}
                      onChange={(e) => handleInputChange("entrepriseCity", e.target.value)}
                      placeholder="75000 Paris"
                    />
                    <input
                      type="text"
                      className="editable-input"
                      value={formData.entreprisePhone}
                      onChange={(e) => handleInputChange("entreprisePhone", e.target.value)}
                      placeholder="01 23 45 67 89"
                    />
                    <input
                      type="text"
                      className="editable-input"
                      value={formData.entrepriseEmail}
                      onChange={(e) => handleInputChange("entrepriseEmail", e.target.value)}
                      placeholder="contact@entreprise.com"
                    />
                  </>
                ) : (
                  <>
                    <div className="company-name-display">{formData.entrepriseName}</div>
                    <div>{formData.entrepriseAddress}</div>
                    <div>{formData.entrepriseCity}</div>
                    <div>{formData.entreprisePhone}</div>
                    <div>{formData.entrepriseEmail}</div>
                  </>
                )}
              </div>
            </div>
            
            <div className="destinataire-card">
              <h3 className="card-title">DESTINATAIRE</h3>
              <div className="card-content">
                <div className="client-name-display">{client?.name}</div>
                <div>{client?.email}</div>
                <div>{client?.phone}</div>
                <div>{client?.address}</div>
                <div>{client?.postalCode} {client?.city}</div>
              </div>
            </div>
          </div>
        </div>

        {/* MÉTADONNÉES - Design Image 2 */}
        <div className="metadata-section-v2">
          <div className="metadata-card">
            <div className="metadata-row">
              <div className="metadata-col">
                <div className="metadata-label">Date de la facture :</div>
                <div className="metadata-value-display">
                  {editable ? (
                    <input
                      type="date"
                      className="editable-input date-input"
                      value={formData.createdAt}
                      onChange={(e) => handleInputChange("createdAt", e.target.value)}
                    />
                  ) : (
                    formatDate(formData.createdAt)
                  )}
                </div>
              </div>
              <div className="metadata-col">
                <div className="metadata-label">Numéro de facture :</div>
                <div className="metadata-value-display">
                  {editable ? (
                    <input
                      type="text"
                      className="editable-input invoice-number-input"
                      value={formData.invoiceNumber}
                      onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                      placeholder="Numéro de facture"
                    />
                  ) : (
                    formData.invoiceNumber
                  )}
                </div>
              </div>
              <div className="metadata-col">
                <div className="metadata-label">Date d'échéance :</div>
                <div className="metadata-value-display">
                  {editable ? (
                    <input
                      type="date"
                      className="editable-input date-input"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange("dueDate", e.target.value)}
                    />
                  ) : (
                    formatDate(formData.dueDate)
                  )}
                </div>
              </div>
            </div>
            <div className="client-row">
              <div className="metadata-label">Client :</div>
              <div className="client-name-meta">{client?.name}</div>
            </div>
          </div>
        </div>

        {/* DÉTAIL DES PRESTATIONS */}
        <div className="prestations-section">
          <h2 className="section-title">DÉTAIL DES PRESTATIONS</h2>
          <div className="prestations-table">
            <div className="table-header">
              <div className="col-description">Description</div>
              <div className="col-quantity">Qté</div>
              <div className="col-price">Prix unitaire</div>
              <div className="col-tva">TVA</div>
              <div className="col-total">Total HT</div>
            </div>
            {articles.map((article, index) => {
              const price = parseFloat(article.unitPrice || 0);
              const qty = parseFloat(article.quantity || 0);
              const totalHT = price * qty;
              
              return (
                <div key={index} className="table-row">
                  <div className="col-description">{article.description}</div>
                  <div className="col-quantity">{qty}</div>
                  <div className="col-price">{price.toFixed(2)} €</div>
                  <div className="col-tva">{article.tvaRate}%</div>
                  <div className="col-total">{totalHT.toFixed(2)} €</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOTAUX */}
        <div className="totals-section">
          <div className="totals-content">
            <div className="totals-grid">
              <div className="total-row">
                <span className="total-label">Total HT :</span>
                <span className="total-value">{totalHT.toFixed(2)} €</span>
              </div>
              <div className="total-row">
                <span className="total-label">Total TVA :</span>
                <span className="total-value">{totalTVA.toFixed(2)} €</span>
              </div>
              <div className="total-row total-ttc">
                <span className="total-label">Total TTC :</span>
                <span className="total-value">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONDITIONS */}
        <div className="conditions-section">
          <div className="conditions-content">
            <div className="notes-section">
              <h3>Notes :</h3>
              {editable ? (
                <textarea
                  className="editable-textarea"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Notes et conditions..."
                />
              ) : (
                <p>{formData.notes}</p>
              )}
            </div>
            <div className="signature-section">
              <div className="signature-box">
                <div className="signature-label">Signature du client :</div>
                <div className="signature-area"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editable && (
        <div className="preview-actions">
          <button onClick={handleSave} className="save-invoice-btn">
            💾 Enregistrer la facture
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;
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
        clientId: client?._id || invoice?.clientId,
        devisIds: devisDetails.map(d => d._id),
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
    <div className="invoice-preview">
      <div className="preview-toolbar">
        <button onClick={handlePrint} className="toolbar-btn pdf-btn">
          📄 Imprimer / PDF
        </button>
        {editable && (
          <button onClick={handleSave} className="toolbar-btn save-btn">
            💾 Enregistrer
          </button>
        )}
        <button onClick={onClose} className="toolbar-btn close-btn">
          ✕ Fermer
        </button>
      </div>

      <div className="preview-content" ref={invoiceRef}>
        {/* EN-TÊTE */}
        <div className="invoice-header">
          <div className="header-content">
            <div className="logo-section">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="company-logo" />
              ) : (
                editable ? (
                  <label className="logo-upload-area">
                    📷 Cliquez pour ajouter un logo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLogoUpload}
                    />
                  </label>
                ) : (
                  <div className="logo-placeholder">LOGO</div>
                )
              )}
            </div>
            <div className="title-section">
              <h1 className="invoice-title">FACTURE</h1>
            </div>
          </div>
        </div>

        {/* INFORMATIONS PARTIES - Design Image 2 */}
        <div className="parties-section-v2">
          <div className="parties-grid">
            <div className="emetteur-card">
              <h3 className="card-title">ÉMETTEUR</h3>
              <div className="card-content">
                {editable ? (
                  <>
                    <input
                      type="text"
                      className="editable-input company-name-input"
                      value={formData.entrepriseName}
                      onChange={(e) => handleInputChange("entrepriseName", e.target.value)}
                      placeholder="Votre Entreprise"
                    />
                    <input
                      type="text"
                      className="editable-input"
                      value={formData.entrepriseAddress}
                      onChange={(e) => handleInputChange("entrepriseAddress", e.target.value)}
                      placeholder="123 Rue Exemple"
                    />
                    <input
                      type="text"
                      className="editable-input"
                      value={formData.entrepriseCity}
                      onChange={(e) => handleInputChange("entrepriseCity", e.target.value)}
                      placeholder="75000 Paris"
                    />
                    <input
                      type="text"
                      className="editable-input"
                      value={formData.entreprisePhone}
                      onChange={(e) => handleInputChange("entreprisePhone", e.target.value)}
                      placeholder="01 23 45 67 89"
                    />
                    <input
                      type="text"
                      className="editable-input"
                      value={formData.entrepriseEmail}
                      onChange={(e) => handleInputChange("entrepriseEmail", e.target.value)}
                      placeholder="contact@entreprise.com"
                    />
                  </>
                ) : (
                  <>
                    <div className="company-name-display">{formData.entrepriseName}</div>
                    <div>{formData.entrepriseAddress}</div>
                    <div>{formData.entrepriseCity}</div>
                    <div>{formData.entreprisePhone}</div>
                    <div>{formData.entrepriseEmail}</div>
                  </>
                )}
              </div>
            </div>
            
            <div className="destinataire-card">
              <h3 className="card-title">DESTINATAIRE</h3>
              <div className="card-content">
                <div className="client-name-display">{client?.name}</div>
                <div>{client?.email}</div>
                <div>{client?.phone}</div>
                <div>{client?.address}</div>
                <div>{client?.postalCode} {client?.city}</div>

return (
  <div className="invoice-preview">
    <div className="preview-toolbar">
      <button onClick={handlePrint} className="toolbar-btn pdf-btn">
        📄 Imprimer / PDF
      </button>
      {editable && (
        <button onClick={handleSave} className="toolbar-btn save-btn">
          💾 Enregistrer
        </button>
      )}
      <button onClick={onClose} className="toolbar-btn close-btn">
        ✕ Fermer
      </button>
    </div>

    <div className="preview-content" ref={invoiceRef}>
      {/* EN-TÊTE */}
      <div className="invoice-header">
        <div className="header-content">
          <div className="logo-section">
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo" className="company-logo" />
            ) : (
              editable ? (
                <label className="logo-upload-area">
                  📷 Cliquez pour ajouter un logo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleLogoUpload}
                  />
                </label>
              ) : (
                <div className="logo-placeholder">LOGO</div>
              )
            )}
          </div>
          <div className="title-section">
            <h1 className="invoice-title">FACTURE</h1>
          </div>
        </div>
      </div>

      {/* INFORMATIONS PARTIES - Design Image 2 */}
      <div className="parties-section-v2">
        <div className="parties-grid">
          <div className="emetteur-card">
            <h3 className="card-title">ÉMETTEUR</h3>
            <div className="card-content">
              {editable ? (
                <>
                  <input
                    type="text"
                    className="editable-input company-name-input"
                    value={formData.entrepriseName}
                    onChange={(e) => handleInputChange("entrepriseName", e.target.value)}
                    placeholder="Votre Entreprise"
                  />
                  <input
                    type="text"
                    className="editable-input"
                    value={formData.entrepriseAddress}
                    onChange={(e) => handleInputChange("entrepriseAddress", e.target.value)}
                    placeholder="123 Rue Exemple"
                  />
                  <input
                    type="text"
                    className="editable-input"
                    value={formData.entrepriseCity}
                    onChange={(e) => handleInputChange("entrepriseCity", e.target.value)}
                    placeholder="75000 Paris"
                  />
                  <input
                    type="text"
                    className="editable-input"
                    value={formData.entreprisePhone}
                    onChange={(e) => handleInputChange("entreprisePhone", e.target.value)}
                    placeholder="01 23 45 67 89"
                  />
                  <input
                    type="text"
                    className="editable-input"
                    value={formData.entrepriseEmail}
                    onChange={(e) => handleInputChange("entrepriseEmail", e.target.value)}
                    placeholder="contact@entreprise.com"
                  />
                </>
              ) : (
                <>
                  <div className="company-name-display">{formData.entrepriseName}</div>
                  <div>{formData.entrepriseAddress}</div>
                  <div>{formData.entrepriseCity}</div>
                  <div>{formData.entreprisePhone}</div>
                  <div>{formData.entrepriseEmail}</div>
                </>
              )}
            </div>
          </div>
          
          <div className="destinataire-card">
            <h3 className="card-title">DESTINATAIRE</h3>
            <div className="card-content">
              <div className="client-name-display">{client?.name}</div>
              <div>{client?.email}</div>
              <div>{client?.phone}</div>
              <div>{client?.address}</div>
              <div>{client?.postalCode} {client?.city}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MÉTADONNÉES - Design Image 2 */}
      <div className="metadata-section-v2">
        <div className="metadata-card">
          <div className="metadata-row">
            <div className="metadata-col">
              <div className="metadata-label">Date de la facture :</div>
              <div className="metadata-value-display">
                {editable ? (
                  <input
                    type="date"
                    className="editable-input date-input"
                    value={formData.createdAt}
                    onChange={(e) => handleInputChange("createdAt", e.target.value)}
                  />
                ) : (
                  formatDate(formData.createdAt)
                )}
              </div>
            </div>
            <div className="metadata-col">
              <div className="metadata-label">Numéro de facture :</div>
              <div className="metadata-value-display">
                {editable ? (
                  <input
                    type="text"
                    className="editable-input invoice-number-input"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
                    placeholder="Numéro de facture"
                  />
                ) : (
                  formData.invoiceNumber
                )}
              </div>
            </div>
            <div className="metadata-col">
              <div className="metadata-label">Date d'échéance :</div>
              <div className="metadata-value-display">
                {editable ? (
                  <input
                    type="date"
                    className="editable-input date-input"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange("dueDate", e.target.value)}
                  />
                ) : (
                  formatDate(formData.dueDate)
                )}
              </div>
            </div>
                    <option value="pending">En attente</option>
                    <option value="paid">Payée</option>
                    <option value="overdue">En retard</option>
                  </select>
                ) : (
                  <span className="invoice-status" style={{ backgroundColor: getStatusColor(formData.status), color: 'white' }}>
                    {getStatusLabel(formData.status)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TABLEAU DES PRESTATIONS */}
        <div className="prestations-section">
          <h3 className="prestations-title">DÉTAIL DES PRESTATIONS</h3>
          <div className="prestations-table">
            <div className="table-header">
              <div className="header-cell description">Description</div>
              <div className="header-cell unite">Unité</div>
              <div className="header-cell qte">Qté</div>
              <div className="header-cell prix">Prix unitaire HT</div>
              <div className="header-cell tva">TVA</div>
              <div className="header-cell total">Total HT</div>
            </div>
            <div className="table-body">
              {devisDetails.flatMap((devis, devisIndex) => 
                devis.articles && Array.isArray(devis.articles) ? 
                  devis.articles.map((article, index) => {
                    const price = parseFloat(article.unitPrice || 0);
                    const qty = parseFloat(article.quantity || 0);
                    const lineTotal = isNaN(price) || isNaN(qty) ? 0 : price * qty;
                    const isEven = (devisIndex + index) % 2 === 0;
                    
                    return (
                      <div key={`${devisIndex}-${index}`} className={`table-row ${isEven ? 'even' : 'odd'}`}>
                        <div className="cell description">{article.description || "Article sans description"}</div>
                        <div className="cell unite">{article.unit || 'u'}</div>
                        <div className="cell qte">{qty}</div>
                        <div className="cell prix">{price.toFixed(2)} €</div>
                        <div className="cell tva">{article.tvaRate || 0}%</div>
                        <div className="cell total">{lineTotal.toFixed(2)} €</div>
                      </div>
                    );
                  }) : []
              )}
            </div>
          </div>
        </div>

        {/* TOTAUX */}
        <div className="totaux-section">
          <div className="recap-tva">
            <h4 className="recap-title">Récapitulatif TVA</h4>
            <div className="recap-table">
              <div className="recap-header">
                <div className="recap-cell">Base HT</div>
                <div className="recap-cell">Taux TVA</div>
                <div className="recap-cell">Montant TVA</div>
                <div className="recap-cell">Total TTC</div>
              </div>
              <div className="recap-row">
                <div className="recap-cell">{subtotal.toFixed(2)} €</div>
                <div className="recap-cell">20%</div>
                <div className="recap-cell">{totalTax.toFixed(2)} €</div>
                <div className="recap-cell">{total.toFixed(2)} €</div>
              </div>
            </div>
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Total HT :</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            {formData.discount > 0 && (
              <div className="summary-row discount">
                <span>Remise ({formData.discount}%) :</span>
                <span>-{discountAmount.toFixed(2)} €</span>
              </div>
            )}
            <div className="summary-row">
              <span>Total TVA :</span>
              <span>{totalTax.toFixed(2)} €</span>
            </div>
            <div className="summary-row total">
              <span>Total TTC :</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* CONDITIONS */}
        <div className="conditions-section">
          <div className="conditions-content">
            <p className="conditions-title"><strong>Conditions :</strong></p>
            <p>• Facture payable sous {editable ? (
              <select
                value={formData.paymentTerms}
                onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                className="terms-select-inline"
              >
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
                <option value="60">60</option>
              </select>
            ) : formData.paymentTerms} jours</p>
            <p>• Date d'échéance : {formatDate(formData.dueDate)}</p>
            <p>• {editable ? (
              <textarea
                className="editable-textarea-inline"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Notes ou conditions particulières..."
                rows={1}
              />
            ) : (formData.notes || "Merci pour votre confiance")}</p>
          </div>
          
          <div className="signature-section">
            <p className="signature-text">
              <em>Bon pour accord - Date et signature du client :</em>
            </p>
            <div className="signature-boxes">
              <div className="signature-box">
                <span>Date : _______________</span>
              </div>
              <div className="signature-box">
                <span>Signature :</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editable && (
        <div className="preview-actions">
          <button onClick={handleSave} className="save-invoice-btn">
            💾 Enregistrer la facture
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;