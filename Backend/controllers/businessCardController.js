const BusinessCard = require("../models/businessCard");

// ✅ FONCTION CORRIGÉE: Sauvegarder ou mettre à jour la carte de visite
exports.saveBusinessCard = async (req, res) => {
  try {
    const { cardImage, cardConfig } = req.body;
    const userId = req.userId;

    console.log("💾 Sauvegarde carte de visite pour userId:", userId);
    console.log("📦 Données reçues:", { 
      hasCardImage: !!cardImage, 
      cardConfig: typeof cardConfig,
      cardConfigKeys: cardConfig ? Object.keys(cardConfig) : []
    });

    if (!cardImage) {
      return res.status(400).json({ message: "Image de la carte requise" });
    }

    // ✅ VALIDATION ET NETTOYAGE des actions avec parsing JSON si nécessaire
    let cleanedConfig = {
      showQR: true,
      qrPosition: 'bottom-right',
      qrSize: 150,
      actions: []
    };

    if (cardConfig) {
      cleanedConfig = {
        showQR: cardConfig.showQR !== undefined ? cardConfig.showQR : true,
        qrPosition: cardConfig.qrPosition || 'bottom-right',
        qrSize: Number(cardConfig.qrSize) || 150,
        actions: []
      };

      // ✅ GESTION ROBUSTE des actions (string ou array)
      let actionsData = cardConfig.actions;
      
      console.log("🔍 Type des actions reçues:", typeof actionsData);
      console.log("🔍 Contenu des actions:", actionsData);
      
      // Si les actions sont une chaîne, essayer de les parser
      if (typeof actionsData === 'string') {
        try {
          actionsData = JSON.parse(actionsData);
          console.log("🔧 Actions parsées depuis string:", actionsData);
        } catch (parseError) {
          console.error("❌ Erreur parsing actions:", parseError);
          actionsData = [];
        }
      }

      // ✅ NETTOYAGE des actions pour éviter les erreurs de validation
      if (actionsData && Array.isArray(actionsData)) {
        cleanedConfig.actions = actionsData
          .filter(action => {
            const isValid = action && typeof action === 'object' && action.type;
            if (!isValid) {
              console.log("⚠️ Action invalide filtrée:", action);
            }
            return isValid;
          })
          .map((action, index) => {
            // ✅ CONVERSION SÉCURISÉE des types
            const cleanAction = {
              id: Number(action.id) || (Date.now() + index),
              type: String(action.type || 'download'),
              file: String(action.file || ''),
              url: String(action.url || ''),
              delay: Number(action.delay) || 0,
              active: Boolean(action.active !== undefined ? action.active : true)
            };
            
            // ✅ VALIDATION du type
            if (!['download', 'form', 'redirect', 'website'].includes(cleanAction.type)) {
              console.log("⚠️ Type d'action invalide, correction:", cleanAction.type, "→ download");
              cleanAction.type = 'download';
            }
            
            console.log(`✅ Action ${index + 1} nettoyée:`, cleanAction);
            return cleanAction;
          });
      } else {
        console.log("⚠️ Actions non valides, utilisation d'un tableau vide");
        cleanedConfig.actions = [];
      }
    }

    console.log("🧹 Configuration finale nettoyée:", {
      showQR: cleanedConfig.showQR,
      qrPosition: cleanedConfig.qrPosition,
      qrSize: cleanedConfig.qrSize,
      actionsCount: cleanedConfig.actions.length,
      actions: cleanedConfig.actions
    });

    // ✅ VALIDATION SUPPLÉMENTAIRE avant sauvegarde
    if (!Array.isArray(cleanedConfig.actions)) {
      console.error("❌ Les actions ne sont pas un tableau:", typeof cleanedConfig.actions);
      cleanedConfig.actions = [];
    }

    // Vérifier si une carte existe déjà pour cet utilisateur
    let businessCard = await BusinessCard.findOne({ userId });

    if (businessCard) {
      // ✅ MISE À JOUR avec upsert pour éviter les conflits
      console.log("🔄 Mise à jour de la carte existante");
      businessCard = await BusinessCard.findOneAndUpdate(
        { userId },
        {
          cardImage,
          cardConfig: cleanedConfig,
          updatedAt: new Date()
        },
        { 
          new: true, 
          runValidators: true 
        }
      );
      
      console.log("✅ Carte de visite mise à jour");
      res.json({ 
        message: "Carte de visite mise à jour avec succès", 
        businessCard 
      });
    } else {
      // ✅ CRÉATION avec gestion d'erreur de duplication
      console.log("🆕 Création d'une nouvelle carte");
      try {
        businessCard = new BusinessCard({
          userId,
          cardImage,
          cardConfig: cleanedConfig
        });

        // ✅ VALIDATION AVANT SAUVEGARDE
        const validationError = businessCard.validateSync();
        if (validationError) {
          console.error("❌ Erreur de validation:", validationError);
          throw validationError;
        }

        await businessCard.save();
        
        console.log("✅ Nouvelle carte de visite créée");
        res.status(201).json({ 
          message: "Carte de visite créée avec succès", 
          businessCard 
        });
      } catch (duplicateError) {
        if (duplicateError.code === 11000) {
          // Conflit de duplication, essayer une mise à jour
          console.log("⚠️ Conflit de duplication, tentative de mise à jour...");
          businessCard = await BusinessCard.findOneAndUpdate(
            { userId },
            {
              cardImage,
              cardConfig: cleanedConfig,
              updatedAt: new Date()
            },
            { 
              new: true, 
              runValidators: true 
            }
          );
          
          res.json({ 
            message: "Carte de visite mise à jour avec succès", 
            businessCard 
          });
        } else {
          throw duplicateError;
        }
      }
    }

  } catch (error) {
    console.error("❌ Erreur sauvegarde carte de visite:", error);
    console.error("❌ Stack trace:", error.stack);
    
    // ✅ GESTION D'ERREUR PLUS DÉTAILLÉE
    let errorMessage = "Erreur lors de la sauvegarde de la carte de visite";
    
    if (error.name === 'ValidationError') {
      console.error("❌ Erreurs de validation détaillées:", error.errors);
      errorMessage = "Erreur de validation des données";
      
      // Détailler les erreurs de validation
      const validationErrors = Object.keys(error.errors).map(key => {
        return `${key}: ${error.errors[key].message}`;
      });
      
      return res.status(400).json({ 
        message: errorMessage,
        validationErrors: validationErrors,
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: error.message 
    });
  }
};

// Récupérer la carte de visite de l'utilisateur
exports.getBusinessCard = async (req, res) => {
  try {
    const userId = req.userId;

    console.log("📋 Récupération carte de visite pour userId:", userId);

    const businessCard = await BusinessCard.findOne({ userId });

    if (!businessCard) {
      return res.status(404).json({ message: "Aucune carte de visite trouvée" });
    }

    console.log("✅ Carte de visite récupérée");
    res.json(businessCard);

  } catch (error) {
    console.error("❌ Erreur récupération carte de visite:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération de la carte de visite", 
      error: error.message 
    });
  }
};

