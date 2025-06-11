const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Import des configurations
const connectDB = require("./config/database");
const corsOptions = require("./config/cors");

// Import des routes
const userRoutes = require("./routes/userRoutes");
const clientRoutes = require("./routes/clientRoutes");
const devisRoutes = require("./routes/devisRoutes");
const businessCardRoutes = require("./routes/businessCardRoutes"); // ✅ NOUVEAU
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes"); // ✅ NOUVEAU
const statsRoutes = require("./routes/statsRoutes");

const app = express();

// ✅ Création du serveur HTTP pour Socket.io
const server = http.createServer(app);

// ✅ Configuration de Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ✅ Stockage des connexions utilisateurs
const userConnections = new Map();

// ✅ Gestion des connexions Socket.io
io.on("connection", (socket) => {
  console.log("✅ Nouvelle connexion Socket.io:", socket.id);

  // Authentification de l'utilisateur
  socket.on("authenticate", (userId) => {
    if (userId) {
      console.log(`✅ Utilisateur ${userId} authentifié sur socket ${socket.id}`);
      // Déconnecter l'ancienne connexion si elle existe
      const previousSocketId = userConnections.get(userId);
      if (previousSocketId && previousSocketId !== socket.id) {
        const previousSocket = io.sockets.sockets.get(previousSocketId);
        if (previousSocket) {
          previousSocket.disconnect(true);
        }
      }

      // Stocker la nouvelle connexion de l'utilisateur
      userConnections.set(userId, socket.id);
      // Rejoindre une room spécifique à l'utilisateur
      socket.join(`user-${userId}`);
    }
  });

  // Déconnexion
  socket.on("disconnect", () => {
    console.log("❌ Déconnexion Socket.io:", socket.id);
    // Supprimer la connexion de l'utilisateur
    for (const [userId, socketId] of userConnections.entries()) {
      if (socketId === socket.id) {
        userConnections.delete(userId);
        break;
      }
    }
  });
});

// ✅ Exporter io pour l'utiliser dans d'autres fichiers
app.set("io", io);
app.set("userConnections", userConnections);

// ✅ Connexion à la base de données
connectDB();

// Stripe webhooks need the raw body. Apply this middleware before JSON parser
app.use("/api/subscription/webhook", express.raw({ type: "application/json" }));

// ✅ Middleware pour parser JSON avec limite augmentée
app.use(express.json({ limit: "10mb" })); // ✅ AUGMENTÉ pour les images
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // ✅ AUGMENTÉ

// ✅ Configuration CORS
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Gestion des requêtes preflight

// ✅ Routes de l'API
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/devis", devisRoutes);
app.use("/api/business-cards", businessCardRoutes); // ✅ NOUVEAU
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/invoices", invoiceRoutes); // ✅ NOUVEAU
app.use("/api/stats", statsRoutes);

// ✅ Route de vérification du serveur
app.get("/", (req, res) => {
  res.json({
    message: "✅ Backend CRM opérationnel 🚀",
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// ✅ Route de santé pour vérifier l'état du serveur
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

// ✅ Middleware de gestion d'erreurs globales
app.use((error, req, res, next) => {
  console.error("❌ Erreur serveur:", error);
  res.status(500).json({
    message: "Erreur interne du serveur",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// ✅ Exporter le serveur HTTP au lieu de l'app Express
module.exports = server;