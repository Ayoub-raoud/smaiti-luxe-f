// src/pages/admin/AdminSousLocations.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSousLocations,
  selectSousLocations,
  selectSousLocationsLoading,
  fetchSousLocationDetails,
  selectSelectedSousLocation,
  clearSelectedSousLocation,
  deleteSousLocation,
  createSousLocation,
  updateSousLocation,
} from '../../Redux/store';
import { 
  ChevronRight, Trash2, Edit, Plus, X, RefreshCw, Download,
  List, LayoutGrid, Search, Eye, Calendar, Users, Tag, AlertTriangle,
  Bell, ArrowUpDown, ArrowUp, ArrowDown, Save, Sparkles, Star,
  CheckCircle, XCircle, Info, Activity, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import PaginationControls from '../../components/PaginationControls';

export default function AdminSousLocations() {
  const dispatch = useDispatch();
  const sousLocations = useSelector(selectSousLocations);
  const loading = useSelector(selectSousLocationsLoading);
  const selected = useSelector(selectSelectedSousLocation);
  const [expandedId, setExpandedId] = useState(null);

  // View mode
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [listItemsPerPage, setListItemsPerPage] = useState(10);
  const [cardsItemsPerPage, setCardsItemsPerPage] = useState(12);

  // Sorting
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");

  // Modal state (now inline form)
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchSousLocations());
  }, [dispatch]);

  const handleViewDetails = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      dispatch(clearSelectedSousLocation());
    } else {
      setExpandedId(id);
      dispatch(fetchSousLocationDetails(id));
    }
  };

  const handleDeleteClick = (id, name) => {
    setItemToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await dispatch(deleteSousLocation(itemToDelete.id)).unwrap();
      toast.success('Sous‑location supprimée');
      if (expandedId === itemToDelete.id) {
        setExpandedId(null);
        dispatch(clearSelectedSousLocation());
      }
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await dispatch(fetchSousLocations(true));
    } catch (err) {
      toast.error(err.message || 'Erreur');
    }
  };

  const openCreateForm = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', status: 'active' });
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      status: item.status || 'active',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    setSubmitting(true);
    try {
      if (editingItem) {
        await dispatch(updateSousLocation({
          id: editingItem.id,
          data: formData
        })).unwrap();
        toast.success('Sous‑location modifiée');
      } else {
        await dispatch(createSousLocation(formData)).unwrap();
        toast.success('Sous‑location créée');
      }
      setShowForm(false);
      await dispatch(fetchSousLocations(true));
    } catch (err) {
      toast.error(err.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const refreshData = async () => {
    await dispatch(fetchSousLocations(true));
    toast.success('Liste actualisée');
  };

  const handleExport = () => {
    if (sousLocations.length === 0) {
      toast.warning('Aucune sous‑location à exporter');
      return;
    }
    const headers = ['ID', 'Nom', 'Description', 'Statut', 'Réservations', 'Créé le'];
    const rows = sousLocations.map(sl => [
      sl.id,
      `"${sl.name}"`,
      `"${(sl.description || '').replace(/"/g, '""')}"`,
      sl.status === 'active' ? 'Actif' : 'Inactif',
      sl.reservations_count || 0,
      new Date(sl.created_at).toLocaleDateString('fr-FR'),
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sous_locations_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link);
    toast.success('Export CSV effectué');
  };

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
    return sortDirection === "asc" ? <ArrowUp size={12} className="sort-icon active" /> : <ArrowDown size={12} className="sort-icon active" />;
  };

  // Filter and sort
  const filteredItems = sousLocations
    .filter(sl =>
      sl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sl.description && sl.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case "id": aVal = a.id; bVal = b.id; break;
        case "name": aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case "status": aVal = a.status || ""; bVal = b.status || ""; break;
        case "reservations": aVal = a.reservations_count || 0; bVal = b.reservations_count || 0; break;
        default: aVal = a.id; bVal = b.id;
      }
      if (sortDirection === "asc") return aVal > bVal ? 1 : -1;
      else return aVal < bVal ? 1 : -1;
    });

  const itemsPerPage = viewMode === 'list' ? listItemsPerPage : cardsItemsPerPage;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <span className="badge badge-success"><CheckCircle size={12} /> Actif</span>;
    }
    return <span className="badge badge-danger"><XCircle size={12} /> Inactif</span>;
  };

  // Stats
  const total = sousLocations.length;
  const active = sousLocations.filter(sl => sl.status === 'active').length;
  const inactive = total - active;
  const totalReservations = sousLocations.reduce((sum, sl) => sum + (sl.reservations_count || 0), 0);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement des sous‑locations...</p>
      </div>
    );
  }

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

        .view-toggle {
          display: flex; gap: 0; background: white; border: 1px solid #e2e8f0; border-radius: 9999px; overflow: hidden;
        }
        .view-btn {
          display: flex; align-items: center; gap: 0.5rem; padding: 0 0.875rem; height: 2.5rem;
          border: none; background: transparent; cursor: pointer; font-size: 0.75rem; font-weight: 500; color: #64748b; transition: 0.2s;
        }
        .view-btn.active { background: #0d4734; color: white; }
        .view-btn:hover:not(.active) { background: #f1f5f9; }

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

        /* TABLE (list view) */
        .smaiti-table-container {
          background: white; border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
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
        .badge-gray { background: #f1f5f9; color: #475569; }

        /* ACTION BUTTONS */
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
        .expand-icon { transition: transform 0.25s ease; color: #94a3b8; }
        .expand-icon.rotated { transform: rotate(90deg); }

        /* EXPANDABLE DETAILS */
        .expandable-details {
          padding: 1rem 1.5rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          background: #fafafa;
        }
        .expandable-details .detail-row {
          display: flex; gap: 1.5rem; flex-wrap: wrap;
        }
        .expandable-details .detail-item {
          flex: 1; min-width: 200px;
        }
        .expandable-details .detail-label {
          font-size: 0.7rem; font-weight: 600; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .expandable-details .detail-value {
          font-size: 0.875rem; color: #0f172a; margin-top: 0.25rem;
        }
        .expandable-details .reservations-subtable {
          margin-top: 1rem;
        }
        .expandable-details .reservations-subtable table {
          width: 100%; font-size: 0.75rem; border-collapse: collapse;
        }
        .expandable-details .reservations-subtable th {
          text-align: left; padding: 0.5rem 0.75rem;
          background: #f1f5f9; font-weight: 500; color: #475569;
        }
        .expandable-details .reservations-subtable td {
          padding: 0.5rem 0.75rem; border-top: 1px solid #e2e8f0;
        }

        /* CARDS VIEW */
        .cards-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem; margin-top: 1rem;
        }
        .sous-location-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
          padding: 1.25rem; transition: all 0.3s ease;
          display: flex; flex-direction: column;
        }
        .sous-location-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -12px rgba(0,0,0,0.1);
        }
        .card-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        .card-title {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 1.125rem; font-weight: 700;
        }
        .card-icon { color: #0d4734; }
        .card-body { flex: 1; }
        .card-description {
          font-size: 0.875rem; color: #475569;
          margin-bottom: 0.75rem; min-height: 2.5rem;
        }
        .card-stats {
          display: flex; flex-direction: column; gap: 0.25rem;
          font-size: 0.75rem; color: #64748b;
        }
        .stat-item { display: flex; align-items: center; gap: 0.5rem; }
        .card-actions {
          display: flex; gap: 0.5rem; margin-top: 0.75rem;
          padding-top: 0.75rem; border-top: 1px solid #e2e8f0;
        }
        .card-action-btn {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 0.5rem; padding: 0.5rem; border-radius: 0.5rem;
          border: 1px solid #e2e8f0; background: white;
          cursor: pointer; transition: all 0.2s; font-size: 0.75rem; font-weight: 500;
        }
        .card-action-btn:hover { background: #f1f5f9; }
        .card-action-btn.edit:hover { border-color: #0d4734; color: #0d4734; }
        .card-action-btn.delete:hover { border-color: #ef4444; color: #ef4444; }

        /* INLINE FORM (matching AdminCars) */
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
        .text-green { color: #16a34a; }
        .text-red { color: #dc2626; }
        .text-muted { color: #64748b; }

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
          .cards-grid { grid-template-columns: 1fr; }
          .inline-form-container { margin: 0; }
          .inline-form-header { padding: 16px 20px; }
          .inline-form-header h2 { font-size: 1.25rem; }
          .inline-form { padding: 20px; }
          .inline-grid-2 { grid-template-columns: 1fr; }
          .expandable-details .detail-row { flex-direction: column; }
          .view-toggle { width: 100%; justify-content: center; }
        }

        /* DARK MODE */
        @media (prefers-color-scheme: dark) {
          .admin-smaiti-page { background: #0f172a; color: #f1f5f9; }
          .smaiti-flotte { color: #f1f5f9; }
          .smaiti-notif-btn { background: #1e293b; border-color: #334155; color: #e2e8f0; }
          .smaiti-notif-btn:hover { background: #334155; }
          .stat-card, .smaiti-table-container, .search-wrapper, .inline-form-container,
          .delete-modal-card, .sous-location-card {
            background: #1e293b; border-color: #334155;
          }
          .stat-label, .smaiti-count, .inline-form-title p,
          .expandable-details .detail-label, .card-description,
          .card-stats, .delete-modal-card p { color: #94a3b8; }
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
          .badge-success { background: #14532d; color: #4ade80; }
          .badge-danger { background: #7f1d1d; color: #fca5a5; }
          .badge-gray { background: #334155; color: #cbd5e1; }
          .action-btn.edit { background: #334155; color: #cbd5e1; }
          .action-btn.delete { background: #7f1d1d; color: #fca5a5; }
          .action-btn.view { background: #1e3a5f; color: #60a5fa; }
          .smaiti-table thead { background: #0f172a; }
          .smaiti-table th { color: #94a3b8; }
          .smaiti-table tbody tr:hover { background: #334155; }
          .smaiti-table td { color: #e2e8f0; }
          .expandable-details {
            background: #0f172a; border-top-color: #334155;
          }
          .expandable-details .detail-value { color: #f1f5f9; }
          .expandable-details .reservations-subtable th {
            background: #0f172a; color: #94a3b8;
          }
          .expandable-details .reservations-subtable td {
            border-top-color: #334155;
          }
          .card-actions { border-top-color: #334155; }
          .card-action-btn {
            background: #0f172a; border-color: #334155; color: #e2e8f0;
          }
          .card-action-btn:hover { background: #1e293b; }
          .card-action-btn.edit:hover { border-color: #0d4734; color: #0d4734; }
          .card-action-btn.delete:hover { border-color: #ef4444; color: #ef4444; }
          .view-toggle { background: #0f172a; border-color: #334155; }
          .view-btn { color: #94a3b8; }
          .view-btn.active { background: #0d4734; color: white; }
          .delete-icon-box { background: #7f1d1d; color: #fca5a5; }
          .modal-btn-cancel { background: #334155; color: #e2e8f0; border: none; }
          .modal-btn-cancel:hover { background: #475569; }
          .modal-btn-delete { background: #dc2626; color: white; }
          .modal-btn-delete:hover { background: #b91c1c; }
          .sortable-header:hover { background: #334155; }
        }

        html, body { overflow-x: auto !important; min-width: 320px; }
        .admin-smaiti-page, .inline-form-container { overflow-x: auto !important; min-width: 0; width: 100%; }
        .inline-form, .expandable-details { overflow-x: auto !important; }
        .inline-form-grid { min-width: 600px; }
        @media (max-width: 768px) { .inline-form-grid { min-width: 100%; } }
        .smaiti-table-container { overflow-x: auto; }
        .smaiti-table { min-width: 800px; }
      `}</style>

      {/* TOPBAR */}
      <div className="smaiti-topbar">
        <div className="smaiti-logo-area">
          <span className="smaiti-brand">SMAITI LUXE</span>
          <span className="smaiti-flotte">Sous‑locations</span>
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
          <div><p className="stat-label">Total</p><p className="stat-number">{total}</p></div>
          <Tag size={28} className="stat-icon" />
        </div>
        <div className="stat-card">
          <div><p className="stat-label">Actives</p><p className="stat-number text-green">{active}</p></div>
          <CheckCircle size={28} className="stat-icon" style={{ color: '#16a34a' }} />
        </div>
        <div className="stat-card">
          <div><p className="stat-label">Inactives</p><p className="stat-number text-red">{inactive}</p></div>
          <XCircle size={28} className="stat-icon" style={{ color: '#dc2626' }} />
        </div>
        <div className="stat-card">
          <div><p className="stat-label">Réservations totales</p><p className="stat-number">{totalReservations}</p></div>
          <Calendar size={28} className="stat-icon" />
        </div>
      </div>

      {showForm ? (
        /* ====== INLINE FORM ====== */
        <div className="inline-form-container">
          <div className="inline-form-header">
            <div className="inline-form-icon">
              {editingItem ? <Sparkles size={24} /> : <Plus size={24} />}
            </div>
            <div className="inline-form-title">
              <h2>{editingItem ? "Modifier la sous‑location" : "Nouvelle sous‑location"}</h2>
              <p>{editingItem ? "Modifiez les informations de la sous‑location" : "Ajoutez une nouvelle sous‑location à votre flotte"}</p>
            </div>
            <button
              onClick={() => { setShowForm(false); setEditingItem(null); }}
              className="inline-form-close"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="inline-form">
            <div className="inline-form-grid">
              <div className="inline-form-col">
                <div className="inline-section">
                  <div className="inline-section-header">
                    <Tag size={18} className="section-icon" />
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
                        placeholder="Ex: Location groupe"
                      />
                    </div>
                    <div className="inline-field">
                      <label>Statut</label>
                      <select
                        className="inline-select"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </select>
                    </div>
                  </div>
                  <div className="inline-field" style={{ marginTop: '1rem' }}>
                    <label>Description</label>
                    <textarea
                      className="inline-textarea"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description facultative"
                    />
                  </div>
                </div>
              </div>

              <div className="inline-form-col">
                <div className="inline-section">
                  <div className="inline-section-header">
                    <Info size={18} className="section-icon" />
                    <h3>Informations système</h3>
                  </div>
                  <div className="inline-info-message">
                    <Info size={16} />
                    <span>Les sous‑locations permettent de regrouper des réservations pour un même événement ou client.</span>
                  </div>
                  {editingItem && (
                    <div className="inline-info-grid" style={{ marginTop: '1rem' }}>
                      <div className="inline-info-item">
                        <span className="info-label">Date de création</span>
                        <span className="info-value">
                          {new Date(editingItem.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="inline-info-item">
                        <span className="info-label">Dernière modification</span>
                        <span className="info-value">
                          {new Date(editingItem.updated_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="inline-info-item">
                        <span className="info-label">Réservations associées</span>
                        <span className="info-value">{editingItem.reservations_count || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="inline-form-footer">
              <button
                type="button"
                className="inline-secondary-btn"
                onClick={() => { setShowForm(false); setEditingItem(null); }}
              >
                Annuler
              </button>
              <button type="submit" className="inline-primary-btn" disabled={submitting}>
                {submitting ? "Traitement..." : (editingItem ? "Mettre à jour" : "Créer la sous‑location")}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ====== MAIN LIST ====== */
        <>
          {/* ACTION BAR */}
          <div className="smaiti-actions-wrapper">
            <span className="smaiti-count">{filteredItems.length} enregistrement(s)</span>
            <div className="smaiti-actions-buttons">
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => { setViewMode('list'); setCurrentPage(1); }}
                >
                  <List size={14} /> Liste
                </button>
                <button
                  className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => { setViewMode('cards'); setCurrentPage(1); }}
                >
                  <LayoutGrid size={14} /> Cartes
                </button>
              </div>
              <button onClick={handleExport} className="btn btn-secondary">
                <Download size={14} /> Exporter
              </button>
              <button onClick={openCreateForm} className="btn btn-primary">
                <Plus size={14} /> Nouvelle sous‑location
              </button>
            </div>
          </div>

          {/* SEARCH */}
          <div className="search-wrapper">
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher par nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* LIST VIEW */}
          {viewMode === 'list' ? (
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
                    <th>Description</th>
                    <th onClick={() => handleSort("status")} className="sortable-header">
                      Statut {getSortIcon("status")}
                    </th>
                    <th onClick={() => handleSort("reservations")} className="sortable-header">
                      Réservations {getSortIcon("reservations")}
                    </th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12">Aucune sous‑location trouvée</td>
                    </tr>
                  ) : (
                    paginatedItems.map((sl) => (
                      <React.Fragment key={sl.id}>
                        <tr>
                          <td className="font-medium">#{sl.id}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <Tag size={14} className="text-muted" />
                              <span className="font-medium">{sl.name}</span>
                            </div>
                          </td>
                          <td>
                            <div className="truncate" style={{ maxWidth: '200px' }}>
                              {sl.description || '—'}
                            </div>
                          </td>
                          <td>{getStatusBadge(sl.status)}</td>
                          <td>
                            <span className="badge badge-gray">{sl.reservations_count || 0}</span>
                          </td>
                          <td>
                            <div className="action-icons">
                              <button
                                onClick={() => openEditForm(sl)}
                                className="action-btn edit"
                                title="Modifier"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(sl.id, sl.name)}
                                className="action-btn delete"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                onClick={() => handleViewDetails(sl.id)}
                                className="action-btn view"
                                title={expandedId === sl.id ? "Masquer les détails" : "Voir les détails"}
                              >
                                <ChevronRight size={16} className={`expand-icon ${expandedId === sl.id ? 'rotated' : ''}`} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedId === sl.id && selected && (
                          <tr>
                            <td colSpan="6" className="expandable-details">
                              <div className="detail-row">
                                <div className="detail-item">
                                  <div className="detail-label">Description</div>
                                  <div className="detail-value">{selected.description || 'Aucune description'}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">Statut</div>
                                  <div className="detail-value">{getStatusBadge(selected.status)}</div>
                                </div>
                                <div className="detail-item">
                                  <div className="detail-label">Date de création</div>
                                  <div className="detail-value">{new Date(selected.created_at).toLocaleDateString('fr-FR')}</div>
                                </div>
                              </div>
                              <div className="reservations-subtable">
                                <div className="detail-label" style={{ marginBottom: '0.5rem' }}>
                                  Réservations associées ({selected.reservations?.length || 0})
                                </div>
                                {selected.reservations && selected.reservations.length > 0 ? (
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>ID</th>
                                        <th>Client</th>
                                        <th>Véhicule</th>
                                        <th>Période</th>
                                        <th>Statut</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selected.reservations.map(res => (
                                        <tr key={res.id}>
                                          <td>#{res.id}</td>
                                          <td>{res.client?.prenom} {res.client?.nom}</td>
                                          <td>{res.car?.brand} {res.car?.model}</td>
                                          <td>{res.start_date} → {res.end_date}</td>
                                          <td>
                                            <span className={`badge ${
                                              res.status === 'confirmed' ? 'badge-success' :
                                              res.status === 'cancelled' ? 'badge-danger' :
                                              'badge-gray'
                                            }`}>
                                              {res.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="text-muted" style={{ padding: '0.5rem 0' }}>Aucune réservation</div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={listItemsPerPage}
                  onItemsPerPageChange={setListItemsPerPage}
                  totalItems={filteredItems.length}
                />
              )}
            </div>
          ) : (
            /* ====== CARDS VIEW ====== */
            <>
              <div className="cards-grid">
                {paginatedItems.length === 0 ? (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Aucune sous‑location
                  </div>
                ) : (
                  paginatedItems.map(sl => (
                    <div key={sl.id} className="sous-location-card">
                      <div className="card-header">
                        <div className="card-title">
                          <Tag size={20} className="card-icon" />
                          <span>{sl.name}</span>
                        </div>
                        <div className="card-status-badge">
                          {getStatusBadge(sl.status)}
                        </div>
                      </div>
                      <div className="card-body">
                        <p className="card-description">
                          {sl.description || 'Aucune description'}
                        </p>
                        <div className="card-stats">
                          <div className="stat-item">
                            <Users size={14} />
                            <span>{sl.reservations_count || 0} réservation(s)</span>
                          </div>
                          <div className="stat-item">
                            <Calendar size={14} />
                            <span>Créé le {new Date(sl.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button onClick={() => openEditForm(sl)} className="card-action-btn edit">
                          <Edit size={14} /> Modifier
                        </button>
                        <button onClick={() => handleDeleteClick(sl.id, sl.name)} className="card-action-btn delete">
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={cardsItemsPerPage}
                  onItemsPerPageChange={setCardsItemsPerPage}
                  totalItems={filteredItems.length}
                />
              )}
            </>
          )}
        </>
      )}

      {/* ====== DELETE MODAL ====== */}
      {deleteModalOpen && itemToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-card">
            <div className="delete-icon-box"><AlertTriangle size={24} /></div>
            <h3>Confirmer la suppression</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer la sous‑location <br />
              <strong>"{itemToDelete.name}"</strong> ?<br />
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