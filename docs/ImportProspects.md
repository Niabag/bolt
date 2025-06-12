# Importer des prospects

Cette API permet d'importer des prospects depuis un fichier CSV, XLSX, PDF, JSON ou VCF (vCard).

## Exemple de fichier CSV

Un exemple de fichier se trouve dans `example-data/prospect-sample.csv` :

```
Nom,Email,Téléphone,Entreprise,Statut,Notes,Adresse,Code Postal,Ville,Date de Création,Dernière Mise à Jour
Alice Dupont,alice.dupont@mail.com,06 12 34 56 78,Alpha SARL,Actif,Client fidèle,12 rue Victor Hugo,75001,Paris,2024-03-01,2025-06-10
```

Vous trouverez également des exemples aux formats JSON et VCF dans le dossier `example-data`.

## Étapes d'import

1. Démarrer le serveur backend comme indiqué dans `Backend/README.md`.
2. Ouvrir l'interface Frontend et se connecter.
3. Accéder à **Paramètres** → **Gestion des données**.
4. Dans le bloc **Importer des prospects**, sélectionner d'abord le format désiré (CSV, XLSX, JSON, PDF ou VCF) dans la liste déroulante puis choisir le fichier correspondant avant de cliquer sur **Importer des prospects**. L'extension choisie est transmise à l'API dans le champ `format`.
5. Une notification confirme la réussite de l'import et les prospects apparaissent dans la page **Prospects**.

