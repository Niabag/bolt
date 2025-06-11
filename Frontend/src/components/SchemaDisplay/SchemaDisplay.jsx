import React from 'react';
import './SchemaDisplay.scss';

const SchemaDisplay = ({ schema, actions }) => {
  if (!schema || !actions || actions.length === 0) return null;
  
  const getSchemaName = () => {
    switch (schema) {
      case 'website-only': return '🌐 Site Web Direct';
      case 'website-form': return '🌐→📝 Site web puis Formulaire';
      case 'form-website': return '📝→🌐 Formulaire puis Site';
      case 'contact-download': return '📝→📥 Contact puis Carte';
      case 'complete-funnel': return '🌐→📝→📥 Tunnel Complet';
      case 'funnel-site-last': return '📝→📥→🌐 Site en Dernier';
      case 'contact-only': return '📝 Contact Uniquement';
      case 'card-download': return '📥 Carte de Visite';
      case 'custom': return '🔧 Stratégie Personnalisée';
      default: return 'Configuration par défaut';
    }
  };

  const getSchemaSequence = () => {
    return actions
      .filter(a => a.active)
      .sort((a, b) => (a.order || 1) - (b.order || 1))
      .map(action => {
        switch (action.type) {
          case 'website': return '🌐 Site web';
          case 'form': return '📝 Formulaire contact';
          case 'download': return '📥 Téléchargement carte';
          default: return '❓ Action inconnue';
        }
      });
  };

  const getWebsiteUrl = () => {
    const websiteAction = actions.find(a => a.type === 'website' && a.active);
    return websiteAction?.url || 'https://www.votre-site.com';
  };

  return (
    <div className="schema-display">
      <h3 className="schema-title">🎯 Stratégie Active : {getSchemaName()}</h3>
      <div className="schema-sequence">
        {getSchemaSequence().map((step, index) => (
          <span key={index} className="schema-step">
            {step}
            {index < getSchemaSequence().length - 1 && ' →'}
          </span>
        ))}
      </div>
      
      {actions.some(a => a.type === 'website' && a.active) && (
        <div className="website-info">
          <div className="website-label">🌐 URL du site web :</div>
          <a 
            href={getWebsiteUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="website-link"
          >
            {getWebsiteUrl()}
          </a>
        </div>
      )}
    </div>
  );
};

export default SchemaDisplay;