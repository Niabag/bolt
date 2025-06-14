import React from 'react';
import '../Devis/devis.scss';

const InvoiceCard = ({
  invoice,
  onView,
  onPdf,
  onDelete,
  onStatusChange,
  loading = false,
  clients = []
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'overdue':
        return '#ef4444';
      case 'canceled':
        return '#9ca3af';
      case 'draft':
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'pending':
        return 'En attente';
      case 'overdue':
        return 'En retard';
      case 'canceled':
        return 'Annulée';
      case 'draft':
      default:
        return 'Brouillon';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return '✅';
      case 'pending':
        return '⏳';
      case 'overdue':
        return '⚠️';
      case 'canceled':
        return '❌';
      case 'draft':
      default:
        return '📝';
    }
  };

  const getNextStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Passer en Attente';
      case 'pending':
        return 'Marquer Payée';
      case 'paid':
        return 'Marquer En retard';
      case 'overdue':
        return 'Annuler la facture';
      case 'canceled':
        return 'Repasser en Brouillon';
      default:
        return 'Changer le statut';
    }
  };

  const clientName = (() => {
    const client = clients.find(
      (c) => c._id === (typeof invoice.clientId === 'object' ? invoice.clientId._id : invoice.clientId)
    );
    return client ? client.name : invoice.clientName || 'Client inconnu';
  })();

  return (
    <div className="devis-card" onClick={() => onView && onView(invoice)}>
      <div className="devis-card-top">
        <div className="devis-avatar">
          {invoice.invoiceNumber ? invoice.invoiceNumber.charAt(0).toUpperCase() : 'F'}
        </div>
        {onStatusChange && (
          <div
            className="status-indicator clickable"
            style={{
              backgroundColor: getStatusColor(invoice.status),
              position: 'absolute',
              top: '1rem',
              right: '1rem'
            }}
            title={getNextStatusLabel(invoice.status)}
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(invoice._id || invoice.id, invoice.status);
            }}
          >
            {getStatusIcon(invoice.status)}
          </div>
        )}
      </div>

      <div className="devis-card-content">
        <div className="devis-card-header">
          <h3 className="devis-card-title">Facture {invoice.invoiceNumber}</h3>
          <div className="devis-card-meta">
            <div className="devis-card-date">
              <span>📅</span>
              <span>{formatDate(invoice.createdAt)}</span>
            </div>
            <div className="devis-card-amount">
              <span>💰</span>
              <span>{invoice.amount?.toFixed(2)} € TTC</span>
            </div>
          </div>
        </div>

        <div className="devis-client-info">
          <span className="devis-client-icon">👤</span>
          <span className="devis-client-name">{clientName}</span>
        </div>

        <div
          className="devis-status-badge"
          style={{ backgroundColor: getStatusColor(invoice.status), color: 'white' }}
        >
          {getStatusIcon(invoice.status)} {getStatusLabel(invoice.status)}
        </div>

        <div className="devis-card-actions">
          {onPdf && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPdf(invoice);
              }}
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded px-3 py-1 text-sm"
              disabled={loading}
              title="Télécharger PDF"
            >
              {loading ? '⏳' : '📄'} PDF
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(invoice._id || invoice.id);
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

export default InvoiceCard;
