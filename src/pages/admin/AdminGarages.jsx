// src/pages/admin/AdminGarages.jsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGarages,
  selectGarages,
  selectGaragesLoading,
  createGarage,
  updateGarage,
  deleteGarage
} from "../../Redux/store";
import PaginationControls from '../../components/PaginationControls';
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, X, Eye, Search, RefreshCw,
  ChevronLeft, ChevronRight, Building2, Phone, Mail,
  MapPin, IdCard, Activity, CheckCircle, XCircle,
  Save, TrashIcon, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown,
  Sparkles, Star, Briefcase, User, Crown, Shield, Key,
  Lock, Unlock, Download, Bell
} from "lucide-react";

export default function AdminGarages() {
  const dispatch = useDispatch();
  const garages = useSelector(selectGarages);
  const loading = useSelector(selectGaragesLoading);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [garageToDelete, setGarageToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    rc: "",
    if: "",
    ice: "",
    tp: "",
    notes: "",
    is_active: true,
  });

  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load garages
  useEffect(() => {
    dispatch(fetchGarages());
  }, [dispatch]);

  // Sorting
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
    return sortDirection === "asc"
      ? <ArrowUp size={12} className="sort-icon active" />
      : <ArrowDown size={12} className="sort-icon active" />;
  };

  // Filter & sort
  const filteredGarages = useMemo(() => {
    return garages
      .filter((g) => {
        const matchesSearch =
          searchTerm === "" ||
          g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.phone || "").includes(searchTerm);
        return matchesSearch;
      })
      .sort((a, b) => {
        let aVal, bVal;
        switch (sortField) {
          case "id": aVal = a.id; bVal = b.id; break;
          case "name": aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
          case "phone": aVal = a.phone || ""; bVal = b.phone || ""; break;
          case "email": aVal = a.email || ""; bVal = b.email || ""; break;
          case "is_active": aVal = a.is_active ? 1 : 0; bVal = b.is_active ? 1 : 0; break;
          default: aVal = a.id; bVal = b.id;
        }
        return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
  }, [garages, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredGarages.length / itemsPerPage);
  const paginated = filteredGarages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    total: garages.length,
    active: garages.filter((g) => g.is_active).length,
    inactive: garages.filter((g) => !g.is_active).length,
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      rc: "",
      if: "",
      ice: "",
      tp: "",
      notes: "",
      is_active: true,
    });
    setEditing(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (garage) => {
    setEditing(garage);
    setFormData({
      name: garage.name || "",
      address: garage.address || "",
      phone: garage.phone || "",
      email: garage.email || "",
      rc: garage.rc || "",
      if: garage.if || "",
      ice: garage.ice || "",
      tp: garage.tp || "",
      notes: garage.notes || "",
      is_active: garage.is_active !== undefined ? garage.is_active : true,
    });
    setShowForm(true);
  };

  const handleDeleteClick = (garage) => {
    setGarageToDelete(garage);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!garageToDelete) return;
    const result = await dispatch(deleteGarage(garageToDelete.id));
    if (result.error) toast.error(result.payload);
    else {
      toast.success("Garage supprimé");
      dispatch(fetchGarages(true));
    }
    setDeleteModalOpen(false);
    setGarageToDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let result;
      if (editing) {
        result = await dispatch(updateGarage({ id: editing.id, data: formData }));
      } else {
        result = await dispatch(createGarage(formData));
      }
      if (result.error) toast.error(result.payload);
      else {
        toast.success(editing ? "Garage modifié" : "Garage créé");
        setShowForm(false);
        resetForm();
        dispatch(fetchGarages(true));
      }
    } catch (error) {
      toast.error("Erreur lors de l'opération");
    } finally {
      setSubmitting(false);
    }
  };

  const refreshData = async () => {
    await dispatch(fetchGarages(true));
    toast.success("Données actualisées");
  };

  const handleExport = () => {
    const headers = ["ID", "Nom", "Adresse", "Téléphone", "Email", "RC", "IF", "ICE", "TP", "Actif"];
    const csvData = filteredGarages.map((g) => [
      g.id,
      `"${g.name}"`,
      `"${g.address || ""}"`,
      `"${g.phone || ""}"`,
      `"${g.email || ""}"`,
      `"${g.rc || ""}"`,
      `"${g.if || ""}"`,
      `"${g.ice || ""}"`,
      `"${g.tp || ""}"`,
      g.is_active ? "Oui" : "Non",
    ].join(","));
    const blob = new Blob([headers.join(",") + "\n" + csvData.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `garages_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV effectué");
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement des garages...</p>
      </div>
    );
  }

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
        .search-container {
          position: relative;
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
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger { background: #fee2e2; color: #991b1b; }

        /* ACTION BUTTONS */
        .action-icons { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
        .action-btn {
          width: 32px; height: 32px; border-radius: 50%;
          border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s; background: transparent;
        }
        .action-btn.edit { background: #dcfce7; color: #16a34a; }
        .action-btn.delete { background: #fee2e2; color: #ef4444; }
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
        .text-center { text-align: center; } .py-12 { padding: 3rem 0; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .smaiti-table th, .smaiti-table td { padding: 8px 10px; font-size: 0.8rem; }
          .inline-form-grid { grid-template-columns: 1fr; gap: 24px; }
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
          .inline-form-container { margin: 0; }
          .inline-form-header { padding: 16px 20px; }
          .inline-form-header h2 { font-size: 1.25rem; }
          .inline-form { padding: 20px; }
          .inline-grid-2 { grid-template-columns: 1fr; }
        }

        /* DARK MODE */
        @media (prefers-color-scheme: dark) {
          .admin-smaiti-page { background: #0f172a; color: #f1f5f9; }
          .smaiti-flotte { color: #f1f5f9; }
          .smaiti-notif-btn { background: #1e293b; border-color: #334155; color: #e2e8f0; }
          .smaiti-notif-btn:hover { background: #334155; }
          .stat-card, .smaiti-table-container, .search-wrapper, .inline-form-container,
          .delete-modal-card {
            background: #1e293b; border-color: #334155;
          }
          .stat-label, .smaiti-count, .inline-form-title p,
          .delete-modal-card p { color: #94a3b8; }
          .stat-number { color: #f1f5f9; }
          .inline-form-header { background: #0f172a; border-bottom-color: #0d4734; }
          .inline-form-header h2 { color: #f1f5f9; }
          .inline-section { background: #1e293b; border-color: #334155; }
          .inline-section-header h3 { color: #f1f5f9; }
          .inline-section-header .section-icon { color: #0d4734; }
          .inline-field label { color: #94a3b8; }
          .inline-input, .inline-select, .inline-textarea, .search-input {
            background: #0f172a; border-color: #334155; color: #f1f5f9;
          }
          .inline-input:focus, .inline-select:focus, .inline-textarea:focus,
          .search-input:focus {
            border-color: #0d4734; box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.3);
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
          .badge-success { background: #14532d; color: #4ade80; }
          .badge-danger { background: #7f1d1d; color: #fca5a5; }
          .action-btn.edit { background: #14532d; color: #4ade80; }
          .action-btn.delete { background: #7f1d1d; color: #fca5a5; }
          .smaiti-table thead { background: #0f172a; }
          .smaiti-table th { color: #94a3b8; }
          .smaiti-table tbody tr:hover { background: #334155; }
          .smaiti-table td { color: #e2e8f0; }
          .delete-icon-box { background: #7f1d1d; color: #fca5a5; }
          .modal-btn-cancel { background: #334155; color: #e2e8f0; border: none; }
          .modal-btn-cancel:hover { background: #475569; }
          .modal-btn-delete { background: #dc2626; color: white; }
          .modal-btn-delete:hover { background: #b91c1c; }
          .sortable-header:hover { background: #334155; }
        }

        html, body { overflow-x: auto !important; min-width: 320px; }
        .admin-smaiti-page, .inline-form-container { overflow-x: auto !important; min-width: 0; width: 100%; }
        .inline-form, .inline-details-content { overflow-x: auto !important; }
        .inline-form-grid { min-width: 600px; }
        @media (max-width: 768px) { .inline-form-grid { min-width: 100%; } }
        .smaiti-table-container { overflow-x: auto; }
        .smaiti-table { min-width: 800px; }
      `}</style>

      {/* TOPBAR */}
      <div className="smaiti-topbar">
        <div className="smaiti-logo-area">
          <span className="smaiti-brand">SMAITI LUXE</span>
          <span className="smaiti-flotte">Garages</span>
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
          <Building2 size={28} className="stat-icon" />
        </div>
        <div className="stat-card">
          <div><p className="stat-label">Actifs</p><p className="stat-number" style={{ color: '#16a34a' }}>{stats.active}</p></div>
          <CheckCircle size={28} className="stat-icon" style={{ color: '#16a34a' }} />
        </div>
        <div className="stat-card">
          <div><p className="stat-label">Inactifs</p><p className="stat-number" style={{ color: '#dc2626' }}>{stats.inactive}</p></div>
          <XCircle size={28} className="stat-icon" style={{ color: '#dc2626' }} />
        </div>
      </div>

      {showForm ? (
        /* ====== INLINE FORM ====== */
        <div className="inline-form-container">
          <div className="inline-form-header">
            <div className="inline-form-icon">
              {editing ? <Sparkles size={24} /> : <Plus size={24} />}
            </div>
            <div className="inline-form-title">
              <h2>{editing ? "Modifier le garage" : "Nouveau garage"}</h2>
              <p>{editing ? "Modifiez les informations du garage" : "Ajoutez un nouveau garage partenaire"}</p>
            </div>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="inline-form-close"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="inline-form">
            <div className="inline-form-grid">
              {/* Left Column */}
              <div className="inline-form-col">
                <div className="inline-section">
                  <div className="inline-section-header">
                    <Building2 size={18} className="section-icon" />
                    <h3>Informations générales</h3>
                  </div>
                  <div className="inline-grid-2">
                    <div className="inline-field">
                      <label>Nom *</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Garage Oulfa"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Téléphone</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                    <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                      <label>Adresse</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Rue des Garages, Casablanca"
                      />
                    </div>
                    <div className="inline-field" style={{ gridColumn: "1 / -1" }}>
                      <label>Email</label>
                      <input
                        type="email"
                        className="inline-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@garage.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="inline-section">
                  <div className="inline-section-header">
                    <IdCard size={18} className="section-icon" />
                    <h3>Identifiants légaux</h3>
                  </div>
                  <div className="inline-grid-2">
                    <div className="inline-field">
                      <label>RC</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.rc}
                        onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                        placeholder="580419"
                      />
                    </div>
                    <div className="inline-field">
                      <label>IF</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.if}
                        onChange={(e) => setFormData({ ...formData, if: e.target.value })}
                        placeholder="53743931"
                      />
                    </div>
                    <div className="inline-field">
                      <label>ICE</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.ice}
                        onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                        placeholder="003274706000087"
                      />
                    </div>
                    <div className="inline-field">
                      <label>TP</label>
                      <input
                        type="text"
                        className="inline-input"
                        value={formData.tp}
                        onChange={(e) => setFormData({ ...formData, tp: e.target.value })}
                        placeholder="35007229"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="inline-form-col">
                <div className="inline-section">
                  <div className="inline-section-header">
                    <Activity size={18} className="section-icon" />
                    <h3>Statut et notes</h3>
                  </div>
                  <div className="inline-grid-2">
                    <div className="inline-field">
                      <label>Actif</label>
                      <select
                        className="inline-select"
                        value={formData.is_active ? "1" : "0"}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "1" })}
                      >
                        <option value="1">Oui</option>
                        <option value="0">Non</option>
                      </select>
                    </div>
                  </div>
                  <div className="inline-field" style={{ marginTop: "1rem" }}>
                    <label>Notes</label>
                    <textarea
                      rows="4"
                      className="inline-textarea"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Informations supplémentaires..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="inline-form-footer">
              <button
                type="button"
                className="inline-secondary-btn"
                onClick={() => { setShowForm(false); resetForm(); }}
              >
                Annuler
              </button>
              <button type="submit" className="inline-primary-btn" disabled={submitting}>
                {submitting ? "Traitement..." : editing ? "Mettre à jour" : "Créer le garage"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ====== MAIN LIST ====== */
        <>
          {/* ACTION BAR */}
          <div className="smaiti-actions-wrapper">
            <span className="smaiti-count">{filteredGarages.length} enregistrement(s)</span>
            <div className="smaiti-actions-buttons">
              <button onClick={handleExport} className="btn btn-secondary">
                <Download size={14} /> Exporter
              </button>
              <button onClick={handleAddNew} className="btn btn-primary">
                <Plus size={14} /> Nouveau garage
              </button>
            </div>
          </div>

          {/* SEARCH */}
          <div className="search-wrapper">
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher par nom, adresse, téléphone..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="smaiti-table-container">
            <table className="smaiti-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("id")} className="sortable-header">
                    ID {getSortIcon("id")}
                  </th>
                  <th onClick={() => handleSort("name")} className="sortable-header">
                    Nom {getSortIcon("name")}
                  </th>
                  <th>Adresse</th>
                  <th onClick={() => handleSort("phone")} className="sortable-header">
                    Téléphone {getSortIcon("phone")}
                  </th>
                  <th onClick={() => handleSort("email")} className="sortable-header">
                    Email {getSortIcon("email")}
                  </th>
                  <th onClick={() => handleSort("is_active")} className="sortable-header">
                    Statut {getSortIcon("is_active")}
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-12">Aucun garage trouvé</td></tr>
                ) : (
                  paginated.map((g) => (
                    <tr key={g.id}>
                      <td className="font-medium">#{g.id}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-muted" />
                          <span>{g.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-muted" />
                          <span>{g.address || "—"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-muted" />
                          <span>{g.phone || "—"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-muted" />
                          <span>{g.email || "—"}</span>
                        </div>
                      </td>
                      <td>
                        {g.is_active ? (
                          <span className="badge badge-success"><CheckCircle size={12} /> Actif</span>
                        ) : (
                          <span className="badge badge-danger"><XCircle size={12} /> Inactif</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="action-icons">
                          <button onClick={() => handleEdit(g)} className="action-btn edit" title="Modifier">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteClick(g)} className="action-btn delete" title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
                totalItems={filteredGarages.length}
              />
            )}
          </div>
        </>
      )}

      {/* ====== DELETE MODAL ====== */}
      {deleteModalOpen && garageToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-card">
            <div className="delete-icon-box"><TrashIcon size={24} /></div>
            <h3>Confirmer la suppression</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer le garage <br />
              <strong>"{garageToDelete.name}"</strong> ?<br />
              Cette action est irréversible.
            </p>
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