// Supprimer la carte de visite
exports.deleteBusinessCard = async (req, res) => {
  try {
    const userId = req.userId;

    console.log("🗑️ Suppression carte de visite pour userId:", userId);

    const businessCard = await BusinessCard.findOneAndDelete({ userId });

    if (!businessCard) {
      return res.status(404).json({ message: "Aucune carte de visite trouvée" });
    }

    console.log("✅ Carte de visite supprimée");
    res.json({ message: "Carte de visite supprimée avec succès" });

  } catch (error) {
    console.error("❌ Erreur suppression carte de visite:", error);
    res.status(500).json({ 
      message: "Erreur lors de la suppression de la carte de visite", 
      error: error.message 
    });
  }
};

// ✅ FONCTION CORRIGÉE: Mettre à jour seulement la configuration
exports.updateCardConfig = async (req, res) => {
  try {
    const { cardConfig } = req.body;
    const userId = req.userId;

    console.log("⚙️ Mise à jour config carte de visite pour userId:", userId);

    const businessCard = await BusinessCard.findOne({ userId });

    if (!businessCard) {
      return res.status(404).json({ message: "Aucune carte de visite trouvée" });
    }

    // ✅ NETTOYAGE de la configuration
    const cleanedConfig = {
      ...businessCard.cardConfig.toObject(),
      ...cardConfig
    };

    // ✅ GESTION ROBUSTE des actions si présentes
    if (cardConfig.actions) {
      let actionsData = cardConfig.actions;
      
      // Si les actions sont une chaîne, essayer de les parser
      if (typeof actionsData === 'string') {
        try {
          actionsData = JSON.parse(actionsData);
        } catch (parseError) {
          console.error("❌ Erreur parsing actions:", parseError);
          actionsData = [];
        }
      }

      if (Array.isArray(actionsData)) {
        cleanedConfig.actions = actionsData
          .filter(action => action && typeof action === 'object')
          .map((action, index) => ({
            id: Number(action.id) || (Date.now() + index),
            type: String(action.type || 'download'),
            file: String(action.file || ''),
            url: String(action.url || ''),
            delay: Number(action.delay) || 0,
            active: Boolean(action.active !== undefined ? action.active : true)
          }));
      }
    }

    businessCard.cardConfig = cleanedConfig;
    await businessCard.save();

    console.log("✅ Configuration carte de visite mise à jour");
    res.json({ 
      message: "Configuration mise à jour avec succès", 
      businessCard 
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour config carte de visite:", error);
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour de la configuration", 
      error: error.message 
    });
  }
};