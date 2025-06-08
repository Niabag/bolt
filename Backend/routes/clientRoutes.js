const express = require("express");
const { 
  registerClient, 
  getClients, 
  deleteClient, 
  updateClientStatus, 
  updateClient 
} = require("../controllers/clientController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// 📌 Un client peut s'enregistrer en passant un userId dans le lien
router.post("/register/:userId", registerClient);

// 📌 Un utilisateur connecté peut voir SES clients
router.get("/", authMiddleware, getClients);

// 📌 ✅ NOUVEAU: Mettre à jour le statut d'un client
router.patch("/:id/status", authMiddleware, updateClientStatus);

// 📌 ✅ NOUVEAU: Mettre à jour un client
router.put("/:id", authMiddleware, updateClient);

// 📌 Supprimer un client
router.delete("/:id", authMiddleware, deleteClient);

module.exports = router;