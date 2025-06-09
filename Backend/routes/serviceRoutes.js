const express = require('express');
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  searchServices
} = require('../controllers/serviceController');

const router = express.Router();

// Routes pour les services
router.get('/', getAllServices);
router.get('/search', searchServices);
router.get('/:id', getServiceById);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

module.exports = router;
