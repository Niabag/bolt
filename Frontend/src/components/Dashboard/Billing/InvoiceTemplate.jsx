import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import "./invoiceTemplate.scss";

const InvoiceTemplate = ({ invoice, client, devisDetails = [], onClose }) => {
  const invoiceRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `facture-${invoice.invoiceNumber || 'sans-numero'}`,
    onAfterPrint: () => console.log('Impression terminée')
  });

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

    const total = subtotal + totalTax;
    return { subtotal, totalTax, total };
  };

  const { subtotal, totalTax, total } = calculateTotals();

  // Formatage de la date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch (error) {
      return dateStr;
    }
  };

  return (
    <div className="invoice-template-container">
      <div className="invoice-actions">
        <button onClick={handlePrint} className="print-btn">
          📄 Imprimer / PDF
        </button>
        <button onClick={onClose} className="close-btn">
          ✕ Fermer
        </button>
      </div>

      <div className="invoice-document" ref={invoiceRef}>
        {/* EN-TÊTE */}
        <div className="invoice-header">
          <div className="header-content">
            <div className="logo-section">
              {devisDetails[0]?.logoUrl ? (
                <img src={devisDetails[0].logoUrl} alt="Logo" className="company-logo" />
              ) : (
                <div className="logo-placeholder">LOGO</div>
              )}
            </div>
            <div className="title-section">
              <h1 className="invoice-title">FACTURE</h1>
            </div>
          </div>
        </div>

        {/* INFORMATIONS PARTIES */}
        <div className="parties-section">
          <div className="emetteur-section">
            <h3 className="section-title">ÉMETTEUR</h3>
            <div className="company-details">
              <div className="company-name">{devisDetails[0]?.entrepriseName || "Votre Entreprise"}</div>
              <div>{devisDetails[0]?.entrepriseAddress || "123 Rue Exemple"}</div>
              <div>{devisDetails[0]?.entrepriseCity || "75000 Paris"}</div>
              {devisDetails[0]?.entrepriseSiret && <div>SIRET/SIREN: {devisDetails[0].entrepriseSiret}</div>}
              {devisDetails[0]?.entrepriseTva && <div>N° TVA: {devisDetails[0].entrepriseTva}</div>}
              <div>{devisDetails[0]?.entreprisePhone || "01 23 45 67 89"}</div>
              <div>{devisDetails[0]?.entrepriseEmail || "contact@entreprise.com"}</div>
            </div>
          </div>
          
          <div className="destinataire-section">
            <h3 className="section-title">DESTINATAIRE</h3>
            <div className="client-details">
              <div className="client-name">{client?.name || invoice.clientName}</div>
              <div>{client?.email}</div>
              <div>{client?.phone}</div>
              <div>{client?.address}</div>
              <div>{client?.postalCode} {client?.city}</div>
            </div>
          </div>
        </div>

        {/* MÉTADONNÉES */}
        <div className="metadata-section">
          <div className="metadata-grid">
            <div className="metadata-item">
              <div className="metadata-label">Date de la facture :</div>
              <div className="metadata-value">{formatDate(invoice.createdAt)}</div>
            </div>
            <div className="metadata-item">
              <div className="metadata-label">Numéro de facture :</div>
              <div className="metadata-value">{invoice.invoiceNumber}</div>
            </div>
            <div className="metadata-item">
              <div className="metadata-label">Date d'échéance :</div>
              <div className="metadata-value">{formatDate(invoice.dueDate)}</div>
            </div>
            <div className="metadata-item">
              <div className="metadata-label">Client :</div>
              <div className="metadata-value">{client?.name || 'Client non défini'}</div>
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
            <p>• Facture payable sous {invoice.paymentTerms || '30'} jours</p>
            <p>• Date d'échéance : {formatDate(invoice.dueDate)}</p>
            <p>• {invoice.notes || "Merci pour votre confiance"}</p>
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
    </div>
  );
};

export default InvoiceTemplate;