// src/pages/admin/AdminAccidents.jsx
import React, { useEffect, useState, useMemo } from "react";
import { pdf, PDFViewer } from '@react-pdf/renderer';
import { AccidentReportPDF } from '../../components/pdf/AccidentReportPDF';
import { AccidentEstimatePDF } from '../../components/pdf/AccidentEstimatePDF';
import { AccidentInvoicePDF } from '../../components/pdf/AccidentInvoicePDF';
import PaginationControls from '../../components/PaginationControls';
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  fetchAccidents,
  fetchMatricules,
  fetchCars,
  fetchClients,
  fetchGarages,
  fetchReservations,
  createAccident,
  updateAccident,
  deleteAccident,
  getAccidentNextStatuses,
  selectAccidents,
  selectMatricules,
  selectCars,
  selectClients,
  selectGarages,
  selectReservations,
  selectAccidentsLoading,
  selectToken,
} from "../../Redux/store";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, X, Eye, Search, RefreshCw, AlertTriangle,
  ChevronLeft, ChevronRight, Car, User, Calendar, DollarSign,
  FileText, Shield, Gavel, Clock, CheckCircle, XCircle, AlertCircle,
  Building2, Phone, Mail, MapPin, IdCard, TrendingUp, BarChart3,
  Save, TrashIcon, FileCheck, Briefcase, Scale, ClipboardList,
  Users, CalendarDays, Euro, Wallet, CreditCard, Loader2, Wrench, Palette,
  Sparkles, Star, ArrowLeft, Info, Activity, ArrowUpDown, ArrowUp, ArrowDown,
  Key, Lock, Unlock, Crown, Printer, Download, Truck, Home, Clipboard,
  Receipt, PenTool, FileSignature, CheckSquare, Percent, Copy, Bell
} from "lucide-react";

