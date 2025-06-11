const Client = require("../models/client");
const mongoose = require("mongoose");
const Devis = require("../models/devis");
const fs = require("fs");
const csv = require("csv-parser");
const xlsx = require("xlsx");

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
    
    // ✅ NOUVEAU: Envoyer une notification en temps réel
    const io = req.app.get("io");
    if (io) {
      io.to(`user-${userId}`).emit("notification", {
        type: "client",
        category: "nouveau_client",
        title: "Nouveau prospect inscrit",
        message: `${name} s'est inscrit via votre QR code`,
        details: `Email: ${email} • Téléphone: ${phone}${company ? ` • Entreprise: ${company}` : ''}`,
        date: new Date(),
        read: false,
        clientId: newClient._id,
        clientName: name
      });
      console.log(`✅ Notification envoyée à l'utilisateur ${userId}`);
    }
    
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
    
    // ✅ NOUVEAU: Envoyer une notification en temps réel après un délai
    const io = req.app.get("io");
    if (io) {
      setTimeout(() => {
        io.to(`user-${req.userId}`).emit("notification", {
          type: "client",
          category: "status_update",
          title: "Statut de prospect mis à jour",
          message: `Le statut de ${client.name} a été changé en "${status}"`,
          details: `Email: ${client.email} • Téléphone: ${client.phone}`,
          date: new Date(),
          read: false,
          clientId: client._id,
          clientName: client.name
        });
        console.log(`✅ Notification de changement de statut envoyée à l'utilisateur ${req.userId} (après délai)`);
      }, 10000); // 10 secondes
    }
    
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
    
    // ✅ NOUVEAU: Envoyer une notification en temps réel
    const io = req.app.get("io");
    if (io) {
      io.to(`user-${req.userId}`).emit("notification", {
        type: "client",
        category: "client_update",
        title: "Prospect mis à jour",
        message: `Les informations de ${client.name} ont été mises à jour`,
        details: `Email: ${client.email} • Téléphone: ${client.phone}`,
        date: new Date(),
        read: false,
        clientId: client._id,
        clientName: client.name
      });
      console.log(`✅ Notification de mise à jour client envoyée à l'utilisateur ${req.userId}`);
    }
    
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
    
    // ✅ NOUVEAU: Envoyer une notification en temps réel
    const io = req.app.get("io");
    if (io) {
      io.to(`user-${req.userId}`).emit("notification", {
        type: "client",
        category: "client_deleted",
        title: "Prospect supprimé",
        message: `${client.name} a été supprimé de votre liste`,
        details: `Tous les devis associés ont également été supprimés`,
        date: new Date(),
        read: false
      });
      console.log(`✅ Notification de suppression client envoyée à l'utilisateur ${req.userId}`);
    }
    
    res.status(200).json({ message: "✅ Client et ses devis supprimés" });
  } catch (err) {
    console.error("❌ Erreur suppression client :", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression" });
  }
};

