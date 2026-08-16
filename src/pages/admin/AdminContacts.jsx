// src/pages/admin/AdminContacts.jsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchContacts,
  deleteContact,
  selectContacts,
  selectContactsLoading,
  fetchContactsCount,
  fetchRecentContacts,
} from "../../Redux/store";
import PaginationControls from '../../components/PaginationControls';
import { toast } from "sonner";
import {
  Trash2, Eye, Search, RefreshCw, ChevronLeft, ChevronRight,
  Mail, Phone, User, Calendar, MessageSquare, X, ArrowUpDown,
  ArrowUp, ArrowDown, Download, TrashIcon, AlertTriangle,
  Inbox, Clock, Sparkles, Bell
} from "lucide-react";

export default function AdminContacts() {
  const dispatch = useDispatch();
  const contacts = useSelector(selectContacts);
  const loading = useSelector(selectContactsLoading);

  // UI state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("desc");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load contacts
  useEffect(() => {
    dispatch(fetchContacts());
    dispatch(fetchContactsCount());
    dispatch(fetchRecentContacts());
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
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => {
        const matchesSearch =
          searchTerm === "" ||
          c.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm) ||
          c.message.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        let aVal, bVal;
        switch (sortField) {
          case "id": aVal = a.id; bVal = b.id; break;
          case "fullname": aVal = a.fullname.toLowerCase(); bVal = b.fullname.toLowerCase(); break;
          case "email": aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); break;
          case "phone": aVal = a.phone || ""; bVal = b.phone || ""; break;
          case "created_at": aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime(); break;
          default: aVal = a.id; bVal = b.id;
        }
        return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
  }, [contacts, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const paginated = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    total: contacts.length,
    lastMessage: contacts.length > 0 ? new Date(contacts[0].created_at) : null,
  };

  const handleDeleteClick = (contact) => {
    setContactToDelete(contact);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    const result = await dispatch(deleteContact(contactToDelete.id));
    if (result.error) toast.error(result.payload);
    else {
      toast.success("Message supprimé");
      dispatch(fetchContacts(true));
      dispatch(fetchContactsCount());
    }
    setDeleteModalOpen(false);
    setContactToDelete(null);
  };

  const handleViewDetails = (contact) => {
    setSelectedContact(contact);
    setShowDetails(true);
  };

  const refreshData = async () => {
    await dispatch(fetchContacts(true));
    await dispatch(fetchContactsCount());
    await dispatch(fetchRecentContacts());
    toast.success("Données actualisées");
  };

  const handleExport = () => {
    const headers = ["ID", "Nom", "Email", "Téléphone", "Message", "Date"];
    const csvData = filteredContacts.map((c) => [
      c.id,
      `"${c.fullname}"`,
      `"${c.email}"`,
      `"${c.phone}"`,
      `"${c.message.replace(/"/g, '""')}"`,
      `"${new Date(c.created_at).toLocaleDateString("fr-FR")}"`,
    ].join(","));
    const blob = new Blob([headers.join(",") + "\n" + csvData.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV effectué");
  };

  // Loading
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Chargement des messages...</p>
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

        /* TABLE (bigger, compact) */
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

        .message-preview {
          max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          color: #475569;
        }

        /* ACTION BUTTONS */
        .action-icons { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
        .action-btn {
          width: 32px; height: 32px; border-radius: 50%;
          border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s; background: transparent;
        }
        .action-btn.view { background: #dbeafe; color: #3b82f6; }
        .action-btn.delete { background: #fee2e2; color: #ef4444; }
        .action-btn:hover { transform: scale(1.05); }
        .action-btn svg { width: 16px; height: 16px; }

        /* DETAILS MODAL */
        .details-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px); display: flex; align-items: center;
          justify-content: center; z-index: 1000;
        }
        .details-modal {
          background: white; border-radius: 24px; padding: 32px;
          max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;
        }
        .details-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.5rem; padding-bottom: 1rem;
          border-bottom: 2px solid #0d4734;
        }
        .details-modal-header h3 {
          font-size: 1.25rem; font-weight: 700; color: #0f172a;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .details-modal-close {
          background: #f1f5f9; border: none; border-radius: 50%;
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s;
        }
        .details-modal-close:hover { background: #e2e8f0; }
        .details-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
        }
        .detail-item { display: flex; flex-direction: column; }
        .detail-item label {
          font-size: 0.7rem; font-weight: 600; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;
        }
        .detail-item p { font-size: 0.875rem; margin: 0; color: #0f172a; }
        .detail-item a { color: #0d4734; text-decoration: none; }
        .detail-item a:hover { text-decoration: underline; }
        .message-content {
          background: #f8fafc; border-radius: 0.75rem; padding: 1rem;
          white-space: pre-wrap; font-size: 0.875rem;
          border: 1px solid #e2e8f0; min-height: 80px;
        }
        .details-modal-footer {
          display: flex; justify-content: flex-end; margin-top: 1.5rem;
          padding-top: 1rem; border-top: 1px solid #e2e8f0;
        }
        .btn-secondary-full {
          background: white; border: 1.5px solid #e2e8f0;
          padding: 10px 24px; border-radius: 40px; font-size: 0.875rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .btn-secondary-full:hover { border-color: #0d4734; color: #0d4734; background: #f8fafc; }

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
        .text-muted { color: #64748b; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
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
          .details-grid { grid-template-columns: 1fr; }
          .details-modal { padding: 20px; }
          .message-preview { max-width: 120px; }
        }

        /* DARK MODE */
        @media (prefers-color-scheme: dark) {
          .admin-smaiti-page { background: #0f172a; color: #f1f5f9; }
          .smaiti-flotte { color: #f1f5f9; }
          .smaiti-notif-btn { background: #1e293b; border-color: #334155; color: #e2e8f0; }
          .smaiti-notif-btn:hover { background: #334155; }
          .stat-card, .smaiti-table-container, .search-wrapper,
          .details-modal, .delete-modal-card {
            background: #1e293b; border-color: #334155;
          }
          .stat-label, .smaiti-count, .detail-item label,
          .delete-modal-card p, .message-preview { color: #94a3b8; }
          .stat-number { color: #f1f5f9; }
          .btn-secondary { background: #334155; color: #e2e8f0; border-color: #475569; }
          .btn-secondary:hover { background: #475569; }
          .btn-primary { background: #0d4734; color: white; }
          .btn-primary:hover { background: #0a3a2a; }
          .search-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
          .search-input:focus { border-color: #0d4734; box-shadow: 0 0 0 2px rgba(13, 71, 52, 0.3); }
          .smaiti-table thead { background: #0f172a; }
          .smaiti-table th { color: #94a3b8; }
          .smaiti-table tbody tr:hover { background: #334155; }
          .smaiti-table td { color: #e2e8f0; }
          .action-btn.view { background: #1e3a5f; color: #60a5fa; }
          .action-btn.delete { background: #7f1d1d; color: #fca5a5; }
          .details-modal-header { border-bottom-color: #0d4734; }
          .details-modal-header h3 { color: #f1f5f9; }
          .details-modal-close { background: #334155; color: #e2e8f0; }
          .details-modal-close:hover { background: #475569; }
          .detail-item p { color: #f1f5f9; }
          .detail-item a { color: #4ade80; }
          .message-content { background: #0f172a; border-color: #334155; color: #e2e8f0; }
          .details-modal-footer { border-top-color: #334155; }
          .btn-secondary-full {
            background: #1e293b; border-color: #475569; color: #e2e8f0;
          }
          .btn-secondary-full:hover { border-color: #0d4734; color: #0d4734; background: #334155; }
          .delete-icon-box { background: #7f1d1d; color: #fca5a5; }
          .modal-btn-cancel { background: #334155; color: #e2e8f0; border: none; }
          .modal-btn-cancel:hover { background: #475569; }
          .modal-btn-delete { background: #dc2626; color: white; }
          .modal-btn-delete:hover { background: #b91c1c; }
          .sortable-header:hover { background: #334155; }
        }

        html, body { overflow-x: auto !important; min-width: 320px; }
        .admin-smaiti-page, .inline-form-container { overflow-x: auto !important; min-width: 0; width: 100%; }
        .smaiti-table-container { overflow-x: auto; }
        .smaiti-table { min-width: 800px; }
      `}</style>

      {/* TOPBAR */}
      <div className="smaiti-topbar">
        <div className="smaiti-logo-area">
          <span className="smaiti-brand">SMAITI LUXE</span>
          <span className="smaiti-flotte">Messages</span>
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
          <Inbox size={28} className="stat-icon" />
        </div>
        <div className="stat-card">
          <div>
            <p className="stat-label">Dernier message</p>
            <p className="stat-number" style={{ fontSize: "1rem" }}>
              {stats.lastMessage ? stats.lastMessage.toLocaleDateString("fr-FR") : "—"}
            </p>
          </div>
          <Clock size={28} className="stat-icon" />
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="smaiti-actions-wrapper">
        <span className="smaiti-count">{filteredContacts.length} enregistrement(s)</span>
        <div className="smaiti-actions-buttons">
          <button onClick={handleExport} className="btn btn-secondary">
            <Download size={14} /> Exporter
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="search-wrapper">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone ou message..."
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
              <th onClick={() => handleSort("fullname")} className="sortable-header">
                Nom {getSortIcon("fullname")}
              </th>
              <th onClick={() => handleSort("email")} className="sortable-header">
                Email {getSortIcon("email")}
              </th>
              <th onClick={() => handleSort("phone")} className="sortable-header">
                Téléphone {getSortIcon("phone")}
              </th>
              <th>Message</th>
              <th onClick={() => handleSort("created_at")} className="sortable-header">
                Date {getSortIcon("created_at")}
              </th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-12">Aucun message trouvé</td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">#{c.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-muted" />
                      <span>{c.fullname}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-muted" />
                      <span>{c.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-muted" />
                      <span>{c.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="message-preview">
                      {c.message.length > 60 ? c.message.slice(0, 60) + "..." : c.message}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-muted" />
                      <span>{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </td>
                  <td>
                    <div className="action-icons">
                      <button
                        onClick={() => handleViewDetails(c)}
                        className="action-btn view"
                        title="Voir les détails"
                      >
                        <Eye size={14} />
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
            totalItems={filteredContacts.length}
          />
        )}
      </div>

      {/* ====== DETAILS MODAL ====== */}
      {showDetails && selectedContact && (
        <div className="details-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <h3><MessageSquare size={20} /> Détails du message</h3>
              <button className="details-modal-close" onClick={() => setShowDetails(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <label>Nom complet</label>
                <p>{selectedContact.fullname}</p>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <p><a href={`mailto:${selectedContact.email}`}>{selectedContact.email}</a></p>
              </div>
              <div className="detail-item">
                <label>Téléphone</label>
                <p><a href={`tel:${selectedContact.phone}`}>{selectedContact.phone}</a></p>
              </div>
              <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
                <label>Message</label>
                <div className="message-content">{selectedContact.message}</div>
              </div>
              <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
                <label>Reçu le</label>
                <p>{new Date(selectedContact.created_at).toLocaleString("fr-FR")}</p>
              </div>
            </div>
            <div className="details-modal-footer">
              <button className="btn-secondary-full" onClick={() => setShowDetails(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {deleteModalOpen && contactToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-card">
            <div className="delete-icon-box"><AlertTriangle size={24} /></div>
            <h3>Confirmer la suppression</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer le message de <br />
              <strong>"{contactToDelete.fullname}"</strong> ?<br />
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