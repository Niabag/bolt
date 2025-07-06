import express from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  searchServices
} from '../controllers/serviceController.js';
import authMiddleware from '../middleware/auth.js';
import { checkSubscription } from '../middleware/subscription.js';

const router = express.Router();

// Routes pour les services
router.get('/', authMiddleware, checkSubscription, getAllServices);
router.get('/search', authMiddleware, checkSubscription, searchServices);
router.get('/:id', authMiddleware, checkSubscription, getServiceById);
router.post('/', authMiddleware, checkSubscription, createService);
router.put('/:id', authMiddleware, checkSubscription, updateService);
router.delete('/:id', authMiddleware, checkSubscription, deleteService);

export default router;