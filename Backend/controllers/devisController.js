const Devis = require("../models/devis");
const { sendEmail } = require("../utils/emailSender");

const calculateTotalTTC = (articles = []) => {
  if (!Array.isArray(articles)) return 0;
  return articles.reduce((total, item) => {
    const price = parseFloat(item.unitPrice || 0);
    const qty = parseFloat(item.quantity || 0);
    const tva = parseFloat(item.tvaRate || 0);
    if (isNaN(price) || isNaN(qty) || isNaN(tva)) return total;
    const ht = price * qty;
    return total + ht + (ht * tva / 100);
  }, 0);
};

exports.createDevis = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      clientId,
      dateDevis,
      dateValidite,
      tvaRate,
      entrepriseName,
      entrepriseAddress,
      entrepriseCity,
      entreprisePhone,
      entrepriseEmail,
      entrepriseSiret,
      entrepriseTva,
      logoUrl,
      articles = [],
      status = 'nouveau' // ✅ NOUVEAU: Statut par défaut
    } = req.body;

    const userId = req.userId;

    // Debug: Vérifier les champs SIRET et TVA reçus
    console.log("📤 Données reçues pour création devis:", {
      entrepriseSiret,
      entrepriseTva,
      title,
      clientId
    });

    if (!clientId) {
      return res.status(400).json({ message: "Client manquant." });
    }

    const computedAmount = calculateTotalTTC(articles);

    const newDevis = new Devis({
      title,
      description,
      amount: computedAmount,
      clientId,
      userId,
      dateDevis,
      dateValidite,
      tvaRate,
      entrepriseName,
      entrepriseAddress,
      entrepriseCity,
      entreprisePhone,
      entrepriseEmail,
      entrepriseSiret,
      entrepriseTva,
      logoUrl,
      articles,
      status // ✅ NOUVEAU
    });

    await newDevis.save();
    
    // Debug: Vérifier les données sauvegardées
    console.log("💾 Devis sauvegardé avec SIRET/TVA:", {
      _id: newDevis._id,
      entrepriseSiret: newDevis.entrepriseSiret,
      entrepriseTva: newDevis.entrepriseTva
    });
    
    // ✅ NOUVEAU: Envoyer une notification en temps réel
    const io = req.app.get("io");
    if (io) {
      // Récupérer les infos du client
      const Client = require("../models/client");
      const client = await Client.findById(clientId);
      
      io.to(`user-${userId}`).emit("notification", {
        type: "devis",
        category: "nouveau_devis",
        title: "Nouveau devis créé",
        message: `Devis "${title}" créé pour ${client?.name || 'Client inconnu'}`,
        details: `Montant: ${computedAmount} € • Statut: Nouveau`,
        date: new Date(),
        read: false,
        devisId: newDevis._id,
        devisTitle: title,
        clientName: client?.name
      });
      console.log(`✅ Notification de création de devis envoyée à l'utilisateur ${userId}`);
    }
    
    res.status(201).json({ message: "✅ Devis créé avec succès", devis: newDevis });
  } catch (error) {
    console.error("❌ Erreur création devis :", error);
    res.status(500).json({
      message: "Erreur lors de la création du devis",
      error,
    });
  }
};

exports.getUserDevis = async (req, res) => {
  try {
    const devisList = await Devis.find({ userId: req.userId })
      .populate("clientId", "name email");
    res.json(devisList);
  } catch (error) {
    console.error("Erreur récupération devis :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des devis", error });
  }
};

exports.getClientDevis = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Vérifier que le client appartient à l'utilisateur connecté
    const Client = require("../models/client");
    const client = await Client.findOne({ _id: clientId, userId: req.userId });
    
    if (!client) {
      return res.status(404).json({ message: "Client introuvable ou non autorisé" });
    }

    // Récupérer uniquement les devis de ce client
    const devisList = await Devis.find({ 
      clientId: clientId,
      userId: req.userId 
    }).populate("clientId", "name email");
    
    res.json(devisList);
  } catch (error) {
    console.error("Erreur récupération devis client :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des devis du client", error });
  }
};

// ✅ Envoyer un devis par email
exports.sendDevisByEmail = async (req, res) => {
  try {
    const devis = await Devis.findOne({ _id: req.params.id, userId: req.userId }).populate("clientId", "name email");
    if (!devis) {
      return res.status(404).json({ message: "Devis introuvable ou non autorisé" });
    }

    if (!devis.clientId.email) {
      return res.status(400).json({ message: "Le client n'a pas d'adresse email" });
    }

    await sendEmail({
      to: devis.clientId.email,
      subject: `Devis ${devis.title}`,
      text: `Bonjour,\nVeuillez trouver votre devis "${devis.title}" d'un montant de ${devis.amount} €`,
      html: `<p>Bonjour,</p><p>Veuillez trouver votre devis <strong>${devis.title}</strong> d'un montant de <strong>${devis.amount} €</strong>.</p>`
    });

    res.json({ message: "Devis envoyé par email" });
  } catch (error) {
    console.error("❌ Erreur envoi email devis:", error);
    res.status(500).json({ message: "Erreur lors de l'envoi du devis", error: error.message });
  }
};

