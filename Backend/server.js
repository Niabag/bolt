const server = require("./app");

// ✅ Normalisation du port
const normalizePort = val => {
  const port = parseInt(val, 10);
  return isNaN(port) ? val : (port >= 0 ? port : false);
};
const port = normalizePort(process.env.PORT || "5000");

// ✅ Gestion des erreurs
const errorHandler = error => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port: " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges.");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use.");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

server.on("error", errorHandler);
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port " + port;
  console.log("✅ Serveur démarré sur " + bind);
});

server.listen(port);