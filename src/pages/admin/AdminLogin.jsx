// src/pages/admin/AdminLogin.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUtilisateur, selectIsAuthenticated, selectAuthLoading, selectAuthError, clearAuthError } from "../../Redux/store";
import { Lock, X, Mail, User, Eye, EyeOff } from "lucide-react"; // 👈 Added Eye / EyeOff
import { toast } from "sonner";
import axios from "axios";
import logo from "../../assets/logo-login.png";

export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👈 New state

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetFullname, setResetFullname] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    
    if (!fullname || !password) {
      setLocalError("Veuillez remplir tous les champs");
      return;
    }
    
    const result = await dispatch(loginUtilisateur({ Fullname: fullname, password }));
    if (result.error) {
      const errorMsg = result.payload || "Identifiants incorrects";
      setLocalError(errorMsg);
      toast.error(errorMsg);
    } else {
      toast.success("Connexion réussie !");
      navigate("/dashboard");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = async () => {
    if (!resetFullname.trim()) {
      toast.error("Veuillez saisir votre nom d'utilisateur.");
      return;
    }
    setResetLoading(true);
    try {
      await axios.post('/api/forgot-password', { Fullname: resetFullname.trim() });
      toast.success('Demande envoyée. Un administrateur vous contactera.');
      setResetModalOpen(false);
      setResetFullname("");
    } catch (error) {
      const msg = error.response?.data?.message || 'Erreur. Vérifiez votre nom d\'utilisateur.';
      toast.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: linear-gradient(135deg, #ffffff, #e8f5e9, #c8e6c9, #a5d6a7, #ffffff);
          background-size: 400% 400%;
          animation: gradientShift 14s ease-in-out infinite;
          padding: 1.5rem;
          z-index: 0;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .login-page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(129, 199, 132, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(76, 175, 80, 0.10) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(165, 214, 167, 0.12) 0%, transparent 50%);
          animation: float 8s ease-in-out infinite alternate;
          z-index: 0;
          pointer-events: none;
        }

        @keyframes float {
          0% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1.05) rotate(1deg); }
        }

        .login-card {
          position: relative;
          width: 100%;
          max-width: 36rem;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 2rem;
          box-shadow: 
            0 20px 60px rgba(76, 175, 80, 0.15),
            0 8px 24px rgba(76, 175, 80, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          padding: 2.5rem 3rem;
          animation: slideUp 0.6s ease-out;
          z-index: 1;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .brand-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .brand-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 5.5rem;
          height: 5.5rem;
          border-radius: 1.5rem;
          background: linear-gradient(135deg, #2e7d32, #43a047);
          color: white;
          margin-bottom: 1rem;
          box-shadow: 0 12px 24px -6px rgba(46, 125, 50, 0.3);
          transition: transform 0.3s ease;
          overflow: hidden;
        }

        .brand-logo:hover {
          transform: scale(1.05) rotate(-3deg);
        }

        .brand-logo img {
          width: 6rem;
          height: 6rem;
          object-fit: contain;
        }

        .brand-name {
          font-family: 'Georgia', serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: #2e7d32;
          letter-spacing: 1px;
          line-height: 1.2;
        }

        .brand-name span {
          color: #43a047;
          font-weight: 300;
        }

        .brand-tagline {
          font-size: 0.8rem;
          color: #66bb6a;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 0.25rem;
        }

        .welcome-title {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1b5e20;
          margin-top: 1.5rem;
          margin-bottom: 0.25rem;
          text-align: center;
        }

        .welcome-subtitle {
          font-size: 0.9rem;
          color: #66bb6a;
          text-align: center;
          margin-bottom: 1.75rem;
          font-weight: 500;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
          color: #388e3c;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .form-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          border-radius: 0.75rem;
          border: 1.5px solid #e8f5e9;
          background-color: #ffffff;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.04);
        }

        .form-input-wrapper:focus-within {
          border-color: #43a047;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.12), 0 2px 8px rgba(76, 175, 80, 0.06);
        }

        .form-input-wrapper:hover {
          border-color: #a5d6a7;
        }

        .form-input-icon {
          flex-shrink: 0;
          width: 2.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a5d6a7;
          transition: color 0.3s ease;
        }

        .form-input-wrapper:focus-within .form-input-icon {
          color: #43a047;
        }

        .form-input {
          width: 100%;
          height: 3.25rem;
          padding: 0 1rem 0 0.25rem;
          border: none;
          background: transparent;
          font-size: 0.95rem;
          font-family: inherit;
          color: #0d2e0d;
          font-weight: 500;
          outline: none;
        }

        .form-input::placeholder {
          color: #81c784;
          font-weight: 400;
        }

        .form-input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px white inset;
          -webkit-text-fill-color: #0d2e0d;
        }

        /* 👇 Password toggle button styles */
        .password-toggle-btn {
          flex-shrink: 0;
          width: 2.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #a5d6a7;
          cursor: pointer;
          transition: color 0.3s ease;
          padding: 0;
        }

        .password-toggle-btn:hover {
          color: #43a047;
        }

        .form-input-wrapper:focus-within .password-toggle-btn {
          color: #43a047;
        }

        .error-message {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: #fce4ec;
          color: #c62828;
          font-size: 0.85rem;
          text-align: center;
          animation: shake 0.4s ease-in-out;
          border: 1px solid #f8bbd0;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        .login-button {
          width: 100%;
          height: 3.25rem;
          border-radius: 9999px;
          background: linear-gradient(135deg, #2e7d32, #43a047);
          color: #ffffff;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          font-size: 0.95rem;
          margin-top: 0.5rem;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(46, 125, 50, 0.25);
        }

        .login-button::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.6s ease;
        }

        .login-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #1b5e20, #2e7d32);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px -4px rgba(46, 125, 50, 0.35);
        }

        .login-button:hover:not(:disabled)::after {
          left: 100%;
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .login-button svg {
          display: inline-block;
          margin-right: 0.5rem;
        }

        .form-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 0.75rem;
          gap: 0.5rem;
        }

        .form-footer-separator {
          color: #c8e6c9;
          font-size: 0.75rem;
        }

        .forgot-password-link button {
          background: none;
          border: none;
          color: #66bb6a;
          font-size: 0.8rem;
          cursor: pointer;
          transition: color 0.2s;
          font-weight: 500;
        }

        .forgot-password-link button:hover {
          color: #2e7d32;
        }

        .create-account-link {
          font-size: 0.8rem;
          color: #a5d6a7;
          text-align: center;
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid #e8f5e9;
        }

        .create-account-link button {
          background: none;
          border: none;
          color: #43a047;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
          font-size: 0.8rem;
        }

        .create-account-link button:hover {
          color: #2e7d32;
        }

        .footer-copyright {
          text-align: center;
          font-size: 0.7rem;
          color: #a5d6a7;
          margin-top: 1.5rem;
          letter-spacing: 0.5px;
        }

        .footer-copyright strong {
          color: #66bb6a;
          font-weight: 600;
        }

        .reset-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        .reset-modal {
          background: white;
          border-radius: 1.5rem;
          max-width: 420px;
          width: 100%;
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
          animation: slideUp 0.3s ease;
          position: relative;
          border: 1px solid #e8f5e9;
        }

        .reset-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #4caf50;
          padding-bottom: 0.75rem;
        }

        .reset-modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1b5e20;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .reset-modal-title svg {
          color: #4caf50;
        }

        .reset-modal-close {
          background: #e8f5e9;
          border: none;
          border-radius: 50%;
          width: 2.25rem;
          height: 2.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
          color: #66bb6a;
        }
        .reset-modal-close:hover {
          background: #c8e6c9;
          color: #2e7d32;
        }

        .reset-modal-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .reset-modal-body p {
          font-size: 0.9rem;
          color: #66bb6a;
          margin: 0;
          line-height: 1.6;
        }

        .reset-modal-input {
          width: 100%;
          height: 3rem;
          border-radius: 0.75rem;
          border: 1.5px solid #e8f5e9;
          padding: 0 1rem;
          font-size: 0.9rem;
          transition: border 0.2s;
          background: white;
          color: #0d2e0d;
          font-weight: 500;
        }
        .reset-modal-input:focus {
          outline: none;
          border-color: #4caf50;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }

        .reset-modal-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .reset-modal-btn {
          flex: 1;
          height: 2.75rem;
          border-radius: 0.75rem;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .reset-modal-btn-cancel {
          background: #e8f5e9;
          color: #388e3c;
        }
        .reset-modal-btn-cancel:hover {
          background: #c8e6c9;
        }
        .reset-modal-btn-submit {
          background: linear-gradient(135deg, #2e7d32, #43a047);
          color: white;
        }
        .reset-modal-btn-submit:hover:not(:disabled) {
          background: #1b5e20;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
        }
        .reset-modal-btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .login-page {
            background: linear-gradient(135deg, #1a2a1a, #2e4a2e, #1b3a1b, #0f1f0f, #1a2a1a);
            background-size: 400% 400%;
            animation: gradientShift 14s ease-in-out infinite;
          }
          .login-page::before {
            background-image: 
              radial-gradient(circle at 20% 50%, rgba(76, 175, 80, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(46, 125, 50, 0.06) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(129, 199, 132, 0.05) 0%, transparent 50%);
          }
          .login-card {
            background: rgba(30, 50, 30, 0.9);
            backdrop-filter: blur(20px);
            border-color: rgba(76, 175, 80, 0.15);
          }
          .brand-name {
            color: #81c784;
          }
          .brand-name span {
            color: #66bb6a;
          }
          .brand-tagline {
            color: #4caf50;
          }
          .welcome-title {
            color: #a5d6a7;
          }
          .welcome-subtitle {
            color: #66bb6a;
          }
          .form-label {
            color: #81c784;
          }
          .form-input-wrapper {
            background-color: rgba(30, 50, 30, 0.85);
            border-color: #2e4a2e;
          }
          .form-input-wrapper:focus-within {
            border-color: #4caf50;
            box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
          }
          .form-input-wrapper:hover {
            border-color: #388e3c;
          }
          .form-input {
            color: #ffffff;
            font-weight: 500;
          }
          .form-input::placeholder {
            color: #81c784;
          }
          .form-input-icon {
            color: #4a6a4a;
          }
          .form-input-wrapper:focus-within .form-input-icon {
            color: #4caf50;
          }
          
          .password-toggle-btn {
            color: #4a6a4a;
          }
          .password-toggle-btn:hover {
            color: #4caf50;
          }
          .form-input-wrapper:focus-within .password-toggle-btn {
            color: #4caf50;
          }

          .login-button {
            background: linear-gradient(135deg, #1b5e20, #2e7d32);
          }
          .login-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #0d3a10, #1b5e20);
          }
          .forgot-password-link button {
            color: #4caf50;
          }
          .forgot-password-link button:hover {
            color: #81c784;
          }
          .create-account-link {
            border-top-color: #2e4a2e;
            color: #4a6a4a;
          }
          .create-account-link button {
            color: #4caf50;
          }
          .create-account-link button:hover {
            color: #81c784;
          }
          .footer-copyright {
            color: #4a6a4a;
          }
          .footer-copyright strong {
            color: #4caf50;
          }
          .error-message {
            background: #3a1a1a;
            color: #ef9a9a;
            border-color: #6a2a2a;
          }
          .reset-modal {
            background: #1e3a1e;
            border-color: #2e4a2e;
          }
          .reset-modal-title {
            color: #a5d6a7;
          }
          .reset-modal-title svg {
            color: #4caf50;
          }
          .reset-modal-body p {
            color: #81c784;
          }
          .reset-modal-input {
            background: rgba(0,0,0,0.3);
            border-color: #2e4a2e;
            color: #ffffff;
            font-weight: 500;
          }
          .reset-modal-input:focus {
            border-color: #4caf50;
            box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
          }
          .reset-modal-close {
            background: #2e4a2e;
            color: #66bb6a;
          }
          .reset-modal-close:hover {
            background: #3a5a3a;
          }
          .reset-modal-btn-cancel {
            background: #2e4a2e;
            color: #81c784;
          }
          .reset-modal-btn-cancel:hover {
            background: #3a5a3a;
          }
          .reset-modal-btn-submit {
            background: linear-gradient(135deg, #1b5e20, #2e7d32);
          }
          .reset-modal-btn-submit:hover:not(:disabled) {
            background: #0d3a10;
          }
        }

        @media (max-width: 640px) {
          .login-card {
            padding: 1.5rem;
            margin: 1rem;
          }
          .brand-name {
            font-size: 1.4rem;
          }
          .welcome-title {
            font-size: 1.25rem;
          }
          .brand-logo {
            width: 4.5rem;
            height: 4.5rem;
          }
          .brand-logo img {
            width: 2.5rem;
            height: 2.5rem;
          }
          .reset-modal {
            margin: 1rem;
            padding: 1.5rem;
          }
        }
      `}</style>
      
      <div className="login-page">
        <div className="login-card">
          <div className="brand-section">
            <div className="brand-logo">
              <img src={logo} alt="SMAITI LUXE" />
            </div>
            <div className="brand-name">
              SMAITI <span>LUXE</span>
            </div>
            <div className="brand-tagline">✦ Rapidité · Qualité · Confort ✦</div>
          </div>

          <h1 className="welcome-title">Bienvenue</h1>
          <p className="welcome-subtitle">Connectez-vous à votre espace d'administration</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Nom d'utilisateur</label>
              <div className="form-input-wrapper">
                <div className="form-input-icon">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required 
                  value={fullname} 
                  onChange={(e) => setFullname(e.target.value)} 
                  className="form-input" 
                  placeholder="Entrez votre nom d'utilisateur" 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div className="form-input-wrapper">
                <div className="form-input-icon">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="form-input" 
                  placeholder="Entrez votre mot de passe" 
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  tabIndex="-1"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {(localError || authError) && (
              <div className="error-message">
                {localError || authError}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading} 
              className="login-button"
            >
              {loading ? "Connexion..." : "SE CONNECTER"}
            </button>
          </form>

          <div className="form-footer">
            <div className="forgot-password-link">
              <button type="button" onClick={() => setResetModalOpen(true)}>
                Mot de passe oublié ?
              </button>
            </div>
          </div>

          <div className="create-account-link">
            Nouvel administrateur ? <button type="button" onClick={() => toast.info("Contacter le super administrateur")}>Contacter l'admin</button>
          </div>

          <div className="footer-copyright">
            © 2026 <strong>SMAITI LUXE CAR</strong>. Tous droits réservés.
          </div>
        </div>
      </div>

      {resetModalOpen && (
        <div className="reset-modal-overlay" onClick={() => setResetModalOpen(false)}>
          <div className="reset-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reset-modal-header">
              <div className="reset-modal-title">
                <Mail size={20} />
                Réinitialisation
              </div>
              <button className="reset-modal-close" onClick={() => setResetModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="reset-modal-body">
              <p>
                Entrez votre nom d'utilisateur. Un administrateur recevra votre demande
                et pourra réinitialiser votre mot de passe.
              </p>
              <input
                type="text"
                className="reset-modal-input"
                placeholder="Nom d'utilisateur"
                value={resetFullname}
                onChange={(e) => setResetFullname(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleForgotPassword();
                }}
                autoFocus
              />
              <div className="reset-modal-actions">
                <button
                  className="reset-modal-btn reset-modal-btn-cancel"
                  onClick={() => setResetModalOpen(false)}
                >
                  Annuler
                </button>
                <button
                  className="reset-modal-btn reset-modal-btn-submit"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? "Envoi..." : "Envoyer la demande"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}