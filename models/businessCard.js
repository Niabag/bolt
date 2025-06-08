const mongoose = require("mongoose");
// explain this file






// ✅ SCHÉMA CORRIGÉ: Définition plus flexible pour les actions
const actionSchema = new mongoose.Schema({
  id: { 
    type: Number, 
    required: true,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v > 0;
      },
      message: 'L\'ID doit être un nombre entier positif'
    }
  },
  type: { 
    type: String, 
    required: true,
    enum: {
      values: ['download', 'form', 'redirect', 'website'],
      message: 'Le type doit être: download, form, redirect ou website'
    }
  },
  file: { 
    type: String, 
    default: '',
    validate: {
      validator: function(v) {
        return typeof v === 'string';
      },
      message: 'Le fichier doit être une chaîne de caractères'
    }
  },
  url: { 
    type: String, 
    default: '',
    validate: {
      validator: function(v) {
        return typeof v === 'string';
      },
      message: 'L\'URL doit être une chaîne de caractères'
    }
  },
  delay: { 
    type: Number, 
    default: 0,
    min: [0, 'Le délai ne peut pas être négatif'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 0;
      },
      message: 'Le délai doit être un nombre entier positif ou zéro'
    }
  },
  active: { 
    type: Boolean, 
    default: true,
    validate: {
      validator: function(v) {
        return typeof v === 'boolean';
      },
      message: 'Active doit être un booléen'
    }
  }
}, { _id: false }); // ✅ Pas d'_id automatique pour les sous-documents

const businessCardSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, 'L\'ID utilisateur est requis'],
    unique: true // ✅ Un seul document par utilisateur
  },
  cardImage: { 
    type: String, // Base64 de l'image
    required: [true, 'L\'image de la carte est requise'],
    validate: {
      validator: function(v) {
        return typeof v === 'string' && v.length > 0;
      },
      message: 'L\'image de la carte doit être une chaîne non vide'
    }
  },
  cardConfig: {
    showQR: { 
      type: Boolean, 
      default: true,
      validate: {
        validator: function(v) {
          return typeof v === 'boolean';
        },
        message: 'showQR doit être un booléen'
      }
    },
    qrPosition: { 
      type: String, 
      default: 'bottom-right',
      enum: {
        values: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
        message: 'Position QR invalide'
      }
    },
    qrSize: { 
      type: Number, 
      default: 150, 
      min: [100, 'La taille minimale du QR est 100px'], 
      max: [200, 'La taille maximale du QR est 200px'],
      validate: {
        validator: function(v) {
          return Number.isInteger(v) && v >= 100 && v <= 200;
        },
        message: 'La taille du QR doit être un entier entre 100 et 200'
      }
    },
    actions: {
      type: [actionSchema], // ✅ Utilisation du schéma défini
      default: [],
      validate: {
        validator: function(v) {
          return Array.isArray(v);
        },
        message: 'Les actions doivent être un tableau'
      }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Index pour optimiser les requêtes
businessCardSchema.index({ userId: 1 });

// Middleware pour mettre à jour updatedAt
businessCardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ VALIDATION PERSONNALISÉE pour s'assurer que les actions sont correctes
businessCardSchema.pre('save', function(next) {
  if (this.cardConfig && this.cardConfig.actions) {
    // Vérifier que chaque action a un ID unique
    const ids = this.cardConfig.actions.map(action => action.id);
    const uniqueIds = [...new Set(ids)];
    
    if (ids.length !== uniqueIds.length) {
      return next(new Error('Les IDs des actions doivent être uniques'));
    }
    
    // Vérifier que chaque action a les champs requis
    for (let action of this.cardConfig.actions) {
      if (!action.type || !['download', 'form', 'redirect', 'website'].includes(action.type)) {
        return next(new Error(`Type d'action invalide: ${action.type}`));
      }
      
      if (typeof action.id !== 'number' || action.id <= 0) {
        return next(new Error(`ID d'action invalide: ${action.id}`));
      }
    }
  }
  
  next();
});

module.exports = mongoose.model("BusinessCard", businessCardSchema);