import './cookies.scss';

const Cookies = () => (
  <div className="cookies-page">
    <div className="cookies-header">
      <h1>Politique des Cookies</h1>
      <p className="last-updated">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
    </div>

    <div className="cookies-container">
      <section className="cookies-section">
        <h2>1. Introduction</h2>
        <p>
          La présente Politique des Cookies explique comment CRM Pro utilise les cookies et technologies similaires 
          pour vous offrir la meilleure expérience possible sur notre plateforme. Nous vous recommandons de lire 
          attentivement cette politique pour comprendre comment nous utilisons ces technologies.
        </p>
      </section>

      <section className="cookies-section">
        <h2>2. Qu'est-ce qu'un cookie ?</h2>
        <p>
          Un cookie est un petit fichier texte placé sur votre appareil (ordinateur, tablette, smartphone) 
          lorsque vous visitez un site web. Les cookies nous permettent de reconnaître votre appareil et de 
          mémoriser certaines informations sur votre visite, comme vos préférences de langue ou vos informations 
          de connexion.
        </p>
        <p>
          Les cookies peuvent être "persistants" ou "de session". Les cookies persistants restent sur votre 
          appareil jusqu'à leur expiration ou jusqu'à ce que vous les supprimiez. Les cookies de session sont 
          supprimés dès que vous fermez votre navigateur.
        </p>
      </section>

      <section className="cookies-section">
        <h2>3. Types de cookies que nous utilisons</h2>
        
        <h3>3.1 Cookies essentiels</h3>
        <p>
          Ces cookies sont nécessaires au fonctionnement de notre plateforme. Ils vous permettent de naviguer 
          sur notre site et d'utiliser ses fonctionnalités, comme l'accès aux zones sécurisées. Sans ces cookies, 
          certains services que vous avez demandés ne peuvent pas être fournis.
        </p>
        <div className="cookie-examples">
          <div className="cookie-example">
            <span className="cookie-name">session_id</span>
            <span className="cookie-purpose">Gestion de votre session utilisateur</span>
            <span className="cookie-duration">Session</span>
          </div>
          <div className="cookie-example">
            <span className="cookie-name">auth_token</span>
            <span className="cookie-purpose">Authentification sécurisée</span>
            <span className="cookie-duration">30 jours</span>
          </div>
        </div>
        
        <h3>3.2 Cookies de performance</h3>
        <p>
          Ces cookies nous permettent de compter les visites et les sources de trafic afin de mesurer et 
          d'améliorer les performances de notre site. Ils nous aident à savoir quelles pages sont les plus 
          et les moins populaires et à voir comment les visiteurs se déplacent sur le site.
        </p>
        <div className="cookie-examples">
          <div className="cookie-example">
            <span className="cookie-name">_ga</span>
            <span className="cookie-purpose">Google Analytics - Statistiques d'utilisation</span>
            <span className="cookie-duration">2 ans</span>
          </div>
          <div className="cookie-example">
            <span className="cookie-name">_gid</span>
            <span className="cookie-purpose">Google Analytics - Identification des utilisateurs</span>
            <span className="cookie-duration">24 heures</span>
          </div>
        </div>
        
        <h3>3.3 Cookies fonctionnels</h3>
        <p>
          Ces cookies permettent au site de fournir des fonctionnalités et une personnalisation améliorées. 
          Ils peuvent être définis par nous ou par des fournisseurs tiers dont nous avons ajouté les services 
          à nos pages.
        </p>
        <div className="cookie-examples">
          <div className="cookie-example">
            <span className="cookie-name">preferences</span>
            <span className="cookie-purpose">Mémorisation de vos préférences d'interface</span>
            <span className="cookie-duration">1 an</span>
          </div>
          <div className="cookie-example">
            <span className="cookie-name">language</span>
            <span className="cookie-purpose">Mémorisation de votre langue préférée</span>
            <span className="cookie-duration">1 an</span>
          </div>
        </div>
        
        <h3>3.4 Cookies de ciblage</h3>
        <p>
          Ces cookies peuvent être définis via notre site par nos partenaires publicitaires. Ils peuvent être 
          utilisés par ces entreprises pour établir un profil de vos intérêts et vous montrer des publicités 
          pertinentes sur d'autres sites.
        </p>
        <div className="cookie-examples">
          <div className="cookie-example">
            <span className="cookie-name">_fbp</span>
            <span className="cookie-purpose">Facebook Pixel - Suivi des conversions</span>
            <span className="cookie-duration">3 mois</span>
          </div>
        </div>
      </section>

      <section className="cookies-section">
        <h2>4. Comment gérer vos cookies</h2>
        <p>
          Vous pouvez configurer votre navigateur pour qu'il refuse tous les cookies ou pour qu'il vous avertisse 
          lorsqu'un cookie est envoyé. Cependant, certaines fonctionnalités de notre site pourraient ne pas 
          fonctionner correctement si vous désactivez les cookies.
        </p>
        <p>
          Voici comment gérer les cookies dans les navigateurs les plus populaires :
        </p>
        <ul className="browser-list">
          <li>
            <strong>Chrome</strong> : Menu → Paramètres → Afficher les paramètres avancés → 
            Confidentialité → Paramètres de contenu → Cookies
          </li>
          <li>
            <strong>Firefox</strong> : Menu → Options → Vie privée → Historique → Paramètres personnalisés → Cookies
          </li>
          <li>
            <strong>Safari</strong> : Préférences → Confidentialité → Cookies et données de site web
          </li>
          <li>
            <strong>Edge</strong> : Menu → Paramètres → Afficher les paramètres avancés → 
            Cookies → Bloquer tous les cookies
          </li>
        </ul>
      </section>

      <section className="cookies-section">
        <h2>5. Cookies tiers</h2>
        <p>
          Certains cookies sont placés par des services tiers qui apparaissent sur nos pages. Nous utilisons 
          les services de tiers suivants qui peuvent placer des cookies sur votre appareil :
        </p>
        <ul>
          <li>Google Analytics (analyse d'audience)</li>
          <li>Stripe (traitement des paiements)</li>
          <li>Intercom (chat en direct et support)</li>
          <li>Facebook Pixel (suivi des conversions)</li>
        </ul>
        <p>
          Chacun de ces services a sa propre politique de confidentialité et de cookies que nous vous 
          encourageons à consulter.
        </p>
      </section>

      <section className="cookies-section">
        <h2>6. Modifications de notre politique des cookies</h2>
        <p>
          Nous pouvons mettre à jour cette politique des cookies de temps à autre pour refléter, par exemple, 
          les changements apportés aux cookies que nous utilisons ou pour d'autres raisons opérationnelles, 
          légales ou réglementaires. Nous vous encourageons à consulter régulièrement cette page pour rester 
          informé des cookies que nous utilisons.
        </p>
      </section>

      <section className="cookies-section">
        <h2>7. Nous contacter</h2>
        <p>
          Si vous avez des questions concernant notre utilisation des cookies, veuillez nous contacter à :
        </p>
        <p>
          <strong>Email</strong> : privacy@crmpro.com<br />
          <strong>Adresse</strong> : 123 Rue de l'Innovation, 75001 Paris, France
        </p>
      </section>
    </div>

    <div className="cookies-footer">
      <p>
        En continuant à utiliser notre site, vous consentez à notre utilisation des cookies conformément 
        à cette politique.
      </p>
      <div className="cookies-actions">
        <a href="/" className="btn-secondary">Retour à l'accueil</a>
        <a href="/privacy" className="btn-primary">Politique de confidentialité</a>
      </div>
    </div>
  </div>
);

export default Cookies;