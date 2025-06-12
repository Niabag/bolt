# Exporter vos données

Cette fonctionnalité vous permet de télécharger l'ensemble de vos clients, devis et factures.

## Formats supportés

### JSON
Un exemple de fichier se trouve dans `example-data/prospect-sample.json` :

```
[
  { "name": "Alice Dupont", "email": "alice.dupont@mail.com" }
]
```

Ce format est idéal pour réimporter facilement vos données dans un autre système.

### XLSX (Excel)
Classeur Excel standard contenant une feuille pour les clients, une pour les devis et une pour les factures.

### PDF
Un document PDF prêt à être imprimé. Chaque devis et chaque facture est exporté dans le même fichier.

### VCF (Clients uniquement)
Génère une carte de visite virtuelle (vCard) pour chaque client. Un exemple est disponible dans `example-data/prospect-sample.vcf`.

## Champs exportés

Les fichiers générés contiennent les champs suivants :

| Champ | Description |
|-------|-------------|
| Nom | Nom complet du client ou prospect |
| Email | Adresse email |
| Téléphone | Numéro de téléphone |
| Entreprise | Nom de la société |
| Statut | Statut du client/prospect |
| Notes | Commentaires éventuels |
| Adresse | Adresse postale |
| Code postal | Code postal |
| Ville | Ville |

## Étapes d'export

1. Accédez à **Paramètres** → **Gestion des données** dans l'interface.
2. Sélectionnez le format souhaité dans la liste déroulante.
3. Cliquez sur **Exporter** pour télécharger vos données.

Le fichier généré contient les informations de l'utilisateur connecté, la liste des clients, tous les devis ainsi que les factures associées.

## Conseils pour un export réussi

- Assurez-vous que vous disposez des droits nécessaires pour exporter les données.
- Effectuez régulièrement une sauvegarde de vos données importantes.
- Vérifiez que le format choisi est adapté à l'utilisation prévue.

## Résolution des problèmes

- **Fichier vide** : assurez-vous que vos données existent et que vous êtes connecté.
- **Erreur de téléchargement** : vérifiez votre connexion internet ou réessayez plus tard.
- **Format non reconnu** : choisissez un format valide parmi JSON, XLSX, PDF ou VCF.

## Exemples de fichiers

Des exemples de fichiers d'export sont disponibles dans le dossier `example-data` :
- `prospect-sample.json` - Exemple au format JSON
- `prospect-sample.vcf` - Exemple au format VCF
