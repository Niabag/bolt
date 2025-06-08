const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "RANDOM_TOKEN_SECRET";

module.exports = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      console.error("❌ Aucun token envoyé dans la requête");
      return res.status(401).json({ message: "Aucun token fourni" });
    }

    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      console.error("❌ Token manquant dans l'en-tête Authorization");
      return res.status(401).json({ message: "Accès non autorisé" });
    }

    const decodedToken = jwt.verify(token, JWT_SECRET);

    if (!decodedToken.userId) {
      console.error("❌ Token décodé sans userId", decodedToken);
      return res.status(401).json({ message: "Token invalide !" });
    }

    req.userId = decodedToken.userId;
    console.log("✅ UserID décodé:", req.userId);

    next();
  } catch (error) {
    console.error("❌ Erreur d'authentification:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expiré" });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Token invalide" });
    }
    
    res.status(401).json({ message: "Erreur d'authentification" });
  }
};