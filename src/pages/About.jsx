// About.jsx – Hero with background image that fits, no image in story section
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Award, Users, Car, Globe, Clock, Shield, Sparkles } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { FadeIn, ParallaxSection, TiltCard } from "../components/site/Motion3D";

// Replace with your actual image path
import aboutHero from "../assets/smaiti.png";

export default function About() {
  const { t, lang } = useI18n();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const stats = [
    { icon: Car, value: "200+", label: lang === "fr" ? "Véhicules" : "سيارة" },
    { icon: Users, value: "12K+", label: lang === "fr" ? "Clients" : "عميل" },
    { icon: Globe, value: "8", label: lang === "fr" ? "Agences" : "وكالة" },
    { icon: Award, value: "16", label: lang === "fr" ? "Années" : "سنة" },
  ];

  const milestones = [
    { year: "2008", event: lang === "fr" ? "Fondation d'Atlas Rent" : "تأسيس أطلس رنت" },
    { year: "2012", event: lang === "fr" ? "Ouverture de la 3ᵉ agence" : "افتتاح الوكالة الثالثة" },
    { year: "2016", event: lang === "fr" ? "Lancement de la collection premium" : "إطلاق المجموعة الفاخرة" },
    { year: "2020", event: lang === "fr" ? "Extension à 8 villes" : "التوسع إلى 8 مدن" },
  ];

  return (
    <>
      <style>{`
        /* Container & Base */
        .about-page { overflow: hidden; }
        .about-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        @media (max-width: 768px) {
          .about-container { padding: 0 1rem; }
        }

        /* Typography – matches Home */
        .about-text-accent { color: #d4a94a; }
        .about-text-muted { color: #6d7d73; }
        .about-font-display { font-family: 'Inter', sans-serif; }
        .about-font-serif { font-family: 'Playfair Display', serif; }
        .about-font-bold { font-weight: 700; }
        .about-uppercase { text-transform: uppercase; }
        .about-tracking-widest { letter-spacing: 0.1em; }
        .about-text-balance { text-wrap: balance; }
        .about-leading-tight { line-height: 1.05; }

        /* ===== HERO WITH BACKGROUND IMAGE ===== */
        .about-hero {
          position: relative;
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 4rem;
          background: #1e332a; /* fallback */
        }
        /* Image fills the hero, fits perfectly */
        .about-hero-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0.5; /* let the overlay darken it */
        }
        .about-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(30, 51, 42, 0.85) 0%, rgba(30, 51, 42, 0.4) 100%);
        }
        .about-hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: #fff;
          max-width: 56rem;
          padding: 2rem;
        }
        .about-hero-badge {
          display: inline-block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #d4a94a;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 1.5rem;
          background: rgba(212, 169, 74, 0.15);
          padding: 0.4rem 1.5rem;
          border-radius: 9999px;
          border: 1px solid rgba(212, 169, 74, 0.2);
        }
        .about-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: 4rem;
          font-weight: 700;
          line-height: 1.08;
          margin-bottom: 1.5rem;
        }
        .about-hero p {
          font-size: 1.25rem;
          opacity: 0.9;
          max-width: 40rem;
          margin: 0 auto;
          line-height: 1.7;
        }
        @media (max-width: 768px) {
          .about-hero { min-height: 50vh; }
          .about-hero h1 { font-size: 2.5rem; }
        }

        /* ===== STATS (unchanged) ===== */
        .about-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin: 4rem 0;
        }
        @media (min-width: 640px) { .about-stats-grid { gap: 1.5rem; } }
        @media (min-width: 768px) {
          .about-stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .about-stat-card {
          background: #ffffff;
          border: 1px solid #e8e7e2;
          border-radius: 1.5rem;
          padding: 1.75rem 1rem;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
        }
        .about-stat-card:hover {
          border-color: #d4a94a;
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
        }
        .about-stat-icon {
          width: 2.75rem;
          height: 2.75rem;
          margin: 0 auto 0.75rem;
          color: #d4a94a;
        }
        .about-stat-value {
          font-family: 'Inter', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #1e332a;
          line-height: 1.2;
        }
        .about-stat-label {
          font-size: 0.875rem;
          color: #6d7d73;
          margin-top: 0.25rem;
        }
        @media (min-width: 768px) {
          .about-stat-card { padding: 2rem; }
          .about-stat-value { font-size: 2.5rem; }
        }

        /* ===== STORY & MISSION – NO IMAGE ===== */
        .about-story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          margin: 6rem 0;
        }
        @media (max-width: 768px) {
          .about-story-grid { grid-template-columns: 1fr; gap: 2rem; }
        }
        .about-story-text h3 {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #1e332a;
          margin-bottom: 1.5rem;
        }
        .about-story-text p {
          font-size: 1.125rem;
          color: #6d7d73;
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }
        .about-story-text .highlight { color: #d4a94a; font-weight: 600; }

        /* ===== TIMELINE (unchanged) ===== */
        .about-timeline {
          margin: 6rem 0;
          padding: 4rem 0;
          border-top: 1px solid #e8e7e2;
          border-bottom: 1px solid #e8e7e2;
        }
        .about-timeline-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          text-align: center;
        }
        @media (max-width: 768px) {
          .about-timeline-grid { grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        }
        .about-timeline-item {
          padding: 1.5rem;
          border-radius: 1.5rem;
          background: #fcfbf9;
          transition: all 0.3s;
        }
        .about-timeline-item:hover {
          background: #ffffff;
          border-color: #d4a94a;
          box-shadow: 0 8px 20px -5px rgba(0,0,0,0.05);
        }
        .about-timeline-year {
          font-family: 'Inter', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #d4a94a;
          margin-bottom: 0.5rem;
        }
        .about-timeline-event {
          font-size: 1rem;
          color: #1e332a;
          font-weight: 500;
        }

        /* ===== VALUES (unchanged) ===== */
        .about-values-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin: 4rem 0 6rem 0;
        }
        @media (max-width: 768px) {
          .about-values-grid { grid-template-columns: 1fr; }
        }
        .about-value-card {
          background: #ffffff;
          border: 1px solid #e8e7e2;
          border-radius: 1.5rem;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
        }
        .about-value-card:hover {
          border-color: #d4a94a;
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
        }
        .about-value-icon {
          width: 4rem;
          height: 4rem;
          margin: 0 auto 1.25rem;
          background: #d4a94a20;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .about-value-icon svg {
          width: 2rem;
          height: 2rem;
          color: #d4a94a;
        }
        .about-value-title {
          font-family: 'Inter', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e332a;
          margin-bottom: 0.75rem;
        }
        .about-value-desc { color: #6d7d73; line-height: 1.6; }

        /* ===== DARK MODE ===== */
        @media (prefers-color-scheme: dark) {
          .about-stat-card,
          .about-value-card,
          .about-timeline-item {
            background: #1e293b;
            border-color: #334155;
          }
          .about-stat-value,
          .about-value-title,
          .about-timeline-event,
          .about-story-text h3 {
            color: #f1f5f9;
          }
          .about-text-muted,
          .about-stat-label,
          .about-value-desc,
          .about-story-text p {
            color: #94a3b8;
          }
          .about-timeline-item:hover { background: #1e293b; }
        }
      `}</style>

      <div className="about-page">
        {/* ===== HERO WITH BACKGROUND IMAGE (fitted) ===== */}
        <section className="about-hero">
          <img src={aboutHero} alt="Atlas Rent - About" className="about-hero-image" />
          <div className="about-hero-overlay" />
          <div className="about-hero-content">
            <div className="about-hero-badge">
              {lang === "fr" ? "À propos de nous" : "حولنا"}
            </div>
            <h1>{t("about.title")}</h1>
            <p>{t("about.lead")}</p>
          </div>
        </section>

        <div className="about-container">
          {/* ===== STATS ===== */}
          <ParallaxSection>
            <div className="about-stats-grid">
              {stats.map((stat, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div className="about-stat-card">
                    <stat.icon className="about-stat-icon" strokeWidth={1.5} />
                    <div className="about-stat-value">{stat.value}</div>
                    <div className="about-stat-label">{stat.label}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </ParallaxSection>

          {/* ===== STORY & MISSION – NO IMAGE ===== */}
          <div className="about-story-grid">
            <FadeIn>
              <div className="about-story-text">
                <h3>{lang === "fr" ? "Notre histoire" : "قصتنا"}</h3>
                <p>
                  {lang === "fr"
                    ? "Fondée en 2008 par deux passionnés d'automobile, Atlas Rent est née d'une conviction : la location ne doit jamais rimer avec compromis. Aujourd'hui, nous opérons une collection premium dans 8 villes."
                    : "تأسست عام 2008 على يد عاشقَين للسيارات، وُلدت أطلس رنت من قناعة بأن التأجير لا يجب أن يعني التنازل. اليوم، نشغّل مجموعة فاخراً في 8 مدن."}
                </p>
                <p>
                  <span className="highlight">—</span>{" "}
                  {lang === "fr"
                    ? "Chaque véhicule est sélectionné avec soin et entretenu selon les standards les plus exigeants."
                    : "يتم اختيار كل مركبة بعناية وصيانتها وفق أعلى المعايير."}
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="about-story-text">
                <h3>{lang === "fr" ? "Notre mission" : "مهمتنا"}</h3>
                <p>
                  {lang === "fr"
                    ? "Rendre l'expérience de conduite premium accessible à tous, sans paperasse ni mauvaises surprises. Une voiture parfaite, prête à partir, à un prix juste."
                    : "جعل تجربة القيادة الفاخرة في متناول الجميع، بدون أوراق ولا مفاجآت. سيارة مثالية جاهزة للانطلاق بسعر عادل."}
                </p>
              </div>
            </FadeIn>
          </div>

          {/* ===== TIMELINE ===== */}
          <div className="about-timeline">
            <FadeIn>
              <h2 className="about-font-serif about-text-3xl about-font-bold about-text-center" style={{ marginBottom: "3rem", color: "#1e332a" }}>
                {lang === "fr" ? "Notre parcours" : "رحلتنا"}
              </h2>
            </FadeIn>
            <div className="about-timeline-grid">
              {milestones.map((item, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="about-timeline-item">
                    <div className="about-timeline-year">{item.year}</div>
                    <div className="about-timeline-event">{item.event}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* ===== VALUES ===== */}
          <div className="about-values-grid">
            {[
              {
                icon: Shield,
                title: lang === "fr" ? "Fiabilité" : "موثوقية",
                desc: lang === "fr" ? "Des véhicules rigoureusement inspectés et assurés." : "مركبات تم فحصها وتأمينها بدقة."
              },
              {
                icon: Sparkles,
                title: lang === "fr" ? "Excellence" : "تميز",
                desc: lang === "fr" ? "Un service personnalisé et une attention aux détails." : "خدمة شخصية واهتمام بالتفاصيل."
              },
              {
                icon: Clock,
                title: lang === "fr" ? "Réactivité" : "استجابة",
                desc: lang === "fr" ? "Réservation instantanée et assistance disponible 24/7." : "حجز فوري ودعم متاح على مدار الساعة."
              }
            ].map((value, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <TiltCard>
                  <div className="about-value-card">
                    <div className="about-value-icon">
                      <value.icon />
                    </div>
                    <div className="about-value-title">{value.title}</div>
                    <div className="about-value-desc">{value.desc}</div>
                  </div>
                </TiltCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}