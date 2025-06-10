import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../config/api';
import './registerClient.scss';

const RegisterClient = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    postalCode: '',
    city: '',
    subject: 'Demande de contact',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [businessCard, setBusinessCard] = useState(null);
  const [executionStatus, setExecutionStatus] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [pendingActions, setPendingActions] = useState([]);
  const [hasRedirectedFromWebsite, setHasRedirectedFromWebsite] = useState(false);
  const [schemaType, setSchemaType] = useState('');

  const trackCardView = async () => {
    try {
      await apiRequest(
        API_ENDPOINTS.BUSINESS_CARDS.TRACK_VIEW(userId),
        { method: 'POST' }
      );
    } catch (err) {
      console.error('Erreur suivi carte:', err);
    }
  };

  useEffect(() => {
    if (userId) {
      trackCardView();
      fetchBusinessCard();
      checkRedirectionSource();
    } else {
      setError('ID utilisateur manquant');
      setLoading(false);
    }
  }, [userId]);

  const checkRedirectionSource = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromWebsite = urlParams.get('from') === 'website' || 
                       urlParams.get('from') === 'qr' ||
                       document.referrer.includes('votre-site.com') ||
                       sessionStorage.getItem('redirectedFromWebsite') === 'true';
    
    if (fromWebsite) {
      setHasRedirectedFromWebsite(true);
      sessionStorage.setItem('redirectedFromWebsite', 'true');
      console.log('✅ Détection: Retour depuis le site web');
    }
  };

  const fetchBusinessCard = async () => {
    try {
      setLoading(true);
      // ✅ CORRECTION: Utiliser l'userId directement dans l'URL
      const response = await apiRequest(`${API_ENDPOINTS.BUSINESS_CARDS.BASE}?userId=${userId}`);
      setBusinessCard(response);
      
      if (response && response.cardConfig && response.cardConfig.actions) {
        await executeActions(response.cardConfig.actions);
      } else {
        console.log('Aucune action configurée - Affichage du formulaire par défaut');
        setShowForm(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la carte:', error);
      // ✅ En cas d'erreur, afficher le formulaire par défaut
      console.log('Erreur chargement carte - Affichage du formulaire par défaut');
      setShowForm(true);
      setLoading(false);
    }
  };

  const executeActions = async (actions) => {
    if (!actions || actions.length === 0) {
      console.log('Aucune action - Formulaire par défaut');
      setShowForm(true);
      setLoading(false);
      return;
    }

    const activeActions = actions.filter(action => action.active);
    const sortedActions = activeActions.sort((a, b) => (a.order || 1) - (b.order || 1));

    console.log('🎯 Actions actives à exécuter:', sortedActions);

    if (sortedActions.length === 0) {
      console.log('Aucune action active - Formulaire par défaut');
      setShowForm(true);
      setLoading(false);
      return;
    }

    // ✅ DÉTECTION DU TYPE DE SCHÉMA
    const hasWebsite = sortedActions.some(a => a.type === 'website');
    const hasForm = sortedActions.some(a => a.type === 'form');
    const hasDownload = sortedActions.some(a => a.type === 'download');
    const websiteIndex = sortedActions.findIndex(a => a.type === 'website');
    const formIndex = sortedActions.findIndex(a => a.type === 'form');
    const downloadIndex = sortedActions.findIndex(a => a.type === 'download');

    let detectedSchema = '';
    if (hasWebsite && !hasForm && !hasDownload) {
      detectedSchema = 'website-only';
    } else if (hasWebsite && hasForm && !hasDownload) {
      detectedSchema = websiteIndex > formIndex ? 'form-website' : 'lead-generation';
    } else if (!hasWebsite && hasForm && hasDownload) {
      detectedSchema = 'contact-download';
    } else if (hasWebsite && hasForm && hasDownload) {
      detectedSchema = (websiteIndex > formIndex && websiteIndex > downloadIndex) ? 'funnel-site-last' : 'complete-funnel';
    } else if (!hasWebsite && hasForm && !hasDownload) {
      detectedSchema = 'contact-only';
    } else if (!hasWebsite && !hasForm && hasDownload) {
      detectedSchema = 'card-download';
    } else {
      detectedSchema = 'custom';
    }

    setSchemaType(detectedSchema);
    console.log(`📋 Schéma détecté: ${detectedSchema}`);

    // ✅ EXÉCUTION SELON LE SCHÉMA
    switch (detectedSchema) {
      case 'website-only':
        await executeWebsiteOnlySchema(sortedActions);
        break;
      
      case 'lead-generation':
        await executeLeadGenerationSchema(sortedActions);
        break;

      case 'form-website':
        await executeFormWebsiteSchema(sortedActions);
        break;
      

      case 'contact-download':
        await executeContactDownloadSchema(sortedActions);
        break;

      case 'site-last-funnel':
        await executeSiteLastFunnelSchema(sortedActions);
        break;

      case 'complete-funnel':
        await executeCompleteFunnelSchema(sortedActions);
        break;

      case 'funnel-site-last':
        await executeFunnelSiteLastSchema(sortedActions);
        break;
      
      case 'contact-only':
        await executeContactOnlySchema(sortedActions);
        break;
      
      case 'card-download':
        await executeCardDownloadSchema(sortedActions);
        break;
      
      default:
        await executeCustomSchema(sortedActions);
        break;
    }

    setLoading(false);
  };

  // ✅ SCHÉMA 1: Site Web Direct (website uniquement)
  const executeWebsiteOnlySchema = async (actions) => {
    console.log('🌐 Exécution: Site Web Direct');
    const websiteAction = actions.find(a => a.type === 'website');
    
    if (websiteAction && websiteAction.url) {
      setExecutionStatus([{
        action: 'website',
        status: 'executing',
        message: 'Redirection vers le site web en cours...'
      }]);
      
      setTimeout(() => {
        console.log('🌐 Redirection vers:', websiteAction.url);
        window.location.href = websiteAction.url;
      }, 1500);
    } else {
      setError('URL du site web non configurée');
      setShowForm(true);
    }
  };

  // ✅ SCHÉMA 2: Génération de Leads (website → form)
  const executeLeadGenerationSchema = async (actions) => {
    console.log('🚀 Exécution: Génération de Leads');
    
    if (!hasRedirectedFromWebsite) {
      // Première visite: redirection vers le site web
      const websiteAction = actions.find(a => a.type === 'website');
      if (websiteAction && websiteAction.url) {
        setExecutionStatus([{
          action: 'website',
          status: 'executing',
          message: 'Redirection vers le site web...'
        }]);
        
        setTimeout(() => {
          const redirectUrl = new URL(websiteAction.url);
          redirectUrl.searchParams.set('from', 'qr');
          redirectUrl.searchParams.set('return', window.location.href);
          console.log('🌐 Redirection Lead Gen vers:', redirectUrl.toString());
          window.location.href = redirectUrl.toString();
        }, 1500);
        return;
      }
    } else {
      // Retour du site web: afficher le formulaire
      console.log('📝 Retour du site web - Affichage du formulaire');
      setShowForm(true);
      setExecutionStatus([{
        action: 'form',
        status: 'form-shown',
        message: 'Formulaire de contact affiché'
      }]);
    }
  };


  // ✅ SCHÉMA 3: Formulaire puis Site Web (form → website)
  const executeFormWebsiteSchema = async (actions) => {
    console.log('📝🌐 Exécution: Formulaire puis Site Web');
    setShowForm(true);

    const websiteAction = actions.find(a => a.type === 'website');
    if (websiteAction) {
      setPendingActions([websiteAction]);
    }

    setExecutionStatus([{ 
      action: 'form',
      status: 'form-shown',
      message: 'Formulaire affiché - Site web après soumission'
    }]);
  };

  // ✅ SCHÉMA 4: Contact → Carte (form → download)
  const executeContactDownloadSchema = async (actions) => {

    console.log('📝 Exécution: Contact → Carte');
    setShowForm(true);
    
    const downloadAction = actions.find(a => a.type === 'download');
    if (downloadAction) {
      setPendingActions([downloadAction]);
    }
    
    setExecutionStatus([{
      action: 'form',
      status: 'form-shown',
      message: 'Formulaire affiché - Téléchargement après soumission'
    }]);
  };


  // ✅ SCHÉMA 5: Tunnel Complet (website → form → download)
  const executeCompleteFunnelSchema = async (actions) => {
    console.log('🎯 Exécution: Tunnel Complet');
    
    if (!hasRedirectedFromWebsite) {
      // Première visite: redirection vers le site web
      const websiteAction = actions.find(a => a.type === 'website');
      if (websiteAction && websiteAction.url) {
        setExecutionStatus([{
          action: 'website',
          status: 'executing',
          message: 'Redirection vers le site web...'
        }]);
        
        setTimeout(() => {
          const redirectUrl = new URL(websiteAction.url);
          redirectUrl.searchParams.set('from', 'qr');
          redirectUrl.searchParams.set('return', window.location.href);
          console.log('🌐 Redirection Tunnel Complet vers:', redirectUrl.toString());
          window.location.href = redirectUrl.toString();
        }, 1500);
        return;
      }
    } else {
      // Retour du site web: formulaire + téléchargement en attente
      console.log('📝 Retour du site web - Formulaire + téléchargement en attente');
      setShowForm(true);
      
      const downloadAction = actions.find(a => a.type === 'download');
      if (downloadAction) {
        setPendingActions([downloadAction]);
      }
      
      setExecutionStatus([{
        action: 'form',
        status: 'form-shown',
        message: 'Formulaire affiché - Téléchargement après soumission'
      }]);
    }
  };

  // ✅ SCHÉMA 5bis: Tunnel Complet, site en dernier (form → download → website)
  const executeFunnelSiteLastSchema = async (actions) => {
    console.log('🎯🌐 Exécution: Tunnel Complet - Site en dernier');
    setShowForm(true);

    const downloadAction = actions.find(a => a.type === 'download');
    const websiteAction = actions.find(a => a.type === 'website');
    const pending = [];
    if (downloadAction) pending.push(downloadAction);
    if (websiteAction) pending.push(websiteAction);

    if (pending.length > 0) {
      setPendingActions(pending);
    }

    setExecutionStatus([{
      action: 'form',
      status: 'form-shown',
      message: 'Formulaire affiché - Actions après soumission'
    }]);
  };

  // ✅ SCHÉMA 6: Contact Uniquement (form seulement)
  const executeContactOnlySchema = async (actions) => {
    console.log('📝 Exécution: Contact Uniquement');
    setShowForm(true);
    setExecutionStatus([{
      action: 'form',
      status: 'form-shown',
      message: 'Formulaire de contact affiché'
    }]);
  };

  // ✅ SCHÉMA 7: Carte de Visite (download seulement)
  const executeCardDownloadSchema = async (actions) => {
    console.log('📥 Exécution: Carte de Visite');
    const downloadAction = actions.find(a => a.type === 'download');
    
    if (downloadAction) {
      setExecutionStatus([{
        action: 'download',
        status: 'executing',
        message: 'Téléchargement de votre carte de visite...'
      }]);
      
      setTimeout(async () => {
        await handleDownloadAction(downloadAction);
      }, 1000);
    }
  };

  // ✅ SCHÉMA PERSONNALISÉ
  const executeCustomSchema = async (actions) => {
    console.log('🔧 Exécution: Schéma Personnalisé');
    // Pour les schémas personnalisés, on affiche le formulaire par défaut
    setShowForm(true);
    
    // Préparer toutes les actions non-form en attente
    const nonFormActions = actions.filter(a => a.type !== 'form');
    if (nonFormActions.length > 0) {
      setPendingActions(nonFormActions);
    }
    
    setExecutionStatus([{
      action: 'custom',
      status: 'form-shown',
      message: 'Schéma personnalisé - Formulaire affiché'
    }]);
  };

  const executeRemainingActions = async () => {
    if (pendingActions.length === 0) return;

    console.log('🔄 Exécution des actions restantes:', pendingActions);

    for (const action of pendingActions) {
      await new Promise(resolve => setTimeout(resolve, action.delay || 1000));

      if (action.type === 'download') {
        await handleDownloadAction(action);
      } else if (action.type === 'website') {
        window.open(action.url, '_blank');
        setExecutionStatus(prev => [...prev, {
          action: 'website',
          status: 'completed',
          message: 'Site web ouvert dans un nouvel onglet'
        }]);
      }
    }

    setPendingActions([]);
  };

  const handleDownloadAction = async (action) => {
    try {
      setExecutionStatus(prev => [...prev, {
        action: 'download',
        status: 'executing',
        message: 'Génération de votre carte de visite...'
      }]);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const link = document.createElement('a');
      link.download = 'carte-visite-numerique.png';
      link.href = '/images/modern-business-card-design-template-42551612346d5b08984f0b61a8044609_screen.jpg';
      link.click();

      setExecutionStatus(prev => [...prev, {
        action: 'download',
        status: 'completed',
        message: 'Carte de visite téléchargée avec succès !'
      }]);

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setExecutionStatus(prev => [...prev, {
        action: 'download',
        status: 'error',
        message: 'Erreur lors du téléchargement'
      }]);
    }
  };

  const handleManualWebsiteVisit = () => {
    const websiteAction = businessCard?.cardConfig?.actions?.find(action => action.type === 'website');
    if (websiteAction && websiteAction.url) {
      window.open(websiteAction.url, '_blank');
    }
  };

  const handleManualDownload = async () => {
    const downloadAction = businessCard?.cardConfig?.actions?.find(action => action.type === 'download');
    if (downloadAction) {
      await handleDownloadAction(downloadAction);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.REGISTER(userId), {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setSubmitted(true);
      setExecutionStatus(prev => [...prev, {
        action: 'form',
        status: 'completed',
        message: 'Formulaire soumis avec succès !'
      }]);

      // Exécuter les actions restantes après soumission
      await executeRemainingActions();

    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getSchemaName = () => {
    switch (schemaType) {
      case 'website-only': return '🌐 Site Web Direct';

      case 'lead-generation': return 'Génération de Leads';
      case 'form-website': return '📝→🌐 Formulaire puis Site';

      case 'contact-download': return '📝 Contact → Carte';
      case 'site-last-funnel': return '🎯 Site en Dernier';

      case 'complete-funnel': return '🎯 Tunnel Complet';
      case 'funnel-site-last': return '🎯 Site en Dernier';
      case 'contact-only': return '📝 Contact Uniquement';
      case 'card-download': return '📥 Carte de Visite';
      case 'custom': return '🔧 Stratégie Personnalisée';
      default: return 'Configuration par défaut';
    }
  };

  const getSchemaSequence = () => {
    if (!businessCard?.cardConfig?.actions) return [];
    
    return businessCard.cardConfig.actions
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

  if (loading && !showForm) {
    return (
      <div className="professional-contact-page">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2>Chargement...</h2>
            <p>Préparation de votre expérience personnalisée</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !showForm) {
    return (
      <div className="professional-contact-page">
        <div className="contact-container">
          <div className="contact-header">
            <h1 className="contact-title">❌ Erreur</h1>
            <p className="contact-subtitle">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="professional-contact-page">
      <div className="contact-container">
        {/* En-tête professionnel */}
        <div className="contact-header">
          <h1 className="contact-title">💼 CRM Pro</h1>
          <p className="contact-subtitle">Découvrez nos services et entrons en contact</p>
        </div>

        {/* Affichage du schéma actif */}
        {businessCard?.cardConfig?.actions && (
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
            
            {/* Affichage de l'URL du site web si configurée */}
            {businessCard.cardConfig.actions.some(a => a.type === 'website' && a.active) && (
              <div className="website-info">
                <div className="website-label">🌐 URL du site web :</div>
                <a 
                  href={businessCard.cardConfig.actions.find(a => a.type === 'website')?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="website-link"
                >
                  {businessCard.cardConfig.actions.find(a => a.type === 'website')?.url || 'https://www.votre-site.com'}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Message de redirection depuis le site web */}
        {hasRedirectedFromWebsite && showForm && (
          <div className="redirection-info">
            <div className="redirection-icon">✅</div>
            <div className="redirection-content">
              <h4>Vous avez été redirigé depuis notre site web</h4>
              <p>Merci de votre intérêt ! Veuillez remplir le formulaire ci-dessous pour nous contacter.</p>
              <div className="website-badge">
                <span className="website-icon">🌐</span>
                <a 
                  href={businessCard?.cardConfig?.actions?.find(a => a.type === 'website')?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {businessCard?.cardConfig?.actions?.find(a => a.type === 'website')?.url || 'https://www.votre-site.com'}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Actions manuelles disponibles (uniquement si pas de formulaire automatique) */}
        {businessCard?.cardConfig?.actions && !showForm && !submitted && schemaType !== 'website-only' && schemaType !== 'card-download' && (
          <div className="actions-manual">
            {businessCard.cardConfig.actions
              .filter(action => action.active)
              .sort((a, b) => (a.order || 1) - (b.order || 1))
              .map((action, index) => (
                <div key={action.id || index} className="action-manual-item">
                  {action.type === 'website' && (
                    <button 
                      onClick={handleManualWebsiteVisit}
                      className="action-btn website-btn"
                    >
                      <span className="btn-icon">🌐</span>
                      <span className="btn-text">Visiter notre site web</span>
                      <span className="btn-order">Action {action.order || index + 1}</span>
                    </button>
                  )}
                  
                  {action.type === 'download' && (
                    <button 
                      onClick={handleManualDownload}
                      className="action-btn download-btn"
                    >
                      <span className="btn-icon">📥</span>
                      <span className="btn-text">Télécharger notre carte de visite</span>
                      <span className="btn-order">Action {action.order || index + 1}</span>
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Statut d'exécution */}
        {executionStatus.length > 0 && (
          <div className="execution-status">
            {executionStatus.map((status, index) => (
              <div key={index} className={`status-message ${status.status}`}>
                <span className="status-icon">
                  {status.status === 'completed' ? '✅' : 
                   status.status === 'executing' ? '⏳' : 
                   status.status === 'form-shown' ? '📝' : '❓'}
                </span>
                <span>{status.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions en attente */}
        {pendingActions.length > 0 && showForm && !submitted && (
          <div className="pending-actions">
            <h4>🕒 Actions en attente après soumission :</h4>
            <ul>
              {pendingActions.map((action, index) => (
                <li key={index}>
                  {action.type === 'download' && '📥 Téléchargement de votre carte de visite'}
                  {action.type === 'website' && '🌐 Ouverture de notre site web'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Message de succès */}
        {submitted && (
          <div className="success-message">
            <div className="success-icon">🎉</div>
            <div className="success-content">
              <h4>Merci pour votre inscription !</h4>
              <p>Nous avons bien reçu vos informations et vous recontacterons très prochainement.</p>
              {pendingActions.length > 0 && (
                <div className="pending-actions-info">
                  Les actions configurées ont été exécutées automatiquement.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulaire de contact */}
        {showForm && !submitted && (
          <div className="contact-form-section">
            <div className="form-header">
              <h2 className="form-title">📝 Formulaire de Contact</h2>
              <p className="form-description">Laissez-nous vos coordonnées et nous vous recontacterons rapidement</p>
            </div>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">👤</span>
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Votre nom et prénom"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📧</span>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📞</span>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="06 12 34 56 78"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🏢</span>
                    Entreprise
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Nom de votre entreprise"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📋</span>
                  Sujet
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="Demande de contact">Demande de contact</option>
                  <option value="Demande de devis">Demande de devis</option>
                  <option value="Information produit">Information produit</option>
                  <option value="Support technique">Support technique</option>
                  <option value="Partenariat">Partenariat</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">💬</span>
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Décrivez votre demande ou votre projet..."
                  required
                  rows={4}
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                <span className="btn-icon">📤</span>
                <span className="btn-text">
                  {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* Message général si aucune action configurée */}
        {!businessCard?.cardConfig?.actions?.length && !showForm && (
          <div className="general-message">
            <p>Aucune action spécifique configurée. Contactez-nous directement pour plus d'informations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterClient;
