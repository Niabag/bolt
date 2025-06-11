const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import des modèles
const User = require('../models/user');
const Client = require('../models/client');
const Devis = require('../models/devis');

// Configuration de la base de données
const connectDB = require('../config/database');

// Données de test
const fakeUsers = [
  {
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    password: "password123"
  },
  {
    name: "Marie Martin",
    email: "marie.martin@example.com", 
    password: "password123"
  }
];

const fakeClients = [
  {
    name: "Sophie Leblanc",
    email: "sophie.leblanc@gmail.com",
    phone: "06 12 34 56 78"
  },
  {
    name: "Pierre Moreau",
    email: "pierre.moreau@hotmail.fr",
    phone: "06 98 76 54 32"
  },
  {
    name: "Camille Rousseau",
    email: "camille.rousseau@yahoo.fr",
    phone: "07 11 22 33 44"
  },
  {
    name: "Lucas Bernard",
    email: "lucas.bernard@outlook.com",
    phone: "06 55 66 77 88"
  },
  {
    name: "Emma Petit",
    email: "emma.petit@free.fr",
    phone: "07 99 88 77 66"
  },
  {
    name: "Thomas Durand",
    email: "thomas.durand@orange.fr",
    phone: "06 44 33 22 11"
  },
  {
    name: "Léa Girard",
    email: "lea.girard@sfr.fr",
    phone: "07 77 66 55 44"
  },
  {
    name: "Hugo Roux",
    email: "hugo.roux@laposte.net",
    phone: "06 33 44 55 66"
  },
  {
    name: "Chloé Simon",
    email: "chloe.simon@gmail.com",
    phone: "07 22 33 44 55"
  },
  {
    name: "Antoine Michel",
    email: "antoine.michel@wanadoo.fr",
    phone: "06 66 77 88 99"
  }
];

