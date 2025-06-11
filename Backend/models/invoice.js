const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { 
    type: String, 
    required: true,
    unique: true
  },
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Client", 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  devisIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Devis" 
  }],
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'paid', 'overdue', 'canceled'],
    default: 'draft'
  },
  dueDate: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  notes: String,
  paymentTerms: {
    type: String,
    default: '30'
  },
  discount: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 20
  },
  entrepriseName: String,
  entrepriseAddress: String,
  entrepriseCity: String,
  entreprisePhone: String,
  entrepriseEmail: String,
  logoUrl: String
});

// Index pour améliorer les performances des requêtes
invoiceSchema.index({ userId: 1 });
invoiceSchema.index({ clientId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);