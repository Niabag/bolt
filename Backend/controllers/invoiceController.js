const Invoice = require("../models/invoice");
const Devis = require("../models/devis");
const Client = require("../models/client");
const { sendEmail } = require("../utils/emailSender");

// ✅ Créer une nouvelle facture
exports.createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      clientId,
      devisIds = [],
      amount,
      status = 'draft',
      dueDate,
      notes,
      paymentTerms,
      discount,
      taxRate,
      entrepriseName,
      entrepriseAddress,
      entrepriseCity,
      entreprisePhone,
      entrepriseEmail,
      logoUrl
    } = req.body;

    const userId = req.userId;

    // Vérifier que le client existe et appartient à l'utilisateur
    const client = await Client.findOne({ _id: clientId, userId });
    if (!client) {
      return res.status(404).json({ message: "Client introuvable ou non autorisé" });
    }

    // Vérifier que les devis existent et appartiennent à l'utilisateur
    if (devisIds.length > 0) {
      const devisCount = await Devis.countDocuments({ 
        _id: { $in: devisIds }, 
        userId 
      });
      
      if (devisCount !== devisIds.length) {
        return res.status(400).json({ message: "Un ou plusieurs devis sont introuvables ou non autorisés" });
      }
    }

    // Créer la facture
    const newInvoice = new Invoice({
      invoiceNumber,
      clientId,
      userId,
      devisIds,
      amount,
      status,
      dueDate,
      notes,
      paymentTerms,
      discount,
      taxRate,
      entrepriseName,
      entrepriseAddress,
      entrepriseCity,
      entreprisePhone,
      entrepriseEmail,
      logoUrl
    });

    await newInvoice.save();

    // ✅ NOUVEAU: Envoyer une notification en temps réel
    const io = req.app.get("io");
    if (io) {
      io.to(`user-${userId}`).emit("notification", {
        type: "invoice",
        category: "invoice_created",
        title: "Nouvelle facture créée",
        message: `Facture ${invoiceNumber} créée pour ${client.name}`,
        details: `Montant: ${amount} € • Échéance: ${new Date(dueDate).toLocaleDateString('fr-FR')}`,
        date: new Date(),
        read: false,
        invoiceId: newInvoice._id,
        invoiceNumber: invoiceNumber,
        clientName: client.name
      });
      console.log(`✅ Notification de création de facture envoyée à l'utilisateur ${userId}`);
    }

    res.status(201).json({ 
      message: "✅ Facture créée avec succès", 
      invoice: newInvoice 
    });
  } catch (error) {
    console.error("❌ Erreur création facture:", error);
    
    // Gestion des erreurs de duplication
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Une facture avec ce numéro existe déjà" 
      });
    }
    
    res.status(500).json({ 
      message: "Erreur lors de la création de la facture", 
      error: error.message 
    });
  }
};

// ✅ Récupérer toutes les factures de l'utilisateur
exports.getUserInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("clientId", "name email phone");
    
    res.json(invoices);
  } catch (error) {
    console.error("❌ Erreur récupération factures:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des factures", 
      error: error.message 
    });
  }
};

// ✅ Récupérer les factures d'un client spécifique
exports.getClientInvoices = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Vérifier que le client appartient à l'utilisateur
    const client = await Client.findOne({ _id: clientId, userId: req.userId });
    if (!client) {
      return res.status(404).json({ message: "Client introuvable ou non autorisé" });
    }

    const invoices = await Invoice.find({ 
      clientId: clientId,
      userId: req.userId 
    }).sort({ createdAt: -1 });
    
    res.json(invoices);
  } catch (error) {
    console.error("❌ Erreur récupération factures client:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des factures du client", 
      error: error.message 
    });
  }
};

// ✅ Récupérer une facture par son ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    }).populate("clientId", "name email phone");
    
    if (!invoice) {
      return res.status(404).json({ message: "Facture introuvable ou non autorisée" });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error("❌ Erreur récupération facture:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération de la facture",
      error: error.message
    });
  }
};

// ✅ Envoyer une facture par email
exports.sendInvoiceByEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate("clientId", "name email");

    if (!invoice) {
      return res.status(404).json({ message: "Facture introuvable ou non autorisée" });
    }

    if (!invoice.clientId.email) {
      return res.status(400).json({ message: "Le client n'a pas d'adresse email" });
    }

    await sendEmail({
      to: invoice.clientId.email,
      subject: `Facture ${invoice.invoiceNumber}`,
      text: `Bonjour,\nVeuillez trouver votre facture ${invoice.invoiceNumber} d'un montant de ${invoice.amount} €`,
      html: `<p>Bonjour,</p><p>Veuillez trouver votre facture <strong>${invoice.invoiceNumber}</strong> d'un montant de <strong>${invoice.amount} €</strong>.</p>`
    });

    res.json({ message: "Facture envoyée par email" });
  } catch (error) {
    console.error("❌ Erreur envoi email facture:", error);
    res.status(500).json({
      message: "Erreur lors de l'envoi de la facture",
      error: error.message
    });
  }
};

