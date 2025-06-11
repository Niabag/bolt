import React from 'react';
import './prospectDetails.scss';

const ProspectDetailsPage = ({ prospect, onBack, onEdit }) => {
  if (!prospect) {
    return (
      <div className="prospect-detail-page">
        <div className="detail-card">
          <p>Prospect introuvable.</p>
          <div className="detail-actions">
            <button onClick={onBack} className="card-btn card-btn-invoice">Retour</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="prospect-detail-page">
      <div className="detail-card">
        <div className="detail-header">
          <button onClick={onBack} className="card-btn card-btn-pdf">← Retour</button>
          <div className="detail-title">
            <div className="avatar">
              {prospect.name ? prospect.name.charAt(0).toUpperCase() : '?'}
            </div>
            <h2>{prospect.name}</h2>
          </div>
        </div>

        <div className="detail-info">
          <div className="info-item">📞 {prospect.phone || 'N/A'}</div>
          <div className="info-item">🏢 {prospect.company || 'N/A'}</div>
          {prospect.email && <div className="info-item">📧 {prospect.email}</div>}
        </div>

        <div className="detail-actions">
          <button onClick={onEdit} className="card-btn card-btn-edit">✏️ Éditer</button>
          <button onClick={onBack} className="card-btn card-btn-invoice">Retour</button>
        </div>
      </div>
    </div>
  );
};

export default ProspectDetailsPage;
