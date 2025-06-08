const express = require("express");
const { 
  register, 
  login, 
  getUser, 
  updateProfile, 
  changePassword 
} = require("../controllers/userController");
const authenticate = require("../middleware/auth");

const router = express.Router();

// Route pour l'inscription d'un utilisateur
router.post("/register", register);

// Route pour la connexion d'un utilisateur
router.post("/login", login);

// Route protégée pour récupérer les informations de l'utilisateur connecté
router.get("/me", authenticate, getUser);

// Route protégée pour mettre à jour le profil
router.put("/profile", authenticate, updateProfile);

// Route protégée pour changer le mot de passe
router.put("/password", authenticate, changePassword);

module.exports = router;