exports.importClients = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    console.log("📂 Fichier reçu pour import:", file.originalname, file.mimetype, file.size);
    
    const userId = req.userId;
    const filePath = file.path;
    let rows = [];
    let importedCount = 0;
    let totalRows = 0;
    let errors = [];

    // Lecture du fichier selon son type
    if (file.originalname.toLowerCase().endsWith('.csv')) {
      console.log("🔍 Traitement du fichier CSV");
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => {
            rows.push(data);
            totalRows++;
          })
          .on('end', resolve)
          .on('error', (err) => {
            console.error("❌ Erreur lecture CSV:", err);
            reject(err);
          });
      });
    } else if (file.originalname.toLowerCase().endsWith('.xlsx')) {
      console.log("🔍 Traitement du fichier XLSX");
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = xlsx.utils.sheet_to_json(sheet);
      totalRows = rows.length;
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Format de fichier non supporté. Utilisez CSV ou XLSX.' });
    }

    console.log(`📊 Nombre de lignes trouvées: ${rows.length}`);
    
    // Vérification des en-têtes attendus
    if (rows.length > 0) {
      const firstRow = rows[0];
      console.log("🔑 En-têtes trouvés:", Object.keys(firstRow));
      
      // Vérifier si les en-têtes essentiels sont présents (avec variations possibles)
      const hasName = 'Nom' in firstRow || 'name' in firstRow || 'NOM' in firstRow;
      const hasEmail = 'Email' in firstRow || 'email' in firstRow || 'EMAIL' in firstRow || 'E-mail' in firstRow;
      const hasPhone = 'Téléphone' in firstRow || 'phone' in firstRow || 'TELEPHONE' in firstRow || 'Tel' in firstRow;
      
      if (!hasName || !hasEmail || !hasPhone) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ 
          message: 'Format de fichier incorrect. Les colonnes Nom, Email et Téléphone sont requises.',
          headers: Object.keys(firstRow)
        });
      }
    }

    // Traitement des lignes
    for (const data of rows) {
      try {
        // Extraire les champs avec gestion des différentes variantes de noms de colonnes
        const name = data.Nom || data.nom || data.name || data.NAME;
        const email = data.Email || data.email || data['E-mail'] || data.EMAIL;
        const phone = data['Téléphone'] || data.phone || data.tel || data.TELEPHONE;
        const company = data.Entreprise || data.entreprise || data.company || data.COMPANY || '';
        const notes = data.Notes || data.notes || data.NOTES || '';
        const address = data.Adresse || data.adresse || data.address || data.ADDRESS || '';
        const postalCode = data['Code Postal'] || data.codePostal || data.postalCode || data.POSTAL_CODE || '';
        const city = data.Ville || data.ville || data.city || data.CITY || '';
        const status = (data.Statut || data.statut || data.status || data.STATUS || 'nouveau').toLowerCase();
        
        // Validation des champs obligatoires
        if (!name || !email || !phone) {
          console.log(`⚠️ Ligne ignorée - données incomplètes:`, data);
          errors.push(`Ligne ignorée - Nom, Email ou Téléphone manquant: ${JSON.stringify(data)}`);
          continue;
        }
        
        // Vérifier si le client existe déjà
        const exists = await Client.findOne({ email, userId });
        if (exists) {
          console.log(`⚠️ Client déjà existant: ${email}`);
          errors.push(`Client déjà existant: ${email}`);
          continue;
        }

        // Normaliser le statut
        let normalizedStatus = 'nouveau';
        if (['actif', 'active', 'activé', 'activated'].includes(status)) {
          normalizedStatus = 'active';
        } else if (['inactif', 'inactive', 'désactivé', 'deactivated'].includes(status)) {
          normalizedStatus = 'inactive';
        } else if (['en attente', 'en_attente', 'attente', 'pending', 'waiting'].includes(status)) {
          normalizedStatus = 'en_attente';
        }

        // Créer le client
        const client = new Client({
          name,
          email,
          phone,
          company,
          notes,
          address,
          postalCode,
          city,
          status: normalizedStatus,
          userId,
        });
        
        await client.save();
        importedCount++;
        console.log(`✅ Client importé: ${name} (${email})`);
      } catch (err) {
        console.error(`❌ Erreur import client:`, err);
        errors.push(`Erreur: ${err.message}`);
      }
    }

    // Nettoyage du fichier temporaire
    fs.unlinkSync(filePath);
    
    // Envoyer une notification pour l'import réussi
    const io = req.app.get("io");
    if (io && importedCount > 0) {
      io.to(`user-${req.userId}`).emit("notification", {
        type: "system",
        category: "import_success",
        title: "Import de prospects terminé",
        message: `${importedCount} prospect${importedCount > 1 ? 's' : ''} importé${importedCount > 1 ? 's' : ''} avec succès`,
        details: `Sur un total de ${totalRows} entrée${totalRows > 1 ? 's' : ''}${errors.length > 0 ? ` • ${errors.length} erreur${errors.length > 1 ? 's' : ''}` : ''}`,
        date: new Date(),
        read: false
      });
    }
    
    res.status(201).json({ 
      message: 'Import terminé', 
      created: importedCount,
      total: totalRows,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Erreur import prospects:', error);
    res.status(500).json({ message: "Erreur lors de l'import", error: error.message });
  }
};