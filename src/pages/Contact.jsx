// Contact.jsx – Clean, minimal design with illustration (different from About)
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useI18n } from "../lib/i18n";
import { FadeIn } from "../components/site/Motion3D";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from "lucide-react";
import { createContact } from "../Redux/store";
import { toast } from "sonner";

// Optional: import a custom illustration SVG or use an icon
// import ContactIllustration from "../assets/contact-illustration.svg";

export default function Contact() {
  const dispatch = useDispatch();
  const { t, lang } = useI18n();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await dispatch(
      createContact({
        fullname: form.fullname,
        email: form.email,
        phone: form.phone,
        message: form.message,
      })
    );
    setSubmitting(false);
    if (result.error) {
      toast.error(lang === "fr" ? "Erreur lors de l'envoi" : "خطأ في الإرسال");
    } else {
      toast.success(
        lang === "fr"
          ? "Message envoyé. Nous revenons vers vous !"
          : "تم إرسال الرسالة. سنعود إليك!"
      );
      setForm({ fullname: "", email: "", phone: "", message: "" });
    }
  };

  const contactPoints = [
    { icon: MapPin, label: t("contact.address"), detail: "123, Avenue Mohammed V, Casablanca" },
    { icon: Phone, label: t("contact.phone"), detail: "+212 5 22 12 34 56" },
    { icon: Mail, label: t("contact.email"), detail: "contact@atlasrent.ma" },
    { icon: Clock, label: t("contact.hours"), detail: "Lun–Sam : 9h – 19h" },
  ];

  return (
    <>
      <style>{`
        .contact-page {
          background: #faf9f7;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 4rem 0;
        }
        .contact-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
          width: 100%;
        }
        @media (max-width: 768px) {
          .contact-container { padding: 0 1rem; }
          .contact-page { padding: 2rem 0; }
        }

        /* Header */
        .contact-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        .contact-header-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #d4a94a;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          background: rgba(212, 169, 74, 0.1);
          padding: 0.3rem 1.2rem;
          border-radius: 9999px;
          margin-bottom: 1rem;
          border: 1px solid rgba(212, 169, 74, 0.15);
        }
        .contact-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 3.5rem;
          font-weight: 700;
          color: #1e332a;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }
        .contact-header p {
          font-size: 1.125rem;
          color: #6d7d73;
          max-width: 32rem;
          margin: 0 auto;
          line-height: 1.6;
        }
        @media (max-width: 768px) {
          .contact-header h1 { font-size: 2.5rem; }
        }

        /* Main grid: illustration + form */
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 4rem;
          align-items: start;
        }
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        /* Left: illustration & contact info */
        .contact-left {
          background: #ffffff;
          border-radius: 2rem;
          padding: 2.5rem;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
          border: 1px solid #e8e7e2;
        }
        .contact-illustration {
          width: 100%;
          max-width: 300px;
          margin: 0 auto 2rem;
          display: block;
        }
        .contact-illustration svg {
          width: 100%;
          height: auto;
        }
        .contact-info-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .contact-info-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .contact-info-icon {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 0.75rem;
          background: #f3f1eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .contact-info-icon svg {
          width: 1.25rem;
          height: 1.25rem;
          color: #d4a94a;
        }
        .contact-info-text {
          font-size: 0.95rem;
          color: #1e332a;
        }
        .contact-info-text strong {
          display: block;
          font-weight: 600;
          margin-bottom: 0.1rem;
        }
        .contact-info-text span {
          color: #6d7d73;
          font-size: 0.9rem;
        }

        /* Right: form */
        .contact-form {
          background: #ffffff;
          border-radius: 2rem;
          padding: 2.5rem;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
          border: 1px solid #e8e7e2;
        }
        .contact-form-title {
          font-family: 'Inter', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e332a;
          margin-bottom: 0.25rem;
        }
        .contact-form-subtitle {
          color: #6d7d73;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }
        .contact-form-group {
          margin-bottom: 1.25rem;
        }
        .contact-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.4rem;
          color: #1e332a;
        }
        .contact-input,
        .contact-textarea {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e8e7e2;
          background: #faf9f7;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          transition: all 0.2s;
          color: #1e332a;
        }
        .contact-input:focus,
        .contact-textarea:focus {
          outline: none;
          border-color: #d4a94a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(212, 169, 74, 0.1);
        }
        .contact-textarea {
          min-height: 120px;
          resize: vertical;
        }
        .contact-submit-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 9999px;
          background: #1e332a;
          padding: 0 2.5rem;
          height: 3.25rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: #ffffff;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .contact-submit-btn:hover:not(:disabled) {
          background: #0f1a14;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -5px rgba(30, 51, 42, 0.3);
        }
        .contact-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Decorative shapes */
        .contact-shape {
          position: fixed;
          border-radius: 9999px;
          filter: blur(80px);
          pointer-events: none;
          z-index: -1;
        }
        .contact-shape-1 {
          top: -10%;
          left: -10%;
          width: 30rem;
          height: 30rem;
          background: rgba(212, 169, 74, 0.08);
        }
        .contact-shape-2 {
          bottom: -10%;
          right: -10%;
          width: 25rem;
          height: 25rem;
          background: rgba(30, 51, 42, 0.04);
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .contact-page { background: #1a2520; }
          .contact-left,
          .contact-form {
            background: #1e293b;
            border-color: #334155;
          }
          .contact-header h1 { color: #f1f5f9; }
          .contact-header p { color: #94a3b8; }
          .contact-info-icon { background: #334155; }
          .contact-info-text { color: #f1f5f9; }
          .contact-info-text span { color: #94a3b8; }
          .contact-form-title { color: #f1f5f9; }
          .contact-form-subtitle { color: #94a3b8; }
          .contact-label { color: #f1f5f9; }
          .contact-input,
          .contact-textarea {
            background: #0f172a;
            border-color: #334155;
            color: #f1f5f9;
          }
          .contact-input:focus,
          .contact-textarea:focus {
            background: #0f172a;
          }
          .contact-submit-btn {
            background: #d4a94a;
            color: #1e332a;
          }
          .contact-submit-btn:hover:not(:disabled) {
            background: #c9a03a;
          }
          .contact-shape-1,
          .contact-shape-2 { display: none; }
        }
      `}</style>

      <div className="contact-page">
        <div className="contact-shape contact-shape-1" />
        <div className="contact-shape contact-shape-2" />

        <div className="contact-container">
          {/* Header */}
          <FadeIn>
            <div className="contact-header">
              <div className="contact-header-badge">— Contact</div>
              <h1>{t("contact.title")}</h1>
              <p>{t("contact.subtitle")}</p>
            </div>
          </FadeIn>

          {/* Main grid */}
          <div className="contact-grid">
            {/* Left: illustration + info */}
            <FadeIn delay={0.1}>
              <div className="contact-left">
                {/* SVG Illustration (replace with your own) */}
                <div className="contact-illustration">
                  <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="10" width="280" height="180" rx="20" fill="#f3f1eb" />
                    <circle cx="150" cy="80" r="40" fill="#d4a94a" opacity="0.2" />
                    <circle cx="150" cy="80" r="25" fill="#d4a94a" opacity="0.4" />
                    <rect x="100" y="130" width="100" height="12" rx="6" fill="#d4a94a" opacity="0.3" />
                    <rect x="120" y="150" width="60" height="8" rx="4" fill="#d4a94a" opacity="0.2" />
                    <path d="M80 140 L220 140 L230 170 L70 170 L80 140Z" fill="#1e332a" opacity="0.1" />
                    <circle cx="110" cy="160" r="6" fill="#1e332a" opacity="0.15" />
                    <circle cx="190" cy="160" r="6" fill="#1e332a" opacity="0.15" />
                  </svg>
                </div>

                <div className="contact-info-list">
                  {contactPoints.map((item, i) => (
                    <div key={i} className="contact-info-item">
                      <div className="contact-info-icon">
                        <item.icon />
                      </div>
                      <div className="contact-info-text">
                        <strong>{item.label}</strong>
                        <span>{item.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Right: form */}
            <FadeIn delay={0.2}>
              <div className="contact-form">
                <div className="contact-form-title">
                  {lang === "fr" ? "Écrivez‑nous" : "اكتب لنا"}
                </div>
                <div className="contact-form-subtitle">
                  {lang === "fr"
                    ? "Nous répondrons dans les 24 heures."
                    : "سنجيب خلال 24 ساعة."}
                </div>

                <form onSubmit={submit}>
                  <div className="contact-form-group">
                    <label className="contact-label">
                      {lang === "fr" ? "Nom complet" : "الاسم الكامل"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullname}
                      onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                      className="contact-input"
                      placeholder={lang === "fr" ? "Jean Dupont" : "جان دوبون"}
                    />
                  </div>

                  <div className="contact-form-group">
                    <label className="contact-label">
                      {lang === "fr" ? "Email" : "البريد الإلكتروني"} *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="contact-input"
                      placeholder="jean@example.com"
                    />
                  </div>

                  <div className="contact-form-group">
                    <label className="contact-label">
                      {lang === "fr" ? "Téléphone" : "رقم الهاتف"} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="contact-input"
                      placeholder={lang === "fr" ? "+212 6 12 34 56 78" : "+212 6 12 34 56 78"}
                    />
                  </div>

                  <div className="contact-form-group">
                    <label className="contact-label">
                      {lang === "fr" ? "Message" : "الرسالة"} *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="contact-textarea"
                      placeholder={lang === "fr" ? "Votre message..." : "رسالتك..."}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="contact-submit-btn"
                  >
                    <Send size={18} />
                    {submitting
                      ? lang === "fr" ? "Envoi..." : "جاري الإرسال..."
                      : lang === "fr" ? "Envoyer" : "إرسال"}
                  </button>
                </form>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </>
  );
}