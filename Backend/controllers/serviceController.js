import { Service } from '../models/Service.js';
import { Appointment } from '../models/Appointment.js';

// Récupérer tous les services
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des services' });
  }
};

// Récupérer un service par ID
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }
    res.json(service);
  } catch (error) {
    console.error('Erreur lors de la récupération du service:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du service' });
  }
};

// Créer un nouveau service
export const createService = async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ error: messages.join(', ') });
    } else {
      console.error('Erreur lors de la création du service:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la création du service' });
    }
  }
};

// Mettre à jour un service
export const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }
    res.json(service);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ error: messages.join(', ') });
    } else {
      console.error('Erreur lors de la mise à jour du service:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du service' });
    }
  }
};

// Supprimer un service
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }
    
    // Supprimer aussi tous les rendez-vous de ce service
    const deletedAppointments = await Appointment.deleteMany({ serviceId: req.params.id });
    
    res.json({ 
      message: 'Service supprimé avec succès',
      deletedService: service.name,
      deletedAppointments: deletedAppointments.deletedCount
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du service' });
  }
};

// Rechercher des services
export const searchServices = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Paramètre de recherche requis' });
    }

    const services = await Service.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    console.error('Erreur lors de la recherche de services:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la recherche' });
  }
};