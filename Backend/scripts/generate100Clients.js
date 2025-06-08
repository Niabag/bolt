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

// ✅ NOUVEAU: Adresses françaises réalistes
const streets = [
  'Rue de la République', 'Avenue des Champs-Élysées', 'Boulevard Saint-Germain', 'Rue de Rivoli',
  'Place de la Bastille', 'Rue du Faubourg Saint-Antoine', 'Avenue de la Grande Armée', 'Rue de la Paix',
  'Boulevard Haussmann', 'Rue Saint-Honoré', 'Avenue Montaigne', 'Rue de Vaugirard',
  'Boulevard Voltaire', 'Rue de Belleville', 'Avenue Parmentier', 'Rue Oberkampf',
  'Boulevard de Ménilmontant', 'Rue de Charonne', 'Avenue de la République', 'Rue du Temple',
  'Boulevard Beaumarchais', 'Rue de Turbigo', 'Avenue de l\'Opéra', 'Rue de Châteaudun',
  'Boulevard des Italiens', 'Rue Lafayette', 'Avenue de Clichy', 'Rue de Rome',
  'Boulevard Malesherbes', 'Rue de la Boétie', 'Avenue Foch', 'Rue de Passy',
  'Boulevard Saint-Michel', 'Rue Mouffetard', 'Avenue des Gobelins', 'Rue de Tolbiac',
  'Boulevard de l\'Hôpital', 'Rue de Bercy', 'Avenue Daumesnil', 'Rue de Charenton'
];

const cities = [
  { name: 'Paris', postalCodes: ['75001', '75002', '75003', '75004', '75005', '75006', '75007', '75008', '75009', '75010'] },
  { name: 'Lyon', postalCodes: ['69001', '69002', '69003', '69004', '69005', '69006', '69007', '69008', '69009'] },
  { name: 'Marseille', postalCodes: ['13001', '13002', '13003', '13004', '13005', '13006', '13007', '13008'] },
  { name: 'Toulouse', postalCodes: ['31000', '31100', '31200', '31300', '31400', '31500'] },
  { name: 'Nice', postalCodes: ['06000', '06100', '06200', '06300'] },
  { name: 'Nantes', postalCodes: ['44000', '44100', '44200', '44300'] },
  { name: 'Montpellier', postalCodes: ['34000', '34070', '34080', '34090'] },
  { name: 'Strasbourg', postalCodes: ['67000', '67100', '67200'] },
  { name: 'Bordeaux', postalCodes: ['33000', '33100', '33200', '33300'] },
  { name: 'Lille', postalCodes: ['59000', '59100', '59200', '59300'] },
  { name: 'Rennes', postalCodes: ['35000', '35100', '35200'] },
  { name: 'Reims', postalCodes: ['51100', '51200'] },
  { name: 'Saint-Étienne', postalCodes: ['42000', '42100'] },
  { name: 'Toulon', postalCodes: ['83000', '83100', '83200'] },
  { name: 'Grenoble', postalCodes: ['38000', '38100'] },
  { name: 'Dijon', postalCodes: ['21000', '21100'] },
  { name: 'Angers', postalCodes: ['49000', '49100'] },
  { name: 'Nîmes', postalCodes: ['30000', '30900'] },
  { name: 'Villeurbanne', postalCodes: ['69100'] },
  { name: 'Aix-en-Provence', postalCodes: ['13100', '13090'] }
];

const domains = ['gmail.com', 'hotmail.fr', 'yahoo.fr', 'outlook.com', 'free.fr', 'orange.fr', 'sfr.fr', 'laposte.net', 'wanadoo.fr'];

// ✅ CORRECTION: Statuts valides selon le modèle (sans "pending")
const statuses = ['nouveau', 'active', 'inactive', 'en_attente'];

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

// ✅ NOUVELLE FONCTION: Générer une adresse française réaliste
const generateAddress = () => {
  const street = streets[Math.floor(Math.random() * streets.length)];
  const number = Math.floor(Math.random() * 200) + 1;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const postalCode = city.postalCodes[Math.floor(Math.random() * city.postalCodes.length)];
  
  return {
    address: `${number} ${street}`,
    postalCode: postalCode,
    city: city.name
  };
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
    let jeanDupont = await User.findOne({ 
      $or: [
        { email: 'jean.dupont@example.com' },
        { name: { $regex: /jean.*dupont/i } }
      ]
    });
    
    let userId;
    
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
      userId = savedUser._id;
      jeanDupont = savedUser;
    } else {
      console.log('✅ Utilisateur Jean Dupont trouvé:', jeanDupont.name, '(' + jeanDupont.email + ')');
      userId = jeanDupont._id;
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
      
      // ✅ NOUVEAU: Générer une adresse
      const addressData = generateAddress();
      
      const client = {
        name: `${firstName} ${lastName}`,
        email: email,
        phone: generatePhoneNumber(),
        company: Math.random() > 0.3 ? companies[Math.floor(Math.random() * companies.length)] : '', // 70% ont une entreprise
        notes: Math.random() > 0.4 ? sampleNotes[Math.floor(Math.random() * sampleNotes.length)] : '', // 60% ont des notes
        // ✅ NOUVEAUX CHAMPS: Adresse
        address: Math.random() > 0.2 ? addressData.address : '', // 80% ont une adresse
        postalCode: Math.random() > 0.2 ? addressData.postalCode : '', // 80% ont un code postal
        city: Math.random() > 0.2 ? addressData.city : '', // 80% ont une ville
        status: statuses[Math.floor(Math.random() * statuses.length)], // ✅ STATUTS VALIDES UNIQUEMENT
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
    console.log(`   - Utilisateur: ${jeanDupont.name} (${jeanDupont.email})`);
    console.log(`   - ${insertedClients.length} clients générés`);
    
    // Statistiques par statut
    const statusStats = {};
    insertedClients.forEach(client => {
      statusStats[client.status] = (statusStats[client.status] || 0) + 1;
    });
    
    console.log('📈 Répartition par statut:');
    Object.entries(statusStats).forEach(([status, count]) => {
      const emoji = status === 'nouveau' ? '🔵' : 
                   status === 'en_attente' ? '🟣' : 
                   status === 'active' ? '🟢' : 
                   status === 'inactive' ? '🔴' : '🟡';
      console.log(`   ${emoji} ${status}: ${count} clients`);
    });
    
    // ✅ NOUVEAU: Statistiques d'adresses
    const withAddress = insertedClients.filter(c => c.address).length;
    const withCity = insertedClients.filter(c => c.city).length;
    console.log('📍 Statistiques d\'adresses:');
    console.log(`   - ${withAddress} clients avec adresse complète`);
    console.log(`   - ${withCity} clients avec ville`);
    
    console.log('');
    console.log('🔐 Informations de connexion:');
    console.log(`   📧 Email: ${jeanDupont.email}`);
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