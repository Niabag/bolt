const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import des modèles
const User = require('../models/user');
const Client = require('../models/client');
const Devis = require('../models/devis');
const BusinessCard = require('../models/businessCard');

// Configuration de la base de données
const connectDB = require('../config/database');

// Données pour générer des clients variés
const firstNames = [
  'Alexandre', 'Isabelle', 'Julien', 'Nathalie', 'Sébastien', 'Valérie', 'Maxime', 'Caroline',
  'Thomas', 'Sophie', 'Nicolas', 'Marie', 'Pierre', 'Camille', 'Lucas', 'Emma', 'Hugo', 'Chloé',
  'Antoine', 'Léa', 'Mathieu', 'Sarah', 'Romain', 'Laura', 'Florian'
];

const lastNames = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
  'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
  'Morel', 'Girard', 'Andre', 'Lefevre', 'Mercier'
];

const companies = [
  'Tech Solutions', 'Digital Agency', 'Innovation Lab', 'Creative Studio', 'Consulting Pro',
  'Web Factory', 'Design House', 'Marketing Plus', 'Business Center', 'Service Express',
  'Quality First', 'Expert Conseil', 'Pro Services', 'Elite Solutions', 'Smart Business',
  'Dynamic Group', 'Success Partners', 'Prime Consulting', 'Alpha Solutions', 'Beta Services',
  'Gamma Tech', 'Delta Digital', 'Epsilon Design', 'Zeta Marketing', 'Eta Consulting'
];

// Adresses françaises réalistes
const streets = [
  'Rue de la République', 'Avenue des Champs-Élysées', 'Boulevard Saint-Germain', 'Rue de Rivoli',
  'Place de la Bastille', 'Rue du Faubourg Saint-Antoine', 'Avenue de la Grande Armée', 'Rue de la Paix',
  'Boulevard Haussmann', 'Rue Saint-Honoré', 'Avenue Montaigne', 'Rue de Vaugirard',
  'Boulevard Voltaire', 'Rue de Belleville', 'Avenue Parmentier', 'Rue Oberkampf',
  'Boulevard de Ménilmontant', 'Rue de Charonne', 'Avenue de la République', 'Rue du Temple',
  'Boulevard Beaumarchais', 'Rue de Turbigo', 'Avenue de l\'Opéra', 'Rue de Châteaudun',
  'Boulevard des Italiens'
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
  { name: 'Lille', postalCodes: ['59000', '59100', '59200', '59300'] }
];

const domains = ['gmail.com', 'hotmail.fr', 'yahoo.fr', 'outlook.com', 'free.fr', 'orange.fr', 'sfr.fr', 'laposte.net', 'wanadoo.fr'];

const statuses = ['nouveau', 'en_attente', 'active', 'inactive'];

const sampleNotes = [
  'Intéressé par un site e-commerce',
  'Souhaite une application mobile',
  'Besoin d\'un site vitrine professionnel',
  'Demande de devis pour refonte de site',
  'Contact suite au salon professionnel',
  'Recommandé par Marie Dupont',
  'Projet de développement à discuter',
  'Rendez-vous à programmer',
  'Relancer en septembre',
  'Envoi documentation effectué',
  'Attente de validation budget',
  'Projet reporté à Q3',
  'Demande de fonctionnalités spécifiques',
  'Besoin urgent - priorité haute',
  'Ancien client - fidélisation'
];

