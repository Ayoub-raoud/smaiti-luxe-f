// src/pages/admin/AdminReservationsStatus.jsx
import { useEffect, useState, useMemo, useRef, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useStore } from 'react-redux';
import {
  fetchReservations, fetchCars, fetchMatricules, fetchClients,
  updateReservation, deleteReservation, createReservation,
  checkLateReservations, selectReservations, selectCars,
  selectMatricules, selectClients, selectReservationsLoading,
  selectUser, refreshMatricules, createClient, api,
  fetchSousLocations,
  createSousLocation,
  selectSousLocations,
  selectSousLocationsLoading,
} from "../../Redux/store";
import { syncReportForReservation } from "../../utils/reportSync";
import PaginationControls from '../../components/PaginationControls';
import { toast } from "sonner";
import {
  Check, X, Eye, Trash2, Search, RefreshCw, ChevronLeft, ChevronRight,
  Printer, FileText, Calendar, User, Car, Clock, AlertCircle, CreditCard,
  Mail, Phone, MapPin, IdCard, Download, Plus, Edit, Info, Save,
  DollarSign, History, Receipt, Users, CalendarDays, UserPlus,
  Image as ImageIcon, FileImage, Trash, Copy, CheckCircle, Gauge,
  Settings, EyeOff, Minus, Shield, Truck, FileCheck, PenTool, Building2,
  CreditCard as CreditCardIcon, CalendarRange, Fuel, Navigation, Upload,
  AlertTriangle, XCircle, Sparkles, Star, Heart, Award, Gem, Tag, Home, Coins,
  Wrench, Key, Briefcase, ArrowUpDown, ArrowUp, ArrowDown,
  MessageCircle, Link2, CheckCircle2, CalendarX, CalendarPlus ,TrashIcon,
  ChevronDown, ChevronUp
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import checklistImage from "../../assets/Checklist.png";
import logoImage from "../../assets/logo.png";
import agentSignatureImage from "../../assets/cache.png";
const getColorValue = (colorName) => {
  const colorMap = {
    // French
    "Bleu": "#0000FF",
    "Rouge": "#FF0000",
    "Blanc": "#FFFFFF",
    "Noir": "#000000",
    "Gris": "#808080",
    "Vert": "#00FF00",
    "Jaune": "#FFFF00",
    "Orange": "#FFA500",
    "Marron": "#8B4513",
    "Violet": "#800080",
    "Rose": "#FFC0CB",
    "Beige": "#F5F5DC",
    "Argent": "#C0C0C0",
    "Or": "#FFD700",
    // English
    "Blue": "#0000FF",
    "Red": "#FF0000",
    "White": "#FFFFFF",
    "Black": "#000000",
    "Gray": "#808080",
    "Green": "#00FF00",
    "Yellow": "#FFFF00",
    "Orange": "#FFA500",
    "Brown": "#8B4513",
    "Purple": "#800080",
    "Pink": "#FFC0CB",
    "Silver": "#C0C0C0",
    "Gold": "#FFD700",
    // Arabic
    "أزرق": "#0000FF",
    "أحمر": "#FF0000",
    "أبيض": "#FFFFFF",
    "أسود": "#000000",
    "رمادي": "#808080",
    "أخضر": "#00FF00",
    "أصفر": "#FFFF00",
    "برتقالي": "#FFA500",
    "بني": "#8B4513",
    "بنفسجي": "#800080",
    "وردي": "#FFC0CB",
    "فضي": "#C0C0C0",
    "ذهبي": "#FFD700"
  };
  return colorMap[colorName] || colorName; // fallback to the original value
};
const downloadAndOpenPDF = (doc, filename) => {
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

// Places the captured contract image so it always fits on a single A4 page —
// scaled down (never up) to fit both the page width AND height, and centered.
// This guarantees a one-page PDF that uses the full available height whenever
// the contract's aspect ratio allows it, instead of overflowing to a 2nd page
// or leaving blank space at the bottom.
const addImageFittedToPage = (doc, imgData, canvas, margin = 10) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;

  let imgWidth = availableWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight > availableHeight) {
    imgHeight = availableHeight;
    imgWidth = (canvas.width * imgHeight) / canvas.height;
  }

  const xOffset = margin + (availableWidth - imgWidth) / 2;
  const yOffset = margin + (availableHeight - imgHeight) / 2;

  doc.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);
};

// Resolves a human-readable name from a user object (backend shapes vary).
const getUserDisplayName = (user) => {
  if (!user) return "—";
  return user.Fullname || user.fullname || user.name || user.username || "—";
};

// Builds the JSON payload stored on reservation.reception_notes:
// - receptionne_par: whoever created the reservation (fixed once set)
// - livre_par: whoever is currently printing the contract (updates on every print)
const buildReceptionNotesJSON = (reservation, currentUser) => {
  return JSON.stringify({
    livre_par: getUserDisplayName(currentUser),
    receptionne_par: reservation?.created_by || "—"
  });
};

