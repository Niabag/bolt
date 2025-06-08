import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./registerUser.scss";

const RegisterUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.AUTH.REGISTER, {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      alert("✅ Compte créé avec succès !");
      navigate("/login");
    } catch (err) {
      console.error("❌ Erreur d'inscription:", err);
      setError(err.message || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-user-container">
      <form onSubmit={handleRegister}>
        <h2>Créer un compte</h2>
        {error && <div className="error-message">{error}</div>}
        <input 
          type="text" 
          placeholder="Nom" 
          value={name}
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Mot de passe (min. 6 caractères)" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
          required 
          minLength={6}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Création en cours..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
};

export default RegisterUser;