exports.updateDevis = async (req, res) => {
  try {
    const devisId = req.params.id;

    // Debug: Vérifier les champs SIRET et TVA reçus pour mise à jour
    console.log("🔄 Données reçues pour mise à jour devis:", {
      devisId,
      entrepriseSiret: req.body.entrepriseSiret,
      entrepriseTva: req.body.entrepriseTva,
      title: req.body.title
    });

    // Vérifier que le devis appartient à l'utilisateur
    const existingDevis = await Devis.findOne({ _id: devisId, userId: req.userId });
    if (!existingDevis) {
      return res.status(404).json({ message: "Devis introuvable ou non autorisé." });
    }

    const updateData = { ...req.body };
    if (req.body.articles) {
      updateData.amount = calculateTotalTTC(req.body.articles);
    }

    const updatedDevis = await Devis.findByIdAndUpdate(
      devisId,
      updateData,
      { new: true }
    );

    // Debug: Vérifier les données mises à jour
    console.log("💾 Devis mis à jour avec SIRET/TVA:", {
      _id: updatedDevis._id,
      entrepriseSiret: updatedDevis.entrepriseSiret,
      entrepriseTva: updatedDevis.entrepriseTva
    });

    // ✅ NOUVEAU: Envoyer une notification en temps réel
    const io = req.app.get("io");
    if (io) {
      // Récupérer les infos du client
      const Client = require("../models/client");
      const client = await Client.findById(updatedDevis.clientId);
      
      io.to(`user-${req.userId}`).emit("notification", {
        type: "devis",
        category: "devis_update",
        title: "Devis mis à jour",
        message: `Le devis "${updatedDevis.title}" a été modifié`,
        details: `Client: ${client?.name || 'Inconnu'} • Montant: ${updatedDevis.amount} €`,
        date: new Date(),
        read: false,
        devisId: updatedDevis._id,
        devisTitle: updatedDevis.title,
        clientName: client?.name
      });
      console.log(`✅ Notification de mise à jour de devis envoyée à l'utilisateur ${req.userId}`);
    }

    res.json(updatedDevis);
  } catch (error) {
    console.error("❌ Erreur mise à jour devis :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du devis", error });
  }
};

// ✅ NOUVELLE FONCTION: Mettre à jour le statut d'un devis
exports.updateDevisStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 Tentative de mise à jour du statut pour le devis ${id} vers ${status}`);

    // ✅ VÉRIFIER QUE LE STATUT EST VALIDE
    if (!['nouveau', 'en_attente', 'fini', 'inactif'].includes(status)) {
      console.error("❌ Statut invalide:", status);
      return res.status(400).json({ message: "Statut invalide" });
    }

    // Vérifier que le devis appartient à l'utilisateur
    const devis = await Devis.findOne({ _id: id, userId: req.userId });
    if (!devis) {
      console.error("❌ Devis introuvable ou non autorisé");
      return res.status(404).json({ message: "Devis introuvable ou non autorisé" });
    }

    // Mettre à jour le statut
    devis.status = status;
    await devis.save();

    console.log(`✅ Statut du devis ${devis.title} mis à jour: ${status}`);
    
    // ✅ NOUVEAU: Envoyer une notification en temps réel après un délai
    const io = req.app.get("io");
    if (io) {
      // Récupérer les infos du client
      const Client = require("../models/client");
      const client = await Client.findById(devis.clientId);

      setTimeout(() => {
        io.to(`user-${req.userId}`).emit("notification", {
          type: "devis",
          category: "devis_status",
          title: "Statut de devis modifié",
          message: `Le devis "${devis.title}" est maintenant "${status}"`,
          details: `Client: ${client?.name || 'Inconnu'} • Montant: ${devis.amount} €`,
          date: new Date(),
          read: false,
          devisId: devis._id,
          devisTitle: devis.title,
          clientName: client?.name
        });
        console.log(`✅ Notification de changement de statut de devis envoyée à l'utilisateur ${req.userId} (après délai)`);
      }, 10000); // 10 secondes
    }
    
    res.json({ 
      message: "Statut mis à jour avec succès", 
      devis: {
        _id: devis._id,
        title: devis.title,
        status: devis.status
      }
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour statut devis:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
  }
};

exports.deleteDevis = async (req, res) => {
  try {
    const devis = await Devis.findOne({ _id: req.params.id, userId: req.userId });
    if (!devis) {
      return res.status(404).json({ message: "Devis introuvable ou non autorisé." });
    }

    await devis.deleteOne();
    
    // ✅ NOUVEAU: Envoyer une notification en temps réel
    const io = req.app.get("io");
    if (io) {
      io.to(`user-${req.userId}`).emit("notification", {
        type: "devis",
        category: "devis_deleted",
        title: "Devis supprimé",
        message: `Le devis "${devis.title}" a été supprimé`,
        date: new Date(),
        read: false
      });
      console.log(`✅ Notification de suppression de devis envoyée à l'utilisateur ${req.userId}`);
    }
    
    res.status(200).json({ message: "✅ Devis supprimé avec succès." });
  } catch (error) {
    console.error("❌ Erreur suppression devis :", error);
    res.status(500).json({ message: "Erreur lors de la suppression du devis." });
  }
};