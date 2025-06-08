const express = require("express");
const {
  saveBusinessCard,
  getBusinessCard,
  deleteBusinessCard,
  updateCardConfig
} = require("../controllers/businessCardController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// 📌 Sauvegarder/mettre à jour la carte de visite
router.post("/", authMiddleware, saveBusinessCard);

// 📌 Récupérer la carte de visite de l'utilisateur
router.get("/", authMiddleware, getBusinessCard);

// 📌 Mettre à jour seulement la configuration
router.patch("/config", authMiddleware, updateCardConfig);

// 📌 Supprimer la carte de visite
router.delete("/", authMiddleware, deleteBusinessCard);

module.exports = router;