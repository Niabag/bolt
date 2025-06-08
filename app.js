const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

// Import des configurations
const connectDB = require("./config/database");
const corsOptions = require("./config/cors");

// Import des routes
const userRoutes = require("./routes/userRoutes");
const clientRoutes = require("./routes/clientRoutes");
const devisRoutes = require("./routes/devisRoutes");
const businessCardRoutes = require("./routes/businessCardRoutes"); // ✅ NOUVEAU

const app = express();

// ✅ Connexion à la base de données
connectDB();

// ✅ Middleware pour parser JSON avec limite augmentée
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Configuration CORS
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ✅ Routes de l'API
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/devis", devisRoutes);
app.use("/api/business-cards", businessCardRoutes); // ✅ NOUVEAU

// ✅ Route de vérification du serveur
app.get("/", (req, res) => {
  res.json({
    message: "✅ Backend CRM opérationnel 🚀",
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// ✅ Route de santé
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ✅ Gestion des erreurs 404
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route non trouvée",
    path: req.originalUrl,
  });
});

// ✅ Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error("❌ Erreur serveur:", error);
  res.status(500).json({
    message: "Erreur interne du serveur",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// ✅ Servir le frontend React (build Vite)
app.use(express.static(path.join(__dirname, "public", "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "dist", "index.html"));
});

module.exports = app;
