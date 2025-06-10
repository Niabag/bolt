# Charte graphique

Ce document décrit les grandes lignes du design à utiliser pour toutes les pages de l'application.

## Palette de couleurs

| Rôle            | Couleur                                |
|-----------------|----------------------------------------|
| Primaire        | Dégradé violet `#667eea` → `#764ba2`    |
| Secondaire      | Or `#BC9C23`                           |
| Fond            | Blanc `#FFFFFF`                        |
| Texte principal | Gris foncé `#2d3748`                   |
| Accent/Survol   | Orange `#f8ab37`                       |

## Typographie

- Police par défaut : `Segoe UI`, `Roboto`, `Helvetica Neue`, sans-serif
- Tailles de police modulaires pour conserver la hiérarchie visuelle

## Composants communs

- **Boutons** : bords arrondis (12 px) et ombre légère.
- **Cartes** : arrière-plan blanc, ombre subtile et coins arrondis (16 px).
- **Sections** : marges verticales généreuses (4 rem) pour une lecture aérée.

## Pages

### Accueil
- Hero avec le dégradé primaire
- Mise en avant des fonctionnalités par groupes de trois
- Témoignages dans des cartes bordées

### Connexion / Inscription
- Fond dégradé primaire sur toute la page
- Formulaire centré dans une carte blanche
- Icônes d’aide pour chaque champ

### Dashboard
- Barre latérale sombre (`#1e293b`)
- Contenu principal sur fond clair
- Graphiques aux couleurs primaire et secondaire

### Pages légales (Conditions, Confidentialité)
- Mise en page simple et texte aligné à gauche
- Titres en violet primaire

### Pages d’erreur
- Grand code d’erreur en gras
- Bouton de retour utilisant la couleur secondaire

## Fichiers SCSS

Les variables de couleur se trouvent dans `src/utils/styles/colors.scss` et peuvent être importées dans chaque fichier SCSS :

```scss
@import "../../utils/styles/colors.scss";
```

Les principales variables sont :

- `$primary-start` et `$primary-end` : couleurs du dégradé principal
- `$primary-gradient` : dégradé prêt à l'emploi
- `$secondary` : couleur secondaire
- `$background` : couleur de fond générale
- `$text-dark` : couleur pour les titres et le texte
- `$accent` : couleur d'accent et de survol

Utilisez ces variables pour garder une cohérence sur toutes les pages.

