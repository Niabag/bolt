const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://Gabain:&PcZynGvoBILr1836@cluster0.f0dujm4.mongodb.net/';
    
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