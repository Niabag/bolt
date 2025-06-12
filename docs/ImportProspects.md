# Importer des prospects

Cette API permet d'importer des prospects depuis un fichier CSV, XLSX, PDF, JSON ou VCF (vCard).

## Formats supportés

### CSV
Un exemple de fichier se trouve dans `example-data/prospect-sample.csv` :

```
Nom,Email,Téléphone,Entreprise,Statut,Notes,Adresse,Code Postal,Ville,Date de Création,Dernière Mise à Jour
Alice Dupont,alice.dupont@mail.com,06 12 34 56 78,Alpha SARL,Actif,Client fidèle,12 rue Victor Hugo,75001,Paris,2024-03-01,2025-06-10
```

Le format CSV peut utiliser des virgules ou des points-virgules comme séparateurs. Le système détecte automatiquement le séparateur utilisé.

### XLSX (Excel)
Format Excel standard. La première ligne doit contenir les en-têtes des colonnes.

### JSON
Format JSON standard avec un tableau d'objets. Exemple :

```json
[
  {
    "name": "Alice Dupont",
    "email": "alice.dupont@mail.com",
    "phone": "06 12 34 56 78",
    "company": "Alpha SARL",
    "status": "Actif",
    "notes": "Client fidèle",
    "address": "12 rue Victor Hugo",
    "postalCode": "75001",
    "city": "Paris"
  }
]
```

### PDF
Le système peut extraire des données tabulaires à partir de documents PDF. Pour de meilleurs résultats, assurez-vous que les données sont bien structurées dans le PDF.

### VCF (vCard)
Format standard vCard pour les contacts. Exemple :

```
BEGIN:VCARD
VERSION:3.0
FN:Alice Dupont
EMAIL:alice.dupont@mail.com
TEL:06 12 34 56 78
ORG:Alpha SARL
NOTE:Client fidèle
ADR;TYPE=home:;;12 rue Victor Hugo;Paris;;75001;
END:VCARD
```

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
2. Sélectionnez le format souhaité dans la liste déroulante.
3. Cliquez sur **Sélectionner un fichier** pour choisir votre fichier.
4. Cliquez sur **Importer des prospects** pour lancer l'import.

Une notification confirmera la réussite de l'import et les prospects apparaîtront ensuite dans la page **Prospects**.

## Résolution des problèmes

- **Format incorrect** : Assurez-vous que le format du fichier correspond au format sélectionné dans l'interface.
- **Champs manquants** : Les champs obligatoires sont Nom, Email et Téléphone. Les autres champs sont optionnels.
- **Encodage** : Pour les fichiers CSV, utilisez de préférence l'encodage UTF-8.
- **Taille du fichier** : La taille maximale acceptée est de 10 Mo.

Pour plus d'informations, consultez la [documentation complète](https://docs.crmpro.com/import-export).