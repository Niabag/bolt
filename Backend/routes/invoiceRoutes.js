const express = require("express");
const {
  createInvoice,
  getUserInvoices,
  getClientInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice
} = require("../controllers/invoiceController");
const authMiddleware = require("../middleware/auth");
const { checkSubscription } = require("../middleware/subscription");

const router = express.Router();

// 📌 Créer une facture (POST)
router.post("/", authMiddleware, checkSubscription, createInvoice);

// 📌 Récupérer toutes les factures de l'utilisateur (GET)
router.get("/", authMiddleware, checkSubscription, getUserInvoices);

// 📌 Récupérer les factures d'un client spécifique (GET)
router.get("/client/:clientId", authMiddleware, checkSubscription, getClientInvoices);

// 📌 Récupérer une facture par son ID (GET)
router.get("/:id", authMiddleware, checkSubscription, getInvoiceById);

// 📌 Mettre à jour une facture (PUT)
router.put("/:id", authMiddleware, checkSubscription, updateInvoice);

// 📌 Mettre à jour le statut d'une facture (PATCH)
router.patch("/:id/status", authMiddleware, checkSubscription, updateInvoiceStatus);

// 📌 Supprimer une facture (DELETE)
router.delete("/:id", authMiddleware, checkSubscription, deleteInvoice);

module.exports = router;