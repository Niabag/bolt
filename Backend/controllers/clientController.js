const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const Client = require('../models/client');

// Enregistrement d'un prospect via le lien public
exports.registerClient = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      email,
      phone,
      company = '',
      address = '',
      postalCode = '',
      city = '',
      notes = ''
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'ID utilisateur manquant' });
    }
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Nom, email et téléphone requis' });
    }

    const newClient = new Client({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      company,
      address,
      postalCode,
      city,
      notes,
      userId
    });

    await newClient.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('notification', {
        type: 'client',
        category: 'new_client',
        title: 'Nouveau prospect',
        message: `${newClient.name} s\'est inscrit`,
        date: new Date(),
        read: false,
        clientId: newClient._id
      });
    }

    res.status(201).json({ message: 'Client enregistré', client: newClient });
  } catch (error) {
    console.error('❌ Erreur inscription client:', error);
    res.status(500).json({ message: "Erreur lors de l'inscription du client" });
  }
};

// Récupérer les prospects de l'utilisateur connecté
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    console.error('❌ Erreur récupération clients:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des clients' });
  }
};

// Mettre à jour un prospect
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findOne({ _id: id, userId: req.userId });
    if (!client) {
      return res.status(404).json({ message: 'Client introuvable ou non autorisé' });
    }

    const updateData = { ...req.body };
    delete updateData._id;

    const updatedClient = await Client.findByIdAndUpdate(id, updateData, { new: true });

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.userId}`).emit('notification', {
        type: 'client',
        category: 'client_updated',
        title: 'Prospect mis à jour',
        message: `${updatedClient.name} a été mis à jour`,
        date: new Date(),
        read: false,
        clientId: updatedClient._id
      });
    }

    res.json(updatedClient);
  } catch (error) {
    console.error('❌ Erreur mise à jour client:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du client' });
  }
};

// Modifier uniquement le statut d'un prospect
exports.updateClientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'nouveau', 'en_attente'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const client = await Client.findOne({ _id: id, userId: req.userId });
    if (!client) {
      return res.status(404).json({ message: 'Client introuvable ou non autorisé' });
    }

    client.status = status;
    await client.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.userId}`).emit('notification', {
        type: 'client',
        category: 'status_updated',
        title: 'Statut du prospect modifié',
        message: `${client.name} est maintenant ${status}`,
        date: new Date(),
        read: false,
        clientId: client._id
      });
    }

    res.json({ message: 'Statut mis à jour', client });
  } catch (error) {
    console.error('❌ Erreur mise à jour statut client:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
  }
};

// Supprimer un prospect
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.userId });
    if (!client) {
      return res.status(404).json({ message: 'Client introuvable ou non autorisé' });
    }

    await client.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${req.userId}`).emit('notification', {
        type: 'client',
        category: 'client_deleted',
        title: 'Prospect supprimé',
        message: `${client.name} a été supprimé`,
        date: new Date(),
        read: false
      });
    }

    res.json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression client:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du client' });
  }
};

// Importer des prospects depuis un fichier CSV ou XLSX
exports.importClients = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    if (fileExtension !== 'csv' && fileExtension !== 'xlsx') {
      return res.status(400).json({
        message: 'Format de fichier non supporté. Seuls les formats CSV et XLSX sont acceptés.'
      });
    }

    const userId = req.userId;
    const filePath = file.path;
    let rows = [];
    let total = 0;
    let created = 0;

    console.log(`📂 Importation de prospects depuis ${file.originalname} (${file.mimetype})`);

    if (file.originalname.endsWith('.csv')) {
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
      return res.status(400).json({ message: 'Format de fichier non supporté. Seuls les formats CSV et XLSX sont acceptés.' });
    }

    console.log(`📊 ${total} lignes trouvées dans le fichier`);

    const headerMappings = {
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
      "complément d'adresse": 'addressComplement',
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
        const normalizedData = {};
        Object.keys(data).forEach(key => {
          const lowerKey = key.toLowerCase().trim();
          const mappedKey = headerMappings[lowerKey] || lowerKey;
          normalizedData[mappedKey] = data[key];
        });

        console.log('🔄 Traitement de la ligne:', normalizedData);

        let fullName = normalizedData.name;
        if (!fullName && (normalizedData.firstName || normalizedData.lastName)) {
          fullName = [normalizedData.firstName, normalizedData.lastName]
            .filter(Boolean)
            .join(' ');
        }

        if (!fullName || !normalizedData.email || !normalizedData.phone) {
          console.log('⚠️ Ligne ignorée: champs obligatoires manquants');
          continue;
        }

        const existingClient = await Client.findOne({
          email: normalizedData.email,
          userId
        });

        if (existingClient) {
          console.log(`⚠️ Client existant: ${normalizedData.email}`);
          continue;
        }

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
          userId
        });

        await client.save();
        created++;
        console.log(`✅ Client créé: ${fullName} (${normalizedData.email})`);
      } catch (err) {
        console.error('❌ Erreur lors du traitement d\'une ligne:', err);
      }
    }

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
