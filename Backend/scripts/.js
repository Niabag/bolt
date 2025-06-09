const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import des modèles
const User = require('../models/user');
const Client = require('../models/client');

// Configuration de la base de données
const connectDB = require('../config/database');

// Données pour générer des clients variés
const firstNames = [
  'Alexandre', 'Isabelle', 'Julien', 'Nathalie', 'Sébastien', 'Valérie', 'Maxime', 'Caroline',
  'Thomas', 'Sophie', 'Nicolas', 'Marie', 'Pierre', 'Camille', 'Lucas', 'Emma', 'Hugo', 'Chloé',
  'Antoine', 'Léa', 'Mathieu', 'Sarah', 'Romain', 'Laura', 'Florian', 'Manon', 'Adrien', 'Océane',
  'Quentin', 'Pauline', 'Vincent', 'Justine', 'Benjamin', 'Morgane', 'Clément', 'Anaïs', 'Damien', 'Elise',
  'Fabien', 'Audrey', 'Jérémie', 'Mélanie', 'Sylvain', 'Céline', 'Olivier', 'Virginie', 'Franck', 'Sandrine',
  'Christophe', 'Stéphanie', 'Laurent', 'Patricia', 'Philippe', 'Martine', 'Thierry', 'Monique', 'Alain', 'Françoise'
];

const lastNames = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
  'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
  'Morel', 'Girard', 'Andre', 'Lefevre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez',
  'Legrand', 'Garnier', 'Faure', 'Rousseau', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel', 'Nicolas',
  'Perrin', 'Morin', 'Mathieu', 'Clement', 'Gauthier', 'Dumont', 'Lopez', 'Fontaine', 'Chevalier', 'Robin'
];

const companies = [
  'Tech Solutions', 'Digital Agency', 'Innovation Lab', 'Creative Studio', 'Consulting Pro',
  'Web Factory', 'Design House', 'Marketing Plus', 'Business Center', 'Service Express',
  'Quality First', 'Expert Conseil', 'Pro Services', 'Elite Solutions', 'Smart Business',
  'Dynamic Group', 'Success Partners', 'Prime Consulting', 'Alpha Solutions', 'Beta Services',
  'Gamma Tech', 'Delta Digital', 'Epsilon Design', 'Zeta Marketing', 'Eta Consulting',
  'Theta Solutions', 'Iota Services', 'Kappa Tech', 'Lambda Digital', 'Mu Creative',
  'Nu Business', 'Xi Solutions', 'Omicron Services', 'Pi Tech', 'Rho Digital',
  'Sigma Creative', 'Tau Business', 'Upsilon Solutions', 'Phi Services', 'Chi Tech',
  'Psi Digital', 'Omega Creative', 'Boutique Mode', 'Restaurant Gourmet', 'Salon Beauté',
  'Garage Auto', 'Cabinet Médical', 'École Formation', 'Agence Immobilière', 'Studio Photo'
];

const domains = ['gmail.com', 'hotmail.fr', 'yahoo.fr', 'outlook.com', 'free.fr', 'orange.fr', 'sfr.fr', 'laposte.net', 'wanadoo.fr'];

const statuses = ['nouveau', 'active', 'inactive', 'pending'];

const sampleNotes = [
  'Intéressé par un site e-commerce',
  'Souhaite une application mobile',
  'Besoin d\'un site vitrine professionnel',
  'Système de gestion des rendez-vous',
  'Site avec système de réservation',
  'Portfolio de réalisations',
  'Site avec planning des cours',
  'Galerie photo en ligne',
  'Plateforme de gestion',
  'Site personnel et blog',
  'Refonte complète du site existant',
  'Optimisation SEO nécessaire',
  'Intégration réseaux sociaux',
  'Système de paiement en ligne',
  'Application de gestion stock',
  'Site multilingue requis',
  'Formation équipe prévue',
  'Maintenance mensuelle souhaitée',
  'Hébergement à prévoir',
  'Design responsive obligatoire'
];

// Fonction pour générer un numéro de téléphone français
const generatePhoneNumber = () => {
  const prefixes = ['06', '07'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const numbers = [];
  for (let i = 0; i < 4; i++) {
    numbers.push(String(Math.floor(Math.random() * 90) + 10));
  }
  return `${prefix} ${numbers.join(' ')}`;
};

// Fonction pour générer un email
const generateEmail = (firstName, lastName) => {
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const variations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
    `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 99)}`
  ];
  const variation = variations[Math.floor(Math.random() * variations.length)];
  return `${variation}@${domain}`;
};

