const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'nouveau', 'en_attente'], // ✅ STATUTS FINAUX SIMPLIFIÉS
    default: 'nouveau'
  },
  company: { type: String },
  notes: { type: String },
  // ✅ NOUVEAUX CHAMPS: Adresse complète
  address: { type: String }, // Adresse (rue, numéro)
  postalCode: { type: String }, // Code postal
  city: { type: String }, // Ville
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware pour mettre à jour updatedAt
clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Client", clientSchema);