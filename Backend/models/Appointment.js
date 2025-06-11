import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: [true, 'Le client est requis']
  },
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: [true, 'Le service est requis']
  },
  title: { 
    type: String, 
    required: [true, 'Le titre est requis'],
    trim: true
  },
  start: { 
    type: Date, 
    required: [true, 'L\'heure de début est requise']
  },
  end: { 
    type: Date, 
    required: [true, 'L\'heure de fin est requise']
  },
  status: { 
    type: String, 
    enum: {
      values: ['scheduled', 'confirmed', 'completed', 'cancelled'],
      message: 'Statut invalide'
    },
    default: 'scheduled' 
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
appointmentSchema.index({ start: 1 });
appointmentSchema.index({ clientId: 1 });
appointmentSchema.index({ serviceId: 1 });
appointmentSchema.index({ status: 1 });

// Validation personnalisée pour s'assurer que l'heure de fin est après l'heure de début
appointmentSchema.pre('save', function(next) {
  if (this.start && this.end && this.start >= this.end) {
    next(new Error('L\'heure de fin doit être après l\'heure de début'));
  } else {
    next();
  }
});

// Méthode virtuelle pour calculer la durée
appointmentSchema.virtual('duration').get(function() {
  if (this.start && this.end) {
    return Math.round((this.end - this.start) / (1000 * 60)); // en minutes
  }
  return 0;
});

// Méthode virtuelle pour formater la date
appointmentSchema.virtual('formattedDate').get(function() {
  if (this.start) {
    return this.start.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return '';
});

// Méthode virtuelle pour formater l'heure
appointmentSchema.virtual('formattedTime').get(function() {
  if (this.start && this.end) {
    const startTime = this.start.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const endTime = this.end.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${startTime} - ${endTime}`;
  }
  return '';
});

export const Appointment = mongoose.model('Appointment', appointmentSchema);