// ✅ Mettre à jour une facture
exports.updateInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      clientId,
      devisIds,
      amount,
      status,
      dueDate,
      notes,
      paymentTerms,
      discount,
      taxRate,
      entrepriseName,
      entrepriseAddress,
      entrepriseCity,
      entreprisePhone,
      entrepriseEmail,
      logoUrl
    } = req.body;

    // Vérifier que la facture existe et appartient à l'utilisateur
    const existingInvoice = await Invoice.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!existingInvoice) {
      return res.status(404).json({ message: "Facture introuvable ou non autorisée" });
    }

    // Vérifier que le client existe et appartient à l'utilisateur
    if (clientId) {
      const client = await Client.findOne({ _id: clientId, userId: req.userId });
      if (!client) {
        return res.status(404).json({ message: "Client introuvable ou non autorisé" });
      }
    }

    // Vérifier que les devis existent et appartiennent à l'utilisateur
    if (devisIds && devisIds.length > 0) {
      const devisCount = await Devis.countDocuments({ 
        _id: { $in: devisIds }, 
        userId: req.userId 
      });
      
      if (devisCount !== devisIds.length) {
        return res.status(400).json({ message: "Un ou plusieurs devis sont introuvables ou non autorisés" });
      }
    }

    // Mettre à jour la facture
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        invoiceNumber,
        clientId,
        devisIds,
        amount,
        status,
        dueDate,
        notes,
        paymentTerms,
        discount,
        taxRate,
        entrepriseName,
        entrepriseAddress,
        entrepriseCity,
        entreprisePhone,
        entrepriseEmail,
        logoUrl
      },
      { new: true }
    );

    // ✅ NOUVEAU: Envoyer une notification en temps réel
    const io = req.app.get("io");
    if (io) {
      const client = await Client.findById(clientId);
      
      io.to(`user-${req.userId}`).emit("notification", {
        type: "invoice",
        category: "invoice_updated",
        title: "Facture mise à jour",
        message: `Facture ${updatedInvoice.invoiceNumber} mise à jour`,
        details: `Client: ${client?.name || 'Inconnu'} • Montant: ${updatedInvoice.amount} €`,
        date: new Date(),
        read: false,
        invoiceId: updatedInvoice._id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        clientName: client?.name
      });
      console.log(`✅ Notification de mise à jour de facture envoyée à l'utilisateur ${req.userId}`);
    }

    res.json({ 
      message: "✅ Facture mise à jour avec succès", 
      invoice: updatedInvoice 
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour facture:", error);
    
    // Gestion des erreurs de duplication
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Une facture avec ce numéro existe déjà" 
      });
    }
    
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour de la facture", 
      error: error.message 
    });
  }
};

// ✅ Mettre à jour le statut d'une facture
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Vérifier que le statut est valide
    if (!['draft', 'pending', 'paid', 'overdue', 'canceled'].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    // Vérifier que la facture existe et appartient à l'utilisateur
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Facture introuvable ou non autorisée" });
    }

    // Mettre à jour le statut
    invoice.status = status;
    await invoice.save();

    // ✅ NOUVEAU: Envoyer une notification en temps réel après un délai
    const io = req.app.get("io");
    if (io) {
      const client = await Client.findById(invoice.clientId);
      setTimeout(() => {
        io.to(`user-${req.userId}`).emit("notification", {
          type: "invoice",
          category: "invoice_status",
          title: "Statut de facture modifié",
          message: `La facture ${invoice.invoiceNumber} est maintenant "${getStatusLabel(status)}"`,
          details: `Client: ${client?.name || 'Inconnu'} • Montant: ${invoice.amount} €`,
          date: new Date(),
          read: false,
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: client?.name
        });
        console.log(`✅ Notification de changement de statut de facture envoyée à l'utilisateur ${req.userId} (après délai)`);
      }, 10000); // 10 secondes
    }

    res.json({ 
      message: "✅ Statut de la facture mis à jour avec succès", 
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status
      }
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour statut facture:", error);
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour du statut de la facture", 
      error: error.message 
    });
  }
};

// ✅ Supprimer une facture
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!invoice) {
      return res.status(404).json({ message: "Facture introuvable ou non autorisée" });
    }

    await invoice.deleteOne();

    // ✅ NOUVEAU: Envoyer une notification en temps réel
    const io = req.app.get("io");
    if (io) {
      io.to(`user-${req.userId}`).emit("notification", {
        type: "invoice",
        category: "invoice_deleted",
        title: "Facture supprimée",
        message: `La facture ${invoice.invoiceNumber} a été supprimée`,
        date: new Date(),
        read: false
      });
      console.log(`✅ Notification de suppression de facture envoyée à l'utilisateur ${req.userId}`);
    }

    res.status(200).json({ message: "✅ Facture supprimée avec succès" });
  } catch (error) {
    console.error("❌ Erreur suppression facture:", error);
    res.status(500).json({ 
      message: "Erreur lors de la suppression de la facture", 
      error: error.message 
    });
  }
};

// Fonction utilitaire pour obtenir le libellé du statut
function getStatusLabel(status) {
  switch (status) {
    case 'draft': return 'Brouillon';
    case 'pending': return 'En attente';
    case 'paid': return 'Payée';
    case 'overdue': return 'En retard';
    case 'canceled': return 'Annulée';
    default: return 'Inconnu';
  }
}