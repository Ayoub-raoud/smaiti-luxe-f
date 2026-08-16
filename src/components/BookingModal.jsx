import React, { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { X, Mail, Phone, Calendar, ArrowRight, Check } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { createReservation, createClient, fetchClients, selectClients } from "../Redux/store";
import { format, differenceInCalendarDays } from "date-fns";

export function BookingModal({ car, onClose }) {
  const { t, locale } = useI18n();
  const dispatch = useDispatch();
  const clients = useSelector(selectClients);
  const modalRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isAr = locale === "ar";
  const today = format(new Date(), "yyyy-MM-dd");
  const currentTime = format(new Date(), "HH:00");

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    start_date: today,
    end_date: today,
    start_time: currentTime,
    end_time: currentTime,
    notes: "",
  });

  useEffect(() => {
    if (car) {
      setForm({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        start_date: today,
        end_date: today,
        start_time: currentTime,
        end_time: currentTime,
        notes: "",
      });
      setSubmitted(false);
      setImageError(false);
    }
  }, [car]);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const days = useMemo(() => {
    if (!form.start_date || !form.end_date) return 0;
    return Math.max(
      1,
      differenceInCalendarDays(new Date(form.end_date), new Date(form.start_date)) + 1
    );
  }, [form.start_date, form.end_date]);

  const total = useMemo(
    () => (car ? days * Number(car.price_per_day || car.daily_price || 0) : 0),
    [days, car]
  );

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
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

  const submit = async (e) => {
    e.preventDefault();
    if (!car) return;

    setSearchingClient(true);

    try {
      let clientId = null;
      const existingClient = clients.find(client => client.email === form.email);

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const clientResult = await dispatch(
          createClient({
            nom: form.nom,
            prenom: form.prenom,
            email: form.email,
            telephone: form.telephone,
          })
        ).unwrap();

        clientId = clientResult.client?.id || clientResult.data?.id || clientResult.id;

        if (!clientId) {
          throw new Error("Failed to create or find client");
        }
        await dispatch(fetchClients());
      }

      const rentalDays = days;
      const reservationData = {
        car_id: car.id,
        client_id: clientId,
        start_date: form.start_date,
        end_date: form.end_date,
        start_time: form.start_time,
        end_time: form.end_time,
        rental_days: rentalDays,
        total_price: total,
        amount_paid: 0,
        remaining_amount: total,
        status: "contacted",
        notes: form.notes,
        has_second_driver: false,
        payment_history: [],
      };

      const result = await dispatch(createReservation(reservationData)).unwrap();

      if (result.error) {
        throw new Error(result.error);
      }

      setSubmitted(true);
      toast.success(isAr ? "تم تأكيد الحجز!" : "Réservation confirmée !");

    } catch (error) {
      console.error("Reservation error:", error);
      let errorMessage = isAr ? "خطأ في الحجز" : "Erreur lors de la réservation";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast.error(errorMessage);
    } finally {
      setSearchingClient(false);
    }
  };

  if (!car) return null;

  const imageUrl = getCarImageUrl(car);
  const price = car.price_per_day || car.daily_price || 0;
  const isAvailable = car.status === 'disponible';

  return (
    <div
      className="booking-modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="booking-modal" ref={modalRef}>
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          <X size={18} />
        </button>

        <div className="modal-grid">
          <div className="modal-form">
            {!submitted ? (
              <>
                <h2 className="modal-title">
                  {isAr ? "حجز سيارة" : "Réserver un véhicule"}
                </h2>
                <p className="modal-subtitle">
                  {car.brand} {car.model}
                </p>
                <p className="modal-price">
                  {price.toLocaleString()} MAD / {isAr ? "اليوم" : "jour"}
                </p>

                <form onSubmit={submit} className="booking-form">
                  <input type="hidden" name="start_time" value={form.start_time} />
                  <input type="hidden" name="end_time" value={form.end_time} />

                  <div className="form-row">
                    <div className="form-group half">
                      <label>{isAr ? "الاسم الأول" : "Prénom"} <span className="text-accent">*</span></label>
                      <input
                        required
                        value={form.prenom}
                        onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                        placeholder={isAr ? "الاسم" : "Prénom"}
                      />
                    </div>
                    <div className="form-group half">
                      <label>{isAr ? "الاسم العائلي" : "Nom"} <span className="text-accent">*</span></label>
                      <input
                        required
                        value={form.nom}
                        onChange={(e) => setForm({ ...form, nom: e.target.value })}
                        placeholder={isAr ? "اللقب" : "Nom"}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label><Mail className="inline h-3 w-3 me-1" /> Email <span className="text-accent">*</span></label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="jean@example.com"
                      />
                    </div>
                    <div className="form-group half">
                      <label><Phone className="inline h-3 w-3 me-1" /> {isAr ? "الهاتف" : "Téléphone"} <span className="text-accent">*</span></label>
                      <input
                        required
                        value={form.telephone}
                        onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                        placeholder="+212 6 12 34 56 78"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label><Calendar className="inline h-3 w-3 me-1" /> {isAr ? "تاريخ البداية" : "Date de début"} <span className="text-accent">*</span></label>
                      <input
                        type="date"
                        required
                        min={today}
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      />
                    </div>
                    <div className="form-group half">
                      <label><Calendar className="inline h-3 w-3 me-1" /> {isAr ? "تاريخ النهاية" : "Date de fin"} <span className="text-accent">*</span></label>
                      <input
                        type="date"
                        required
                        min={form.start_date}
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{isAr ? "ملاحظات" : "Notes (optionnel)"}</label>
                    <textarea
                      rows="1"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder={isAr ? "ملاحظات" : "Demandes particulières..."}
                    />
                  </div>

                  <div className="price-summary">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        {days} {days === 1 ? (isAr ? "يوم" : "jour") : (isAr ? "أيام" : "jours")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {price}MAD × {days}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border mt-1">
                      <span className="font-display text-sm font-bold">{isAr ? "المجموع" : "Total"}</span>
                      <span className="font-display text-base font-bold text-accent">{total}MAD</span>
                    </div>
                  </div>

                  <button type="submit" className="submit-btn" disabled={searchingClient}>
                    {searchingClient ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></span>
                        {isAr ? "جاري المعالجة..." : "Traitement..."}
                      </span>
                    ) : (
                      <>
                        {isAr ? "إرسال الطلب" : "Envoyer la demande"}
                        <ArrowRight className="h-3 w-3 inline ms-1" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ----- Confirmation state with enhanced styling and color ----- */
              <div className="confirmation-wrapper">
                <div className="confirmation-icon">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h2 className="confirmation-title">
                  {isAr ? "تم تأكيد الحجز!" : "Réservation confirmée !"}
                </h2>
                <p className="confirmation-message">
                  {isAr
                    ? `تم تسجيل حجزك لسيارة ${car.brand} ${car.model} (${car.color || ''}) بنجاح.`
                    : `Votre réservation pour ${car.brand} ${car.model} (${car.color || ''}) a bien été enregistrée.`}
                </p>
                <p className="confirmation-email-hint">
                  {isAr
                    ? "ستتلقى بريدًا إلكترونيًا للتأكيد في غضون لحظات."
                    : "Vous recevrez un email de confirmation dans quelques instants."}
                </p>
                <button onClick={onClose} className="confirmation-close-btn">
                  {isAr ? "إغلاق" : "Fermer"}
                </button>
              </div>
            )}
          </div>

          <div className="modal-image">
            <div className="image-wrapper">
              {imageUrl && !imageError ? (
                <img
                  src={imageUrl}
                  alt={`${car.brand} ${car.model}`}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="fallback-container">
                  <div className="fallback-letter">
                    {car.brand?.[0] || car.model?.[0] || "C"}
                  </div>
                  <div className="fallback-name">
                    {car.brand} {car.model}
                  </div>
                </div>
              )}
            </div>
            <div className="image-overlay">
              <span className="car-status">
                {isAvailable
                  ? isAr ? "متاحة" : "Disponible"
                  : isAr ? "غير متاحة" : "Indisponible"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* --------------- ZERO-SCROLL ULTRA-COMPACT MODAL --------------- */
        .booking-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          height: 100dvh;
        }
        .booking-modal {
          background: white;
          border-radius: 1.25rem;
          max-width: 850px;
          width: 100%;
          max-height: 90dvh;
          overflow: hidden;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
          animation: modalFadeIn 0.25s ease;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-close {
          position: absolute;
          top: 0.6rem;
          right: 0.6rem;
          background: rgba(0,0,0,0.05);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1a202c;
          transition: background 0.2s;
          z-index: 10;
        }
        .modal-close:hover { background: rgba(0,0,0,0.12); }

        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 100%;
          max-height: 90dvh;
        }
        .modal-form {
          padding: 1rem 1.25rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          color: #1a202c;
          margin-bottom: 0.05rem;
          line-height: 1.1;
        }
        .modal-subtitle { font-size: 0.75rem; color: #4b5563; margin-bottom: 0.05rem; }
        .modal-price { font-size: 0.75rem; font-weight: 600; color: #1a202c; margin-bottom: 0.5rem; }
        
        .booking-form {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          flex: 1;
          justify-content: space-between;
        }
        .form-group { display: flex; flex-direction: column; gap: 0.1rem; }
        .form-group label { font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
        .form-group input, .form-group textarea {
          padding: 0.25rem 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.3rem;
          font-size: 0.65rem;
          transition: border-color 0.2s;
          outline: none;
          background: white;
          width: 100%;
          box-sizing: border-box;
        }
        .form-group input:focus, .form-group textarea:focus { border-color: #1a202c; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
        .half { flex: 1; }

        .submit-btn {
          margin-top: 0.1rem;
          padding: 0.4rem 0.6rem;
          border-radius: 9999px;
          background: #1a202c;
          color: white;
          border: none;
          font-size: 0.65rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }
        .submit-btn:hover { opacity: 0.9; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .price-summary {
          background: #f3f4f6;
          border-radius: 0.5rem;
          padding: 0.4rem 0.6rem;
          margin-top: 0.1rem;
        }
        .text-accent { color: #eab308; }
        .text-muted-foreground { color: #6b7280; }

        .modal-image {
          position: relative;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.4rem;
          height: 100%;
        }
        .image-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          overflow: hidden;
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        
        .fallback-container {
          width: 100%; height: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white; padding: 0.5rem; text-align: center;
        }
        .fallback-letter { font-family: 'Inter', sans-serif; font-size: 3rem; font-weight: 900; color: rgba(255,255,255,0.15); line-height: 1; }
        .fallback-name { margin-top: 0.2rem; font-size: 1rem; font-weight: 700; }
        
        .image-overlay {
          position: absolute; bottom: 0.6rem; left: 0.6rem;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          padding: 0.1rem 0.8rem; border-radius: 9999px; color: white;
          font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.1em; pointer-events: none;
        }

        /* ---- Enhanced Confirmation Styles ---- */
        .confirmation-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0.5rem 0.25rem;
          height: 100%;
          gap: 0.5rem;
        }
        .confirmation-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(234, 179, 8, 0.3);
          margin-bottom: 0.25rem;
        }
        .confirmation-title {
          font-family: 'Inter', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          letter-spacing: -0.02em;
        }
        .confirmation-message {
          font-size: 0.9rem;
          color: #4b5563;
          max-width: 280px;
          margin: 0 auto;
        }
        .confirmation-email-hint {
          font-size: 0.7rem;
          color: #6b7280;
          margin-top: -0.25rem;
        }
        .confirmation-close-btn {
          margin-top: 0.5rem;
          padding: 0.5rem 2rem;
          border-radius: 9999px;
          background: #1a202c;
          color: white;
          border: none;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .confirmation-close-btn:hover {
          background: #2d3748;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }

        .flex { display: flex; } .justify-between { justify-content: space-between; } .items-center { align-items: center; }
        .gap-2 { gap: 0.5rem; } .pt-1 { padding-top: 0.25rem; } .mt-1 { margin-top: 0.25rem; }
        .mb-4 { margin-bottom: 1rem; } .mb-3 { margin-bottom: 0.75rem; } .mb-1 { margin-bottom: 0.25rem; }
        .mx-auto { margin-left: auto; margin-right: auto; } .text-center { text-align: center; }
        .text-xs { font-size: 0.65rem; } .text-sm { font-size: 0.75rem; } .text-base { font-size: 0.85rem; } .text-lg { font-size: 1rem; }
        .font-bold { font-weight: 700; } .font-medium { font-weight: 500; } .font-display { font-family: 'Inter', sans-serif; }
        .border-t { border-top-width: 1px; } .border-border { border-color: #e5e7eb; }
        .h-3 { height: 0.75rem; } .w-3 { width: 0.75rem; } .h-7 { height: 1.75rem; } .w-7 { width: 1.75rem; }
        .h-14 { height: 3.5rem; } .w-14 { width: 3.5rem; }
        .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; } .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .me-1 { margin-right: 0.25rem; } .ms-1 { margin-left: 0.25rem; } .inline { display: inline; } .inline-flex { display: inline-flex; }
        .h-8 { height: 2rem; } .w-8 { width: 2rem; }

        /* Responsive */
        @media (max-width: 768px) {
          .booking-modal { max-height: 98dvh; border-radius: 1rem; }
          .modal-grid { grid-template-columns: 1fr; max-height: none; height: auto; }
          .modal-image { padding: 0.5rem; height: 160px; order: -1; }
          .modal-form { padding: 0.75rem 1rem; max-height: 60dvh; overflow-y: auto; }
          .form-row { grid-template-columns: 1fr; gap: 0.25rem; }
          .submit-btn { margin-bottom: 0.25rem; }
          .fallback-letter { font-size: 2.5rem; }
          .confirmation-title { font-size: 1.25rem; }
          .confirmation-message { font-size: 0.8rem; }
          .confirmation-icon { width: 48px; height: 48px; }
          .confirmation-icon svg { width: 1.5rem; height: 1.5rem; }
        }
      `}</style>
    </div>
  );
}