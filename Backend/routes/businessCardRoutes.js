const express = require("express");
const {
  saveBusinessCard,
  getBusinessCard,
  deleteBusinessCard,
  updateCardConfig,
  getPublicBusinessCard // ✅ NOUVEAU: Importer la nouvelle fonction
} = require("../controllers/businessCardController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// 📌 Route publique pour récupérer la carte de visite par userId (sans authentification)
router.get("/public/:userId", getPublicBusinessCard); // ✅ NOUVEAU

// 📌 Sauvegarder/mettre à jour la carte de visite
router.post("/", authMiddleware, saveBusinessCard);

// 📌 Récupérer la carte de visite de l'utilisateur authentifié
router.get("/", authMiddleware, getBusinessCard);

// 📌 Mettre à jour seulement la configuration
router.patch("/config", authMiddleware, updateCardConfig);

// 📌 Supprimer la carte de visite
router.delete("/", authMiddleware, deleteBusinessCard);

module.exports = router;

