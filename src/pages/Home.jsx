// Home.jsx – Premium split‑layout hero with refined design
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowRight, Sparkles, Zap, Headphones, Calendar, MapPin, Shield, Star,
  Car, ChevronLeft, ChevronRight
} from "lucide-react";
import { useLocation } from 'react-router-dom';
import { useI18n } from "../lib/i18n";
import { ParallaxSection, FadeIn, TiltCard } from "../components/site/Motion3D";
import {
  fetchCars,
  fetchReservations,
  selectCars,
  selectReservations,
  selectCarsLoading,
} from "../Redux/store";
import { toast } from "sonner";
import heroCar from "../assets/hero-car.jpg";
import { BookingModal } from "../components/BookingModal";

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
  if (/^#([0-9a-f]{3}){1,2}$/i.test(trimmed)) return trimmed;
  if (/^rgb\(/.test(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  return colorMap[lower] || '#cccccc';
};

export default function Home() {
  const dispatch = useDispatch();
  const { t, lang } = useI18n();
  const cars = useSelector(selectCars);
  const reservations = useSelector(selectReservations);
  const loading = useSelector(selectCarsLoading);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselCars, setCarouselCars] = useState([]);
  const [heroStartingPrice, setHeroStartingPrice] = useState(0);

  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [imageErrors, setImageErrors] = useState({});
  const [brandLogoErrors, setBrandLogoErrors] = useState({});
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    dispatch(fetchCars());
    dispatch(fetchReservations());
  }, [dispatch]);

  useEffect(() => {
    if (cars.length > 0 && reservations.length > 0) {
      const reservationCount = {};
      reservations.forEach(reservation => {
        const carId = reservation.car_id;
        if (carId) {
          reservationCount[carId] = (reservationCount[carId] || 0) + 1;
        }
      });
      const carsWithReservationCount = cars.map(car => ({
        ...car,
        reservationCount: reservationCount[car.id] || 0
      }));
      carsWithReservationCount.sort((a, b) => b.reservationCount - a.reservationCount);
      const topCars = carsWithReservationCount.slice(0, 12);
      if (topCars.length > 0) {
        setCarouselCars(topCars);
        if (topCars[currentImageIndex]) {
          setHeroStartingPrice(topCars[currentImageIndex].price_per_day || topCars[currentImageIndex].daily_price || 0);
        }
      } else if (cars.length > 0) {
        setCarouselCars(cars.slice(0, 12));
        if (cars[currentImageIndex]) {
          setHeroStartingPrice(cars[currentImageIndex].price_per_day || cars[currentImageIndex].daily_price || 0);
        }
      }
    } else if (cars.length > 0) {
      setCarouselCars(cars.slice(0, 12));
      if (cars[currentImageIndex]) {
        setHeroStartingPrice(cars[currentImageIndex].price_per_day || cars[currentImageIndex].daily_price || 0);
      }
    }
  }, [cars, reservations, currentImageIndex]);

  useEffect(() => {
    if (carouselCars.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % carouselCars.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselCars.length]);

  const brandGroups = useMemo(() => {
    const counts = {};
    cars.forEach(car => {
      const brand = car.brand || 'Unknown';
      counts[brand] = (counts[brand] || 0) + 1;
    });
    return Object.entries(counts).map(([brand, count]) => ({ brand, count }));
  }, [cars]);

  const getBrandLogoUrl = (brand) => {
  if (!brand) return null;

  const slug = brand.toLowerCase().trim().replace(/\s+/g, "");

  const specialUrls = {
    mercedes: "https://cdn.jsdelivr.net/npm/simple-icons/icons/mercedes.svg",
    "mercedes-benz": "https://cdn.jsdelivr.net/npm/simple-icons/icons/mercedes.svg",
  };

  if (specialUrls[slug]) {
    return specialUrls[slug];
  }

  const specialSlugs = {
    citroën: "citroen",
    volkswagen: "volkswagen",
  };

  const finalSlug = specialSlugs[slug] || slug;

  return `https://cdn.simpleicons.org/${finalSlug}`;
};

  const handleBrandLogoError = (brand) => {
    setBrandLogoErrors(prev => ({ ...prev, [brand]: true }));
  };

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

  const handleCarImageError = (carId) => {
    setImageErrors(prev => ({ ...prev, [carId]: true }));
  };

  const openModal = (car) => {
    if (car.status !== 'disponible') {
      toast.warning(lang === "fr" ? "Ce véhicule n'est pas disponible pour le moment." : "هذه السيارة غير متاحة حالياً.");
      return;
    }
    setSelected(car);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelected(null);
  };

  const features = [
    { 
      icon: Sparkles, 
      title: lang === "fr" ? "Véhicules premium" : "مركبات فاخرة", 
      desc: lang === "fr" 
        ? "Une collection exclusive entretenue avec soin." 
        : "مجموعة حصرية يتم صيانته بعناية." 
    },
    { 
      icon: Zap, 
      title: lang === "fr" ? "Réservation rapide" : "حجز سريع", 
      desc: lang === "fr" 
        ? "Formulaire simple en moins de 60 secondes." 
        : "نموذج بسيط في أقل من 60 ثانية." 
    },
    { 
      icon: Headphones, 
      title: lang === "fr" ? "Support 24/7" : "دعم على مدار الساعة", 
      desc: lang === "fr" 
        ? "Une équipe dédiée à votre service." 
        : "فريق مخصص لخدمتك." 
    }
  ];

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .home-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        @media (max-width: 768px) {
          .home-container { padding: 0 1rem; }
        }

        /* ========================================================== */
        /*  PREMIUM SPLIT HERO – left text, right carousel            */
        /* ========================================================== */
        .hero-section {
          position: relative;
          min-height: 90vh;
          display: flex;
          align-items: center;
          background: linear-gradient(145deg, #f8f6f2 0%, #f0ede7 100%);
          overflow: hidden;
          padding: 3rem 0;
        }
        @media (max-width: 768px) {
          .hero-section {
            min-height: auto;
            padding: 4rem 0;
          }
        }

        /* Subtle decorative blobs */
        .hero-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(100px);
          pointer-events: none;
          opacity: 0.4;
        }
        .hero-blob-1 {
          top: -20%;
          right: -10%;
          width: 40rem;
          height: 40rem;
          background: rgba(212, 169, 74, 0.15);
          animation: floatBlob 12s ease-in-out infinite alternate;
        }
        .hero-blob-2 {
          bottom: -30%;
          left: -10%;
          width: 30rem;
          height: 30rem;
          background: rgba(30, 51, 42, 0.06);
          animation: floatBlob 14s ease-in-out infinite alternate-reverse;
        }
        @keyframes floatBlob {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-40px, 40px) scale(1.15); }
        }

        .hero-content-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 4rem;
          align-items: center;
        }
        @media (max-width: 1024px) {
          .hero-content-wrapper {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
        }

        /* ----- LEFT COLUMN: Text ----- */
        .hero-text {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #d4a94a;
          background: rgba(212, 169, 74, 0.1);
          padding: 0.4rem 1.2rem;
          border-radius: 9999px;
          width: fit-content;
          border: 1px solid rgba(212, 169, 74, 0.15);
        }
        .hero-badge::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d4a94a;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .hero-headline {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 4rem;
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: #1a2e24;
        }
        .hero-headline .highlight {
          color: #d4a94a;
          position: relative;
        }
        .hero-headline .highlight::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(212, 169, 74, 0.2);
          border-radius: 9999px;
        }
        @media (max-width: 1024px) {
          .hero-headline { font-size: 3rem; }
        }
        @media (max-width: 768px) {
          .hero-headline { font-size: 2.4rem; }
        }

        .hero-description {
          font-size: 1.125rem;
          color: #6d7d73;
          max-width: 28rem;
          line-height: 1.7;
          font-weight: 400;
        }
        @media (max-width: 1024px) {
          .hero-description { max-width: 100%; }
        }

        .hero-cta-group {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .hero-cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #1e332a;
          color: #fff;
          padding: 0.8rem 2.2rem;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 4px 12px rgba(30, 51, 42, 0.15);
        }
        .hero-cta-primary:hover {
          background: #0f1a14;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(30, 51, 42, 0.2);
        }
        .hero-cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #1e332a;
          font-weight: 500;
          font-size: 0.95rem;
          text-decoration: none;
          padding: 0.8rem 1.5rem;
          border-radius: 9999px;
          transition: all 0.3s;
          border: 1px solid transparent;
        }
        .hero-cta-secondary:hover {
          background: rgba(30, 51, 42, 0.05);
          border-color: rgba(30, 51, 42, 0.1);
        }

        /* ----- RIGHT COLUMN: Carousel ----- */
        .hero-carousel-wrapper {
          position: relative;
          width: 100%;
          border-radius: 2rem;
          overflow: hidden;
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.6);
          background: #fff;
          aspect-ratio: 4 / 3;
          transform: perspective(1200px) rotateY(-2deg);
          transition: transform 0.6s ease;
        }
        .hero-carousel-wrapper:hover {
          transform: perspective(1200px) rotateY(0deg);
        }
        @media (min-width: 1024px) {
          .hero-carousel-wrapper {
            aspect-ratio: 16 / 10;
            height: auto;
          }
        }
        @media (max-width: 480px) {
          .hero-carousel-wrapper {
            aspect-ratio: 4 / 3;
            border-radius: 1.5rem;
          }
        }

        .hero-carousel-slide {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .hero-carousel-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .hero-carousel-caption {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 2rem 2.5rem;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .hero-carousel-caption {
            flex-direction: column;
            align-items: flex-start;
            padding: 1.5rem;
          }
        }
        .hero-carousel-info { color: #fff; }
        .hero-carousel-brand {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #d4a94a;
          font-weight: 600;
        }
        .hero-carousel-model {
          font-family: 'Inter', sans-serif;
          font-size: 1.8rem;
          font-weight: 700;
          margin-top: 0.1rem;
          line-height: 1.2;
        }
        @media (max-width: 768px) {
          .hero-carousel-model { font-size: 1.4rem; }
        }

        .hero-carousel-price {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .hero-carousel-price .amount {
          font-family: 'Inter', sans-serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: #d4a94a;
        }
        .hero-carousel-price .per {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
        }
        .hero-carousel-btn {
          background: #d4a94a;
          color: #1e332a;
          border: none;
          padding: 0.5rem 1.8rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .hero-carousel-btn:hover:not(:disabled) {
          background: #c9a03a;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        }
        .hero-carousel-btn:disabled {
          background: #6d7d73;
          cursor: not-allowed;
          opacity: 0.6;
          transform: none;
          box-shadow: none;
        }

        .hero-carousel-dots {
          position: absolute;
          bottom: 1.2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.6rem;
          z-index: 5;
        }
        .hero-carousel-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.3s;
          border: none;
          padding: 0;
        }
        .hero-carousel-dot.active {
          width: 2rem;
          background: #d4a94a;
        }

        /* ----- Brand Marquee (continuous loop) ----- */
        .brand-marquee-section { padding: 4rem 0; overflow: hidden; }
        .brand-marquee-track {
          display: flex;
          gap: 1.5rem;
          animation: scrollBrands 15s linear infinite;
          width: max-content;
        }
        .brand-marquee-track:hover {
          animation-play-state: paused;
        }
        .brand-card {
          flex: 0 0 auto;
          width: 200px;
          background: #ffffff;
          border: 1px solid #e8e7e2;
          border-radius: 1.5rem;
          padding: 1.5rem 1rem;
          text-align: center;
          transition: all 0.3s;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .brand-card:hover {
          border-color: #d4a94a;
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
        }
        .brand-logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f7f4;
          border-radius: 50%;
          overflow: hidden;
          border: 1px solid #eee;
        }
        .brand-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 0.5rem;
        }
        .brand-logo .brand-initial {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1e332a;
          background: #d4a94a20;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .brand-name {
          font-family: 'Inter', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e332a;
          margin-bottom: 0.15rem;
        }
        .brand-count {
          font-size: 0.8rem;
          color: #6d7d73;
        }

        @keyframes scrollBrands {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ----- rest of CSS unchanged ----- */
        .cars-section { padding: 4rem 0 8rem 0; background: rgba(255,255,255,0.4); }
        .cars-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 4rem;
        }
        .view-all-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 9999px;
          background: #1e332a;
          padding: 0.5rem 1.5rem;
          height: 2.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          color: #fff;
          transition: background 0.2s;
        }
        .view-all-link:hover { background: #0f1a14; }

        .cars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 768px) { .cars-grid { grid-template-columns: 1fr; } }

        .car-card {
          background: #fff;
          border-radius: 1.5rem;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid transparent;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          height: 100%;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .car-card:hover {
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
        @media (min-width: 768px) { .car-image-top { height: 240px; } }
        .car-image-top img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          mix-blend-mode: multiply;
          border-radius: 10px;
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
          padding: 0.5rem 1.5rem;
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

        .howitworks-section { padding: 8rem 0; }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          position: relative;
        }
        @media (max-width: 768px) { .steps-grid { grid-template-columns: 1fr; } }
        .step-item {
          position: relative;
          text-align: center;
        }
        .step-number {
          position: absolute;
          top: -2rem;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Inter', sans-serif;
          font-size: 8rem;
          font-weight: 900;
          color: rgba(212, 169, 74, 0.08);
          user-select: none;
        }
        .step-icon {
          width: 5rem;
          height: 5rem;
          margin: 0 auto 1.5rem;
          border-radius: 1.5rem;
          background: #1e332a;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05);
        }
        .step-icon svg { width: 2rem; height: 2rem; color: #fff; }
        .step-title {
          font-family: 'Inter', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #1e332a;
        }
        .step-desc { color: #6d7d73; max-width: 20rem; margin: 0 auto; }

        .testimonials-section { padding: 8rem 0; background: rgba(255,255,255,0.4); }
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 768px) { .testimonials-grid { grid-template-columns: 1fr; } }
        .testimonial-card {
          background: #fff;
          border: 1px solid #e8e7e2;
          border-radius: 1.5rem;
          padding: 2rem;
          height: 100%;
          transition: all 0.3s;
        }
        .testimonial-card:hover { border-color: #d4a94a; }
        .testimonial-stars { display: flex; gap: 0.25rem; margin-bottom: 1rem; }
        .testimonial-stars svg { fill: #d4a94a; color: #d4a94a; width: 1.25rem; height: 1.25rem; }
        .testimonial-text { font-size: 1.125rem; margin-bottom: 1.5rem; text-wrap: balance; color: #1e332a; }
        .testimonial-name { font-weight: 600; color: #1e332a; }
        .testimonial-city { font-size: 0.875rem; color: #6d7d73; }

        .cta-section { padding: 8rem 0; }
        .cta-card {
          position: relative;
          background: #1e332a;
          border-radius: 2.5rem;
          padding: 3rem;
          text-align: center;
          color: #fff;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }
        @media (min-width: 768px) { .cta-card { padding: 5rem; } }
        .cta-blur {
          position: absolute;
          top: -5rem;
          right: -5rem;
          width: 20rem;
          height: 20rem;
          background: rgba(212, 169, 74, 0.2);
          border-radius: 9999px;
          filter: blur(4rem);
        }
        .cta-content { position: relative; }
        .cta-title {
          font-family: 'Inter', sans-serif;
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-wrap: balance;
        }
        @media (min-width: 768px) { .cta-title { font-size: 3.75rem; } }
        .cta-subtitle {
          font-size: 1.25rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 2.5rem;
          max-width: 36rem;
          margin-left: auto;
          margin-right: auto;
          text-wrap: balance;
        }
        .cta-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 9999px;
          background: #f7f6f1;
          padding: 0 2.5rem;
          height: 3.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #1e332a;
          text-decoration: none;
          transition: all 0.2s;
        }
        .cta-button:hover { background: #d4a94a; transform: translateY(-2px); }

        .features-section {
          padding: 6rem 0;
          background: #fcfbf9;
          border-top: 1px solid #e8e7e2;
        }
        .section-header {
          text-align: center;
          max-width: 48rem;
          margin: 0 auto 3rem;
        }
        .section-badge {
          font-size: 0.875rem;
          font-weight: 600;
          color: #d4a94a;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
        }
        .section-title {
          font-family: 'Inter', sans-serif;
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-wrap: balance;
          color: #1e332a;
        }
        @media (min-width: 768px) { .section-title { font-size: 3.75rem; } }
        .section-subtitle { 
          font-size: 1.125rem; 
          color: #6d7d73; 
          max-width: 32rem;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 768px) { .features-grid { grid-template-columns: 1fr; } }

        .feature-card {
          background: #ffffff;
          border: 1px solid #e8e7e2;
          border-radius: 1.5rem;
          padding: 2.5rem 2rem;
          height: 100%;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          text-align: center;
        }
        .feature-card:hover { 
          border-color: #d4a94a;
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
        }
        .feature-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          background: #d4a94a;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .feature-icon svg { 
          width: 1.75rem; 
          height: 1.75rem; 
          color: #1e332a; 
        }
        .feature-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #1e332a;
        }
        .feature-desc { 
          color: #6d7d73; 
          line-height: 1.6;
        }
      `}</style>

      <div className="overflow-hidden">
        
        {/* ========================================================== */
        /*  PREMIUM SPLIT HERO – left text, right carousel            */
        /* ========================================================== */}
        <section className="hero-section">
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />

          <div className="home-container">
            <div className="hero-content-wrapper">
              {/* Left column: editorial text */}
              <div className="hero-text">
                <div className="hero-badge">
                  {lang === "fr" ? "Location de luxe" : "تأجير فاخر"}
                </div>
                <h1 className="hero-headline">
                  {lang === "fr" ? "L'élégance sur" : "أناقة على"} <br />
                  <span className="highlight">{lang === "fr" ? "quatre roues" : "أربع عجلات"}</span>
                </h1>
                <p className="hero-description">
                  {lang === "fr" 
                    ? "Découvrez une collection exclusive de véhicules d'exception, entretenus avec soin pour une expérience de conduite inoubliable." 
                    : "اكتشف مجموعة حصرية من المركبات الاستثنائية، التي تم صيانتها بعناية لتجربة قيادة لا تُنسى."}
                </p>
                <div className="hero-cta-group">
                  <Link to="/our-cars" className="hero-cta-primary">
                    {lang === "fr" ? "Parcourir la flotte" : "تصفح الأسطول"}
                    <ArrowRight size={18} />
                  </Link>
                  <Link to="/our-cars" className="hero-cta-secondary">
                    {lang === "fr" ? "Voir les offres" : "عرض العروض"}
                  </Link>
                </div>
              </div>

              {/* Right column: carousel */}
              <div className="hero-carousel-wrapper">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="hero-carousel-slide"
                  >
                    {carouselCars[currentImageIndex] && (() => {
                      const car = carouselCars[currentImageIndex];
                      const price = car.price_per_day || car.daily_price || 0;
                      const isAvailable = car.status === 'disponible';
                      return (
                        <>
                          <img
                            src={getCarImageUrl(car) || heroCar}
                            alt={`${car.brand} ${car.model}`}
                            onError={(e) => { e.target.src = heroCar; }}
                          />
                          <div className="hero-carousel-caption">
                            <div className="hero-carousel-info">
                              <div className="hero-carousel-brand">{car.brand}</div>
                              <div className="hero-carousel-model">{car.model}</div>
                            </div>
                            <div className="hero-carousel-price">
                              <span className="amount">{price.toLocaleString()} MAD</span>
                              <span className="per">/ {lang === "fr" ? "jour" : "يوم"}</span>
                              <button
                                className="hero-carousel-btn"
                                disabled={!isAvailable}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isAvailable) openModal(car);
                                }}
                              >
                                {lang === "fr" ? "Réserver" : "احجز"}
                              </button>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>
                {carouselCars.length > 1 && (
                  <div className="hero-carousel-dots">
                    {carouselCars.map((_, index) => (
                      <button
                        key={index}
                        className={`hero-carousel-dot ${currentImageIndex === index ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */
        /* BRAND MARQUEE – continuous loop, never stops                 */
        /* ========================================================== */}
        <section className="brand-marquee-section">
          <div className="home-container">
            <FadeIn>
              <div className="section-header">
                <div className="section-badge">— {lang === "fr" ? "Nos modèles" : "نماذجنا"}</div>
              </div>
            </FadeIn>

            {brandGroups.length > 0 && (
              <div className="brand-marquee-track">
                {[...brandGroups, ...brandGroups].map(({ brand, count }, index) => {
                  const logoUrl = getBrandLogoUrl(brand);
                  const hasError = brandLogoErrors[brand];
                  return (
                    <div key={`${brand}-${index}`} className="brand-card">
                      <div className="brand-logo">
                        {logoUrl && !hasError ? (
                          <img
                            src={logoUrl}
                            alt={brand}
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            onError={() => handleBrandLogoError(brand)}
                          />
                        ) : (
                          <span className="brand-initial">{brand.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="brand-name">{brand}</div>
                      <div className="brand-count">
                        {count} {lang === "fr" ? "voitures" : "سيارة"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================== */
        /* CARS GRID, STEPS, TESTIMONIALS, CTA, FEATURES – unchanged */
        /* ========================================================== */}
        <section className="cars-section">
          <div className="home-container">
            <FadeIn>
              <div className="cars-header">
                <div>
                  <div className="section-badge">— {lang === "fr" ? "Sélection" : "اختيار"}</div>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>{t("cars.title")}</h2>
                </div>
                <Link to="/our-cars" className="view-all-link">
                  {lang === "fr" ? "Voir tout" : "عرض الكل"} <ArrowRight style={{ width: '1rem', height: '1rem', marginLeft: '0.5rem' }} />
                </Link>
              </div>
            </FadeIn>

            <ParallaxSection>
              {loading ? (
                <div className="loading-state" style={{ textAlign: 'center', padding: '3rem', color: '#6d7d73' }}>Chargement...</div>
              ) : (
                <div className="cars-grid">
                  {cars.map((car, i) => {
                    const carImage = getCarImageUrl(car);
                    const hasError = imageErrors[car.id];
                    const isDisponible = car.status === 'disponible';
                    const price = car.price_per_day || car.daily_price || 0;

                    return (
                      <FadeIn key={car.id} delay={i * 0.05}>
                        <TiltCard className="h-full">
                          <div
                            className={`car-card ${!isDisponible ? 'car-card-disabled' : ''}`}
                            onClick={() => isDisponible && openModal(car)}
                          >
                            <div className="car-image-top">
                              {carImage && !hasError ? (
                                <img 
                                  src={carImage} 
                                  alt={`${car.brand} ${car.model}`}
                                  onError={() => handleCarImageError(car.id)}
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
                                  onClick={(e) => { e.stopPropagation(); isDisponible && openModal(car); }}
                                >
                                  {lang === "fr" ? "Réserver" : "احجز"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </TiltCard>
                      </FadeIn>
                    );
                  })}
                </div>
              )}
            </ParallaxSection>
          </div>
        </section>

        <section className="howitworks-section">
          <div className="home-container">
            <FadeIn>
              <div className="section-header">
                <div className="section-badge">— Process</div>
                <h2 className="section-title">{lang === "fr" ? "Trois étapes vers la route" : "ثلاث خطوات نحو الطريق"}</h2>
              </div>
            </FadeIn>
            <div className="steps-grid">
              {[
                { n: "01", icon: MapPin, title: lang === "fr" ? "Choisissez" : "اختر", desc: lang === "fr" ? "Parcourez notre collection et sélectionnez votre véhicule." : "تصفّح مجموعتنا واختر سيارتك." },
                { n: "02", icon: Calendar, title: lang === "fr" ? "Réservez" : "احجز", desc: lang === "fr" ? "Remplissez le formulaire en moins de 60 secondes." : "املأ النموذج في أقل من 60 ثانية." },
                { n: "03", icon: Shield, title: lang === "fr" ? "Conduisez" : "قُد", desc: lang === "fr" ? "Récupérez les clés et profitez du voyage." : "استلم المفاتيح واستمتع بالرحلة." }
              ].map((step, i) => (
                <FadeIn key={i} delay={i * 0.15}>
                  <div className="step-item">
                    <div className="step-number">{step.n}</div>
                    <div className="step-icon"><step.icon /></div>
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-desc">{step.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="testimonials-section">
          <div className="home-container">
            <FadeIn>
              <div className="section-header" style={{ marginBottom: '4rem' }}>
                <div className="section-badge">— {lang === "fr" ? "Témoignages" : "شهادات"}</div>
                <h2 className="section-title">{lang === "fr" ? "Ils nous ont fait confiance" : "وثقوا بنا"}</h2>
              </div>
            </FadeIn>
            <div className="testimonials-grid">
              {[
                { name: "Sophie L.", city: "Paris", quote: lang === "fr" ? "Service impeccable. Voiture parfaite, équipe à l'écoute. Je recommande." : "خدمة لا تشوبها شائبة. سيارة مثالية وفريق مستمع. أوصي بهم." },
                { name: "Karim B.", city: "Lyon", quote: lang === "fr" ? "Réservation en 2 minutes, prise en charge ultra rapide. Mon nouveau réflexe." : "حجز في دقيقتين، استلام سريع جداً. عادتي الجديدة." },
                { name: "Emma R.", city: "Marseille", quote: lang === "fr" ? "Une collection de rêve à des prix justes. Difficile de revenir en arrière." : "مجموعة حلم بأسعار عادلة. من الصعب العودة." }
              ].map((testimonial, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="testimonial-card">
                    <div className="testimonial-stars">
                      {[...Array(5)].map((_, j) => <Star key={j} />)}
                    </div>
                    <p className="testimonial-text">"{testimonial.quote}"</p>
                    <div>
                      <div className="testimonial-name">{testimonial.name}</div>
                      <div className="testimonial-city">{testimonial.city}</div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="home-container">
            <FadeIn>
              <div className="cta-card">
                <div className="cta-blur" />
                <div className="cta-content">
                  <h2 className="cta-title">{lang === "fr" ? "Prêt à prendre la route ?" : "هل أنت جاهز للانطلاق؟"}</h2>
                  <p className="cta-subtitle">
                    {lang === "fr" ? "Votre prochaine voiture vous attend. Réservez en moins d'une minute." : "سيارتك التالية بانتظارك. احجز في أقل من دقيقة."}
                  </p>
                  <Link to="/our-cars" className="cta-button">
                    {t("hero.cta.book")} <ArrowRight style={{ width: '1.25rem', height: '1.25rem', marginLeft: '0.5rem' }} />
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="features-section">
          <div className="home-container">
            <FadeIn>
              <div className="section-header">
                <div className="section-badge">— {lang === "fr" ? "Notre promesse" : "وعدنا"}</div>
                <h2 className="section-title">{t("features.title")}</h2>
                <p className="section-subtitle">{t("features.subtitle")}</p>
              </div>
            </FadeIn>
            <div className="features-grid">
              {features.map((feature, i) => (
                <FadeIn key={i} delay={i * 0.12}>
                  <TiltCard>
                    <div className="feature-card">
                      <div className="feature-icon"><feature.icon /></div>
                      <h3 className="feature-title">{feature.title}</h3>
                      <p className="feature-desc">{feature.desc}</p>
                    </div>
                  </TiltCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Reservation Modal */}
      <AnimatePresence>
        {isModalOpen && selected && (
          <BookingModal car={selected} onClose={closeModal} />
        )}
      </AnimatePresence>
    </>
  );
}