export default function AdminAccidents() {
  const dispatch = useDispatch();
  const accidents = useSelector(selectAccidents);
  const matricules = useSelector(selectMatricules);
  const cars = useSelector(selectCars);
  const clients = useSelector(selectClients);
  const garages = useSelector(selectGarages);
  const reservations = useSelector(selectReservations);
  const loading = useSelector(selectAccidentsLoading);
  const token = useSelector(selectToken);

  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  // UI state
  const [showAccidentForm, setShowAccidentForm] = useState(false);
  const [showAccidentDetails, setShowAccidentDetails] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [accidentToDelete, setAccidentToDelete] = useState(null);
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeStep, setActiveStep] = useState(0);
  const [nextStatuses, setNextStatuses] = useState([]);

  // Document preview state
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [documentPreviewType, setDocumentPreviewType] = useState(null);
  const [documentPreviewAccident, setDocumentPreviewAccident] = useState(null);

  // Sorting
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Searchable select states (unchanged)
  const [matriculeSearchTerm, setMatriculeSearchTerm] = useState('');
  const [filteredMatriculesList, setFilteredMatriculesList] = useState([]);
  const [selectedMatriculeObj, setSelectedMatriculeObj] = useState(null);

  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [filteredClientsList, setFilteredClientsList] = useState([]);
  const [selectedClientObj, setSelectedClientObj] = useState(null);

  const [reservationSearchTerm, setReservationSearchTerm] = useState('');
  const [selectedReservationObj, setSelectedReservationObj] = useState(null);

  const [garageSearchTerm, setGarageSearchTerm] = useState('');
  const [filteredGaragesList, setFilteredGaragesList] = useState([]);
  const [selectedGarageObj, setSelectedGarageObj] = useState(null);

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payer: 'client',
    method: 'cash',
    reference: '',
    notes: ''
  });

  // Close Confirmation Modal state
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Helper functions (unchanged)
  const safeStringify = (items) => {
    if (!items) return '[]';
    if (!Array.isArray(items)) return '[]';
    try { return JSON.stringify(items, null, 2); } catch (e) { return '[]'; }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().slice(0, 10);
    } catch { return ""; }
  };

  // Form data (unchanged)
  const [formData, setFormData] = useState({
    matricule_id: "",
    car_id: "",
    client_id: "",
    reservation_id: "",
    date_accident: new Date().toISOString().slice(0, 10),
    time_accident: "",
    location: "",
    description: "",
    police_report_number: "",
    amount_of_losses: 0,
    amount_assurance: 0,
    nom_expert: "",
    status: "open",
    accident_type: "grave",
    procedure_type: "classic",
    expert_decision: "pending",
    expert_amount: 0,
    expert_notes: "",
    notes: "",
    garage_id: "",
    inspection_notes: "",
    estimated_cost: 0,
    total_repair_cost: 0,
    franchise_amount: 0,
    insurance_paid: 0,
    client_paid: 0,
    total_paid: 0,
    remaining_amount: 0,
    internal_notes: "",
    closed_at: null,
    estimate_items: [],
    estimate_total_ht: 0,
    estimate_tva: 0,
    estimate_total_ttc: 0,
    estimate_status: "draft",
    estimate_number: "",
    repair_start_date: "",
    repair_end_date: "",
    repair_notes: "",
    invoice_number: "",
    invoice_items: [],
    invoice_total_ht: 0,
    invoice_tva: 0,
    invoice_total_ttc: 0,
    payments: [],
    img_accident: [],
    img_evaluation_expert: [],
    img_fixed: [],
    image_facture: [],
  });

  // Load data
  useEffect(() => {
    const load = async () => {
      await Promise.all([
        dispatch(fetchAccidents()),
        dispatch(fetchMatricules()),
        dispatch(fetchCars()),
        dispatch(fetchClients()),
        dispatch(fetchGarages()),
        dispatch(fetchReservations()),
      ]);
    };
    load();
  }, [dispatch]);

  useEffect(() => {
    if (editing && editing.id) {
      const loadNextStatuses = async () => {
        const result = await dispatch(getAccidentNextStatuses(editing.id));
        if (!result.error && result.payload) setNextStatuses(result.payload);
      };
      loadNextStatuses();
    }
  }, [editing, dispatch]);

  // Sort handlers
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

  // Status config (unchanged)
  const statusConfig = {
    open: { label: "Ouvert", bg: "badge-warning", icon: AlertCircle },
    under_review: { label: "En cours d'examen", bg: "badge-purple", icon: Eye },
    waiting_estimate: { label: "En attente de devis", bg: "badge-pink", icon: Clock },
    estimate_approved: { label: "Devis approuvé", bg: "badge-indigo", icon: CheckCircle },
    under_repair: { label: "En réparation", bg: "badge-orange", icon: Wrench },
    invoice_received: { label: "Facture reçue", bg: "badge-rose", icon: FileText },
    waiting_payment: { label: "En attente de paiement", bg: "badge-yellow", icon: Wallet },
    closed: { label: "Clos", bg: "badge-success", icon: CheckSquare },
    pending: { label: "Signalé", bg: "badge-warning", icon: AlertCircle },
    evaluation_owner: { label: "Évaluation propriétaire", bg: "badge-purple", icon: User },
    "contact expert": { label: "Contact expert", bg: "badge-pink", icon: Phone },
    evaluation_expert: { label: "Évaluation expert", bg: "badge-indigo", icon: Scale },
    fixed: { label: "Réparé", bg: "badge-orange", icon: Wrench },
    waiting: { label: "En attente paiement", bg: "badge-rose", icon: Clock },
    completed: { label: "Terminé", bg: "badge-success", icon: CheckCircle }
  };

  // Filter and sort
  const filteredAccidents = useMemo(() => {
    return accidents.filter(acc => {
      const mat = matricules.find(m => m.id === acc.matricule_id);
      const client = clients.find(c => c.id === acc.client_id);
      const matchesSearch = searchTerm === '' ||
        (acc.notes && acc.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (acc.id && acc.id.toString().includes(searchTerm)) ||
        (mat?.matricule_code?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client && `${client.prenom} ${client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;

      let matchesNotification = true;
      if (filterParam === 'notifications') {
        const daysSince = (new Date() - new Date(acc.date_accident)) / (1000 * 60 * 60 * 24);
        matchesNotification = daysSince <= 7 && acc.status !== 'completed' && acc.status !== 'closed';
      }

      return matchesSearch && matchesStatus && matchesNotification;
    }).sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "id": aVal = a.id; bVal = b.id; break;
        case "date": aVal = new Date(a.date_accident); bVal = new Date(b.date_accident); break;
        case "matricule": aVal = matricules.find(m => m.id === a.matricule_id)?.matricule_code || ""; bVal = matricules.find(m => m.id === b.matricule_id)?.matricule_code || ""; break;
        case "client": const aClient = clients.find(c => c.id === a.client_id); const bClient = clients.find(c => c.id === b.client_id); aVal = aClient ? `${aClient.prenom} ${aClient.nom}` : ""; bVal = bClient ? `${bClient.prenom} ${bClient.nom}` : ""; break;
        case "losses": aVal = a.amount_of_losses || 0; bVal = b.amount_of_losses || 0; break;
        case "assurance": aVal = a.amount_assurance || 0; bVal = b.amount_assurance || 0; break;
        case "status": aVal = a.status || ""; bVal = b.status || ""; break;
        default: aVal = a.id; bVal = b.id;
      }
      return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [accidents, searchTerm, statusFilter, sortField, sortDirection, matricules, clients, filterParam]);

  const totalPages = Math.ceil(filteredAccidents.length / itemsPerPage);
  const paginatedAccidents = filteredAccidents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Items management functions (unchanged)
  const addEstimateItem = () => {
    setFormData(prev => ({ ...prev, estimate_items: [...prev.estimate_items, { name: '', quantity: 1, unit_price: 0 }] }));
  };
  const removeEstimateItem = (index) => {
    setFormData(prev => ({ ...prev, estimate_items: prev.estimate_items.filter((_, i) => i !== index) }));
  };
  const updateEstimateItem = (index, field, value) => {
    setFormData(prev => {
      const items = [...prev.estimate_items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, estimate_items: items };
    });
  };

  const addInvoiceItem = () => {
    setFormData(prev => ({ ...prev, invoice_items: [...prev.invoice_items, { name: '', quantity: 1, unit_price: 0 }] }));
  };
  const removeInvoiceItem = (index) => {
    setFormData(prev => ({ ...prev, invoice_items: prev.invoice_items.filter((_, i) => i !== index) }));
  };
  const updateInvoiceItem = (index, field, value) => {
    setFormData(prev => {
      const items = [...prev.invoice_items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, invoice_items: items };
    });
  };

  const copyEstimateToInvoice = () => {
    setFormData(prev => ({ ...prev, invoice_items: JSON.parse(JSON.stringify(prev.estimate_items || [])) }));
    toast.info("Articles du devis copiés vers la facture");
  };

  // Recalculate totals
  useEffect(() => {
    const estItems = formData.estimate_items || [];
    const estHT = estItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
    setFormData(prev => ({ ...prev, estimate_total_ht: estHT, estimate_tva: 0, estimate_total_ttc: estHT }));
  }, [formData.estimate_items]);

  useEffect(() => {
    const invItems = formData.invoice_items || [];
    const invHT = invItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
    setFormData(prev => ({ ...prev, invoice_total_ht: invHT, invoice_tva: 0, invoice_total_ttc: invHT }));
  }, [formData.invoice_items]);

  // Reservation filtering
  const filteredReservationsList = useMemo(() => {
    if (!reservationSearchTerm && !formData.matricule_id && !formData.date_accident && !formData.time_accident) return [];
    let base = reservations;
    if (formData.matricule_id) {
      base = base.filter(r => r.matricule_id === parseInt(formData.matricule_id));
    }
    if (formData.date_accident) {
      const accidentDate = new Date(formData.date_accident);
      accidentDate.setHours(0,0,0,0);
      base = base.filter(r => {
        const start = new Date(r.start_date);
        start.setHours(0,0,0,0);
        const end = new Date(r.end_date);
        end.setHours(0,0,0,0);
        return accidentDate >= start && accidentDate <= end;
      });
    }
    if (formData.time_accident) {
      const accidentTime = formData.time_accident;
      base = base.filter(r => {
        if (r.start_time && r.end_time) {
          return accidentTime >= r.start_time && accidentTime <= r.end_time;
        }
        return true;
      });
    }
    const lower = reservationSearchTerm.toLowerCase().trim();
    if (lower) {
      base = base.filter(res => {
        const client = clients.find(c => c.id === res.client_id);
        const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
        const startDate = new Date(res.start_date).toLocaleDateString("fr-FR");
        const endDate = new Date(res.end_date).toLocaleDateString("fr-FR");
        return (
          res.id.toString().includes(lower) ||
          clientName.includes(lower) ||
          startDate.includes(lower) ||
          endDate.includes(lower)
        );
      });
    }
    return base.slice(0, 10);
  }, [reservations, formData.matricule_id, formData.date_accident, formData.time_accident, reservationSearchTerm, clients]);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let result;
      if (editing) {
        result = await dispatch(updateAccident({ id: editing.id, data: formData }));
      } else {
        result = await dispatch(createAccident(formData));
      }
      if (result.error) toast.error(result.payload);
      else {
        toast.success(editing ? "Accident modifié" : "Accident créé");
        setShowAccidentForm(false);
        setEditing(null);
        resetForm();
        await Promise.all([
          dispatch(fetchAccidents(true)),
          dispatch(fetchMatricules(true)),
          dispatch(fetchCars(true)),
          dispatch(fetchClients(true)),
          dispatch(fetchGarages(true)),
          dispatch(fetchReservations(true))
        ]);
      }
    } catch (error) {
      toast.error("Erreur lors de l'opération");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      matricule_id: "",
      car_id: "",
      client_id: "",
      reservation_id: "",
      date_accident: new Date().toISOString().slice(0, 10),
      time_accident: "",
      location: "",
      description: "",
      police_report_number: "",
      amount_of_losses: 0,
      amount_assurance: 0,
      nom_expert: "",
      status: "open",
      accident_type: "grave",
      procedure_type: "classic",
      expert_decision: "pending",
      expert_amount: 0,
      expert_notes: "",
      notes: "",
      garage_id: "",
      inspection_notes: "",
      estimated_cost: 0,
      total_repair_cost: 0,
      franchise_amount: 0,
      insurance_paid: 0,
      client_paid: 0,
      total_paid: 0,
      remaining_amount: 0,
      internal_notes: "",
      closed_at: null,
      estimate_items: [],
      estimate_total_ht: 0,
      estimate_tva: 0,
      estimate_total_ttc: 0,
      estimate_status: "draft",
      estimate_number: "",
      repair_start_date: "",
      repair_end_date: "",
      repair_notes: "",
      invoice_number: "",
      invoice_items: [],
      invoice_total_ht: 0,
      invoice_tva: 0,
      invoice_total_ttc: 0,
      payments: [],
      img_accident: [],
      img_evaluation_expert: [],
      img_fixed: [],
      image_facture: [],
    });
    setSelectedMatriculeObj(null);
    setMatriculeSearchTerm('');
    setFilteredMatriculesList([]);
    setSelectedClientObj(null);
    setClientSearchTerm('');
    setFilteredClientsList([]);
    setSelectedReservationObj(null);
    setReservationSearchTerm('');
    setSelectedGarageObj(null);
    setGarageSearchTerm('');
    setFilteredGaragesList([]);
    setActiveStep(0);
  };

  const handleEdit = (acc) => {
    setEditing(acc);
    setFormData({
      ...acc,
      date_accident: formatDateForInput(acc.date_accident),
      repair_start_date: formatDateForInput(acc.repair_start_date),
      repair_end_date: formatDateForInput(acc.repair_end_date),
      closed_at: acc.closed_at ? formatDateForInput(acc.closed_at) : null,
      img_accident: acc.img_accident || [],
      img_evaluation_expert: acc.img_evaluation_expert || [],
      img_fixed: acc.img_fixed || [],
      image_facture: acc.image_facture || [],
      estimate_items: acc.estimate_items || [],
      invoice_items: acc.invoice_items || [],
      payments: acc.payments || [],
      status: acc.status || "open",
      estimate_number: acc.estimate_number || "",
    });
    // Populate searchable selections
    if (acc.matricule_id) {
      const mat = matricules.find(m => m.id === acc.matricule_id);
      if (mat) {
        setSelectedMatriculeObj(mat);
        const car = cars.find(c => c.id === mat.car_id);
        setMatriculeSearchTerm(`${mat.matricule_code} - ${car ? `${car.brand} ${car.model}` : 'N/A'}`);
      }
    }
    if (acc.client_id) {
      const client = clients.find(c => c.id === acc.client_id);
      if (client) {
        setSelectedClientObj(client);
        setClientSearchTerm(`${client.prenom} ${client.nom} - ${client.telephone}`);
      }
    }
    if (acc.reservation_id) {
      const res = reservations.find(r => r.id === acc.reservation_id);
      if (res) {
        setSelectedReservationObj(res);
        const client = clients.find(c => c.id === res.client_id);
        setReservationSearchTerm(
          `#${res.id} - ${new Date(res.start_date).toLocaleDateString("fr-FR")} → ${new Date(res.end_date).toLocaleDateString("fr-FR")} - Client: ${client ? `${client.prenom} ${client.nom}` : 'N/A'}`
        );
      }
    }
    if (acc.garage_id) {
      const garage = garages.find(g => g.id === acc.garage_id);
      if (garage) {
        setSelectedGarageObj(garage);
        setGarageSearchTerm(`${garage.name} - ${garage.address || garage.phone || ''}`);
      }
    }
    setShowAccidentForm(true);
    setActiveStep(0);
  };

  const handleViewDetails = (accident) => {
    setSelectedAccident(accident);
    setShowAccidentDetails(true);
  };

  const handleAddNew = () => {
    setEditing(null);
    resetForm();
    setShowAccidentForm(true);
  };

  const handleDeleteClick = (accident) => {
    setAccidentToDelete(accident);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!accidentToDelete) return;
    const result = await dispatch(deleteAccident(accidentToDelete.id));
    if (result.error) toast.error(result.payload);
    else {
      toast.success("Accident supprimé");
    }
    setDeleteModalOpen(false);
    setAccidentToDelete(null);
  };

  const refreshData = async () => {
    await Promise.all([
      dispatch(fetchAccidents(true)),
      dispatch(fetchMatricules(true)),
      dispatch(fetchCars(true)),
      dispatch(fetchClients(true)),
      dispatch(fetchGarages(true)),
      dispatch(fetchReservations(true))
    ]);
    toast.success("Données actualisées");
  };

  // Document preview and download functions (unchanged)
  const openDocumentPreview = (type, accident) => {
    setDocumentPreviewType(type);
    setDocumentPreviewAccident(accident);
    setShowDocumentPreview(true);
  };

  const closeDocumentPreview = () => {
    setShowDocumentPreview(false);
    setDocumentPreviewType(null);
    setDocumentPreviewAccident(null);
  };

  const downloadDocument = async (accidentId, type) => {
    const accident = accidents.find(a => a.id === accidentId);
    if (!accident) {
      toast.error('Données de l\'accident introuvables');
      return;
    }
    let PdfComponent;
    let fileName;
    switch (type) {
      case 'report':
        PdfComponent = AccidentReportPDF;
        fileName = `Rapport_Accident_${accident.accident_number || accident.id}.pdf`;
        break;
      case 'estimate':
        PdfComponent = AccidentEstimatePDF;
        fileName = `Devis_${accident.estimate_number || accident.accident_number || accident.id}.pdf`;
        break;
      case 'invoice':
        PdfComponent = AccidentInvoicePDF;
        fileName = `Facture_${accident.invoice_number || accident.accident_number || accident.id}.pdf`;
        break;
      default:
        toast.error('Type de document invalide');
        return;
    }
    try {
      const blob = await pdf(<PdfComponent accident={accident} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Document téléchargé');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  // Payment Modal Handlers
  const openPaymentModal = () => {
    setPaymentForm({ amount: '', payer: 'client', method: 'cash', reference: '', notes: '' });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = () => {
    const amount = parseFloat(paymentForm.amount);
    if (!paymentForm.amount || isNaN(amount) || amount <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }
    if (!paymentForm.payer) {
      toast.error('Veuillez sélectionner un payeur');
      return;
    }
    if (!paymentForm.method) {
      toast.error('Veuillez sélectionner une méthode de paiement');
      return;
    }
    const newPayment = {
      amount: amount,
      payer: paymentForm.payer,
      date: new Date().toISOString().slice(0, 10),
      method: paymentForm.method,
      reference: paymentForm.reference || "",
      notes: paymentForm.notes || "",
    };
    const updatedPayments = [...(formData.payments || []), newPayment];
    let clientTotal = 0, insuranceTotal = 0;
    updatedPayments.forEach(p => {
      if (p.payer === 'client') clientTotal += p.amount;
      else if (p.payer === 'insurance') insuranceTotal += p.amount;
    });
    setFormData({
      ...formData,
      payments: updatedPayments,
      client_paid: clientTotal,
      insurance_paid: insuranceTotal,
      total_paid: clientTotal + insuranceTotal,
      remaining_amount: (formData.total_repair_cost || 0) - (clientTotal + insuranceTotal)
    });
    toast.success("Paiement ajouté");
    setShowPaymentModal(false);
  };

  const openCloseModal = () => setShowCloseModal(true);
  const handleCloseConfirm = async () => {
    if (editing) {
      const result = await dispatch(updateAccident({
        id: editing.id,
        data: { ...formData, status: 'closed', closed_at: new Date().toISOString() }
      }));
      if (result.error) toast.error(result.payload);
      else {
        toast.success("Accident clôturé");
        dispatch(fetchAccidents(true));
        setShowAccidentForm(false);
        setEditing(null);
        resetForm();
      }
    }
    setShowCloseModal(false);
  };

  // Searchable select handlers (unchanged)
  const handleMatriculeSearch = (term) => {
    setMatriculeSearchTerm(term);
    if (term.trim() === '') { setFilteredMatriculesList([]); return; }
    const lower = term.toLowerCase().trim();
    const filtered = matricules.filter(m => {
      if (m.status === 'sold') return false;
      const car = cars.find(c => c.id === m.car_id);
      const carStr = car ? `${car.brand} ${car.model}`.toLowerCase() : '';
      return m.matricule_code.toLowerCase().includes(lower) || carStr.includes(lower);
    });
    setFilteredMatriculesList(filtered.slice(0, 10));
  };

  const handleMatriculeSelect = (mat) => {
    setSelectedMatriculeObj(mat);
    const car = cars.find(c => c.id === mat.car_id);
    setMatriculeSearchTerm(`${mat.matricule_code} - ${car ? `${car.brand} ${car.model}` : 'N/A'}`);
    setFormData(prev => ({ ...prev, matricule_id: mat.id, car_id: mat.car_id || '' }));
    setFilteredMatriculesList([]);
    setSelectedReservationObj(null);
    setReservationSearchTerm('');
    setFormData(prev => ({ ...prev, reservation_id: '' }));
  };

  const clearMatriculeSelection = () => {
    setSelectedMatriculeObj(null);
    setMatriculeSearchTerm('');
    setFilteredMatriculesList([]);
    setFormData(prev => ({ ...prev, matricule_id: '', car_id: '' }));
    setSelectedReservationObj(null);
    setReservationSearchTerm('');
    setFormData(prev => ({ ...prev, reservation_id: '' }));
  };

  const handleClientSearch = (term) => {
    setClientSearchTerm(term);
    if (term.trim() === '') { setFilteredClientsList([]); return; }
    const lower = term.toLowerCase().trim();
    const filtered = clients.filter(c =>
      `${c.prenom} ${c.nom} ${c.telephone} ${c.email}`.toLowerCase().includes(lower)
    );
    setFilteredClientsList(filtered.slice(0, 10));
  };

  const handleClientSelect = (client) => {
    setSelectedClientObj(client);
    setClientSearchTerm(`${client.prenom} ${client.nom} - ${client.telephone}`);
    setFormData(prev => ({ ...prev, client_id: client.id }));
    setFilteredClientsList([]);
  };

  const clearClientSelection = () => {
    setSelectedClientObj(null);
    setClientSearchTerm('');
    setFilteredClientsList([]);
    setFormData(prev => ({ ...prev, client_id: '' }));
  };

  const handleReservationSearch = (term) => {
    setReservationSearchTerm(term);
  };

  const handleReservationSelect = (res) => {
    setSelectedReservationObj(res);
    const client = clients.find(c => c.id === res.client_id);
    const mat = matricules.find(m => m.id === res.matricule_id);
    const car = mat ? cars.find(c => c.id === mat.car_id) : null;
    setReservationSearchTerm(
      `#${res.id} - ${new Date(res.start_date).toLocaleDateString("fr-FR")} → ${new Date(res.end_date).toLocaleDateString("fr-FR")} - Client: ${client ? `${client.prenom} ${client.nom}` : 'N/A'}`
    );
    setFormData(prev => ({
      ...prev,
      reservation_id: res.id,
      client_id: res.client_id,
      matricule_id: mat ? mat.id : '',
      car_id: car ? car.id : '',
    }));
    if (client) {
      setSelectedClientObj(client);
      setClientSearchTerm(`${client.prenom} ${client.nom} - ${client.telephone}`);
    }
    if (mat) {
      setSelectedMatriculeObj(mat);
      setMatriculeSearchTerm(`${mat.matricule_code} - ${car ? `${car.brand} ${car.model}` : 'N/A'}`);
    } else {
      setSelectedMatriculeObj(null);
      setMatriculeSearchTerm('');
    }
  };

  const clearReservationSelection = () => {
    setSelectedReservationObj(null);
    setReservationSearchTerm('');
    setFormData(prev => ({ ...prev, reservation_id: '' }));
  };

  const handleGarageSearch = (term) => {
    setGarageSearchTerm(term);
    if (term.trim() === '') { setFilteredGaragesList([]); return; }
    const lower = term.toLowerCase().trim();
    const filtered = garages.filter(g =>
      `${g.name} ${g.address} ${g.phone}`.toLowerCase().includes(lower)
    );
    setFilteredGaragesList(filtered.slice(0, 10));
  };

  const handleGarageSelect = (garage) => {
    setSelectedGarageObj(garage);
    setGarageSearchTerm(`${garage.name} - ${garage.address || garage.phone || ''}`);
    setFormData(prev => ({ ...prev, garage_id: garage.id }));
    setFilteredGaragesList([]);
  };

  const clearGarageSelection = () => {
    setSelectedGarageObj(null);
    setGarageSearchTerm('');
    setFilteredGaragesList([]);
    setFormData(prev => ({ ...prev, garage_id: '' }));
  };

  // ==================== STEP RENDERERS (unchanged logic, only style classes updated) ====================
  // They now use inline-grid-2, inline-field, inline-input, etc. with green theme.
  // We'll keep the same structure but rely on the global CSS classes (already defined in style block)
  // Note: We must ensure the style block includes all necessary classes.
  // For brevity, we'll keep the step renderers as they are (they already use the inline-* classes)
  // We'll just need to update the CSS to use green instead of gold.

  // The render functions are long; we'll include them in the JSX below.

  // Stats
  const getStats = () => ({
    total: accidents.length,
    open: accidents.filter(a => a.status === 'open' || a.status === 'under_review' || a.status === 'waiting_estimate').length,
    under_repair: accidents.filter(a => a.status === 'under_repair').length,
    closed: accidents.filter(a => a.status === 'closed').length
  });
  const stats = getStats();

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("fr-FR");
    } catch { return dateString; }
  };

  if (loading) return (
    <div className="loading"><div className="spinner"></div><p>Chargement des accidents...</p></div>
  );

  // We'll render everything inside a single container with the green SMAITI style.
  return (
    <div className="admin-smaiti-page">
      <style>{`
        /* ----- RESET & BASE (matching SMAITI green style) ----- */
        .admin-smaiti-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #f7f9fc;
          color: #1a202c;
          min-height: 100vh;
          padding: 20px 40px;
        }

        /* TOPBAR */
        .smaiti-topbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0 20px 0; border-bottom: 1px solid #e2e8f0;
        }
        .smaiti-logo-area { display: flex; align-items: baseline; gap: 16px; }
        .smaiti-brand { font-family: 'Georgia', serif; color: #b6926e; font-size: 1.5rem; font-weight: 600; letter-spacing: 1px; }
        .smaiti-flotte { font-size: 1.8rem; font-weight: 700; color: #0f172a; }
        .smaiti-right-actions { display: flex; align-items: center; gap: 16px; }
        .smaiti-notif-btn {
          background: white; border: 1px solid #e2e8f0; border-radius: 50%;
          width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s; color: #1e293b;
        }
        .smaiti-notif-btn:hover { background: #f1f5f9; }

        /* STATS GRID */
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

        /* ACTION BAR */
        .smaiti-actions-wrapper {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0 16px 0;
        }
        .smaiti-count { font-size: 0.875rem; color: #475569; }
        .smaiti-actions-buttons { display: flex; gap: 12px; flex-wrap: wrap; }

        .btn { display: inline-flex; align-items: center; gap: 0.5rem; height: 2.5rem; padding: 0 1rem; border-radius: 9999px; border: none; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.2s; }
        .btn-secondary { background: white; border: 1px solid #e2e8f0; color: #0f172a; }
        .btn-secondary:hover { background: #f8fafc; }
        .btn-primary { background: #0d4734; color: white; }
        .btn-primary:hover { background: #0a3a2a; transform: translateY(-1px); }

        /* SEARCH */
        .search-wrapper {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 1rem; padding: 1rem;
          margin-bottom: 1.5rem;
        }
        .search-row {
          display: flex; flex-wrap: wrap; gap: 1rem;
        }
        .search-container {
          flex: 1; position: relative;
        }
        .search-icon {
          position: absolute; left: 0.75rem; top: 50%;
          transform: translateY(-50%); color: #64748b;
        }
        .search-input {
          width: 100%; padding: 0.5rem 1rem 0.5rem 2.5rem;
          border: 1px solid #e2e8f0; border-radius: 0.5rem;
          font-size: 0.875rem; transition: all 0.2s;
          background: white;
        }
        .search-input:focus {
          outline: none; border-color: #0d4734;
          box-shadow: 0 0 0 2px rgba(13, 71, 52, 0.1);
        }
        .filter-select {
          width: 12rem; padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0; border-radius: 0.5rem;
          font-size: 0.875rem; background: white; cursor: pointer;
        }

        /* FILTER INDICATOR */
        .filter-indicator {
          display: flex; align-items: center; justify-content: space-between;
          background: #fef3c7; border: 1px solid #f59e0b;
          border-radius: 0.75rem; padding: 0.75rem 1rem;
          margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;
        }
        .filter-indicator-text {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.875rem; font-weight: 500; color: #92400e;
        }
        .clear-filter-btn {
          display: inline-flex; align-items: center; gap: 0.25rem;
          background: none; border: 1px solid #92400e; padding: 0.25rem 0.75rem;
          border-radius: 2rem; font-size: 0.75rem; font-weight: 500;
          color: #92400e; cursor: pointer; transition: all 0.2s;
        }
        .clear-filter-btn:hover { background: #92400e; color: white; }

        /* TABLE */
        .smaiti-table-container {
          background: white; border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow-x: auto; -webkit-overflow-scrolling: touch;
        }
        .smaiti-table {
          width: 100%; border-collapse: collapse; font-size: 0.875rem;
          min-width: 800px;
        }
        .smaiti-table thead { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .smaiti-table th {
          text-align: left; padding: 12px 14px;
          color: #64748b; font-weight: 600; font-size: 0.7rem; text-transform: uppercase;
          white-space: nowrap;
        }
        .smaiti-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: 0.2s; }
        .smaiti-table tbody tr:last-child { border-bottom: none; }
        .smaiti-table tbody tr:hover { background: #f8fafc; }
        .smaiti-table td { padding: 10px 14px; vertical-align: middle; white-space: nowrap; }

        .sortable-header { cursor: pointer; user-select: none; }
        .sort-icon { opacity: 0.5; vertical-align: middle; margin-left: 4px; }
        .sort-icon.active { opacity: 1; color: #0d4734; }

        /* BADGES */
        .badge {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.625rem; border-radius: 9999px;
          font-size: 0.7rem; font-weight: 500;
        }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-purple { background: #f3e8ff; color: #6b21a5; }
        .badge-pink { background: #fce7f3; color: #9d174d; }
        .badge-indigo { background: #e0e7ff; color: #3730a3; }
        .badge-orange { background: #ffedd5; color: #9a3412; }
        .badge-rose { background: #ffe4e6; color: #9f1239; }
        .badge-yellow { background: #fef3c7; color: #92400e; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-secondary { background: #f1f5f9; color: #475569; }

        /* ACTION BUTTONS */
        .action-icons { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
        .action-btn {
          width: 32px; height: 32px; border-radius: 50%;
          border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s; background: transparent;
        }
        .action-btn.view { background: #dbeafe; color: #3b82f6; }
        .action-btn.edit { background: #dcfce7; color: #16a34a; }
        .action-btn.delete { background: #fee2e2; color: #ef4444; }
        .action-btn.print { background: #f3e8ff; color: #8b5cf6; }
        .action-btn.info { background: #ecfeff; color: #06b6d4; }
        .action-btn.primary { background: #fef3c7; color: #d97706; }
        .action-btn:hover { transform: scale(1.05); }
        .action-btn svg { width: 16px; height: 16px; }

        /* INLINE FORM (green theme) */
        .inline-form-container {
          background: white; border-radius: 24px; margin: 0;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1);
          overflow: hidden; border: 1px solid #e2e8f0;
        }
        .inline-form-header {
          background: #f8fafc; padding: 24px 32px;
          display: flex; align-items: center; gap: 20px;
          position: relative; border-bottom: 2px solid #0d4734;
        }
        .inline-form-icon {
          width: 48px; height: 48px; background: #0d4734;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
        }
        .inline-form-title h2 { color: #0f172a; font-size: 1.5rem; font-weight: 700; margin: 0; }
        .inline-form-title p { color: #64748b; font-size: 0.875rem; margin: 4px 0 0 0; }
        .inline-form-close {
          position: absolute; top: 20px; right: 24px;
          background: white; border: 1px solid #e2e8f0; border-radius: 40px;
          width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #64748b; transition: all 0.2s;
        }
        .inline-form-close:hover { background: #f1f5f9; color: #0f172a; }

        .steps-progress {
          display: flex; justify-content: space-between;
          padding: 1.5rem 2rem; background: #f8fafc;
          border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 0.5rem;
        }
        .step-indicator {
          display: flex; flex-direction: column; align-items: center;
          cursor: pointer; flex: 1; position: relative; min-width: 60px;
        }
        .step-indicator:not(:last-child)::after {
          content: ''; position: absolute; top: 15px; left: 50%;
          width: 100%; height: 2px; background: #e2e8f0; z-index: 0;
        }
        .step-indicator.completed:not(:last-child)::after { background: #0d4734; }
        .step-number {
          width: 30px; height: 30px; border-radius: 50%;
          background: #e2e8f0; display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 0.8rem; margin-bottom: 4px;
          transition: 0.2s; z-index: 1; position: relative;
        }
        .step-indicator.active .step-number { background: #0d4734; color: white; transform: scale(1.1); }
        .step-indicator.completed .step-number { background: #0d4734; color: white; }
        .step-label {
          font-size: 0.65rem; color: #64748b; text-align: center; white-space: nowrap;
        }
        .step-indicator.active .step-label { color: #0f172a; font-weight: 600; }

        .inline-form { padding: 28px 32px; }
        .inline-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .inline-form-col { display: flex; flex-direction: column; gap: 24px; }
        .inline-section {
          background: white; border-radius: 16px; padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .inline-section-header {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 20px; padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .inline-section-header .section-icon { color: #0d4734; }
        .inline-section-header h3 { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0; }
        .inline-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .inline-field { display: flex; flex-direction: column; gap: 6px; }
        .inline-field label { font-size: 0.7rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        .inline-input, .inline-select, .inline-textarea {
          padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 12px;
          font-size: 0.875rem; transition: all 0.2s; background: white; font-family: inherit; color: #0f172a;
        }
        .inline-input:focus, .inline-select:focus, .inline-textarea:focus {
          outline: none; border-color: #0d4734; box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.1);
        }
        .inline-textarea { resize: vertical; min-height: 80px; }
        .inline-info-message {
          background: #f0fdf4; border: 1px solid #86efac;
          border-radius: 12px; padding: 12px 16px;
          display: flex; align-items: center; gap: 10px;
          font-size: 0.75rem; color: #166534; margin-top: 16px;
        }
        .inline-secondary-btn {
          background: white; border: 1.5px solid #e2e8f0;
          padding: 10px 24px; border-radius: 40px; font-size: 0.875rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 8px; color: #0f172a;
        }
        .inline-secondary-btn:hover { border-color: #0d4734; color: #0d4734; background: #f8fafc; }
        .inline-primary-btn {
          background: #0d4734; border: none; padding: 12px 28px;
          border-radius: 40px; font-size: 0.875rem; font-weight: 600;
          color: white; cursor: pointer; transition: all 0.2s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .inline-primary-btn:hover { background: #0a3a2a; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(13, 71, 52, 0.3); }
        .inline-primary-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .inline-form-footer {
          display: flex; justify-content: flex-end; gap: 16px;
          padding-top: 24px; border-top: 1px solid #e2e8f0; margin-top: 24px;
          flex-wrap: wrap;
        }

        /* Searchable selects */
        .inline-search-section {
          background: white; border-radius: 16px; padding: 12px;
          border: 1px solid #e2e8f0;
        }
        .inline-search-input-wrapper {
          position: relative;
        }
        .inline-search-input-wrapper svg {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #94a3b8;
        }
        .inline-search-input-wrapper .inline-input {
          padding-left: 42px; padding-right: 42px; width: 100%;
        }
        .clear-search-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px;
        }
        .clear-search-btn:hover { color: #ef4444; }
        .inline-results {
          max-height: 250px; overflow-y: auto; margin-top: 8px;
          border-radius: 12px; border: 1px solid #e2e8f0; background: white;
        }
        .inline-result-item {
          display: flex; align-items: center; gap: 12px; padding: 10px 14px;
          cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.2s;
        }
        .inline-result-item:hover { background: #f0fdf4; }
        .inline-result-avatar {
          width: 36px; height: 36px; background: #0d4734; border-radius: 36px;
          display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;
        }
        .inline-result-info { flex: 1; }
        .inline-result-info strong { display: block; margin-bottom: 4px; font-size: 0.875rem; }
        .inline-result-details { display: flex; gap: 12px; font-size: 0.7rem; color: #64748b; flex-wrap: wrap; }
        .inline-selected {
          background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px;
          padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin-top: 12px;
        }
        .inline-selected svg { color: #0d4734; flex-shrink: 0; }
        .inline-selected strong { display: block; font-size: 0.7rem; color: #166534; }
        .inline-selected p { font-size: 0.8rem; font-weight: 500; margin: 0; }
        .inline-no-results { padding: 0.75rem; color: #64748b; font-size: 0.875rem; text-align: center; }
        .field-hint.warning { font-size: 0.7rem; color: #dc2626; margin-top: 0.25rem; }

        /* DETAILS VIEW */
        .inline-details-container {
          background: white; border-radius: 24px; margin: 0;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1);
          overflow: hidden; border: 1px solid #e2e8f0;
        }
        .inline-details-header {
          background: #f8fafc; padding: 24px 32px;
          display: flex; align-items: center; gap: 20px;
          position: relative; border-bottom: 2px solid #0d4734;
        }
        .inline-details-icon {
          width: 48px; height: 48px; background: #0d4734;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
        }
        .inline-details-title h2 { color: #0f172a; font-size: 1.5rem; font-weight: 700; margin: 0; }
        .inline-details-title p { color: #64748b; font-size: 0.875rem; margin: 4px 0 0 0; }
        .inline-details-close {
          position: absolute; top: 20px; right: 24px;
          background: white; border: 1px solid #e2e8f0; border-radius: 40px;
          width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #64748b; transition: all 0.2s;
        }
        .inline-details-close:hover { background: #f1f5f9; color: #0f172a; }
        .inline-details-content { padding: 28px 32px; }
        .inline-details-footer {
          display: flex; justify-content: flex-end; gap: 16px;
          padding: 20px 32px; border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .btn-secondary-full {
          background: white; border: 1.5px solid #e2e8f0;
          padding: 10px 24px; border-radius: 40px; font-size: 0.875rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .btn-secondary-full:hover { border-color: #0d4734; color: #0d4734; background: #f8fafc; }

        .details-actions-bar {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
        }
        .back-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 8px 16px; background: #f1f5f9; border: none;
          border-radius: 40px; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .back-btn:hover { background: #e2e8f0; }
        .details-action-buttons {
          display: flex; gap: 0.5rem; flex-wrap: wrap;
        }
        .action-edit-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 8px 16px; background: #0d4734; border: none;
          border-radius: 40px; font-size: 0.875rem; font-weight: 500;
          color: white; cursor: pointer; transition: all 0.2s;
        }
        .action-edit-btn:hover { background: #0a3a2a; }
        .action-delete-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 8px 16px; background: #dc2626; border: none;
          border-radius: 40px; font-size: 0.875rem; font-weight: 500;
          color: white; cursor: pointer; transition: all 0.2s;
        }
        .action-delete-btn:hover { background: #b91c1c; }

        .accident-header-card {
          background: #0d4734; color: white; border-radius: 1rem;
          padding: 1.5rem; margin-bottom: 1.5rem;
        }
        .accident-stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }
        .stat-item-detail {
          background: rgba(255,255,255,0.1); padding: 0.75rem;
          border-radius: 0.75rem; text-align: center;
        }
        .stat-value { font-size: 1.25rem; font-weight: 700; }
        .stat-label-detail { font-size: 0.65rem; opacity: 0.7; margin-top: 0.25rem; }

        .details-sections-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .detail-card {
          border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden;
        }
        .detail-card-title {
          background: #f8fafc; padding: 0.75rem 1rem; font-weight: 600;
          font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-card-content { padding: 1rem; }
        .info-row {
          display: flex; justify-content: space-between; padding: 0.5rem 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 0.75rem; color: #64748b; }
        .info-value { font-size: 0.75rem; font-weight: 500; }
        .matricule-value { font-family: 'Courier New', monospace; font-weight: 600; color: #0d4734; }

        .notes-section {
          border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden;
          margin-top: 1rem;
        }
        .notes-title {
          background: #f8fafc; padding: 0.75rem 1rem; font-weight: 600;
          font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .notes-content { padding: 1rem; font-size: 0.875rem; line-height: 1.5; }

        /* DOCUMENT PREVIEW MODAL */
        .document-preview-modal {
          background: white; border-radius: 24px;
          max-width: 95vw; width: 1000px; max-height: 95vh; height: 90vh;
          display: flex; flex-direction: column; overflow: hidden;
          animation: slideUp 0.3s ease; border: 1px solid #e2e8f0;
        }
        .document-preview-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.5rem 2rem; border-bottom: 2px solid #0d4734;
          background: #f8fafc; flex-shrink: 0;
        }
        .document-preview-title {
          display: flex; align-items: center; gap: 0.75rem;
        }
        .document-preview-title h2 {
          font-size: 1.25rem; font-weight: 600; margin: 0; color: #0f172a;
        }
        .document-preview-actions {
          display: flex; gap: 0.75rem; align-items: center;
        }
        .document-preview-download {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1.25rem; background: #0d4734; color: white;
          border: none; border-radius: 40px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .document-preview-download:hover { background: #0a3a2a; transform: translateY(-1px); }
        .document-preview-close {
          background: #e2e8f0; border: none; border-radius: 40px;
          width: 40px; height: 40px; display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .document-preview-close:hover { background: #cbd5e1; }
        .document-preview-body {
          flex: 1; padding: 1rem; background: #f1f5f9; min-height: 0;
        }

        /* PAYMENT MODAL */
        .payment-modal {
          background: white; border-radius: 24px; max-width: 480px;
          width: 100%; padding: 1.5rem;
          animation: slideUp 0.3s ease; border: 1px solid #e2e8f0;
        }
        .payment-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.5rem; border-bottom: 2px solid #0d4734;
          padding-bottom: 0.75rem;
        }
        .payment-modal-header h3 {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 1.25rem; font-weight: 600; color: #0f172a;
        }
        .payment-modal-close {
          background: none; border: none; cursor: pointer;
          color: #64748b; padding: 4px; border-radius: 0.5rem;
          transition: 0.2s;
        }
        .payment-modal-close:hover { color: #0f172a; background: #f1f5f9; }
        .payment-form-group { margin-bottom: 1rem; }
        .payment-form-group label {
          display: block; font-size: 0.75rem; font-weight: 600;
          color: #475569; margin-bottom: 0.25rem;
        }
        .payment-input, .payment-select, .payment-textarea {
          width: 100%; padding: 8px 12px;
          border: 1px solid #e2e8f0; border-radius: 8px;
          font-size: 0.875rem; transition: border-color 0.2s;
          background: white;
        }
        .payment-input:focus, .payment-select:focus, .payment-textarea:focus {
          outline: none; border-color: #0d4734;
          box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.1);
        }
        .payment-radio-group {
          display: flex; gap: 1rem;
        }
        .payment-radio-label {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.875rem; cursor: pointer;
        }
        .payment-modal-footer {
          display: flex; justify-content: flex-end; gap: 0.75rem;
          margin-top: 1.5rem; padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        /* DELETE MODAL */
        .delete-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px); display: flex; align-items: center;
          justify-content: center; z-index: 1001;
        }
        .delete-modal-card {
          background: white; border-radius: 20px; padding: 32px;
          max-width: 400px; width: 100%; text-align: center;
        }
        .delete-icon-box {
          width: 48px; height: 48px; background: #fee2e2; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px; color: #dc2626;
        }
        .delete-modal-card h3 {
          font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;
        }
        .delete-modal-card p {
          color: #64748b; font-size: 0.875rem; margin-bottom: 24px;
        }
        .delete-actions { display: flex; gap: 12px; }
        .modal-btn-cancel {
          flex: 1; background: #f1f5f9; border: none; padding: 10px;
          border-radius: 40px; cursor: pointer; font-weight: 500;
        }
        .modal-btn-delete {
          flex: 1; background: #dc2626; color: white; border: none;
          padding: 10px; border-radius: 40px; cursor: pointer; font-weight: 500;
        }

        .loading { text-align: center; padding: 3rem; }
        .spinner { display: inline-block; width: 2rem; height: 2rem; border-radius: 50%; border: 2px solid #e2e8f0; border-top-color: #0f172a; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .flex { display: flex; } .items-center { align-items: center; } .gap-1 { gap: 0.25rem; }
        .text-right { text-align: right; } .font-medium { font-weight: 500; }
        .text-center { text-align: center; } .py-12 { padding: 3rem 0; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .inline-form-grid { grid-template-columns: 1fr; gap: 24px; }
          .smaiti-table th, .smaiti-table td { padding: 8px 10px; font-size: 0.8rem; }
        }
        @media (max-width: 768px) {
          .admin-smaiti-page { padding: 16px; }
          .smaiti-topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
          .smaiti-right-actions { width: 100%; justify-content: flex-start; }
          .smaiti-actions-wrapper { flex-direction: column; align-items: flex-start; gap: 12px; }
          .smaiti-actions-buttons { width: 100%; justify-content: flex-end; flex-wrap: wrap; }
          .smaiti-table-container { overflow-x: auto; }
          .smaiti-table { min-width: 700px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .inline-form-container, .inline-details-container { margin: 0; }
          .inline-form-header, .inline-details-header { padding: 16px 20px; }
          .inline-form-title h2, .inline-details-title h2 { font-size: 1.25rem; }
          .inline-form, .inline-details-content { padding: 20px; }
          .inline-grid-2 { grid-template-columns: 1fr; }
          .search-row { flex-direction: column; }
          .filter-select { width: 100%; }
          .details-sections-grid { grid-template-columns: 1fr; }
          .accident-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .details-actions-bar { flex-direction: column; align-items: stretch; }
          .details-action-buttons { justify-content: center; }
          .steps-progress { overflow-x: auto; padding: 1rem; gap: 0.5rem; flex-wrap: nowrap; }
          .step-label { font-size: 0.55rem; }
          .document-preview-modal { max-width: 100vw; max-height: 100vh; height: 100vh; border-radius: 0; }
          .document-preview-header { padding: 1rem; flex-wrap: wrap; }
          .document-preview-title h2 { font-size: 1rem; }
          .document-preview-body { padding: 0.5rem; }
          .payment-modal { max-width: 95vw; margin: 1rem; }
        }

        /* DARK MODE */
        @media (prefers-color-scheme: dark) {
          .admin-smaiti-page { background: #0f172a; color: #f1f5f9; }
          .smaiti-flotte { color: #f1f5f9; }
          .smaiti-notif-btn { background: #1e293b; border-color: #334155; color: #e2e8f0; }
          .smaiti-notif-btn:hover { background: #334155; }
          .stat-card, .smaiti-table-container, .search-wrapper, .inline-form-container,
          .inline-details-container, .delete-modal-card, .document-preview-modal,
          .payment-modal {
            background: #1e293b; border-color: #334155;
          }
          .stat-label, .smaiti-count, .inline-form-title p,
          .inline-details-title p, .info-label, .delete-modal-card p,
          .step-label, .document-preview-title h2 { color: #94a3b8; }
          .stat-number { color: #f1f5f9; }
          .inline-form-header, .inline-details-header {
            background: #0f172a; border-bottom-color: #0d4734;
          }
          .inline-form-header h2, .inline-details-title h2 { color: #f1f5f9; }
          .inline-section { background: #1e293b; border-color: #334155; }
          .inline-section-header h3 { color: #f1f5f9; }
          .inline-section-header .section-icon { color: #0d4734; }
          .inline-field label { color: #94a3b8; }
          .inline-input, .inline-select, .inline-textarea, .search-input,
          .filter-select, .payment-input, .payment-select, .payment-textarea {
            background: #0f172a; border-color: #334155; color: #f1f5f9;
          }
          .inline-input:focus, .inline-select:focus, .inline-textarea:focus,
          .search-input:focus, .payment-input:focus, .payment-select:focus,
          .payment-textarea:focus {
            border-color: #0d4734; box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.3);
          }
          .inline-info-message {
            background: #0f172a; border-color: #0d4734; color: #86efac;
          }
          .inline-secondary-btn {
            background: #1e293b; border-color: #475569; color: #e2e8f0;
          }
          .inline-secondary-btn:hover { border-color: #0d4734; color: #0d4734; background: #334155; }
          .inline-primary-btn { background: #0d4734; color: white; }
          .inline-primary-btn:hover { background: #0a3a2a; }
          .btn-secondary { background: #334155; color: #e2e8f0; border-color: #475569; }
          .btn-secondary:hover { background: #475569; }
          .btn-primary { background: #0d4734; color: white; }
          .btn-primary:hover { background: #0a3a2a; }
          .badge-warning { background: #78350f; color: #fde68a; }
          .badge-purple { background: #4c1d95; color: #c084fc; }
          .badge-pink { background: #831843; color: #f9a8d4; }
          .badge-indigo { background: #312e81; color: #a5b4fc; }
          .badge-orange { background: #7c2d12; color: #fdba74; }
          .badge-rose { background: #9f1239; color: #fda4af; }
          .badge-success { background: #14532d; color: #4ade80; }
          .badge-secondary { background: #334155; color: #cbd5e1; }
          .action-btn.view { background: #1e3a5f; color: #60a5fa; }
          .action-btn.edit { background: #14532d; color: #4ade80; }
          .action-btn.delete { background: #7f1d1d; color: #fca5a5; }
          .action-btn.print { background: #4c1d95; color: #c084fc; }
          .action-btn.info { background: #164e63; color: #67e8f9; }
          .action-btn.primary { background: #78350f; color: #fde68a; }
          .smaiti-table thead { background: #0f172a; }
          .smaiti-table th { color: #94a3b8; }
          .smaiti-table tbody tr:hover { background: #334155; }
          .smaiti-table td { color: #e2e8f0; }
          .steps-progress { background: #0f172a; }
          .step-indicator:not(:last-child)::after { background: #334155; }
          .step-indicator.completed:not(:last-child)::after { background: #0d4734; }
          .step-number { background: #334155; color: #94a3b8; }
          .step-indicator.active .step-number { background: #0d4734; color: white; }
          .step-indicator.completed .step-number { background: #0d4734; color: white; }
          .step-indicator.active .step-label { color: #f1f5f9; }
          .detail-card { border-color: #334155; }
          .detail-card-title { background: #0f172a; }
          .info-row { border-bottom-color: #334155; }
          .notes-section { border-color: #334155; }
          .notes-title { background: #0f172a; }
          .back-btn { background: #334155; color: #e2e8f0; }
          .back-btn:hover { background: #475569; }
          .action-edit-btn { background: #0d4734; color: white; }
          .action-edit-btn:hover { background: #0a3a2a; }
          .action-delete-btn { background: #dc2626; color: white; }
          .action-delete-btn:hover { background: #b91c1c; }
          .btn-secondary-full {
            background: #1e293b; border-color: #475569; color: #e2e8f0;
          }
          .btn-secondary-full:hover { border-color: #0d4734; color: #0d4734; background: #334155; }
          .document-preview-header {
            background: #0f172a; border-bottom-color: #0d4734;
          }
          .document-preview-close { background: #334155; color: #e2e8f0; }
          .document-preview-close:hover { background: #475569; }
          .document-preview-download { background: #0d4734; color: white; }
          .document-preview-download:hover { background: #0a3a2a; }
          .document-preview-body { background: #0f172a; }
          .filter-indicator { background: #78350f; border-color: #f59e0b; }
          .filter-indicator-text { color: #fde68a; }
          .clear-filter-btn { border-color: #fde68a; color: #fde68a; }
          .clear-filter-btn:hover { background: #fde68a; color: #0f172a; }
          .payment-modal-header { border-bottom-color: #0d4734; }
          .payment-modal-header h3 { color: #f1f5f9; }
          .payment-form-group label { color: #94a3b8; }
          .payment-modal-footer { border-top-color: #334155; }
          .modal-btn-cancel { background: #334155; color: #e2e8f0; border: none; }
          .modal-btn-cancel:hover { background: #475569; }
          .modal-btn-delete { background: #dc2626; color: white; }
          .modal-btn-delete:hover { background: #b91c1c; }
          .inline-search-section { background: #0f172a; border-color: #334155; }
          .inline-results { background: #0f172a; border-color: #334155; }
          .inline-result-item { border-bottom-color: #334155; }
          .inline-result-item:hover { background: #334155; }
          .inline-selected { background: #334155; color: #e2e8f0; }
          .inline-selected strong { color: #4ade80; }
          .inline-selected p { color: #f1f5f9; }
          .inline-no-results { color: #94a3b8; }
          .sortable-header:hover { background: #334155; }
          .accident-header-card { background: #0d4734; }
        }

        html, body { overflow-x: auto !important; min-width: 320px; }
        .admin-smaiti-page, .inline-form-container, .inline-details-container {
          overflow-x: auto !important; min-width: 0; width: 100%;
        }
        .inline-form, .inline-details-content { overflow-x: auto !important; }
        .inline-form-grid { min-width: 600px; }
        @media (max-width: 768px) { .inline-form-grid { min-width: 100%; } }
        .smaiti-table-container { overflow-x: auto; }
        .smaiti-table { min-width: 800px; }
        .document-preview-body { overflow: hidden; }
      `}</style>

      {/* TOPBAR */}
      <div className="smaiti-topbar">
        <div className="smaiti-logo-area">
          <span className="smaiti-brand">SMAITI LUXE</span>
          <span className="smaiti-flotte">Accidents</span>
        </div>
        <div className="smaiti-right-actions">
          <button className="smaiti-notif-btn" onClick={refreshData} title="Actualiser">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div><p className="stat-label">Total</p><p className="stat-number">{stats.total}</p></div>
          <AlertTriangle size={28} className="stat-icon" />
        </div>
        <div className="stat-card">
          <div><p className="stat-label">Ouverts</p><p className="stat-number" style={{ color: '#ca8a04' }}>{stats.open}</p></div>
          <AlertCircle size={28} className="stat-icon" style={{ color: '#ca8a04' }} />
        </div>
        <div className="stat-card">
          <div><p className="stat-label">En réparation</p><p className="stat-number" style={{ color: '#ea580c' }}>{stats.under_repair}</p></div>
          <Wrench size={28} className="stat-icon" style={{ color: '#ea580c' }} />
        </div>
        <div className="stat-card">
          <div><p className="stat-label">Clôturés</p><p className="stat-number" style={{ color: '#16a34a' }}>{stats.closed}</p></div>
          <CheckCircle size={28} className="stat-icon" style={{ color: '#16a34a' }} />
        </div>
      </div>

      {showAccidentForm ? (
        /* ====== INLINE FORM WITH STEPS ====== */
        <div className="inline-form-container">
          <div className="inline-form-header">
            <div className="inline-form-icon">
              {editing ? <Sparkles size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div className="inline-form-title">
              <h2>{editing ? "Modifier l'accident" : "Signaler un accident"}</h2>
              <p>{editing ? "Modifiez les informations" : "Ajoutez un nouvel accident"}</p>
            </div>
            <button onClick={() => { setShowAccidentForm(false); setEditing(null); resetForm(); }} className="inline-form-close">
              <X size={24} />
            </button>
          </div>

          {/* Steps Progress */}
          <div className="steps-progress">
            {["Détails", "Garage", "Devis", "Réparation", "Facture", "Paiements", "Clôture"].map((label, idx) => (
              <div key={idx} className={`step-indicator ${idx === activeStep ? 'active' : ''} ${idx < activeStep ? 'completed' : ''}`} onClick={() => setActiveStep(idx)}>
                <span className="step-number">{idx + 1}</span>
                <span className="step-label">{label}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="inline-form">
            <div className="step-content">
              {/* Step renderers – we'll embed the logic here */}
              {activeStep === 0 && (
                <div className="inline-grid-2">
                  {/* Date, time, location, police report, description */}
                  <div className="inline-field">
                    <label>Date de l'accident *</label>
                    <input type="date" required value={formData.date_accident} onChange={(e) => setFormData({...formData, date_accident: e.target.value})} className="inline-input" />
                  </div>
                  <div className="inline-field">
                    <label>Heure</label>
                    <input type="time" value={formData.time_accident} onChange={(e) => setFormData({...formData, time_accident: e.target.value})} className="inline-input" />
                  </div>
                  <div className="inline-field">
                    <label>Lieu</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="inline-input" placeholder="Ex: Autoroute Casablanca" />
                  </div>
                  <div className="inline-field">
                    <label>Rapport de police (n°)</label>
                    <input type="text" value={formData.police_report_number} onChange={(e) => setFormData({...formData, police_report_number: e.target.value})} className="inline-input" />
                  </div>
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Description</label>
                    <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="inline-textarea" placeholder="Décrivez les circonstances..." />
                  </div>

                  {/* Matricule - searchable */}
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Véhicule (Matricule) *</label>
                    <div className="inline-search-section">
                      <div className="inline-search-input-wrapper">
                        <Search size={18} />
                        <input type="text" className="inline-input" value={matriculeSearchTerm} onChange={(e) => handleMatriculeSearch(e.target.value)} placeholder="Rechercher un matricule..." required />
                        {selectedMatriculeObj && (
                          <button type="button" className="clear-search-btn" onClick={clearMatriculeSelection} title="Effacer"><X size={18} /></button>
                        )}
                      </div>
                      {filteredMatriculesList.length > 0 && (
                        <div className="inline-results">
                          {filteredMatriculesList.map(mat => {
                            const car = cars.find(c => c.id === mat.car_id);
                            return (
                              <div key={mat.id} className="inline-result-item" onClick={() => handleMatriculeSelect(mat)}>
                                <div className="inline-result-avatar"><Car size={20} /></div>
                                <div className="inline-result-info">
                                  <strong>{mat.matricule_code}</strong>
                                  <div className="inline-result-details">
                                    <span>{car ? `${car.brand} ${car.model} (${car.year})` : 'N/A'}</span>
                                    <span>{mat.kilometrage?.toLocaleString()} km</span>
                                    <span className={`badge ${mat.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                                      {mat.status === 'active' ? 'Actif' : 'Inactif'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {selectedMatriculeObj && (
                        <div className="inline-selected">
                          <CheckCircle size={20} />
                          <div>
                            <strong>Matricule sélectionné</strong>
                            <p>{selectedMatriculeObj.matricule_code} - {cars.find(c => c.id === selectedMatriculeObj.car_id)?.brand} {cars.find(c => c.id === selectedMatriculeObj.car_id)?.model}</p>
                          </div>
                        </div>
                      )}
                      {!selectedMatriculeObj && matriculeSearchTerm.trim() !== "" && filteredMatriculesList.length === 0 && (
                        <div className="inline-no-results">Aucun matricule trouvé.</div>
                      )}
                    </div>
                    <input type="hidden" name="matricule_id" value={formData.matricule_id} />
                  </div>

                  {/* Client - searchable */}
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Client *</label>
                    <div className="inline-search-section">
                      <div className="inline-search-input-wrapper">
                        <Search size={18} />
                        <input type="text" className="inline-input" value={clientSearchTerm} onChange={(e) => handleClientSearch(e.target.value)} placeholder="Rechercher un client..." required />
                        {selectedClientObj && (
                          <button type="button" className="clear-search-btn" onClick={clearClientSelection}><X size={18} /></button>
                        )}
                      </div>
                      {filteredClientsList.length > 0 && (
                        <div className="inline-results">
                          {filteredClientsList.map(client => (
                            <div key={client.id} className="inline-result-item" onClick={() => handleClientSelect(client)}>
                              <div className="inline-result-avatar"><User size={20} /></div>
                              <div className="inline-result-info">
                                <strong>{client.prenom} {client.nom}</strong>
                                <div className="inline-result-details">
                                  <span>{client.telephone}</span>
                                  <span>{client.email}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedClientObj && (
                        <div className="inline-selected">
                          <CheckCircle size={20} />
                          <div>
                            <strong>Client sélectionné</strong>
                            <p>{selectedClientObj.prenom} {selectedClientObj.nom} - {selectedClientObj.telephone}</p>
                          </div>
                        </div>
                      )}
                      {!selectedClientObj && clientSearchTerm.trim() !== "" && filteredClientsList.length === 0 && (
                        <div className="inline-no-results">Aucun client trouvé.</div>
                      )}
                    </div>
                    <input type="hidden" name="client_id" value={formData.client_id} />
                  </div>

                  {/* Reservation - searchable */}
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Réservation (optionnel)</label>
                    <div className="inline-search-section">
                      <div className="inline-search-input-wrapper">
                        <Search size={18} />
                        <input type="text" className="inline-input" value={reservationSearchTerm} onChange={(e) => handleReservationSearch(e.target.value)} placeholder="Rechercher une réservation..." />
                        {selectedReservationObj && (
                          <button type="button" className="clear-search-btn" onClick={clearReservationSelection}><X size={18} /></button>
                        )}
                      </div>
                      {filteredReservationsList.length > 0 && (
                        <div className="inline-results">
                          {filteredReservationsList.map(res => {
                            const client = clients.find(c => c.id === res.client_id);
                            return (
                              <div key={res.id} className="inline-result-item" onClick={() => handleReservationSelect(res)}>
                                <div className="inline-result-avatar"><Calendar size={20} /></div>
                                <div className="inline-result-info">
                                  <strong>#{res.id}</strong>
                                  <div className="inline-result-details">
                                    <span>{new Date(res.start_date).toLocaleDateString("fr-FR")} → {new Date(res.end_date).toLocaleDateString("fr-FR")}</span>
                                    <span>Client: {client ? `${client.prenom} ${client.nom}` : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {selectedReservationObj && (
                        <div className="inline-selected">
                          <CheckCircle size={20} />
                          <div>
                            <strong>Réservation sélectionnée</strong>
                            <p>#{selectedReservationObj.id} - {new Date(selectedReservationObj.start_date).toLocaleDateString("fr-FR")} → {new Date(selectedReservationObj.end_date).toLocaleDateString("fr-FR")}</p>
                          </div>
                        </div>
                      )}
                      {!selectedReservationObj && (formData.matricule_id || formData.date_accident || reservationSearchTerm) && filteredReservationsList.length === 0 && (
                        <div className="inline-no-results">
                          {formData.matricule_id && formData.date_accident
                            ? 'Aucune réservation pour ce matricule et cette date.'
                            : 'Aucune réservation trouvée.'}
                        </div>
                      )}
                    </div>
                    <input type="hidden" name="reservation_id" value={formData.reservation_id} />
                  </div>

                  <div className="inline-field">
                    <label>Type d'accident</label>
                    <select value={formData.accident_type} onChange={(e) => setFormData({...formData, accident_type: e.target.value})} className="inline-select">
                      <option value="grave">Grave</option>
                      <option value="non_grave">Non-grave</option>
                    </select>
                  </div>
                  <div className="inline-field">
                    <label>Montant des pertes (DH) *</label>
                    <input type="number" step="0.01" required value={formData.amount_of_losses} onChange={(e) => setFormData({...formData, amount_of_losses: parseFloat(e.target.value) || 0})} className="inline-input" />
                  </div>
                  <div className="inline-field">
                    <label>Montant assurance (DH)</label>
                    <input type="number" step="0.01" value={formData.amount_assurance} onChange={(e) => setFormData({...formData, amount_assurance: parseFloat(e.target.value) || 0})} className="inline-input" />
                  </div>
                  <div className="inline-field">
                    <label>Statut initial</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="inline-select">
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Notes</label>
                    <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="inline-textarea" />
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="inline-grid-2">
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Garage</label>
                    <div className="inline-search-section">
                      <div className="inline-search-input-wrapper">
                        <Search size={18} />
                        <input type="text" className="inline-input" value={garageSearchTerm} onChange={(e) => handleGarageSearch(e.target.value)} placeholder="Rechercher un garage..." />
                        {selectedGarageObj && (
                          <button type="button" className="clear-search-btn" onClick={clearGarageSelection}><X size={18} /></button>
                        )}
                      </div>
                      {filteredGaragesList.length > 0 && (
                        <div className="inline-results">
                          {filteredGaragesList.map(garage => (
                            <div key={garage.id} className="inline-result-item" onClick={() => handleGarageSelect(garage)}>
                              <div className="inline-result-avatar"><Building2 size={20} /></div>
                              <div className="inline-result-info">
                                <strong>{garage.name}</strong>
                                <div className="inline-result-details">
                                  <span>{garage.address || 'N/A'}</span>
                                  <span>{garage.phone}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedGarageObj && (
                        <div className="inline-selected">
                          <CheckCircle size={20} />
                          <div>
                            <strong>Garage sélectionné</strong>
                            <p>{selectedGarageObj.name} - {selectedGarageObj.address || selectedGarageObj.phone}</p>
                          </div>
                        </div>
                      )}
                      {!selectedGarageObj && garageSearchTerm.trim() !== "" && filteredGaragesList.length === 0 && (
                        <div className="inline-no-results">Aucun garage trouvé.</div>
                      )}
                    </div>
                    <input type="hidden" name="garage_id" value={formData.garage_id} />
                  </div>
                  <div className="inline-field">
                    <label>Coût estimé (DH)</label>
                    <input type="number" step="0.01" value={formData.estimated_cost} onChange={(e) => setFormData({...formData, estimated_cost: parseFloat(e.target.value) || 0})} className="inline-input" />
                  </div>
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Notes d'inspection</label>
                    <textarea rows="3" value={formData.inspection_notes} onChange={(e) => setFormData({...formData, inspection_notes: e.target.value})} className="inline-textarea" placeholder="Résultat de l'inspection..." />
                  </div>
                  <div className="inline-field">
                    <label>Expert</label>
                    <input type="text" value={formData.nom_expert} onChange={(e) => setFormData({...formData, nom_expert: e.target.value})} className="inline-input" placeholder="Nom de l'expert" />
                  </div>
                  <div className="inline-field">
                    <label>Décision expert</label>
                    <select value={formData.expert_decision} onChange={(e) => setFormData({...formData, expert_decision: e.target.value})} className="inline-select">
                      <option value="pending">En attente</option>
                      <option value="accepted">Accepté</option>
                      <option value="rejected">Rejeté</option>
                    </select>
                  </div>
                  <div className="inline-field">
                    <label>Montant expert (DH)</label>
                    <input type="number" step="0.01" value={formData.expert_amount} onChange={(e) => setFormData({...formData, expert_amount: parseFloat(e.target.value) || 0})} className="inline-input" />
                  </div>
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Notes expert</label>
                    <textarea rows="2" value={formData.expert_notes} onChange={(e) => setFormData({...formData, expert_notes: e.target.value})} className="inline-textarea" />
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="inline-grid-2">
                  <div className="inline-field">
                    <label>Statut devis</label>
                    <select value={formData.estimate_status} onChange={(e) => setFormData({...formData, estimate_status: e.target.value})} className="inline-select">
                      <option value="draft">Brouillon</option>
                      <option value="sent">Envoyé</option>
                      <option value="approved">Approuvé</option>
                      <option value="rejected">Rejeté</option>
                    </select>
                  </div>
                  <div className="inline-field">
                    <label>Numéro de devis</label>
                    <input type="text" value={formData.estimate_number} onChange={(e) => setFormData({...formData, estimate_number: e.target.value})} className="inline-input" placeholder="DEV-2026-001" />
                  </div>
                  <div className="inline-field">
                    <label>Franchise (DH)</label>
                    <input type="number" step="0.01" value={formData.franchise_amount} onChange={(e) => setFormData({...formData, franchise_amount: parseFloat(e.target.value) || 0})} className="inline-input" />
                  </div>
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Articles du devis</label>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                      {formData.estimate_items.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '10px' }}>Aucun article</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '6px', textAlign: 'left' }}>Nom</th>
                              <th style={{ padding: '6px', textAlign: 'center', width: '80px' }}>Qté</th>
                              <th style={{ padding: '6px', textAlign: 'center', width: '100px' }}>Prix unit.</th>
                              <th style={{ padding: '6px', textAlign: 'center', width: '100px' }}>Total</th>
                              <th style={{ padding: '6px', textAlign: 'center', width: '40px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.estimate_items.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px' }}>
                                  <input type="text" value={item.name || ''} onChange={(e) => updateEstimateItem(idx, 'name', e.target.value)} placeholder="Nom" style={{ width: '100%', padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center' }}>
                                  <input type="number" min="0" step="1" value={item.quantity || 1} onChange={(e) => updateEstimateItem(idx, 'quantity', parseInt(e.target.value) || 1)} style={{ width: '60px', padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center' }}>
                                  <input type="number" min="0" step="0.01" value={item.unit_price || 0} onChange={(e) => updateEstimateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} style={{ width: '80px', padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                                  {(item.quantity || 0) * (item.unit_price || 0)} DH
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center' }}>
                                  <button type="button" onClick={() => removeEstimateItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={16} /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '2px solid #0f172a' }}>
                              <td colSpan="3" style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>Total HT</td>
                              <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{formData.estimate_total_ht} DH</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      )}
                      <button type="button" onClick={addEstimateItem} style={{ marginTop: '8px', padding: '6px 12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Plus size={16} /> Ajouter</button>
                    </div>
                  </div>
                  <div className="inline-field" style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
                    <button type="button" className="inline-secondary-btn" onClick={() => { if (editing) openDocumentPreview('estimate', editing); }}><Printer size={16} /> Aperçu Devis</button>
                    <button type="button" className="inline-primary-btn" onClick={() => { setFormData({...formData, estimate_status: 'approved'}); toast.success("Devis approuvé"); }}><CheckCircle size={16} /> Approuver</button>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="inline-grid-2">
                  <div className="inline-field">
                    <label>Date début réparation</label>
                    <input type="date" value={formData.repair_start_date} onChange={(e) => setFormData({...formData, repair_start_date: e.target.value})} className="inline-input" />
                  </div>
                  <div className="inline-field">
                    <label>Date fin réparation</label>
                    <input type="date" value={formData.repair_end_date} onChange={(e) => setFormData({...formData, repair_end_date: e.target.value})} className="inline-input" />
                  </div>
                  <div className="inline-field">
                    <label>Coût total réparation (DH)</label>
                    <input type="number" step="0.01" value={formData.total_repair_cost} onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, total_repair_cost: val, remaining_amount: val - formData.total_paid });
                    }} className="inline-input" />
                  </div>
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <label>Notes réparation</label>
                    <textarea rows="3" value={formData.repair_notes} onChange={(e) => setFormData({...formData, repair_notes: e.target.value})} className="inline-textarea" placeholder="Suivi des réparations..." />
                  </div>
                  <div className="inline-field" style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
                    <button type="button" className="inline-secondary-btn" onClick={() => { setFormData({...formData, status: 'under_repair'}); toast.success("Statut: En réparation"); }}><Wrench size={16} /> Démarrer</button>
                    <button type="button" className="inline-primary-btn" onClick={() => { setFormData({ ...formData, status: 'invoice_received', repair_end_date: new Date().toISOString().slice(0, 10) }); toast.success("Réparation terminée"); }}><CheckCircle size={16} /> Terminer</button>
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="inline-grid-2">
                  <div className="inline-field">
                    <label>Numéro facture</label>
                    <input type="text" value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} className="inline-input" placeholder="FACT-2026-001" />
                  </div>
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <button type="button" className="inline-secondary-btn" onClick={copyEstimateToInvoice}><Copy size={16} /> Copier le devis</button>
                    </div>
                    <label>Articles de la facture</label>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                      {formData.invoice_items.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '10px' }}>Aucun article</div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '6px', textAlign: 'left' }}>Nom</th>
                              <th style={{ padding: '6px', textAlign: 'center', width: '80px' }}>Qté</th>
                              <th style={{ padding: '6px', textAlign: 'center', width: '100px' }}>Prix unit.</th>
                              <th style={{ padding: '6px', textAlign: 'center', width: '100px' }}>Total</th>
                              <th style={{ padding: '6px', textAlign: 'center', width: '40px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.invoice_items.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '6px' }}>
                                  <input type="text" value={item.name || ''} onChange={(e) => updateInvoiceItem(idx, 'name', e.target.value)} placeholder="Nom" style={{ width: '100%', padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center' }}>
                                  <input type="number" min="0" step="1" value={item.quantity || 1} onChange={(e) => updateInvoiceItem(idx, 'quantity', parseInt(e.target.value) || 1)} style={{ width: '60px', padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center' }}>
                                  <input type="number" min="0" step="0.01" value={item.unit_price || 0} onChange={(e) => updateInvoiceItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} style={{ width: '80px', padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                                  {(item.quantity || 0) * (item.unit_price || 0)} DH
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center' }}>
                                  <button type="button" onClick={() => removeInvoiceItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={16} /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: '2px solid #0f172a' }}>
                              <td colSpan="3" style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>Total HT</td>
                              <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{formData.invoice_total_ht} DH</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      )}
                      <button type="button" onClick={addInvoiceItem} style={{ marginTop: '8px', padding: '6px 12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Plus size={16} /> Ajouter</button>
                    </div>
                  </div>
                  <div className="inline-field" style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
                    <button type="button" className="inline-secondary-btn" onClick={() => { if (editing) openDocumentPreview('invoice', editing); }}><Printer size={16} /> Aperçu Facture</button>
                    <button type="button" className="inline-primary-btn" onClick={() => { setFormData({...formData, status: 'waiting_payment'}); toast.success("Facture générée - En attente de paiement"); }}><FileText size={16} /> Générer</button>
                  </div>
                </div>
              )}

              {activeStep === 5 && (
                <div className="inline-grid-2">
                  <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <label style={{ fontWeight: "bold" }}>Paiements enregistrés</label>
                      <button type="button" className="inline-secondary-btn" onClick={openPaymentModal}><Plus size={16} /> Ajouter</button>
                    </div>
                    {formData.payments && formData.payments.length > 0 ? (
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                          <thead style={{ background: "#f8fafc" }}>
                            <tr>
                              <th style={{ padding: "8px", textAlign: "left" }}>Date</th>
                              <th style={{ padding: "8px", textAlign: "left" }}>Payeur</th>
                              <th style={{ padding: "8px", textAlign: "left" }}>Méthode</th>
                              <th style={{ padding: "8px", textAlign: "right" }}>Montant</th>
                              <th style={{ padding: "8px", textAlign: "left" }}>Référence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.payments.map((payment, idx) => (
                              <tr key={idx} style={{ borderTop: "1px solid #e2e8f0" }}>
                                <td style={{ padding: "8px" }}>{payment.date}</td>
                                <td style={{ padding: "8px" }}>
                                  <span style={{ padding: "2px 8px", borderRadius: "4px", background: payment.payer === 'client' ? '#dcfce7' : '#dbeafe', color: payment.payer === 'client' ? '#166534' : '#1e40af', fontSize: "0.7rem" }}>
                                    {payment.payer === 'client' ? 'Client' : 'Assurance'}
                                  </span>
                                </td>
                                <td style={{ padding: "8px" }}>{payment.method}</td>
                                <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{payment.amount.toFixed(2)} DH</td>
                                <td style={{ padding: "8px" }}>{payment.reference || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot style={{ background: "#f8fafc", fontWeight: "bold", borderTop: "2px solid #0f172a" }}>
                            <tr>
                              <td colSpan="3" style={{ padding: "8px", textAlign: "right" }}>Total payé:</td>
                              <td style={{ padding: "8px", textAlign: "right" }}>{(Number(formData.total_paid) || 0).toFixed(2)} DH</td>
                              <td></td>
                            </tr>
                            <tr>
                              <td colSpan="3" style={{ padding: "8px", textAlign: "right" }}>Reste à payer:</td>
                              <td style={{ padding: "8px", textAlign: "right", color: "#dc2626" }}>{(Number(formData.remaining_amount) || 0).toFixed(2)} DH</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "20px", color: "#64748b", border: "1px dashed #e2e8f0", borderRadius: "8px" }}>Aucun paiement</div>
                    )}
                  </div>
                  <div className="inline-field">
                    <label>Payé par client (DH)</label>
                    <input type="number" step="0.01" value={formData.client_paid} readOnly className="inline-input" style={{ background: "#f1f5f9" }} />
                  </div>
                  <div className="inline-field">
                    <label>Payé par assurance (DH)</label>
                    <input type="number" step="0.01" value={formData.insurance_paid} readOnly className="inline-input" style={{ background: "#f1f5f9" }} />
                  </div>
                </div>
              )}

              {activeStep === 6 && (
                <div className="inline-grid-2">
                  <div style={{ gridColumn: "1 / -1", background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <h3 style={{ marginBottom: "15px" }}>Vérification avant clôture</h3>
                    <div className="inline-grid-2">
                      <div className="inline-field">
                        <label>Coût total réparation</label>
                        <input type="text" value={`${(Number(formData.total_repair_cost) || 0).toFixed(2)} DH`} readOnly className="inline-input" style={{ background: "#f1f5f9" }} />
                      </div>
                      <div className="inline-field">
                        <label>Total payé</label>
                        <input type="text" value={`${(Number(formData.total_paid) || 0).toFixed(2)} DH`} readOnly className="inline-input" style={{ background: "#f1f5f9" }} />
                      </div>
                      <div className="inline-field">
                        <label>Reste à payer</label>
                        <input type="text" value={`${(Number(formData.remaining_amount) || 0).toFixed(2)} DH`} readOnly className="inline-input" style={{ background: "#f1f5f9", color: (Number(formData.remaining_amount) || 0) > 0 ? "#dc2626" : "#16a34a", fontWeight: "bold" }} />
                      </div>
                      <div className="inline-field">
                        <label>Statut actuel</label>
                        <input type="text" value={statusConfig[formData.status]?.label || formData.status} readOnly className="inline-input" style={{ background: "#f1f5f9" }} />
                      </div>
                    </div>
                    {(Number(formData.remaining_amount) || 0) > 0 && (
                      <div style={{ background: "#fee2e2", padding: "10px", borderRadius: "8px", marginTop: "15px", color: "#991b1b" }}>
                        ⚠️ Attention : Il reste {(Number(formData.remaining_amount) || 0).toFixed(2)} DH à payer. L'accident ne peut pas être clôturé tant que tous les paiements ne sont pas effectués.
                      </div>
                    )}
                    {(Number(formData.remaining_amount) || 0) <= 0 && formData.status !== 'closed' && (
                      <div style={{ background: "#dcfce7", padding: "10px", borderRadius: "8px", marginTop: "15px", color: "#166534" }}>
                        ✅ Tous les paiements sont effectués. Vous pouvez clôturer l'accident.
                      </div>
                    )}
                    {formData.status === 'closed' && (
                      <div style={{ background: "#dbeafe", padding: "10px", borderRadius: "8px", marginTop: "15px", color: "#1e40af" }}>
                        ✅ Cet accident est déjà clôturé.
                      </div>
                    )}
                    <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                      <button type="button" className="inline-secondary-btn" onClick={() => { if (editing) openDocumentPreview('report', editing); }}><Printer size={16} /> Aperçu Rapport</button>
                      {(Number(formData.remaining_amount) || 0) <= 0 && formData.status !== 'closed' && (
                        <button type="button" className="inline-primary-btn" onClick={openCloseModal}><CheckSquare size={16} /> Clôturer</button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="inline-form-footer">
              <button type="button" className="inline-secondary-btn" onClick={() => { setShowAccidentForm(false); setEditing(null); resetForm(); }}>Annuler</button>
              {activeStep > 0 && <button type="button" className="inline-secondary-btn" onClick={() => setActiveStep(activeStep - 1)}>Précédent</button>}
              {activeStep < 6 && <button type="button" className="inline-secondary-btn" onClick={() => setActiveStep(activeStep + 1)}>Suivant</button>}
              <button type="submit" className="inline-primary-btn" disabled={submitting}>
                {submitting ? "Traitement..." : (editing ? "Mettre à jour" : "Créer")}
              </button>
            </div>
          </form>
        </div>
      ) : showAccidentDetails && selectedAccident ? (
        /* ====== DETAILS VIEW ====== */
        <div className="inline-details-container">
          <div className="inline-details-header">
            <div className="inline-details-icon"><AlertTriangle size={24} /></div>
            <div className="inline-details-title">
              <h2>Détails de l'accident</h2>
              <p>Accident #{selectedAccident.id} - {selectedAccident.date_accident}</p>
            </div>
            <button onClick={() => setShowAccidentDetails(false)} className="inline-details-close"><X size={24} /></button>
          </div>
          <div className="inline-details-content">
            <div className="details-actions-bar">
              <button onClick={() => setShowAccidentDetails(false)} className="back-btn"><ArrowLeft size={16} /> Retour</button>
              <div className="details-action-buttons">
                <button onClick={() => { setShowAccidentDetails(false); handleEdit(selectedAccident); }} className="action-edit-btn"><Edit2 size={16} /> Modifier</button>
                <button onClick={() => { setShowAccidentDetails(false); handleDeleteClick(selectedAccident); }} className="action-delete-btn"><Trash2 size={16} /> Supprimer</button>
                {selectedAccident.status !== 'closed' && (
                  <button onClick={() => { setShowAccidentDetails(false); handleEdit(selectedAccident); setActiveStep(6); }} className="action-edit-btn"><CheckSquare size={16} /> Clôturer</button>
                )}
                <button onClick={() => openDocumentPreview('report', selectedAccident)} className="action-edit-btn"><Printer size={16} /> Rapport</button>
                <button onClick={() => openDocumentPreview('estimate', selectedAccident)} className="action-edit-btn"><FileText size={16} /> Devis</button>
                <button onClick={() => openDocumentPreview('invoice', selectedAccident)} className="action-edit-btn"><Receipt size={16} /> Facture</button>
              </div>
            </div>

            {/* Header Card */}
            <div className="accident-header-card">
              <div className="accident-stats-grid">
                <div className="stat-item-detail">
                  <div className="stat-value">{statusConfig[selectedAccident.status]?.label || selectedAccident.status}</div>
                  <div className="stat-label-detail">Statut</div>
                </div>
                <div className="stat-item-detail">
                  <div className="stat-value">{selectedAccident.total_repair_cost || 0} DH</div>
                  <div className="stat-label-detail">Coût total</div>
                </div>
                <div className="stat-item-detail">
                  <div className="stat-value">{selectedAccident.total_paid || 0} DH</div>
                  <div className="stat-label-detail">Payé</div>
                </div>
                <div className="stat-item-detail">
                  <div className="stat-value" style={{ color: selectedAccident.remaining_amount > 0 ? '#dc2626' : '#16a34a' }}>
                    {selectedAccident.remaining_amount || 0} DH
                  </div>
                  <div className="stat-label-detail">Reste à payer</div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="details-sections-grid">
              <div className="detail-card">
                <div className="detail-card-title"><Car size={16} /> Véhicule</div>
                <div className="detail-card-content">
                  <div className="info-row"><span className="info-label">Matricule</span><span className="info-value matricule-value">{selectedAccident.matricule?.matricule_code || "—"}</span></div>
                  <div className="info-row"><span className="info-label">Marque</span><span className="info-value">{selectedAccident.car?.brand || "—"}</span></div>
                  <div className="info-row"><span className="info-label">Modèle</span><span className="info-value">{selectedAccident.car?.model || "—"}</span></div>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-card-title"><User size={16} /> Client</div>
                <div className="detail-card-content">
                  <div className="info-row"><span className="info-label">Nom</span><span className="info-value">{selectedAccident.client?.prenom} {selectedAccident.client?.nom}</span></div>
                  <div className="info-row"><span className="info-label">Téléphone</span><span className="info-value">{selectedAccident.client?.telephone || "—"}</span></div>
                  <div className="info-row"><span className="info-label">Email</span><span className="info-value">{selectedAccident.client?.email || "—"}</span></div>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-card-title"><Building2 size={16} /> Garage</div>
                <div className="detail-card-content">
                  <div className="info-row"><span className="info-label">Nom</span><span className="info-value">{selectedAccident.garage?.name || "Non assigné"}</span></div>
                  <div className="info-row"><span className="info-label">Adresse</span><span className="info-value">{selectedAccident.garage?.address || "—"}</span></div>
                  <div className="info-row"><span className="info-label">Téléphone</span><span className="info-value">{selectedAccident.garage?.phone || "—"}</span></div>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-card-title"><Info size={16} /> Informations</div>
                <div className="detail-card-content">
                  <div className="info-row"><span className="info-label">Date accident</span><span className="info-value">{selectedAccident.date_accident}</span></div>
                  <div className="info-row"><span className="info-label">Lieu</span><span className="info-value">{selectedAccident.location || "—"}</span></div>
                  <div className="info-row"><span className="info-label">Type</span><span className="info-value">{selectedAccident.accident_type === 'grave' ? 'Grave' : 'Non-grave'}</span></div>
                  <div className="info-row"><span className="info-label">Procédure</span><span className="info-value">{selectedAccident.procedure_type === 'classic' ? 'Classique' : 'Forphie'}</span></div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedAccident.notes && (
              <div className="notes-section">
                <div className="notes-title"><FileText size={16} /> Notes</div>
                <div className="notes-content">{selectedAccident.notes}</div>
              </div>
            )}
          </div>
          <div className="inline-details-footer">
            <button onClick={() => setShowAccidentDetails(false)} className="btn-secondary-full">Fermer</button>
          </div>
        </div>
      ) : (
        /* ====== MAIN LIST ====== */
        <>
          {/* ACTION BAR */}
          <div className="smaiti-actions-wrapper">
            <span className="smaiti-count">{filteredAccidents.length} enregistrement(s)</span>
            <div className="smaiti-actions-buttons">
              <button onClick={handleAddNew} className="btn btn-primary"><Plus size={14} /> Nouvel accident</button>
            </div>
          </div>

          {/* SEARCH & FILTER */}
          <div className="search-wrapper">
            <div className="search-row">
              <div className="search-container">
                <Search size={16} className="search-icon" />
                <input type="text" placeholder="Rechercher par ID, client, plaque..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                <option value="all">Tous statuts</option>
                {Object.entries(statusConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* FILTER INDICATOR */}
          {filterParam === 'notifications' && (
            <div className="filter-indicator">
              <span className="filter-indicator-text"><AlertCircle size={16} /> Affichage des accidents récents (7 derniers jours) non clôturés</span>
              <button onClick={() => setSearchParams({})} className="clear-filter-btn"><X size={16} /> Effacer le filtre</button>
            </div>
          )}

          {/* TABLE */}
          <div className="smaiti-table-container">
            <table className="smaiti-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("id")} className="sortable-header">ID {getSortIcon("id")}</th>
                  <th onClick={() => handleSort("date")} className="sortable-header">Date {getSortIcon("date")}</th>
                  <th onClick={() => handleSort("matricule")} className="sortable-header">Véhicule {getSortIcon("matricule")}</th>
                  <th onClick={() => handleSort("client")} className="sortable-header">Client {getSortIcon("client")}</th>
                  <th>Coût total</th>
                  <th>Payé</th>
                  <th onClick={() => handleSort("status")} className="sortable-header">Statut {getSortIcon("status")}</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAccidents.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-12">Aucun accident trouvé</td></tr>
                ) : (
                  paginatedAccidents.map(acc => {
                    const mat = matricules.find(m => m.id === acc.matricule_id);
                    const client = clients.find(c => c.id === acc.client_id);
                    const status = statusConfig[acc.status] || statusConfig.open;
                    const StatusIcon = status.icon;
                    return (
                      <tr key={acc.id}>
                        <td className="font-medium">#{acc.id}</td>
                        <td>{formatDate(acc.date_accident)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Car size={14} className="text-muted" />
                            <span className="matricule-code">{mat?.matricule_code || "—"}</span>
                          </div>
                        </td>
                        <td>{client ? `${client.prenom} ${client.nom}` : "—"}</td>
                        <td>{acc.total_repair_cost || 0} DH</td>
                        <td>{acc.total_paid || 0} DH</td>
                        <td>
                          <span className={`badge ${status.bg}`}>
                            <StatusIcon size={12} /> {status.label}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="action-icons">
                            <button onClick={() => handleViewDetails(acc)} className="action-btn view" title="Détails"><Eye size={14} /></button>
                            <button onClick={() => handleEdit(acc)} className="action-btn edit" title="Modifier"><Edit2 size={14} /></button>
                            <button onClick={() => openDocumentPreview('report', acc)} className="action-btn print" title="Rapport"><FileText size={14} /></button>
                            <button onClick={() => openDocumentPreview('estimate', acc)} className="action-btn info" title="Devis"><FileCheck size={14} /></button>
                            <button onClick={() => openDocumentPreview('invoice', acc)} className="action-btn primary" title="Facture"><Receipt size={14} /></button>
                            <button onClick={() => handleDeleteClick(acc)} className="action-btn delete" title="Supprimer"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
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
                totalItems={filteredAccidents.length}
              />
            )}
          </div>
        </>
      )}

      {/* ====== DOCUMENT PREVIEW MODAL ====== */}
      {showDocumentPreview && documentPreviewAccident && documentPreviewType && (
        <div className="delete-modal-overlay" onClick={closeDocumentPreview}>
          <div className="document-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="document-preview-header">
              <div className="document-preview-title">
                <FileText size={24} />
                <h2>
                  {documentPreviewType === 'report' && 'Rapport d\'accident'}
                  {documentPreviewType === 'estimate' && 'Devis de réparation'}
                  {documentPreviewType === 'invoice' && 'Facture de réparation'}
                </h2>
              </div>
              <div className="document-preview-actions">
                <button className="document-preview-download" onClick={() => downloadDocument(documentPreviewAccident.id, documentPreviewType)}>
                  <Download size={18} /> Télécharger
                </button>
                <button className="document-preview-close" onClick={closeDocumentPreview}><X size={24} /></button>
              </div>
            </div>
            <div className="document-preview-body">
              <PDFViewer width="100%" height="100%" style={{ border: 'none', borderRadius: '8px' }}>
                {documentPreviewType === 'report' && <AccidentReportPDF accident={documentPreviewAccident} />}
                {documentPreviewType === 'estimate' && <AccidentEstimatePDF accident={documentPreviewAccident} />}
                {documentPreviewType === 'invoice' && <AccidentInvoicePDF accident={documentPreviewAccident} />}
              </PDFViewer>
            </div>
          </div>
        </div>
      )}

      {/* ====== PAYMENT MODAL ====== */}
      {showPaymentModal && (
        <div className="delete-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3><Wallet size={20} /> Ajouter un paiement</h3>
              <button className="payment-modal-close" onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
            </div>
            <div className="payment-form-group">
              <label>Montant (DH) *</label>
              <input type="number" step="0.01" min="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} placeholder="0.00" className="payment-input" />
            </div>
            <div className="payment-form-group">
              <label>Payeur *</label>
              <div className="payment-radio-group">
                <label className="payment-radio-label">
                  <input type="radio" value="client" checked={paymentForm.payer === 'client'} onChange={() => setPaymentForm({...paymentForm, payer: 'client'})} /> Client
                </label>
                <label className="payment-radio-label">
                  <input type="radio" value="insurance" checked={paymentForm.payer === 'insurance'} onChange={() => setPaymentForm({...paymentForm, payer: 'insurance'})} /> Assurance
                </label>
              </div>
            </div>
            <div className="payment-form-group">
              <label>Méthode *</label>
              <select value={paymentForm.method} onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})} className="payment-select">
                <option value="cash">Espèces</option>
                <option value="check">Chèque</option>
                <option value="bank_transfer">Virement</option>
              </select>
            </div>
            <div className="payment-form-group">
              <label>Référence (optionnel)</label>
              <input type="text" value={paymentForm.reference} onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})} placeholder="N° chèque, virement..." className="payment-input" />
            </div>
            <div className="payment-form-group">
              <label>Notes (optionnel)</label>
              <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})} placeholder="Commentaires..." className="payment-textarea" rows="2" />
            </div>
            <div className="payment-modal-footer">
              <button className="modal-btn-cancel" onClick={() => setShowPaymentModal(false)}>Annuler</button>
              <button className="btn-primary" style={{ padding: '10px 24px', borderRadius: '40px' }} onClick={handlePaymentSubmit}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* ====== CLOSE CONFIRMATION MODAL ====== */}
      {showCloseModal && (
        <div className="delete-modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="delete-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon-box"><CheckSquare size={24} /></div>
            <h3>Confirmer la clôture</h3>
            <p>Êtes-vous sûr de vouloir clôturer cet accident ?<br />Une fois clôturé, vous ne pourrez plus modifier les informations.</p>
            <div className="delete-actions">
              <button className="modal-btn-cancel" onClick={() => setShowCloseModal(false)}>Annuler</button>
              <button className="modal-btn-delete" onClick={handleCloseConfirm}>Clôturer</button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {deleteModalOpen && accidentToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-card">
            <div className="delete-icon-box"><TrashIcon size={24} /></div>
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer l'accident <br /><strong>#{accidentToDelete.id}</strong> ?<br />Cette action est irréversible.</p>
            {accidentToDelete.status === "under_repair" && (
              <p style={{ fontSize: "0.75rem", color: "#dc2626" }}>⚠️ Cet accident est en cours de réparation. La suppression affectera les données associées.</p>
            )}
            <div className="delete-actions">
              <button className="modal-btn-cancel" onClick={() => setDeleteModalOpen(false)}>Annuler</button>
              <button className="modal-btn-delete" onClick={confirmDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}