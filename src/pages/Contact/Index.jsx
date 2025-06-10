import { useState } from 'react';
import './contact.scss';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Question générale',
    message: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulation d'envoi de formulaire
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        email: '',
        subject: 'Question générale',
        message: ''
      });
    }, 1500);
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Contactez-nous</h1>
        <p>Notre équipe est à votre disposition pour répondre à toutes vos questions</p>
      </div>

      <div className="contact-container">
        <div className="contact-info">
          <div className="info-section">
            <h2>Nous contacter</h2>
            <p>
              Vous avez des questions sur CRM Pro ou besoin d'assistance ? 
              Utilisez l'un des moyens de contact ci-dessous ou remplissez le formulaire.
            </p>
            
            <div className="contact-methods">
              <div className="contact-method">
                <div className="method-icon">✉️</div>
                <div className="method-details">
                  <h3>Email</h3>
                  <p>contact@crmpro.com</p>
                  <span className="response-time">Réponse sous 24h</span>
                </div>
              </div>
              
              <div className="contact-method">
                <div className="method-icon">📞</div>
                <div className="method-details">
                  <h3>Téléphone</h3>
                  <p>+33 1 23 45 67 89</p>
                  <span className="response-time">Lun-Ven, 9h-18h</span>
                </div>
              </div>
              
              <div className="contact-method">
                <div className="method-icon">🏢</div>
                <div className="method-details">
                  <h3>Adresse</h3>
                  <p>123 Rue de l'Innovation</p>
                  <p>75001 Paris, France</p>
                </div>
              </div>
            </div>
            
            <div className="social-links">
              <h3>Suivez-nous</h3>
              <div className="social-icons">
                <a href="#" className="social-icon" title="LinkedIn">
                  <span>💼</span>
                </a>
                <a href="#" className="social-icon" title="Twitter">
                  <span>🐦</span>
                </a>
                <a href="#" className="social-icon" title="Facebook">
                  <span>📘</span>
                </a>
                <a href="#" className="social-icon" title="Instagram">
                  <span>📷</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-container">
          {submitted ? (
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h2>Message envoyé avec succès !</h2>
              <p>
                Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="new-message-btn"
              >
                Envoyer un nouveau message
              </button>
            </div>
          ) : (
            <>
              <h2>Envoyez-nous un message</h2>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Nom complet</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Votre nom et prénom"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="votre@email.com"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Sujet</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="Question générale">Question générale</option>
                    <option value="Support technique">Support technique</option>
                    <option value="Facturation">Facturation</option>
                    <option value="Partenariat">Partenariat</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Comment pouvons-nous vous aider ?"
                    rows={6}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer le message'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="faq-section">
        <div className="faq-container">
          <h2>Questions fréquentes</h2>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Comment fonctionne la période d'essai ?</h3>
              <p>
                Vous bénéficiez de 14 jours d'essai gratuit avec accès à toutes les fonctionnalités. 
                Aucune carte bancaire n'est requise pour commencer.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>Puis-je annuler mon abonnement à tout moment ?</h3>
              <p>
                Oui, vous pouvez annuler votre abonnement à tout moment depuis votre espace client. 
                Il n'y a pas de période d'engagement minimum.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>Comment fonctionne le support client ?</h3>
              <p>
                Notre équipe de support est disponible par email et chat en direct du lundi au vendredi, 
                de 9h à 18h. Le temps de réponse moyen est inférieur à 4 heures.
              </p>
            </div>
            
            <div className="faq-item">
              <h3>Proposez-vous des formations ?</h3>
              <p>
                Oui, nous proposons des webinaires hebdomadaires gratuits ainsi que des tutoriels vidéo 
                pour vous aider à tirer le meilleur parti de CRM Pro.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;