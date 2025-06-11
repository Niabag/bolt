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

    // Vérifier si l'email existe déjà pour un autre client
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

    const userId = req.userId;
    const filePath = file.path;
    let rows = [];
    let total = 0;
    let created = 0;

    console.log(`📂 Importation de prospects depuis ${file.originalname} (${file.mimetype})`);

    if (file.originalname.endsWith('.csv')) {
      // Déterminer le séparateur (virgule ou point-virgule)
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const firstLine = fileContent.split('\n')[0];
      const separator = firstLine.includes(';') ? ';' : ',';
      
      console.log(`🔍 Séparateur CSV détecté: "${separator}"`);
      
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ 
            separator: separator,
            mapHeaders: ({ header }) => header.trim()
          }))
          .on('data', (data) => {
            rows.push(data);
            total++;
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else if (file.originalname.endsWith('.xlsx')) {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = xlsx.utils.sheet_to_json(sheet);
      total = rows.length;
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Format de fichier non supporté' });
    }

    console.log(`📊 ${total} lignes trouvées dans le fichier`);
    
    // Mappage des en-têtes français vers les noms de champs anglais
    const headerMappings = {
      // Mappages standards
      'nom': 'name',
      'name': 'name',
      'email': 'email',
      'courriel': 'email',
      'e-mail': 'email',
      'adresse email': 'email',
      'adresse e-mail': 'email',
      'téléphone': 'phone',
      'telephone': 'phone',
      'tel': 'phone',
      'tél': 'phone',
      'phone': 'phone',
      'numéro de téléphone': 'phone',
      'entreprise': 'company',
      'société': 'company',
      'company': 'company',
      'notes': 'notes',
      'commentaires': 'notes',
      'adresse': 'address',
      'address': 'address',
      'code postal': 'postalCode',
      'cp': 'postalCode',
      'postal code': 'postalCode',
      'postalcode': 'postalCode',
      'ville': 'city',
      'city': 'city',
      'statut': 'status',
      'status': 'status',
      'état': 'status',
      
      // Mappages spécifiques pour les formats d'export Google/Outlook
      'prénom': 'firstName',
      'prenom': 'firstName',
      'first name': 'firstName',
      'firstname': 'firstName',
      'given name': 'firstName',
      'nom de famille': 'lastName',
      'last name': 'lastName',
      'lastname': 'lastName',
      'family name': 'lastName',
      'numéro(s) de téléphone': 'phone',
      'numéros de téléphone': 'phone',
      'phone numbers': 'phone',
      'fonction': 'jobTitle',
      'poste': 'jobTitle',
      'job title': 'jobTitle',
      'titre': 'jobTitle',
      'complément d\'adresse': 'addressComplement',
      'address 2': 'addressComplement',
      'pays': 'country',
      'country': 'country',
      'date de création': 'createdAt',
      'date creation': 'createdAt',
      'created': 'createdAt',
      'created at': 'createdAt',
      'langue': 'language',
      'language': 'language'
    };

    for (const data of rows) {
      try {
        // Normaliser les clés du fichier importé
        const normalizedData = {};
        
        // Convertir toutes les clés en minuscules pour la comparaison
        Object.keys(data).forEach(key => {
          const lowerKey = key.toLowerCase().trim();
          const mappedKey = headerMappings[lowerKey] || lowerKey;
          normalizedData[mappedKey] = data[key];
        });
        
        console.log(`🔄 Traitement de la ligne:`, normalizedData);
        
        // Construire le nom complet si séparé en prénom/nom
        let fullName = normalizedData.name;
        if (!fullName && (normalizedData.firstName || normalizedData.lastName)) {
          fullName = [normalizedData.firstName, normalizedData.lastName]
            .filter(Boolean)
            .join(' ');
        }
        
        // Vérifier les champs obligatoires
        if (!fullName || !normalizedData.email || !normalizedData.phone) {
          console.log(`⚠️ Ligne ignorée: champs obligatoires manquants`);
          continue;
        }
        
        // Vérifier si le client existe déjà
        const existingClient = await Client.findOne({ 
          email: normalizedData.email, 
          userId 
        });
        
        if (existingClient) {
          console.log(`⚠️ Client existant: ${normalizedData.email}`);
          continue;
        }
        
        // Normaliser le statut
        let status = 'nouveau';
        if (normalizedData.status) {
          const statusLower = normalizedData.status.toLowerCase();
          if (statusLower.includes('actif') || statusLower.includes('active')) {
            status = 'active';
          } else if (statusLower.includes('inactif') || statusLower.includes('inactive')) {
            status = 'inactive';
          } else if (statusLower.includes('attente') || statusLower.includes('pending')) {
            status = 'en_attente';
          }
        }
        
        // Créer le client
        const client = new Client({
          name: fullName,
          email: normalizedData.email,
          phone: normalizedData.phone,
          company: normalizedData.company || '',
          notes: normalizedData.notes || '',
          address: normalizedData.address || '',
          postalCode: normalizedData.postalCode || '',
          city: normalizedData.city || '',
          status: status,
          userId,
        });
        
        await client.save();
        created++;
        console.log(`✅ Client créé: ${fullName} (${normalizedData.email})`);
      } catch (err) {
        console.error(`❌ Erreur lors du traitement d'une ligne:`, err);
      }
    }

    // Nettoyer le fichier temporaire
    fs.unlinkSync(filePath);
    
    console.log(`📊 Résumé de l'import: ${created} clients créés sur ${total} lignes`);
    res.status(201).json({ 
      message: 'Import terminé', 
      created, 
      total 
    });
  } catch (error) {
    console.error('❌ Erreur import prospects:', error);
    res.status(500).json({ message: "Erreur lors de l'import", error: error.message });
  }
};