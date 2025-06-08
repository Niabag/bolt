// models/devis.js
const mongoose = require("mongoose");

const devisSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  // ✅ NOUVEAU: Statut métier du devis
  status: { 
    type: String, 
    enum: ['nouveau', 'en_attente', 'fini', 'inactif'], 
    default: 'nouveau' 
  },
  tvaRate: Number,
  dateDevis: String,
  entrepriseName: String,
  entrepriseEmail: String,
  entreprisePhone: String,
  entrepriseAddress: String,
  entrepriseCity: String,
  logoUrl: { type: String }, // base64 ou URL
  articles: [
    {
      description: String,
      unitPrice: Number,
      quantity: Number,
      unit: String
    }
  ]
});

module.exports = mongoose.model("Devis", devisSchema);