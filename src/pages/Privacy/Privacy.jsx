import { Link } from 'react-router-dom';
import './Privacy.scss';

const Privacy = () => {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <div className="privacy-header">
          <h1>Politique de Confidentialité</h1>
          <p className="last-updated">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div className="privacy-content">
          <section className="privacy-section">
            <h2>1. Introduction</h2>
            <p>
              Chez CRM Pro, nous nous engageons à protéger votre vie privée et vos données personnelles. 
              Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons 
              vos informations lorsque vous utilisez notre service.
            </p>
          </section>

          <section className="privacy-section">
            <h2>2. Données que nous collectons</h2>
            
            <h3>2.1 Informations d'inscription</h3>
            <ul>
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Mot de passe (chiffré)</li>
              <li>Informations de profil optionnelles</li>
            </ul>

            <h3>2.2 Données d'utilisation</h3>
            <ul>
              <li>Informations sur vos prospects et clients</li>
              <li>Devis et documents créés</li>
              <li>Paramètres de configuration</li>
              <li>Logs d'activité et d'utilisation</li>
            </ul>

            <h3>2.3 Données techniques</h3>
            <ul>
              <li>Adresse IP</li>
              <li>Type de navigateur et version</li>
              <li>Système d'exploitation</li>
              <li>Pages visitées et temps passé</li>
              <li>Cookies et technologies similaires</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>3. Comment nous utilisons vos données</h2>
            
            <h3>3.1 Fourniture du service</h3>
            <ul>
              <li>Créer et gérer votre compte</li>
              <li>Fournir les fonctionnalités de CRM Pro</li>
              <li>Synchroniser vos données entre appareils</li>
              <li>Générer des rapports et analytics</li>
            </ul>

            <h3>3.2 Communication</h3>
            <ul>
              <li>Envoyer des notifications importantes</li>
              <li>Répondre à vos demandes de support</li>
              <li>Vous informer des mises à jour du service</li>
              <li>Newsletter (avec votre consentement)</li>
            </ul>

            <h3>3.3 Amélioration du service</h3>
            <ul>
              <li>Analyser l'utilisation pour améliorer nos fonctionnalités</li>
              <li>Détecter et prévenir les problèmes techniques</li>
              <li>Développer de nouvelles fonctionnalités</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>4. Base légale du traitement</h2>
            <p>Nous traitons vos données personnelles sur les bases légales suivantes :</p>
            <ul>
              <li><strong>Exécution du contrat :</strong> Pour fournir le service CRM Pro</li>
              <li><strong>Intérêt légitime :</strong> Pour améliorer notre service et assurer la sécurité</li>
              <li><strong>Consentement :</strong> Pour les communications marketing (révocable à tout moment)</li>
              <li><strong>Obligation légale :</strong> Pour respecter nos obligations réglementaires</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>5. Partage de données</h2>
            <p>Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations uniquement dans les cas suivants :</p>
            
            <h3>5.1 Prestataires de services</h3>
            <ul>
              <li>Hébergement cloud sécurisé</li>
              <li>Services de paiement</li>
              <li>Outils d'analyse (données anonymisées)</li>
              <li>Support client</li>
            </ul>

            <h3>5.2 Obligations légales</h3>
            <p>
              Nous pouvons divulguer vos informations si la loi l'exige ou pour protéger nos droits, 
              votre sécurité ou celle d'autrui.
            </p>
          </section>

          <section className="privacy-section">
            <h2>6. Sécurité des données</h2>
            <p>Nous mettons en place des mesures de sécurité robustes :</p>
            <ul>
              <li>Chiffrement des données en transit et au repos</li>
              <li>Authentification à deux facteurs disponible</li>
              <li>Accès restreint aux données personnelles</li>
              <li>Surveillance continue des systèmes</li>
              <li>Sauvegardes régulières et sécurisées</li>
              <li>Tests de sécurité réguliers</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h2>7. Conservation des données</h2>
            <p>Nous conservons vos données personnelles :</p>
            <ul>
              <li><strong>Données de compte :</strong> Tant que votre compte est actif</li>
              <li><strong>Données d'utilisation :</strong> 3 ans après la dernière activité</li>
              <li><strong>Données de facturation :</strong> 10 ans (obligation légale)</li>
              <li><strong>Logs techniques :</strong> 12 mois maximum</li>
            </ul>
            <p>
              Après suppression de votre compte, vos données sont supprimées dans un délai de 30 jours, 
              sauf obligation légale de conservation.
            </p>
          </section>

          <section className="privacy-section">
            <h2>8. Vos droits (RGPD)</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            
            <h3>8.1 Droit d'accès</h3>
            <p>Vous pouvez demander une copie de toutes les données personnelles que nous détenons sur vous.</p>
            
            <h3>8.2 Droit de rectification</h3>
            <p>Vous pouvez corriger ou mettre à jour vos informations personnelles à tout moment.</p>
            
            <h3>8.3 Droit à l'effacement</h3>
            <p>Vous pouvez demander la suppression de vos données personnelles dans certaines circonstances.</p>
            
            <h3>8.4 Droit à la portabilité</h3>
            <p>Vous pouvez demander l'export de vos données dans un format structuré et lisible.</p>
            
            <h3>8.5 Droit d'opposition</h3>
            <p>Vous pouvez vous opposer au traitement de vos données à des fins de marketing direct.</p>
            
            <h3>8.6 Droit de limitation</h3>
            <p>Vous pouvez demander la limitation du traitement de vos données dans certains cas.</p>
          </section>

          <section className="privacy-section">
            <h2>9. Cookies et technologies similaires</h2>
            <p>Nous utilisons des cookies pour :</p>
            <ul>
              <li><strong>Cookies essentiels :</strong> Fonctionnement du service (connexion, sécurité)</li>
              <li><strong>Cookies de performance :</strong> Amélioration de l'expérience utilisateur</li>
              <li><strong>Cookies d'analyse :</strong> Compréhension de l'utilisation (anonymisés)</li>
            </ul>
            <p>
              Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur. 
              Notez que désactiver certains cookies peut affecter le fonctionnement du service.
            </p>
          </section>

          <section className="privacy-section">
            <h2>10. Transferts internationaux</h2>
            <p>
              Vos données sont principalement stockées dans l'Union Européenne. Si un transfert vers un pays tiers 
              est nécessaire, nous nous assurons qu'il bénéficie d'un niveau de protection adéquat 
              (décision d'adéquation, clauses contractuelles types, etc.).
            </p>
          </section>

          <section className="privacy-section">
            <h2>11. Mineurs</h2>
            <p>
              CRM Pro n'est pas destiné aux personnes de moins de 16 ans. Nous ne collectons pas 
              sciemment d'informations personnelles auprès de mineurs. Si vous pensez qu'un mineur 
              nous a fourni des données personnelles, contactez-nous immédiatement.
            </p>
          </section>

          <section className="privacy-section">
            <h2>12. Modifications de cette politique</h2>
            <p>
              Nous pouvons mettre à jour cette politique de confidentialité occasionnellement. 
              Les modifications importantes vous seront notifiées par email ou via l'interface du service 
              au moins 30 jours avant leur entrée en vigueur.
            </p>
          </section>

          <section className="privacy-section">
            <h2>13. Contact et réclamations</h2>
            <p>Pour toute question concernant cette politique ou pour exercer vos droits :</p>
            
            <h3>13.1 Délégué à la Protection des Données</h3>
            <ul>
              <li>Email : dpo@crmpro.com</li>
              <li>Adresse : DPO CRM Pro, 123 Rue de l'Innovation, 75001 Paris, France</li>
            </ul>
            
            <h3>13.2 Autorité de contrôle</h3>
            <p>
              Vous avez également le droit de déposer une réclamation auprès de la CNIL 
              (Commission Nationale de l'Informatique et des Libertés) si vous estimez que 
              vos droits ne sont pas respectés.
            </p>
          </section>
        </div>

        <div className="privacy-footer">
          <p>
            En utilisant CRM Pro, vous confirmez avoir lu et compris cette politique de confidentialité.
          </p>
          <div className="privacy-actions">
            <Link to="/" className="btn-secondary">Retour à l'accueil</Link>
            <Link to="/terms" className="btn-primary">Conditions d'utilisation</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;