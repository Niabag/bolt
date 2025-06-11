# Importer des prospects

Ce dépôt inclut une API permettant d'importer des prospects depuis un fichier CSV ou XLSX.

## Exemple de fichier

Un exemple de fichier se trouve dans `example-data/prospect-sample.csv` :

```
Nom,Email,Téléphone,Entreprise,Statut,Notes,Adresse,Code Postal,Ville,Date de Création,Dernière Mise à Jour
Alice Dupont,alice.dupont@mail.com,06 12 34 56 78,Alpha SARL,Actif,Client fidèle,12 rue Victor Hugo,75001,Paris,2024-03-01,2025-06-10
```

## Étapes d'import

1. Démarrer le serveur backend comme indiqué dans `Backend/README.md`.
2. Ouvrir l'interface Frontend et se connecter.
3. Accéder à **Paramètres** → **Gestion des données**.
4. Sélectionner le fichier CSV exemple et cliquer sur **Importer des prospects**.
5. Une notification indique la réussite de l'import. Le prospect apparaît alors dans la page **Prospects**.