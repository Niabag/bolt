# Importer des prospects

Cette API permet d'importer des prospects depuis un fichier CSV ou Excel (XLSX).

## Formats supportés

### CSV (Recommandé)
Un exemple de fichier se trouve dans `example-data/prospect-sample.csv` :

```
Nom,Email,Téléphone,Entreprise,Statut,Notes,Adresse,Code Postal,Ville,Date de Création,Dernière Mise à Jour
Alice Dupont,alice.dupont@mail.com,06 12 34 56 78,Alpha SARL,Actif,Client fidèle,12 rue Victor Hugo,75001,Paris,2024-03-01,2025-06-10
```

Le format CSV peut utiliser des virgules ou des points-virgules comme séparateurs. Le système détecte automatiquement le séparateur utilisé.

### XLSX (Excel)
Format Excel standard. La première ligne doit contenir les en-têtes des colonnes.

## Champs reconnus

Le système reconnaît automatiquement les champs suivants, quelle que soit leur casse ou leur formulation exacte :

| Champ | Variantes reconnues |
|-------|---------------------|
| Nom | nom, name, prénom nom, nom complet |
| Email | email, courriel, e-mail, adresse email |
| Téléphone | téléphone, telephone, tel, tél, phone, mobile |
| Entreprise | entreprise, société, company, organisation |
| Statut | statut, status, état |
| Notes | notes, commentaires, remarques |
| Adresse | adresse, address, rue |
| Code postal | code postal, cp, postal code, postalcode |
| Ville | ville, city, localité |

## Étapes d'import

1. Accédez à **Paramètres** → **Gestion des données** dans l'interface.
2. Sélectionnez le format souhaité dans la liste déroulante (CSV ou Excel).
3. Cliquez sur **Sélectionner un fichier** pour choisir votre fichier.
4. Le système vérifiera automatiquement que l'extension du fichier correspond au format sélectionné.
5. Cliquez sur **Importer des prospects** pour lancer l'import.

Une notification confirmera la réussite de l'import et les prospects apparaîtront ensuite dans la page **Prospects**.

## Conseils pour un import réussi

- **Vérifiez les en-têtes** : Assurez-vous que les noms des colonnes correspondent aux champs reconnus.
- **Encodage** : Pour les fichiers CSV, utilisez de préférence l'encodage UTF-8.
- **Séparateurs** : Le système détecte automatiquement si vous utilisez des virgules ou des points-virgules.
- **Champs obligatoires** : Nom, Email et Téléphone sont obligatoires. Les autres champs sont optionnels.
- **Taille du fichier** : La taille maximale acceptée est de 10 Mo.
- **Nombre de prospects** : Pour de meilleures performances, limitez l'import à 100 prospects à la fois.

## Résolution des problèmes

- **Format incorrect** : Vérifiez que l'extension du fichier (.csv ou .xlsx) correspond au format sélectionné.
- **Erreur d'importation** : Vérifiez que votre fichier est correctement formaté et que les champs obligatoires sont présents.
- **Aucun prospect importé** : Vérifiez que votre fichier contient des données valides et que les en-têtes sont correctement nommés.

## Exemples de fichiers

Des exemples de fichiers d'import sont disponibles dans le dossier `example-data` :
- `prospect-sample.csv` - Exemple avec virgules comme séparateurs
- `prospect-sample-semicolon.csv` - Exemple avec points-virgules comme séparateurs