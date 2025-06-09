const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/crm-database';
    
    console.log('🔍 Tentative de connexion à MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connexion à MongoDB réussie !');
  } catch (error) {
    console.error('❌ Connexion à MongoDB échouée :', error);
    process.exit(1);
  }
};

module.exports = connectDB;