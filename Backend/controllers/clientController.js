const Client = require("../models/client");
const mongoose = require("mongoose");
const Devis = require("../models/devis");

exports.registerClient = async (req, res) => {
  try {
    const { name, email, phone, company, notes, address, postalCode, city } = req.body; // ✅ NOUVEAUX CHAMPS
    const { userId } = req.params;

    console.log("➡️ Données reçues pour l'inscription :", { 
      name, email, phone, company, notes, address, postalCode, city, userId 
    });

    // Vérifier si userId est valide
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ ERREUR: userId invalide !");
      return res.status(400).json({ message: "User ID invalide" });
    }

    // ✅ Vérifier si l'email existe déjà POUR CE userId SEULEMENT
    const existingClient = await Client.findOne({ email, userId });
    if (existingClient) {
      console.error("❌ ERREUR: Un client avec cet email existe déjà pour cet utilisateur !");
      return res.status(400).json({ message: "Ce client existe déjà dans votre liste." });
    }

    // ✅ Créer un nouveau client pour CE userId uniquement
    const newClient = new Client({
      name,
      email,
      phone,
      company,
      notes,
      address, // ✅ NOUVEAU
      postalCode, // ✅ NOUVEAU
      city, // ✅ NOUVEAU
      status: 'nouveau', // ✅ Statut par défaut "nouveau"
      userId: new mongoose.Types.ObjectId(userId),
    });

    await newClient.save();
    console.log("✅ Client enregistré avec succès !");
    res.status(201).json({ message: "Client enregistré avec succès !" });

  } catch (error) {
    console.error("❌ ERREUR LORS DE L'INSCRIPTION DU CLIENT :", error);
    res.status(500).json({ message: "Erreur lors de l'inscription du client", error });
  }
};

exports.getClients = async (req, res) => {
  try {
    console.log("User ID de la requête:", req.userId);

    const clients = await Client.find({ userId: req.userId }).sort({ createdAt: -1 });

    console.log("Clients trouvés:", clients);
    res.json(clients);
  } catch (error) {
    console.error("Erreur lors de la récupération des clients:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des clients" });
  }
};

// ✅ FONCTION CORRIGÉE: Mettre à jour le statut d'un client
exports.updateClientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 Tentative de mise à jour du statut pour le client ${id} vers ${status}`);

    // ✅ STATUTS VALIDES FINAUX (SANS PENDING)
    if (!['active', 'inactive', 'nouveau', 'en_attente'].includes(status)) {
      console.error("❌ Statut invalide:", status);
      return res.status(400).json({ message: "Statut invalide" });
    }

    // Vérifier que le client appartient à l'utilisateur
    const client = await Client.findOne({ _id: id, userId: req.userId });
    if (!client) {
      console.error("❌ Client introuvable ou non autorisé");
      return res.status(404).json({ message: "Client introuvable ou non autorisé" });
    }

    // Mettre à jour le statut
    client.status = status;
    client.updatedAt = new Date();
    await client.save();

    console.log(`✅ Statut du client ${client.name} mis à jour: ${status}`);
    res.json({ 
      message: "Statut mis à jour avec succès", 
      client: {
        _id: client._id,
        name: client.name,
        status: client.status,
        updatedAt: client.updatedAt
      }
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour statut client:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
  }
};

// ✅ FONCTION MISE À JOUR: Mettre à jour les informations d'un client (avec adresse)
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, notes, status, address, postalCode, city } = req.body; // ✅ NOUVEAUX CHAMPS

    console.log(`🔄 Tentative de mise à jour du client ${id}:`, { 
      name, email, phone, company, notes, status, address, postalCode, city 
    });

    // Vérifier que le client appartient à l'utilisateur
    const client = await Client.findOne({ _id: id, userId: req.userId });
    if (!client) {
      console.error("❌ Client introuvable ou non autorisé");
      return res.status(404).json({ message: "Client introuvable ou non autorisé" });
    }

    // Vérifier si l'email est déjà utilisé par un autre client
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({ 
        email, 
        userId: req.userId, 
        _id: { $ne: id } 
      });
      if (existingClient) {
        console.error("❌ Email déjà utilisé par un autre client");
        return res.status(400).json({ message: "Cet email est déjà utilisé par un autre client" });
      }
    }

    // Mettre à jour les champs
    if (name) client.name = name;
    if (email) client.email = email;
    if (phone) client.phone = phone;
    if (company !== undefined) client.company = company;
    if (notes !== undefined) client.notes = notes;
    // ✅ NOUVEAUX CHAMPS ADRESSE
    if (address !== undefined) client.address = address;
    if (postalCode !== undefined) client.postalCode = postalCode;
    if (city !== undefined) client.city = city;
    // ✅ STATUTS VALIDES FINAUX (SANS PENDING)
    if (status && ['active', 'inactive', 'nouveau', 'en_attente'].includes(status)) {
      client.status = status;
    }

    client.updatedAt = new Date();
    await client.save();

    console.log(`✅ Client ${client.name} mis à jour avec succès`);
    res.json({ 
      message: "Client mis à jour avec succès", 
      client 
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour client:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du client" });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const clientId = req.params.id;

    // 🔒 Vérifier que le client appartient à l'utilisateur
    const client = await Client.findOne({ _id: clientId, userId: req.userId });
    if (!client) {
      return res.status(404).json({ message: "Client introuvable ou non autorisé" });
    }

    // 🔥 Supprime aussi tous les devis liés à ce client
    await Devis.deleteMany({ clientId });

    // 🔥 Supprime le client
    await Client.findByIdAndDelete(clientId);

    console.log(`✅ Client ${client.name} et ses devis supprimés`);
    res.status(200).json({ message: "✅ Client et ses devis supprimés" });
  } catch (err) {
    console.error("❌ Erreur suppression client :", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression" });
  }
};