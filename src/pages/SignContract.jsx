import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../Redux/store';
import { toast } from 'sonner';
import { Check, PenTool, X, Sparkles, CircleCheck } from 'lucide-react';
import logoImage from "../assets/c.png";

export default function SignContract() {
  const { token } = useParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    const width = parent.clientWidth || 400;
    const height = 200;
    canvas.width = width;
    canvas.height = height;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1e293b';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      const width = parent.clientWidth || 400;
      const height = 200;
      const dataUrl = canvas.toDataURL();
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1e293b';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (signatureData) {
        const img = new Image();
        img.src = signatureData;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [signatureData]);

  // Countdown redirect
  useEffect(() => {
    if (!success) return;
    if (countdown === 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, success, navigate]);

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsCanvasEmpty(false);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    const canvas = canvasRef.current;
    setSignatureData(canvas.toDataURL('image/png'));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
    setIsCanvasEmpty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) {
      toast.error('Veuillez entrer le code.');
      return;
    }
    if (!signatureData || isCanvasEmpty) {
      toast.error('Veuillez signer dans la zone prévue.');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/reservations/sign/${token}`, {
        code,
        signature: signatureData,
      });
      toast.success('Signature enregistrée avec succès !');
      setSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la signature.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== SUCCESS SCREEN ====================
  if (success) {
    return (
      <div className="success-page">
        <div className="success-bg-decoration">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>

        <div className="success-card">
          <div className="success-ring">
            <div className="success-ring-inner">
              <div className="success-icon-wrapper">
                <CircleCheck size={56} className="success-check-icon" />
              </div>
            </div>
          </div>

          <h1 className="success-title">Signature validée !</h1>
          <p className="success-message">
            Votre signature a été enregistrée avec succès.
          </p>

          <div className="sparkles-row">
            <Sparkles size={18} className="sparkle" />
            <Sparkles size={14} className="sparkle" />
            <Sparkles size={18} className="sparkle" />
            <Sparkles size={14} className="sparkle" />
            <Sparkles size={18} className="sparkle" />
          </div>

          <div className="countdown-wrapper">
            <div className="countdown-ring">
              <svg className="countdown-svg" viewBox="0 0 120 120">
                <circle className="countdown-bg" cx="60" cy="60" r="50" />
                <circle
                  className="countdown-progress"
                  cx="60"
                  cy="60"
                  r="50"
                  style={{
                    strokeDasharray: 314.16,
                    strokeDashoffset: 314.16 * (1 - countdown / 15),
                  }}
                />
              </svg>
              <span className="countdown-number">{countdown}</span>
            </div>
            <p className="countdown-text">
              Redirection vers l'accueil dans <strong>{countdown}</strong> seconde{countdown > 1 ? 's' : ''}
            </p>
          </div>

          <button onClick={() => navigate('/')} className="home-btn-success">
            Accueil
          </button>
        </div>

        <style>{`
          /* ===== SUCCESS PAGE ===== */
          .success-page {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 80vh;
            padding: 1.5rem;
            background: #f8fafc;
            position: relative;
            overflow: hidden;
          }
          .success-bg-decoration {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
          }
          .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.3;
            animation: float 8s ease-in-out infinite;
          }
          .orb-1 {
            width: 300px;
            height: 300px;
            top: -100px;
            right: -50px;
            background: #d4a94a;
            animation-delay: 0s;
          }
          .orb-2 {
            width: 250px;
            height: 250px;
            bottom: -80px;
            left: -60px;
            background: #1e332a;
            animation-delay: 2s;
          }
          .orb-3 {
            width: 200px;
            height: 200px;
            top: 40%;
            left: 50%;
            transform: translateX(-50%);
            background: #d4a94a;
            animation-delay: 4s;
            opacity: 0.15;
          }
          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(20px, -20px) scale(1.1); }
            66% { transform: translate(-10px, 15px) scale(0.95); }
          }
          .success-card {
            max-width: 480px;
            width: 100%;
            background: #fff;
            border-radius: 1.5rem;
            padding: 2.5rem 2rem 2rem;
            box-shadow: 0 20px 60px -15px rgba(0,0,0,0.1);
            border: 1px solid #f3f1eb;
            position: relative;
            z-index: 2;
            text-align: center;
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .success-ring { display: flex; justify-content: center; margin-bottom: 1.5rem; }
          .success-ring-inner { position: relative; width: 100px; height: 100px; }
          .success-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #1e332a, #2a4a3a);
            border-radius: 50%;
            box-shadow: 0 15px 40px -10px rgba(30,51,42,0.4);
            animation: popIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
          }
          .success-icon-wrapper::after {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background: conic-gradient(from 0deg, transparent, rgba(212,169,74,0.3), transparent);
            animation: spinRing 3s linear infinite;
          }
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes spinRing { to { transform: rotate(360deg); } }
          .success-check-icon { color: #fff; animation: checkPulse 1.5s ease-in-out infinite; }
          @keyframes checkPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
          .success-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.75rem;
            font-weight: 700;
            color: #1e332a;
            margin-bottom: 0.5rem;
          }
          .success-message {
            font-family: 'Inter', sans-serif;
            color: #6d7d73;
            font-size: 1rem;
            margin-bottom: 1.5rem;
          }
          .sparkles-row {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1.75rem;
          }
          .sparkle {
            color: #d4a94a;
            animation: sparkleBounce 2s ease-in-out infinite;
          }
          .sparkle:nth-child(1) { animation-delay: 0s; }
          .sparkle:nth-child(2) { animation-delay: 0.3s; }
          .sparkle:nth-child(3) { animation-delay: 0.6s; }
          .sparkle:nth-child(4) { animation-delay: 0.9s; }
          .sparkle:nth-child(5) { animation-delay: 1.2s; }
          @keyframes sparkleBounce {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
            50% { transform: scale(1.3) rotate(20deg); opacity: 1; }
          }
          .countdown-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 1.75rem;
          }
          .countdown-ring {
            position: relative;
            width: 80px;
            height: 80px;
            margin-bottom: 0.75rem;
          }
          .countdown-svg {
            width: 100%;
            height: 100%;
            transform: rotate(-90deg);
          }
          .countdown-bg {
            fill: none;
            stroke: #e2e8f0;
            stroke-width: 4;
          }
          .countdown-progress {
            fill: none;
            stroke: #d4a94a;
            stroke-width: 4;
            stroke-linecap: round;
            transition: stroke-dashoffset 0.3s ease;
          }
          .countdown-number {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e332a;
          }
          .countdown-text {
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            color: #6d7d73;
          }
          .countdown-text strong {
            color: #1e332a;
            font-weight: 700;
          }
          .home-btn-success {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.7rem 2.5rem;
            background: #1e332a;
            color: #fff;
            border: none;
            border-radius: 9999px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.25s ease;
            width: 100%;
          }
          .home-btn-success:hover {
            background: #0f1a14;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px -8px rgba(30,51,42,0.4);
          }

          /* Dark mode */
          @media (prefers-color-scheme: dark) {
            .success-page {
              background: #0f172a;
            }
            .success-card {
              background: #1e293b;
              border-color: #334155;
            }
            .success-title {
              color: #f1f5f9;
            }
            .success-message {
              color: #94a3b8;
            }
            .countdown-bg {
              stroke: #334155;
            }
            .countdown-number {
              color: #f1f5f9;
            }
            .countdown-text {
              color: #94a3b8;
            }
            .countdown-text strong {
              color: #d4a94a;
            }
            .home-btn-success {
              background: #334155;
            }
            .home-btn-success:hover {
              background: #475569;
              box-shadow: 0 8px 25px -8px rgba(30,41,59,0.6);
            }
            .orb-1 { background: #d4a94a; opacity: 0.2; }
            .orb-2 { background: #1e332a; opacity: 0.2; }
            .orb-3 { background: #d4a94a; opacity: 0.1; }
          }

          @media (max-width: 640px) {
            .success-card {
              padding: 1.5rem 1.25rem;
            }
            .success-title {
              font-size: 1.4rem;
            }
            .success-ring-inner,
            .success-icon-wrapper {
              width: 80px;
              height: 80px;
            }
            .success-check-icon {
              width: 44px;
              height: 44px;
            }
            .countdown-ring {
              width: 64px;
              height: 64px;
            }
            .countdown-number {
              font-size: 1.25rem;
            }
          }
        `}</style>
      </div>
    );
  }

  // ==================== SIGNATURE FORM ====================
  return (
    <div className="sign-contract-container">
      <div className="sign-contract-card">
        <div className="sign-logo-wrapper">
          <img src={logoImage} alt="Logo" className="sign-logo" />
        </div>

        <div className="contract-header">
          <div className="contract-icon">
            <PenTool size={24} />
          </div>
          <h1>Signature du contrat</h1>
        </div>
        <p className="contract-subtitle">
          Entrez le code reçu par SMS ou email, puis signez dans le cadre ci-dessous.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">Code de validation</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: 12345"
              className="code-input"
            />
          </div>

          <div className="form-group">
            <label>Signature manuscrite</label>
            <div className="canvas-wrapper">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="signature-canvas"
              />
              {isCanvasEmpty && (
                <div className="canvas-placeholder">
                  <span>Signez ici</span>
                </div>
              )}
            </div>
            <button type="button" onClick={clearSignature} className="clear-btn">
              <X size={16} /> Effacer
            </button>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Envoi en cours...' : 'Valider la signature'}
          </button>
        </form>
      </div>

      <style>{`
        /* ===== SIGNATURE FORM ===== */
        .sign-contract-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80vh;
          padding: 1.5rem;
          background: #f8fafc;
        }
        .sign-contract-card {
          max-width: 600px;
          width: 100%;
          background: #fff;
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 20px 60px -15px rgba(0,0,0,0.1);
          border: 1px solid #f3f1eb;
        }
        .sign-logo-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .sign-logo {
          max-height: 80px;
          width: auto;
          object-fit: contain;
        }
        .contract-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .contract-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          background: #1e332a;
          border-radius: 0.75rem;
          color: #fff;
        }
        .contract-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e332a;
          margin: 0;
        }
        .contract-subtitle {
          font-family: 'Inter', sans-serif;
          color: #6d7d73;
          margin-bottom: 2rem;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-group label {
          display: block;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          color: #1e332a;
          margin-bottom: 0.5rem;
        }
        .code-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #fff;
          color: #1e332a;
        }
        .code-input:focus {
          outline: none;
          border-color: #d4a94a;
          box-shadow: 0 0 0 3px rgba(212,169,74,0.15);
        }
        .canvas-wrapper {
          position: relative;
          border: 2px dashed #d1d5db;
          border-radius: 0.75rem;
          overflow: hidden;
          background: #fafafa;
          transition: border-color 0.2s;
        }
        .canvas-wrapper:hover {
          border-color: #9ca3af;
        }
        .signature-canvas {
          width: 100%;
          height: 200px;
          touch-action: none;
          cursor: crosshair;
          display: block;
        }
        .canvas-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          font-family: 'Inter', sans-serif;
          color: #9ca3af;
          font-size: 1.1rem;
          letter-spacing: 0.5px;
        }
        .clear-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: #f3f1eb;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          color: #1e332a;
          cursor: pointer;
          transition: background 0.2s;
        }
        .clear-btn:hover {
          background: #e2e8f0;
        }
        .submit-btn {
          width: 100%;
          padding: 0.85rem;
          background: #1e332a;
          color: #fff;
          border: none;
          border-radius: 9999px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.2s, background 0.2s;
          margin-top: 0.5rem;
        }
        .submit-btn:hover:not(:disabled) {
          background: #0f1a14;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30,51,42,0.2);
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .sign-contract-container {
            background: #0f172a;
          }
          .sign-contract-card {
            background: #1e293b;
            border-color: #334155;
          }
          .contract-header h1 {
            color: #f1f5f9;
          }
          .contract-subtitle {
            color: #94a3b8;
          }
          .form-group label {
            color: #e2e8f0;
          }
          .code-input {
            background: #0f172a;
            border-color: #334155;
            color: #f1f5f9;
          }
          .code-input:focus {
            border-color: #d4a94a;
          }
          .canvas-wrapper {
            background: #0f172a;
            border-color: #475569;
          }
          .canvas-wrapper:hover {
            border-color: #64748b;
          }
          .canvas-placeholder {
            color: #475569;
          }
          .clear-btn {
            background: #334155;
            border-color: #475569;
            color: #cbd5e1;
          }
          .clear-btn:hover {
            background: #475569;
          }
          .submit-btn {
            background: #334155;
          }
          .submit-btn:hover:not(:disabled) {
            background: #475569;
          }
          .contract-icon {
            background: #334155;
          }
        }

        @media (max-width: 640px) {
          .sign-contract-card {
            padding: 1.5rem;
          }
          .contract-header h1 {
            font-size: 1.4rem;
          }
          .signature-canvas {
            height: 150px;
          }
          .sign-logo {
            max-height: 60px;
          }
        }
      `}</style>
    </div>
  );
}