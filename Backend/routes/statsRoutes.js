import express from 'express';
import { Client } from '../models/Client.js';
import { Service } from '../models/Service.js';
import { Appointment } from '../models/Appointment.js';

const router = express.Router();

// Récupérer les statistiques du tableau de bord
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalClients,
      totalServices,
      totalAppointments,
      todayAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments
    ] = await Promise.all([
      Client.countDocuments(),
      Service.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ 
        start: { $gte: today, $lt: tomorrow } 
      }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' })
    ]);

    // Calculer le chiffre d'affaires des rendez-vous terminés
    const completedAppointmentsWithServices = await Appointment.find({ 
      status: 'completed' 
    }).populate('serviceId', 'price');
    
    const totalRevenue = completedAppointmentsWithServices.reduce((sum, apt) => {
      return sum + (apt.serviceId?.price || 0);
    }, 0);

    // Calculer la moyenne de rendez-vous par jour (sur les 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAppointments = await Appointment.countDocuments({
      start: { $gte: thirtyDaysAgo }
    });
    
    const avgAppointmentsPerDay = Math.round((recentAppointments / 30) * 10) / 10;

    res.json({
      totalClients,
      totalServices,
      totalAppointments,
      todayAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      totalRevenue,
      avgAppointmentsPerDay
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques' });
  }
});

// Statistiques par période
router.get('/period/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return res.status(400).json({ error: 'Période invalide (week, month, year)' });
    }

    const appointments = await Appointment.find({
      start: { $gte: startDate, $lte: now }
    }).populate('serviceId', 'price');

    const revenue = appointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.serviceId?.price || 0), 0);

    const stats = {
      period,
      startDate,
      endDate: now,
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
      cancelledAppointments: appointments.filter(apt => apt.status === 'cancelled').length,
      revenue
    };

    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques par période:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;