// Fonction pour générer une date aléatoire dans les 6 derniers mois
const generateRandomDate = () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
};

const generate100Clients = async () => {
  try {
    console.log('🌱 Démarrage de la génération de 100 clients pour Jean Dupont...');
    
    // Connexion à la base de données
    await connectDB();
    
    // Trouver l'utilisateur Jean Dupont
    console.log('🔍 Recherche de l\'utilisateur Jean Dupont...');
    const jeanDupont = await User.findOne({ 
      $or: [
        { email: 'jean.dupont@example.com' },
        { name: { $regex: /jean.*dupont/i } }
      ]
    });
    
    if (!jeanDupont) {
      console.log('❌ Utilisateur Jean Dupont non trouvé. Création en cours...');
      
      // Créer Jean Dupont s'il n'existe pas
      const hashedPassword = await bcrypt.hash('password123', 12);
      const newJeanDupont = new User({
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        password: hashedPassword
      });
      
      const savedUser = await newJeanDupont.save();
      console.log('✅ Utilisateur Jean Dupont créé avec succès');
      
      // Utiliser le nouvel utilisateur
      var userId = savedUser._id;
    } else {
      console.log('✅ Utilisateur Jean Dupont trouvé:', jeanDupont.name, '(' + jeanDupont.email + ')');
      var userId = jeanDupont._id;
    }
    
    // Supprimer les clients existants de Jean Dupont (optionnel)
    console.log('🧹 Suppression des clients existants de Jean Dupont...');
    const deletedCount = await Client.deleteMany({ userId: userId });
    console.log(`🗑️ ${deletedCount.deletedCount} clients existants supprimés`);
    
    // Générer 100 clients
    console.log('👥 Génération de 100 nouveaux clients...');
    const clients = [];
    const usedEmails = new Set();
    
    for (let i = 0; i < 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      // Générer un email unique
      let email;
      let attempts = 0;
      do {
        email = generateEmail(firstName, lastName);
        attempts++;
        if (attempts > 10) {
          // Si on n'arrive pas à générer un email unique, ajouter un timestamp
          email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@gmail.com`;
          break;
        }
      } while (usedEmails.has(email));
      
      usedEmails.add(email);
      
      const client = {
        name: `${firstName} ${lastName}`,
        email: email,
        phone: generatePhoneNumber(),
        company: Math.random() > 0.3 ? companies[Math.floor(Math.random() * companies.length)] : '', // 70% ont une entreprise
        notes: Math.random() > 0.4 ? sampleNotes[Math.floor(Math.random() * sampleNotes.length)] : '', // 60% ont des notes
        status: statuses[Math.floor(Math.random() * statuses.length)],
        userId: userId,
        createdAt: generateRandomDate(),
        updatedAt: generateRandomDate()
      };
      
      clients.push(client);
    }
    
    // Insérer tous les clients en une fois
    console.log('💾 Insertion des clients en base de données...');
    const insertedClients = await Client.insertMany(clients);
    
    console.log('🎉 Génération terminée avec succès !');
    console.log(`📊 Résumé:`);
    console.log(`   - Utilisateur: ${jeanDupont?.name || 'Jean Dupont'} (${jeanDupont?.email || 'jean.dupont@example.com'})`);
    console.log(`   - ${insertedClients.length} clients générés`);
    
    // Statistiques par statut
    const statusStats = {};
    insertedClients.forEach(client => {
      statusStats[client.status] = (statusStats[client.status] || 0) + 1;
    });
    
    console.log('📈 Répartition par statut:');
    Object.entries(statusStats).forEach(([status, count]) => {
      const emoji = status === 'nouveau' ? '🔵' : status === 'active' ? '🟢' : status === 'inactive' ? '🔴' : '🟡';
      console.log(`   ${emoji} ${status}: ${count} clients`);
    });
    
    console.log('');
    console.log('🔐 Informations de connexion:');
    console.log(`   📧 Email: ${jeanDupont?.email || 'jean.dupont@example.com'}`);
    console.log(`   🔑 Mot de passe: password123`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    process.exit(1);
  }
};

// Exécuter le script si appelé directement
if (require.main === module) {
  generate100Clients();
}

module.exports = generate100Clients;