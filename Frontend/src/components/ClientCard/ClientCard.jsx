import React from 'react';
import './ClientCard.scss';

const ClientCard = ({
  name,
  email,
  phone,
  company,
  level,
  note,
  isActive,
  onView,
  onEdit,
  onDelete,
  onHistory,
  onCardClick,
  status,
  onStatusClick
}) => {
  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'ACTIF';
      case 'inactive':
        return 'INACTIF';
      case 'nouveau':
        return 'NOUVEAU';
      case 'en_attente':
        return 'EN ATTENTE';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#48bb78';
      case 'inactive':
        return '#f56565';
      case 'nouveau':
        return '#4299e1';
      case 'en_attente':
        return '#9f7aea';
      default:
        return '#4299e1';
    }
  };

  const badgeColor = status ? getStatusColor(status) : isActive ? '#48bb78' : '#f56565';
  const badgeText = status ? getStatusLabel(status) : isActive ? 'ACTIF' : 'INACTIF';

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'inactive':
        return '🔴';
      case 'nouveau':
        return '🔵';
      case 'en_attente':
        return '🟣';
      default:
        return '🔵';
    }
  };

  const getNextStatusLabel = (status) => {
    switch (status) {
      case 'nouveau':
        return 'Cliquer pour passer en Attente';
      case 'en_attente':
        return 'Cliquer pour passer en Actif';
      case 'active':
        return 'Cliquer pour passer en Inactif';
      case 'inactive':
        return 'Cliquer pour remettre en Nouveau';
      default:
        return 'Cliquer pour changer le statut';
    }
  };

  return (
    <div
      className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-md p-6 flex flex-col items-center space-y-4 cursor-pointer relative"
      onClick={onCardClick}
    >
      {status && onStatusClick && (
        <div
          className="status-indicator clickable"
          style={{
            backgroundColor: getStatusColor(status),
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            border: '2px solid white',
            cursor: 'pointer',
            zIndex: 2
          }}
          onClick={(e) => {
            e.stopPropagation();
            onStatusClick(status);
          }}
          title={getNextStatusLabel(status)}
        >
          {getStatusIcon(status)}
        </div>
      )}

      <div className="text-center">
        <h2 className="text-xl font-semibold capitalize">{name}</h2>
        <p className="flex items-center justify-center text-gray-500">
          <span className="mr-1">📧</span>{email}
        </p>
        {phone && (
          <p className="flex items-center justify-center text-gray-500">
            <span className="mr-1">📞</span>{phone}
          </p>
        )}
        {company && (
          <p className="flex items-center justify-center text-gray-500">
            <span className="mr-1">🏢</span>{company}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {level && (
          <span className="text-sm font-medium bg-blue-100 text-blue-600 px-2 py-0.5 rounded">{level}</span>
        )}
        <span
          className="text-xs font-bold px-2 py-0.5 rounded text-white"
          style={{ backgroundColor: badgeColor }}
        >
          {badgeText}
        </span>
      </div>
      {note && <p className="text-sm text-center text-gray-600 italic">{note}</p>}
      <div className="flex gap-2">
        {onView && (
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded px-3 py-1 text-sm"
            title="Voir les devis"
          >
            📄 Devis
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="bg-green-50 text-green-600 hover:bg-green-100 rounded px-3 py-1 text-sm"
            title="Éditer"
          >
            ✏️ Éditer
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="bg-red-50 text-red-600 hover:bg-red-100 rounded px-3 py-1 text-sm"
            title="Supprimer"
          >
            🗑️ Supprimer
          </button>
        )}
        {onHistory && (
          <button
            onClick={(e) => { e.stopPropagation(); onHistory(); }}
            className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded px-3 py-1 text-sm"
            title="Facture"
          >
            🕑 Facture
          </button>
        )}
      </div>
    </div>
  );
};

export default ClientCard;