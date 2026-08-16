// src/pages/admin/AdminMatricules.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  fetchMatricules, fetchCars, createMatricule, updateMatricule, deleteMatricule,
  refreshMatricules, fetchReservations, createAccident,
  selectMatricules, selectCars, selectMatriculesLoading, selectReservations,
  fetchClients, selectClients
} from "../../Redux/store";
import PaginationControls from '../../components/PaginationControls';
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, X, Search, RefreshCw, Car, Tag, Gauge, Calendar,
  CheckCircle, XCircle, AlertCircle, Save, TrashIcon, Sparkles,
  Activity, ArrowUpDown, ArrowUp, ArrowDown, Eye, ChevronLeft,
  Droplet, Filter, Wind, CircleStop, Droplets, PlusCircle,
  Wrench, AlertTriangle, User, Gavel, Bell, CheckCircle2, ShieldCheck, FileSpreadsheet, ChevronRight
} from "lucide-react";

export default function AdminMatricules() {
  const dispatch = useDispatch();
  const matricules = useSelector(selectMatricules);
  const cars = useSelector(selectCars);
  const loading = useSelector(selectMatriculesLoading);
  const reservations = useSelector(selectReservations);
  const clients = useSelector(selectClients);

  // URL search params for filtering
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  // UI state
  const [showMatriculeForm, setShowMatriculeForm] = useState(false);
  const [showMatriculeDetails, setShowMatriculeDetails] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [matriculeToDelete, setMatriculeToDelete] = useState(null);
  const [selectedMatricule, setSelectedMatricule] = useState(null);
  const [editingMatricule, setEditingMatricule] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Accident inline form state
  const [showAccidentForm, setShowAccidentForm] = useState(false);
  const [selectedMatriculeForAccident, setSelectedMatriculeForAccident] = useState(null);
  const [accidentSubmitting, setAccidentSubmitting] = useState(false);
  const [reservationsForMatricule, setReservationsForMatricule] = useState([]);
  const [accidentFormData, setAccidentFormData] = useState({
    matricule_id: '',
    car_id: '',
    client_id: '',
    reservation_id: '',
    date_accident: new Date().toISOString().slice(0, 10),
    amount_of_losses: 0,
    amount_assurance: 0,
    nom_expert: '',
    status: 'open',
    accident_type: 'grave',
    procedure_type: 'classic',
    expert_decision: 'pending',
    expert_amount: 0,
    expert_notes: '',
    notes: ''
  });

  // Search state for reservation in accident form
  const [reservationSearchTerm, setReservationSearchTerm] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [filteredReservations, setFilteredReservations] = useState([]);

  // Sorting
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  // Details view – maintenance forms
  const [activeMaintenanceTab, setActiveMaintenanceTab] = useState('required');
  const [showAddForm, setShowAddForm] = useState(null);
  const [showHistoryFor, setShowHistoryFor] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [additionalItemName, setAdditionalItemName] = useState('');
  const [additionalItemQuantity, setAdditionalItemQuantity] = useState('');
  const [additionalItemRequired, setAdditionalItemRequired] = useState(false);
  const [additionalItemType, setAdditionalItemType] = useState('quantity');
  const [additionalItemNotes, setAdditionalItemNotes] = useState('');

  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Car search state for the form
  const [carSearchTerm, setCarSearchTerm] = useState("");
  const [selectedCar, setSelectedCar] = useState(null);
  const [filteredCars, setFilteredCars] = useState([]);

  // Form data for creation/edition
  const [formData, setFormData] = useState({
    matricule_code: "",
    car_id: "",
    status: "active",
    kilometrage: 0,
    visit_tech: "",
    date_assurance: "",
    date_taxe_voiture: "",
    vidange_status: "not done"
  });

  useEffect(() => {
    loadData();
    dispatch(fetchReservations());
  }, [dispatch]);

  const loadData = async () => {
    await Promise.all([
      dispatch(fetchMatricules()),
      dispatch(fetchCars()),
      dispatch(fetchClients())
    ]);
  };

  const refreshData = async () => {
    await dispatch(refreshMatricules());
    await dispatch(fetchCars());
    await dispatch(fetchClients());
    await dispatch(fetchReservations());
    toast.success("Données actualisées");
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };

  const updateLocalMatricule = (updatedData) => {
    setSelectedMatricule(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  const hasMatriculeNotification = (mat) => {
    const visitTech = mat.visit_tech ? new Date(mat.visit_tech) : null;
    const assurance = mat.date_assurance ? new Date(mat.date_assurance) : null;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const isVisitTechExpired = visitTech && visitTech < today;
    const isVisitTechSoon = visitTech && (visitTech - today) / (1000*60*60*24) <= 7 && visitTech >= today;
    
    const isAssuranceExpired = assurance && assurance < today;
    const isAssuranceSoon = assurance && (assurance - today) / (1000*60*60*24) <= 7 && assurance >= today;
    
    return isVisitTechExpired || isVisitTechSoon || isAssuranceExpired || isAssuranceSoon;
  };

  // ACCIDENT FORM FUNCTIONS
  const handleOpenAccidentForm = (mat) => {
    const matriculeReservations = reservations.filter(r => r.matricule_id === mat.id);
    setReservationsForMatricule(matriculeReservations);
    setSelectedMatriculeForAccident(mat);
    setReservationSearchTerm("");
    setSelectedReservation(null);
    setFilteredReservations([]);
    setAccidentFormData({
      matricule_id: mat.id,
      car_id: mat.car_id,
      client_id: '',
      reservation_id: '',
      date_accident: new Date().toISOString().slice(0, 10),
      amount_of_losses: 0,
      amount_assurance: 0,
      nom_expert: '',
      status: 'open',
      accident_type: 'grave',
      procedure_type: 'classic',
      expert_decision: 'pending',
      expert_amount: 0,
      expert_notes: '',
      notes: ''
    });
    setShowAccidentForm(true);
  };

  const handleReservationSearch = (term) => {
    setReservationSearchTerm(term);
    if (term.trim() === "") {
      setFilteredReservations([]);
      return;
    }
    const lowerTerm = term.toLowerCase().trim();
    const filtered = reservationsForMatricule.filter(res => {
      const client = clients.find(c => c.id === res.client_id);
      const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : "";
      const startDate = new Date(res.start_date).toLocaleDateString("fr-FR");
      const endDate = new Date(res.end_date).toLocaleDateString("fr-FR");
      return (
        res.id.toString().includes(lowerTerm) ||
        clientName.includes(lowerTerm) ||
        startDate.includes(lowerTerm) ||
        endDate.includes(lowerTerm)
      );
    });
    setFilteredReservations(filtered.slice(0, 10));
  };

  const handleReservationSelect = (reservation) => {
    setSelectedReservation(reservation);
    setReservationSearchTerm(
      `#${reservation.id} - ${new Date(reservation.start_date).toLocaleDateString("fr-FR")} → ${new Date(reservation.end_date).toLocaleDateString("fr-FR")} - Client: ${clients.find(c => c.id === reservation.client_id)?.prenom} ${clients.find(c => c.id === reservation.client_id)?.nom || 'N/A'}`
    );
    setAccidentFormData({
      ...accidentFormData,
      reservation_id: reservation.id,
      client_id: reservation.client_id
    });
    setFilteredReservations([]);
  };

  const clearReservationSelection = () => {
    setSelectedReservation(null);
    setReservationSearchTerm("");
    setAccidentFormData(prev => ({ ...prev, reservation_id: "", client_id: "" }));
    setFilteredReservations([]);
  };

  const handleSubmitAccident = async (e) => {
    e.preventDefault();
    if (!accidentFormData.client_id) {
      toast.error("Veuillez sélectionner une réservation");
      return;
    }
    if (!accidentFormData.amount_of_losses || accidentFormData.amount_of_losses <= 0) {
      toast.error("Veuillez saisir le montant des pertes");
      return;
    }

    try {
      setAccidentSubmitting(true);
      const accidentData = {
        ...accidentFormData,
        time_accident: "",
        location: "",
        description: "",
        police_report_number: "",
        garage_id: null,
        inspection_notes: null,
        estimated_cost: 0,
        total_repair_cost: 0,
        franchise_amount: 0,
        insurance_paid: 0,
        client_paid: 0,
        total_paid: 0,
        remaining_amount: 0,
        internal_notes: null,
        closed_at: null,
        estimate_items: [],
        estimate_total_ht: 0,
        estimate_tva: 0,
        estimate_total_ttc: 0,
        estimate_status: "draft",
        repair_start_date: null,
        repair_end_date: null,
        repair_notes: null,
        invoice_number: null,
        invoice_items: [],
        invoice_total_ht: 0,
        invoice_tva: 0,
        invoice_total_ttc: 0,
        payments: [],
        img_accident: [],
        img_evaluation_expert: [],
        img_fixed: [],
        image_facture: []
      };

      await dispatch(createAccident(accidentData)).unwrap();
      toast.success("Accident créé avec succès");
      setShowAccidentForm(false);
      setSelectedMatriculeForAccident(null);
      await refreshData();
    } catch (error) {
      toast.error(error.payload || error.message || "Erreur lors de la création");
    } finally {
      setAccidentSubmitting(false);
    }
  };

  const resetAccidentForm = () => {
    setAccidentFormData({
      matricule_id: '',
      car_id: '',
      client_id: '',
      reservation_id: '',
      date_accident: new Date().toISOString().slice(0, 10),
      amount_of_losses: 0,
      amount_assurance: 0,
      nom_expert: '',
      status: 'open',
      accident_type: 'grave',
      procedure_type: 'classic',
      expert_decision: 'pending',
      expert_amount: 0,
      expert_notes: '',
      notes: ''
    });
    setSelectedMatriculeForAccident(null);
    setReservationsForMatricule([]);
    setReservationSearchTerm("");
    setSelectedReservation(null);
    setFilteredReservations([]);
  };

  // HELPERS
  const statusConfig = {
    active: { label: "Actif", bg: "badge-available", icon: CheckCircle },
    inactive: { label: "Inactif", bg: "badge-rented", icon: XCircle },
    sold: { label: "Vendu", bg: "badge-amber", icon: AlertCircle },
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("fr-FR");
    } catch {
      return dateString;
    }
  };

  const isDateExpired = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date < today;
  };

  const isDateExpiringSoon = (dateString, days = 30) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays > 0;
  };

  const getDateStatusInfo = (date) => {
    if (!date) return null;
    if (isDateExpired(date)) return { class: 'real-status unavailable compact', text: 'Expiré' };
    if (isDateExpiringSoon(date)) return { class: 'badge badge-amber compact', text: 'Bientôt' };
    return { class: 'real-status available compact', text: 'Valide' };
  };

  // CALCUL PROGRESSION VIDANGE
  const calculateRequiredTasksProgress = (mat) => {
    let requiredTasks = [];
    let completedTasks = 0;

    requiredTasks.push('Huile');
    if (mat.oil === 'yes') completedTasks++;

    requiredTasks.push('Filtre à Huile');
    if (mat.filter_oil === 'yes') completedTasks++;

    const additionalMaintenance = mat.additional_maintenance || [];
    additionalMaintenance.forEach(item => {
      if (item.required_for_vidange) {
        requiredTasks.push(item.name);
        let isCompleted = false;
        if (item.type === 'quantity') {
          isCompleted = (item.value && item.value > 0);
        } else if (item.type === 'note') {
          isCompleted = !item.needs_attention;
        }
        if (isCompleted) completedTasks++;
      }
    });

    const total = requiredTasks.length;
    const percentage = total > 0 ? (completedTasks / total) * 100 : 0;
    const isVidangeDone = total > 0 && completedTasks === total;

    return { total, completed: completedTasks, percentage, isVidangeDone };
  };

  // ACTIONS MAINTENANCE
  const handleAddOil = async () => {
    if (!selectedMatricule) return;
    if (!newQuantity || parseFloat(newQuantity) <= 0) {
      toast.error("Veuillez saisir une quantité d'huile valide");
      return;
    }

    const quantity = parseFloat(newQuantity);
    const currentTotal = parseFloat(selectedMatricule.oil_quantity || 0);
    const newTotal = currentTotal + quantity;

    const historyEntry = {
      id: Date.now().toString(),
      quantity: quantity,
      date: newDate,
      created_at: new Date().toISOString(),
      kilometrage: selectedMatricule.kilometrage
    };

    const currentHistory = selectedMatricule.oil_history || [];
    const newHistory = [...currentHistory, historyEntry];

    try {
      setSubmitting(true);
      await dispatch(updateMatricule({
        id: selectedMatricule.id,
        data: {
          oil: 'yes',
          oil_date: newDate,
          oil_quantity: newTotal,
          oil_history: newHistory
        }
      })).unwrap();

      updateLocalMatricule({
        oil: 'yes',
        oil_date: newDate,
        oil_quantity: newTotal,
        oil_history: newHistory
      });

      toast.success(`Huile ajoutée : +${quantity.toFixed(1)} L`);
      setShowAddForm(null);
      setNewQuantity('');
      setNewDate(new Date().toISOString().slice(0, 10));
    } catch (error) {
      toast.error(error.payload || error.message || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFilterOil = async () => {
    if (!selectedMatricule) return;

    const currentCount = selectedMatricule.filter_oil_count || 0;
    const newCount = currentCount + 1;

    const historyEntry = {
      id: Date.now().toString(),
      date: newDate,
      created_at: new Date().toISOString(),
      kilometrage: selectedMatricule.kilometrage
    };

    const currentHistory = selectedMatricule.filter_oil_history || [];
    const newHistory = [...currentHistory, historyEntry];

    try {
      setSubmitting(true);
      await dispatch(updateMatricule({
        id: selectedMatricule.id,
        data: {
          filter_oil: 'yes',
          filter_oil_date: newDate,
          filter_oil_count: newCount,
          filter_oil_history: newHistory
        }
      })).unwrap();

      updateLocalMatricule({
        filter_oil: 'yes',
        filter_oil_date: newDate,
        filter_oil_count: newCount,
        filter_oil_history: newHistory
      });

      toast.success("Filtre à huile ajouté avec succès");
      setShowAddForm(null);
      setNewDate(new Date().toISOString().slice(0, 10));
    } catch (error) {
      toast.error(error.payload || error.message || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFilterAir = async () => {
    if (!selectedMatricule) return;

    const currentCount = selectedMatricule.filter_air_count || 0;
    const newCount = currentCount + 1;

    const historyEntry = {
      id: Date.now().toString(),
      date: newDate,
      created_at: new Date().toISOString(),
      kilometrage: selectedMatricule.kilometrage
    };

    const currentHistory = selectedMatricule.filter_air_history || [];
    const newHistory = [...currentHistory, historyEntry];

    try {
      setSubmitting(true);
      await dispatch(updateMatricule({
        id: selectedMatricule.id,
        data: {
          filter_air: 'yes',
          filter_air_date: newDate,
          filter_air_count: newCount,
          filter_air_history: newHistory
        }
      })).unwrap();

      updateLocalMatricule({
        filter_air: 'yes',
        filter_air_date: newDate,
        filter_air_count: newCount,
        filter_air_history: newHistory
      });

      toast.success("Filtre à air ajouté avec succès");
      setShowAddForm(null);
      setNewDate(new Date().toISOString().slice(0, 10));
    } catch (error) {
      toast.error(error.payload || error.message || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBrakePads = async () => {
    if (!selectedMatricule) return;

    const currentCount = selectedMatricule.paquets_de_frein_count || 0;
    const newCount = currentCount + 1;

    const historyEntry = {
      id: Date.now().toString(),
      date: newDate,
      created_at: new Date().toISOString(),
      kilometrage: selectedMatricule.kilometrage
    };

    const currentHistory = selectedMatricule.paquets_de_frein_history || [];
    const newHistory = [...currentHistory, historyEntry];

    try {
      setSubmitting(true);
      await dispatch(updateMatricule({
        id: selectedMatricule.id,
        data: {
          paquets_de_frein: 'yes',
          paquets_de_frein_date: newDate,
          paquets_de_frein_count: newCount,
          paquets_de_frein_history: newHistory
        }
      })).unwrap();

      updateLocalMatricule({
        paquets_de_frein: 'yes',
        paquets_de_frein_date: newDate,
        paquets_de_frein_count: newCount,
        paquets_de_frein_history: newHistory
      });

      toast.success("Paquets de frein ajoutés avec succès");
      setShowAddForm(null);
      setNewDate(new Date().toISOString().slice(0, 10));
    } catch (error) {
      toast.error(error.payload || error.message || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAdBlue = async () => {
    if (!selectedMatricule) return;
    if (!newQuantity || parseFloat(newQuantity) <= 0) {
      toast.error("Veuillez saisir une quantité d'Ad Blue valide");
      return;
    }

    const quantity = parseFloat(newQuantity);
    const currentTotal = parseFloat(selectedMatricule.ad_blue_quantity || 0);
    const newTotal = currentTotal + quantity;

    const historyEntry = {
      id: Date.now().toString(),
      quantity: quantity,
      date: newDate,
      created_at: new Date().toISOString(),
      kilometrage: selectedMatricule.kilometrage
    };

    const currentHistory = selectedMatricule.ad_blue_history || [];
    const newHistory = [...currentHistory, historyEntry];

    try {
      setSubmitting(true);
      await dispatch(updateMatricule({
        id: selectedMatricule.id,
        data: {
          ad_blue: 'yes',
          ad_blue_date: newDate,
          ad_blue_quantity: newTotal,
          ad_blue_history: newHistory
        }
      })).unwrap();

      updateLocalMatricule({
        ad_blue: 'yes',
        ad_blue_date: newDate,
        ad_blue_quantity: newTotal,
        ad_blue_history: newHistory
      });

      toast.success(`Ad Blue ajouté : +${quantity.toFixed(1)} L`);
      setShowAddForm(null);
      setNewQuantity('');
      setNewDate(new Date().toISOString().slice(0, 10));
    } catch (error) {
      toast.error(error.payload || error.message || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAdditionalItem = async () => {
    if (!selectedMatricule) return;
    if (!additionalItemName.trim()) {
      toast.error("Veuillez saisir un nom pour l'élément");
      return;
    }

    const additionalMaintenance = selectedMatricule.additional_maintenance || [];

    const newItem = {
      id: Date.now().toString(),
      name: additionalItemName,
      type: additionalItemType,
      value: additionalItemType === 'quantity' ? (parseFloat(additionalItemQuantity) || 0) : '',
      required_for_vidange: additionalItemRequired,
      needs_attention: additionalItemType === 'note',
      notes: additionalItemNotes,
      history: additionalItemType === 'quantity' && additionalItemQuantity ? [{
        id: Date.now().toString(),
        quantity: parseFloat(additionalItemQuantity),
        date: newDate,
        created_at: new Date().toISOString(),
        kilometrage: selectedMatricule.kilometrage
      }] : [],
      last_done_date: additionalItemType === 'quantity' && additionalItemQuantity ? newDate : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newAdditionalMaintenance = [...additionalMaintenance, newItem];

    try {
      setSubmitting(true);
      await dispatch(updateMatricule({
        id: selectedMatricule.id,
        data: { additional_maintenance: newAdditionalMaintenance }
      })).unwrap();

      updateLocalMatricule({ additional_maintenance: newAdditionalMaintenance });

      toast.success("Élément ajouté avec succès");
      setShowAddForm(null);
      setAdditionalItemName('');
      setAdditionalItemQuantity('');
      setAdditionalItemRequired(false);
      setAdditionalItemNotes('');
    } catch (error) {
      toast.error(error.payload || error.message || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const getMaintenanceStatus = (mat, type) => {
    switch (type) {
      case 'oil': return mat.oil === 'yes';
      case 'filter_oil': return mat.filter_oil === 'yes';
      case 'filter_air': return mat.filter_air === 'yes';
      case 'paquets_de_frein': return mat.paquets_de_frein === 'yes';
      case 'ad_blue': return mat.ad_blue === 'yes';
      default: return false;
    }
  };

  const getMaintenanceValue = (mat, type) => {
    switch (type) {
      case 'oil': return { total: parseFloat(mat.oil_quantity || 0), lastDate: mat.oil_date, history: mat.oil_history || [] };
      case 'filter_oil': return { total: mat.filter_oil_count || 0, lastDate: mat.filter_oil_date, history: mat.filter_oil_history || [] };
      case 'filter_air': return { total: mat.filter_air_count || 0, lastDate: mat.filter_air_date, history: mat.filter_air_history || [] };
      case 'paquets_de_frein': return { total: mat.paquets_de_frein_count || 0, lastDate: mat.paquets_de_frein_date, history: mat.paquets_de_frein_history || [] };
      case 'ad_blue': return { total: parseFloat(mat.ad_blue_quantity || 0), lastDate: mat.ad_blue_date, history: mat.ad_blue_history || [] };
      default: return { total: 0, lastDate: null, history: [] };
    }
  };

  // SORT
  const handleSort = (field) => {
    if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
  };
  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return sortDirection === "asc" ? <ArrowUp size={12} className="sort-icon active" /> : <ArrowDown size={12} className="sort-icon active" />;
  };

  // FILTER & PAGINATION
  const filteredMatricules = (matricules || []).filter(mat => {
    const car = cars.find(c => c.id === mat.car_id);
    const matchesSearch = searchTerm === '' ||
      mat.matricule_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car?.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mat.status === statusFilter;

    let matchesNotification = true;
    if (filterParam === 'notifications') {
      matchesNotification = hasMatriculeNotification(mat);
    }

    return matchesSearch && matchesStatus && matchesNotification;
  }).sort((a, b) => {
    let aVal, bVal;
    switch (sortField) {
      case "id": aVal = a.id; bVal = b.id; break;
      case "matricule": aVal = a.matricule_code?.toLowerCase() || ""; bVal = b.matricule_code?.toLowerCase() || ""; break;
      case "car": 
        const aCar = cars.find(c => c.id === a.car_id); 
        const bCar = cars.find(c => c.id === b.car_id); 
        aVal = aCar ? `${aCar.brand} ${aCar.model}`.toLowerCase() : ""; 
        bVal = bCar ? `${bCar.brand} ${bCar.model}`.toLowerCase() : ""; 
        break;
      case "kilometrage": aVal = a.kilometrage || 0; bVal = b.kilometrage || 0; break;
      case "status": aVal = a.status || ""; bVal = b.status || ""; break;
      default: aVal = a.id; bVal = b.id;
    }
    if (sortDirection === "asc") return aVal > bVal ? 1 : -1;
    else return aVal < bVal ? 1 : -1;
  });

  const totalPages = Math.ceil(filteredMatricules.length / itemsPerPage);
  const paginatedMatricules = filteredMatricules.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // CRUD
  const handleCreateMatricule = async (data) => {
    setSubmitting(true);
    try {
      await dispatch(createMatricule(data)).unwrap();
      toast.success("Matricule ajouté avec succès!");
      setShowMatriculeForm(false);
      setEditingMatricule(null);
      await loadData();
      resetForm();
    } catch (error) {
      toast.error(error.payload || error.message || "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMatricule = async (data) => {
    setSubmitting(true);
    try {
      await dispatch(updateMatricule({ id: editingMatricule.id, data })).unwrap();
      toast.success("Matricule modifié avec succès!");
      setShowMatriculeForm(false);
      setEditingMatricule(null);
      await loadData();
      resetForm();
    } catch (error) {
      toast.error(error.payload || error.message || "Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (mat) => {
    setEditingMatricule(mat);
    setFormData({
      matricule_code: mat.matricule_code,
      car_id: mat.car_id || "",
      status: mat.status,
      kilometrage: mat.kilometrage || 0,
      visit_tech: formatDateForInput(mat.visit_tech),
      date_assurance: formatDateForInput(mat.date_assurance),
      date_taxe_voiture: formatDateForInput(mat.date_taxe_voiture),
      vidange_status: mat.vidange_status || "not done"
    });
    if (mat.car_id) {
      const car = cars.find(c => c.id === mat.car_id);
      if (car) {
        setSelectedCar(car);
        setCarSearchTerm(`${car.brand} ${car.model} (${car.year})`);
      }
    } else {
      setSelectedCar(null);
      setCarSearchTerm("");
    }
    setShowMatriculeForm(true);
  };

  const handleAddNew = () => {
    setEditingMatricule(null);
    resetForm();
    setSelectedCar(null);
    setCarSearchTerm("");
    setShowMatriculeForm(true);
  };

  const resetForm = () => {
    setFormData({
      matricule_code: "",
      car_id: "",
      status: "active",
      kilometrage: 0,
      visit_tech: "",
      date_assurance: "",
      date_taxe_voiture: "",
      vidange_status: "not done"
    });
    setSelectedCar(null);
    setCarSearchTerm("");
  };

  const handleDeleteClick = (matricule) => {
    setMatriculeToDelete(matricule);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!matriculeToDelete) return;
    const result = await dispatch(deleteMatricule(matriculeToDelete.id));
    if (result.error) toast.error(result.payload);
    else {
      toast.success("Matricule supprimé avec succès");
      await loadData();
    }
    setDeleteModalOpen(false);
    setMatriculeToDelete(null);
  };

  const handleViewDetails = (mat) => {
    setSelectedMatricule(mat);
    setShowMatriculeDetails(true);
    setActiveMaintenanceTab('required');
    setShowAddForm(null);
    setShowHistoryFor(null);
  };

  const handleCarSearch = (term) => {
    setCarSearchTerm(term);
    if (term.trim() === "") {
      setFilteredCars([]);
      return;
    }
    const lowerTerm = term.toLowerCase().trim();
    const filtered = cars.filter(car =>
      `${car.brand} ${car.model} ${car.year}`.toLowerCase().includes(lowerTerm)
    );
    setFilteredCars(filtered.slice(0, 10));
  };

  const handleCarSelect = (car) => {
    setSelectedCar(car);
    setCarSearchTerm(`${car.brand} ${car.model} (${car.year})`);
    setFormData(prev => ({ ...prev, car_id: car.id }));
    setFilteredCars([]);
  };

  const clearCarSelection = () => {
    setSelectedCar(null);
    setCarSearchTerm("");
    setFormData(prev => ({ ...prev, car_id: "" }));
    setFilteredCars([]);
  };

  const handleExport = () => {
    const headers = ['ID', 'Plaque', 'Voiture', 'Kilométrage', 'Visite Tech', 'Assurance', 'Vignette', 'Vidange', 'Statut'];
    const csvData = filteredMatricules.map(mat => {
      const car = cars.find(c => c.id === mat.car_id);
      return [mat.id, `"${mat.matricule_code}"`, `"${car ? `${car.brand} ${car.model}` : 'N/A'}"`, mat.kilometrage || 0, mat.visit_tech || '', mat.date_assurance || '', mat.date_taxe_voiture || '', mat.vidange_status || 'not done', mat.status].join(',');
    });
    const blob = new Blob([headers.join(',') + '\n' + csvData.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `matricules_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success("Export CSV effectué");
  };

  const stats = {
    total: matricules?.length || 0,
    active: matricules?.filter(m => m.status === 'active').length || 0,
    inactive: matricules?.filter(m => m.status === 'inactive').length || 0,
    totalKm: matricules?.reduce((sum, m) => sum + (Number(m.kilometrage) || 0), 0) || 0
  };

  if (loading && !showMatriculeDetails && !showMatriculeForm && !showAccidentForm) return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Chargement des matricules...</p>
    </div>
  );

  return (
    <>
      {/* --- REDESIGNED ACCIDENT FORM MODAL --- */}
      {showAccidentForm && selectedMatriculeForAccident ? (
        <div className="modal-glass-container">
          <div className="modal-header-hero accident-hero">
            <div className="hero-left">
              <div className="hero-icon-wrapper danger-glow">
                <AlertTriangle size={24} />
              </div>
              <div className="hero-text">
                <span className="hero-badge danger-badge">Accident & Sinistre</span>
                <h2>Déclaration d'accident</h2>
                <p>Plaque d'immatriculation : <strong>{selectedMatriculeForAccident.matricule_code}</strong></p>
              </div>
            </div>
            <button onClick={() => { setShowAccidentForm(false); resetAccidentForm(); }} className="hero-close-btn">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmitAccident} className="modal-body-form">
            <div className="modal-grid-2">
              <div className="form-column">
                <div className="form-card">
                  <div className="card-header">
                    <Car size={16} className="text-emerald" />
                    <h4>Informations Immatriculation</h4>
                  </div>
                  <div className="input-group-row">
                    <div className="field-block">
                      <label>N° Plaque</label>
                      <input type="text" value={selectedMatriculeForAccident.matricule_code} className="styled-input readonly-input" disabled />
                    </div>
                    <div className="field-block">
                      <label>Modèle Véhicule</label>
                      <input type="text" value={`${cars.find(c => c.id === selectedMatriculeForAccident.car_id)?.brand || ''} ${cars.find(c => c.id === selectedMatriculeForAccident.car_id)?.model || ''}`} className="styled-input readonly-input" disabled />
                    </div>
                  </div>
                </div>

                <div className="form-card">
                  <div className="card-header">
                    <User size={16} className="text-emerald" />
                    <h4>Réservation & Client</h4>
                  </div>
                  <div className="field-block relative-block">
                    <label>Sélectionner la réservation concernée *</label>
                    <div className="input-with-icon">
                      <Search size={16} className="input-icon" />
                      <input
                        type="text"
                        className="styled-input padded-input"
                        value={reservationSearchTerm}
                        onChange={(e) => handleReservationSearch(e.target.value)}
                        placeholder="Rechercher par ID, nom client, date..."
                      />
                      {selectedReservation && (
                        <button type="button" onClick={clearReservationSelection} className="input-clear">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {filteredReservations.length > 0 && (
                      <div className="styled-dropdown">
                        {filteredReservations.map(res => {
                          const client = clients.find(c => c.id === res.client_id);
                          return (
                            <div key={res.id} className="dropdown-item" onClick={() => handleReservationSelect(res)}>
                              <div className="dropdown-title">
                                <strong>#{res.id}</strong> — {client ? `${client.prenom} ${client.nom}` : 'N/A'}
                              </div>
                              <div className="dropdown-sub">
                                {formatDate(res.start_date)} → {formatDate(res.end_date)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="field-block">
                    <label>Client Associé</label>
                    <input
                      type="text"
                      value={(() => {
                        const client = clients.find(c => c.id === accidentFormData.client_id);
                        return client ? `${client.prenom} ${client.nom}` : 'Aucune réservation sélectionnée';
                      })()}
                      className="styled-input readonly-input"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="form-column">
                <div className="form-card">
                  <div className="card-header">
                    <Calendar size={16} className="text-emerald" />
                    <h4>Détails & Évaluation financière</h4>
                  </div>
                  <div className="input-group-row">
                    <div className="field-block">
                      <label>Date de l'accident *</label>
                      <input type="date" required value={accidentFormData.date_accident} onChange={(e) => setAccidentFormData({ ...accidentFormData, date_accident: e.target.value })} className="styled-input" />
                    </div>
                    <div className="field-block">
                      <label>Montant Pertes (DH) *</label>
                      <input type="number" step="0.01" required value={accidentFormData.amount_of_losses} onChange={(e) => setAccidentFormData({ ...accidentFormData, amount_of_losses: parseFloat(e.target.value) || 0 })} className="styled-input" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="input-group-row">
                    <div className="field-block">
                      <label>Prise en charge Assurance (DH)</label>
                      <input type="number" step="0.01" value={accidentFormData.amount_assurance} onChange={(e) => setAccidentFormData({ ...accidentFormData, amount_assurance: parseFloat(e.target.value) || 0 })} className="styled-input" placeholder="0.00" />
                    </div>
                    <div className="field-block">
                      <label>Statut Dossier</label>
                      <select value={accidentFormData.status} onChange={(e) => setAccidentFormData({ ...accidentFormData, status: e.target.value })} className="styled-select">
                        <option value="open">Ouvert</option>
                        <option value="pending">Signalé</option>
                        <option value="evaluation_owner">Évaluation propriétaire</option>
                        <option value="contact expert">Contact expert</option>
                        <option value="evaluation_expert">Évaluation expert</option>
                        <option value="fixed">Réparé</option>
                        <option value="waiting">Attente paiement</option>
                        <option value="completed">Terminé</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-card">
                  <div className="card-header">
                    <Gavel size={16} className="text-emerald" />
                    <h4>Procédure & Expertise</h4>
                  </div>
                  <div className="input-group-row">
                    <div className="field-block">
                      <label>Gravité</label>
                      <select value={accidentFormData.accident_type} onChange={(e) => setAccidentFormData({ ...accidentFormData, accident_type: e.target.value })} className="styled-select">
                        <option value="grave">Grave</option>
                        <option value="non_grave">Non-grave</option>
                      </select>
                    </div>
                    <div className="field-block">
                      <label>Type Procédure</label>
                      <select value={accidentFormData.procedure_type} onChange={(e) => setAccidentFormData({ ...accidentFormData, procedure_type: e.target.value })} className="styled-select">
                        <option value="classic">Classique</option>
                        <option value="forphie">Forfaitaire</option>
                      </select>
                    </div>
                  </div>
                  <div className="field-block">
                    <label>Nom de l'expert d'assurance</label>
                    <input type="text" value={accidentFormData.nom_expert} onChange={(e) => setAccidentFormData({ ...accidentFormData, nom_expert: e.target.value })} className="styled-input" placeholder="Ex: Cabinets d'Expertise Auto" />
                  </div>
                  <div className="field-block">
                    <label>Notes & Diagnostics</label>
                    <textarea rows={2} value={accidentFormData.notes} onChange={(e) => setAccidentFormData({ ...accidentFormData, notes: e.target.value })} className="styled-textarea" placeholder="Remarques additionnelles..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button type="button" className="btn-modal-secondary" onClick={() => { setShowAccidentForm(false); resetAccidentForm(); }}>
                Annuler
              </button>
              <button type="submit" className="btn-modal-danger" disabled={accidentSubmitting}>
                {accidentSubmitting ? "Enregistrement..." : "Confirmer le sinistre"}
              </button>
            </div>
          </form>
        </div>
      ) : showMatriculeForm ? (
        /* --- REDESIGNED MATRICULE ADD/EDIT MODAL --- */
        <div className="modal-glass-container">
          <div className="modal-header-hero primary-hero">
            <div className="hero-left">
              <div className="hero-icon-wrapper primary-glow">
                {editingMatricule ? <Sparkles size={24} /> : <PlusCircle size={24} />}
              </div>
              <div className="hero-text">
                <span className="hero-badge primary-badge">{editingMatricule ? "Mise à jour" : "Création"}</span>
                <h2>{editingMatricule ? "Éditer l'immatriculation" : "Enregistrer un nouveau matricule"}</h2>
                <p>{editingMatricule ? `Modification des données de ${editingMatricule.matricule_code}` : "Attribuez un numéro de plaque à un véhicule actif"}</p>
              </div>
            </div>
            <button onClick={() => { setShowMatriculeForm(false); setEditingMatricule(null); resetForm(); }} className="hero-close-btn">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingMatricule) {
              handleUpdateMatricule(formData);
            } else {
              handleCreateMatricule(formData);
            }
          }} className="modal-body-form">
            <div className="modal-grid-2">
              <div className="form-column">
                <div className="form-card">
                  <div className="card-header">
                    <Tag size={16} className="text-emerald" />
                    <h4>Identifiants du véhicule</h4>
                  </div>
                  <div className="input-group-row">
                    <div className="field-block">
                      <label>Code Matricule *</label>
                      <input 
                        type="text" 
                        className="styled-input" 
                        value={formData.matricule_code} 
                        onChange={(e) => setFormData({...formData, matricule_code: e.target.value})} 
                        required 
                        placeholder="Ex: 12345-A-6"
                      />
                    </div>
                    <div className="field-block">
                      <label>Statut Actuel</label>
                      <select 
                        className="styled-select" 
                        value={formData.status} 
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="sold">Vendu</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-card">
                  <div className="card-header">
                    <Car size={16} className="text-emerald" />
                    <h4>Association du Modèle</h4>
                  </div>
                  <div className="field-block relative-block">
                    <label>Rechercher le Véhicule *</label>
                    <div className="input-with-icon">
                      <Search size={16} className="input-icon" />
                      <input
                        type="text"
                        className="styled-input padded-input"
                        value={carSearchTerm}
                        onChange={(e) => handleCarSearch(e.target.value)}
                        placeholder="Rechercher par marque, modèle..."
                      />
                      {selectedCar && (
                        <button type="button" onClick={clearCarSelection} className="input-clear">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {filteredCars.length > 0 && (
                      <div className="styled-dropdown">
                        {filteredCars.map(car => (
                          <div key={car.id} className="dropdown-item" onClick={() => handleCarSelect(car)}>
                            <div className="dropdown-title"><strong>{car.brand} {car.model}</strong> ({car.year})</div>
                            <div className="dropdown-sub">Couleur: {car.color || 'Non spécifié'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-column">
                <div className="form-card">
                  <div className="card-header">
                    <Gauge size={16} className="text-emerald" />
                    <h4>Compteur & État Maintenance</h4>
                  </div>
                  <div className="input-group-row">
                    <div className="field-block">
                      <label>Kilométrage actuel (km)</label>
                      <input 
                        type="number" 
                        className="styled-input" 
                        value={formData.kilometrage} 
                        onChange={(e) => setFormData({...formData, kilometrage: parseInt(e.target.value) || 0})} 
                      />
                    </div>
                    <div className="field-block">
                      <label>Statut Vidange</label>
                      <select 
                        className="styled-select" 
                        value={formData.vidange_status} 
                        onChange={(e) => setFormData({...formData, vidange_status: e.target.value})}
                      >
                        <option value="done">Effectuée</option>
                        <option value="not done">À effectuer</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-card">
                  <div className="card-header">
                    <Calendar size={16} className="text-emerald" />
                    <h4>Conformité & Contrôles</h4>
                  </div>
                  <div className="input-group-row">
                    <div className="field-block">
                      <label>Visite Technique</label>
                      <input 
                        type="date" 
                        className="styled-input" 
                        value={formData.visit_tech} 
                        onChange={(e) => setFormData({...formData, visit_tech: e.target.value})} 
                      />
                    </div>
                    <div className="field-block">
                      <label>Expiration Assurance</label>
                      <input 
                        type="date" 
                        className="styled-input" 
                        value={formData.date_assurance} 
                        onChange={(e) => setFormData({...formData, date_assurance: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="field-block" style={{ marginTop: '12px' }}>
                    <label>Expiration Vignette / Taxe</label>
                    <input 
                      type="date" 
                      className="styled-input" 
                      value={formData.date_taxe_voiture} 
                      onChange={(e) => setFormData({...formData, date_taxe_voiture: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button type="button" className="btn-modal-secondary" onClick={() => { setShowMatriculeForm(false); setEditingMatricule(null); resetForm(); }}>
                Annuler
              </button>
              <button type="submit" className="btn-modal-primary" disabled={submitting}>
                {submitting ? "Sauvegarde..." : (editingMatricule ? "Sauvegarder les modifications" : "Enregistrer la plaque")}
              </button>
            </div>
          </form>
        </div>
      ) : showMatriculeDetails && selectedMatricule ? (
        /* --- REDESIGNED MATRICULE DETAILS VIEW --- */
        <div className="modal-glass-container">
          <div className="modal-header-hero info-hero">
            <div className="hero-left">
              <div className="hero-icon-wrapper info-glow">
                <Tag size={24} />
              </div>
              <div className="hero-text">
                <span className="hero-badge info-badge">Fiche Technique</span>
                <h2>Matricule #{selectedMatricule.id} — {selectedMatricule.matricule_code}</h2>
                <p>Gestion globale du suivi technique et administratif</p>
              </div>
            </div>
            <div className="hero-actions-right">
              <button onClick={() => { setShowMatriculeDetails(false); handleEdit(selectedMatricule); }} className="btn-hero-action">
                <Edit2 size={14} /> Modifier
              </button>
              <button onClick={() => handleOpenAccidentForm(selectedMatricule)} className="btn-hero-action danger">
                <AlertTriangle size={14} /> Accident
              </button>
              <button onClick={() => { setShowMatriculeDetails(false); setSelectedMatricule(null); }} className="hero-close-btn">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="modal-body-details">
            {/* Quick Overview Cards */}
            <div className="details-overview-grid">
              <div className="overview-card">
                <div className="overview-icon"><Car size={20} /></div>
                <div className="overview-info">
                  <span className="overview-label">Véhicule Rattaché</span>
                  <span className="overview-value">
                    {cars.find(c => c.id === selectedMatricule.car_id)?.brand} {cars.find(c => c.id === selectedMatricule.car_id)?.model}
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon"><Gauge size={20} /></div>
                <div className="overview-info">
                  <span className="overview-label">Kilométrage Compteur</span>
                  <span className="overview-value">{selectedMatricule.kilometrage?.toLocaleString()} km</span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon"><Activity size={20} /></div>
                <div className="overview-info">
                  <span className="overview-label">Statut Administratif</span>
                  <span className="overview-value">
                    <span className={`badge ${statusConfig[selectedMatricule.status]?.bg || 'badge-rented'}`}>
                      {statusConfig[selectedMatricule.status]?.label || selectedMatricule.status}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Maintenance Panel */}
            <div className="maintenance-glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Wrench size={18} className="text-emerald" />
                  <h3>Plan de Maintenance & Carnet de Santé</h3>
                </div>

                {(() => {
                  const progress = calculateRequiredTasksProgress(selectedMatricule);
                  return (
                    <div className="progress-badge-wrapper">
                      <div className="progress-bar-container">
                        <div className="progress-fill" style={{ width: `${progress.percentage}%` }}></div>
                      </div>
                      <span className="progress-text">
                        {progress.completed}/{progress.total} complété ({Math.round(progress.percentage)}%)
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="tab-navigation">
                <button className={`tab-btn ${activeMaintenanceTab === 'required' ? 'active' : ''}`} onClick={() => setActiveMaintenanceTab('required')}>
                  Obligatoires (Vidange)
                </button>
                <button className={`tab-btn ${activeMaintenanceTab === 'optional' ? 'active' : ''}`} onClick={() => setActiveMaintenanceTab('optional')}>
                  Filtres & Organes Secundaires
                </button>
                <button className={`tab-btn ${activeMaintenanceTab === 'additional' ? 'active' : ''}`} onClick={() => setActiveMaintenanceTab('additional')}>
                  Éléments Personnalisés
                </button>
              </div>

              <div className="tab-content-container">
                {activeMaintenanceTab === 'required' && (
                  <div className="cards-auto-grid">
                    {/* Huile */}
                    <div className="maintenance-item-card">
                      <div className="item-card-header">
                        <span className="item-title"><Droplet size={16} className="text-emerald" /> Huile Moteur</span>
                        <span className={`badge ${getMaintenanceStatus(selectedMatricule, 'oil') ? 'badge-available' : 'badge-rented'}`}>
                          {getMaintenanceStatus(selectedMatricule, 'oil') ? 'À jour' : 'À faire'}
                        </span>
                      </div>
                      <div className="item-card-body">
                        <p>Total injecté : <strong>{getMaintenanceValue(selectedMatricule, 'oil').total.toFixed(1)} L</strong></p>
                        <p>Dernière révision : {formatDate(getMaintenanceValue(selectedMatricule, 'oil').lastDate)}</p>
                      </div>
                      <button onClick={() => setShowAddForm(showAddForm === 'oil' ? null : 'oil')} className="btn-item-action">
                        + Enregistrer Vidange
                      </button>
                      {showAddForm === 'oil' && (
                        <div className="mini-form-popover">
                          <input type="number" step="0.1" placeholder="Quantité (Liters)" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} className="styled-input compact" />
                          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="styled-input compact" />
                          <button onClick={handleAddOil} disabled={submitting} className="btn-modal-primary compact">Valider</button>
                        </div>
                      )}
                    </div>

                    {/* Filtre Huile */}
                    <div className="maintenance-item-card">
                      <div className="item-card-header">
                        <span className="item-title"><Filter size={16} className="text-emerald" /> Filtre à Huile</span>
                        <span className={`badge ${getMaintenanceStatus(selectedMatricule, 'filter_oil') ? 'badge-available' : 'badge-rented'}`}>
                          {getMaintenanceStatus(selectedMatricule, 'filter_oil') ? 'À jour' : 'À faire'}
                        </span>
                      </div>
                      <div className="item-card-body">
                        <p>Remplacements effectués : <strong>{getMaintenanceValue(selectedMatricule, 'filter_oil').total}</strong></p>
                        <p>Dernier remplacement : {formatDate(getMaintenanceValue(selectedMatricule, 'filter_oil').lastDate)}</p>
                      </div>
                      <button onClick={() => setShowAddForm(showAddForm === 'filter_oil' ? null : 'filter_oil')} className="btn-item-action">
                        + Changer le Filtre
                      </button>
                      {showAddForm === 'filter_oil' && (
                        <div className="mini-form-popover">
                          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="styled-input compact" />
                          <button onClick={handleAddFilterOil} disabled={submitting} className="btn-modal-primary compact">Confirmer</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeMaintenanceTab === 'optional' && (
                  <div className="cards-auto-grid">
                    {/* Filtre Air */}
                    <div className="maintenance-item-card">
                      <div className="item-card-header">
                        <span className="item-title"><Wind size={16} /> Filtre à Air</span>
                        <span className={`badge ${getMaintenanceStatus(selectedMatricule, 'filter_air') ? 'badge-available' : 'badge-rented'}`}>
                          {getMaintenanceStatus(selectedMatricule, 'filter_air') ? 'À jour' : 'À faire'}
                        </span>
                      </div>
                      <div className="item-card-body">
                        <p>Total interventions : <strong>{getMaintenanceValue(selectedMatricule, 'filter_air').total}</strong></p>
                        <p>Date : {formatDate(getMaintenanceValue(selectedMatricule, 'filter_air').lastDate)}</p>
                      </div>
                      <button onClick={() => setShowAddForm(showAddForm === 'filter_air' ? null : 'filter_air')} className="btn-item-action">
                        + Changer le filtre
                      </button>
                      {showAddForm === 'filter_air' && (
                        <div className="mini-form-popover">
                          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="styled-input compact" />
                          <button onClick={handleAddFilterAir} disabled={submitting} className="btn-modal-primary compact">Confirmer</button>
                        </div>
                      )}
                    </div>

                    {/* Paquets Frein */}
                    <div className="maintenance-item-card">
                      <div className="item-card-header">
                        <span className="item-title"><CircleStop size={16} /> Plaquettes de Frein</span>
                        <span className={`badge ${getMaintenanceStatus(selectedMatricule, 'paquets_de_frein') ? 'badge-available' : 'badge-rented'}`}>
                          {getMaintenanceStatus(selectedMatricule, 'paquets_de_frein') ? 'À jour' : 'À faire'}
                        </span>
                      </div>
                      <div className="item-card-body">
                        <p>Nombre de jeux : <strong>{getMaintenanceValue(selectedMatricule, 'paquets_de_frein').total}</strong></p>
                        <p>Date : {formatDate(getMaintenanceValue(selectedMatricule, 'paquets_de_frein').lastDate)}</p>
                      </div>
                      <button onClick={() => setShowAddForm(showAddForm === 'paquets_de_frein' ? null : 'paquets_de_frein')} className="btn-item-action">
                        + Remplacer Plaquettes
                      </button>
                      {showAddForm === 'paquets_de_frein' && (
                        <div className="mini-form-popover">
                          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="styled-input compact" />
                          <button onClick={handleAddBrakePads} disabled={submitting} className="btn-modal-primary compact">Confirmer</button>
                        </div>
                      )}
                    </div>

                    {/* AdBlue */}
                    <div className="maintenance-item-card">
                      <div className="item-card-header">
                        <span className="item-title"><Droplets size={16} /> Niveau AdBlue</span>
                        <span className={`badge ${getMaintenanceStatus(selectedMatricule, 'ad_blue') ? 'badge-available' : 'badge-rented'}`}>
                          {getMaintenanceStatus(selectedMatricule, 'ad_blue') ? 'À jour' : 'À faire'}
                        </span>
                      </div>
                      <div className="item-card-body">
                        <p>Volume total : <strong>{getMaintenanceValue(selectedMatricule, 'ad_blue').total.toFixed(1)} L</strong></p>
                        <p>Date : {formatDate(getMaintenanceValue(selectedMatricule, 'ad_blue').lastDate)}</p>
                      </div>
                      <button onClick={() => setShowAddForm(showAddForm === 'ad_blue' ? null : 'ad_blue')} className="btn-item-action">
                        + Recharger AdBlue
                      </button>
                      {showAddForm === 'ad_blue' && (
                        <div className="mini-form-popover">
                          <input type="number" step="0.1" placeholder="Quantité (L)" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} className="styled-input compact" />
                          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="styled-input compact" />
                          <button onClick={handleAddAdBlue} disabled={submitting} className="btn-modal-primary compact">Confirmer</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeMaintenanceTab === 'additional' && (
                  <div>
                    <button onClick={() => setShowAddForm(showAddForm === 'additional' ? null : 'additional')} className="btn-modal-primary compact" style={{ marginBottom: '16px' }}>
                      <Plus size={14} /> Ajouter un composant
                    </button>

                    {showAddForm === 'additional' && (
                      <div className="form-card" style={{ marginBottom: '16px' }}>
                        <div className="input-group-row">
                          <div className="field-block">
                            <label>Désignation</label>
                            <input type="text" value={additionalItemName} onChange={(e) => setAdditionalItemName(e.target.value)} className="styled-input" placeholder="Ex: Essuie-glaces, Ampoules..." />
                          </div>
                          <div className="field-block">
                            <label>Type de suivi</label>
                            <select value={additionalItemType} onChange={(e) => setAdditionalItemType(e.target.value)} className="styled-select">
                              <option value="quantity">Quantité/Volume</option>
                              <option value="note">Annotation Libre</option>
                            </select>
                          </div>
                        </div>
                        <div className="input-group-row" style={{ marginTop: '12px' }}>
                          {additionalItemType === 'quantity' && (
                            <div className="field-block">
                              <label>Valeur initiale</label>
                              <input type="number" step="0.1" value={additionalItemQuantity} onChange={(e) => setAdditionalItemQuantity(e.target.value)} className="styled-input" />
                            </div>
                          )}
                          <div className="field-block checkbox-block">
                            <label className="styled-checkbox-label">
                              <input type="checkbox" checked={additionalItemRequired} onChange={(e) => setAdditionalItemRequired(e.target.checked)} />
                              Inclus dans les exigences de vidange
                            </label>
                          </div>
                        </div>
                        <button onClick={handleAddAdditionalItem} disabled={submitting} className="btn-modal-primary compact" style={{ marginTop: '12px' }}>
                          Enregistrer la configuration
                        </button>
                      </div>
                    )}

                    <div className="additional-list">
                      {selectedMatricule.additional_maintenance?.length > 0 ? (
                        selectedMatricule.additional_maintenance.map((item, idx) => (
                          <div key={idx} className="additional-row-item">
                            <div>
                              <strong>{item.name}</strong> <span className="type-tag">({item.type})</span>
                            </div>
                            {item.required_for_vidange && <span className="badge badge-amber compact">Obligatoire</span>}
                          </div>
                        ))
                      ) : (
                        <p className="empty-text">Aucun composant additionnel enregistré.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* --- MAIN MATRICULES LIST --- */
        <div className="admin-smaiti-page">
          <div>
            <div className="smaiti-topbar">
              <div className="smaiti-logo-area">
                <span className="smaiti-brand">SMAITI LUXE</span>
                <span className="smaiti-flotte">Immatriculations</span>
              </div>
              <div className="smaiti-right-actions">
                <div className="smaiti-search-bar">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Rechercher plaque/voiture..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
                <button className="smaiti-notif-btn"><Bell size={16} /></button>
                <button onClick={refreshData} className="smaiti-notif-btn" title="Actualiser"><RefreshCw size={16} /></button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div><p className="stat-label">Total Immatriculations</p><p className="stat-number">{stats.total}</p></div>
                <Tag size={28} className="stat-icon" />
              </div>
              <div className="stat-card">
                <div><p className="stat-label">Actifs</p><p className="stat-number" style={{ color: '#16a34a' }}>{stats.active}</p></div>
                <CheckCircle2 size={28} className="stat-icon" style={{ color: '#16a34a' }} />
              </div>
              <div className="stat-card">
                <div><p className="stat-label">Inactifs / Vendus</p><p className="stat-number" style={{ color: '#dc2626' }}>{stats.inactive}</p></div>
                <XCircle size={28} className="stat-icon" style={{ color: '#dc2626' }} />
              </div>
              <div className="stat-card">
                <div><p className="stat-label">Total Kilométrage</p><p className="stat-number" style={{ color: '#0d4734' }}>{stats.totalKm.toLocaleString()} km</p></div>
                <Gauge size={28} className="stat-icon" style={{ color: '#0d4734' }} />
              </div>
            </div>

            <div className="smaiti-actions-wrapper">
              <span className="smaiti-count">{filteredMatricules.length} enregistrement(s)</span>
              <div className="smaiti-actions-buttons">
                <select 
                  className="status-select-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="sold">Vendu</option>
                </select>
                <button onClick={handleExport} className="btn btn-secondary"><Save size={14} /> Exporter</button>
                <button onClick={handleAddNew} className="btn btn-primary"><Plus size={14} /> Ajouter matricule</button>
              </div>
            </div>

            <div className="smaiti-table-container">
              <table className="smaiti-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("id")} className="sortable-header">ID {getSortIcon("id")}</th>
                    <th onClick={() => handleSort("matricule")} className="sortable-header">Plaque {getSortIcon("matricule")}</th>
                    <th onClick={() => handleSort("car")} className="sortable-header">Véhicule associé {getSortIcon("car")}</th>
                    <th onClick={() => handleSort("kilometrage")} className="sortable-header">Kilométrage {getSortIcon("kilometrage")}</th>
                    <th>Visite Tech</th>
                    <th>Assurance</th>
                    <th>Vignette</th>
                    <th>Vidange</th>
                    <th onClick={() => handleSort("status")} className="sortable-header">Statut {getSortIcon("status")}</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMatricules.map((mat) => {
                    const car = cars.find(c => c.id === mat.car_id);
                    const visitTechInfo = getDateStatusInfo(mat.visit_tech);
                    const assuranceInfo = getDateStatusInfo(mat.date_assurance);
                    const taxeInfo = getDateStatusInfo(mat.date_taxe_voiture);
                    const vidangeProgress = calculateRequiredTasksProgress(mat);

                    return (
                      <tr key={mat.id}>
                        <td style={{ fontWeight: 500 }}>#{mat.id}</td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{mat.matricule_code}</td>
                        <td>{car ? `${car.brand} ${car.model}` : 'Non assigné'}</td>
                        <td style={{ fontWeight: 600, color: '#0d4734' }}>{mat.kilometrage ? `${mat.kilometrage.toLocaleString()} km` : '0 km'}</td>
                        <td>
                          {mat.visit_tech ? (
                            <span className={visitTechInfo?.class || 'badge badge-published'}>
                              {formatDate(mat.visit_tech)}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {mat.date_assurance ? (
                            <span className={assuranceInfo?.class || 'badge badge-published'}>
                              {formatDate(mat.date_assurance)}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {mat.date_taxe_voiture ? (
                            <span className={taxeInfo?.class || 'badge badge-published'}>
                              {formatDate(mat.date_taxe_voiture)}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <span className={`badge ${vidangeProgress.isVidangeDone ? 'badge-available' : 'badge-rented'}`}>
                            {vidangeProgress.isVidangeDone ? 'Effectuée' : 'À faire'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${statusConfig[mat.status]?.bg || 'badge-rented'}`}>
                            {statusConfig[mat.status]?.label || mat.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-icons">
                            <button className="action-btn view" onClick={() => handleViewDetails(mat)} title="Détails">
                              <Eye size={14} />
                            </button>
                            <button className="action-btn accident" onClick={() => handleOpenAccidentForm(mat)} title="Accident">
                              <AlertTriangle size={14} />
                            </button>
                            <button className="action-btn edit" onClick={() => handleEdit(mat)} title="Modifier">
                              <Edit2 size={14} />
                            </button>
                            <button className="action-btn delete" onClick={() => handleDeleteClick(mat)} title="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  totalItems={filteredMatricules.length}
                />
              )}
            </div>
          </div>

          {/* DELETE MODAL */}
          {deleteModalOpen && matriculeToDelete && (
            <div className="delete-modal-overlay">
              <div className="delete-modal-card">
                <div className="delete-icon-box"><TrashIcon size={24} /></div>
                <h3>Confirmer la suppression</h3>
                <p>Êtes-vous sûr de vouloir supprimer <br/> <strong>{matriculeToDelete.matricule_code}</strong> ?</p>
                <div className="delete-actions">
                  <button className="modal-btn-cancel" onClick={() => setDeleteModalOpen(false)}>Annuler</button>
                  <button className="modal-btn-delete" onClick={confirmDelete}>Supprimer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- REDESIGNED MODALS & COMPONENTS STYLES --- */}
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

        .smaiti-table-container {
          background: white; border-radius: 12px;
          border: 1px solid #e2e8f0; 
          overflow-x: auto; 
          overflow-y: visible;
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
        .badge.compact { padding: 2px 6px; font-size: 0.6rem; }
        .badge-available { background: #e6f7ec; color: #0f973d; }
        .badge-rented { background: #fff3e6; color: #b45309; }
        .badge-published { background: #e7f3ef; color: #0d4734; }
        .badge-amber { background: #fef3c7; color: #92400e; }

        .real-status.compact { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: 0.5rem; font-size: 0.6rem; font-weight: 500; }
        .real-status.available { background: #dcfce7; color: #166534; }
        .real-status.unavailable { background: #fee2e2; color: #991b1b; }

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

        /* Hero Header Variants */
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

        .hero-actions-right { display: flex; align-items: center; gap: 10px; }
        .btn-hero-action {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 30px; border: 1px solid #cbd5e1;
          background: white; font-size: 0.8rem; font-weight: 600; color: #334155;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-hero-action:hover { background: #f8fafc; border-color: #94a3b8; }
        .btn-hero-action.danger { border-color: #fca5a5; color: #dc2626; }
        .btn-hero-action.danger:hover { background: #fef2f2; }

        /* Form Structure */
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

        /* Details Modal View Formatting */
        .modal-body-details { padding: 24px 32px; }
        .details-overview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }

        .overview-card {
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 14px 16px; display: flex; align-items: center; gap: 14px;
        }
        .overview-icon {
          width: 40px; height: 40px; border-radius: 10px; background: white;
          border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center;
          color: #0d4734;
        }
        .overview-info { display: flex; flex-direction: column; }
        .overview-label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; color: #64748b; }
        .overview-value { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-top: 2px; }

        .maintenance-glass-panel {
          background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;
        }
        .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .panel-title { display: flex; align-items: center; gap: 8px; }
        .panel-title h3 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }

        .progress-badge-wrapper { display: flex; align-items: center; gap: 10px; }
        .progress-bar-container { width: 100px; height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: #0f973d; transition: width 0.3s; }
        .progress-text { font-size: 0.75rem; font-weight: 600; color: #475569; }

        .tab-navigation { display: flex; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 16px; }
        .tab-btn {
          padding: 6px 14px; border-radius: 20px; border: none; background: transparent;
          font-size: 0.8rem; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.2s;
        }
        .tab-btn.active { background: #e7f3ef; color: #0d4734; }

        .cards-auto-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
        .maintenance-item-card {
          border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #fafafa;
        }
        .item-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .item-title { font-size: 0.85rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px; }
        .item-card-body p { font-size: 0.78rem; color: #64748b; margin: 4px 0; }

        .btn-item-action {
          width: 100%; padding: 6px 0; border: 1px dashed #cbd5e1; border-radius: 6px;
          background: white; font-size: 0.75rem; font-weight: 600; color: #0d4734;
          cursor: pointer; margin-top: 10px; transition: 0.2s;
        }
        .btn-item-action:hover { background: #e7f3ef; border-color: #0d4734; }

        .mini-form-popover { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0; }
        .styled-input.compact { padding: 6px; font-size: 0.75rem; }
        .btn-modal-primary.compact { padding: 6px 12px; font-size: 0.75rem; border-radius: 6px; }

        .additional-row-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;
        }
        .type-tag { font-size: 0.7rem; color: #64748b; font-weight: normal; }

        .delete-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1001; }
        .delete-modal-card { background: white; border-radius: 20px; padding: 32px; max-width: 400px; width: 100%; text-align: center; }
        .delete-icon-box { width: 48px; height: 48px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #dc2626; }
        .delete-modal-card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; }
        .delete-modal-card p { color: #64748b; font-size: 0.875rem; margin-bottom: 24px; }
        .delete-actions { display: flex; gap: 12px; }
        .modal-btn-cancel { flex: 1; background: #f1f5f9; border: none; padding: 10px; border-radius: 40px; cursor: pointer; font-weight: 500; }
        .modal-btn-delete { flex: 1; background: #dc2626; color: white; border: none; padding: 10px; border-radius: 40px; cursor: pointer; font-weight: 500; }

        @media (max-width: 1024px) {
          .modal-grid-2 { grid-template-columns: 1fr; }
          .details-overview-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}