const fakeDevis = [
  {
    title: "Site web vitrine",
    description: "Création d'un site web vitrine pour une entreprise",
    amount: 2500,
    dateDevis: "2024-01-15",
    dateValidite: "2024-02-15",
    tvaRate: 20,
    entrepriseName: "WebDev Pro",
    entrepriseAddress: "123 Avenue des Développeurs",
    entrepriseCity: "75001 Paris",
    entreprisePhone: "01 23 45 67 89",
    entrepriseEmail: "contact@webdevpro.fr",
    articles: [
      {
        description: "Conception graphique",
        unitPrice: 800,
        quantity: 1,
        unit: "forfait",
        tvaRate: "20"
      },
      {
        description: "Développement frontend",
        unitPrice: 1200,
        quantity: 1,
        unit: "forfait",
        tvaRate: "20"
      },
      {
        description: "Intégration CMS",
        unitPrice: 500,
        quantity: 1,
        unit: "forfait",
        tvaRate: "20"
      }
    ]
  },
  {
    title: "Application mobile",
    description: "Développement d'une application mobile iOS/Android",
    amount: 8500,
    dateDevis: "2024-01-20",
    dateValidite: "2024-03-20",
    tvaRate: 20,
    entrepriseName: "MobileDev Solutions",
    entrepriseAddress: "456 Rue des Applications",
    entrepriseCity: "69000 Lyon",
    entreprisePhone: "04 56 78 90 12",
    entrepriseEmail: "info@mobiledev.fr",
    articles: [
      {
        description: "Analyse et conception",
        unitPrice: 1500,
        quantity: 1,
        unit: "forfait",
        tvaRate: "20"
      },
      {
        description: "Développement iOS",
        unitPrice: 3500,
        quantity: 1,
        unit: "forfait",
        tvaRate: "20"
      },
      {
        description: "Développement Android",
        unitPrice: 3500,
        quantity: 1,
        unit: "forfait",
        tvaRate: "20"
      }
    ]
  },
  {
    title: "Refonte e-commerce",
    description: "Refonte complète d'une boutique en ligne",
    amount: 4200,
    dateDevis: "2024-01-25",
    dateValidite: "2024-02-25",
    tvaRate: 20,
    entrepriseName: "E-Commerce Expert",
    entrepriseAddress: "789 Boulevard du Commerce",
    entrepriseCity: "13000 Marseille",
    entreprisePhone: "04 91 23 45 67",
    entrepriseEmail: "contact@ecommerce-expert.fr",
    articles: [
      {
        description: "Audit de l'existant",
        unitPrice: 500,
        quantity: 1,
        unit: "jour",
        tvaRate: "20"
      },
      {
        description: "Nouveau design",
        unitPrice: 1200,
        quantity: 1,
        unit: "forfait",
        tvaRate: "20"
      },
      {
        description: "Migration des données",
        unitPrice: 800,
        quantity: 1,
        unit: "forfait",
        tvaRate: "20"
      },
      {
        description: "Tests et mise en ligne",
        unitPrice: 1700,
        quantity: 1,
        unit: "forfait",
        tvaRate: "20"
      }
    ]
  },
  {
    title: "Maintenance annuelle",
    description: "Contrat de maintenance pour site web",
    amount: 1800,
    dateDevis: "2024-02-01",
    dateValidite: "2024-03-01",
    tvaRate: 20,
    entrepriseName: "Support Web 24/7",
    entrepriseAddress: "321 Rue de la Maintenance",
    entrepriseCity: "33000 Bordeaux",
    entreprisePhone: "05 56 78 90 12",
    entrepriseEmail: "support@supportweb.fr",
    articles: [
      {
        description: "Maintenance mensuelle",
        unitPrice: 150,
        quantity: 12,
        unit: "mois",
        tvaRate: "20"
      }
    ]
  },
  {
    title: "Formation WordPress",
    description: "Formation à l'utilisation de WordPress",
    amount: 800,
    dateDevis: "2024-02-05",
    dateValidite: "2024-03-05",
    tvaRate: 20,
    entrepriseName: "Formation Digital",
    entrepriseAddress: "654 Avenue de la Formation",
    entrepriseCity: "59000 Lille",
    entreprisePhone: "03 20 12 34 56",
    entrepriseEmail: "formation@digital.fr",
    articles: [
      {
        description: "Formation WordPress niveau 1",
        unitPrice: 400,
        quantity: 2,
        unit: "jour",
        tvaRate: "20"
      }
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Démarrage du seeding de la base de données...');
    
    // Connexion à la base de données
    await connectDB();
    
    // Nettoyer les données existantes
    console.log('🧹 Nettoyage des données existantes...');
    await User.deleteMany({});
    await Client.deleteMany({});
    await Devis.deleteMany({});
    
    // Créer les utilisateurs
    console.log('👤 Création des utilisateurs...');
    const createdUsers = [];
    
    for (const userData of fakeUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword
      });
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Utilisateur créé: ${userData.name} (${userData.email})`);
    }
    
    // Créer les clients pour chaque utilisateur
    console.log('👥 Création des clients...');
    const createdClients = [];
    
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const clientsForUser = fakeClients.slice(i * 5, (i + 1) * 5); // 5 clients par utilisateur
      
      for (const clientData of clientsForUser) {
        const client = new Client({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          userId: user._id
        });
        const savedClient = await client.save();
        createdClients.push(savedClient);
        console.log(`✅ Client créé: ${clientData.name} pour ${user.name}`);
      }
    }
    
    // Créer les devis
    console.log('📄 Création des devis...');
    
    for (let i = 0; i < fakeDevis.length; i++) {
      const devisData = fakeDevis[i];
      const user = createdUsers[i % createdUsers.length];
      const userClients = createdClients.filter(c => c.userId.toString() === user._id.toString());
      const randomClient = userClients[Math.floor(Math.random() * userClients.length)];
      
      if (randomClient) {
        const devis = new Devis({
          ...devisData,
          userId: user._id,
          clientId: randomClient._id
        });
        await devis.save();
        console.log(`✅ Devis créé: ${devisData.title} pour ${randomClient.name}`);
      }
    }
    
    console.log('🎉 Seeding terminé avec succès !');
    console.log(`📊 Résumé:`);
    console.log(`   - ${createdUsers.length} utilisateurs créés`);
    console.log(`   - ${createdClients.length} clients créés`);
    console.log(`   - ${fakeDevis.length} devis créés`);
    console.log('');
    console.log('🔐 Comptes de test:');
    fakeUsers.forEach(user => {
      console.log(`   📧 ${user.email} / 🔑 ${user.password}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  }
};

// Exécuter le seeding si le script est appelé directement
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;