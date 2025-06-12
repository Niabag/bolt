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
        <h3 className="devis-card-title">Devis {formatDate(devis.dateDevis)}</h3>
        <div className="devis-card-meta">
          <span>📅 {formatDate(devis.dateDevis)}</span>
          <span className="devis-card-amount">💰 {ttc.toFixed(2)} € TTC</span>
        </div>
      </div>
      <div className="devis-card-actions flex gap-2">
        <button
          className="bg-green-50 text-green-600 hover:bg-green-100 rounded px-3 py-1 text-sm"
          onClick={() => onEdit && onEdit(devis)}
        >
          ✏️ Éditer
        </button>
        <button
          className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded px-3 py-1 text-sm"
          onClick={() => onPdf && onPdf(devis)}
          disabled={loading}
        >
          {loading ? '⏳' : '📄'} PDF
        </button>
        <button
          className="bg-red-50 text-red-600 hover:bg-red-100 rounded px-3 py-1 text-sm"
          onClick={() => onDelete && onDelete(devis._id)}
          title="Supprimer"
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
};

export default DevisCard;