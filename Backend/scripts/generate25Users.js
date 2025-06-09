const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import des modèles
const User = require('../models/user');

// Configuration de la base de données
const connectDB = require('../config/database');

// Données pour générer des utilisateurs variés
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

const domains = ['gmail.com', 'hotmail.fr', 'yahoo.fr', 'outlook.com', 'free.fr', 'orange.fr', 'sfr.fr', 'laposte.net', 'wanadoo.fr'];

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

// Fonction pour générer un mot de passe aléatoire
const generatePassword = () => {
  const length = 8;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const generate25Users = async () => {
  try {
    console.log('🌱 Démarrage de la génération de 25 utilisateurs...');
    
    // Connexion à la base de données
    await connectDB();
    
    // Générer 25 utilisateurs
    console.log('👤 Génération de 25 nouveaux utilisateurs...');
    const users = [];
    const usedEmails = new Set();
    const userCredentials = [];
    
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
          // Si on n'arrive pas à générer un email unique, ajouter un timestamp
          email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@gmail.com`;
          break;
        }
      } while (usedEmails.has(email));
      
      usedEmails.add(email);
      
      // Générer un mot de passe ou utiliser un mot de passe fixe
      const password = "Password123"; // Mot de passe fixe pour faciliter les tests
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const user = new User({
        name: `${firstName} ${lastName}`,
        email: email,
        password: hashedPassword
      });
      
      userCredentials.push({
        name: `${firstName} ${lastName}`,
        email: email,
        password: password
      });
      
      users.push(user);
    }
    
    // Sauvegarder tous les utilisateurs
    console.log('💾 Sauvegarde des utilisateurs en base de données...');
    const savedUsers = await Promise.all(users.map(user => user.save()));
    
    console.log('🎉 Génération terminée avec succès !');
    console.log(`📊 ${savedUsers.length} utilisateurs créés`);
    
    console.log('\n📋 Liste des comptes créés:');
    console.log('┌─────────────────────────────────────────────────────────────────────────┐');
    console.log('│ Nom                  │ Email                          │ Mot de passe    │');
    console.log('├─────────────────────────────────────────────────────────────────────────┤');
    
    userCredentials.forEach(user => {
      const nameCol = user.name.padEnd(20);
      const emailCol = user.email.padEnd(30);
      const passwordCol = user.password.padEnd(15);
      console.log(`│ ${nameCol} │ ${emailCol} │ ${passwordCol} │`);
    });
    
    console.log('└─────────────────────────────────────────────────────────────────────────┘');
    console.log('\n✅ Vous pouvez maintenant vous connecter avec n\'importe lequel de ces comptes.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération des utilisateurs:', error);
    process.exit(1);
  }
};

// Exécuter le script si appelé directement
if (require.main === module) {
  generate25Users();
}

module.exports = generate25Users;