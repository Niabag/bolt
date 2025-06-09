import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home/Index";
import Login from "./pages/Login/Index";
import RegisterUser from "./pages/RegisterUser/Index";
import RegisterClient from "./pages/RegisterClient/Index";
import Dashboard from "./pages/Dashboard/Index";
import ProspectEditPage from "./components/Dashboard/Prospects/prospectEditPage";
import Terms from "./pages/Terms/Terms";
import Privacy from "./pages/Privacy/Privacy";
import Error from "./pages/Error/Index";
import ProtectedRoute from "./components/ProtectedRoute/Index";
import "./utils/styles/global.scss";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Page d'accueil */}
            <Route path="/" element={<Home />} />
            
            {/* Routes publiques */}
            <Route path="/register-user" element={<RegisterUser />} />
            <Route path="/register-client/:userId" element={<RegisterClient />} />
            <Route path="/login" element={<Login />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Routes protégées */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Route de modification des prospects */}
            <Route
              path="/prospect/edit/:id"
              element={
                <ProtectedRoute>
                  <ProspectEditPage />
                </ProtectedRoute>
              }
            />
            
            {/* Gestion des erreurs */}
            <Route path="/404" element={<Error />} />
            <Route path="*" element={<Error />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);