# CRM Application.
Une application CRM complète avec gestion des clients et génération de devis.
## 🚀 Fonctionnalités

- **Authentification** : Inscription et connexion sécurisées
- **Gestion des clients** : Ajout, modification, suppression de prospects
- **Génération de devis** : Création et édition de devis professionnels
- **QR Code** : Génération de liens d'inscription pour les clients
- **Export PDF** : Téléchargement des devis en format PDF
- **Schémas d'actions** : Plusieurs séquences pour afficher site ou formulaire selon vos besoins

## 📋 Prérequis

- Node.js (version 16 ou supérieure)
- MongoDB (local ou distant)
- npm ou yarn

## 🛠️ Installation

### 1. Cloner le projet
```bash
git clone <votre-repo>
cd crm-application
```

### 2. Configuration Backend

```bash
cd Backend
npm install
```

Créer le fichier `.env` à partir de `.env.example` :
```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos configurations :
```env
# URL de connexion MongoDB
MONGO_URI=mongodb://localhost:27017/crm-database
# ou utilisez MONGODB_URI
PORT=5000
NODE_ENV=development
JWT_SECRET=votre_secret_jwt_tres_securise
FRONTEND_URL=http://localhost:5173
```

### 3. Configuration Frontend

```bash
cd ../Frontend
npm install
```

Créer le fichier `.env` à partir de `.env.example` :
```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos configurations :
```env
VITE_API_URL=http://localhost:5000
# During development the frontend uses a proxy, so `/api` is sufficient
VITE_API_BASE_URL=/api
VITE_FRONTEND_URL=http://localhost:5173
VITE_NODE_ENV=development
```

## 🚀 Démarrage

### 1. Démarrer MongoDB
Assurez-vous que MongoDB est en cours d'exécution sur votre machine.

### 2. Démarrer le Backend
```bash
cd Backend
npm start
```
Le serveur sera accessible sur `http://localhost:5000`

### 3. Démarrer le Frontend
```bash
cd Frontend
npm run dev
```
L'application sera accessible sur `http://localhost:5173`

## 📁 Structure du projet

```
crm-application/
├── Backend/
│   ├── config/          # Configuration (DB, CORS)
│   ├── controllers/     # Logique métier
│   ├── middleware/      # Middleware d'authentification
│   ├── models/          # Modèles MongoDB
│   ├── routes/          # Routes API
│   ├── .env.example     # Exemple de configuration
│   └── server.js        # Point d'entrée
├── Frontend/
│   ├── src/
│   │   ├── components/  # Composants React
│   │   ├── config/      # Configuration API
│   │   ├── pages/       # Pages de l'application
│   │   └── utils/       # Utilitaires
│   ├── .env.example     # Exemple de configuration
│   └── package.json
└── README.md
```

## 🔧 Configuration des variables d'environnement

### Backend (.env)
- `MONGO_URI` / `MONGODB_URI` : URL de connexion MongoDB
- `PORT` : Port du serveur (défaut: 5000)
- `NODE_ENV` : Environnement (development/production)
- `JWT_SECRET` : Clé secrète pour JWT
- `FRONTEND_URL` : URL du frontend pour CORS

### Frontend (.env)
- `VITE_API_URL` : URL de base de l'API
- `VITE_API_BASE_URL` : URL complète de l'API
- `VITE_FRONTEND_URL` : URL du frontend
- `VITE_NODE_ENV` : Environnement

## 🔒 Sécurité

- Les fichiers `.env` sont automatiquement ignorés par Git
- JWT avec expiration pour l'authentification
- Validation des données côté serveur
- CORS configuré pour sécuriser les requêtes

## 📝 API Endpoints

### Authentification
- `POST /api/users/register` - Inscription
- `POST /api/users/login` - Connexion
- `GET /api/users/me` - Profil utilisateur

### Clients
- `GET /api/clients` - Liste des clients
- `POST /api/clients/register/:userId` - Inscription client
- `DELETE /api/clients/:id` - Suppression client

### Devis
- `GET /api/devis` - Liste des devis
- `GET /api/devis/:id` - Détails d'un devis
- `POST /api/devis` - Création devis
- `PUT /api/devis/:id` - Modification devis
- `DELETE /api/devis/:id` - Suppression devis

## 🚀 Déploiement

### Backend (Vercel)
1. Connecter votre repo à Vercel
2. Configurer les variables d'environnement dans Vercel
3. Déployer automatiquement

### Frontend (Netlify/Vercel)
1. Build : `npm run build`
2. Dossier de sortie : `dist`
3. Configurer les variables d'environnement

## 🎨 Charte graphique

Une description complète du design et des couleurs se trouve dans
[docs/design-guidelines.md](docs/design-guidelines.md).

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## ⚠️ Important

**Ne jamais commiter les fichiers `.env` !** Ils contiennent des informations sensibles et sont automatiquement ignorés par Git.

Pour partager la configuration :
1. Utilisez les fichiers `.env.example`
2. Documentez les variables nécessaires
3. Chaque développeur crée son propre `.env`

## ❓ Résolution des problèmes

Si vous scannez le QR code depuis un appareil mobile et obtenez l'erreur
`ERR_CONNECTION_REFUSED`, assurez‑vous que le frontend est accessible depuis ce
réseau. Utilisez un nom de domaine public ou un tunnel (ex. `ngrok`) plutôt que
`localhost` pour que le lien soit reachable sur votre téléphone.
