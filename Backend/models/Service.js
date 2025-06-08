import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Le nom du service est requis'],
    trim: true
  },
  duration: { 
    type: Number, 
    required: [true, 'La durée est requise'],
    min: [1, 'La durée doit être d\'au moins 1 minute']
  },
  price: { 
    type: Number, 
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  color: { 
    type: String, 
    required: [true, 'La couleur est requise'],
    match: [/^#[0-9A-F]{6}$/i, 'Format de couleur invalide (ex: #FF0000)']
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
serviceSchema.index({ name: 1 });

// Méthode virtuelle pour formater le prix
serviceSchema.virtual('formattedPrice').get(function() {
  return `${this.price}€`;
});

// Méthode virtuelle pour formater la durée
serviceSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}min`;
  }
});

export const Service = mongoose.model('Service', serviceSchema);