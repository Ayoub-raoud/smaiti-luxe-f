// src/pages/admin/AdminClients.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  selectClients,
  selectClientsLoading,
  fetchReservations,
  selectReservations,
  fetchAccidents,
  selectAccidents,
  selectCars,
  selectMatricules,
} from "../../Redux/store";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  RefreshCw,
  User,
  Phone,
  Mail,
  IdCard,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  Save,
  TrashIcon,
  Users,
  Building2,
  UserCheck,
  Camera,
  Upload,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Gift,
  Star,
  Clock,
  Shield,
  Eye,
  DollarSign,
  History,
  Receipt,
  Car,
  AlertCircle,
  CheckCircle,
  FileWarning,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  Sparkles,
  Gem,
  Award,
  Heart,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  Activity,
  Key,
  Lock,
  Unlock,
  Crown,
  Briefcase,
  ArrowLeft,
  Download,
  ExternalLink,
  Bell,
  Globe,
} from "lucide-react";
import { getImageUrl } from "../../utils/imageUtils";
import PaginationControls from "../../components/PaginationControls";

export default function AdminClients() {
  const dispatch = useDispatch();
  const clients = useSelector(selectClients);
  const loading = useSelector(selectClientsLoading);
  const reservations = useSelector(selectReservations);
  const accidents = useSelector(selectAccidents);
  const cars = useSelector(selectCars);
  const matricules = useSelector(selectMatricules);

  const [showClientForm, setShowClientForm] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cinPreview, setCinPreview] = useState("");
  const [licensePreview, setLicensePreview] = useState("");
  const [activeTab, setActiveTab] = useState("reservations");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Pagination for main table
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination for details tabs (10 per page)
  const [detailsReservationsPage, setDetailsReservationsPage] = useState(1);
  const [detailsAccidentsPage, setDetailsAccidentsPage] = useState(1);
  const [detailsPaymentsPage, setDetailsPaymentsPage] = useState(1);
  const detailsItemsPerPage = 10;

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    city: "",
    cin_number: "",
    driver_license_number: "",
    cin_image: "",
    driver_license_image: "",
    date_naissance: "",
    lieu_naissance: "",
    cin_delivre_le: "",
    permis_delivre_le: "",
  });

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

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        dispatch(fetchClients()),
        dispatch(fetchReservations()),
        dispatch(fetchAccidents()),
      ]);
      setDataLoaded(true);
    };
    loadData();
  }, [dispatch]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field)
      return <ArrowUpDown size={12} className="sort-icon" />;
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="sort-icon active" />
    ) : (
      <ArrowDown size={12} className="sort-icon active" />
    );
  };

  const getCarForReservation = (reservation) => {
    if (reservation.car) return reservation.car;
    if (reservation.car_id && cars && cars.length > 0) {
      return cars.find((c) => c.id === reservation.car_id);
    }
    return null;
  };

  const getMatriculeForReservation = (reservation) => {
    if (reservation.matricule) return reservation.matricule;
    if (reservation.matricule_id && matricules && matricules.length > 0) {
      return matricules.find((m) => m.id === reservation.matricule_id);
    }
    return null;
  };

  const handleFileChange = (field, file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result });
        if (field === "cin_image") setCinPreview(reader.result);
        if (field === "driver_license_image")
          setLicensePreview(reader.result);
      };
      reader.onerror = () => {
        toast.error("Erreur lors de la lecture du fichier");
      };
      reader.readAsDataURL(file);
    }
  };

  const getClientReservations = (clientId) => {
    if (!reservations || !Array.isArray(reservations)) return [];
    return reservations
      .filter((r) => r.client_id === clientId)
      .sort(
        (a, b) =>
          new Date(b.created_at || b.start_date) -
          new Date(a.created_at || a.start_date)
      );
  };

  const getClientAccidents = (clientId) => {
    if (!accidents || !Array.isArray(accidents)) return [];
    return accidents
      .filter((a) => a.client_id === clientId)
      .sort(
        (a, b) =>
          new Date(b.date_accident) - new Date(a.date_accident)
      );
  };

  const getClientStats = (clientId) => {
    const clientReservations = getClientReservations(clientId);
    const totalSpent = clientReservations.reduce(
      (sum, r) => sum + (Number(r.total_price) || 0),
      0
    );
    const totalPaid = clientReservations.reduce(
      (sum, r) => sum + (Number(r.amount_paid) || 0),
      0
    );
    const totalRemaining = clientReservations.reduce(
      (sum, r) => sum + (Number(r.remaining_amount) || 0),
      0
    );
    const activeReservations = clientReservations.filter(
      (r) => r.status === "confirmed" || r.status === "retard"
    ).length;
    const completedReservations = clientReservations.filter(
      (r) => r.status === "completed"
    ).length;
    const cancelledReservations = clientReservations.filter(
      (r) => r.status === "cancelled"
    ).length;
    const accidentCount = getClientAccidents(clientId).length;
    return {
      totalSpent,
      totalPaid,
      totalRemaining,
      activeReservations,
      completedReservations,
      cancelledReservations,
      totalReservations: clientReservations.length,
      accidentCount,
    };
  };

  const filteredClients =
    clients && Array.isArray(clients)
      ? clients
          .filter(
            (c) =>
              searchTerm === "" ||
              `${c.prenom} ${c.nom}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              c.telephone?.includes(searchTerm) ||
              c.cin_number?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .sort((a, b) => {
            let aVal, bVal;
            switch (sortField) {
              case "id":
                aVal = a.id;
                bVal = b.id;
                break;
              case "name":
                aVal = `${a.prenom} ${a.nom}`.toLowerCase();
                bVal = `${b.prenom} ${b.nom}`.toLowerCase();
                break;
              case "telephone":
                aVal = a.telephone || "";
                bVal = b.telephone || "";
                break;
              case "cin":
                aVal = a.cin_number || "";
                bVal = b.cin_number || "";
                break;
              case "city":
                aVal = a.city || "";
                bVal = b.city || "";
                break;
              default:
                aVal = a.id;
                bVal = b.id;
            }
            if (sortDirection === "asc") {
              return aVal > bVal ? 1 : -1;
            } else {
              return aVal < bVal ? 1 : -1;
            }
          })
      : [];

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Details pagination helpers
  const getPaginatedReservations = (clientId) => {
    const all = getClientReservations(clientId);
    const total = all.length;
    const start = (detailsReservationsPage - 1) * detailsItemsPerPage;
    const end = start + detailsItemsPerPage;
    return {
      items: all.slice(start, end),
      total,
      totalPages: Math.ceil(total / detailsItemsPerPage),
    };
  };

  const getPaginatedAccidents = (clientId) => {
    const all = getClientAccidents(clientId);
    const total = all.length;
    const start = (detailsAccidentsPage - 1) * detailsItemsPerPage;
    const end = start + detailsItemsPerPage;
    return {
      items: all.slice(start, end),
      total,
      totalPages: Math.ceil(total / detailsItemsPerPage),
    };
  };

  const getPaginatedPayments = (clientId) => {
    const allReservations = getClientReservations(clientId);
    const withPayments = allReservations.filter(
      (r) => getPaymentHistoryArray(r).length > 0 || (r.amount_paid || 0) > 0
    );
    const total = withPayments.length;
    const start = (detailsPaymentsPage - 1) * detailsItemsPerPage;
    const end = start + detailsItemsPerPage;
    return {
      items: withPayments.slice(start, end),
      total,
      totalPages: Math.ceil(total / detailsItemsPerPage),
    };
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { class: "badge-warning", label: "En attente", icon: Clock },
      confirmed: { class: "badge-success", label: "Confirmée", icon: CheckCircle },
      contacted: { class: "badge-purple", label: "Contacté", icon: Phone },
      completed: { class: "badge-blue", label: "Terminée", icon: CheckCircle },
      cancelled: { class: "badge-gray", label: "Annulée", icon: X },
      retard: { class: "badge-danger", label: "En retard", icon: AlertTriangle },
    };
    const c = config[status] || config.pending;
    const IconComponent = c.icon;
    return (
      <span className={`badge ${c.class}`}>
        <IconComponent size={12} />
        {c.label}
      </span>
    );
  };

  const getAccidentStatusBadge = (status) => {
    const config = {
      pending: { class: "badge-warning", label: "En attente" },
      evaluation_owner: { class: "badge-info", label: "Évaluation propriétaire" },
      "contact expert": { class: "badge-purple", label: "Contact expert" },
      evaluation_expert: { class: "badge-info", label: "Évaluation expert" },
      fixed: { class: "badge-blue", label: "Réparation" },
      waiting: { class: "badge-warning", label: "En attente" },
      completed: { class: "badge-success", label: "Terminé" },
    };
    const c = config[status] || { class: "badge-gray", label: status };
    return <span className={`badge ${c.class}`}>{c.label}</span>;
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

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
    }).format(num);
  };

  const getPaymentHistoryArray = (reservation) => {
    if (!reservation.payment_history) return [];
    if (Array.isArray(reservation.payment_history))
      return reservation.payment_history;
    if (typeof reservation.payment_history === "string") {
      try {
        const parsed = JSON.parse(reservation.payment_history);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const downloadFile = async (url, filename) => {
    try {
      toast.info("Téléchargement en cours...");
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success("Téléchargement terminé");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const isPdfFile = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (lower.startsWith("data:application/pdf")) return true;
    if (lower.endsWith(".pdf")) return true;
    return false;
  };

  const renderDocumentPreview = (url, label) => {
    if (!url) return null;
    const fullUrl = getImageUrl(url);
    if (!fullUrl) return null;
    const isPdf = isPdfFile(fullUrl);
    const filename =
      fullUrl.split("/").pop() ||
      `${label.toLowerCase().replace(/\s/g, "_")}.pdf`;

    if (isPdf) {
      return (
        <div className="document-card pdf-card">
          <div className="pdf-icon-wrapper">
            <FileText size={48} className="pdf-icon" />
          </div>
          <div className="pdf-actions">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pdf-action-btn view"
            >
              <ExternalLink size={14} /> Voir PDF
            </a>
            <button
              onClick={() => downloadFile(fullUrl, filename)}
              className="pdf-action-btn download"
            >
              <Download size={14} /> Télécharger
            </button>
          </div>
          <span className="document-label">{label}</span>
        </div>
      );
    }
    return (
      <div className="document-card">
        <img src={fullUrl} alt={label} className="document-image" />
        <span className="document-label">{label}</span>
      </div>
    );
  };

  const renderFormDocumentPreview = (dataUrl, label, onRemove) => {
    if (!dataUrl) return null;
    const isPdf = isPdfFile(dataUrl);
    const filename =
      `${label.toLowerCase().replace(/\s/g, "_")}.pdf`;

    if (isPdf) {
      return (
        <div className="image-preview-container pdf-preview-container">
          <div className="pdf-icon-wrapper">
            <FileText size={40} className="pdf-icon" />
          </div>
          <div className="pdf-actions small">
            <a
              href={dataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pdf-action-btn view"
            >
              <ExternalLink size={12} /> Voir
            </a>
            <button
              onClick={() => downloadFile(dataUrl, filename)}
              className="pdf-action-btn download"
            >
              <Download size={12} /> Télécharger
            </button>
          </div>
          <button
            type="button"
            className="remove-image-btn"
            onClick={onRemove}
          >
            <X size={14} /> Supprimer
          </button>
        </div>
      );
    }
    return (
      <div className="image-preview-container">
        <img src={dataUrl} alt={label} className="image-preview" />
        <button
          type="button"
          className="remove-image-btn"
          onClick={onRemove}
        >
          <X size={14} /> Supprimer
        </button>
      </div>
    );
  };

  const handleCreateClient = async (data) => {
    setSubmitting(true);
    try {
      await dispatch(createClient(data)).unwrap();
      toast.success("Client ajouté avec succès!");
      setShowClientForm(false);
      setEditingClient(null);
      setCinPreview("");
      setLicensePreview("");
      await dispatch(fetchClients(true));
      resetForm();
    } catch (error) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClient = async (data) => {
    setSubmitting(true);
    try {
      await dispatch(updateClient({ id: editingClient.id, data })).unwrap();
      toast.success("Client modifié avec succès!");
      setShowClientForm(false);
      setEditingClient(null);
      setCinPreview("");
      setLicensePreview("");
      await dispatch(fetchClients(true));
      resetForm();
    } catch (error) {
      toast.error(error.message || "Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email || "",
      city: client.city || "",
      cin_number: client.cin_number || "",
      driver_license_number: client.driver_license_number || "",
      cin_image: client.cin_image || "",
      driver_license_image: client.driver_license_image || "",
      date_naissance: formatDateForInput(client.date_naissance),
      lieu_naissance: client.lieu_naissance || "",
      cin_delivre_le: formatDateForInput(client.cin_delivre_le),
      permis_delivre_le: formatDateForInput(client.permis_delivre_le),
    });
    setCinPreview(client.cin_image_url || "");
    setLicensePreview(client.driver_license_image_url || "");
    setShowClientForm(true);
  };

  const handleAddNew = () => {
    setEditingClient(null);
    resetForm();
    setCinPreview("");
    setLicensePreview("");
    setShowClientForm(true);
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      city: "",
      cin_number: "",
      driver_license_number: "",
      cin_image: "",
      driver_license_image: "",
      date_naissance: "",
      lieu_naissance: "",
      cin_delivre_le: "",
      permis_delivre_le: "",
    });
  };

  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    const result = await dispatch(deleteClient(clientToDelete.id));
    if (result.error) toast.error(result.payload);
    else {
      toast.success("Client supprimé avec succès");
      await dispatch(fetchClients(true));
    }
    setDeleteModalOpen(false);
    setClientToDelete(null);
  };

  const openDetails = (client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
    setActiveTab("reservations");
    // Reset pagination for details tabs
    setDetailsReservationsPage(1);
    setDetailsAccidentsPage(1);
    setDetailsPaymentsPage(1);
  };

  const refreshData = async () => {
    await Promise.all([
      dispatch(fetchClients(true)),
      dispatch(fetchReservations(true)),
      dispatch(fetchAccidents(true)),
    ]);
    toast.success("Données actualisées");
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Nom",
      "Prénom",
      "Téléphone",
      "Email",
      "Ville",
      "CIN",
      "Permis",
      "Date naissance",
      "Lieu naissance",
    ];
    const csvData = filteredClients.map((c) =>
      [
        c.id,
        `"${c.nom}"`,
        `"${c.prenom}"`,
        c.telephone,
        c.email || "",
        c.city || "",
        c.cin_number || "",
        c.driver_license_number || "",
        c.date_naissance || "",
        c.lieu_naissance || "",
      ].join(",")
    );
    const blob = new Blob(
      [headers.join(",") + "\n" + csvData.join("\n")],
      { type: "text/csv" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV effectué");
  };

  const stats = {
    total: clients?.length || 0,
    withCin: clients?.filter((c) => c.cin_number).length || 0,
    withLicense: clients?.filter((c) => c.driver_license_number).length || 0,
    withEmail: clients?.filter((c) => c.email).length || 0,
  };

  if (loading && !dataLoaded)
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement des clients...</p>
      </div>
    );

  return (
    <div className="admin-smaiti-page">
      <style>{`
        /* ----- RESET & BASE (matching AdminCars) ----- */
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

        /* TABLE - made bigger */
        .smaiti-table-container {
          background: white; border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .smaiti-table {
          width: 100%; border-collapse: collapse; font-size: 0.875rem; /* increased from 0.75rem */
          min-width: 900px;
        }
        .smaiti-table thead { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .smaiti-table th {
          text-align: left; padding: 12px 14px; /* increased padding */
          color: #64748b; font-weight: 600; font-size: 0.7rem; text-transform: uppercase;
          white-space: nowrap;
        }
        .smaiti-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: 0.2s; }
        .smaiti-table tbody tr:last-child { border-bottom: none; }
        .smaiti-table tbody tr:hover { background: #f8fafc; }
        .smaiti-table td { padding: 10px 14px; vertical-align: middle; white-space: nowrap; } /* increased padding */

        .sortable-header { cursor: pointer; user-select: none; }
        .sort-icon { opacity: 0.5; vertical-align: middle; margin-left: 4px; }
        .sort-icon.active { opacity: 1; color: #0d4734; }

        .badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 10px; border-radius: 40px; font-weight: 500; font-size: 0.7rem;
          white-space: nowrap;
        }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .badge-purple { background: #f3e8ff; color: #6b21a5; }
        .badge-gray { background: #f1f5f9; color: #475569; }
        .badge-info { background: #e0f2fe; color: #0369a1; }

        .action-icons { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
        .action-btn {
          width: 32px; height: 32px; border-radius: 50%;
          border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s; background: transparent;
        }
        .action-btn.edit { background: #f1f5f9; color: #64748b; }
        .action-btn.delete { background: #fee2e2; color: #ef4444; }
        .action-btn.view { background: #dbeafe; color: #3b82f6; }
        .action-btn:hover { transform: scale(1.05); }
        .action-btn svg { width: 16px; height: 16px; }

        /* INLINE FORM (matching AdminCars) */
        .inline-form-container {
          background: white; border-radius: 24px; margin: 1.5rem;
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
        .inline-input, .inline-select {
          padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 12px;
          font-size: 0.875rem; transition: all 0.2s; background: white; font-family: inherit; color: #0f172a;
        }
        .inline-input:focus, .inline-select:focus {
          outline: none; border-color: #0d4734; box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.1);
        }
        .inline-info-message {
          background: #f0fdf4; border: 1px solid #86efac;
          border-radius: 12px; padding: 12px 16px;
          display: flex; align-items: center; gap: 10px;
          font-size: 0.75rem; color: #166534; margin-top: 16px;
        }
        .inline-info-grid { display: flex; flex-direction: column; gap: 12px; }
        .inline-info-item {
          display: flex; justify-content: space-between; padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .inline-info-item .info-label { font-size: 0.75rem; color: #64748b; }
        .inline-info-item .info-value { font-size: 0.875rem; font-weight: 500; color: #0f172a; }

        .image-upload-area {
          border: 2px dashed #e2e8f0; border-radius: 16px;
          padding: 24px; text-align: center; cursor: pointer;
          transition: all 0.2s; background: #fafbfc;
        }
        .image-upload-area:hover { border-color: #0d4734; background: #f0fdf4; }
        .image-upload-area svg { color: #64748b; }
        .image-preview-container { margin-top: 16px; text-align: center; }
        .image-preview {
          width: 150px; height: 150px; object-fit: cover;
          border-radius: 16px; border: 2px solid #e2e8f0;
        }
        .remove-image-btn {
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 8px; padding: 4px 12px; background: #fee2e2;
          border: none; border-radius: 20px; font-size: 0.7rem; color: #dc2626; cursor: pointer;
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
        }

        /* INLINE DETAILS (matching form style) */
        .inline-details-container {
          background: white; border-radius: 24px; margin: 1.5rem;
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

        .client-profile-section {
          background: white; border-radius: 16px; padding: 20px;
          border: 1px solid #e2e8f0; margin-bottom: 24px;
        }
        .client-profile-header {
          display: flex; align-items: center; gap: 20px;
          margin-bottom: 24px; flex-wrap: wrap;
        }
        .client-avatar {
          width: 80px; height: 80px; background: #0d4734;
          border-radius: 80px; display: flex; align-items: center; justify-content: center;
          color: white;
        }
        .client-profile-info h3 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .client-profile-details {
          display: flex; gap: 16px; flex-wrap: wrap;
        }
        .client-profile-details span {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.875rem; color: #64748b;
        }
        .client-profile-actions { margin-left: auto; }
        .details-action-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 40px; border: none;
          cursor: pointer; font-size: 0.875rem; font-weight: 500;
          transition: all 0.2s;
        }
        .details-action-btn.edit {
          background: #0d4734; color: white;
        }
        .details-action-btn.edit:hover { background: #0a3a2a; transform: translateY(-2px); }

        .client-identity-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px; margin-top: 16px; padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        .identity-item { display: flex; flex-direction: column; gap: 4px; }
        .identity-label { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .identity-value { font-size: 0.875rem; font-weight: 500; color: #0f172a; }

        .client-documents { margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .client-documents h4 { font-size: 0.875rem; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
        .documents-grid { display: flex; gap: 16px; flex-wrap: wrap; }
        .document-card { text-align: center; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: white; max-width: 200px; }
        .document-image { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px; }
        .document-label { font-size: 0.7rem; color: #64748b; display: block; margin-top: 4px; }

        .pdf-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; min-width: 140px; }
        .pdf-icon-wrapper { display: flex; justify-content: center; align-items: center; width: 80px; height: 80px; background: #fef3c7; border-radius: 12px; color: #b45309; }
        .pdf-icon { width: 48px; height: 48px; }
        .pdf-actions { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; justify-content: center; }
        .pdf-actions.small .pdf-action-btn { font-size: 0.65rem; padding: 4px 8px; }
        .pdf-action-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; text-decoration: none; cursor: pointer; transition: all 0.2s; border: none; background: none; }
        .pdf-action-btn.view { background: #dbeafe; color: #1e40af; }
        .pdf-action-btn.view:hover { background: #bfdbfe; }
        .pdf-action-btn.download { background: #e0f2fe; color: #0369a1; }
        .pdf-action-btn.download:hover { background: #b8e2f8; }
        .pdf-preview-container { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px; background: #fefce8; border-radius: 12px; border: 1px solid #fde047; }
        .pdf-preview-container .pdf-icon-wrapper { width: 60px; height: 60px; }

        .client-stats-section {
          background: white; border-radius: 16px; padding: 20px;
          border: 1px solid #e2e8f0; margin-bottom: 24px;
        }
        .stats-grid-5 {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 20px;
        }
        .stat-item-details { text-align: center; }
        .stat-value { font-size: 1.5rem; font-weight: 700; }
        .stat-label { font-size: 0.7rem; color: #64748b; margin-top: 4px; }

        .details-tabs-full {
          display: flex; gap: 8px; border-bottom: 1px solid #e2e8f0;
          margin-bottom: 24px;
        }
        .details-tab-full {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px; background: none; border: none;
          cursor: pointer; font-size: 0.875rem; font-weight: 500;
          color: #64748b; transition: all 0.2s; border-radius: 12px 12px 0 0;
        }
        .details-tab-full:hover { background: #f1f5f9; }
        .details-tab-full.active { background: #0d4734; color: white; }
        .tab-content-full { padding: 8px 0; }

        .reservations-list, .accidents-list, .payments-list-full {
          display: flex; flex-direction: column; gap: 16px;
        }
        .reservation-card, .accident-card, .payment-card-full {
          background: white; border: 1px solid #e2e8f0; border-radius: 20px;
          overflow: hidden; transition: all 0.2s;
        }
        .reservation-card:hover, .accident-card:hover, .payment-card-full:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .reservation-card-header, .accident-card-header, .payment-card-header-full {
          background: #f8fafc; padding: 12px 20px;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid #e2e8f0;
        }
        .reservation-id, .accident-id { font-weight: 600; color: #0f172a; }
        .reservation-card-body, .accident-card-body, .payment-card-body-full {
          padding: 20px;
        }
        .reservation-card-body {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        .reservation-vehicle, .reservation-dates, .reservation-amounts {
          display: flex; gap: 12px; align-items: flex-start;
        }
        .vehicle-name { font-weight: 600; color: #0f172a; }
        .vehicle-matricule { font-size: 0.7rem; font-family: monospace; color: #0d4734; }
        .days-count { font-size: 0.7rem; color: #64748b; margin-top: 4px; }

        .accident-card-body { display: flex; flex-direction: column; gap: 12px; }
        .accident-date, .accident-vehicle { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; }
        .accident-vehicle .matricule { font-family: monospace; color: #0d4734; margin-left: 8px; }
        .accident-amounts { display: flex; gap: 20px; font-size: 0.875rem; }
        .accident-description { display: flex; align-items: flex-start; gap: 8px; padding: 8px 12px; background: #f8fafc; border-radius: 12px; font-size: 0.75rem; color: #64748b; }

        .payment-card-header-full {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px;
        }
        .payment-car-name { margin-left: 8px; font-size: 0.75rem; color: #64748b; }
        .payment-amounts-full { display: flex; gap: 16px; font-size: 0.875rem; }
        .paid-amount { color: #16a34a; }
        .remaining-amount.negative { color: #dc2626; }
        .remaining-amount.positive { color: #16a34a; }
        .payment-history-title { font-size: 0.875rem; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .payment-items-full { display: flex; flex-wrap: wrap; gap: 12px; }
        .payment-item-full { background: #f8fafc; padding: 8px 12px; border-radius: 12px; font-size: 0.75rem; display: flex; align-items: center; gap: 8px; }
        .payment-date { color: #64748b; }
        .payment-amount { font-weight: 600; color: #0d4734; }
        .payment-method { background: white; padding: 2px 6px; border-radius: 20px; font-size: 0.65rem; }
        .payment-notes { color: #64748b; font-style: italic; }
        .no-payments-full { font-size: 0.875rem; color: #64748b; text-align: center; padding: 20px; }
        .empty-state-full { text-align: center; padding: 40px; color: #64748b; }
        .empty-icon { margin-bottom: 16px; opacity: 0.5; }

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
        .delete-icon-box { width: 48px; height: 48px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #dc2626; }
        .delete-modal-card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; }
        .delete-modal-card p { color: #64748b; font-size: 0.875rem; margin-bottom: 24px; }
        .delete-actions { display: flex; gap: 12px; }
        .modal-btn-cancel { flex: 1; background: #f1f5f9; border: none; padding: 10px; border-radius: 40px; cursor: pointer; font-weight: 500; }
        .modal-btn-delete { flex: 1; background: #dc2626; color: white; border: none; padding: 10px; border-radius: 40px; cursor: pointer; font-weight: 500; }

        .loading { text-align: center; padding: 3rem; }
        .spinner { display: inline-block; width: 2rem; height: 2rem; border-radius: 50%; border: 2px solid #e2e8f0; border-top-color: #0f172a; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .flex { display: flex; } .items-center { align-items: center; } .gap-1 { gap: 0.25rem; }
        .text-right { text-align: right; } .font-medium { font-weight: 500; }
        .text-green { color: #16a34a; }
        .text-emerald { color: #059669; }
        .text-blue { color: #3b82f6; }
        .text-warning { color: #eab308; }
        .text-success { color: #16a34a; }
        .text-danger { color: #dc2626; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .smaiti-table th, .smaiti-table td { padding: 8px 10px; font-size: 0.8rem; }
          .inline-form-grid { grid-template-columns: 1fr; gap: 24px; }
          .reservation-card-body { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .admin-smaiti-page { padding: 16px; }
          .smaiti-topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
          .smaiti-right-actions { width: 100%; justify-content: space-between; }
          .smaiti-actions-wrapper { flex-direction: column; align-items: flex-start; gap: 12px; }
          .smaiti-actions-buttons { width: 100%; justify-content: flex-end; flex-wrap: wrap; }
          .smaiti-table-container { overflow-x: auto; }
          .smaiti-table { min-width: 800px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .inline-form-container, .inline-details-container { margin: 1rem; }
          .inline-form-header, .inline-details-header { padding: 16px 20px; }
          .inline-form-header h2, .inline-details-title h2 { font-size: 1.25rem; }
          .inline-form, .inline-details-content { padding: 20px; }
          .inline-grid-2 { grid-template-columns: 1fr; }
          .client-profile-header { flex-direction: column; text-align: center; }
          .client-profile-actions { margin-left: 0; }
          .client-profile-details { justify-content: center; }
          .payment-card-header-full { flex-direction: column; align-items: flex-start; }
          .payment-amounts-full { flex-wrap: wrap; }
          .details-tabs-full { flex-wrap: wrap; }
          .documents-grid { justify-content: center; }
          .stats-grid-5 { grid-template-columns: repeat(2, 1fr); }
        }
        html, body { overflow-x: auto !important; min-width: 320px; }
        .admin-smaiti-page, .inline-form-container, .inline-details-container {
          overflow-x: auto !important; min-width: 0; width: 100%;
        }
        .inline-form, .inline-details-content { overflow-x: auto !important; }
        .inline-form-grid { min-width: 600px; }
        @media (max-width: 768px) { .inline-form-grid { min-width: 100%; } }

        /* Pagination controls for details tabs - ensure consistency */
        .details-pagination {
          margin-top: 1rem;
          display: flex;
          justify-content: center;
        }
      `}</style>

      {/* ====== FORM ====== */}
      {showClientForm ? (
        <div className="inline-form-container">
          <div className="inline-form-header">
            <div className="inline-form-icon">
              {editingClient ? <Sparkles size={24} /> : <Plus size={24} />}
            </div>
            <div className="inline-form-title">
              <h2>{editingClient ? "Modifier le client" : "Nouveau client"}</h2>
              <p>
                {editingClient
                  ? "Modifiez les informations du client"
                  : "Ajoutez un nouveau client à votre base de données"}
              </p>
            </div>
            <button
              onClick={() => {
                setShowClientForm(false);
                setEditingClient(null);
                resetForm();
                setCinPreview("");
                setLicensePreview("");
              }}
              className="inline-form-close"
            >
              <X size={24} />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingClient) {
                handleUpdateClient(formData);
              } else {
                handleCreateClient(formData);
              }
            }}
            className="inline-form"
          >
            <div className="inline-form-grid">
              {/* Left Column */}
              <div className="inline-form-col">
                <div className="inline-section">
                  <div className="inline-section-header">
                    <User size={18} className="section-icon" />
                    <h3>Informations personnelles</h3>
                  </div>
                  <div className="inline-grid-2">
                    <div className="inline-field">
                      <label>Nom *</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.nom}
                        onChange={(e) =>
                          setFormData({ ...formData, nom: e.target.value })
                        }
                        required
                        placeholder="Dupont"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Prénom *</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.prenom}
                        onChange={(e) =>
                          setFormData({ ...formData, prenom: e.target.value })
                        }
                        required
                        placeholder="Jean"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Téléphone *</label>
                      <input
                        type="tel"
                        className="inline-input"
                        value={formData.telephone}
                        onChange={(e) =>
                          setFormData({ ...formData, telephone: e.target.value })
                        }
                        required
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Email</label>
                      <input
                        type="email"
                        className="inline-input"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="client@email.com"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Ville</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="Casablanca"
                      />
                    </div>
                  </div>
                </div>

                <div className="inline-section">
                  <div className="inline-section-header">
                    <IdCard size={18} className="section-icon" />
                    <h3>Pièces d'identité</h3>
                  </div>
                  <div className="inline-grid-2">
                    <div className="inline-field">
                      <label>Numéro CIN</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.cin_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cin_number: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="AB123456"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Numéro Permis</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.driver_license_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            driver_license_number: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="P123456"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Date naissance</label>
                      <input
                        type="date"
                        className="inline-input"
                        value={formData.date_naissance}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            date_naissance: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="inline-field">
                      <label>Lieu naissance</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.lieu_naissance}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lieu_naissance: e.target.value,
                          })
                        }
                        placeholder="Casablanca"
                      />
                    </div>
                    <div className="inline-field">
                      <label>CIN délivré le</label>
                      <input
                        type="date"
                        className="inline-input"
                        value={formData.cin_delivre_le}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cin_delivre_le: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="inline-field">
                      <label>Permis délivré le</label>
                      <input
                        type="date"
                        className="inline-input"
                        value={formData.permis_delivre_le}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permis_delivre_le: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="inline-form-col">
                <div className="inline-section">
                  <div className="inline-section-header">
                    <Camera size={18} className="section-icon" />
                    <h3>Documents scannés</h3>
                  </div>
                  <div className="inline-grid-2">
                    <div className="inline-field">
                      <label>Image CIN</label>
                      <div
                        className="image-upload-area"
                        onClick={() =>
                          document.getElementById("cinInput").click()
                        }
                      >
                        <Upload size={24} />
                        <p>Cliquez pour télécharger</p>
                        <p style={{ fontSize: "0.7rem", color: "#64748b" }}>
                          JPG, PNG, PDF - 5MB max
                        </p>
                        <input
                          type="file"
                          id="cinInput"
                          accept="image/*,application/pdf"
                          onChange={(e) =>
                            handleFileChange("cin_image", e.target.files[0])
                          }
                          style={{ display: "none" }}
                        />
                      </div>
                      {cinPreview &&
                        renderFormDocumentPreview(
                          cinPreview,
                          "CIN",
                          () => {
                            setCinPreview("");
                            setFormData({ ...formData, cin_image: "" });
                          }
                        )}
                    </div>
                    <div className="inline-field">
                      <label>Image Permis</label>
                      <div
                        className="image-upload-area"
                        onClick={() =>
                          document.getElementById("licenseInput").click()
                        }
                      >
                        <Upload size={24} />
                        <p>Cliquez pour télécharger</p>
                        <p style={{ fontSize: "0.7rem", color: "#64748b" }}>
                          JPG, PNG, PDF - 5MB max
                        </p>
                        <input
                          type="file"
                          id="licenseInput"
                          accept="image/*,application/pdf"
                          onChange={(e) =>
                            handleFileChange(
                              "driver_license_image",
                              e.target.files[0]
                            )
                          }
                          style={{ display: "none" }}
                        />
                      </div>
                      {licensePreview &&
                        renderFormDocumentPreview(
                          licensePreview,
                          "Permis",
                          () => {
                            setLicensePreview("");
                            setFormData({
                              ...formData,
                              driver_license_image: "",
                            });
                          }
                        )}
                    </div>
                  </div>
                  <div className="inline-info-message">
                    <Info size={16} />
                    <span>
                      Les documents sont optionnels mais recommandés pour les
                      dossiers clients
                    </span>
                  </div>
                </div>

                {editingClient && (
                  <div className="inline-section">
                    <div className="inline-section-header">
                      <Activity size={18} className="section-icon" />
                      <h3>Informations système</h3>
                    </div>
                    <div className="inline-info-grid">
                      <div className="inline-info-item">
                        <span className="info-label">Date de création</span>
                        <span className="info-value">
                          {editingClient.created_at
                            ? formatDate(editingClient.created_at)
                            : "—"}
                        </span>
                      </div>
                      <div className="inline-info-item">
                        <span className="info-label">
                          Dernière modification
                        </span>
                        <span className="info-value">
                          {editingClient.updated_at
                            ? formatDate(editingClient.updated_at)
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="inline-form-footer">
              <button
                type="button"
                className="inline-secondary-btn"
                onClick={() => {
                  setShowClientForm(false);
                  setEditingClient(null);
                  resetForm();
                  setCinPreview("");
                  setLicensePreview("");
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="inline-primary-btn"
                disabled={submitting}
              >
                {submitting
                  ? "Traitement..."
                  : editingClient
                  ? "Mettre à jour"
                  : "Créer le client"}
              </button>
            </div>
          </form>
        </div>
      ) : showClientDetails && selectedClient ? (
        /* ====== DETAILS VIEW ====== */
        <div className="inline-details-container">
          <div className="inline-details-header">
            <div className="inline-details-icon">
              <User size={24} />
            </div>
            <div className="inline-details-title">
              <h2>Détails du client</h2>
              <p>
                {selectedClient.prenom} {selectedClient.nom}
              </p>
            </div>
            <button
              onClick={() => setShowClientDetails(false)}
              className="inline-details-close"
            >
              <X size={24} />
            </button>
          </div>

          <div className="inline-details-content">
            {/* Profile */}
            <div className="client-profile-section">
              <div className="client-profile-header">
                <div className="client-avatar">
                  <User size={48} />
                </div>
                <div className="client-profile-info">
                  <h3>
                    {selectedClient.prenom} {selectedClient.nom}
                  </h3>
                  <div className="client-profile-details">
                    <span>
                      <Phone size={14} /> {selectedClient.telephone}
                    </span>
                    {selectedClient.email && (
                      <span>
                        <Mail size={14} /> {selectedClient.email}
                      </span>
                    )}
                    {selectedClient.city && (
                      <span>
                        <MapPin size={14} /> {selectedClient.city}
                      </span>
                    )}
                  </div>
                </div>
                <div className="client-profile-actions">
                  <button
                    onClick={() => {
                      setShowClientDetails(false);
                      handleEdit(selectedClient);
                    }}
                    className="details-action-btn edit"
                  >
                    <Edit2 size={16} /> Modifier
                  </button>
                </div>
              </div>

              <div className="client-identity-grid">
                <div className="identity-item">
                  <span className="identity-label">CIN</span>
                  <span className="identity-value">
                    {selectedClient.cin_number || "—"}
                  </span>
                </div>
                <div className="identity-item">
                  <span className="identity-label">Permis</span>
                  <span className="identity-value">
                    {selectedClient.driver_license_number || "—"}
                  </span>
                </div>
                <div className="identity-item">
                  <span className="identity-label">Date naissance</span>
                  <span className="identity-value">
                    {formatDate(selectedClient.date_naissance)}
                  </span>
                </div>
                <div className="identity-item">
                  <span className="identity-label">Lieu naissance</span>
                  <span className="identity-value">
                    {selectedClient.lieu_naissance || "—"}
                  </span>
                </div>
                <div className="identity-item">
                  <span className="identity-label">CIN délivré le</span>
                  <span className="identity-value">
                    {formatDate(selectedClient.cin_delivre_le)}
                  </span>
                </div>
                <div className="identity-item">
                  <span className="identity-label">Permis délivré le</span>
                  <span className="identity-value">
                    {formatDate(selectedClient.permis_delivre_le)}
                  </span>
                </div>
              </div>

              {(selectedClient.cin_image_url ||
                selectedClient.driver_license_image_url) && (
                <div className="client-documents">
                  <h4>Documents scannés</h4>
                  <div className="documents-grid">
                    {selectedClient.cin_image_url &&
                      renderDocumentPreview(
                        selectedClient.cin_image_url,
                        "CIN"
                      )}
                    {selectedClient.driver_license_image_url &&
                      renderDocumentPreview(
                        selectedClient.driver_license_image_url,
                        "Permis de conduire"
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            {(() => {
              const stats = getClientStats(selectedClient.id);
              return (
                <div className="client-stats-section">
                  <div className="stats-grid-5">
                    <div className="stat-item-details">
                      <div className="stat-value">{stats.totalReservations}</div>
                      <div className="stat-label">Total réservations</div>
                    </div>
                    <div className="stat-item-details">
                      <div className="stat-value text-warning">
                        {stats.activeReservations}
                      </div>
                      <div className="stat-label">Réservations actives</div>
                    </div>
                    <div className="stat-item-details">
                      <div className="stat-value text-success">
                        {stats.completedReservations}
                      </div>
                      <div className="stat-label">Réservations terminées</div>
                    </div>
                    <div className="stat-item-details">
                      <div className="stat-value text-danger">
                        {stats.accidentCount}
                      </div>
                      <div className="stat-label">Accidents</div>
                    </div>
                    <div className="stat-item-details">
                      <div className="stat-value">
                        {formatCurrency(stats.totalSpent)}
                      </div>
                      <div className="stat-label">Total dépensé</div>
                    </div>
                    <div className="stat-item-details">
                      <div className="stat-value text-success">
                        {formatCurrency(stats.totalPaid)}
                      </div>
                      <div className="stat-label">Total payé</div>
                    </div>
                    <div className="stat-item-details">
                      <div className="stat-value text-danger">
                        {formatCurrency(stats.totalRemaining)}
                      </div>
                      <div className="stat-label">Reste à payer</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tabs */}
            <div className="details-tabs-full">
              <button
                className={`details-tab-full ${
                  activeTab === "reservations" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("reservations");
                  setDetailsReservationsPage(1);
                }}
              >
                <Calendar size={16} /> Réservations (
                {getClientReservations(selectedClient.id).length})
              </button>
              <button
                className={`details-tab-full ${
                  activeTab === "accidents" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("accidents");
                  setDetailsAccidentsPage(1);
                }}
              >
                <AlertTriangle size={16} /> Accidents (
                {getClientAccidents(selectedClient.id).length})
              </button>
              <button
                className={`details-tab-full ${
                  activeTab === "payments" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("payments");
                  setDetailsPaymentsPage(1);
                }}
              >
                <DollarSign size={16} /> Paiements
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content-full">
              {activeTab === "reservations" && (
                <div>
                  {(() => {
                    const { items, total, totalPages } = getPaginatedReservations(
                      selectedClient.id
                    );
                    if (total === 0) {
                      return (
                        <div className="empty-state-full">
                          <Car size={64} className="empty-icon" />
                          <p>Aucune réservation pour ce client</p>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="reservations-list">
                          {items.map((res) => {
                            const car = getCarForReservation(res);
                            const matricule = getMatriculeForReservation(res);
                            const days = res.rental_days || res.total_days || 1;
                            return (
                              <div key={res.id} className="reservation-card">
                                <div className="reservation-card-header">
                                  <div className="reservation-id">
                                    Réservation #{res.id}
                                  </div>
                                  <div>{getStatusBadge(res.status)}</div>
                                </div>
                                <div className="reservation-card-body">
                                  <div className="reservation-vehicle">
                                    <Car size={20} />
                                    <div>
                                      <div className="vehicle-name">
                                        {car ? `${car.brand} ${car.model}` : "—"}
                                      </div>
                                      <div className="vehicle-matricule">
                                        {matricule?.matricule_code || "—"}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="reservation-dates">
                                    <Calendar size={16} />
                                    <div>
                                      <div>
                                        Du {formatDate(res.start_date)} à{" "}
                                        {res.start_time || "08:00"}
                                      </div>
                                      <div>
                                        Au {formatDate(res.end_date)} à{" "}
                                        {res.end_time || "18:00"}
                                      </div>
                                      <div className="days-count">{days} jours</div>
                                    </div>
                                  </div>
                                  <div className="reservation-amounts">
                                    <DollarSign size={16} />
                                    <div>
                                      <div>
                                        Total:{" "}
                                        <strong>{formatCurrency(res.total_price)}</strong>
                                      </div>
                                      <div>
                                        Payé: {formatCurrency(res.amount_paid)}
                                      </div>
                                      <div
                                        className={
                                          res.remaining_amount > 0
                                            ? "text-danger"
                                            : "text-success"
                                        }
                                      >
                                        Reste: {formatCurrency(res.remaining_amount)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {totalPages > 1 && (
                          <div className="details-pagination">
                            <PaginationControls
                              currentPage={detailsReservationsPage}
                              totalPages={totalPages}
                              onPageChange={setDetailsReservationsPage}
                              itemsPerPage={detailsItemsPerPage}
                              onItemsPerPageChange={() => {}}
                              totalItems={total}
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === "accidents" && (
                <div>
                  {(() => {
                    const { items, total, totalPages } = getPaginatedAccidents(
                      selectedClient.id
                    );
                    if (total === 0) {
                      return (
                        <div className="empty-state-full">
                          <Shield size={64} className="empty-icon" />
                          <p>Aucun accident pour ce client</p>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="accidents-list">
                          {items.map((acc) => {
                            const car = acc.car;
                            const matricule = acc.matricule;
                            return (
                              <div key={acc.id} className="accident-card">
                                <div className="accident-card-header">
                                  <div className="accident-id">
                                    Accident #{acc.id}
                                  </div>
                                  <div>
                                    {getAccidentStatusBadge(acc.status)}
                                  </div>
                                </div>
                                <div className="accident-card-body">
                                  <div className="accident-date">
                                    <Calendar size={16} />
                                    <span>{formatDate(acc.date_accident)}</span>
                                  </div>
                                  <div className="accident-vehicle">
                                    <Car size={16} />
                                    <span>
                                      {car ? `${car.brand} ${car.model}` : "—"}
                                    </span>
                                    <span className="matricule">
                                      {matricule?.matricule_code || "—"}
                                    </span>
                                  </div>
                                  <div className="accident-type">
                                    <span
                                      className={`badge ${
                                        acc.accident_type === "grave"
                                          ? "badge-danger"
                                          : "badge-warning"
                                      }`}
                                    >
                                      {acc.accident_type === "grave"
                                        ? "Accident grave"
                                        : "Accident non grave"}
                                    </span>
                                  </div>
                                  <div className="accident-amounts">
                                    <div>
                                      Pertes: {formatCurrency(acc.amount_of_losses)}
                                    </div>
                                    <div>
                                      Assurance:{" "}
                                      {formatCurrency(acc.amount_assurance)}
                                    </div>
                                  </div>
                                  {acc.description && (
                                    <div className="accident-description">
                                      <Info size={14} />
                                      <span>{acc.description}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {totalPages > 1 && (
                          <div className="details-pagination">
                            <PaginationControls
                              currentPage={detailsAccidentsPage}
                              totalPages={totalPages}
                              onPageChange={setDetailsAccidentsPage}
                              itemsPerPage={detailsItemsPerPage}
                              onItemsPerPageChange={() => {}}
                              totalItems={total}
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === "payments" && (
                <div>
                  {(() => {
                    const { items, total, totalPages } = getPaginatedPayments(
                      selectedClient.id
                    );
                    if (total === 0) {
                      return (
                        <div className="empty-state-full">
                          <Wallet size={64} className="empty-icon" />
                          <p>Aucun historique de paiement</p>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="payments-list-full">
                          {items.map((res) => {
                            const car = getCarForReservation(res);
                            const paymentHistory = getPaymentHistoryArray(res);
                            return (
                              <div key={res.id} className="payment-card-full">
                                <div className="payment-card-header-full">
                                  <div>
                                    <strong>Réservation #{res.id}</strong>
                                    <span className="payment-car-name">
                                      {car ? `${car.brand} ${car.model}` : "—"}
                                    </span>
                                  </div>
                                  <div className="payment-amounts-full">
                                    <span>
                                      Total: {formatCurrency(res.total_price)}
                                    </span>
                                    <span className="paid-amount">
                                      Payé: {formatCurrency(res.amount_paid)}
                                    </span>
                                    <span
                                      className={`remaining-amount ${
                                        (res.remaining_amount || 0) > 0
                                          ? "negative"
                                          : "positive"
                                      }`}
                                    >
                                      Reste: {formatCurrency(res.remaining_amount)}
                                    </span>
                                  </div>
                                </div>
                                <div className="payment-card-body-full">
                                  <div className="payment-history-title">
                                    <History size={14} /> Historique des
                                    paiements
                                  </div>
                                  {paymentHistory.length > 0 ? (
                                    <div className="payment-items-full">
                                      {paymentHistory.map((payment, idx) => (
                                        <div
                                          key={idx}
                                          className="payment-item-full"
                                        >
                                          <span className="payment-date">
                                            {formatDate(payment.date)}
                                          </span>
                                          <span className="payment-amount">
                                            {formatCurrency(payment.amount)}
                                          </span>
                                          <span className="payment-method">
                                            {payment.method === "cash"
                                              ? "Espèces"
                                              : payment.method === "card"
                                              ? "Carte"
                                              : payment.method === "check"
                                              ? "Chèque"
                                              : "Virement"}
                                          </span>
                                          {payment.notes && (
                                            <span className="payment-notes">
                                              ({payment.notes})
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="no-payments-full">
                                      Aucun paiement enregistré
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {totalPages > 1 && (
                          <div className="details-pagination">
                            <PaginationControls
                              currentPage={detailsPaymentsPage}
                              totalPages={totalPages}
                              onPageChange={setDetailsPaymentsPage}
                              itemsPerPage={detailsItemsPerPage}
                              onItemsPerPageChange={() => {}}
                              totalItems={total}
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="inline-details-footer">
            <button
              onClick={() => setShowClientDetails(false)}
              className="inline-secondary-btn"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : (
        /* ====== MAIN LIST ====== */
        <>
          <div className="smaiti-topbar">
            <div className="smaiti-logo-area">
              <span className="smaiti-brand">SMAITI LUXE</span>
              <span className="smaiti-flotte">Clients</span>
            </div>
            <div className="smaiti-right-actions">
              <div className="smaiti-search-bar">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="smaiti-notif-btn" onClick={refreshData}>
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div>
                <p className="stat-label">Total clients</p>
                <p className="stat-number">{stats.total}</p>
              </div>
              <Users size={28} className="stat-icon" />
            </div>
            <div className="stat-card">
              <div>
                <p className="stat-label">CIN enregistré</p>
                <p className="stat-number text-green">{stats.withCin}</p>
              </div>
              <IdCard size={28} className="stat-icon" />
            </div>
            <div className="stat-card">
              <div>
                <p className="stat-label">Permis enregistré</p>
                <p className="stat-number text-emerald">{stats.withLicense}</p>
              </div>
              <FileText size={28} className="stat-icon" />
            </div>
            <div className="stat-card">
              <div>
                <p className="stat-label">Email renseigné</p>
                <p className="stat-number text-blue">{stats.withEmail}</p>
              </div>
              <Mail size={28} className="stat-icon" />
            </div>
          </div>

          <div className="smaiti-actions-wrapper">
            <span className="smaiti-count">
              {filteredClients.length} enregistrement(s)
            </span>
            <div className="smaiti-actions-buttons">
              <button onClick={handleExport} className="btn btn-secondary">
                <Save size={14} /> Exporter
              </button>
              <button onClick={handleAddNew} className="btn btn-primary">
                <Plus size={14} /> Nouveau client
              </button>
            </div>
          </div>

          <div className="smaiti-table-container">
            <table className="smaiti-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("id")} className="sortable-header">
                    ID {getSortIcon("id")}
                  </th>
                  <th onClick={() => handleSort("name")} className="sortable-header">
                    Client {getSortIcon("name")}
                  </th>
                  <th onClick={() => handleSort("telephone")} className="sortable-header">
                    Contact {getSortIcon("telephone")}
                  </th>
                  <th onClick={() => handleSort("cin")} className="sortable-header">
                    CIN {getSortIcon("cin")}
                  </th>
                  <th>Permis</th>
                  <th onClick={() => handleSort("city")} className="sortable-header">
                    Ville {getSortIcon("city")}
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">#{c.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        <span className="font-medium">
                          {c.prenom} {c.nom}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Phone size={12} /> {c.telephone}
                        </div>
                        {c.email && (
                          <div
                            className="flex items-center gap-1 text-xs"
                            style={{ color: "#64748b" }}
                          >
                            <Mail size={10} /> {c.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {c.cin_number ? (
                        <div className="flex items-center gap-1">
                          <IdCard size={12} /> {c.cin_number}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {c.driver_license_number ? (
                        <div className="flex items-center gap-1">
                          <CreditCard size={12} /> {c.driver_license_number}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {c.city ? (
                        <div className="flex items-center gap-1">
                          <MapPin size={12} /> {c.city}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-right">
                      <div className="action-icons">
                        <button
                          onClick={() => openDetails(c)}
                          className="action-btn view"
                          title="Détails"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(c)}
                          className="action-btn edit"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(c)}
                          className="action-btn delete"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={filteredClients.length}
              />
            )}
          </div>
        </>
      )}

      {/* ====== DELETE MODAL ====== */}
      {deleteModalOpen && clientToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-card">
            <div className="delete-icon-box">
              <TrashIcon size={24} />
            </div>
            <h3>Confirmer la suppression</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer <br />
              <strong>
                {clientToDelete.prenom} {clientToDelete.nom}
              </strong>{" "}
              ?
            </p>
            {getClientReservations(clientToDelete.id).length > 0 && (
              <p style={{ fontSize: "0.75rem", color: "#dc2626" }}>
                ⚠️ Ce client a{" "}
                {getClientReservations(clientToDelete.id).length} réservation(s)
                associée(s)
              </p>
            )}
            <div className="delete-actions">
              <button
                className="modal-btn-cancel"
                onClick={() => setDeleteModalOpen(false)}
              >
                Annuler
              </button>
              <button className="modal-btn-delete" onClick={confirmDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}