// Titres de devis réalistes
const devisTitles = [
  'Site vitrine responsive',
  'Application mobile iOS/Android',
  'Refonte site e-commerce',
  'Maintenance annuelle',
  'Développement API REST',
  'Intégration CRM',
  'Optimisation SEO',
  'Campagne marketing digital',
  'Création identité visuelle',
  'Développement module spécifique',
  'Migration WordPress',
  'Audit de sécurité',
  'Formation équipe technique',
  'Développement intranet',
  'Création landing page'
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

// Fonction pour générer une adresse française réaliste
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

// Fonction pour générer un devis aléatoire
const generateRandomDevis = (clientId, userId) => {
  const title = devisTitles[Math.floor(Math.random() * devisTitles.length)];
  const dateDevis = generateRandomDate();
  
  // Date de validité (30 jours après la date du devis)
  const dateValidite = new Date(dateDevis);
  dateValidite.setDate(dateValidite.getDate() + 30);
  
  // Générer entre 1 et 4 articles
  const articlesCount = Math.floor(Math.random() * 4) + 1;
  const articles = [];
  
  const articleDescriptions = [
    'Conception graphique',
    'Développement frontend',
    'Développement backend',
    'Intégration CMS',
    'Développement API',
    'Tests et déploiement',
    'Formation utilisateurs',
    'Maintenance préventive',
    'Optimisation performances',
    'Mise en place analytics',
    'Création contenu',
    'Référencement SEO',
    'Intégration réseaux sociaux',
    'Mise en place e-commerce',
    'Développement fonctionnalités spécifiques'
  ];
  
  const units = ['forfait', 'jour', 'heure', 'page', 'module'];
  const tvaRates = ['20', '10', '5.5'];
  
  for (let i = 0; i < articlesCount; i++) {
    const description = articleDescriptions[Math.floor(Math.random() * articleDescriptions.length)];
    const unitPrice = Math.floor(Math.random() * 1500) + 300; // Entre 300 et 1800€
    const quantity = Math.floor(Math.random() * 5) + 1; // Entre 1 et 5
    const unit = units[Math.floor(Math.random() * units.length)];
    const tvaRate = tvaRates[Math.floor(Math.random() * tvaRates.length)];
    
    articles.push({
      description,
      unitPrice,
      quantity,
      unit,
      tvaRate
    });
  }
  
  // Calculer le montant total
  const amount = articles.reduce((sum, article) => sum + (article.unitPrice * article.quantity), 0);
  
  // Statut du devis
  const statusOptions = ['nouveau', 'en_attente', 'fini', 'inactif'];
  const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
  
  return {
    title,
    description: `Devis pour ${title}`,
    amount,
    clientId,
    userId,
    dateDevis: dateDevis.toISOString().split('T')[0],
    dateValidite: dateValidite.toISOString().split('T')[0],
    tvaRate: 20,
    entrepriseName: "CRM Pro Services",
    entrepriseAddress: "123 Avenue des Développeurs",
    entrepriseCity: "75001 Paris",
    entreprisePhone: "01 23 45 67 89",
    entrepriseEmail: "contact@crmpro.com",
    articles,
    status
  };
};

// Fonction pour générer une carte de visite
const generateBusinessCard = (userId) => {
  // Image de carte de visite par défaut (base64 tronqué pour l'exemple)
  const defaultCardImage = '/images/modern-business-card-design-template-42551612346d5b08984f0b61a8044609_screen.jpg';
  
  // Configuration de la carte
  const cardConfig = {
    showQR: true,
    qrPosition: ['bottom-right', 'bottom-left', 'top-right', 'top-left'][Math.floor(Math.random() * 4)],
    qrSize: Math.floor(Math.random() * 50) + 100, // Entre 100 et 150
    actions: [
      {
        id: Date.now(),
        type: 'website',
        url: 'https://www.example.com',
        delay: 1000,
        active: true
      },
      {
        id: Date.now() + 1,
        type: 'form',
        delay: 2000,
        active: true
      }
    ]
  };
  
  return {
    userId,
    cardImage: defaultCardImage,
    cardConfig
  };
};

const generate25Contacts = async () => {
  try {
    console.log('🚀 Génération de 25 utilisateurs de test...');
    
    // Connexion à la base de données
    await connectDB();
    
    // Créer un utilisateur admin
    const adminPassword = 'password123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    let adminUser = await User.findOne({ email: 'admin@crmpro.com' });
    
    if (!adminUser) {
      adminUser = new User({
        name: 'Admin CRM',
        email: 'admin@crmpro.com',
        password: hashedPassword
      });
      
      await adminUser.save();
      console.log('✅ Utilisateur créé: admin@crmpro.com');
    } else {
      console.log('ℹ️ Utilisateur admin@crmpro.com existe déjà');
    }
    
    // Supprimer les clients existants de l'admin
    await Client.deleteMany({ userId: adminUser._id });
    await Devis.deleteMany({ userId: adminUser._id });
    await BusinessCard.deleteMany({ userId: adminUser._id });
    
    // Générer une carte de visite pour l'admin
    const businessCard = new BusinessCard(generateBusinessCard(adminUser._id));
    await businessCard.save();
    console.log('✅ Carte de visite créée pour: admin@crmpro.com');
    
    // Générer 25 clients
    const clients = [];
    const usedEmails = new Set();
    
    for (let i = 0; i < 25; i++) {
      const firstName = firstNames[i];
      const lastName = lastNames[i];
      
      // Générer un email unique
      let email;
      let attempts = 0;
      do {
        email = generateEmail(firstName, lastName);
        attempts++;
        if (attempts > 10) {
          email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@gmail.com`;
          break;
        }
      } while (usedEmails.has(email));
      
      usedEmails.add(email);
      
      // Générer une adresse
      const addressData = generateAddress();
      
      // Déterminer si le client a une entreprise
      const hasCompany = Math.random() > 0.3;
      
      const client = new Client({
        name: `${firstName} ${lastName}`,
        email: email,
        phone: generatePhoneNumber(),
        company: hasCompany ? companies[Math.floor(Math.random() * companies.length)] : '',
        notes: Math.random() > 0.4 ? sampleNotes[Math.floor(Math.random() * sampleNotes.length)] : '',
        address: addressData.address,
        postalCode: addressData.postalCode,
        city: addressData.city,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        userId: adminUser._id,
        createdAt: generateRandomDate(),
        updatedAt: generateRandomDate()
      });
      
      const savedClient = await client.save();
      clients.push(savedClient);
      console.log(`✅ Client créé: ${email}`);
      
      // Générer entre 0 et 3 devis pour chaque client
      const devisCount = Math.floor(Math.random() * 4);
      
      for (let j = 0; j < devisCount; j++) {
        const devisData = generateRandomDevis(savedClient._id, adminUser._id);
        const devis = new Devis(devisData);
        await devis.save();
        console.log(`✅ Devis créé pour: ${firstName} ${lastName}`);
      }
    }
    
    // Statistiques
    const statusStats = {};
    clients.forEach(client => {
      statusStats[client.status] = (statusStats[client.status] || 0) + 1;
    });
    
    const devisCount = await Devis.countDocuments({ userId: adminUser._id });
    
    console.log('🎉 Génération terminée ! 25 utilisateurs créés avec succès.');
    console.log('📊 Statistiques:');
    console.log(`   - 25 clients créés`);
    console.log(`   - ${devisCount} devis créés`);
    console.log('📈 Répartition par statut:');
    
    Object.entries(statusStats).forEach(([status, count]) => {
      const emoji = status === 'nouveau' ? '🔵' : 
                   status === 'en_attente' ? '🟣' : 
                   status === 'active' ? '🟢' : '🔴';
      console.log(`   ${emoji} ${status}: ${count} clients`);
    });
    
    console.log('');
    console.log('🔐 Informations de connexion:');
    console.log(`   📧 Email: admin@crmpro.com`);
    console.log(`   🔑 Mot de passe: password123`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    process.exit(1);
  }
};

// Exécuter le script si appelé directement
if (require.main === module) {
  generate25Contacts();
}

module.exports = generate25Contacts;