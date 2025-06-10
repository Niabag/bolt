import React from 'react';
import './ActionButtons.scss';

const ActionButtons = ({ actions, onWebsiteVisit, onDownload }) => {
  if (!actions || actions.length === 0) return null;
  
  // Filtrer les actions actives et les trier par ordre
  const activeActions = actions
    .filter(action => action.active)
    .sort((a, b) => (a.order || 1) - (b.order || 1));
  
  if (activeActions.length === 0) return null;
  
  return (
    <div className="actions-manual">
      {activeActions.map((action, index) => (
        <div key={action.id || index} className="action-manual-item">
          {action.type === 'website' && (
            <button 
              onClick={onWebsiteVisit}
              className="action-btn website-btn"
            >
              <span className="btn-icon">🌐</span>
              <span className="btn-text">Visiter notre site web</span>
              <span className="btn-order">Étape {index + 1}</span>
            </button>
          )}
          
          {action.type === 'download' && (
            <button 
              onClick={onDownload}
              className="action-btn download-btn"
            >
              <span className="btn-icon">📥</span>
              <span className="btn-text">Télécharger notre carte de visite</span>
              <span className="btn-order">Étape {index + 1}</span>
            </button>
          )}
          
          {action.type === 'form' && (
            <div className="form-action-info">
              <span className="form-icon">📝</span>
              <span className="form-text">Formulaire de contact ci-dessous</span>
              <span className="form-order">Étape {index + 1}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ActionButtons;