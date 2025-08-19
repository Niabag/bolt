import React from 'react';
import { calculateTTC } from '../../../utils/calculateTTC';
import './devis.scss';

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

  // Fonctions pour les statuts
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
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return '';
    }
  };

  return (
    <div className="devis-card">
      {/* Section supérieure */}
      <div className="devis-card-top">
        {/* Avatar pour le devis */}
        <div className="devis-avatar">
          {devis.title ? devis.title.charAt(0).toUpperCase() : "D"}
        </div>

        {/* Indicateur de statut */}
        {onStatusClick && (
          <div 
            className="status-indicator clickable"
            style={{ 
              backgroundColor: getStatusColor(devis.status),
              position: 'absolute',
              top: '1rem',
              right: '1rem'
            }}
            title={getNextStatusLabel(devis.status)}
            onClick={(e) => {
              e.stopPropagation();
              onStatusClick(devis._id, devis.status);
            }}
          >
            {getStatusIcon(devis.status)}
          </div>
        )}
      </div>

      {/* Section contenu principal */}
      <div className="devis-card-content">
        <div className="devis-card-header">
          <h3 className="devis-card-title">{devis.title || `Devis du ${formatDate(devis.dateDevis)}`}</h3>
          
          <div className="devis-card-meta">
            <div className="devis-card-date">
              <span>📅</span>
              <span>{formatDate(devis.dateDevis)}</span>
            </div>
            <div className="devis-card-amount">
              <span>💰</span>
              <span>{ttc.toFixed(2)} € TTC</span>
            </div>
          </div>
        </div>

        {/* Informations client */}
        {devis.clientId && (
          <div className="devis-client-info">
            <span className="devis-client-icon">👤</span>
            <span className="devis-client-name">
              {typeof devis.clientId === 'object' && devis.clientId?.name 
                ? devis.clientId.name 
                : "Client"}
            </span>
          </div>
        )}

        {/* Informations entreprise - masquer pour les modèles */}
        {devis.title !== "Modèle de devis" && (
          <div className="devis-entreprise-info">
            {devis.entrepriseSiret && (
              <div className="devis-info-item">
                <span>🏢</span>
                <span>SIRET: {devis.entrepriseSiret}</span>
              </div>
            )}
            {devis.entrepriseTva && (
              <div className="devis-info-item">
                <span>🔢</span>
                <span>N° TVA: {devis.entrepriseTva}</span>
              </div>
            )}
          </div>
        )}

        {/* Badge de statut */}
        <div 
          className="devis-status-badge" 
          style={{ backgroundColor: getStatusColor(devis.status), color: 'white' }}
        >
          {getStatusIcon(devis.status)} {getStatusLabel(devis.status)}
        </div>

        {/* Actions */}
        <div className="devis-card-actions">
          {onPdf && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onPdf(devis);
              }}
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded px-3 py-1 text-sm"
              disabled={loading}
              title="Télécharger PDF"
            >
              {loading ? "⏳" : "📄"} PDF
            </button>
          )}
          
          {onSendEmail && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSendEmail(devis._id);
              }}
              className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded px-3 py-1 text-sm"
              disabled={loading}
              title="Envoyer par email"
            >
              {loading ? "⏳" : "📧"} Email
            </button>
          )}
          
          {onEdit && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(devis);
              }}
              className="bg-green-50 text-green-600 hover:bg-green-100 rounded px-3 py-1 text-sm"
              title="Modifier"
            >
              ✏️ Éditer
            </button>
          )}
          
          {onInvoice && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onInvoice(devis);
              }}
              className="bg-purple-50 text-purple-600 hover:bg-purple-100 rounded px-3 py-1 text-sm"
              title="Créer une facture"
            >
              💶 Facture
            </button>
          )}
          
          {onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(devis._id);
              }}
              className="bg-red-50 text-red-600 hover:bg-red-100 rounded px-3 py-1 text-sm"
              title="Supprimer"
            >
              🗑️ Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevisCard;