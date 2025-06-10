import './about.scss';

const About = () => (
  <div className="about-page">
    <div className="about-header">
      <h1>À propos de CRM Pro</h1>
      <p>Une solution complète pour les entrepreneurs et freelances</p>
    </div>

    <div className="about-container">
      <section className="about-section">
        <div className="section-content">
          <h2>Notre Mission</h2>
          <p>
            Chez CRM Pro, notre mission est de simplifier la gestion client pour les entrepreneurs, 
            freelances et petites entreprises. Nous croyons que chaque professionnel mérite d'avoir 
            accès à des outils puissants et intuitifs pour développer son activité, sans complexité 
            ni coûts excessifs.
          </p>
          <p>
            Notre plateforme a été conçue avec un objectif clair : vous aider à capturer, suivre et 
            convertir vos prospects en clients fidèles, tout en vous faisant gagner du temps et en 
            professionnalisant votre image.
          </p>
        </div>
        <div className="section-image mission-image">
          <div className="image-placeholder">🚀</div>
        </div>
      </section>

      <section className="about-section reverse">
        <div className="section-content">
          <h2>Notre Histoire</h2>
          <p>
            CRM Pro est né en 2023 d'une frustration commune : les solutions CRM existantes étaient 
            soit trop complexes, soit trop coûteuses pour les indépendants et petites structures.
          </p>
          <p>
            Notre équipe de développeurs et entrepreneurs a décidé de créer une alternative accessible, 
            combinant puissance et simplicité. Après des mois de développement et de tests avec des 
            utilisateurs réels, CRM Pro a vu le jour avec une promesse : rendre la gestion client 
            accessible à tous.
          </p>
          <p>
            Aujourd'hui, nous sommes fiers de servir des milliers d'entrepreneurs à travers le monde, 
            les aidant à structurer leur prospection et à développer leur activité.
          </p>
        </div>
        <div className="section-image history-image">
          <div className="image-placeholder">📈</div>
        </div>
      </section>

      <section className="about-section">
        <div className="section-content">
          <h2>Nos Valeurs</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🎯</div>
              <h3>Simplicité</h3>
              <p>Nous créons des outils puissants mais intuitifs, qui ne nécessitent pas de formation complexe.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">💪</div>
              <h3>Accessibilité</h3>
              <p>Nous rendons les outils professionnels accessibles à tous, quelle que soit la taille de l'entreprise.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🔒</div>
              <h3>Confidentialité</h3>
              <p>Nous respectons scrupuleusement vos données et votre vie privée, sans compromis.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌱</div>
              <h3>Évolution</h3>
              <p>Nous améliorons constamment notre plateforme en fonction des retours utilisateurs.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="team-section">
        <h2>Notre Équipe</h2>
        <p className="team-intro">
          Derrière CRM Pro se trouve une équipe passionnée de professionnels dédiés à créer la meilleure 
          expérience possible pour nos utilisateurs.
        </p>
        
        <div className="team-grid">
          <div className="team-member">
            <div className="member-avatar">A</div>
            <h3>Alexandre Martin</h3>
            <p className="member-role">Co-fondateur & CEO</p>
            <p className="member-bio">
              Entrepreneur en série avec 15 ans d'expérience dans le développement commercial.
            </p>
          </div>
          
          <div className="team-member">
            <div className="member-avatar">S</div>
            <h3>Sophie Dubois</h3>
            <p className="member-role">Co-fondatrice & CTO</p>
            <p className="member-bio">
              Développeuse full-stack et architecte logiciel avec une passion pour l'UX.
            </p>
          </div>
          
          <div className="team-member">
            <div className="member-avatar">T</div>
            <h3>Thomas Leroy</h3>
            <p className="member-role">Responsable Produit</p>
            <p className="member-bio">
              Expert en expérience utilisateur et en développement de produits SaaS.
            </p>
          </div>
          
          <div className="team-member">
            <div className="member-avatar">L</div>
            <h3>Laura Bernard</h3>
            <p className="member-role">Responsable Support</p>
            <p className="member-bio">
              Spécialiste du service client avec une approche centrée sur la satisfaction.
            </p>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <h2>Contactez-nous</h2>
        <p>
          Vous avez des questions ou des suggestions ? Notre équipe est là pour vous aider.
        </p>
        
        <div className="contact-methods">
          <div className="contact-method">
            <div className="contact-icon">✉️</div>
            <h3>Email</h3>
            <p>contact@crmpro.com</p>
            <p className="response-time">Réponse sous 24h</p>
          </div>
          
          <div className="contact-method">
            <div className="contact-icon">💬</div>
            <h3>Chat en direct</h3>
            <p>Disponible du lundi au vendredi</p>
            <p className="response-time">9h - 18h</p>
          </div>
          
          <div className="contact-method">
            <div className="contact-icon">📱</div>
            <h3>Téléphone</h3>
            <p>+33 1 23 45 67 89</p>
            <p className="response-time">Support prioritaire</p>
          </div>
        </div>
      </section>
    </div>
  </div>
);

export default About;