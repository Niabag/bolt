import express from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  searchServices
} from '../controllers/serviceController.js';

const router = express.Router();

// Routes pour les services
router.get('/', getAllServices);
router.get('/search', searchServices);
router.get('/:id', getServiceById);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

export default router;