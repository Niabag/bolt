const express = require('express');
const Client = require('../models/client');
const { Service } = require('../models/Service.js');
const { Appointment } = require('../models/Appointment.js');
const authMiddleware = require('../middleware/auth');
const { checkSubscription } = require('../middleware/subscription');

const router = express.Router();

// Récupérer les statistiques du tableau de bord
router.get('/', authMiddleware, checkSubscription, async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const clientIds = await Client.find({ userId }).distinct('_id');

    const [
      totalClients,
      totalServices,
      totalAppointments,
      todayAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments
    ] = await Promise.all([
      Client.countDocuments({ userId }),
      Service.countDocuments(),
      Appointment.countDocuments({ clientId: { $in: clientIds } }),
      Appointment.countDocuments({
        clientId: { $in: clientIds },
        start: { $gte: today, $lt: tomorrow }
      }),
      Appointment.countDocuments({ clientId: { $in: clientIds }, status: 'confirmed' }),
      Appointment.countDocuments({ clientId: { $in: clientIds }, status: 'completed' }),
      Appointment.countDocuments({ clientId: { $in: clientIds }, status: 'cancelled' })
    ]);

    // Calculer le chiffre d'affaires des rendez-vous terminés pour cet utilisateur
    const completedAppointmentsWithServices = await Appointment.find({
      clientId: { $in: clientIds },
      status: 'completed'
    }).populate('serviceId', 'price');
    
    const totalRevenue = completedAppointmentsWithServices.reduce((sum, apt) => {
      return sum + (apt.serviceId?.price || 0);
    }, 0);

    // Calculer la moyenne de rendez-vous par jour (sur les 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAppointments = await Appointment.countDocuments({
      clientId: { $in: clientIds },
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
router.get('/period/:period', authMiddleware, checkSubscription, async (req, res) => {
  try {
    const { period } = req.params;
    const now = new Date();
    const userId = req.userId;
    const clientIds = await Client.find({ userId }).distinct('_id');
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
      clientId: { $in: clientIds },
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

module.exports = router;
