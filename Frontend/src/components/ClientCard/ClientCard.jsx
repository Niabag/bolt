import React from 'react';
import './ClientCard.scss';

const ClientCard = ({
  name,
  email,
  phone, // Ajout du téléphone
  company, // Ajout de l'entreprise
  level,
  note,
  isActive,
  status, // Ajout du statut
  onView,
  onEdit,
  onDelete,
  onHistory,
  onCardClick,
  onStatusClick, // Ajout du gestionnaire de clic sur le statut
  onSelect, // Ajout du gestionnaire de sélection
  isSelected, // Ajout de l'état de sélection
  getStatusColor, // Fonction pour obtenir la couleur du statut
  getStatusIcon, // Fonction pour obtenir l'icône du statut
  getStatusLabel, // Fonction pour obtenir le libellé du statut
  getNextStatusLabel, // Fonction pour obtenir le libellé du prochain statut
  createdAt, // Date de création
  address // Adresse formatée
}) => {
  // Utiliser le statut passé en prop ou déterminer actif/inactif
  const currentStatus = status || (isActive ? 'active' : 'inactive');
  
  // Obtenir les propriétés du statut si les fonctions sont fournies
  const statusColor = getStatusColor ? getStatusColor(currentStatus) : (isActive ? '#48bb78' : '#f56565');
  const statusIcon = getStatusIcon ? getStatusIcon(currentStatus) : (isActive ? '🟢' : '🔴');
  const statusLabel = getStatusLabel ? getStatusLabel(currentStatus) : (isActive ? 'ACTIF' : 'INACTIF');
  const nextStatusLabel = getNextStatusLabel ? getNextStatusLabel(currentStatus) : 'Changer le statut';

  return (
    <div
      className={`prospect-card ${isSelected ? 'selected' : ''}`}
      onClick={onCardClick}
    >
      {/* Checkbox de sélection */}
      {onSelect && (
        <div className="card-select">
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Section supérieure */}
      <div className="card-top-section">
        {/* Avatar */}
        <div className="prospect-avatar">
          {name ? name.charAt(0).toUpperCase() : "?"}
        </div>

        {/* Indicateur de statut cliquable */}
        {onStatusClick && (
          <div 
            className="status-indicator clickable"
            style={{ backgroundColor: statusColor }}
            title={nextStatusLabel}
            onClick={onStatusClick}
          >
            {statusIcon}
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="card-content">
        <h3 className="prospect-name">{name}</h3>

        <div className="contact-info">
          <div className="contact-item">
            <span className="contact-icon">📧</span>
            <span className="contact-text">{email}</span>
          </div>
          
          {/* Téléphone */}
          {phone && (
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <span className="contact-text">{phone}</span>
            </div>
          )}
          
          {/* Adresse */}
          {address && (
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <span className="contact-text">{address}</span>
            </div>
          )}
        </div>

        {/* Entreprise */}
        {company && (
          <div className="company-info">
            <span className="company-icon">🏢</span>
            <span className="company-name">{company}</span>
          </div>
        )}

        {note && (
          <div className="notes-preview">
            <span className="notes-icon">📝</span>
            <span className="notes-text">{note}</span>
          </div>
        )}

        {/* Badge de statut */}
        <div className="status-text">
          <span 
            className="status-badge"
            style={{ 
              backgroundColor: statusColor,
              color: 'white'
            }}
          >
            {statusIcon} {statusLabel}
          </span>
        </div>

        {/* Actions */}
        <div className="card-actions">
          {onView && (
            <button
              onClick={(e) => { e.stopPropagation(); onView(); }}
              className="action-btn primary-action"
              title="Créer un devis"
            >
              📄
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="action-btn edit-action"
              title="Modifier"
            >
              ✏️
            </button>
          )}
          
          {onHistory && (
            <button
              onClick={(e) => { e.stopPropagation(); onHistory(); }}
              className="action-btn billing-action"
              title="Facturation"
            >
              💰
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="action-btn delete-action"
              title="Supprimer"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Pied de carte */}
      {createdAt && (
        <div className="card-footer">
          <span className="join-date">
            Inscrit le {new Date(createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      )}
    </div>
  );
};

export default ClientCard;