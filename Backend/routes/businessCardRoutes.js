const express = require("express");
const {
  saveBusinessCard,
  getBusinessCard,
  deleteBusinessCard,
  updateCardConfig,
  getPublicBusinessCard, // ✅ NOUVEAU: Importer la nouvelle fonction
  trackCardView,         // ✅ NOUVEAU: Importer la fonction de suivi
  getCardStats           // ✅ NOUVEAU: Importer la fonction de statistiques
} = require("../controllers/businessCardController");
const authMiddleware = require("../middleware/auth");
const { checkSubscription } = require("../middleware/subscription");

const router = express.Router();

// 📌 Route publique pour récupérer la carte de visite par userId (sans authentification)
router.get("/public/:userId", getPublicBusinessCard); // ✅ NOUVEAU

// 📌 Route pour suivre les vues de la carte (sans authentification)
router.post("/track-view/:userId", trackCardView); // ✅ NOUVEAU

// 📌 Route pour obtenir les statistiques de la carte
router.get("/stats/:userId", authMiddleware, checkSubscription, getCardStats); // ✅ NOUVEAU

// 📌 Sauvegarder/mettre à jour la carte de visite
router.post("/", authMiddleware, checkSubscription, saveBusinessCard);

// 📌 Récupérer la carte de visite de l'utilisateur authentifié
router.get("/", authMiddleware, checkSubscription, getBusinessCard);

// 📌 Mettre à jour seulement la configuration
router.patch("/config", authMiddleware, checkSubscription, updateCardConfig);

// 📌 Supprimer la carte de visite
router.delete("/", authMiddleware, checkSubscription, deleteBusinessCard);

module.exports = router;