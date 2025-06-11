const express = require("express");
const {
  createDevis,
  getUserDevis,
  getClientDevis,
  updateDevis,
  updateDevisStatus, // ✅ NOUVEAU
  deleteDevis
} = require("../controllers/devisController");
const authMiddleware = require("../middleware/auth");
const { checkSubscription } = require("../middleware/subscription");

const router = express.Router();

// 📌 Créer un devis (POST)
router.post("/", authMiddleware, checkSubscription, createDevis);

// 📌 Voir tous les devis d'un utilisateur (GET)
router.get("/", authMiddleware, checkSubscription, getUserDevis);

// 📌 Voir les devis d'un client spécifique (GET)
router.get("/client/:clientId", authMiddleware, checkSubscription, getClientDevis);

// 📌 Modifier un devis existant (PUT)
router.put("/:id", authMiddleware, checkSubscription, updateDevis);

// 📌 ✅ NOUVEAU: Mettre à jour le statut d'un devis (PATCH)
router.patch("/:id/status", authMiddleware, checkSubscription, updateDevisStatus);

// 📌 Supprimer un devis (DELETE)
router.delete("/:id", authMiddleware, checkSubscription, deleteDevis);

module.exports = router;