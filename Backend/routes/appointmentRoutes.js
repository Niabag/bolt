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
import authMiddleware from '../middleware/auth.js';
import { checkSubscription } from '../middleware/subscription.js';

const router = express.Router();

// Routes pour les rendez-vous
router.get('/', authMiddleware, checkSubscription, getAllAppointments);
router.get('/date/:date', authMiddleware, checkSubscription, getAppointmentsByDate);
router.get('/client/:clientId', authMiddleware, checkSubscription, getAppointmentsByClient);
router.get('/:id', authMiddleware, checkSubscription, getAppointmentById);
router.post('/', authMiddleware, checkSubscription, createAppointment);
router.put('/:id', authMiddleware, checkSubscription, updateAppointment);
router.delete('/:id', authMiddleware, checkSubscription, deleteAppointment);

export default router;