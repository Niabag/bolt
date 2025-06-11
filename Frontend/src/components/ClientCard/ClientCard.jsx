import React from 'react';
import './ClientCard.scss';

const ClientCard = ({
  name,
  email,
  level,
  note,
  isActive,
  onView,
  onEdit,
  onDelete,
  onHistory,
  onCardClick
}) => {
  const badgeClass = isActive ? 'bg-green-500' : 'bg-red-500';
  const badgeText = isActive ? 'ACTIF' : 'INACTIF';

  return (
    <div
      className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-md p-6 flex flex-col items-center space-y-4 cursor-pointer"
      onClick={onCardClick}
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold capitalize">{name}</h2>
        <p className="flex items-center justify-center text-gray-500">
          <span className="mr-1">📧</span>{email}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {level && (
          <span className="text-sm font-medium bg-blue-100 text-blue-600 px-2 py-0.5 rounded">{level}</span>
        )}
        <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${badgeClass}`}>{badgeText}</span>
      </div>
      {note && <p className="text-sm text-center text-gray-600 italic">{note}</p>}
      <div className="flex gap-2">
        {onView && (
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="card-btn card-btn-pdf"
          >
            👁️ Voir
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="card-btn card-btn-edit"
          >
            ✏️ Éditer
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="card-btn card-btn-delete"
          >
            🗑️ Supprimer
          </button>
        )}
        {onHistory && (
          <button
            onClick={(e) => { e.stopPropagation(); onHistory(); }}
            className="card-btn card-btn-invoice"
          >
            🕑 Historique
          </button>
        )}
      </div>
    </div>
  );
};

export default ClientCard;
