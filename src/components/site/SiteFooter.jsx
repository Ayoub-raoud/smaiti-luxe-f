import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../lib/i18n';

export default function SiteFooter() {
  const { t } = useI18n();

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/our-cars', label: t('nav.cars') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const styles = `
    /* Fonts import for a luxury feel */
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap');

    .footer-unique {
      background-color: #10261b;
      position: relative;
      overflow: hidden;
      margin-top: 8rem;
    }

    /* Subtle top-left gold glow */
    .footer-unique::before {
      content: '';
      position: absolute;
      top: -150px;
      left: -150px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(212, 169, 74, 0.07), transparent 70%);
      pointer-events: none;
    }

    .container {
      max-width: 1280px;
      margin-left: auto;
      margin-right: auto;
      padding-left: 2rem;
      padding-right: 2rem;
      position: relative;
      z-index: 5;
    }

    /* Gold divider with diamond */
    .unique-divider {
      position: relative;
      width: 100%;
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(212, 169, 74, 0.3), transparent);
      margin-bottom: 3.5rem;
      border: 0;
    }

    .unique-divider::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
      width: 8px;
      height: 8px;
      background-color: #d4a94a;
      box-shadow: 0 0 10px rgba(212, 169, 74, 0.3);
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
    }

    @media (min-width: 768px) {
      .footer-grid {
        grid-template-columns: 1.5fr 1fr 1fr 1fr; /* Asymmetrical for a premium feel */
        gap: 2.5rem;
      }
    }

    .footer-title {
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 1.5rem;
      color: #d4a94a;
    }

    .unique-hover-link {
      position: relative;
      display: block;
      color: #e5e7eb;
      text-decoration: none;
      transition: color 0.3s ease, transform 0.3s ease;
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
      font-family: 'Inter', sans-serif;
    }

    .unique-hover-link:hover {
      color: #d4a94a;
      transform: translateX(8px);
    }

    .unique-dot {
      display: inline-block;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background-color: #d4a94a;
      margin-right: 12px;
      vertical-align: middle;
    }

    .unique-contact-line {
      display: flex;
      align-items: center;
      margin-bottom: 0.75rem;
      color: #e5e7eb;
      font-size: 0.9rem;
      font-family: 'Inter', sans-serif;
    }

    .footer-bottom-border {
      border-top: 1px solid rgba(255,255,255,0.05);
      margin-top: 4rem;
    }

    .footer-bottom-container {
      padding-top: 1.5rem;
      padding-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      justify-content: space-between;
    }

    @media (min-width: 768px) {
      .footer-bottom-container {
        flex-direction: row;
      }
    }

    .footer-copyright {
      color: rgba(255,255,255,0.4);
      font-size: 0.8rem;
      font-family: 'Inter', sans-serif;
    }

    .footer-cities {
      color: rgba(255,255,255,0.4);
      font-size: 0.7rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-family: 'Inter', sans-serif;
    }
    
    .city-separator {
      color: #d4a94a;
      margin: 0 0.5rem;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <footer className="footer-unique">
        <div className="container" style={{ paddingTop: '5rem', paddingBottom: '0' }}>
          
          {/* Top luxury divider */}
          <div className="unique-divider"></div>

          <div className="footer-grid">
            {/* Column 1: Brand */}
            <div style={{ paddingRight: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ 
                  fontFamily: 'Playfair Display, serif', 
                  fontSize: '2.25rem', 
                  fontWeight: 400, 
                  color: 'white',
                  letterSpacing: '-0.02em'
                }}>
                  Smaïti
                </span>
                <span style={{ 
                  fontFamily: 'Inter, sans-serif', 
                  fontSize: '0.7rem', 
                  fontWeight: 600, 
                  color: '#d4a94a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  marginTop: '0.25rem'
                }}>
                  LUXE CAR
                </span>
              </div>
              <p style={{ 
                color: 'rgba(255,255,255,0.7)', 
                maxWidth: '20rem', 
                fontSize: '0.9rem', 
                lineHeight: '1.6',
                fontFamily: 'Inter, sans-serif'
              }}>
                Location de véhicules de prestige au Maroc.
              </p>
              {/* Premium gold accent bar */}
              <div style={{ width: '40px', height: '2px', background: '#d4a94a', marginTop: '1.5rem' }}></div>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <h4 className="footer-title">Navigation</h4>
              {links.map((link) => (
                <Link key={link.to} to={link.to} className="unique-hover-link">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Column 3: Contact */}
            <div>
              <h4 className="footer-title">Contact</h4>
              <div className="unique-contact-line">
                <span className="unique-dot"></span> +212 5 22 00 00 00
              </div>
              <div className="unique-contact-line">
                <span className="unique-dot"></span> contact@smaitiluxecar.com
              </div>
              <div className="unique-contact-line">
                <span className="unique-dot"></span> Casablanca, Maroc
              </div>
            </div>

            {/* Column 4: Locations (Created to balance the grid beautifully) */}
            <div>
              <h4 className="footer-title">Destinations</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#e5e7eb', fontSize: '0.9rem', fontFamily: 'Inter, sans-serif' }}>
                <div><span className="unique-dot"></span>Casablanca</div>
                <div><span className="unique-dot"></span>Rabat</div>
                <div><span className="unique-dot"></span>Marrakech</div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom-border">
            <div className="container footer-bottom-container">
              <span className="footer-copyright">© 2026 Smaïti Luxe Car — Tous droits réservés.</span>
              <span className="footer-cities">
                CASABLANCA <span className="city-separator">·</span> RABAT <span className="city-separator">·</span> MARRAKECH
              </span>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}