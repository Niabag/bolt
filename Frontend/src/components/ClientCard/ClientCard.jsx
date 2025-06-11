import React from 'react';

const ClientCard = ({
  name,
  email,
  level,
  note,
  isActive,
  onView,
  onEdit,
  onDelete,
  onHistory
}) => {
  const badgeClass = isActive ? 'bg-green-500' : 'bg-red-500';
  const badgeText = isActive ? 'ACTIF' : 'INACTIF';

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-md p-6 flex flex-col items-center space-y-4">
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
            onClick={onView}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded px-3 py-1 text-sm"
          >
            👁️ Voir
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded px-3 py-1 text-sm"
          >
            ✏️ Éditer
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="bg-red-50 text-red-600 hover:bg-red-100 rounded px-3 py-1 text-sm"
          >
            🗑️ Supprimer
          </button>
        )}
        {onHistory && (
          <button
            onClick={onHistory}
            className="bg-gray-50 text-gray-600 hover:bg-gray-100 rounded px-3 py-1 text-sm"
          >
            🕑 Historique
          </button>
        )}
      </div>
    </div>
  );
};

export default ClientCard;
