import React, { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { useLocation } from 'react-router-dom';
import { FadeIn, TiltCard } from "../components/site/Motion3D";
import { BookingModal } from "../components/BookingModal";
import {
  fetchCars,
  selectCars,
  selectCarsLoading,
} from "../Redux/store";
import { toast } from "sonner";
import { getImageUrl } from '../utils/imageUtils';

// Helper to convert color names to hex
const getColorHex = (colorName) => {
  if (!colorName) return '#cccccc';
  const colorMap = {
    // English
    red: '#FF0000',
    blue: '#0000FF',
    green: '#008000',
    yellow: '#FFFF00',
    black: '#000000',
    white: '#FFFFFF',
    silver: '#C0C0C0',
    gray: '#808080',
    grey: '#808080',
    // French
    rouge: '#FF0000',
    bleu: '#0000FF',
    vert: '#008000',
    jaune: '#FFFF00',
    noir: '#000000',
    blanc: '#FFFFFF',
    argent: '#C0C0C0',
    gris: '#808080',
    // Arabic
    أحمر: '#FF0000',
    أزرق: '#0000FF',
    أخضر: '#008000',
    أصفر: '#FFFF00',
    أسود: '#000000',
    أبيض: '#FFFFFF',
    فضي: '#C0C0C0',
    رمادي: '#808080',
    // Spanish
    rojo: '#FF0000',
    azul: '#0000FF',
    verde: '#008000',
    amarillo: '#FFFF00',
    negro: '#000000',
    blanco: '#FFFFFF',
    plata: '#C0C0C0',
    gris: '#808080',
  };
  const trimmed = colorName.trim();
  // Check if it's already a hex or rgb
  if (/^#([0-9a-f]{3}){1,2}$/i.test(trimmed)) return trimmed;
  if (/^rgb\(/.test(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  return colorMap[lower] || '#cccccc';
};

export default function Cars() {
  const dispatch = useDispatch();
  const { t, lang } = useI18n();
  const [params] = useSearchParams();
  const cars = useSelector(selectCars);
  const carsLoading = useSelector(selectCarsLoading);
  const [selectedCar, setSelectedCar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    dispatch(fetchCars());
  }, [dispatch]);

  useEffect(() => {
    const id = params.get("id");
    if (id && cars.length > 0) {
      const car = cars.find((x) => x.id === parseInt(id));
      if (car) {
        setSelectedCar(car);
        setIsModalOpen(true);
      }
    }
  }, [params, cars]);

  // ---- Search filter ----
  const searchTerm = params.get("search");
  const filteredCars = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return cars;
    const term = searchTerm.trim().toLowerCase();
    return cars.filter(car =>
      car.brand?.toLowerCase().includes(term) ||
      car.model?.toLowerCase().includes(term) ||
      car.year?.toString().includes(term) ||
      car.color?.toLowerCase().includes(term)
    );
  }, [cars, searchTerm]);

  // Top 20 Most Reserved Cars for "Nos exclusivités"
  const topReservedCars = useMemo(() => {
    return [...filteredCars]
      .sort((a, b) => {
        const countA = a.reservations_count || a.booking_count || a.bookings_count || a.count_reservations || 0;
        const countB = b.reservations_count || b.booking_count || b.bookings_count || b.count_reservations || 0;
        return countB - countA;
      })
      .slice(0, 20);
  }, [filteredCars]);

  // Featured cars: items where is_featured is true
  const featuredCars = useMemo(() => {
    return filteredCars.filter(car => Boolean(car.is_featured));
  }, [filteredCars]);

  // Cars that are not featured
  const nonFeaturedCars = useMemo(() => {
    return filteredCars.filter(car => !car.is_featured);
  }, [filteredCars]);

  const popularCars = useMemo(() => nonFeaturedCars.slice(0, 4), [nonFeaturedCars]);
  const infiniteCars = useMemo(() => nonFeaturedCars.slice(4, 12), [nonFeaturedCars]);
  const restCars = useMemo(() => nonFeaturedCars.slice(12), [nonFeaturedCars]);

  // ---- Helper: get image URL ----
  const getCarImage = (car) => {
  if (!car) return null;
  const fields = ['image_url', 'image', 'img_url', 'photo', 'picture', 'car_image'];
  for (const field of fields) {
    const val = car[field];
    if (typeof val === 'string' && val.trim()) {
      return getImageUrl(val);
    }
  }
  return null;
};

  const handleImageError = (carId) => {
    setImageErrors(prev => ({ ...prev, [carId]: true }));
  };

  const openModal = (car) => {
    if (car.status !== 'disponible') {
      toast.warning(lang === "fr" ? "Ce véhicule n'est pas disponible pour le moment." : "هذه السيارة غير متاحة حالياً.");
      return;
    }
    setSelectedCar(car);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCar(null);
  };

  const renderCarCard = (car, disableClick = false) => {
    const carImage = getCarImage(car);
    const hasError = imageErrors[car.id];
    const price = car.price_per_day || car.daily_price || 0;
    const isDisponible = car.status === 'disponible';

    const handleCardClick = () => {
      if (!disableClick && isDisponible) {
        openModal(car);
      }
    };

    return (
      <TiltCard key={car.id}>
        <div
          className={`car-card ${!isDisponible ? 'car-card-disabled' : (disableClick ? '' : 'car-card-clickable')}`}
          onClick={handleCardClick}
        >
          <div className="car-image-top">
            {carImage && !hasError ? (
              <img
                src={carImage}
                alt={`${car.brand} ${car.model}`}
                onError={() => handleImageError(car.id)}
              />
            ) : (
              <div className="car-image-fallback">
                <div className="car-fallback-letter">
                  {car.brand?.[0] || car.model?.[0] || "C"}
                </div>
              </div>
            )}
            <div className={`status-badge ${isDisponible ? 'disponible' : 'non-disponible'}`}>
              {isDisponible ? (lang === "fr" ? "Disponible" : "متاح") : (lang === "fr" ? "Non disponible" : "غير متاح")}
            </div>
          </div>

          <div className="card-content">
            <div>
              <div className="car-brand">{car.brand}</div>
              <div className="car-model">{car.model}</div>
              {car.year && (
                <div className="car-year">{car.year}</div>
              )}
              {car.color && (
                <div className="car-color">
                  <span 
                    className="color-dot" 
                    style={{ backgroundColor: getColorHex(car.color) }}
                  />
                  <span className="color-name">{car.color}</span>
                </div>
              )}
            </div>
            <div className="car-footer">
              <div className="car-price-wrapper">
                <span className="car-price">{price.toLocaleString()}MAD</span>
                <span className="car-price-label">/ {lang === "fr" ? "jour" : "يوم"}</span>
              </div>
              <button
                type="button"
                className="reserve-btn"
                disabled={!isDisponible}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDisponible) openModal(car);
                }}
              >
                {lang === "fr" ? "Réserver" : "احجز"}
              </button>
            </div>
          </div>
        </div>
      </TiltCard>
    );
  };

  // ---- 1. Featured Carousel ("Nos exclusivités" - Top 20 Most Reserved) ----
  const FeaturedCarousel = () => {
    const [page, setPage] = useState(0);
    const itemsPerPage = 4;
    const totalPages = Math.ceil(topReservedCars.length / itemsPerPage);
    const visibleCars = topReservedCars.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    const goPrev = () => setPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
    const goNext = () => setPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));

    if (topReservedCars.length === 0) return null;

    return (
      <section className="carousel-section manual">
        <h2 className="section-title">{lang === "fr" ? "Nos exclusivités" : "حصرياتنا"}</h2>
        <div className="carousel-wrapper">
          <button className="carousel-nav" onClick={goPrev}><ChevronLeft size={24} /></button>
          <div className="carousel-viewport">
            <div className="carousel-track-4">
              {visibleCars.map(car => renderCarCard(car))}
            </div>
          </div>
          <button className="carousel-nav" onClick={goNext}><ChevronRight size={24} /></button>
        </div>
        {totalPages > 1 && (
          <div className="carousel-dots">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} className={`carousel-dot ${i === page ? 'active' : ''}`} onClick={() => setPage(i)} />
            ))}
          </div>
        )}
      </section>
    );
  };

  // ---- 2. Popular Grid ----
  const PopularGrid = () => {
    if (popularCars.length === 0) return null;
    return (
      <section className="grid-section">
        <h2 className="section-title">{lang === "fr" ? "Les plus demandés" : "الأكثر طلباً"}</h2>
        <div className="grid-2">
          {popularCars.map(car => renderCarCard(car))}
        </div>
      </section>
    );
  };

  // ---- 3. Infinite Loop Carousel ("En mouvement") ----
  const InfiniteCarousel = () => {
    const [direction, setDirection] = useState(lang === 'ar' ? -1 : 1);
    const [isPaused, setIsPaused] = useState(false);
    const animationRef = useRef(null);
    const [offset, setOffset] = useState(0);
    const speed = 0.6;

    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);

    const trackRef = useRef(null);
    const [totalWidth, setTotalWidth] = useState(0);

    const movingCars = useMemo(() => {
      const featured = filteredCars.filter(car => Boolean(car.is_featured));
      return featured.length > 0 ? featured : infiniteCars;
    }, [filteredCars]);

    const loopCars = [...movingCars, ...movingCars, ...movingCars];

    useEffect(() => {
      if (trackRef.current && movingCars.length > 0) {
        const fullWidth = trackRef.current.scrollWidth / 3;
        setTotalWidth(fullWidth);
        setOffset(-fullWidth);
      }
    }, [movingCars]);

    useEffect(() => {
      if (!totalWidth || movingCars.length === 0) return;

      const animate = () => {
        if (!isPaused && !isDragging) {
          setOffset((prev) => {
            let newOffset = prev + direction * speed;
            if (newOffset > 0) newOffset -= totalWidth;
            if (newOffset < -totalWidth) newOffset += totalWidth;
            return newOffset;
          });
        }
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }, [direction, isPaused, isDragging, totalWidth, movingCars.length]);

    const correctOffset = (val) => {
      let newVal = val;
      if (newVal > 0) newVal -= totalWidth;
      if (newVal < -totalWidth) newVal += totalWidth;
      return newVal;
    };

    const handleMouseDown = (e) => {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragOffset(0);
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const delta = e.clientX - dragStartX;
      setDragOffset(delta);
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      const threshold = 20;
      if (dragOffset > threshold) {
        setDirection(1);
      } else if (dragOffset < -threshold) {
        setDirection(-1);
      }
      setOffset((prev) => correctOffset(prev + dragOffset));
      setDragOffset(0);
    };

    const handleTouchStart = (e) => {
      setIsDragging(true);
      setDragStartX(e.touches[0].clientX);
      setDragOffset(0);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      const delta = e.touches[0].clientX - dragStartX;
      setDragOffset(delta);
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      const threshold = 20;
      if (dragOffset > threshold) {
        setDirection(1);
      } else if (dragOffset < -threshold) {
        setDirection(-1);
      }
      setOffset((prev) => correctOffset(prev + dragOffset));
      setDragOffset(0);
    };

    if (movingCars.length === 0) return null;

    return (
      <section className="carousel-section infinite">
        <h2 className="section-title">{lang === "fr" ? "En mouvement" : "في حركة مستمرة"}</h2>
        <div
          className="infinite-wrapper"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="infinite-viewport">
            <div
              ref={trackRef}
              className="infinite-track"
              style={{
                transform: `translateX(${offset + (isDragging ? dragOffset : 0)}px)`,
                cursor: 'grab',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {loopCars.map((car, idx) => (
                <div key={`${car.id}-${idx}`} className="infinite-item">
                  {renderCarCard(car, true)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="infinite-hint">
          {lang === "fr" ? "Glissez pour changer de direction" : "اسحب لتغيير الاتجاه"}
        </div>
      </section>
    );
  };



  // ---- 5. All Cars Grid ----
  const AllCarsGrid = () => {
    if (filteredCars.length === 0) return null;
    return (
      <section className="grid-section">
        <h2 className="section-title">{lang === "fr" ? "Tous nos véhicules" : "جميع مركباتنا"}</h2>
        <div className="grid-3">
          {filteredCars.map(car => renderCarCard(car))}
        </div>
      </section>
    );
  };

  if (carsLoading) {
    return (
      <div className="container py-16 md:py-24">
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* ===== BASE ===== */
        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        @media (min-width: 640px) { .container { padding: 0 1.5rem; } }
        @media (min-width: 1024px) { .container { padding: 0 2rem; } }
        .py-16 { padding-top: 4rem; padding-bottom: 4rem; }
        .py-24 { padding-top: 6rem; padding-bottom: 6rem; }
        .max-w-2xl { max-width: 42rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-16 { margin-bottom: 4rem; }
        .text-sm { font-size: 0.875rem; }
        .font-semibold { font-weight: 600; }
        .text-accent { color: #d4a94a; }
        .uppercase { text-transform: uppercase; }
        .tracking-widest { letter-spacing: 0.1em; }
        .mb-4 { margin-bottom: 1rem; }
        .font-display { font-family: 'Inter', sans-serif; }
        .text-4xl { font-size: 2.25rem; }
        .font-bold { font-weight: 700; }
        .text-balance { text-wrap: balance; }
        .text-lg { font-size: 1.125rem; }
        .text-muted-foreground { color: #6d7d73; }
        .mt-4 { margin-top: 1rem; }

        /* ===== CAR CARD ===== */
        .car-card {
          background: #fff;
          border-radius: 1.5rem;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid transparent;
          cursor: default;
          display: flex;
          flex-direction: column;
          height: 100%;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          box-sizing: border-box;
          width: 100%;
        }
        .car-card-clickable {
          cursor: pointer;
        }
        .car-card:hover:not(.car-card-disabled) {
          border-color: #d4a94a;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
        }
        .car-card-disabled {
          cursor: not-allowed;
          opacity: 0.85;
        }
        .car-card-disabled:hover {
          border-color: transparent;
          box-shadow: none;
        }
        .car-image-top {
          background: #f3f1eb;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 1.5rem;
        }
        @media (min-width: 768px) {
          .car-image-top { height: 240px; }
        }
        .car-image-top img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          mix-blend-mode: multiply;
          border-radius: 20px;
        }
        .status-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          z-index: 10;
          padding: 0.25rem 1rem;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .status-badge.disponible {
          background: #d4a94a;
          color: #1e332a;
        }
        .status-badge.non-disponible {
          background: #1e332a;
          color: #fff;
        }
        .card-content {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .car-brand {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6d7d73;
          font-weight: 600;
          margin-bottom: 0.1rem;
        }
        .car-model {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e332a;
          margin-bottom: 0.1rem;
          line-height: 1.2;
        }
        .car-year {
          font-size: 0.8rem;
          font-weight: 500;
          color: #6d7d73;
          margin-bottom: 0.25rem;
          font-family: 'Inter', sans-serif;
        }
        /* ---- Color swatch ---- */
        .car-color {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.75rem;
        }
        .color-dot {
          display: inline-block;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.08);
          flex-shrink: 0;
        }
        .color-name {
          font-size: 0.7rem;
          color: #6d7d73;
          text-transform: capitalize;
        }
        .car-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding-top: 1rem;
          margin-top: auto;
          border-top: 1px solid #f3f1eb;
        }
        .car-price-wrapper {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }
        .car-price {
          font-family: 'Inter', sans-serif;
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e332a;
        }
        .car-price-label {
          font-size: 0.75rem;
          color: #6d7d73;
        }
        .reserve-btn {
          background: #1e332a;
          color: #fff;
          border: none;
          padding: 0.5rem 1.2rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.05em;
        }
        .reserve-btn:hover:not(:disabled) {
          background: #0f1a14;
          transform: translateY(-1px);
        }
        .reserve-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .car-image-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f1eb;
        }
        .car-fallback-letter {
          font-family: 'Inter', sans-serif;
          font-size: 5rem;
          font-weight: 900;
          color: rgba(30, 51, 42, 0.1);
        }

        /* ===== SECTION TITLES ===== */
        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          color: #1e332a;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        @media (min-width: 768px) {
          .section-title { font-size: 2.5rem; }
        }

        /* ===== FEATURED CAROUSEL ===== */
        .carousel-section {
          margin-bottom: 4rem;
        }
        .carousel-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .carousel-viewport {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .carousel-track-4 {
          display: flex;
          gap: 1rem;
          width: 100%;
        }
        .carousel-track-4 > * {
          flex: 1;
          min-width: 0;
        }
        @media (max-width: 640px) {
          .carousel-track-4 {
            flex-wrap: wrap;
          }
          .carousel-track-4 > * {
            flex: 0 0 100%;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .carousel-track-4 > * {
            flex: 0 0 calc(50% - 0.5rem);
          }
        }
        .carousel-nav {
          background: rgba(30, 51, 42, 0.85);
          color: #fff;
          border: none;
          border-radius: 9999px;
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          z-index: 5;
        }
        .carousel-nav:hover {
          background: #d4a94a;
          color: #1e332a;
          transform: scale(1.05);
        }
        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
        }
        .carousel-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background: #d1d5db;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          padding: 0;
        }
        .carousel-dot.active {
          width: 2rem;
          background: #d4a94a;
        }

        /* ===== GRIDS ===== */
        .grid-section {
          margin-bottom: 4rem;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (max-width: 640px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        @media (max-width: 640px) {
          .grid-3 {
            grid-template-columns: 1fr;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* ===== INFINITE LOOP ===== */
        .infinite-wrapper {
          position: relative;
          overflow: hidden;
          padding: 0.5rem 0;
        }
        .infinite-viewport {
          overflow: hidden;
          width: 100%;
          direction: ltr; /* keep DOM order LTR */
        }
        .infinite-track {
          display: flex;
          gap: 1rem;
          will-change: transform;
          cursor: grab;
          user-select: none;
          -webkit-user-select: none;
          direction: ltr;
        }
        .infinite-track:active {
          cursor: grabbing;
        }
        .infinite-item {
          flex: 0 0 220px;
          width: 220px;
        }
        @media (min-width: 768px) {
          .infinite-item {
            flex: 0 0 260px;
            width: 260px;
          }
        }
        .infinite-hint {
          text-align: center;
          font-size: 0.85rem;
          color: #6d7d73;
          margin-top: 0.75rem;
        }

        /* ===== DARK MODE ===== */
        @media (prefers-color-scheme: dark) {
          .car-card { background: #1e293b; border-color: #334155; }
          .car-model, .car-price { color: #f1f5f9; }
          .car-brand { color: #94a3b8; }
          .car-year { color: #94a3b8; }
          .car-footer { border-color: #334155; }
          .car-image-top { background: #0f172a; }
          .car-image-fallback { background: #0f172a; }
          .car-fallback-letter { color: rgba(255,255,255,0.1); }
          .section-title { color: #f1f5f9; }
          .text-muted-foreground { color: #94a3b8; }
          .carousel-nav { background: rgba(30, 51, 42, 0.6); }
          .carousel-dot { background: #374151; }
          .carousel-dot.active { background: #d4a94a; }
          .infinite-hint { color: #94a3b8; }
          .color-name { color: #94a3b8; }
        }
      `}</style>

      <div className="container py-16 md:py-24">
        <FadeIn>
          <div className="max-w-2xl mb-8 md:mb-16">
            <div className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">
              — {lang === "fr" ? "Catalogue" : "الكتالوج"}
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-balance">
              {t("cars.title")}
            </h1>
            <p className="text-lg text-muted-foreground mt-4">{t("cars.subtitle")}</p>
          </div>
        </FadeIn>

        {filteredCars.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {lang === "fr" ? "Aucun véhicule trouvé" : "لم يتم العثور على مركبات"}
          </div>
        ) : (
          <>
            <FeaturedCarousel />
            <PopularGrid />
            <InfiniteCarousel />
            <AllCarsGrid />
          </>
        )}
      </div>

      <BookingModal car={selectedCar} onClose={closeModal} />
    </>
  );
}