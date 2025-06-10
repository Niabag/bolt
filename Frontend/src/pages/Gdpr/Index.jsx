import './gdpr.scss';

const Gdpr = () => (
  <div className="gdpr-page">
    <div className="gdpr-header">
      <h1>Conformité RGPD</h1>
      <p className="last-updated">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
    </div>

    <div className="gdpr-container">
      <section className="gdpr-section">
        <h2>1. Introduction</h2>
        <p>
          Chez CRM Pro, nous prenons très au sérieux la protection de vos données personnelles. 
          Cette page explique comment nous nous conformons au Règlement Général sur la Protection des Données (RGPD) 
          et quels sont vos droits en tant qu'utilisateur de notre plateforme.
        </p>
      </section>

      <section className="gdpr-section">
        <h2>2. Nos engagements RGPD</h2>
        <p>
          En tant que responsable de traitement, CRM Pro s'engage à respecter les principes suivants :
        </p>
        <ul>
          <li>
            <strong>Licéité, loyauté et transparence</strong> : Nous traitons vos données de manière licite, 
            loyale et transparente.
          </li>
          <li>
            <strong>Limitation des finalités</strong> : Nous collectons vos données pour des finalités 
            déterminées, explicites et légitimes.
          </li>
          <li>
            <strong>Minimisation des données</strong> : Nous ne collectons que les données strictement 
            nécessaires aux finalités poursuivies.
          </li>
          <li>
            <strong>Exactitude</strong> : Nous prenons toutes les mesures raisonnables pour que les données 
            soient exactes et tenues à jour.
          </li>
          <li>
            <strong>Limitation de la conservation</strong> : Nous conservons vos données pour une durée 
            limitée et proportionnée.
          </li>
          <li>
            <strong>Intégrité et confidentialité</strong> : Nous assurons la sécurité et la confidentialité 
            de vos données.
          </li>
        </ul>
      </section>

      <section className="gdpr-section">
        <h2>3. Vos droits en tant qu'utilisateur</h2>
        <p>
          Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
        </p>
        
        <div className="rights-grid">
          <div className="right-card">
            <div className="right-icon">👁️</div>
            <h3>Droit d'accès</h3>
            <p>
              Vous pouvez demander une copie de toutes les données personnelles que nous détenons vous concernant.
            </p>
          </div>
          
          <div className="right-card">
            <div className="right-icon">✏️</div>
            <h3>Droit de rectification</h3>
            <p>
              Vous pouvez demander la correction de vos données personnelles si elles sont inexactes ou incomplètes.
            </p>
          </div>
          
          <div className="right-card">
            <div className="right-icon">🗑️</div>
            <h3>Droit à l'effacement</h3>
            <p>
              Vous pouvez demander la suppression de vos données personnelles dans certaines circonstances.
            </p>
          </div>
          
          <div className="right-card">
            <div className="right-icon">⏸️</div>
            <h3>Droit à la limitation</h3>
            <p>
              Vous pouvez demander la limitation du traitement de vos données personnelles.
            </p>
          </div>
          
          <div className="right-card">
            <div className="right-icon">📤</div>
            <h3>Droit à la portabilité</h3>
            <p>
              Vous pouvez demander à recevoir vos données dans un format structuré et lisible par machine.
            </p>
          </div>
          
          <div className="right-card">
            <div className="right-icon">🛑</div>
            <h3>Droit d'opposition</h3>
            <p>
              Vous pouvez vous opposer au traitement de vos données personnelles dans certaines circonstances.
            </p>
          </div>
        </div>
        
        <div className="exercise-rights">
          <h3>Comment exercer vos droits</h3>
          <p>
            Pour exercer l'un de ces droits, vous pouvez :
          </p>
          <ul>
            <li>Utiliser les options disponibles dans votre compte CRM Pro</li>
            <li>Contacter notre Délégué à la Protection des Données à <strong>dpo@crmpro.com</strong></li>
            <li>Nous écrire à l'adresse : CRM Pro - DPO, 123 Rue de l'Innovation, 75001 Paris, France</li>
          </ul>
          <p>
            Nous nous engageons à répondre à toute demande dans un délai d'un mois à compter de sa réception.
          </p>
        </div>
      </section>

      <section className="gdpr-section">
        <h2>4. Mesures techniques et organisationnelles</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour garantir 
          un niveau de sécurité adapté au risque, notamment :
        </p>
        <ul>
          <li>Chiffrement des données en transit et au repos</li>
          <li>Authentification à deux facteurs</li>
          <li>Contrôles d'accès stricts</li>
          <li>Audits de sécurité réguliers</li>
          <li>Formation de notre personnel aux bonnes pratiques de sécurité</li>
          <li>Procédures de gestion des incidents de sécurité</li>
        </ul>
      </section>

      <section className="gdpr-section">
        <h2>5. Transferts internationaux de données</h2>
        <p>
          CRM Pro héberge principalement vos données au sein de l'Union Européenne. Si un transfert vers 
          un pays tiers est nécessaire, nous mettons en place des garanties appropriées conformément au RGPD, 
          telles que des clauses contractuelles types approuvées par la Commission européenne.
        </p>
      </section>

      <section className="gdpr-section">
        <h2>6. Délégué à la Protection des Données</h2>
        <p>
          Nous avons désigné un Délégué à la Protection des Données (DPO) que vous pouvez contacter pour 
          toute question relative à la protection de vos données personnelles :
        </p>
        <div className="dpo-contact">
          <p><strong>Email</strong> : dpo@crmpro.com</p>
          <p><strong>Adresse</strong> : CRM Pro - DPO, 123 Rue de l'Innovation, 75001 Paris, France</p>
        </div>
      </section>

      <section className="gdpr-section">
        <h2>7. Violations de données</h2>
        <p>
          En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, 
          nous nous engageons à :
        </p>
        <ul>
          <li>Notifier l'autorité de contrôle compétente dans les 72 heures</li>
          <li>Vous informer dans les meilleurs délais si la violation présente un risque élevé pour vos droits et libertés</li>
          <li>Documenter toutes les violations de données, y compris leurs effets et les mesures prises pour y remédier</li>
        </ul>
      </section>

      <section className="gdpr-section">
        <h2>8. Analyses d'impact relatives à la protection des données</h2>
        <p>
          Nous réalisons des analyses d'impact relatives à la protection des données (AIPD) lorsque 
          certaines opérations de traitement sont susceptibles d'engendrer un risque élevé pour vos droits 
          et libertés.
        </p>
      </section>

      <section className="gdpr-section">
        <h2>9. Registre des activités de traitement</h2>
        <p>
          Conformément à l'article 30 du RGPD, nous tenons un registre de toutes les activités de traitement 
          effectuées sous notre responsabilité.
        </p>
      </section>

      <section className="gdpr-section">
        <h2>10. Autorité de contrôle</h2>
        <p>
          Si vous estimez que le traitement de vos données personnelles constitue une violation du RGPD, 
          vous avez le droit d'introduire une réclamation auprès d'une autorité de contrôle, en particulier 
          dans l'État membre de votre résidence habituelle, de votre lieu de travail ou du lieu où la violation 
          aurait été commise.
        </p>
        <p>
          Pour la France, l'autorité de contrôle est la Commission Nationale de l'Informatique et des Libertés (CNIL) :
        </p>
        <div className="authority-contact">
           <p><strong>Site web</strong> : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a></p>
          <p><strong>Adresse</strong> : 3 Place de Fontenoy, TSA 80715, 75334 PARIS CEDEX 07, France</p>
          <p><strong>Téléphone</strong> : +33 (0)1 53 73 22 22</p>
        </div>
      </section>
    </div>

    <div className="gdpr-footer">
      <p>
        Pour plus d'informations sur la façon dont nous traitons vos données personnelles, 
        veuillez consulter notre <a href="/privacy">Politique de Confidentialité</a>.
      </p>
      <div className="gdpr-actions">
        <a href="/" className="btn-secondary">Retour à l'accueil</a>
        <a href="/privacy" className="btn-primary">Politique de confidentialité</a>
      </div>
    </div>
  </div>
);

export default Gdpr;