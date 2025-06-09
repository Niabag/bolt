const express = require('express');
const {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByDate,
  getAppointmentsByClient
} = require('../controllers/appointmentController');

const router = express.Router();

// Routes pour les rendez-vous
router.get('/', getAllAppointments);
router.get('/date/:date', getAppointmentsByDate);
router.get('/client/:clientId', getAppointmentsByClient);
router.get('/:id', getAppointmentById);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

module.exports = router;
