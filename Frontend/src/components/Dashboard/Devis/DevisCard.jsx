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

const DevisCard = ({ devis, onEdit, onPdf, onDelete, loading = false }) => {
  const ttc = calculateTTC(devis);

  return (
    <div className="devis-card">
      <div className="devis-card-header">
        <h3 className="devis-card-title">{devis.title}</h3>
        <div className="devis-card-meta">
          <span>📅 {formatDate(devis.dateDevis)}</span>
          <span className="devis-card-amount">💰 {ttc.toFixed(2)} € TTC</span>
        </div>
      </div>
      <div className="devis-card-actions">
        <button className="card-btn card-btn-edit" onClick={() => onEdit && onEdit(devis)}>
          ✏️ Modifier
        </button>
        <button
          className="card-btn card-btn-pdf"
          onClick={() => onPdf && onPdf(devis)}
          disabled={loading}
        >
          {loading ? '⏳' : '📄'} PDF
        </button>
        <button
          className="card-btn card-btn-delete"
          onClick={() => onDelete && onDelete(devis._id)}
          title="Supprimer"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default DevisCard;
