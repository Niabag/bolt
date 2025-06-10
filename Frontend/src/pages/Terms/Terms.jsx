import { Link } from 'react-router-dom';
import './Terms.scss';

const Terms = () => {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <div className="terms-header">
          <h1>Conditions Générales d'Utilisation</h1>
          <p className="last-updated">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div className="terms-content">
          <section className="terms-section">
            <h2>1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme CRM Pro, 
              un service de gestion de la relation client destiné aux entrepreneurs et freelances.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. Acceptation des conditions</h2>
            <p>
              En accédant et en utilisant CRM Pro, vous acceptez d'être lié par ces conditions d'utilisation. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </section>

          <section className="terms-section">
            <h2>3. Description du service</h2>
            <p>CRM Pro propose les fonctionnalités suivantes :</p>
            <ul>
              <li>Gestion des prospects et clients</li>
              <li>Création et édition de devis professionnels</li>
              <li>Génération de cartes de visite numériques avec QR codes</li>
              <li>Tableaux de bord et analytics</li>
              <li>Système de notifications</li>
              <li>Export de données et documents PDF</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>4. Inscription et compte utilisateur</h2>
            <h3>4.1 Conditions d'inscription</h3>
            <p>
              Pour utiliser CRM Pro, vous devez créer un compte en fournissant des informations exactes et complètes. 
              Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion.
            </p>
            <h3>4.2 Responsabilité du compte</h3>
            <p>
              Vous êtes entièrement responsable de toutes les activités qui se produisent sous votre compte. 
              Vous devez nous notifier immédiatement de toute utilisation non autorisée de votre compte.
            </p>
          </section>

          <section className="terms-section">
            <h2>5. Utilisation du service</h2>
            <h3>5.1 Utilisation autorisée</h3>
            <p>Vous pouvez utiliser CRM Pro uniquement à des fins légales et conformément à ces conditions.</p>
            
            <h3>5.2 Utilisations interdites</h3>
            <p>Il est interdit d'utiliser CRM Pro pour :</p>
            <ul>
              <li>Violer des lois ou réglementations applicables</li>
              <li>Transmettre du contenu illégal, nuisible ou offensant</li>
              <li>Interférer avec le fonctionnement du service</li>
              <li>Tenter d'accéder de manière non autorisée aux systèmes</li>
              <li>Utiliser le service à des fins de spam ou de harcèlement</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>6. Données et confidentialité</h2>
            <h3>6.1 Vos données</h3>
            <p>
              Vous conservez la propriété de toutes les données que vous saisissez dans CRM Pro. 
              Nous nous engageons à protéger vos données conformément à notre 
              <Link to="/privacy" className="link">Politique de Confidentialité</Link>.
            </p>
            
            <h3>6.2 Sauvegarde</h3>
            <p>
              Bien que nous effectuions des sauvegardes régulières, nous vous recommandons 
              d'exporter régulièrement vos données importantes.
            </p>
          </section>

          <section className="terms-section">
            <h2>7. Propriété intellectuelle</h2>
            <p>
              CRM Pro et tous ses éléments (logiciel, design, contenu) sont protégés par les droits de propriété intellectuelle. 
              Vous ne pouvez pas copier, modifier, distribuer ou créer des œuvres dérivées sans autorisation écrite.
            </p>
          </section>

          <section className="terms-section">
            <h2>8. Tarification et paiement</h2>
            <h3>8.1 Tarifs</h3>
            <p>
              Les tarifs actuels sont disponibles sur notre site web. Nous nous réservons le droit de modifier 
              nos tarifs avec un préavis de 30 jours.
            </p>
            
            <h3>8.2 Facturation</h3>
            <p>
              Les frais sont facturés à l'avance selon la périodicité choisie (mensuelle ou annuelle). 
              Le paiement est dû immédiatement lors de la facturation.
            </p>
            
            <h3>8.3 Remboursements</h3>
            <p>
              Les remboursements sont accordés au cas par cas, selon notre politique de remboursement. 
              Contactez notre support pour toute demande.
            </p>
          </section>

          <section className="terms-section">
            <h2>9. Résiliation</h2>
            <h3>9.1 Résiliation par l'utilisateur</h3>
            <p>
              Vous pouvez résilier votre compte à tout moment depuis les paramètres de votre compte 
              ou en nous contactant directement.
            </p>
            
            <h3>9.2 Résiliation par CRM Pro</h3>
            <p>
              Nous pouvons suspendre ou résilier votre compte en cas de violation de ces conditions, 
              avec ou sans préavis selon la gravité de la violation.
            </p>
            
            <h3>9.3 Effet de la résiliation</h3>
            <p>
              Après résiliation, votre accès au service sera interrompu. Vos données seront conservées 
              pendant 30 jours puis supprimées définitivement.
            </p>
          </section>

          <section className="terms-section">
            <h2>10. Limitation de responsabilité</h2>
            <p>
              CRM Pro est fourni "en l'état" sans garantie d'aucune sorte. Nous ne sommes pas responsables 
              des dommages indirects, accessoires ou consécutifs résultant de l'utilisation du service.
            </p>
            <p>
              Notre responsabilité totale ne dépassera pas le montant payé par vous au cours des 12 derniers mois.
            </p>
          </section>

          <section className="terms-section">
            <h2>11. Disponibilité du service</h2>
            <p>
              Nous nous efforçons de maintenir CRM Pro disponible 24h/24 et 7j/7, mais nous ne garantissons pas 
              une disponibilité ininterrompue. Des maintenances programmées peuvent occasionner des interruptions temporaires.
            </p>
          </section>

          <section className="terms-section">
            <h2>12. Modifications des conditions</h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications importantes 
              vous seront notifiées par email ou via l'interface du service au moins 30 jours avant leur entrée en vigueur.
            </p>
          </section>

          <section className="terms-section">
            <h2>13. Droit applicable et juridiction</h2>
            <p>
              Ces conditions sont régies par le droit français. Tout litige sera soumis à la juridiction 
              des tribunaux français compétents.
            </p>
          </section>

          <section className="terms-section">
            <h2>14. Contact</h2>
            <p>
              Pour toute question concernant ces conditions d'utilisation, vous pouvez nous contacter :
            </p>
            <ul>
              <li>Email : legal@crmpro.com</li>
              <li>Adresse : 123 Rue de l'Innovation, 75001 Paris, France</li>
              <li>Téléphone : +33 1 23 45 67 89</li>
            </ul>
          </section>
        </div>

        <div className="terms-footer">
          <p>
            En utilisant CRM Pro, vous confirmez avoir lu, compris et accepté ces conditions d'utilisation.
          </p>
          <div className="terms-actions">
            <Link to="/" className="btn-secondary">Retour à l'accueil</Link>
            <Link to="/privacy" className="btn-primary">Politique de confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;