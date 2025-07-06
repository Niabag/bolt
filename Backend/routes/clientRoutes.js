const express = require("express");
const {
  registerClient,
  getClients,
  deleteClient,
  updateClientStatus,
  updateClient,
  importClients
} = require("../controllers/clientController");
const authMiddleware = require("../middleware/auth");
const { checkSubscription, checkActiveSubscription } = require("../middleware/subscription");
const upload = require("../middleware/upload");

const router = express.Router();

// 📌 Un client peut s'enregistrer en passant un userId dans le lien
router.post("/register/:userId", registerClient);

// 📌 Un utilisateur connecté peut voir SES clients
router.get("/", authMiddleware, checkSubscription, getClients);

// 📌 ✅ NOUVEAU: Mettre à jour le statut d'un client
router.patch("/:id/status", authMiddleware, checkSubscription, updateClientStatus);

// 📌 ✅ NOUVEAU: Mettre à jour un client
router.put("/:id", authMiddleware, checkSubscription, updateClient);

// 📌 Importer des prospects depuis un fichier - NÉCESSITE UN ABONNEMENT ACTIF
router.post("/import", authMiddleware, checkActiveSubscription, upload.single("file"), importClients);

// 📌 Supprimer un client
router.delete("/:id", authMiddleware, checkSubscription, deleteClient);

module.exports = router;