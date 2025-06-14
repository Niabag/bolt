const express = require("express");
const {
  createDevis,
  getUserDevis,
  getClientDevis,
  getDevisById,
  getPublicDevis,
  updateDevis,
  updateDevisStatus, // ✅ NOUVEAU
  deleteDevis,
  sendDevisByEmail
} = require("../controllers/devisController");
const authMiddleware = require("../middleware/auth");
const { checkSubscription } = require("../middleware/subscription");

const router = express.Router();

// 📌 Route publique pour récupérer un devis sans authentification
router.get("/public/:id", getPublicDevis);

// 📌 Créer un devis (POST)
router.post("/", authMiddleware, checkSubscription, createDevis);

// 📌 Voir tous les devis d'un utilisateur (GET)
router.get("/", authMiddleware, checkSubscription, getUserDevis);

// 📌 Voir les devis d'un client spécifique (GET)
router.get("/client/:clientId", authMiddleware, checkSubscription, getClientDevis);

// 📌 Récupérer un devis par son ID
router.get("/:id", authMiddleware, checkSubscription, getDevisById);

// 📌 Modifier un devis existant (PUT)
router.put("/:id", authMiddleware, checkSubscription, updateDevis);

// 📌 ✅ NOUVEAU: Mettre à jour le statut d'un devis (PATCH)
router.patch("/:id/status", authMiddleware, checkSubscription, updateDevisStatus);

// 📌 Envoyer un devis par email
router.post("/:id/send", authMiddleware, checkSubscription, sendDevisByEmail);

// 📌 Supprimer un devis (DELETE)
router.delete("/:id", authMiddleware, checkSubscription, deleteDevis);

module.exports = router;