// ==================== ContractDisplayOptions ====================
const ContractDisplayOptions = ({ options, onOptionChange, onResetAll }) => {
  const sections = [
    { id: "prices", label: "Prix et Montants", icon: DollarSign },
    { id: "clientInfo", label: "Informations du Locataire", icon: User },
    { id: "secondDriver", label: "Deuxième Conducteur", icon: Users },
    { id: "vehicleInfo", label: "Informations du Véhicule", icon: Car },
    { id: "deliveryReception", label: "Livraison et Réception", icon: Clock },
    { id: "rentalDates", label: "Dates de Location", icon: Calendar },
    { id: "kilometrage", label: "Kilométrage", icon: Gauge },
    { id: "rentalDays", label: "Nombre de jours", icon: CalendarDays },
    { id: "observations", label: "Observations", icon: Info },
    { id: "insurance", label: "Assurance Supplémentaire", icon: Shield },
    { id: "depositGuarantee", label: "Caution et Garantie", icon: Shield },
    { id: "signatures", label: "Signatures", icon: FileText }
  ];

  const displayModes = [
    { value: "show", label: "Afficher normalement", icon: Eye },
    { value: "hide", label: "Masquer", icon: EyeOff },
    { value: "dash", label: "Remplacer par des traits", icon: Minus }
  ];

  return (
    <div className="display-options-panel">
      <div className="display-options-header">
        <h3><Settings size={16} /> Options d'affichage du contrat</h3>
        <button type="button" onClick={onResetAll} className="reset-all-btn">
          <RefreshCw size={14} /> Réinitialiser toutes les options
        </button>
      </div>
      <div className="display-options-grid">
        {sections.map(section => {
          const IconComponent = section.icon;
          const currentValue = options[section.id] || "show";
          return (
            <div key={section.id} className="display-option-item">
              <div className="display-option-label">
                <IconComponent size={14} />
                <span>{section.label}</span>
              </div>
              <div className="display-option-buttons">
                {displayModes.map(mode => (
                  <button
                    key={mode.value}
                    type="button"
                    className={`mode-btn ${currentValue === mode.value ? "active" : ""}`}
                    onClick={() => onOptionChange(section.id, mode.value)}
                    title={mode.label}
                  >
                    <mode.icon size={12} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== FormLine, Checkbox, CarDiagram, ObservationBox ====================
const FormLine = ({ label, value = "" }) => (
  <div className="form-line">
    <label>{label} :</label>
    <div className="dots-line">{value}</div>
  </div>
);
const CheckboxComponent = ({ checked = false }) => (
  <span className={`checkbox-square ${checked ? "checked" : ""}`}>
    {checked && "✓"}
  </span>
);
const CarDiagram = () => (
  <div className="car-diagram-container">
    <img src={checklistImage} alt="Car Checklist Diagram" className="checklist-image" />
  </div>
);
const ObservationBox = ({ title, isHalf = false, children, option }) => {
  if (option === "hide") return null;
  if (option === "dash") {
    return (
      <div className={`observation-box ${isHalf ? "half-width" : ""}`}>
        <label className="obs-title">{title} :</label>
        <div className="observation-content">___________</div>
      </div>
    );
  }
  return (
    <div className={`observation-box ${isHalf ? "half-width" : ""}`}>
      <label className="obs-title">{title} :</label>
      <div className="observation-content">{children}</div>
    </div>
  );
};

const SignatureBlock = ({ label, signature = "", option }) => {
  if (option === "hide") return null;
  const isImage = typeof signature === 'string' && signature.startsWith('data:image/');
  return (
    <div className="signature-block">
      <div className="signature-label">{label}</div>
      <div className="signature-box">
        {option === "dash" ? (
          <div className="signature-text">___________</div>
        ) : isImage ? (
          <img src={signature} alt="Signature" style={{ maxHeight: '60px', maxWidth: '100%' }} />
        ) : (
          signature && <div className="signature-text">{signature}</div>
        )}
      </div>
    </div>
  );
};

// ==================== ContractLocation (SECTIONS STYLISÉES & SIGNATURES AJUSTÉES) ====================
const ContractLocation = ({
  reservation,
  showSignatures = false,
  currentUser,
  displayOptions = {},
  clients = [],
  containerId = "contract-print-hidden"
}) => {
  const storedSignatures = reservation?.signatures || { agent: "", locataire: "", secondConducteur: "" };
  const [signatures, setSignatures] = useState(storedSignatures);

  useEffect(() => {
    if (reservation?.signatures) {
      setSignatures(reservation.signatures);
    }
  }, [reservation]);

  const paperwork = reservation?.paperwork || {
    circulation: true,
    carteGrise: true,
    assurance: true,
    vignette: true,
    visiteTechnique: true,
    autorisation: true
  };

  const getCurrentUserName = () => {
    let userName = "";
    if (currentUser) {
      userName = currentUser.Fullname || currentUser.fullname || currentUser.name || currentUser.username || "";
    }
    if (!userName) {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userName = userData.Fullname || userData.fullname || userData.name || "";
        }
      } catch (error) {
        console.error("Error reading user from localStorage:", error);
      }
    }
    return userName || "___________";
  };

  const getReservationCreatorName = () => {
    if (reservation?.created_by) return reservation.created_by;
    if (reservation?.user && reservation.user.Fullname) return reservation.user.Fullname;
    if (reservation?.user && reservation.user.name) return reservation.user.name;
    return "___________";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("fr-FR");
    } catch (error) {
      return "";
    }
  };

  const calculateRentalDays = () => {
    if (!reservation?.start_date || !reservation?.end_date) return null;
    const start = new Date(reservation.start_date);
    const end = new Date(reservation.end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  const rentalDays = reservation?.rental_days || calculateRentalDays();
  const dailyPrice = (reservation?.total_price && rentalDays)
    ? (reservation.total_price / rentalDays).toFixed(2)
    : reservation?.car?.price_per_day || "—";

  const getDisplayOption = (section) => displayOptions[section] || "show";
  const secondDriverClient = clients.find(c => c.id === reservation?.second_driver_client_id);

  const rentalDaysOption = getDisplayOption("rentalDays");
  const datesOption = getDisplayOption("rentalDates");
  const kilometrageOption = getDisplayOption("kilometrage");
  const pricesOption = getDisplayOption("prices");
  const clientInfoOption = getDisplayOption("clientInfo");
  const secondDriverOption = getDisplayOption("secondDriver");
  const vehicleInfoOption = getDisplayOption("vehicleInfo");
  const deliveryReceptionOption = getDisplayOption("deliveryReception");
  const signaturesOption = getDisplayOption("signatures");
  const observationsOption = getDisplayOption("observations");
  const insuranceOption = getDisplayOption("insurance");
  const depositGuaranteeOption = getDisplayOption("depositGuarantee");

  const currentUserName = getCurrentUserName();
  const reservationCreatorName = getReservationCreatorName();

  const getDisplayValue = (option, actualValue, dashValue = "___________", hideValue = "") => {
    if (option === "hide") return hideValue;
    if (option === "dash") return dashValue;
    return actualValue;
  };

  const hasActualSecondDriver = () => {
    return reservation?.has_second_driver === true && secondDriverClient;
  };

  const renderContractNumber = () => {
    if (reservation?.contract_number && reservation?.contract_year) {
      const year = reservation.contract_year;
      const num = String(reservation.contract_number).padStart(5, '0');
      return `${year}/${num}`;
    }
    return '—';
  };

  const locataireSignature = signatures.locataire_image || signatures.locataire || '';

  return (
    <div className="contract-container-print" id={containerId}>
      {/* Header */}
      <table className="contract-header-table" cellPadding="0" cellSpacing="0">
        <tbody>
          <tr>
            <td className="header-left">
              <div className="company-name">SMAITI LUXE CAR</div>
              <div className="company-slogan">LOCATION DE VOITURE</div>
              <div className="company-phone"><Phone size={12} style={{ marginRight: "4px", display: "inline" }} /> 0665 921 921</div>
            </td>
            <td className="header-center">
              <img src={logoImage} alt="Logo" className="contract-logo-print" />
            </td>
            <td className="header-right">
              <div className="contract-number-box stylish">
                <div className="contract-number-label">CONTRAT N°</div>
                <div className="contract-number-value">{renderContractNumber()}</div>
              </div>
              <div className="arabic-text">كراء السيارات</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="contract-title-print">CONTRAT DE LOCATION</div>

      {/* Two Columns */}
      <table className="contract-content-table" cellPadding="0" cellSpacing="0">
        <tbody>
          <tr>
            <td className="contract-left-col">
              <div className="contract-section">
                <div className="section-title-print">LOCATAIRE</div>
                <div className="section-content">
                  <div className="field-row"><span className="field-label">Nom :</span><span className="field-value">{getDisplayValue(clientInfoOption, reservation?.client?.nom || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Prénom :</span><span className="field-value">{getDisplayValue(clientInfoOption, reservation?.client?.prenom || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Date naissance :</span><span className="field-value">{getDisplayValue(clientInfoOption, formatDate(reservation?.client?.date_naissance) || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Lieu naissance :</span><span className="field-value">{getDisplayValue(clientInfoOption, reservation?.client?.lieu_naissance || "—")}</span></div>
                  <div className="field-row"><span className="field-label">CIN :</span><span className="field-value">{getDisplayValue(clientInfoOption, reservation?.client?.cin_number || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Expire le :</span><span className="field-value">{getDisplayValue(clientInfoOption, formatDate(reservation?.client?.cin_delivre_le) || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Permis N° :</span><span className="field-value">{getDisplayValue(clientInfoOption, reservation?.client?.driver_license_number || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Expire le :</span><span className="field-value">{getDisplayValue(clientInfoOption, formatDate(reservation?.client?.permis_delivre_le) || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Adresse :</span><span className="field-value">{getDisplayValue(clientInfoOption, reservation?.client?.city || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Téléphone :</span><span className="field-value">{getDisplayValue(clientInfoOption, reservation?.client?.telephone || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Email :</span><span className="field-value">{getDisplayValue(clientInfoOption, reservation?.client?.email || "—")}</span></div>
                </div>
              </div>

              <div className="contract-section">
                <div className="section-title-print">DEUXIÈME CONDUCTEUR</div>
                <div className="section-content">
                  {secondDriverOption === "hide" ? (
                    <>
                      <div className="field-row"><span className="field-label">Nom :</span><span className="field-value"></span></div>
                      <div className="field-row"><span className="field-label">Prénom :</span><span className="field-value"></span></div>
                      <div className="field-row"><span className="field-label">Date naissance :</span><span className="field-value"></span></div>
                      <div className="field-row"><span className="field-label">Lieu naissance :</span><span className="field-value"></span></div>
                      <div className="field-row"><span className="field-label">CIN :</span><span className="field-value"></span></div>
                      <div className="field-row"><span className="field-label">Expire le :</span><span className="field-value"></span></div>
                      <div className="field-row"><span className="field-label">Permis N° :</span><span className="field-value"></span></div>
                      <div className="field-row"><span className="field-label">Expire le :</span><span className="field-value"></span></div>
                      <div className="field-row"><span className="field-label">Adresse :</span><span className="field-value"></span></div>
                      <div className="field-row"><span className="field-label">Téléphone :</span><span className="field-value"></span></div>
                      <div className="field-row"><span className="field-label">Email :</span><span className="field-value"></span></div>
                    </>
                  ) : secondDriverOption === "dash" ? (
                    <>
                      <div className="field-row"><span className="field-label">Nom :</span><span className="field-value">___________</span></div>
                      <div className="field-row"><span className="field-label">Prénom :</span><span className="field-value">___________</span></div>
                      <div className="field-row"><span className="field-label">Date naissance :</span><span className="field-value">___________</span></div>
                      <div className="field-row"><span className="field-label">Lieu naissance :</span><span className="field-value">___________</span></div>
                      <div className="field-row"><span className="field-label">CIN :</span><span className="field-value">___________</span></div>
                      <div className="field-row"><span className="field-label">Expire le :</span><span className="field-value">___________</span></div>
                      <div className="field-row"><span className="field-label">Permis N° :</span><span className="field-value">___________</span></div>
                      <div className="field-row"><span className="field-label">Expire le :</span><span className="field-value">___________</span></div>
                      <div className="field-row"><span className="field-label">Adresse :</span><span className="field-value">___________</span></div>
                      <div className="field-row"><span className="field-label">Téléphone :</span><span className="field-value">___________</span></div>
                      <div className="field-row"><span className="field-label">Email :</span><span className="field-value">___________</span></div>
                    </>
                  ) : (
                    hasActualSecondDriver() ? (
                      <>
                        <div className="field-row"><span className="field-label">Nom :</span><span className="field-value">{secondDriverClient?.nom || "—"}</span></div>
                        <div className="field-row"><span className="field-label">Prénom :</span><span className="field-value">{secondDriverClient?.prenom || "—"}</span></div>
                        <div className="field-row"><span className="field-label">Date naissance :</span><span className="field-value">{formatDate(secondDriverClient?.date_naissance) || "—"}</span></div>
                        <div className="field-row"><span className="field-label">Lieu naissance :</span><span className="field-value">{secondDriverClient?.lieu_naissance || "—"}</span></div>
                        <div className="field-row"><span className="field-label">CIN :</span><span className="field-value">{secondDriverClient?.cin_number || "—"}</span></div>
                        <div className="field-row"><span className="field-label">Expire le :</span><span className="field-value">{formatDate(secondDriverClient?.cin_delivre_le) || "—"}</span></div>
                        <div className="field-row"><span className="field-label">Permis N° :</span><span className="field-value">{secondDriverClient?.driver_license_number || "—"}</span></div>
                        <div className="field-row"><span className="field-label">Expire le :</span><span className="field-value">{formatDate(secondDriverClient?.permis_delivre_le) || "—"}</span></div>
                        <div className="field-row"><span className="field-label">Adresse :</span><span className="field-value">{secondDriverClient?.city || "—"}</span></div>
                        <div className="field-row"><span className="field-label">Téléphone :</span><span className="field-value">{secondDriverClient?.telephone || "—"}</span></div>
                        <div className="field-row"><span className="field-label">Email :</span><span className="field-value">{secondDriverClient?.email || "—"}</span></div>
                      </>
                    ) : (
                      <>
                        <div className="field-row"><span className="field-label">Nom :</span><span className="field-value">—</span></div>
                        <div className="field-row"><span className="field-label">Prénom :</span><span className="field-value">—</span></div>
                        <div className="field-row"><span className="field-label">Date naissance :</span><span className="field-value">—</span></div>
                        <div className="field-row"><span className="field-label">Lieu naissance :</span><span className="field-value">—</span></div>
                        <div className="field-row"><span className="field-label">CIN :</span><span className="field-value">—</span></div>
                        <div className="field-row"><span className="field-label">Expire le :</span><span className="field-value">—</span></div>
                        <div className="field-row"><span className="field-label">Permis N° :</span><span className="field-value">—</span></div>
                        <div className="field-row"><span className="field-label">Expire le :</span><span className="field-value">—</span></div>
                        <div className="field-row"><span className="field-label">Adresse :</span><span className="field-value">—</span></div>
                        <div className="field-row"><span className="field-label">Téléphone :</span><span className="field-value">—</span></div>
                        <div className="field-row"><span className="field-label">Email :</span><span className="field-value">—</span></div>
                      </>
                    )
                  )}
                </div>
              </div>
            </td>

            <td className="contract-right-col">
              <div className="contract-section">
                <div className="section-title-print">VÉHICULE</div>
                <div className="section-content">
                  <div className="field-row"><span className="field-label">Immatriculation :</span><span className="field-value matricule-code">{getDisplayValue(vehicleInfoOption, reservation?.matricule?.matricule_code || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Marque/Modèle :</span><span className="field-value">{getDisplayValue(vehicleInfoOption, `${reservation?.car?.brand || ""} ${reservation?.car?.model || ""}`.trim() || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Couleur :</span><span className="field-value">{getDisplayValue(vehicleInfoOption, reservation?.car?.color || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Année :</span><span className="field-value">{getDisplayValue(vehicleInfoOption, reservation?.car?.year || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Carburant :</span><span className="field-value">{getDisplayValue(vehicleInfoOption, reservation?.car?.fuel_type || "—")}</span></div>
                  <div className="field-row"><span className="field-label">Transmission :</span><span className="field-value">{getDisplayValue(vehicleInfoOption, reservation?.car?.transmission || "—")}</span></div>
                </div>
              </div>

              <div className="contract-section">
                <div className="section-title-print">LOCATION</div>
                <div className="section-content">
                  <div className="field-row"><span className="field-label">Départ :</span><span className="field-value">{getDisplayValue(datesOption, `${formatDate(reservation?.start_date)} à ${reservation?.start_time || "08:00"}`)}</span></div>
                  <div className="field-row"><span className="field-label">Retour :</span><span className="field-value">{getDisplayValue(datesOption, `${formatDate(reservation?.end_date)} à ${reservation?.end_time || "18:00"}`)}</span></div>
                  <div className="field-row"><span className="field-label">Durée :</span><span className="field-value">{getDisplayValue(rentalDaysOption, `${calculateRentalDays()} jours`)}</span></div>
                  <div className="field-row"><span className="field-label">Km départ :</span><span className="field-value">{getDisplayValue(kilometrageOption, `${reservation?.kilometrage_sortie || "—"} km`)}</span></div>
                  <div className="field-row">
                    <span className="field-label">Km retour :</span>
                    <span className="field-value">{getDisplayValue(kilometrageOption, reservation?.kilometrage_entree ? `${reservation.kilometrage_entree} km` : "—")}</span>
                  </div>
                  <div className="field-row"><span className="field-label">Livré par :</span><span className="field-value">{getDisplayValue(deliveryReceptionOption, currentUserName)}</span></div>
                  <div className="field-row"><span className="field-label">Reçu par :</span><span className="field-value">{getDisplayValue(deliveryReceptionOption, reservationCreatorName)}</span></div>
                </div>
              </div>

              <div className="contract-section pricing-section">
                <div className="section-title-print">TARIFS</div>
                <div className="section-content">
                  <div className="field-row"><span className="field-label">Prix journalier :</span><span className="field-value">{getDisplayValue(pricesOption, `${dailyPrice} DH`)}</span></div>
                  <div className="field-row total-row"><span className="field-label">Total TTC :</span><span className="field-value total-amount">{getDisplayValue(pricesOption, `${reservation?.total_price || "—"} DH`)}</span></div>
                  <div className="field-row"><span className="field-label">Montant payé :</span><span className="field-value">{getDisplayValue(pricesOption, `${reservation?.amount_paid || "0"} DH`)}</span></div>
                  <div className="field-row"><span className="field-label">Reste à payer :</span><span className="field-value remaining-amount">{getDisplayValue(pricesOption, `${reservation?.remaining_amount || reservation?.total_price || "0"} DH`)}</span></div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="contract-section checklist-section-print">
        <div className="section-title-print">CHECKLIST - ÉTAT DU VÉHICULE</div>
        <div className="checklist-content">
          <table className="checklist-table" cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <td className="checklist-cell">
                  <div className="checklist-label">État de départ :</div>
                  <CarDiagram />
                </td>
                <td className="checklist-cell">
                  <div className="checklist-label">État de retour :</div>
                  <CarDiagram />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="documents-row">
            <span className="documents-label">Documents remis :</span>
            <div className="documents-items">
              <span className="doc-item"><CheckboxComponent checked={paperwork.carteGrise} /> Carte grise</span>
              <span className="doc-item"><CheckboxComponent checked={paperwork.assurance} /> Assurance</span>
              <span className="doc-item"><CheckboxComponent checked={paperwork.vignette} /> Vignette</span>
              <span className="doc-item"><CheckboxComponent checked={paperwork.visiteTechnique} /> Visite technique</span>
              <span className="doc-item"><CheckboxComponent checked={paperwork.autorisation} /> Autorisation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="kilometrage-clause-section">
        <div className="kilometrage-clause-title">⚠️ IMPORTANT - CLAUSE DE DÉPASSEMENT DE KILOMÉTRAGE</div>
        <div className="kilometrage-clause-text">
          En cas de dépassement du kilométrage mentionné (200km par jour), vous allez payer 1.5 DH pour chaque kilomètre additionnel au-delà de la limite autorisée.
        </div>
      </div>

      <div className="observations-row-print">
        <ObservationBox title="Observations" option={observationsOption}>
          <div className="observation-text">
            {getDisplayValue(observationsOption,
              `Véhicule loué en bon état général. Le client s'engage à retourner le véhicule dans le même état.`,
              "___________",
              ""
            )}
          </div>
        </ObservationBox>
        <ObservationBox title="Assurance" option={insuranceOption}>
          <div className="observation-text">
            {getDisplayValue(insuranceOption,
              "Assurance tous risques incluse. Franchise applicable en cas de sinistre.",
              "___________",
              ""
            )}
          </div>
        </ObservationBox>
        <ObservationBox title="Caution" isHalf option={depositGuaranteeOption}>
          <div className="observation-text">
            Caution: {getDisplayValue(depositGuaranteeOption, `${reservation?.amount_paid ? `${reservation.amount_paid} DH` : "_________"} DH`, "_________", "")}
          </div>
        </ObservationBox>
      </div>

      <div className="signatures-row-print">
        <SignatureBlock label="Signature de l'agent" signature={showSignatures ? signatures.agent : ""} option={signaturesOption} />
        <SignatureBlock label="Signature du locataire" signature={showSignatures ? locataireSignature : ""} option={signaturesOption} />
        <SignatureBlock label="Signature 2ème conducteur" signature={showSignatures ? signatures.secondConducteur : ""} option={signaturesOption} />
      </div>

      <div className="contract-footer-print">
        <div className="footer-line">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
            <Building2 size={8} /> SMAITI LUXE CAR SARL - Capital 500 000 DH
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", marginLeft: "6px" }}>
            <FileCheck size={8} /> RC : 702167 - IF : 68792347 - TP : 36208941 - ICE : 003818317000048 - CNSS : 6515943
          </span>
        </div>
        <div className="footer-line">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
            <MapPin size={8} /> SIEGE SOCIAL:43 OP KASBAT EL AMINE CASABLANCA
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", marginLeft: "6px" }}>
            <Phone size={8} /> 0665 92 19 21
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", marginLeft: "6px" }}>
            <Mail size={8} /> smaitiluxecar@gmail.com
          </span>
        </div>
      </div>

      <style>{`
        /* === Global === */
        .contract-container-print {
          max-width: 1100px;
          margin: 0 auto;
          background: white;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: #1a2c3e;
          line-height: 1.5;
          padding: 0 6px;
        }
        .contract-header-table {
          width: 100%;
          border-bottom: 2px solid #d4af37;
          margin-bottom: 10px;
          padding-bottom: 6px;
        }
        .header-left { width: 30%; vertical-align: top; }
        .header-center { width: 40%; text-align: center; vertical-align: middle; }
        .header-right { width: 30%; text-align: right; vertical-align: top; }
        .company-name { font-size: 20px; font-weight: 800; letter-spacing: 1.5px; color: #1e293b; }
        .company-slogan { font-size: 10px; font-weight: 600; margin-top: 2px; color: #b8860b; }
        .company-phone { font-size: 9px; margin-top: 4px; color: #475569; }
        .contract-logo-print { height: 75px; width: auto; object-fit: contain; }
        .contract-number-box {
          border: 1px solid #94a3b8;
          padding: 6px 12px;
          text-align: center;
          font-size: 10px;
          display: inline-block;
          background: #fefce8;
          border-radius: 8px;
        }
        .arabic-text { margin-top: 6px; font-size: 12px; font-weight: 500; color: #475569; }
        .contract-title-print {
          text-align: center;
          font-size: 17px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 10px;
          border-bottom: 1px solid #94a3b8;
          padding-bottom: 6px;
          color: #0f172a;
        }
        .contract-content-table { width: 100%; }
        .contract-left-col { width: 50%; vertical-align: top; padding-right: 12px; }
        .contract-right-col { width: 50%; vertical-align: top; padding-left: 12px; }
        .contract-section {
          margin-bottom: 8px;
          border: 1px solid #000000;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }
        .section-title-print {
          background: #c0dfc1;
          padding: 6px 12px;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #000000;
          color: #1e293b;
        }
        .checklist-section-print .checklist-table,
        .checklist-section-print .doc-item,
        .observation-box,
        .signature-box,
        .kilometrage-clause-section {
          border-color: #000000 !important;
        }
        .checklist-section-print .section-title-print {
          background: #c0dfc1 !important;
        }
        .obs-title {
          background: #c0dfc1 !important;
          border-bottom: 1px solid #000000;
        }
        .section-content { padding: 8px 12px; }
        .field-row {
          display: flex;
          margin-bottom: 4px;
          font-size: 10px;
          align-items: baseline;
        }
        .field-label {
          width: 100px;
          font-weight: 600;
          color: #475569;
          flex-shrink: 0;
        }
        .field-value {
          flex: 1;
          border-bottom: 1px dotted #cbd5e1;
          padding-left: 4px;
          color: #0f172a;
        }
        .matricule-code { font-family: 'Courier New', monospace; font-weight: 700; color: #b8860b; letter-spacing: 0.5px; }
        .total-row .total-amount { font-weight: 800; font-size: 12px; color: #b8860b; }
        .remaining-amount { font-weight: 700; color: #dc2626; }
        .pricing-section { border-left: 4px solid #d4af37; }
        .checklist-section-print { margin: 8px 0; }
        .checklist-table { width: 100%; margin-bottom: 8px; }
        .checklist-cell { width: 50%; text-align: center; vertical-align: top; padding: 0 6px; }
        .checklist-label { font-weight: 700; margin-bottom: 4px; font-size: 10px; color: #334155; }
        .documents-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 8px;
          margin-top: 6px;
          gap: 10px;
        }
        .documents-label { font-weight: 700; margin-right: 4px; font-size: 10px; color: #334155; }
        .documents-items { display: flex; flex-wrap: wrap; gap: 10px; }
        .doc-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          background: white;
          padding: 3px 8px;
          border-radius: 12px;
          border: 1px solid #94a3b8;
        }
        .checkbox-square {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 13px;
          height: 13px;
          border: 1.5px solid #334155;
          background: white;
          font-size: 9px;
          font-weight: bold;
          margin-right: 2px;
          border-radius: 2px;
        }
        .checkbox-square.checked { background: #d4af37 !important; border-color: #d4af37 !important; color: #0f172a !important; }
        .car-diagram-container img {
          width: 100%;
          max-width: 130px;
          height: auto;
          border: 1px solid #94a3b8;
          border-radius: 6px;
          background: #fafafa;
          padding: 4px;
        }
        .kilometrage-clause-section {
          margin: 10px 0;
          padding: 10px 16px;
          border: 2px solid #eab308;
          border-radius: 10px;
          background: #fefce8;
          box-shadow: 0 1px 4px rgba(234, 179, 8, 0.15);
        }
        .kilometrage-clause-title {
          font-size: 11px;
          font-weight: 800;
          color: #92400e;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .kilometrage-clause-text {
          font-size: 10.5px;
          color: #1a2c3e;
          line-height: 1.5;
          font-weight: 500;
        }
        .observations-row-print { display: flex; flex-wrap: wrap; gap: 12px; margin: 8px 0; }
        .observation-box {
          flex: 1;
          border: 1px solid #94a3b8;
          border-radius: 10px;
          overflow: hidden;
          background: white;
        }
        .observation-box.half-width { flex: 0 0 calc(33.33% - 8px); }
        .obs-title {
          display: block;
          padding: 6px 12px;
          background: #f8fafc;
          font-weight: 700;
          font-size: 10px;
          border-bottom: 1px solid #94a3b8;
          color: #1e293b;
        }
        .observation-content {
          padding: 8px 12px;
          font-size: 9.5px;
          min-height: 50px;
          color: #334155;
        }
        .signatures-row-print { display: flex; gap: 20px; margin: 10px 0; }
        .signature-block { flex: 1; text-align: center; }
        .signature-label { font-size: 9px; font-weight: 700; margin-bottom: 6px; color: #475569; }
        .signature-box {
          border: 1px solid #94a3b8;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafafa;
          border-radius: 6px;
          overflow: hidden;
        }
        .signature-box img {
          max-height: 45px;
          max-width: 90%;
          object-fit: contain;
        }
        .signature-text {
          font-size: 9px;
          font-style: italic;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .contract-footer-print {
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px solid #d4af37;
          text-align: center;
          font-size: 8px;
          color: #64748b;
        }
        .footer-line { margin-bottom: 2px; line-height: 1.3; }
        .contract-number-box.stylish {
          border: none;
          background: #f1fee8d1;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          padding: 4px 14px;
        }
        .contract-number-box.stylish .contract-number-label { font-size: 9px; color: #92400e; letter-spacing: 1px; }
        .contract-number-box.stylish .contract-number-value { font-size: 20px; font-weight: 800; color: #1a1a2e; }
        @media print {
          .contract-container-print { margin: 0; padding: 0; background: white; }
          .checkbox-square.checked { background: black !important; border-color: black !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .section-title-print { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .documents-row { background: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .contract-number-box.stylish { background: #fefce8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .kilometrage-clause-section { background: #fefce8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .contract-container-print .field-value { font-weight: 600; }
        .contract-container-print .observation-content { font-weight: 500; }
        .contract-container-print .kilometrage-clause-text { font-weight: 600; }
      `}</style>
    </div>
  );
};

// ==================== SecondDriverSearch ====================
const SecondDriverSearch = ({ clients, selectedClientId, selectedSecondDriverId, onSelect, onCreateNew }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewDriver, setIsNewDriver] = useState(false);
  const dispatch = useDispatch();
  const [newDriverData, setNewDriverData] = useState({
    prenom: "", nom: "", telephone: "", email: "", city: "",
    cin_number: "", driver_license_number: ""
  });
  const [creatingDriver, setCreatingDriver] = useState(false);

  const filteredDrivers = useMemo(() => {
    if (!searchTerm.trim() || isNewDriver || !clients || !Array.isArray(clients)) return [];
    const term = searchTerm.toLowerCase().trim();
    return clients
      .filter(client => {
        if (!client || typeof client !== "object") return false;
        if (selectedClientId && client.id === selectedClientId) return false;
        const fullName = `${client.prenom || ""} ${client.nom || ""}`.toLowerCase();
        const email = (client.email || "").toLowerCase();
        const telephone = (client.telephone || "").toLowerCase();
        return fullName.includes(term) || email.includes(term) || telephone.includes(term);
      })
      .slice(0, 10);
  }, [searchTerm, isNewDriver, clients, selectedClientId]);

  const handleSelect = (client) => {
    onSelect(client);
    setSearchTerm("");
    setIsNewDriver(false);
  };

  const handleCreateNew = () => {
    setIsNewDriver(true);
    setNewDriverData({
      prenom: "", nom: "", telephone: "", email: "", city: "",
      cin_number: "", driver_license_number: ""
    });
  };

  const handleCancelNew = () => {
    setIsNewDriver(false);
    setNewDriverData({
      prenom: "", nom: "", telephone: "", email: "", city: "",
      cin_number: "", driver_license_number: ""
    });
  };

  const handleSaveNewDriver = async () => {
    if (!newDriverData.prenom || !newDriverData.nom || !newDriverData.telephone) {
      toast.error("Veuillez remplir les champs obligatoires (Prénom, Nom, Téléphone)");
      return;
    }
    setCreatingDriver(true);
    try {
      const result = await dispatch(createClient(newDriverData)).unwrap();
      const newClient = result.client || result;
      toast.success("Conducteur créé avec succès");
      onSelect(newClient);
      setIsNewDriver(false);
      setSearchTerm("");
      setNewDriverData({
        prenom: "", nom: "", telephone: "", email: "", city: "",
        cin_number: "", driver_license_number: ""
      });
    } catch (error) {
      toast.error("Erreur lors de la création du conducteur");
    } finally {
      setCreatingDriver(false);
    }
  };

  if (isNewDriver) {
    return (
      <div className="inline-new-client" style={{ marginTop: "1rem" }}>
        <div className="inline-section-header" style={{ marginBottom: "1rem" }}>
          <Gem size={18} />
          <h3>Nouveau conducteur</h3>
        </div>
        <div className="input-group-row">
          <div className="field-block"><label><User size={14} /> Prénom *</label><input type="text" className="styled-input" value={newDriverData.prenom} onChange={(e) => setNewDriverData(prev => ({ ...prev, prenom: e.target.value }))} required /></div>
          <div className="field-block"><label><User size={14} /> Nom *</label><input type="text" className="styled-input" value={newDriverData.nom} onChange={(e) => setNewDriverData(prev => ({ ...prev, nom: e.target.value }))} required /></div>
        </div>
        <div className="input-group-row">
          <div className="field-block"><label><Phone size={14} /> Téléphone *</label><input type="tel" className="styled-input" value={newDriverData.telephone} onChange={(e) => setNewDriverData(prev => ({ ...prev, telephone: e.target.value }))} required /></div>
          <div className="field-block"><label><Mail size={14} /> Email</label><input type="email" className="styled-input" value={newDriverData.email} onChange={(e) => setNewDriverData(prev => ({ ...prev, email: e.target.value }))} /></div>
        </div>
        <div className="input-group-row">
          <div className="field-block"><label><MapPin size={14} /> Ville</label><input type="text" className="styled-input" value={newDriverData.city} onChange={(e) => setNewDriverData(prev => ({ ...prev, city: e.target.value }))} /></div>
          <div className="field-block"><label><IdCard size={14} /> CIN</label><input type="text" className="styled-input" value={newDriverData.cin_number} onChange={(e) => setNewDriverData(prev => ({ ...prev, cin_number: e.target.value }))} /></div>
        </div>
        <div className="input-group-row">
          <div className="field-block"><label><Key size={14} /> Permis</label><input type="text" className="styled-input" value={newDriverData.driver_license_number} onChange={(e) => setNewDriverData(prev => ({ ...prev, driver_license_number: e.target.value }))} /></div>
        </div>
        <div className="modal-footer-actions" style={{ marginTop: "1rem" }}>
          <button type="button" className="btn-modal-secondary" onClick={handleCancelNew}>Annuler</button>
          <button type="button" className="btn-modal-primary" onClick={handleSaveNewDriver} disabled={creatingDriver}>
            {creatingDriver ? "Création..." : "Créer le conducteur"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-search-section" style={{ marginTop: "0.5rem" }}>
      <div className="inline-search-input-wrapper">
        <Search size={18} />
        <input
          type="text"
          className="styled-input padded-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un conducteur par nom, email ou téléphone..."
        />
      </div>
      {filteredDrivers.length > 0 && (
        <div className="styled-dropdown" style={{ position: 'static', marginTop: '4px' }}>
          {filteredDrivers.map(driver => (
            <div key={driver.id} className="dropdown-item" onClick={() => handleSelect(driver)}>
              <div className="dropdown-title"><strong>{driver.prenom} {driver.nom}</strong></div>
              <div className="dropdown-sub">{driver.telephone} • {driver.email}</div>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="btn-modal-secondary" onClick={handleCreateNew} style={{ marginTop: "0.5rem", width: '100%' }}>
        <UserPlus size={16} /> Créer un nouveau conducteur
      </button>
    </div>
  );
};

// ==================== SousLocationSearch ====================
const SousLocationSearch = ({ sousLocations, selectedId, onSelect, onCreateNew, canCreate = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const list = Array.isArray(sousLocations) ? sousLocations : [];
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase().trim();
    return list.filter(sl => sl.name.toLowerCase().includes(term));
  }, [list, searchTerm]);

  const selected = list.find(sl => sl.id === selectedId);

  return (
    <div className="sous-location-search" ref={wrapperRef}>
      <div className="inline-search-input-wrapper" onClick={() => setIsOpen(true)}>
        <Search size={16} />
        <input
          type="text"
          className="styled-input padded-input"
          placeholder="Rechercher une sous‑location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        {selected && !searchTerm && (
          <span className="selected-badge">{selected.name}</span>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="styled-dropdown" style={{ position: 'static', marginTop: '4px' }}>
          {filtered.map(sl => (
            <div
              key={sl.id}
              className={`dropdown-item ${selectedId === sl.id ? 'active' : ''}`}
              onClick={() => {
                onSelect(sl.id);
                setSearchTerm("");
                setIsOpen(false);
              }}
            >
              <div className="dropdown-title"><strong>{sl.name}</strong></div>
              {sl.description && <div className="dropdown-sub">{sl.description}</div>}
            </div>
          ))}
        </div>
      )}

      {isOpen && filtered.length === 0 && (
        <div className="inline-empty-state">
          <p>Aucune sous‑location trouvée.</p>
        </div>
      )}

      {canCreate && (
        <button
          type="button"
          className="btn-modal-secondary"
          style={{ marginTop: '0.5rem', width: '100%' }}
          onClick={onCreateNew}
        >
          <Plus size={14} /> Créer une sous‑location
        </button>
      )}
    </div>
  );
};

// ==================== ReservationForm ====================
const ReservationForm = ({
  isOpen, onClose, onSubmit, editingReservation, clients, cars, matricules, submitting,onSubmitAndNavigate   
}) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const myPermissions = useSelector(state => state.permissions?.myPermissions || []);
  const canCreateSousLocation = user && (
    user.role === 'admin' ||
    user.role === 'superadmin' ||
    (Array.isArray(myPermissions) && myPermissions.includes('sous-locations'))
  );

  const sousLocations = useSelector(selectSousLocations);

  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    start_time: "08:00",
    end_time: "18:00",
    rental_days: 1,
    total_price: 0,
    amount_paid: 0,
    remaining_amount: 0,
    status: "pending",
    car_id: "",
    client_id: "",
    matricule_id: "",
    has_second_driver: false,
    second_driver_client_id: "",
    notes: "",
    reception_notes: "",
    kilometrage_sortie: "",
    kilometrage_entree: "",
    sous_location_id: "",
    can_extend_days: false,
  });

  const [clientSearch, setClientSearch] = useState("");
  const [isNewClient, setIsNewClient] = useState(false);
  const [carMatricules, setCarMatricules] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [newPayment, setNewPayment] = useState({
    amount: "", date: new Date().toISOString().split("T")[0],
    method: "cash", notes: ""
  });
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [creatingClient, setCreatingClient] = useState(false);
  const [matriculeSearch, setMatriculeSearch] = useState("");
  const [selectedMatricule, setSelectedMatricule] = useState(null);
  const [filteredMatricules, setFilteredMatricules] = useState([]);
  const [newClientData, setNewClientData] = useState({
    prenom: "", nom: "", telephone: "", email: "", city: "",
    cin_number: "", driver_license_number: "", date_naissance: "",
    lieu_naissance: "", cin_delivre_le: "", permis_delivre_le: ""
  });

  const [showCreateSousLocationModal, setShowCreateSousLocationModal] = useState(false);
  const [newSousLocationName, setNewSousLocationName] = useState('');
  const [newSousLocationDesc, setNewSousLocationDesc] = useState('');

  // NEW STATES FOR DROPDOWN VISIBILITY
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isMatriculeDropdownOpen, setIsMatriculeDropdownOpen] = useState(false);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim() || isNewClient || !clients || !Array.isArray(clients)) return [];
    const searchTerm = clientSearch.toLowerCase().trim();
    return clients
      .filter(client => {
        if (!client || typeof client !== "object") return false;
        const fullName = `${client.prenom || ""} ${client.nom || ""}`.toLowerCase();
        const email = (client.email || "").toLowerCase();
        const telephone = (client.telephone || "").toLowerCase();
        return fullName.includes(searchTerm) || email.includes(searchTerm) || telephone.includes(searchTerm);
      })
      .slice(0, 10);
  }, [clientSearch, isNewClient, clients]);

  useEffect(() => {
    if (!matriculeSearch.trim() || !matricules || !Array.isArray(matricules)) {
      setFilteredMatricules([]);
      return;
    }
    const searchTerm = matriculeSearch.toLowerCase().trim();
    const filtered = matricules
      .filter(mat => {
        if (!mat || typeof mat !== "object") return false;
        if (mat.status === 'sold') return false;
        const matriculeCode = (mat.matricule_code || "").toLowerCase();
        return matriculeCode.includes(searchTerm);
      })
      .slice(0, 10);
    setFilteredMatricules(filtered);
  }, [matriculeSearch, matricules]);

  useEffect(() => {
    if (editingReservation) {
      const computeRentalDays = (start, end) => {
        if (!start || !end) return 1;
        const startDate = new Date(start);
        const endDate = new Date(end);
        startDate.setHours(0,0,0,0);
        endDate.setHours(0,0,0,0);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 0 ? 1 : diffDays;
      };

      setFormData({
        start_date: editingReservation.start_date?.split("T")[0] || "",
        end_date: editingReservation.end_date?.split("T")[0] || "",
        start_time: editingReservation.start_time || "08:00",
        end_time: editingReservation.end_time || "18:00",
        rental_days: editingReservation.rental_days || editingReservation.total_days || 
                     (editingReservation.start_date && editingReservation.end_date 
                       ? computeRentalDays(editingReservation.start_date, editingReservation.end_date) 
                       : 1),
        total_price: editingReservation.total_price || 0,
        amount_paid: editingReservation.amount_paid || 0,
        remaining_amount: editingReservation.remaining_amount || 0,
        status: editingReservation.status || "pending",
        car_id: editingReservation.car_id || "",
        client_id: editingReservation.client_id || "",
        matricule_id: editingReservation.matricule_id || "",
        has_second_driver: editingReservation.has_second_driver || false,
        second_driver_client_id: editingReservation.second_driver_client_id || "",
        notes: editingReservation.notes || "",
        reception_notes: editingReservation.reception_notes || "",
        kilometrage_sortie: editingReservation.kilometrage_sortie || "",
        kilometrage_entree: editingReservation.kilometrage_entree || "",
        sous_location_id: editingReservation.sous_location_id || "",
        can_extend_days: editingReservation.can_extend_days || false,
      });
      setPaymentHistory(
        Array.isArray(editingReservation.payment_history)
          ? editingReservation.payment_history
          : []
      );
      if (editingReservation.client_id) {
        const client = clients.find(c => c.id === editingReservation.client_id);
        if (client) {
          setSelectedClient(client);
          setClientSearch(`${client.prenom} ${client.nom}`);
        }
      }
      if (editingReservation.matricule_id) {
        const matricule = matricules.find(m => m.id === editingReservation.matricule_id);
        if (matricule) {
          setSelectedMatricule(matricule);
          setMatriculeSearch(matricule.matricule_code);
          if (matricule.car_id) {
            setFormData(prev => ({ ...prev, car_id: matricule.car_id }));
          }
        }
      }
    }
  }, [editingReservation, clients, matricules]);

  useEffect(() => {
    if (formData.car_id) {
      const filtered = matricules.filter(m => m.car_id == formData.car_id);
      setCarMatricules(filtered);
    } else {
      setCarMatricules([]);
    }
  }, [formData.car_id, matricules]);

  useEffect(() => {
    if (formData.matricule_id) {
      const selectedMatriculeObj = matricules.find(m => m.id == formData.matricule_id);
      if (selectedMatriculeObj && (!formData.kilometrage_sortie || formData.kilometrage_sortie === "")) {
        setFormData(prev => ({ ...prev, kilometrage_sortie: selectedMatriculeObj.kilometrage }));
      }
    }
  }, [formData.matricule_id, matricules]);

  useEffect(() => {
    if (!editingReservation && formData.car_id && formData.rental_days) {
      const car = cars.find(c => c.id == formData.car_id);
      if (car) {
        const total = car.price_per_day * formData.rental_days;
        setFormData(prev => ({ ...prev, total_price: total }));
      }
    }
  }, [formData.car_id, formData.rental_days, cars, editingReservation]);

  useEffect(() => {
    const total = parseFloat(formData.total_price) || 0;
    const paid = parseFloat(formData.amount_paid) || 0;
    const remaining = Math.max(total - paid, 0);
    setFormData(prev => ({ ...prev, remaining_amount: remaining }));
  }, [formData.total_price, formData.amount_paid]);


  useEffect(() => {
    if (isOpen) {
      dispatch(fetchSousLocations());
    }
  }, [isOpen, dispatch]);

  const handleStartDateChange = (value) => {
    setFormData(prev => ({ ...prev, start_date: value }));
    if (value && formData.rental_days) {
      const start = new Date(value);
      const end = new Date(start);
      end.setDate(start.getDate() + formData.rental_days);
      setFormData(prev => ({ ...prev, end_date: end.toISOString().split("T")[0] }));
    }
  };

  const handleEndDateChange = (value) => {
    setFormData(prev => ({ ...prev, end_date: value }));
    if (formData.start_date && value) {
      const start = new Date(formData.start_date);
      const end = new Date(value);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData(prev => ({ ...prev, rental_days: diffDays === 0 ? 1 : diffDays }));
    }
  };

  const handleRentalDaysChange = (value) => {
    if (value === '') {
      setFormData(prev => ({ ...prev, rental_days: null }));
      return;
    }
    const days = parseInt(value, 10);
    if (!isNaN(days) && days >= 1) {
      setFormData(prev => ({ ...prev, rental_days: days }));
      if (formData.start_date) {
        const start = new Date(formData.start_date);
        const end = new Date(start);
        end.setDate(start.getDate() + days);
        setFormData(prev => ({ ...prev, end_date: end.toISOString().split('T')[0] }));
      }
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setIsNewClient(false);
    setFormData(prev => ({ ...prev, client_id: client.id }));
    setClientSearch(`${client.prenom} ${client.nom}`);
    setIsClientDropdownOpen(false);
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setIsNewClient(true);
    setFormData(prev => ({ ...prev, client_id: "" }));
    setClientSearch("");
    setNewClientData({
      prenom: "", nom: "", telephone: "", email: "", city: "",
      cin_number: "", driver_license_number: "", date_naissance: "",
      lieu_naissance: "", cin_delivre_le: "", permis_delivre_le: ""
    });
  };

  const handleSaveNewClient = async () => {
    if (!newClientData.prenom || !newClientData.nom || !newClientData.telephone) {
      toast.error("Veuillez remplir les champs obligatoires du client (Prénom, Nom, Téléphone)");
      return;
    }
    setCreatingClient(true);
    try {
      const result = await dispatch(createClient(newClientData)).unwrap();
      const newClient = result.client || result;
      toast.success("Client créé avec succès");
      handleClientSelect(newClient);
      setIsNewClient(false);
      setNewClientData({
        prenom: "", nom: "", telephone: "", email: "", city: "",
        cin_number: "", driver_license_number: "", date_naissance: "",
        lieu_naissance: "", cin_delivre_le: "", permis_delivre_le: ""
      });
    } catch (error) {
      toast.error("Erreur lors de la création du client");
    } finally {
      setCreatingClient(false);
    }
  };

  const handleMatriculeSelect = (matricule) => {
    setSelectedMatricule(matricule);
    setMatriculeSearch(matricule.matricule_code);
    setFormData(prev => ({
      ...prev,
      matricule_id: matricule.id,
      car_id: matricule.car_id,
      kilometrage_sortie: matricule.kilometrage || ""
    }));
    const associatedCar = cars.find(c => c.id == matricule.car_id);
    if (associatedCar) {
      toast.success(`Véhicule sélectionné: ${associatedCar.brand} ${associatedCar.model}`);
    }
    setFilteredMatricules([]);
    setIsMatriculeDropdownOpen(false);
  };

  const handleAddPayment = () => {
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    const amount = parseFloat(newPayment.amount);
    const currentTotalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    const maxPossible = (formData.total_price || 0) - currentTotalPaid;

    if (maxPossible <= 0) {
      toast.error("Cette réservation est déjà entièrement payée.");
      return;
    }

    let actualAmount = amount;
    if (actualAmount > maxPossible) {
      actualAmount = maxPossible;
      toast.info(`Le paiement a été ajusté à ${actualAmount} DH (reste à payer).`);
    }

    const payment = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: actualAmount,
      date: newPayment.date,
      method: newPayment.method,
      notes: newPayment.notes || "",
      created_at: new Date().toISOString()
    };

    const updatedHistory = [...paymentHistory, payment];
    setPaymentHistory(updatedHistory);
    const newAmountPaid = updatedHistory.reduce((sum, p) => sum + p.amount, 0);
    const newRemaining = (formData.total_price || 0) - newAmountPaid;

    setFormData(prev => ({
      ...prev,
      amount_paid: newAmountPaid,
      remaining_amount: newRemaining
    }));

    setNewPayment({ amount: "", date: new Date().toISOString().split("T")[0], method: "cash", notes: "" });
    setShowAddPayment(false);
    toast.success("Paiement ajouté");
  };

  const handleRemovePayment = (paymentId) => {
    const updatedHistory = paymentHistory.filter(p => p.id !== paymentId);
    setPaymentHistory(updatedHistory);
    const newAmountPaid = updatedHistory.reduce((sum, p) => sum + p.amount, 0);
    const newRemaining = (formData.total_price || 0) - newAmountPaid;
    setFormData(prev => ({
      ...prev,
      amount_paid: newAmountPaid,
      remaining_amount: newRemaining
    }));
    toast.success("Paiement supprimé");
  };

  // ===== VALIDATION HELPER =====
const getValidatedData = () => {
  let clientId = formData.client_id;
  if (isNewClient && !clientId) {
    toast.error("Veuillez confirmer la création du client en cliquant sur 'Confirmer la création'");
    return null;
  }
  if (!clientId) {
    toast.error("Veuillez sélectionner ou créer un client");
    return null;
  }
  const reservationData = {
    ...formData,
    client_id: clientId,
    payment_history: paymentHistory
  };
  return reservationData;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  const data = getValidatedData();
  if (!data) return;
  onSubmit(data);
};

const handleSubmitAndNavigate = () => {
  const data = getValidatedData();
  if (!data) return;
  if (onSubmitAndNavigate) {
    onSubmitAndNavigate(data);
  } else {
    onSubmit(data);
  }
};

  // === NEW CLEAR FUNCTIONS ===
  const clearClientSelection = () => {
    setSelectedClient(null);
    setClientSearch('');
    setFormData(prev => ({ ...prev, client_id: '' }));
    setIsClientDropdownOpen(false);
  };

  const clearMatriculeSelection = () => {
    setSelectedMatricule(null);
    setMatriculeSearch('');
    setFormData(prev => ({ ...prev, matricule_id: '', car_id: '' }));
    setIsMatriculeDropdownOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-glass-container">
      <div className="modal-header-hero primary-hero">
        <div className="hero-left">
          <div className="hero-icon-wrapper primary-glow">
            {editingReservation ? <Sparkles size={24} /> : <Star size={24} />}
          </div>
          <div className="hero-text">
            <span className="hero-badge primary-badge">{editingReservation ? "Mise à jour" : "Création"}</span>
            <h2>{editingReservation ? "Modifier la réservation" : "Nouvelle réservation"}</h2>
            <p>{editingReservation ? "Modifiez les détails de la réservation" : "Créez une nouvelle réservation en quelques clics"}</p>
          </div>
        </div>
        <button onClick={onClose} className="hero-close-btn"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="modal-body-form">
        <div className="modal-grid-2">
          <div className="form-column">
            <div className="form-card">
              <div className="card-header">
                <User size={16} className="text-emerald" />
                <h4>Client</h4>
              </div>
              {!isNewClient ? (
                <>
                  {/* MODIFIED CLIENT SEARCH */}
                  <div className="field-block relative-block" style={{ marginBottom: '12px' }}>
                    <label>Rechercher un client</label>
                    <div className="input-with-icon">
                      <Search size={16} className="input-icon" />
                      <input
                        type="text"
                        className="styled-input padded-input"
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setIsClientDropdownOpen(true);
                        }}
                        onFocus={() => setIsClientDropdownOpen(true)}
                        placeholder="Nom, email, téléphone..."
                      />
                    </div>
                    {isClientDropdownOpen && filteredClients.length > 0 && (
                      <div className="styled-dropdown">
                        {filteredClients.map(client => (
                          <div key={client.id} className="dropdown-item" onClick={() => handleClientSelect(client)}>
                            <div className="dropdown-title"><strong>{client.prenom} {client.nom}</strong></div>
                            <div className="dropdown-sub">{client.telephone} • {client.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="button" className="btn-modal-secondary" onClick={handleNewClient} style={{ width: '100%', marginTop: '4px' }}>
                      <UserPlus size={14} /> Créer un nouveau client
                    </button>
                    {selectedClient && (
                      <div className="selected-info-block">
                        <CheckCircle size={16} className="selected-icon" />
                        <span className="selected-label">Client sélectionné :</span>
                        <span className="selected-value">{selectedClient.prenom} {selectedClient.nom}</span>
                        <button type="button" className="selected-clear" onClick={clearClientSelection}>
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="inline-new-client">
                  <div className="input-group-row">
                    <div className="field-block"><label>Prénom *</label><input type="text" className="styled-input" value={newClientData.prenom} onChange={(e) => setNewClientData(prev => ({ ...prev, prenom: e.target.value }))} required /></div>
                    <div className="field-block"><label>Nom *</label><input type="text" className="styled-input" value={newClientData.nom} onChange={(e) => setNewClientData(prev => ({ ...prev, nom: e.target.value }))} required /></div>
                  </div>
                  <div className="input-group-row">
                    <div className="field-block"><label>Téléphone *</label><input type="tel" className="styled-input" value={newClientData.telephone} onChange={(e) => setNewClientData(prev => ({ ...prev, telephone: e.target.value }))} required /></div>
                    <div className="field-block"><label>Email</label><input type="email" className="styled-input" value={newClientData.email} onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))} /></div>
                  </div>
                  <div className="input-group-row">
                    <div className="field-block"><label>Ville</label><input type="text" className="styled-input" value={newClientData.city} onChange={(e) => setNewClientData(prev => ({ ...prev, city: e.target.value }))} /></div>
                    <div className="field-block"><label>CIN</label><input type="text" className="styled-input" value={newClientData.cin_number} onChange={(e) => setNewClientData(prev => ({ ...prev, cin_number: e.target.value }))} /></div>
                  </div>
                  <div className="input-group-row">
                    <div className="field-block"><label>Permis</label><input type="text" className="styled-input" value={newClientData.driver_license_number} onChange={(e) => setNewClientData(prev => ({ ...prev, driver_license_number: e.target.value }))} /></div>
                    <div className="field-block"><label>Date naissance</label><input type="date" className="styled-input" value={newClientData.date_naissance} onChange={(e) => setNewClientData(prev => ({ ...prev, date_naissance: e.target.value }))} /></div>
                  </div>
                  <div className="input-group-row">
                    <div className="field-block"><label>Lieu naissance</label><input type="text" className="styled-input" value={newClientData.lieu_naissance} onChange={(e) => setNewClientData(prev => ({ ...prev, lieu_naissance: e.target.value }))} /></div>
                    <div className="field-block"><label>CIN délivré le</label><input type="date" className="styled-input" value={newClientData.cin_delivre_le} onChange={(e) => setNewClientData(prev => ({ ...prev, cin_delivre_le: e.target.value }))} /></div>
                  </div>
                  <div className="field-block"><label>Permis délivré le</label><input type="date" className="styled-input" value={newClientData.permis_delivre_le} onChange={(e) => setNewClientData(prev => ({ ...prev, permis_delivre_le: e.target.value }))} /></div>
                  <div className="modal-footer-actions" style={{ marginTop: '12px' }}>
                    <button type="button" className="btn-modal-secondary" onClick={() => setIsNewClient(false)}>Annuler</button>
                    <button type="button" className="btn-modal-primary" onClick={handleSaveNewClient} disabled={creatingClient}>
                      {creatingClient ? "Création..." : "Confirmer la création"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-card">
              <div className="card-header">
                <Users size={16} className="text-emerald" />
                <h4>Deuxième conducteur</h4>
              </div>
              <label className="inline-checkbox">
                <input type="checkbox" checked={formData.has_second_driver} onChange={(e) => setFormData(prev => ({ ...prev, has_second_driver: e.target.checked, second_driver_client_id: "" }))} />
                <span>Ajouter un deuxième conducteur</span>
              </label>
              {formData.has_second_driver && (
                <SecondDriverSearch
                  clients={clients}
                  selectedClientId={formData.client_id}
                  selectedSecondDriverId={formData.second_driver_client_id}
                  onSelect={(client) => setFormData(prev => ({ ...prev, second_driver_client_id: client.id }))}
                  onCreateNew={() => {}}
                />
              )}
              {formData.second_driver_client_id && (
                <div className="inline-selected">
                  <CheckCircle size={20} />
                  <div>
                    <strong>Deuxième conducteur sélectionné</strong>
                    <p>
                      {(() => {
                        const secondDriver = clients.find(c => c.id === parseInt(formData.second_driver_client_id));
                        return secondDriver ? `${secondDriver.prenom} ${secondDriver.nom} - ${secondDriver.telephone}` : "—";
                      })()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="form-card">
              <div className="card-header">
                <Calendar size={16} className="text-emerald" />
                <h4>Dates et durée</h4>
              </div>
              <div className="input-group-row">
                <div className="field-block"><label>Date de début *</label><input type="date" className="styled-input" value={formData.start_date} onChange={(e) => handleStartDateChange(e.target.value)} required /></div>
                <div className="field-block"><label>Heure de début</label><input type="time" className="styled-input" value={formData.start_time} onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))} /></div>
              </div>
              <div className="input-group-row">
                <div className="field-block"><label>Date de fin *</label><input type="date" className="styled-input" value={formData.end_date} onChange={(e) => handleEndDateChange(e.target.value)} required /></div>
                <div className="field-block"><label>Heure de fin</label><input type="time" className="styled-input" value={formData.end_time} onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))} /></div>
              </div>
<div className="field-block"><label>Nombre de jours</label><input type="number" className="styled-input" value={formData.rental_days ?? ''} onChange={(e) => handleRentalDaysChange(e.target.value)} min="1" /></div>     </div>

            <div className="form-card">
              <div className="card-header">
                <Tag size={16} className="text-emerald" />
                <h4>Sous‑location & prolongation</h4>
              </div>
              <div className="input-group-row">
                <div className="field-block">
                  <label>Sous‑location</label>
                  <SousLocationSearch
                    sousLocations={sousLocations}
                    selectedId={formData.sous_location_id}
                    onSelect={(id) => setFormData({ ...formData, sous_location_id: id })}
                    onCreateNew={() => setShowCreateSousLocationModal(true)}
                    canCreate={canCreateSousLocation}
                  />
                </div>
                <div className="field-block">
                  <label>Prolongation autorisée</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.can_extend_days || false}
                      onChange={(e) => setFormData({ ...formData, can_extend_days: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                      Le client pourra prolonger la location
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-column">
            <div className="form-card">
              <div className="card-header">
                <Car size={16} className="text-emerald" />
                <h4>Véhicule</h4>
              </div>
              {/* MODIFIED MATRICULE SEARCH */}
              <div className="field-block relative-block" style={{ marginBottom: '12px' }}>
                <label>Rechercher par immatriculation</label>
                <div className="input-with-icon">
                  <Search size={16} className="input-icon" />
                  <input
                    type="text"
                    className="styled-input padded-input"
                    value={matriculeSearch}
                    onChange={(e) => {
                      setMatriculeSearch(e.target.value);
                      setIsMatriculeDropdownOpen(true);
                    }}
                    onFocus={() => setIsMatriculeDropdownOpen(true)}
                    placeholder="Ex: 12345-A-6"
                  />
                </div>
                {isMatriculeDropdownOpen && filteredMatricules.length > 0 && (
  <div className="styled-dropdown">
    {filteredMatricules.map(mat => {
      const carForMat = cars.find(c => c.id == mat.car_id);
      const isSold = mat.status === 'sold';
      return (
        <div key={mat.id} className="dropdown-item" onClick={() => handleMatriculeSelect(mat)}>
          <div className="dropdown-title">
            <strong>{mat.matricule_code}</strong>
            <span className={`badge ${isSold ? 'badge-danger' : 'badge-success'}`} style={{ marginLeft: '8px' }}>
              {isSold ? 'Inactif' : 'Actif'}
            </span>
            {carForMat && `- ${carForMat.brand} ${carForMat.model}`}
          </div>
          <div className="dropdown-sub">Kilométrage: {mat.kilometrage} km • {carForMat && `${carForMat.price_per_day} DH/jour`}</div>
        </div>
      );
    })}
  </div>
)}
                {selectedMatricule && (
  <div className="selected-info-block">
    <CheckCircle size={16} className="selected-icon" />
    <span className="selected-label">Matricule sélectionné :</span>
    <span className="selected-value">{selectedMatricule.matricule_code}</span>
    <span className={`badge ${selectedMatricule.status === 'sold' ? 'badge-danger' : 'badge-success'}`}>
      {selectedMatricule.status === 'sold' ? 'Inactif' : 'Actif'}
    </span>
    <button type="button" className="selected-clear" onClick={clearMatriculeSelection}>
      <X size={14} />
    </button>
  </div>
)}
              </div>
              <div className="input-group-row">
                <div className="field-block">
                  <label>Véhicule *</label>
                  <select className="styled-select" value={formData.car_id} onChange={(e) => setFormData(prev => ({ ...prev, car_id: e.target.value, matricule_id: "" }))} required disabled={!!selectedMatricule}>
                    <option value="">Choisir un véhicule</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.model} - {car.price_per_day} DH/jour
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-block">
                  <label>Matricule</label>
                  <select className="styled-select" value={formData.matricule_id} onChange={(e) => setFormData(prev => ({ ...prev, matricule_id: e.target.value }))} disabled={!!selectedMatricule}>
                    <option value="">Choisir un matricule</option>
                    {carMatricules.map(mat => (
                      <option key={mat.id} value={mat.id}>
                        {mat.matricule_code} - {mat.kilometrage} km
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="input-group-row">
                <div className="field-block"><label>Km départ</label><input type="number" className="styled-input" value={formData.kilometrage_sortie} onChange={(e) => setFormData(prev => ({ ...prev, kilometrage_sortie: e.target.value }))} placeholder="Kilométrage de sortie" /></div>
                <div className="field-block"><label>Km retour</label><input type="number" className="styled-input" value={formData.kilometrage_entree} onChange={(e) => setFormData(prev => ({ ...prev, kilometrage_entree: e.target.value }))} placeholder="Kilométrage de retour" /></div>
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">
                <DollarSign size={16} className="text-emerald" />
                <h4>Paiement et statut</h4>
              </div>
              <div className="input-group-row">
                <div className="field-block"><label>Prix total (DH) *</label><input type="number" step="0.01" className="styled-input" value={formData.total_price} onChange={(e) => setFormData(prev => ({ ...prev, total_price: parseFloat(e.target.value) }))} required /></div>
                <div className="field-block"><label>Montant payé (DH)</label><input type="number" step="0.01" className="styled-input" value={formData.amount_paid} readOnly style={{ backgroundColor: "#f3f4f6" }} /></div>
              </div>
              <div className="input-group-row">
                <div className="field-block"><label>Reste à payer (DH)</label><input type="number" step="0.01" className="styled-input" value={formData.remaining_amount} readOnly style={{ backgroundColor: "#f3f4f6" }} /></div>
                <div className="field-block"><label>Statut</label>
                  <select
  className="styled-select"
  value={formData.status}
  onChange={(e) => {
    const newStatus = e.target.value;
    setFormData(prev => {
      const updates = { status: newStatus };
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      if (newStatus === 'confirmed') {
        updates.start_time = currentTime;
      }
      if (newStatus === 'completed') {
        const currentDate = now.toISOString().split('T')[0];
        updates.end_date = currentDate;
        updates.end_time = currentTime;
      }
      return { ...prev, ...updates };
    });
  }}
>
  <option value="pending">En attente</option>
  <option value="confirmed">Confirmée</option>
  <option value="contacted">Contacté</option>
  <option value="completed">Terminée</option>
  <option value="retard">En retard</option>
  <option value="cancelled">Annulée</option>
</select>
                </div>
              </div>
              <div className="inline-payment-section">
                <button type="button" className="inline-add-payment" onClick={() => setShowAddPayment(!showAddPayment)}>
                  <Plus size={16} /> Ajouter un paiement
                </button>
                {showAddPayment && (
                  <div className="inline-payment-form" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                    <div className="input-group-row">
                      <div className="field-block"><label>Montant</label><input type="number" step="0.01" className="styled-input" value={newPayment.amount} onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))} /></div>
                      <div className="field-block"><label>Date</label><input type="date" className="styled-input" value={newPayment.date} onChange={(e) => setNewPayment(prev => ({ ...prev, date: e.target.value }))} /></div>
                    </div>
                    <div className="input-group-row">
                      <div className="field-block"><label>Méthode</label><select className="styled-select" value={newPayment.method} onChange={(e) => setNewPayment(prev => ({ ...prev, method: e.target.value }))}><option value="cash">Espèces</option><option value="card">Carte</option><option value="check">Chèque</option><option value="transfer">Virement</option></select></div>
                      <div className="field-block"><label>Notes</label><input type="text" className="styled-input" value={newPayment.notes} onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))} /></div>
                    </div>
                    <div className="modal-footer-actions" style={{ marginTop: '12px' }}>
                      <button type="button" className="btn-modal-secondary" onClick={() => setShowAddPayment(false)}>Annuler</button>
                      <button type="button" className="btn-modal-primary" onClick={handleAddPayment}>Ajouter</button>
                    </div>
                  </div>
                )}
                {paymentHistory.length > 0 && (
                  <div className="inline-history" style={{ marginTop: '12px' }}>
                    <h4><History size={14} /> Historique des paiements ({paymentHistory.length})</h4>
                    {paymentHistory.map(payment => (
                      <div key={payment.id} className="inline-history-item">
                        <div className="inline-history-info">
                          <span className="inline-history-date">{new Date(payment.date).toLocaleDateString("fr-FR")}</span>
                          <span className="inline-history-method">{payment.method === "cash" ? "Espèces" : payment.method === "card" ? "Carte" : payment.method === "check" ? "Chèque" : "Virement"}</span>
                          <span className="inline-history-amount">{payment.amount} DH</span>
                          <span className="inline-history-notes">{payment.notes || "-"}</span>
                        </div>
                        <button type="button" className="inline-history-delete" onClick={() => handleRemovePayment(payment.id)}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">
                <Info size={16} className="text-emerald" />
                <h4>Notes</h4>
              </div>
              <div className="field-block">
                <textarea className="styled-textarea" rows="3" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes supplémentaires..." />
              </div>
            </div>
          </div>
        </div>

        {showCreateSousLocationModal && (
          <div className="modal-overlay" onClick={() => setShowCreateSousLocationModal(false)}>
            <div className="modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  <Plus size={20} style={{ color: '#eab308' }} /> Nouvelle sous‑location
                </h2>
                <button onClick={() => setShowCreateSousLocationModal(false)} className="modal-close">
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>Nom *</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={newSousLocationName}
                    onChange={(e) => setNewSousLocationName(e.target.value)}
                    placeholder="Ex: Location groupe"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>Description</label>
                  <textarea
                    className="styled-textarea"
                    rows="3"
                    value={newSousLocationDesc}
                    onChange={(e) => setNewSousLocationDesc(e.target.value)}
                    placeholder="Description facultative"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="modal-actions-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCreateSousLocationModal(false)} className="btn btn-secondary" type="button">
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    if (!newSousLocationName.trim()) {
                      toast.error('Le nom est obligatoire');
                      return;
                    }
                    try {
                      const result = await dispatch(createSousLocation({
                        name: newSousLocationName,
                        description: newSousLocationDesc
                      })).unwrap();
                      setFormData({ ...formData, sous_location_id: result.id });
                      setShowCreateSousLocationModal(false);
                      setNewSousLocationName('');
                      setNewSousLocationDesc('');
                      toast.success('Sous‑location créée');
                      dispatch(fetchSousLocations());
                    } catch (err) {
                      toast.error(err.message || 'Erreur');
                    }
                  }}
                  className="btn btn-primary"
                  type="button"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer-actions">
  <button type="button" className="btn-modal-secondary" onClick={onClose}>Annuler</button>
  
  {/* Standard submit */}
  <button type="submit" className="btn-modal-primary" disabled={submitting}>
    {submitting ? "Traitement..." : (editingReservation ? "Mettre à jour" : "Créer la réservation")}
  </button>
  
  {/* New button with changed color */}
  {onSubmitAndNavigate && (
    <button
      type="button"
      className="btn-modal-primary"
      onClick={handleSubmitAndNavigate}
      disabled={submitting}
      style={{
        background: '#3b82f6',
        transition: 'background 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
      onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
    >
      {submitting ? "Traitement..." : (editingReservation ? "Mettre à jour & Contrat" : "Créer & Contrat")}
    </button>
  )}
</div>
      </form>
    </div>
  );
};

// ==================== ContractViewPage ====================
const ContractViewPage = ({ reservation, onClose, currentUser, clients }) => {
  const dispatch = useDispatch();
  // Local override so the printed/on-screen contract reflects the reception_notes
  // JSON right after it's saved, without waiting on the parent's reservation prop.
  const [receptionNotesOverride, setReceptionNotesOverride] = useState(reservation?.reception_notes || null);

  const [contractSignatures, setContractSignatures] = useState({
    agent: reservation?.signatures?.agent || "",
    locataire: reservation?.signatures?.locataire || "",
    secondConducteur: reservation?.signatures?.secondConducteur || "",
    locataire_image: reservation?.signatures?.locataire_image || "",
  });

  const [contractPaperwork, setContractPaperwork] = useState({
    circulation: true,
    carteGrise: true,
    assurance: true,
    vignette: true,
    visiteTechnique: true,
    autorisation: true
  });
  const [contractDisplayOptions, setContractDisplayOptions] = useState({
    prices: "show",
    clientInfo: "show",
    secondDriver: "show",
    vehicleInfo: "show",
    deliveryReception: "show",
    rentalDates: "show",
    kilometrage: "show",
    rentalDays: "show",
    observations: "show",
    insurance: "show",
    depositGuarantee: "show",
    signatures: "show"
  });
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);

  const [showPrintOptions, setShowPrintOptions] = useState(false);

  const handleDisplayOptionChange = (section, value) => {
    setContractDisplayOptions(prev => ({ ...prev, [section]: value }));
  };
  const handleResetAllOptions = () => {
    setContractDisplayOptions({
      prices: "show",
      clientInfo: "show",
      secondDriver: "show",
      vehicleInfo: "show",
      deliveryReception: "show",
      rentalDates: "show",
      kilometrage: "show",
      rentalDays: "show",
      observations: "show",
      insurance: "show",
      depositGuarantee: "show",
      signatures: "show"
    });
    toast.success("Toutes les options ont été réinitialisées");
  };

  const generateContractPDF = async (includeSignatures = false) => {
    try {
      toast.loading("Génération du contrat en cours...", { id: "contract-pdf" });

      // Persist LIVRÉ PAR / RÉCEPTIONNÉ PAR as a JSON snapshot on reception_notes
      // so the contract keeps showing who printed it last, even after reload.
      const notesJSON = buildReceptionNotesJSON(reservation, currentUser);
      try {
        await dispatch(updateReservation({ id: reservation.id, data: { reception_notes: notesJSON } })).unwrap();
        setReceptionNotesOverride(notesJSON);
        // Let React re-render the contract with the new reception_notes before capture.
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (e) {
        console.error("Failed to save reception_notes", e);
      }

      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const contractElement = document.getElementById("contract-print-view");
      if (!contractElement) throw new Error("Contract element not found");
      const contractClone = contractElement.cloneNode(true);

      if (includeSignatures) {
        const signatureBlocks = contractClone.querySelectorAll('.signature-block');
        if (signatureBlocks.length >= 1) {
          const agentBlock = signatureBlocks[0];
          const signatureBox = agentBlock.querySelector('.signature-box');
          if (signatureBox) {
            signatureBox.innerHTML = `<img src="${agentSignatureImage}" style="max-height:60px; max-width:100%;" />`;
          }
        }
      }

      contractClone.style.width = "210mm";
      contractClone.style.height = "auto";
      contractClone.style.padding = "15px";
      contractClone.style.margin = "0";
      contractClone.style.boxSizing = "border-box";
      contractClone.style.backgroundColor = "white";
      contractClone.style.position = "absolute";
      contractClone.style.top = "-9999px";
      contractClone.style.left = "0";
      document.body.appendChild(contractClone);
      const images = contractClone.querySelectorAll("img");
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(contractClone, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      document.body.removeChild(contractClone);
      const imgData = canvas.toDataURL("image/png", 1.0);
      addImageFittedToPage(doc, imgData, canvas);

      const filename = `contrat-location-${reservation.id}.pdf`;
      downloadAndOpenPDF(doc, filename);
      toast.success("Contrat généré avec succès!", { id: "contract-pdf" });
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la génération du contrat", { id: "contract-pdf" });
    }
  };

  const handlePrintClick = () => {
    setShowPrintOptions(true);
  };

  const handlePrintConfirm = (withSignature) => {
    setShowPrintOptions(false);
    setTimeout(() => generateContractPDF(withSignature), 200);
  };

  const mergedSignatures = {
    ...reservation.signatures,
    ...contractSignatures,
  };

  return (
    <div className="modal-glass-container">
      <div className="modal-header-hero info-hero">
        <div className="hero-left">
          <div className="hero-icon-wrapper info-glow">
            <FileText size={24} />
          </div>
          <div className="hero-text">
            <span className="hero-badge info-badge">Contrat</span>
            <h2>Contrat de location - Réservation #{reservation.id}</h2>
            <p>Visualisez et imprimez le contrat</p>
          </div>
        </div>
        <button onClick={onClose} className="hero-close-btn"><X size={20} /></button>
      </div>

      <div className="modal-body-form" style={{ paddingTop: 0 }}>
        <div className="contract-actions-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowDisplayOptions(!showDisplayOptions)}>
            <Settings size={16} /> Options d'affichage
          </button>
          <button className="btn btn-primary" onClick={handlePrintClick}>
            <Printer size={16} /> Imprimer / PDF
          </button>
        </div>
        {showDisplayOptions && (
          <ContractDisplayOptions
            options={contractDisplayOptions}
            onOptionChange={handleDisplayOptionChange}
            onResetAll={handleResetAllOptions}
          />
        )}
        <div className="signature-input-section" style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Signatures</h3>
          <div className="signature-inputs" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <label>Signature Agent:</label>
              <input type="text" value={contractSignatures.agent} onChange={(e) => setContractSignatures(prev => ({ ...prev, agent: e.target.value }))} placeholder="Nom de l'agent" className="styled-input" />
            </div>
            <div style={{ flex: 1 }}>
              <label>Signature Locataire (texte):</label>
              <input type="text" value={contractSignatures.locataire} onChange={(e) => setContractSignatures(prev => ({ ...prev, locataire: e.target.value }))} placeholder="Nom du locataire" className="styled-input" />
            </div>
            <div style={{ flex: 1 }}>
              <label>Deuxième Conducteur:</label>
              <input type="text" value={contractSignatures.secondConducteur} onChange={(e) => setContractSignatures(prev => ({ ...prev, secondConducteur: e.target.value }))} placeholder="Nom du conducteur" className="styled-input" />
            </div>
          </div>
          {mergedSignatures.locataire_image && (
            <div style={{ marginTop: '1rem', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <label>Signature dessinée du client:</label>
              <img src={mergedSignatures.locataire_image} alt="Signature client" style={{ maxHeight: '80px', display: 'block', marginTop: '0.5rem' }} />
            </div>
          )}
        </div>
        <div className="paperwork-checkboxes" style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Documents Remis</h3>
          <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <label className="checkbox-label"><input type="checkbox" checked={contractPaperwork.carteGrise} onChange={() => setContractPaperwork(prev => ({ ...prev, carteGrise: !prev.carteGrise }))} /> Carte grise</label>
            <label className="checkbox-label"><input type="checkbox" checked={contractPaperwork.assurance} onChange={() => setContractPaperwork(prev => ({ ...prev, assurance: !prev.assurance }))} /> Assurance</label>
            <label className="checkbox-label"><input type="checkbox" checked={contractPaperwork.vignette} onChange={() => setContractPaperwork(prev => ({ ...prev, vignette: !prev.vignette }))} /> Vignette</label>
            <label className="checkbox-label"><input type="checkbox" checked={contractPaperwork.visiteTechnique} onChange={() => setContractPaperwork(prev => ({ ...prev, visiteTechnique: !prev.visiteTechnique }))} /> Visite technique</label>
            <label className="checkbox-label"><input type="checkbox" checked={contractPaperwork.autorisation} onChange={() => setContractPaperwork(prev => ({ ...prev, autorisation: !prev.autorisation }))} /> Autorisation</label>
          </div>
        </div>
        <ContractLocation
          reservation={{
            ...reservation,
            signatures: mergedSignatures,
            paperwork: contractPaperwork,
            reception_notes: receptionNotesOverride ?? reservation?.reception_notes
          }}
          showSignatures={true}
          currentUser={currentUser}
          clients={clients}
          displayOptions={contractDisplayOptions}
          containerId="contract-print-view"
        />
      </div>

      {showPrintOptions && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Options d'impression</h2>
              <button onClick={() => setShowPrintOptions(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p>Souhaitez-vous inclure la signature de l'agent dans le contrat ?</p>
            </div>
            <div className="modal-actions-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => handlePrintConfirm(false)} className="btn btn-secondary">
                Sans signature
              </button>
              <button onClick={() => handlePrintConfirm(true)} className="btn btn-primary">
                Avec signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== Main AdminReservationsStatus ====================
export default function AdminReservationsStatus() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const reservations = useSelector(selectReservations);
  const cars = useSelector(selectCars);
  const matricules = useSelector(selectMatricules);
  const clients = useSelector(selectClients);
  const loading = useSelector(selectReservationsLoading);
  const currentUser = useSelector(selectUser);

  const [details, setDetails] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showContract, setShowContract] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState(null);
  const [editingReservation, setEditingReservation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedContractReservation, setSelectedContractReservation] = useState(null);
  const [contractSignatures, setContractSignatures] = useState({
    agent: "", locataire: "", secondConducteur: ""
  });
  const [contractPaperwork, setContractPaperwork] = useState({
    circulation: true, carteGrise: true, assurance: true,
    vignette: true, visiteTechnique: true, autorisation: true
  });
  const [contractDisplayOptions, setContractDisplayOptions] = useState({
    prices: "show", clientInfo: "show", secondDriver: "show",
    vehicleInfo: "show", deliveryReception: "show", rentalDates: "show",
    kilometrage: "show", rentalDays: "show", observations: "show",
    insurance: "show", depositGuarantee: "show", signatures: "show"
  });
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);

  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingReservationId, setPendingReservationId] = useState(null);
  const [availableMatricules, setAvailableMatricules] = useState([]);
  const [selectedMatriculeId, setSelectedMatriculeId] = useState('');

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeReservationId, setCompleteReservationId] = useState(null);
  const [kilometrageRetour, setKilometrageRetour] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');

  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [printReservation, setPrintReservation] = useState(null);

  // ===== Load data =====
  useEffect(() => {
    const load = async () => {
      await Promise.all([
        dispatch(fetchReservations()),
        dispatch(fetchCars()),
        dispatch(fetchMatricules()),
        dispatch(fetchClients()),
        dispatch(checkLateReservations())
      ]);
    };
    load();
  }, [dispatch]);

  // ===== Handle contract opening from navigation =====
  const lastProcessedContractId = useRef(null);

  useEffect(() => {
    const contractReservation = location.state?.contractReservation;
    if (contractReservation) {
      setSelectedContractReservation(contractReservation);
      setShowContract(true);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    const contractId = location.state?.contractId || searchParams.get('contract');
    if (!contractId) {
      lastProcessedContractId.current = null;
      return;
    }
    if (contractId === lastProcessedContractId.current) return;
    if (reservations.length === 0) return;

    lastProcessedContractId.current = contractId;
    const reservation = reservations.find(r => r.id === parseInt(contractId));

    if (reservation) {
      setSelectedContractReservation(reservation);
      setShowContract(true);
      if (location.state?.contractId) {
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        setSearchParams({});
      }
    } else {
      toast.warning('Réservation non trouvée');
      if (location.state?.contractId) {
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        setSearchParams({});
      }
    }
  }, [location, reservations, navigate, searchParams, setSearchParams]);

  // ============ CRUD Handlers ============
  const handleCreateReservation = async (data) => {
    setSubmitting(true);
    try {
      const result = await dispatch(createReservation(data)).unwrap();
      const reservation = result.reservation || result;
      toast.success("Réservation créée avec succès!");
      setShowReservationForm(false);

await syncReportForReservation(reservation, dispatch, { silent: true });
      await dispatch(fetchReservations(true));
      await dispatch(refreshMatricules(true));
    } catch (error) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReservation = async (data) => {
    setSubmitting(true);
    try {
      const result = await dispatch(updateReservation({ id: editingReservation.id, data })).unwrap();
      const reservation = result.reservation || result;
      toast.success("Réservation modifiée avec succès!");
      setShowReservationForm(false);
      setEditingReservation(null);

await syncReportForReservation(reservation, dispatch, { silent: true });
      await dispatch(fetchReservations(true));
      await dispatch(refreshMatricules(true));
    } catch (error) {
      toast.error(error.message || "Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };
// ===== CRUD with navigation =====
const handleCreateAndNavigate = async (data) => {
  setSubmitting(true);
  try {
    const result = await dispatch(createReservation(data)).unwrap();
    const reservation = result.reservation || result;
    // Pas de toast de succès pour éviter un rafraîchissement
    await dispatch(fetchReservations(true));
    await dispatch(refreshMatricules(true));

    flushSync(() => {
      setShowReservationForm(false);
      setSelectedContractReservation(reservation);
      setShowContract(true);
    });
  } catch (error) {
    toast.error(error.message || "Erreur lors de la création");
  } finally {
    setSubmitting(false);
  }
};

const handleUpdateAndNavigate = async (data) => {
  setSubmitting(true);
  try {
    const result = await dispatch(updateReservation({ id: editingReservation.id, data })).unwrap();
    const reservation = result.reservation || result;
    await dispatch(fetchReservations(true));
    await dispatch(refreshMatricules(true));

    flushSync(() => {
      setShowReservationForm(false);
      setEditingReservation(null);
      setSelectedContractReservation(reservation);
      setShowContract(true);
    });
  } catch (error) {
    toast.error(error.message || "Erreur lors de la modification");
  } finally {
    setSubmitting(false);
  }
};
  const handleEdit = (reservation) => {
    setEditingReservation(reservation);
    setShowReservationForm(true);
  };

  const handleAddNew = () => {
    setEditingReservation(null);
    setShowReservationForm(true);
  };

  // ===== Confirm Modal Logic =====
  const openConfirmModal = (reservation) => {
    const carId = reservation.car_id;
    const reservedMatriculeIds = reservations
      .filter(r => r.id !== reservation.id && (r.status === 'confirmed' || r.status === 'retard'))
      .map(r => r.matricule_id)
      .filter(Boolean);

    const available = matricules.filter(m =>
      m.car_id === carId &&
      m.status !== 'sold' &&
      !reservedMatriculeIds.includes(m.id)
    );
    setAvailableMatricules(available);
    setPendingReservationId(reservation.id);
    if (reservation.matricule_id) {
      setSelectedMatriculeId(reservation.matricule_id);
    } else {
      setSelectedMatriculeId(available.length > 0 ? available[0].id : '');
    }
    setShowConfirmModal(true);
  };

  const confirmConfirm = async () => {
    if (!selectedMatriculeId) {
      toast.error("Veuillez sélectionner un matricule.");
      return;
    }
    try {
      const result = await dispatch(updateReservation({
        id: pendingReservationId,
        data: {
          status: 'confirmed',
          matricule_id: selectedMatriculeId,
          start_time: new Date().toTimeString().slice(0, 5)
        }
      })).unwrap();
      const updatedReservation = result.reservation || result;
      const token = updatedReservation.signature_token || pendingReservationId;
      const code = updatedReservation.signature_code || pendingReservationId;

      toast.success("Réservation confirmée avec succès !");

      const link = `${window.location.origin}/sign-contract/${token}`;
      toast.info(
        <div>
          <p>🔗 Lien de signature : <a href={link} target="_blank" rel="noopener noreferrer">{link}</a></p>
          <p>🔑 Code : <strong>{code}</strong> (à communiquer au client)</p>
        </div>,
        { duration: 10000 }
      );
    } catch (error) {
      toast.error(error.message || "Erreur lors de la confirmation");
    }
    setShowConfirmModal(false);
    setPendingReservationId(null);
    setSelectedMatriculeId('');
  };

  // ===== Complete Modal Logic =====
  const openCompleteModal = (reservation) => {
    setCompleteReservationId(reservation.id);
    setKilometrageRetour(reservation.kilometrage_entree || reservation.matricule_kilometrage_at_start || '');

    const now = new Date();
    setReturnDate(now.toISOString().split('T')[0]);
    setReturnTime(now.toTimeString().slice(0, 5));

    setShowCompleteModal(true);
  };

  const confirmComplete = async () => {
    if (!kilometrageRetour || isNaN(kilometrageRetour) || parseFloat(kilometrageRetour) < 0) {
      toast.error("Veuillez entrer un kilométrage retour valide.");
      return;
    }
    try {
      await dispatch(updateReservation({
        id: completeReservationId,
        data: {
          status: 'completed',
          end_date: returnDate,
          end_time: returnTime,
          kilometrage_entree: parseFloat(kilometrageRetour)
        }
      })).unwrap();
      toast.success("Réservation terminée avec succès !");
    } catch (error) {
      toast.error(error.message || "Erreur lors de la terminaison");
    }
    setShowCompleteModal(false);
    setCompleteReservationId(null);
    setKilometrageRetour('');
    setReturnDate('');
    setReturnTime('');
  };

  // ----- WhatsApp handler -----
  const handleWhatsApp = (reservation) => {
    const client = clients.find(c => c.id === reservation.client_id);
    if (!client || !client.telephone) {
      toast.error("رقم الهاتف ديال العميل غير موجود.");
      return;
    }
    let phone = client.telephone.replace(/[\s\-\(\)\.]/g, '');
    if (phone.startsWith('0') && phone.length === 10) {
      phone = '212' + phone.substring(1);
    } else if (phone.startsWith('+')) {
      phone = phone.substring(1);
    }
    const total = reservation.total_price || 0;
    const paid = reservation.amount_paid || 0;
    const remaining = reservation.remaining_amount !== undefined ? reservation.remaining_amount : (total - paid);
    const status = reservation.status;
    const clientName = client.prenom ? `${client.prenom} ${client.nom}` : client.nom || "العميل";
    let daysRemaining = null;
    if (reservation.end_date) {
      const today = new Date();
      const end = new Date(reservation.end_date);
      today.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      daysRemaining = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    }
    let message = "";
    switch (status) {
      case "pending":
        message = `السلام عليكم ${clientName}، وصلاتنا طلب ديال الكرية (رقم ${reservation.id}). المجموع هو ${total} درهم، دفعتي ${paid} درهم، باقي ${remaining} درهم. يرجى تأكيد الحجز ديالك. شكراً.`;
        break;
      case "confirmed":
        if (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3) {
          message = `السلام عليكم ${clientName}، الحجز ديالك (رقم ${reservation.id}) كينتهي في ${daysRemaining} يوم. خاص ترجع السيارة في الوقت المحدد. المبلغ المتبقي هو ${remaining} درهم. شكراً.`;
        } else {
          message = `السلام عليكم ${clientName}، الحجز ديالك (رقم ${reservation.id}) تأكد. المبلغ المتبقي هو ${remaining} درهم. نتمناو لك رحلة موفقة. شكراً.`;
        }
        break;
      case "retard":
        message = `السلام عليكم ${clientName}، الحجز ديالك (رقم ${reservation.id}) متأخر. خاص ترجع السيارة فالحال. المبلغ المتبقي هو ${remaining} درهم. رجاء اتصل بنا. شكراً.`;
        break;
      case "completed":
        message = `السلام عليكم ${clientName}، شكراً على الكرية ديالك (رقم ${reservation.id}). نتمناو نشوفوك مرة أخرى. شكراً.`;
        break;
      case "cancelled":
        message = `السلام عليكم ${clientName}، تم إلغاء الحجز ديالك (رقم ${reservation.id}). إذا عندك أي سؤال، اتصل بنا. شكراً.`;
        break;
      case "contacted":
        message = `السلام عليكم ${clientName}، حاولنا نتواصلو معاك بخصوص الحجز ديالك (رقم ${reservation.id}). خاص ترجع لينا فالحال. شكراً.`;
        break;
      default:
        message = `السلام عليكم ${clientName}، كنا نتواصلو معاك بخصوص الحجز ديالك (رقم ${reservation.id}). المجموع هو ${total} درهم، دفعتي ${paid} درهم، باقي ${remaining} درهم. شكراً.`;
    }
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // ----- Signature Link handler -----
  const handleSignatureLink = async (reservation) => {
    if (reservation.status !== 'confirmed') {
      toast.warning("Seules les réservations confirmées peuvent avoir un lien de signature.");
      return;
    }

    try {
      const response = await api.post(`/reservations/${reservation.id}/generate-signature`);
      const { signature_token, signature_code } = response.data;

      const link = `${window.location.origin}/sign-contract/${signature_token}`;
      const fullText = `🔗 Lien de signature : ${link}\n🔑 Code : ${signature_code}`;

      navigator.clipboard.writeText(fullText)
        .then(() => {
          toast.success("Nouveau lien et code générés et copiés dans le presse-papier !");
        })
        .catch(() => {
          toast.info(
            <div>
              <p>🔗 Lien : <a href={link} target="_blank" rel="noopener noreferrer">{link}</a></p>
              <p>🔑 Code : <strong>{signature_code}</strong></p>
            </div>,
            { duration: 10000 }
          );
        });
    } catch (error) {
      console.error('Error generating signature:', error);
      toast.error(error.response?.data?.message || "Erreur lors de la génération du lien de signature.");
    }
  };

  // ===== setStatus (avec modales) =====
  const setStatus = async (id, newStatus, extraData = {}) => {
    if (newStatus === 'confirmed') {
      const reservation = reservations.find(r => r.id === id);
      if (reservation) {
        openConfirmModal(reservation);
      }
      return;
    }
    if (newStatus === 'completed') {
      const reservation = reservations.find(r => r.id === id);
      if (reservation) {
        openCompleteModal(reservation);
      }
      return;
    }
    const result = await dispatch(updateReservation({ id, data: { status: newStatus, ...extraData } }));
    if (result.error) {
      toast.error(result.payload);
    } else {
      toast.success(newStatus === "cancelled" ? "Annulée" : "Mis à jour");
      await dispatch(fetchReservations(true));
      await dispatch(refreshMatricules(true));
    }
  };

  // ----- Delete handlers -----
  const handleDeleteClick = (reservation) => {
    setReservationToDelete(reservation);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reservationToDelete) return;
    const result = await dispatch(deleteReservation(reservationToDelete.id));
    if (result.error) {
      toast.error(result.payload);
    } else {
      toast.success("Réservation supprimée avec succès");
    }
    setDeleteModalOpen(false);
    setReservationToDelete(null);
  };

  // ----- Refresh and Export -----
  const refreshData = async () => {
    await Promise.all([
      dispatch(fetchReservations(true)),
      dispatch(fetchCars(true)),
      dispatch(fetchMatricules(true)),
      dispatch(fetchClients(true)),
      dispatch(checkLateReservations())
    ]);
    toast.success("Actualisé");
  };

  const handleExport = () => {
    const headers = ["ID", "Client", "Véhicule", "Immatriculation", "Début", "Fin", "Total (DH)", "Statut", "Prolongation", "Sous-location"];
    const csvData = reservations.map(r => {
      const client = clients.find(c => c.id === r.client_id);
      const car = cars.find(c => c.id === r.car_id);
      const mat = matricules.find(m => m.id === r.matricule_id);
      return [
        r.id,
        client ? `"${client.prenom} ${client.nom}"` : "N/A",
        car ? `"${car.brand} ${car.model}"` : "N/A",
        mat?.matricule_code || "",
        r.start_date,
        r.end_date,
        r.total_price,
        r.status,
        r.can_extend_days ? "Oui" : "Non",
        r.sous_location?.name || "",
      ].join(",");
    });
    const blob = new Blob([headers.join(",") + "\n" + csvData.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations_status_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV effectué");
  };

  // ----- Utility functions -----
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  const calculateDaysRemaining = (reservation) => {
    if (!reservation.end_date) return "";
    const today = new Date();
    const end = new Date(reservation.end_date);
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      const lateDays = Math.abs(diffDays);
      return lateDays === 1 ? "+1 jour de retard" : `+${lateDays} jours de retard`;
    }
    if (diffDays === 0) return "Dernier jour";
    if (diffDays === 1) return "1 jour restant";
    return `${diffDays} jours restants`;
  };

  // ===== Gestion de l'impression avec popup =====
  const handlePrintClick = (reservation) => {
    setSelectedContractReservation(reservation);
    setPrintReservation(reservation);
    setShowPrintOptions(true);
  };

  const handlePrintConfirm = async (withSignature) => {
    setShowPrintOptions(false);
    const res = printReservation;

    // Persist LIVRÉ PAR / RÉCEPTIONNÉ PAR as a JSON snapshot on reception_notes
    // so the contract keeps showing who printed it last, even after reload.
    if (res) {
      const notesJSON = buildReceptionNotesJSON(res, currentUser);
      try {
        await dispatch(updateReservation({ id: res.id, data: { reception_notes: notesJSON } })).unwrap();
      } catch (e) {
        console.error("Failed to save reception_notes", e);
      }
      setSelectedContractReservation(prev => (prev ? { ...prev, reception_notes: notesJSON } : prev));
      setPrintReservation(prev => (prev ? { ...prev, reception_notes: notesJSON } : prev));
    }

    setTimeout(() => {
      generateContractPDF(res, withSignature);
      setPrintReservation(null);
    }, 250);
  };

  const generateContractPDF = async (reservation, includeSignatures = false) => {
    try {
      toast.loading("Génération du contrat en cours...", { id: "contract-pdf" });
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const contractElement = document.getElementById("contract-print-hidden");
      if (!contractElement) {
        console.error("Contract element not found");
        toast.error("Erreur: Élément du contrat non trouvé", { id: "contract-pdf" });
        return;
      }
      const contractClone = contractElement.cloneNode(true);

      if (includeSignatures) {
        const signatureBlocks = contractClone.querySelectorAll('.signature-block');
        if (signatureBlocks.length >= 1) {
          const agentBlock = signatureBlocks[0];
          const signatureBox = agentBlock.querySelector('.signature-box');
          if (signatureBox) {
            signatureBox.innerHTML = `<img src="${agentSignatureImage}" style="max-height:60px; max-width:100%;" />`;
          }
        }
      }

      contractClone.style.width = "210mm";
      contractClone.style.height = "auto";
      contractClone.style.padding = "15px";
      contractClone.style.margin = "0";
      contractClone.style.boxSizing = "border-box";
      contractClone.style.backgroundColor = "white";
      contractClone.style.position = "absolute";
      contractClone.style.top = "-9999px";
      contractClone.style.left = "0";
      document.body.appendChild(contractClone);
      const images = contractClone.querySelectorAll("img");
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(contractClone, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      document.body.removeChild(contractClone);
      const imgData = canvas.toDataURL("image/png", 1.0);
      addImageFittedToPage(doc, imgData, canvas);

      const filename = `contrat-location-${reservation.id}.pdf`;
      downloadAndOpenPDF(doc, filename);
      toast.success("Contrat généré avec succès!", { id: "contract-pdf" });
    } catch (error) {
      console.error("Error generating contract:", error);
      toast.error("Erreur lors de la génération du contrat", { id: "contract-pdf" });
    }
  };

  const handleViewContract = (reservation) => {
    setSelectedContractReservation(reservation);
    setShowContract(true);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return sortDirection === "asc" ? <ArrowUp size={12} className="sort-icon active" /> : <ArrowDown size={12} className="sort-icon active" />;
  };

  // ----- Filtering and sorting (ONLY pending, cancelled, contacted) -----
  const filteredReservations = useMemo(() => {
    let filtered = reservations.filter(r => {
      // ============ ONLY pending, cancelled, contacted ============
      if (r.status !== 'pending' && r.status !== 'cancelled' && r.status !== 'contacted') {
        return false;
      }
      // ==============================================================

      const client = clients.find(c => c.id === r.client_id);
      const car = cars.find(c => c.id === r.car_id);
      const mat = matricules.find(m => m.id === r.matricule_id);
      if (search &&
          !`${client?.prenom} ${client?.nom}`.toLowerCase().includes(search.toLowerCase()) &&
          !`${car?.brand} ${car?.model}`.toLowerCase().includes(search.toLowerCase()) &&
          !mat?.matricule_code?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });

    if (startDateFilter && endDateFilter) {
      const filterStart = new Date(startDateFilter);
      const filterEnd = new Date(endDateFilter);
      filtered = filtered.filter(r => {
        const start = new Date(r.start_date);
        const end = new Date(r.end_date);
        return start <= filterEnd && end >= filterStart;
      });
    } else if (startDateFilter) {
      const filterStart = new Date(startDateFilter);
      filtered = filtered.filter(r => new Date(r.start_date) >= filterStart);
    } else if (endDateFilter) {
      const filterEnd = new Date(endDateFilter);
      filtered = filtered.filter(r => new Date(r.end_date) <= filterEnd);
    }

    if (filterParam === 'pending') {
      filtered = filtered.filter(r => r.status === 'pending');
    } else if (filterParam === 'contacted') {
      filtered = filtered.filter(r => r.status === 'contacted');
    } else if (filterParam === 'cancelled') {
      filtered = filtered.filter(r => r.status === 'cancelled');
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "id": aVal = a.id; bVal = b.id; break;
        case "client": const aClient = clients.find(c => c.id === a.client_id); const bClient = clients.find(c => c.id === b.client_id); aVal = aClient ? `${aClient.prenom} ${aClient.nom}` : ""; bVal = bClient ? `${bClient.prenom} ${bClient.nom}` : ""; break;
        case "vehicle": const aCar = cars.find(c => c.id === a.car_id); const bCar = cars.find(c => c.id === b.car_id); aVal = aCar ? `${aCar.brand} ${aCar.model}` : ""; bVal = bCar ? `${bCar.brand} ${bCar.model}` : ""; break;
        case "matricule": const aMat = matricules.find(m => m.id === a.matricule_id); const bMat = matricules.find(m => m.id === b.matricule_id); aVal = aMat?.matricule_code || ""; bVal = bMat?.matricule_code || ""; break;
        case "start_date": aVal = new Date(a.start_date); bVal = new Date(b.start_date); break;
        case "end_date": aVal = new Date(a.end_date); bVal = new Date(b.end_date); break;
        case "days": aVal = calculateDays(a.start_date, a.end_date); bVal = calculateDays(b.start_date, b.end_date); break;
        case "total": aVal = a.total_price || 0; bVal = b.total_price || 0; break;
        case "status": aVal = a.status; bVal = b.status; break;
        default: aVal = a.id; bVal = b.id;
      }
      if (sortDirection === "asc") return aVal > bVal ? 1 : -1;
      else return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [reservations, clients, cars, matricules, search, statusFilter, sortField, sortDirection, filterParam, startDateFilter, endDateFilter]);

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const paginated = filteredReservations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status) => {
    const config = {
      pending: { class: "badge-warning", label: "En attente", icon: Clock },
      confirmed: { class: "badge-success", label: "Confirmée", icon: Check },
      contacted: { class: "badge-purple", label: "Contacté", icon: Phone },
      completed: { class: "badge-blue", label: "Terminée", icon: CheckCircle },
      cancelled: { class: "badge-gray", label: "Annulée", icon: XCircle },
      retard: { class: "badge-danger", label: "En retard", icon: AlertTriangle }
    };
    const c = config[status] || config.pending;
    const IconComponent = c.icon;
    return (
      <span className={`badge ${c.class}`}>
        <IconComponent size={12} className="badge-icon" />
        {c.label}
      </span>
    );
  };

  const clearDateFilters = () => {
    setStartDateFilter("");
    setEndDateFilter("");
  };

  // ---------- STATS (only for pending, cancelled, contacted) ----------
  const stats = {
    total: reservations?.filter(r => ['pending','cancelled','contacted'].includes(r.status)).length || 0,
    pending: reservations?.filter(r => r.status === 'pending').length || 0,
    contacted: reservations?.filter(r => r.status === 'contacted').length || 0,
    cancelled: reservations?.filter(r => r.status === 'cancelled').length || 0,
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement des réservations...</p>
      </div>
    );
  }

  const renderConfirmModal = () => (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Confirmer la réservation</h2>
          <button onClick={() => setShowConfirmModal(false)} className="modal-close"><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          <p style={{ marginBottom: '1rem' }}>Sélectionnez le matricule à attribuer à cette réservation :</p>
          {availableMatricules.length === 0 ? (
            <p style={{ color: 'red' }}>Aucun matricule disponible pour ce véhicule.</p>
          ) : (
            <div className="form-group">
              <label>Matricule</label>
              <select
                value={selectedMatriculeId}
                onChange={(e) => setSelectedMatriculeId(e.target.value)}
                className="styled-select"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                <option value="">Sélectionner un matricule</option>
                {availableMatricules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.matricule_code} - {m.kilometrage} km
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="modal-actions-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowConfirmModal(false)} className="btn btn-secondary">Annuler</button>
          <button onClick={confirmConfirm} className="btn btn-primary" disabled={availableMatricules.length === 0 || !selectedMatriculeId}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );

  const renderCompleteModal = () => (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Terminer la réservation</h2>
          <button onClick={() => setShowCompleteModal(false)} className="modal-close"><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Date de retour</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="styled-input"
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group">
              <label>Heure de retour</label>
              <input
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="styled-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Km retour</label>
            <input
              type="number"
              value={kilometrageRetour}
              onChange={(e) => setKilometrageRetour(e.target.value)}
              className="styled-input"
              placeholder="Ex: 12345"
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="modal-actions-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowCompleteModal(false)} className="btn btn-secondary">Annuler</button>
          <button onClick={confirmComplete} className="btn btn-primary" disabled={!kilometrageRetour || isNaN(kilometrageRetour)}>
            Terminer
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {selectedContractReservation && (
        <div style={{ display: "none" }}>
          <ContractLocation
            reservation={{
              ...selectedContractReservation,
              signatures: contractSignatures,
              paperwork: contractPaperwork
            }}
            currentUser={currentUser}
            clients={clients}
            displayOptions={contractDisplayOptions}
            containerId="contract-print-hidden"
          />
        </div>
      )}

      {showContract && selectedContractReservation ? (
        <ContractViewPage
          reservation={selectedContractReservation}
          onClose={() => setShowContract(false)}
          currentUser={currentUser}
          clients={clients}
        />
      ) : showReservationForm ? (
        <ReservationForm
  isOpen={showReservationForm}
  onClose={() => { setShowReservationForm(false); setEditingReservation(null); }}
  onSubmit={editingReservation ? handleUpdateReservation : handleCreateReservation}
  onSubmitAndNavigate={editingReservation ? handleUpdateAndNavigate : handleCreateAndNavigate}   // <-- AJOUT
  editingReservation={editingReservation}
  clients={clients}
  cars={cars}
  matricules={matricules}
  submitting={submitting}
/>
      ) : (
        <div className="admin-smaiti-page">
          <div className="smaiti-topbar">
            <div className="smaiti-logo-area">
              <span className="smaiti-brand">SMAITI LUXE</span>
              <span className="smaiti-flotte">Réservations – En attente / Annulées / Contactées</span>
            </div>
            <div className="smaiti-right-actions">
              <div className="smaiti-search-bar">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Rechercher client, véhicule, matricule..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <button className="smaiti-notif-btn" onClick={refreshData} title="Actualiser"><RefreshCw size={16} /></button>
              <button className="smaiti-notif-btn" onClick={handleExport} title="Exporter"><Download size={16} /></button>
              <button className="btn btn-primary" onClick={handleAddNew}><Plus size={16} /> Nouvelle</button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div><p className="stat-label">Total (Ces statuts)</p><p className="stat-number">{stats.total}</p></div>
              <Calendar size={28} className="stat-icon" />
            </div>
            <div className="stat-card">
              <div><p className="stat-label">En attente</p><p className="stat-number" style={{ color: '#eab308' }}>{stats.pending}</p></div>
              <Clock size={28} className="stat-icon" style={{ color: '#eab308' }} />
            </div>
            <div className="stat-card">
              <div><p className="stat-label">Contactés</p><p className="stat-number" style={{ color: '#8b5cf6' }}>{stats.contacted}</p></div>
              <Phone size={28} className="stat-icon" style={{ color: '#8b5cf6' }} />
            </div>
            <div className="stat-card">
              <div><p className="stat-label">Annulées</p><p className="stat-number" style={{ color: '#ef4444' }}>{stats.cancelled}</p></div>
              <XCircle size={28} className="stat-icon" style={{ color: '#ef4444' }} />
            </div>
          </div>

          <div className="smaiti-actions-wrapper">
            <span className="smaiti-count">{filteredReservations.length} réservation(s) (En attente / Annulées / Contactées)</span>
            <div className="smaiti-actions-buttons">
              <select
                className="status-select-filter"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Tous statuts</option>
                <option value="pending">En attente</option>
                <option value="contacted">Contacté</option>
                <option value="cancelled">Annulée</option>
              </select>
              <div className="date-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label className="date-filter-label">Du</label>
                <input type="date" value={startDateFilter} onChange={(e) => { setStartDateFilter(e.target.value); setCurrentPage(1); }} className="date-filter-input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '120px' }} />
                <label className="date-filter-label">Au</label>
                <input type="date" value={endDateFilter} onChange={(e) => { setEndDateFilter(e.target.value); setCurrentPage(1); }} className="date-filter-input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '120px' }} />
                {(startDateFilter || endDateFilter) && (
                  <button onClick={clearDateFilters} className="clear-date-btn" title="Effacer les filtres de date"><X size={14} /></button>
                )}
              </div>
              {filterParam && (
                <div className="notification-filter-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef3c7', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid #f59e0b' }}>
                  <span>🔔 {filterParam === 'pending' ? 'En attente' : filterParam === 'contacted' ? 'Contacté' : 'Annulée'}</span>
                  <button onClick={() => setSearchParams({})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e' }}><X size={14} /></button>
                </div>
              )}
            </div>
          </div>

          <div className="smaiti-table-container">
            <table className="smaiti-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("client")} className="sortable-header">Client {getSortIcon("client")}</th>
                  <th onClick={() => handleSort("vehicle")} className="sortable-header">Véhicule / Matricule {getSortIcon("vehicle")}</th>
                  <th onClick={() => handleSort("start_date")} className="sortable-header">Période {getSortIcon("start_date")}</th>
                  <th onClick={() => handleSort("days")} className="sortable-header">Jours {getSortIcon("days")}</th>
                  <th className="sortable-header">Jours Restants</th>
                  <th onClick={() => handleSort("total")} className="sortable-header">Total {getSortIcon("total")}</th>
                  <th onClick={() => handleSort("status")} className="sortable-header">Statut {getSortIcon("status")}</th>
                  <th>Prolongation</th>
                  <th>Sous‑location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan="11" className="text-center py-12">Aucune réservation dans ces statuts</td></tr>
                ) : (
                  paginated.map(r => {
                    const client = clients.find(c => c.id === r.client_id);
                    const car = cars.find(c => c.id === r.car_id);
                    const mat = matricules.find(m => m.id === r.matricule_id);
                    const days = calculateDays(r.start_date, r.end_date);
                    const daysRemaining = calculateDaysRemaining(r);
                    const secondDriver = clients.find(c => c.id === r.second_driver_client_id);
                    let rowPaymentHistory = r.payment_history;
                    if (typeof rowPaymentHistory === 'string') {
                      try { rowPaymentHistory = JSON.parse(rowPaymentHistory); } catch (e) { rowPaymentHistory = []; }
                    }
                    if (!Array.isArray(rowPaymentHistory)) rowPaymentHistory = [];
                    // Strip auto-generated report filenames (e.g. "Rapport_Auto_2_2026-08.pdf") from payment notes
                    const rapportAutoPattern = /rapport[_\s-]?auto[^\s,;()]*\.pdf/gi;
                    rowPaymentHistory = rowPaymentHistory.map(p => {
                      if (!p.notes) return p;
                      const cleanedNotes = String(p.notes).replace(rapportAutoPattern, '').replace(/^[\s,;-]+|[\s,;-]+$/g, '').trim();
                      return { ...p, notes: cleanedNotes };
                    });
                    const isExpanded = expandedRowId === r.id;
                    return (
                      <Fragment key={r.id}>
                      <tr>
                        {/* Client */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={16} style={{ color: '#64748b' }} />
                            <div>
                              <div style={{
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                color: '#0f172a',
                                background: '#f1f5f9',
                                padding: '0 10px',
                                borderRadius: '12px',
                                display: 'inline-block'
                              }}>
                                {client ? `${client.prenom} ${client.nom}` : "—"}
                              </div>
                              {secondDriver && r.has_second_driver && (
                                <div style={{
                                  fontSize: '0.65rem',
                                  color: '#eab308',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginTop: '2px'
                                }}>
                                  <Users size={10} /> {secondDriver.prenom} {secondDriver.nom}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Véhicule / Matricule */}
                        <td>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            padding: '10px 14px',
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                            borderRadius: '12px',
                            borderLeft: '5px solid #10b981',
                            minWidth: '250px',
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)',
                            boxSizing: 'border-box'
                          }}>
                            {/* Ligne supérieure : Modèle + Couleur + Année (sur une seule ligne) */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'nowrap',
                              overflow: 'hidden'
                            }}>
                              {/* Modèle */}
                              <span style={{
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                color: '#064e3b',
                                letterSpacing: '0.3px',
                                whiteSpace: 'nowrap'
                              }}>
                                {car ? `${car.model}` : "—"}
                              </span>
                        
                              {/* Couleur */}
                              {car?.color && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.95rem',
                                  color: '#065f46',
                                  background: 'rgba(255,255,255,0.6)',
                                  padding: '2px 12px 2px 6px',
                                  borderRadius: '24px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  whiteSpace: 'nowrap'
                                }}>
                                  <span style={{
                                    display: 'inline-block',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    backgroundColor: getColorValue(car.color),
                                    border: '2px solid white',
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                                    flexShrink: 0
                                  }} />
                                  {car.color}
                                </span>
                              )}
                        
                              {/* Année avec icône calendrier – affichée en deux chiffres */}
                              {car?.year && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  color: '#1e293b',
                                  background: '#d1fae5',
                                  padding: '2px 12px',
                                  borderRadius: '20px',
                                  border: '1px solid #a7f3d0',
                                  whiteSpace: 'nowrap'
                                }}>
                                  <Calendar size={12} style={{ color: '#065f46' }} />
                                  {String(car.year).slice(-2)}
                                </span>
                              )}
                            </div>
                        
                            {/* Matricule – en dessous */}
                            <div style={{
                              fontFamily: 'Courier New, monospace',
                              fontWeight: 800,
                              color: '#064e3b',
                              fontSize: '0.85rem',
                              letterSpacing: '0.8px',
                              background: 'rgba(255,255,255,0.5)',
                              padding: '4px 14px',
                              borderRadius: '8px',
                              width: 'fit-content',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              whiteSpace: 'nowrap'
                            }}>
                              {mat?.matricule_code || "—"}
                            </div>
                          </div>
                        </td>
                        {/* Période */}
                        <td>
                          <div className="period-cell">
                            <div className="period-line">
                              <Calendar size={12} className="period-icon" />
                              {new Date(r.start_date).toLocaleDateString("fr-FR")}
                            </div>
                            <div className="period-line period-arrow">
                              <span className="arrow-icon">→</span>
                              {new Date(r.end_date).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                        </td>
                        {/* Jours */}
                        <td>
                          <span className="days-badge">
                            <CalendarDays size={12} className="days-icon" />
                            {days} {days > 1 ? 'jours' : 'jour'}
                          </span>
                        </td>
                        {/* Jours restants */}
                        <td className={`days-remaining-cell ${r.status === "retard" ? "late" : ""}`}>{daysRemaining}</td>
                        {/* Total */}
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#dcfce7',
                            color: '#166534',
                            padding: '2px 12px',
                            borderRadius: '20px',
                            fontWeight: '700',
                            fontSize: '0.875rem',
                            border: '1px solid #22c55e'
                          }}>
                            <Coins size={14} style={{ color: '#16a34a' }} />
                            {r.total_price} DH
                          </span>
                        </td>
                        {/* Statut */}
                        <td>{getStatusBadge(r.status)}</td>
                        {/* Prolongation */}
                        <td>
                          {r.can_extend_days ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#dcfce7',
                              color: '#166534',
                              padding: '2px 12px',
                              borderRadius: '20px',
                              fontWeight: '600',
                              fontSize: '0.75rem'
                            }}>
                              <CalendarPlus size={14} style={{ color: '#16a34a' }} /> Oui
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#fee2e2',
                              color: '#991b1b',
                              padding: '2px 12px',
                              borderRadius: '20px',
                              fontWeight: '600',
                              fontSize: '0.75rem'
                            }}>
                              <CalendarX size={14} style={{ color: '#ef4444' }} /> Non
                            </span>
                          )}
                        </td>
                        {/* Sous‑location */}
                        <td>
                          {r.sous_location ? (
                            <span className="sous-location-tag">
                              <Tag size={14} /> {r.sous_location.name}
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              <Home size={14} /> Propre
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="text-right">
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(4, auto)',
    gap: '4px',
    justifyContent: 'flex-end',
    justifyItems: 'center'
  }}>
    {r.status === "pending" || r.status === "contacted" ? (
      <>
        <button onClick={() => setStatus(r.id, "confirmed")}
          style={{
            width: '32px', height: '32px',
            borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: '#22c55e', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
          title="Confirmer"
        >
          <CheckCircle size={16} />
        </button>
        <button onClick={() => setStatus(r.id, "cancelled")}
          style={{
            width: '32px', height: '32px',
            borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: '#ef4444', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
          title="Annuler"
        >
          <XCircle size={16} />
        </button>
      </>
    ) : r.status === "cancelled" ? (
      <button onClick={() => setStatus(r.id, "pending")}
        style={{
          width: '32px', height: '32px',
          borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: '#eab308', transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#fefce8'; e.currentTarget.style.transform = 'scale(1.1)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
        title="Remettre en attente"
      >
        <Clock size={16} />
      </button>
    ) : null}

    <button onClick={() => handleViewContract(r)}
      style={{
        width: '32px', height: '32px',
        borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'transparent', cursor: 'pointer',
        color: '#3b82f6', transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.transform = 'scale(1.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
      title="Voir contrat"
    >
      <FileText size={16} />
    </button>

    <button onClick={() => handlePrintClick(r)}
      style={{
        width: '32px', height: '32px',
        borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'transparent', cursor: 'pointer',
        color: '#8b5cf6', transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.transform = 'scale(1.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
      title="Imprimer"
    >
      <Printer size={16} />
    </button>

    <button onClick={() => handleWhatsApp(r)}
      style={{
        width: '32px', height: '32px',
        borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'transparent', cursor: 'pointer',
        color: '#25d366', transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.transform = 'scale(1.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
      title="Envoyer un message WhatsApp"
    >
      <MessageCircle size={16} />
    </button>

    <button onClick={() => handleEdit(r)}
      style={{
        width: '32px', height: '32px',
        borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'transparent', cursor: 'pointer',
        color: '#10b981', transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.transform = 'scale(1.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
      title="Modifier"
    >
      <Edit size={16} />
    </button>

    <button onClick={() => setExpandedRowId(expandedRowId === r.id ? null : r.id)}
      style={{
        width: '32px', height: '32px',
        borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'transparent', cursor: 'pointer',
        color: '#06b6d4', transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#ecfeff'; e.currentTarget.style.transform = 'scale(1.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
      title="Détails"
    >
      {expandedRowId === r.id ? <ChevronUp size={16} /> : <Eye size={16} />}
    </button>

    <button onClick={() => handleDeleteClick(r)}
      style={{
        width: '32px', height: '32px',
        borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'transparent', cursor: 'pointer',
        color: '#ef4444', transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.transform = 'scale(1.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
      title="Supprimer"
    >
      <Trash2 size={16} />
    </button>
  </div>
</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="10" style={{ padding: 0, background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '16px',
                              padding: '18px 24px 22px',
                              alignItems: 'stretch'
                            }}>
                              {/* Paiement */}
                              <div style={{
                                minWidth: '230px',
                                flex: '1 1 230px',
                                background: '#ffffff',
                                borderRadius: '12px',
                                borderLeft: '4px solid #06b6d4',
                                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
                                padding: '14px 16px'
                              }}>
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  fontWeight: 700, fontSize: '0.75rem', color: '#0891b2',
                                  marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em'
                                }}>
                                  <DollarSign size={14} /> Paiement
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                                    <span style={{ color: '#64748b' }}>Total</span>
                                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.total_price} DH</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                                    <span style={{ color: '#64748b' }}>Payé</span>
                                    <span style={{
                                      fontWeight: 700, color: '#16a34a',
                                      background: '#f0fdf4', padding: '1px 8px', borderRadius: '10px'
                                    }}>{r.amount_paid} DH</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                                    <span style={{ color: '#64748b' }}>Restant</span>
                                    <span style={{
                                      fontWeight: 700, color: '#dc2626',
                                      background: '#fef2f2', padding: '1px 8px', borderRadius: '10px'
                                    }}>{r.remaining_amount} DH</span>
                                  </div>
                                </div>
                              </div>

                              {/* Historique des paiements */}
                              {rowPaymentHistory.length > 0 && (
                                <div style={{
                                  minWidth: '260px',
                                  flex: '1 1 260px',
                                  background: '#ffffff',
                                  borderRadius: '12px',
                                  borderLeft: '4px solid #8b5cf6',
                                  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
                                  padding: '14px 16px'
                                }}>
                                  <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontWeight: 700, fontSize: '0.75rem', color: '#7c3aed',
                                    marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em'
                                  }}>
                                    <Receipt size={14} /> Historique des paiements
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {rowPaymentHistory.map((p, idx) => (
                                      <div key={idx} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        gap: '10px', fontSize: '0.8rem', color: '#334155',
                                        padding: '4px 0', borderBottom: idx < rowPaymentHistory.length - 1 ? '1px dashed #e2e8f0' : 'none'
                                      }}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{new Date(p.date).toLocaleDateString("fr-FR")}</span>
                                        <span style={{ fontWeight: 600, color: '#16a34a' }}>{p.amount} DH</span>
                                        <span style={{
                                          fontSize: '0.7rem', color: '#7c3aed', background: '#f5f3ff',
                                          padding: '1px 8px', borderRadius: '10px', textTransform: 'capitalize'
                                        }}>{p.method}</span>
                                        {p.notes && <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>{p.notes}</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Prolongation */}
                              <div style={{
                                minWidth: '230px',
                                flex: '1 1 230px',
                                background: '#ffffff',
                                borderRadius: '12px',
                                borderLeft: r.can_extend_days && r.prolongation_days > 0 ? '4px solid #f59e0b' : '4px solid #cbd5e1',
                                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
                                padding: '14px 16px'
                              }}>
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  fontWeight: 700, fontSize: '0.75rem', color: '#b45309',
                                  marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em'
                                }}>
                                  <Tag size={14} /> Prolongation
                                </div>
                                {r.can_extend_days && r.prolongation_days > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                                      <span style={{ color: '#64748b' }}>Jours ajoutés</span>
                                      <span style={{
                                        fontWeight: 700, color: '#b45309',
                                        background: '#fffbeb', padding: '1px 8px', borderRadius: '10px'
                                      }}>+{r.prolongation_days} jours</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                                      <span style={{ color: '#64748b' }}>Ajoutée le</span>
                                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                        {r.updated_at ? new Date(r.updated_at).toLocaleDateString("fr-FR") : "—"}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Aucune prolongation</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={filteredReservations.length}
              />
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {details && (
        <div className="modal-glass-container" style={{ maxWidth: '600px', margin: '1rem auto' }}>
          <div className="modal-header-hero info-hero">
            <div className="hero-left">
              <div className="hero-icon-wrapper info-glow"><Eye size={24} /></div>
              <div className="hero-text">
                <span className="hero-badge info-badge">Détails</span>
                <h2>Réservation #{details.id}</h2>
              </div>
            </div>
            <button onClick={() => setDetails(null)} className="hero-close-btn"><X size={20} /></button>
          </div>
          <div className="modal-body-details">
            {(() => {
              const client = clients.find(c => c.id === details.client_id);
              const car = cars.find(c => c.id === details.car_id);
              const mat = matricules.find(m => m.id === details.matricule_id);
              const secondDriver = clients.find(c => c.id === details.second_driver_client_id);
              let paymentHistory = details.payment_history;
              if (typeof paymentHistory === 'string') {
                try { paymentHistory = JSON.parse(paymentHistory); } catch (e) { paymentHistory = []; }
              }
              if (!Array.isArray(paymentHistory)) paymentHistory = [];

              return (
                <div className="details-grid">
                  <div className="details-row"><span className="details-label"><User size={14} /> Client</span><span className="details-value">{client ? `${client.prenom} ${client.nom}` : "—"}</span></div>
                  {client && (<><div className="details-row"><span className="details-label"><Mail size={14} /> Email</span><span>{client.email || "—"}</span></div><div className="details-row"><span className="details-label"><Phone size={14} /> Téléphone</span><span>{client.telephone || "—"}</span></div><div className="details-row"><span className="details-label"><MapPin size={14} /> Ville</span><span>{client.city || "—"}</span></div><div className="details-row"><span className="details-label"><IdCard size={14} /> CIN</span><span>{client.cin_number || "—"}</span></div></>)}
                  {details.has_second_driver && secondDriver && (<><div className="details-row"><span className="details-label"><Users size={14} /> 2ème Conducteur</span><span>{secondDriver.prenom} {secondDriver.nom}</span></div><div className="details-row"><span className="details-label"><Phone size={14} /> Tél. conducteur</span><span>{secondDriver.telephone || "—"}</span></div></>)}
                  <div className="details-row"><span className="details-label"><Car size={14} /> Véhicule</span><span>{car ? `${car.brand} ${car.model}` : "—"}</span></div>
                  <div className="details-row"><span className="details-label"><IdCard size={14} /> Immatriculation</span><span className="font-mono">{mat?.matricule_code || "—"}</span></div>
                  <div className="details-row"><span className="details-label"><Gauge size={14} /> Km départ</span><span>{details.kilometrage_sortie || "—"} km</span></div>
                  {details.status === "completed" && (<div className="details-row"><span className="details-label"><Gauge size={14} /> Km retour</span><span>{details.kilometrage_entree || "—"} km</span></div>)}
                  <div className="details-row"><span className="details-label"><Calendar size={14} /> Période</span><span>{new Date(details.start_date).toLocaleDateString("fr-FR")} → {new Date(details.end_date).toLocaleDateString("fr-FR")}</span></div>
                  <div className="details-row"><span className="details-label"><Clock size={14} /> Heures</span><span>{details.start_time || "08:00"} → {details.end_time || "18:00"}</span></div>
                  <div className="details-row"><span className="details-label"><CalendarDays size={14} /> Jours</span><span>{calculateDays(details.start_date, details.end_date)}</span></div>
                  <div className="details-row"><span className="details-label"><DollarSign size={14} /> Total</span><span className="details-value">{details.total_price} DH</span></div>
                  <div className="details-row"><span className="details-label"><DollarSign size={14} /> Payé</span><span>{details.amount_paid} DH</span></div>
                  <div className="details-row"><span className="details-label"><DollarSign size={14} /> Restant</span><span>{details.remaining_amount} DH</span></div>
                  <div className="details-row"><span className="details-label"><Info size={14} /> Statut</span><span>{getStatusBadge(details.status)}</span></div>
                  <div className="details-row"><span className="details-label"><Tag size={14} /> Prolongation</span><span>{details.can_extend_days ? "✅ Oui" : "—"}</span></div>
                  <div className="details-row"><span className="details-label"><Tag size={14} /> Sous‑location</span><span>{details.sous_location?.name || "—"}</span></div>
                  {details.notes && (<div className="details-row"><span className="details-label"><Info size={14} /> Notes</span><span>{details.notes}</span></div>)}
                  {paymentHistory.length > 0 && (
                    <div className="details-row">
                      <span className="details-label"><Receipt size={14} /> Paiements</span>
                      <div>
                        {paymentHistory.map((p, idx) => (
                          <div key={idx} className="payment-item-detail">
                            {new Date(p.date).toLocaleDateString("fr-FR")}: {p.amount} DH ({p.method})
                            {p.notes && ` - ${p.notes}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="modal-footer-actions"><button onClick={() => setDetails(null)} className="btn btn-secondary">Fermer</button></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && reservationToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-card">
            <div className="delete-icon-box"><Trash size={24} /></div>
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer la réservation <br/><strong>#{reservationToDelete.id}</strong> ?<br/>Cette action est irréversible.</p>
            {reservationToDelete.status === "confirmed" && (<p style={{ fontSize: "0.75rem", color: "#dc2626" }}>⚠️ Cette réservation est confirmée. La suppression affectera les données associées.</p>)}
            <div className="delete-actions">
              <button className="modal-btn-cancel" onClick={() => setDeleteModalOpen(false)}>Annuler</button>
              <button className="modal-btn-delete" onClick={confirmDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup d'options d'impression */}
      {showPrintOptions && printReservation && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Options d'impression</h2>
              <button onClick={() => setShowPrintOptions(false)} className="modal-close"><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p>Souhaitez-vous inclure la signature de l'agent dans le contrat ?</p>
            </div>
            <div className="modal-actions-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => handlePrintConfirm(false)} className="btn btn-secondary">Sans signature</button>
              <button onClick={() => handlePrintConfirm(true)} className="btn btn-primary">Avec signature</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals for confirm and complete */}
      {showConfirmModal && renderConfirmModal()}
      {showCompleteModal && renderCompleteModal()}

      {/* ===== REDESIGNED STYLES (same as AdminReservations) ===== */}
      <style>{`
        /* Root container layout */
        .admin-smaiti-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #f7f9fc;
          color: #1a202c;
          min-height: 100vh;
          padding: 20px 40px;
        }

        .smaiti-topbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0 20px 0; border-bottom: 1px solid #e2e8f0;
        }
        .smaiti-logo-area { display: flex; align-items: baseline; gap: 16px; }
        .smaiti-brand { font-family: 'Georgia', serif; color: #b6926e; font-size: 1.5rem; font-weight: 600; letter-spacing: 1px; }
        .smaiti-flotte { font-size: 1.8rem; font-weight: 700; color: #0f172a; }
        .smaiti-right-actions { display: flex; align-items: center; gap: 16px; }

        .smaiti-search-bar {
          display: flex; align-items: center; background: white;
          border-radius: 40px; padding: 8px 16px; border: 1px solid #e2e8f0;
          gap: 10px; transition: all 0.2s;
        }
        .smaiti-search-bar:focus-within { border-color: #0d4734; box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.1); }
        .smaiti-search-bar input {
          border: none; outline: none; background: transparent;
          font-size: 0.875rem; width: 180px; color: #1a202c;
        }
        .smaiti-search-bar svg { color: #94a3b8; width: 16px; height: 16px; }
        .smaiti-notif-btn {
          background: white; border: 1px solid #e2e8f0; border-radius: 50%;
          width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s; color: #1e293b;
        }
        .smaiti-notif-btn:hover { background: #f1f5f9; }

        .stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem; margin: 1.5rem 0;
        }
        .stat-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
          padding: 1rem; display: flex; justify-content: space-between; align-items: center;
          transition: all 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .stat-number { font-size: 1.5rem; font-weight: 700; }
        .stat-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-icon { opacity: 0.6; }

        .smaiti-actions-wrapper {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0 16px 0;
          flex-wrap: wrap;
          gap: 8px;
        }
        .smaiti-count { font-size: 0.875rem; color: #475569; }
        .smaiti-actions-buttons { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }

        .btn { display: inline-flex; align-items: center; gap: 0.5rem; height: 2.5rem; padding: 0 1rem; border-radius: 9999px; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.2s; }
        .btn-secondary { background: white; border: 1px solid #e2e8f0; color: #0f172a; }
        .btn-secondary:hover { background: #f8fafc; }
        .btn-primary { background: #0d4734; color: white; }
        .btn-primary:hover { background: #0a3a2a; transform: translateY(-1px); }

        .status-select-filter {
          padding: 0 1rem; height: 2.5rem; border-radius: 9999px; border: 1px solid #e2e8f0;
          background: white; font-size: 0.875rem; color: #0f172a; outline: none; cursor: pointer;
        }

        .date-filter-group { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
        .date-filter-label { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
        .date-filter-input {
          padding: 0.25rem 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px;
          font-size: 0.75rem; background: white; transition: all 0.2s; width: 120px;
        }
        .date-filter-input:focus { outline: none; border-color: #0d4734; box-shadow: 0 0 0 2px rgba(13,71,52,0.1); }
        .clear-date-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0.25rem; background: #fee2e2; border: none; border-radius: 0.5rem;
          cursor: pointer; color: #dc2626; transition: all 0.2s;
        }
        .clear-date-btn:hover { background: #fecaca; }

        .smaiti-table-container {
          background: white; border-radius: 12px;
          border: 1px solid #e2e8f0; 
          overflow-x: auto; 
          -webkit-overflow-scrolling: touch;
        }
        .smaiti-table {
          width: 100%; border-collapse: collapse; font-size: 0.75rem;
          min-width: 900px;
        }
        .smaiti-table thead { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .smaiti-table th {
          text-align: left; padding: 10px 10px;
          color: #64748b; font-weight: 500; font-size: 0.65rem; text-transform: uppercase;
          white-space: nowrap;
        }
        .smaiti-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: 0.2s; }
        .smaiti-table tbody tr:last-child { border-bottom: none; }
        .smaiti-table tbody tr:hover { background: #f8fafc; }
        .smaiti-table td { padding: 8px 10px; vertical-align: middle; white-space: nowrap; }

        .sortable-header { cursor: pointer; user-select: none; }
        .sort-icon { opacity: 0.5; vertical-align: middle; margin-left: 4px; }
        .sort-icon.active { opacity: 1; color: #0d4734; }

        .badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 40px; font-weight: 500; font-size: 0.65rem;
          white-space: nowrap;
        }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .badge-purple { background: #f3e8ff; color: #6b21a5; }
        .badge-gray { background: #f1f5f9; color: #475569; }

        .action-icons { display: flex; gap: 4px; justify-content: flex-end; flex-wrap: wrap; }
        .action-btn {
          width: 28px; height: 28px; border-radius: 50%;
          border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s; background: transparent;
        }
        .action-btn.view { background: #e7f3ef; color: #0d4734; }
        .action-btn.edit { background: #f1f5f9; color: #64748b; }
        .action-btn.delete { background: #fee2e2; color: #ef4444; }
        .action-btn.accident { background: #fef3c7; color: #d97706; }
        .action-btn:hover { transform: scale(1.05); }
        .action-btn svg { width: 14px; height: 14px; }
        .action-btn-primary { color: #eab308; }
        .action-btn-primary:hover { background: #fefce8; }
        .action-btn-link { color: #3b82f6; }
        .action-btn-link:hover { background: #eff6ff; }
        .action-btn-print { color: #8b5cf6; }
        .action-btn-print:hover { background: #f5f3ff; }
        .action-btn-whatsapp { color: #25d366; }
        .action-btn-whatsapp:hover { background: #ecfdf5; }

        /* Glassmorphism Redesigned Modal Layout */
        .modal-glass-container {
          background: #ffffff;
          border-radius: 20px;
          margin: 1rem auto;
          max-width: 1100px;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.12);
          border: 1px solid #cbd5e1;
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-header-hero {
          padding: 24px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
        }

        .primary-hero { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
        .accident-hero { background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%); }
        .info-hero { background: linear-gradient(135deg, #f0fdf4 0%, #e6f7ec 100%); }

        .hero-left { display: flex; align-items: center; gap: 16px; }

        .hero-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .primary-glow { background: #0d4734; color: white; box-shadow: 0 8px 16px rgba(13, 71, 52, 0.2); }
        .danger-glow { background: #dc2626; color: white; box-shadow: 0 8px 16px rgba(220, 38, 38, 0.2); }
        .info-glow { background: #0f973d; color: white; box-shadow: 0 8px 16px rgba(15, 151, 61, 0.2); }

        .hero-text h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 2px 0; }
        .hero-text p { font-size: 0.85rem; color: #64748b; margin: 0; }

        .hero-badge {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .primary-badge { background: #e7f3ef; color: #0d4734; }
        .danger-badge { background: #fee2e2; color: #dc2626; }
        .info-badge { background: #dcfce7; color: #15803d; }

        .hero-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .hero-close-btn:hover { background: #f8fafc; color: #0f172a; transform: rotate(90deg); }

        .modal-body-form { padding: 28px 32px; }
        .modal-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .form-column { display: flex; flex-direction: column; gap: 20px; }

        .form-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 18px;
          transition: border-color 0.2s;
        }
        .form-card:focus-within { border-color: #0d4734; }

        .card-header {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;
        }
        .card-header h4 { font-size: 0.85rem; font-weight: 700; color: #1e293b; margin: 0; text-transform: uppercase; letter-spacing: 0.4px; }
        .text-emerald { color: #0d4734; }

        .input-group-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field-block { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .field-block:last-child { margin-bottom: 0; }
        .field-block label { font-size: 0.72rem; font-weight: 600; color: #475569; text-transform: uppercase; }

        .styled-input, .styled-select, .styled-textarea {
          width: 100%;
          padding: 9px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.85rem;
          color: #0f172a;
          background: #f8fafc;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .styled-input:focus, .styled-select:focus, .styled-textarea:focus {
          outline: none;
          background: #ffffff;
          border-color: #0d4734;
          box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.08);
        }
        .readonly-input { background: #f1f5f9; color: #64748b; cursor: not-allowed; }

        .relative-block { position: relative; }
        .input-with-icon { position: relative; width: 100%; }
        .input-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .padded-input { padding-left: 32px; padding-right: 28px; }
        .input-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; }

        .styled-dropdown {
          position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
          background: white; border: 1px solid #cbd5e1; border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-height: 180px; overflow-y: auto; margin-top: 4px;
        }
        .dropdown-item { padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9; }
        .dropdown-item:hover { background: #f8fafc; }
        .dropdown-title { font-size: 0.8rem; color: #0f172a; }
        .dropdown-sub { font-size: 0.7rem; color: #64748b; margin-top: 2px; }

        /* ======== SOBRE SELECTED INFO BLOCK (unique) ======== */
        .selected-info-block {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          padding: 4px 12px 4px 8px;
          background: #f1f5f9;
          border-radius: 20px;
          font-size: 0.85rem;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
          width: fit-content;
          max-width: 100%;
        }
        .selected-info-block .selected-icon {
          color: #22c55e;
          flex-shrink: 0;
          width: 16px;
          height: 16px;
        }
        .selected-info-block .selected-label {
          font-weight: 400;
          color: #64748b;
        }
        .selected-info-block .selected-value {
          font-weight: 600;
          color: #0f172a;
        }
        .selected-info-block .selected-clear {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
          margin-left: 2px;
        }
        .selected-info-block .selected-clear:hover {
          background: #e2e8f0;
          color: #ef4444;
        }

        .modal-footer-actions {
          display: flex; justify-content: flex-end; gap: 12px;
          padding-top: 20px; border-top: 1px solid #e2e8f0; margin-top: 20px;
        }
        .btn-modal-secondary {
          padding: 10px 20px; border-radius: 30px; border: 1px solid #cbd5e1;
          background: white; font-size: 0.85rem; font-weight: 600; color: #475569; cursor: pointer;
        }
        .btn-modal-secondary:hover { background: #f8fafc; }

        .btn-modal-primary {
          padding: 10px 24px; border-radius: 30px; border: none;
          background: #0d4734; font-size: 0.85rem; font-weight: 600; color: white; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-modal-primary:hover { background: #0a3a2a; transform: translateY(-1px); }

        .btn-modal-danger {
          padding: 10px 24px; border-radius: 30px; border: none;
          background: #dc2626; font-size: 0.85rem; font-weight: 600; color: white; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-modal-danger:hover { background: #b91c1c; transform: translateY(-1px); }

        .modal-body-details { padding: 24px 32px; }
        .details-overview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }

        .details-grid { display: flex; flex-direction: column; gap: 0.5rem; }
        .details-row { display: grid; grid-template-columns: 160px 1fr; gap: 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0; }
        .details-label { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-weight: 500; }

        .delete-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1001; }
        .delete-modal-card { background: white; border-radius: 20px; padding: 32px; max-width: 400px; width: 100%; text-align: center; }
        .delete-icon-box { width: 48px; height: 48px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #dc2626; }
        .delete-modal-card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; }
        .delete-modal-card p { color: #64748b; font-size: 0.875rem; margin-bottom: 24px; }
        .delete-actions { display: flex; gap: 12px; }
        .modal-btn-cancel { flex: 1; background: #f1f5f9; border: none; padding: 10px; border-radius: 40px; cursor: pointer; font-weight: 500; }
        .modal-btn-delete { flex: 1; background: #dc2626; color: white; border: none; padding: 10px; border-radius: 40px; cursor: pointer; font-weight: 500; }

        /* Inline components */
        .inline-selected {
          background: linear-gradient(135deg, #fefce8, #fef3c7);
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
        }
        .inline-selected svg { color: #eab308; flex-shrink: 0; }
        .inline-selected strong { display: block; font-size: 0.7rem; color: #92400e; }
        .inline-selected p { font-size: 0.8rem; font-weight: 500; margin: 0; }

        .inline-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.875rem; font-weight: 500; margin-bottom: 12px; }

        .inline-payment-section { margin-top: 20px; }
        .inline-add-payment {
          background: #eab308; color: #1a1a2e; border: none;
          padding: 8px 16px; border-radius: 40px; font-size: 0.75rem; font-weight: 500;
          cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
          margin-bottom: 16px;
        }
        .inline-add-payment:hover { background: #fbbf24; }

        .inline-history {
          background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;
          margin-top: 12px;
        }
        .inline-history h4 { padding: 12px 16px; background: #f8fafc; margin: 0; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid #e2e8f0; }
        .inline-history-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid #f1f5f9; }
        .inline-history-info { display: flex; gap: 16px; align-items: center; font-size: 0.75rem; flex-wrap: wrap; }
        .inline-history-date { color: #64748b; min-width: 80px; }
        .inline-history-method { background: #f1f5f9; padding: 2px 8px; border-radius: 40px; }
        .inline-history-amount { font-weight: 600; color: #eab308; }
        .inline-history-delete { background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; }

        /* Enhanced Vehicle Info Cell */
        .vehicle-info-cell {
          background: #fefce8;
          padding: 4px 12px;
          border-radius: 8px;
          border-left: 4px solid #eab308;
          display: inline-block;
          min-width: 120px;
        }
        .vehicle-model { font-weight: 600; color: #1e293b; font-size: 0.875rem; }
        .vehicle-matricule {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          font-family: 'Courier New', monospace;
          font-weight: 700;
          color: #b8860b;
          font-size: 0.8rem;
          letter-spacing: 0.5px;
        }
        .vehicle-color-info {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        .color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.15);
          display: inline-block;
          flex-shrink: 0;
        }
        .color-text { color: #475569; font-weight: 400; font-family: system-ui, sans-serif; }

        /* Days remaining */
        .days-remaining-cell { font-size: 0.75rem; font-weight: 500; }
        .days-remaining-cell.late { color: #dc2626; font-weight: 600; }

        /* Second driver info */
        .second-driver-info { font-size: 0.65rem; color: #eab308; display: flex; align-items: center; gap: 4px; margin-top: 4px; }

        /* Responsive */
        @media (max-width: 1024px) {
          .modal-grid-2 { grid-template-columns: 1fr; }
          .details-overview-grid { grid-template-columns: 1fr; }
          .admin-smaiti-page { padding: 12px 16px; }
          .smaiti-topbar { flex-direction: column; align-items: stretch; gap: 12px; }
          .smaiti-right-actions { flex-wrap: wrap; justify-content: center; }
          .smaiti-search-bar input { width: 120px; }
          .smaiti-actions-wrapper { flex-direction: column; align-items: stretch; }
          .smaiti-actions-buttons { justify-content: center; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .date-filter-group { flex-wrap: wrap; }
          .date-filter-input { width: 100px; }
        }
        @media (max-width: 768px) {
          .admin-smaiti-page { padding: 8px 10px; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .smaiti-table { font-size: 0.65rem; min-width: 700px; }
          .smaiti-table th, .smaiti-table td { padding: 6px 6px; }
          .modal-glass-container { margin: 0.5rem; border-radius: 12px; }
          .modal-header-hero { padding: 16px; flex-wrap: wrap; }
          .hero-left { flex-wrap: wrap; }
          .hero-text h2 { font-size: 1rem; }
          .modal-body-form { padding: 16px; }
          .input-group-row { grid-template-columns: 1fr; }
          .details-row { grid-template-columns: 1fr; gap: 0.25rem; }
          .vehicle-info-cell { min-width: auto; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
          .smaiti-search-bar input { width: 100px; }
          .smaiti-actions-buttons .btn { font-size: 0.7rem; padding: 0 0.5rem; height: 2rem; }
        }
        .display-options-panel {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border: 1px solid #e2e8f0;
        }
        .display-options-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .display-options-header h3 {
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
        }
        .reset-all-btn {
          background: none;
          border: 1px solid #e2e8f0;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.7rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          transition: all 0.2s;
        }
        .reset-all-btn:hover {
          background: #f1f5f9;
        }
        .display-options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }
        .display-option-item {
          background: #f8fafc;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .display-option-label {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .display-option-buttons {
          display: flex;
          gap: 0.25rem;
        }
        .mode-btn {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 0.2rem 0.4rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #64748b;
        }
        .mode-btn.active {
          background: #eab308;
          border-color: #eab308;
          color: #0f172a;
        }
        .mode-btn:hover {
          background: #f1f5f9;
        }

        @media (prefers-color-scheme: dark) {
          .display-options-panel {
            background: #1e293b;
            border-color: #334155;
          }
          .display-option-item {
            background: #0f172a;
            border-color: #475569;
          }
          .mode-btn {
            background: #1e293b;
            border-color: #475569;
            color: #cbd5e1;
          }
          .mode-btn.active {
            background: #eab308;
            color: #0f172a;
          }
          .reset-all-btn {
            border-color: #475569;
            color: #cbd5e1;
          }
          .reset-all-btn:hover {
            background: #334155;
          }
        }
        /* ===== NEW STYLES FOR TABLE CELLS ===== */
        /* ID Badge */
        .reservation-id-badge {
          display: inline-block;
          background: linear-gradient(135deg, #1e293b, #334155);
          color: #eab308;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          border: 1px solid #eab308;
          box-shadow: 0 2px 4px rgba(234, 179, 8, 0.2);
        }
        /* Vehicle/Matricule Enhanced */
        .vehicle-info-cell-enhanced {
          background: #fefce8;
          padding: 6px 14px;
          border-radius: 12px;
          border-left: 4px solid #eab308;
          display: inline-block;
          min-width: 140px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .vehicle-model-enhanced {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: #1e293b;
          font-size: 0.85rem;
        }
        .vehicle-icon {
          color: #eab308;
        }
        .vehicle-matricule-enhanced {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-family: 'Courier New', monospace;
          font-weight: 700;
          color: #b8860b;
          font-size: 0.8rem;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }
        .vehicle-color-info-enhanced {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 500;
        }
        .color-dot-enhanced {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.15);
          display: inline-block;
          flex-shrink: 0;
        }
        .color-text-enhanced {
          color: #475569;
          font-weight: 400;
          font-family: system-ui, sans-serif;
        }
        /* Period Cell */
        .period-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 8px;
          min-width: 120px;
        }
        .period-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #1e293b;
        }
        .period-icon {
          color: #64748b;
        }
        .period-arrow {
          color: #0f172a;
          font-weight: 500;
        }
        .arrow-icon {
          margin-left: 16px;
          margin-right: 4px;
          color: #94a3b8;
        }
        /* Days Badge */
        .days-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.75rem;
          border: 1px solid #60a5fa;
        }
        .days-icon {
          color: #2563eb;
        }
        /* Total Badge */
        .total-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fef3c7;
          color: #92400e;
          padding: 4px 14px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.875rem;
          border: 1px solid #f59e0b;
        }
        .total-icon {
          color: #d97706;
        }
        /* Sous-location tag */
        .sous-location-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #e0f2fe;
          color: #0369a1;
          padding: 2px 10px;
          border-radius: 16px;
          font-weight: 500;
          font-size: 0.75rem;
          border: 1px solid #7dd3fc;
        }
        /* Days remaining */
        .days-remaining-cell {
          font-size: 0.75rem;
          font-weight: 500;
          color: #334155;
        }
        .days-remaining-cell.late {
          color: #dc2626;
          font-weight: 600;
        }
      `}</style>
    </>
  );
}