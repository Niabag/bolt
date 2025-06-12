// Dans la fonction importClients, ajoutons une vérification supplémentaire
exports.importClients = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    // Vérifier que le format du fichier est supporté (CSV ou XLSX uniquement)
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
      return res.status(400).json({ message: 'Format de fichier non supporté. Seuls les formats CSV et XLSX sont acceptés.' });
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