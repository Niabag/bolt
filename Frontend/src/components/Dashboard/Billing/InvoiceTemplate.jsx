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
        <div className="invoice-header">
          <div className="company-info">
            <h1>FACTURE</h1>
            <p className="company-name">{devisDetails[0]?.entrepriseName || "Votre Entreprise"}</p>
            <p>{devisDetails[0]?.entrepriseAddress || "123 Rue Exemple"}</p>
            <p>{devisDetails[0]?.entrepriseCity || "75000 Paris"}</p>
            <p>Email: {devisDetails[0]?.entrepriseEmail || "contact@entreprise.com"}</p>
            <p>Tél: {devisDetails[0]?.entreprisePhone || "01 23 45 67 89"}</p>
          </div>
          <div className="invoice-info">
            <div className="invoice-number">N° {invoice.invoiceNumber}</div>
            <div className="invoice-date">Date: {formatDate(invoice.createdAt)}</div>
            <div className="invoice-due">Échéance: {formatDate(invoice.dueDate)}</div>
          </div>
        </div>

        <div className="client-section">
          <div className="section-title">FACTURER À</div>
          <div className="client-details">
            <p className="client-name">{client?.name || invoice.clientName}</p>
            <p>{client?.email}</p>
            <p>{client?.phone}</p>
            <p>{client?.address}</p>
            <p>{client?.postalCode} {client?.city}</p>
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
          <p>{invoice.notes || "Merci pour votre confiance. Paiement à réception de facture."}</p>
        </div>

        <div className="invoice-footer">
          <p>
            {devisDetails[0]?.entrepriseName || "Votre Entreprise"} - 
            {devisDetails[0]?.entrepriseAddress || "123 Rue Exemple"} - 
            {devisDetails[0]?.entrepriseCity || "75000 Paris"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;