import React from 'react';
import { calculateTTC } from '../../../utils/calculateTTC';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  } catch {
    return '';
  }
};

const DevisCard = ({
  devis,
  onEdit,
  onPdf,
  onDelete,
  onInvoice,
  onSendEmail,
  loading = false,
  onStatusClick
}) => {
  const ttc = calculateTTC(devis);

  return (
    <div className="devis-card">
      <div className="devis-card-header">
        <div className="devis-user-info">
          <span className="devis-user-icon">👤</span>
          <span className="devis-user-name">{devis.title || "Modèle de devis"}</span>
        </div>
        <div className="devis-date">
          <span className="devis-date-icon">📅</span>
          <span className="devis-date-value">{formatDate(devis.dateDevis)}</span>
        </div>
      </div>
      
      <div className="devis-card-content">
        <div className="devis-amount">
          <span className="devis-amount-label">Montant TTC :</span>
          <span className="devis-amount-value">{ttc.toFixed(2)} €</span>
        </div>
      </div>
      
      <div className="devis-card-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPdf && onPdf(devis);
          }}
          className="devis-action-btn pdf-btn"
          disabled={loading}
        >
          {loading ? "⏳" : "📄"} PDF
        </button>
        
        {onSendEmail && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendEmail(devis._id);
            }}
            className="devis-action-btn email-btn"
            disabled={loading}
          >
            {loading ? "⏳" : "📧"} Email
          </button>
        )}
        
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(devis._id);
            }}
            className="devis-action-btn delete-btn"
            title="Supprimer"
          >
            🗑️ Supprimer
          </button>
        )}
      </div>
    </div>
  );
};

export default DevisCard;