import { Appointment } from '../models/Appointment.js';
import { Client } from '../models/Client.js';
import { Service } from '../models/Service.js';

// Récupérer tous les rendez-vous
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('clientId', 'name email phone')
      .populate('serviceId', 'name duration price color')
      .sort({ start: 1 });
    res.json(appointments);
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des rendez-vous' });
  }
};

// Récupérer un rendez-vous par ID
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('clientId', 'name email phone')
      .populate('serviceId', 'name duration price color');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }
    res.json(appointment);
  } catch (error) {
    console.error('Erreur lors de la récupération du rendez-vous:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du rendez-vous' });
  }
};

// Créer un nouveau rendez-vous
export const createAppointment = async (req, res) => {
  try {
    // Vérifier que le client et le service existent
    const [client, service] = await Promise.all([
      Client.findById(req.body.clientId),
      Service.findById(req.body.serviceId)
    ]);

    if (!client) {
      return res.status(400).json({ error: 'Client non trouvé' });
    }
    if (!service) {
      return res.status(400).json({ error: 'Service non trouvé' });
    }

    const appointment = new Appointment(req.body);
    await appointment.save();
    
    // Populer les données pour la réponse
    await appointment.populate('clientId', 'name email phone');
    await appointment.populate('serviceId', 'name duration price color');
    
    res.status(201).json(appointment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ error: messages.join(', ') });
    } else {
      console.error('Erreur lors de la création du rendez-vous:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la création du rendez-vous' });
    }
  }
};

// Mettre à jour un rendez-vous
export const updateAppointment = async (req, res) => {
  try {
    // Si clientId ou serviceId sont modifiés, vérifier qu'ils existent
    if (req.body.clientId) {
      const client = await Client.findById(req.body.clientId);
      if (!client) {
        return res.status(400).json({ error: 'Client non trouvé' });
      }
    }
    if (req.body.serviceId) {
      const service = await Service.findById(req.body.serviceId);
      if (!service) {
        return res.status(400).json({ error: 'Service non trouvé' });
      }
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('clientId', 'name email phone')
    .populate('serviceId', 'name duration price color');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }
    res.json(appointment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ error: messages.join(', ') });
    } else {
      console.error('Erreur lors de la mise à jour du rendez-vous:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du rendez-vous' });
    }
  }
};

// Supprimer un rendez-vous
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }
    res.json({ 
      message: 'Rendez-vous supprimé avec succès',
      deletedAppointment: appointment.title
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du rendez-vous:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du rendez-vous' });
  }
};

// Récupérer les rendez-vous par date
export const getAppointmentsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const appointments = await Appointment.find({
      start: {
        $gte: startDate,
        $lt: endDate
      }
    })
    .populate('clientId', 'name email phone')
    .populate('serviceId', 'name duration price color')
    .sort({ start: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous par date:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des rendez-vous' });
  }
};

// Récupérer les rendez-vous par client
export const getAppointmentsByClient = async (req, res) => {
  try {
    const appointments = await Appointment.find({ clientId: req.params.clientId })
      .populate('clientId', 'name email phone')
      .populate('serviceId', 'name duration price color')
      .sort({ start: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous du client:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des rendez-vous' });
  }
};