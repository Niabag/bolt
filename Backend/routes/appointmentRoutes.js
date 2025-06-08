import express from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByDate,
  getAppointmentsByClient
} from '../controllers/appointmentController.js';

const router = express.Router();

// Routes pour les rendez-vous
router.get('/', getAllAppointments);
router.get('/date/:date', getAppointmentsByDate);
router.get('/client/:clientId', getAppointmentsByClient);
router.get('/:id', getAppointmentById);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;