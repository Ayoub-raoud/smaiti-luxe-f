import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, Search } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useSelector } from 'react-redux';
import { selectCars } from '../../Redux/store';
import logo from '../../assets/c.png';

export default function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const cars = useSelector(selectCars);

  // Global Keyboard Listener for 'smaitiluxe'
  useEffect(() => {
    let keyBuffer = '';
    const secretCode = 'smaitiluxe';

    const handleKeyDown = (e) => {
      // Ignore key events originating from input fields or textareas
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      keyBuffer += e.key.toLowerCase();
      if (keyBuffer.length > secretCode.length) {
        keyBuffer = keyBuffer.slice(-secretCode.length);
      }

      if (keyBuffer === secretCode) {
        keyBuffer = '';
        navigate('/admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const getCarImageUrl = (car) => {
    if (!car) return null;
    const possibleImageFields = ['image_url', 'image', 'img_url', 'photo', 'picture', 'car_image'];
    for (const field of possibleImageFields) {
      if (car[field] && typeof car[field] === 'string' && car[field].trim() !== '') {
        let imageUrl = car[field];
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          return imageUrl;
        }
        if (imageUrl.startsWith('/storage/')) {
          return `http://localhost:8000${imageUrl}`;
        }
        if (!imageUrl.startsWith('/')) {
          return `http://localhost:8000/storage/${imageUrl}`;
        }
        return `http://localhost:8000${imageUrl}`;
      }
    }
    return null;
  };

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      setScrolled(currentScrollY > 20);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      const filtered = cars.filter(car =>
        car.brand?.toLowerCase().includes(val.toLowerCase()) ||
        car.model?.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (car) => {
    navigate(`/our-cars?id=${car.id}`);
    setSearchQuery('');
    setSuggestions([]);
    setOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    navigate('/our-cars');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/our-cars?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSuggestions([]);
      setOpen(false);
    }
  };

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/our-cars', label: t('nav.cars') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const headerStyles = `
    .header-clean {
      background: #f7f6f1;
      border-bottom: none;
      transition: transform 0.3s ease;
      overflow: visible !important; /* ensures logo can protrude */
    }
    .container {
      max-width: 1280px;
      margin-left: auto;
      margin-right: auto;
      padding-left: 2rem;
      padding-right: 2rem;
    }
    .nav-link {
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: #1e332a;
      text-decoration: none;
      transition: color 0.2s;
      position: relative;
    }
    .nav-link:hover { color: #0f1a14; }
    .nav-link-active {
      color: #1e332a !important;
      text-decoration: underline;
      text-decoration-color: #d4a94a;
      text-underline-offset: 6px;
      text-decoration-thickness: 2px;
    }
    .btn-book {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      border-radius: 9999px;
      background-color: #1e332a;
      color: white;
      padding: 0.5rem 1.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: background-color 0.2s, transform 0.2s;
    }
    .btn-book:hover {
      background-color: #15261f;
      transform: scale(1.05);
    }

    /* --- SEARCH BAR --- */
    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #e8e7e2;
      border-radius: 9999px;
      padding: 0.1rem 0.1rem 0.1rem 0.75rem;
      border: 1px solid transparent;
      transition: border-color 0.2s;
      width: 260px;
      margin-bottom: 0 !important;
    }
    .search-wrapper:focus-within {
      border-color: #d4a94a;
    }
    .search-input {
      border: none;
      background: transparent;
      padding: 0.2rem 0.2rem;
      font-size: 0.875rem;
      outline: none;
      flex: 1;
      color: #1e332a;
      min-width: 0;
      margin: 0;
    }
    .search-input::placeholder { color: #6d7d73; }
    .search-actions {
      display: flex;
      align-items: center;
      gap: 0.05rem;
    }
    .clear-btn {
      background: transparent;
      border: none;
      color: #6d7d73;
      cursor: pointer;
      padding: 0.25rem 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
      margin: 0;
    }
    .clear-btn:hover {
      color: #1e332a;
      background: rgba(0,0,0,0.05);
    }
    .search-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #1e332a;
      padding: 0.25rem 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
      margin: 0;
    }
    .search-btn:hover { color: #0f1a14; }

    /* --- DROPDOWN --- */
    .search-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #e8e7e2;
      border-radius: 1rem;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
      z-index: 100;
      overflow: hidden;
      padding: 0.25rem 0;
    }
    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      transition: background 0.2s;
      border-bottom: 1px solid #f3f1eb;
    }
    .suggestion-item:last-child { border-bottom: none; }
    .suggestion-item:hover { background: #f7f6f1; }
    .suggestion-img-wrapper {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      background: #f3f1eb;
      border-radius: 0.5rem;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .suggestion-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      mix-blend-mode: multiply;
    }
    .suggestion-img-fallback {
      font-family: 'Inter', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #6d7d73;
      text-transform: uppercase;
    }
    .suggestion-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }
    .suggestion-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #1e332a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .suggestion-detail {
      font-size: 0.7rem;
      color: #6d7d73;
    }
    .suggestion-price {
      font-size: 0.8rem;
      font-weight: 700;
      color: #1e332a;
      white-space: nowrap;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      line-height: 1.2;
    }
    .suggestion-price span {
      font-size: 0.6rem;
      font-weight: 400;
      color: #6d7d73;
    }
    .suggestion-empty {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: #6d7d73;
      text-align: center;
    }

    .mobile-menu-btn {
      padding: 0.5rem;
      border-radius: 9999px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #1e332a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .lang-pill {
      background: #1e332a;
      color: white;
      border-radius: 9999px;
      padding: 0.25rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: transform 0.2s, background 0.2s;
    }
    .lang-pill:hover { background: #15261f; }
    .lang-text {
      background: transparent;
      border: none;
      color: #1e332a;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0.25rem 0.75rem;
      transition: color 0.2s;
    }
    .lang-text:hover { color: #0f1a14; }

    @media (min-width: 1024px) {
      .mobile-menu-btn { display: none !important; }
      .desktop-nav { display: flex !important; }
      .desktop-search { display: flex !important; }
    }
    @media (max-width: 1023px) {
      .desktop-nav { display: none !important; }
      .desktop-search { display: none !important; }
      .search-wrapper { width: 100%; }
    }

    .header-grid {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-left { flex: 0 0 auto; display: flex; align-items: center; gap: 0.25rem; }
    .header-center {
      flex: 1;
      display: flex;
      justify-content: center;
      position: relative; /* needed for absolute logo positioning */
    }
    .header-right { flex: 0 0 auto; display: flex; align-items: center; gap: 1rem; }

    /* ===== LOGO – POPS OUT FROM BOTTOM ===== */
    .logo-wrapper {
      position: absolute;
      bottom: -3.5rem;            /* extend below header */
      left: 50%;
      transform: translateX(-50%);
      background: #ffffff;
      border: 1px solid #e8e7e2;
      border-radius: 16px;
      box-shadow:
        0 12px 28px -6px rgba(0,0,0,0.25),
        inset 0 1px 0 rgba(255,255,255,0.8);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      text-decoration: none;
      padding: 2.7rem 1.8rem;
      min-width: 150px;
      height: 4.5rem;              /* tall enough to house the image */
    }
    .logo-wrapper:hover {
      transform: translateX(-50%) translateY(-4px) scale(1.05);
      box-shadow: 0 16px 32px -8px rgba(0,0,0,0.3);
    }
    .logo-img {
      height: 3rem;                /* image size in rem → scales with zoom */
      width: auto;
      max-height: 3rem;
      max-width: 200px;
      object-fit: contain;
      display: block;
    }

    @media (max-width: 767px) {
      .container { padding-left: 1rem; padding-right: 1rem; }
      .logo-wrapper {
        bottom: -3rem;
        height: 4rem;
        min-width: 110px;
        padding: 0.3rem 1rem;
        border-radius: 12px;
        box-shadow: 0 8px 18px -4px rgba(0,0,0,0.2);
      }
      .logo-img {
        height: 2.5rem;
        max-height: 2.5rem;
      }
      .header-right { gap: 0.5rem; }
      .lang-pill, .lang-text { font-size: 0.7rem; }
      .header-right .btn-book { display: none !important; }
    }
  `;

  return (
    <>
      <style>{headerStyles}</style>
      <header
        className="header-clean"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '0.75rem 0',
          transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        }}
      >
        <div className="container header-grid">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="header-center">
            <Link to="/" className="logo-wrapper">
              <img src={logo} alt="SmitiCar" className="logo-img" />
            </Link>
          </div>

          <div className="header-right">
            <form onSubmit={handleSearchSubmit} className="search-wrapper desktop-search">
              <input
                type="text"
                placeholder={lang === 'fr' ? 'Rechercher...' : 'بحث...'}
                value={searchQuery}
                onChange={handleSearchInput}
                className="search-input"
                autoComplete="off"
              />
              <div className="search-actions">
                {searchQuery && (
                  <button type="button" className="clear-btn" onClick={handleClearSearch} aria-label="Clear search">
                    <X size={16} />
                  </button>
                )}
                <button type="submit" className="search-btn">
                  <Search size={18} />
                </button>
              </div>

              {suggestions.length > 0 && (
                <div className="search-dropdown">
                  {suggestions.map((car) => {
                    const imageUrl = getCarImageUrl(car);
                    const price = car.price_per_day || car.daily_price || 0;
                    const isAvailable = car.status === 'disponible';

                    return (
                      <div
                        key={car.id}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(car)}
                      >
                        <div className="suggestion-img-wrapper">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={`${car.brand} ${car.model}`}
                              className="suggestion-img"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                            />
                          ) : null}
                          <div
                            className="suggestion-img-fallback"
                            style={{ display: imageUrl ? 'none' : 'flex' }}
                          >
                            {car.brand?.[0] || car.model?.[0] || 'C'}
                          </div>
                        </div>
                        <div className="suggestion-info">
                          <div className="suggestion-name">{car.brand} {car.model}</div>
                          <div className="suggestion-detail">
                            {car.year || ''}
                            {car.year ? ' • ' : ''}
                            {isAvailable
                              ? (lang === "fr" ? "Disponible" : "متاح")
                              : (lang === "fr" ? "Indisponible" : "غير متاح")}
                          </div>
                        </div>
                        <div className="suggestion-price">
                          {price.toLocaleString()} MAD
                          <span>/ {lang === "fr" ? "jour" : "يوم"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setLang('fr')} className={lang === 'fr' ? 'lang-pill' : 'lang-text'}>FR</button>
              <button onClick={() => setLang('ar')} className={lang === 'ar' ? 'lang-pill' : 'lang-text'}>AR</button>
            </div>

            <Link to="/our-cars" className="btn-book">{t('nav.book')}</Link>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ background: '#f7f6f1', marginTop: '0.75rem' }}
            >
              <div className="container" style={{ paddingTop: '1rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    style={({ isActive }) => ({
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: 500,
                      background: isActive ? '#e8e7e2' : 'transparent',
                      color: '#1e332a',
                      textDecoration: isActive ? 'underline' : 'none',
                      textUnderlineOffset: '4px',
                      textDecorationColor: '#d4a94a',
                      textDecorationThickness: '2px',
                    })}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}

                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', width: '100%' }}>
                  <input
                    type="text"
                    placeholder={lang === 'fr' ? 'Rechercher...' : 'بحث...'}
                    value={searchQuery}
                    onChange={handleSearchInput}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: '9999px',
                      border: '1px solid transparent',
                      fontSize: '1rem',
                      outline: 'none',
                      background: '#e8e7e2',
                      minWidth: '120px',
                    }}
                  />

                  {suggestions.length > 0 && (
                    <div style={{ width: '100%', background: '#fff', borderRadius: '0.5rem', marginTop: '0.5rem', border: '1px solid #e8e7e2', maxHeight: '300px', overflowY: 'auto' }}>
                      {suggestions.map((car) => {
                        const imageUrl = getCarImageUrl(car);
                        const price = car.price_per_day || car.daily_price || 0;
                        return (
                          <div
                            key={car.id}
                            onClick={() => handleSuggestionClick(car)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f3f1eb' }}
                          >
                            <div style={{ width: '40px', height: '40px', borderRadius: '0.4rem', background: '#f3f1eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                              {imageUrl ? (
                                <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
                              ) : (
                                <span style={{ fontWeight: 'bold', color: '#6d7d73' }}>{car.brand?.[0] || 'C'}</span>
                              )}
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1e332a' }}>{car.brand} {car.model}</span>
                              <span style={{ fontSize: '0.7rem', color: '#6d7d73' }}>{car.year || ''}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e332a', whiteSpace: 'nowrap' }}>
                              {price.toLocaleString()} MAD
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', flex: '0 0 auto' }}>
                    {searchQuery && (
                      <button type="button" onClick={handleClearSearch} style={{ padding: '0.75rem', borderRadius: '9999px', background: '#e8e7e2', color: '#1e332a', border: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                      </button>
                    )}
                    <button type="submit" style={{ padding: '0.75rem', borderRadius: '9999px', background: '#1e332a', color: 'white', border: 'none', cursor: 'pointer' }}>
                      <Search size={20} />
                    </button>
                  </div>
                </form>

                <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0' }}>
                  <button onClick={() => { setLang('fr'); setOpen(false); }} className={lang === 'fr' ? 'lang-pill' : 'lang-text'} style={{ fontSize: '1rem' }}>FR</button>
                  <button onClick={() => { setLang('ar'); setOpen(false); }} className={lang === 'ar' ? 'lang-pill' : 'lang-text'} style={{ fontSize: '1rem' }}>AR</button>
                </div>
                <Link to="/our-cars" className="btn-book" style={{ marginTop: '0.5rem', textAlign: 'center', width: '100%' }} onClick={() => setOpen(false)}>
                  {t('nav.book')}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}