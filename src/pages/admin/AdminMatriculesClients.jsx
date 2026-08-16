// src/pages/admin/AdminMatriculesClients.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchMatricules, fetchCars, fetchReservations, fetchClients, refreshMatricules,
  selectMatricules, selectCars, selectMatriculesLoading, selectReservations, selectClients
} from "../../Redux/store";
import PaginationControls from '../../components/PaginationControls';
import { toast } from "sonner";
import {
  Search, RefreshCw, Bell, Tag, Car, User, Users, Clock, CalendarDays,
  DollarSign, Wallet, ArrowUpDown, ArrowUp, ArrowDown, X,
  ExternalLink, History, CheckCircle2, UserX, Receipt
} from "lucide-react";

export default function AdminMatriculesClients() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const matricules = useSelector(selectMatricules);
  const cars = useSelector(selectCars);
  const reservations = useSelector(selectReservations);
  const clients = useSelector(selectClients);
  const loading = useSelector(selectMatriculesLoading);

  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('all'); // all | current | previous | none
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('matricule');
  const [sortDirection, setSortDirection] = useState('asc');
  const [historyMatricule, setHistoryMatricule] = useState(null);

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const loadData = async () => {
    await Promise.all([
      dispatch(fetchMatricules()),
      dispatch(fetchCars()),
      dispatch(fetchClients()),
      dispatch(fetchReservations())
    ]);
  };

  const refreshData = async () => {
    await dispatch(refreshMatricules());
    await dispatch(fetchCars());
    await dispatch(fetchClients());
    await dispatch(fetchReservations());
    toast.success("Données actualisées");
  };

  // ==================== HELPERS ====================
  const getMatriculeReservations = (matId) =>
    (reservations || [])
      .filter(r => r.matricule_id === matId)
      .filter(r => !['pending', 'cancelled', 'contacted'].includes(r.status));

  const getCurrentReservation = (matId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getMatriculeReservations(matId)
      .filter(r => ['confirmed', 'retard'].includes(r.status))
      .filter(r => r.end_date && new Date(r.end_date) >= today)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0] || null;
  };

  const getLastReservation = (matId) => {
    const list = getMatriculeReservations(matId);
    if (!list.length) return null;
    return [...list].sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
  };

  const getDisplayReservation = (matId) => {
    const current = getCurrentReservation(matId);
    if (current) return { reservation: current, isCurrent: true };
    const last = getLastReservation(matId);
    return { reservation: last, isCurrent: false };
  };

  // Sum remaining for all reservations of this matricule (for global stats)
  const getTotalRemainingAll = (matId) =>
    getMatriculeReservations(matId).reduce((sum, r) => sum + (parseFloat(r.remaining_amount) || 0), 0);

  // NEW: sum remaining for a specific client on this matricule
  const getTotalRemainingForClient = (matId, clientId) => {
    if (!clientId) return 0;
    return getMatriculeReservations(matId)
      .filter(r => r.client_id === clientId)
      .reduce((sum, r) => sum + (parseFloat(r.remaining_amount) || 0), 0);
  };

  const calcDurationDays = (start, end) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const formatMoney = (val) => `${(parseFloat(val) || 0).toLocaleString('fr-FR')} DH`;
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

  const reservationStatusLabel = {
    pending: { label: 'En attente', bg: 'badge-amber' },
    confirmed: { label: 'Confirmée', bg: 'badge-published' },
    completed: { label: 'Terminée', bg: 'badge-available' },
    retard: { label: 'En retard', bg: 'badge-rented' },
    contacted: { label: 'Contacté', bg: 'badge-amber' },
    cancelled: { label: 'Annulée', bg: 'badge-rented' },
  };

  // ==================== SORT ====================
  const handleSort = (field) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };
  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon" />;
    return sortDirection === 'asc' ? <ArrowUp size={12} className="sort-icon active" /> : <ArrowDown size={12} className="sort-icon active" />;
  };

  // ==================== ENRICH + FILTER + SORT ====================
  const enriched = (matricules || []).map(mat => {
    const car = cars.find(c => c.id === mat.car_id);
    const { reservation: dispRes, isCurrent } = getDisplayReservation(mat.id);
    const client = dispRes ? clients.find(c => c.id === dispRes.client_id) : null;
    const duration = dispRes ? calcDurationDays(dispRes.start_date, dispRes.end_date) : null;
    // --- NEW: total remaining for this specific client (not all clients) ---
    const totalRestantForClient = getTotalRemainingForClient(mat.id, client?.id);
    return { mat, car, dispRes, isCurrent, client, duration, totalRestantForClient };
  });

  const filteredList = enriched.filter(({ mat, car, client, isCurrent }) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      mat.matricule_code?.toLowerCase().includes(term) ||
      car?.brand?.toLowerCase().includes(term) ||
      car?.model?.toLowerCase().includes(term) ||
      (client && `${client.prenom} ${client.nom}`.toLowerCase().includes(term));

    let matchesClientFilter = true;
    if (clientFilter === 'current') matchesClientFilter = isCurrent;
    else if (clientFilter === 'previous') matchesClientFilter = !isCurrent && !!client;
    else if (clientFilter === 'none') matchesClientFilter = !client;

    return matchesSearch && matchesClientFilter;
  }).sort((a, b) => {
    let aVal, bVal;
    switch (sortField) {
      case 'matricule':
        aVal = a.mat.matricule_code?.toLowerCase() || ''; bVal = b.mat.matricule_code?.toLowerCase() || ''; break;
      case 'car':
        aVal = a.car ? `${a.car.brand} ${a.car.model}`.toLowerCase() : '';
        bVal = b.car ? `${b.car.brand} ${b.car.model}`.toLowerCase() : '';
        break;
      case 'client':
        aVal = a.client ? `${a.client.prenom} ${a.client.nom}`.toLowerCase() : '';
        bVal = b.client ? `${b.client.prenom} ${b.client.nom}`.toLowerCase() : '';
        break;
      case 'duration':
        aVal = a.duration || 0; bVal = b.duration || 0; break;
      case 'total':
        aVal = a.dispRes ? parseFloat(a.dispRes.total_price) || 0 : 0;
        bVal = b.dispRes ? parseFloat(b.dispRes.total_price) || 0 : 0;
        break;
      case 'paid':
        aVal = a.dispRes ? parseFloat(a.dispRes.amount_paid) || 0 : 0;
        bVal = b.dispRes ? parseFloat(b.dispRes.amount_paid) || 0 : 0;
        break;
      case 'remaining':
        aVal = a.dispRes ? parseFloat(a.dispRes.remaining_amount) || 0 : 0;
        bVal = b.dispRes ? parseFloat(b.dispRes.remaining_amount) || 0 : 0;
        break;
      // --- UPDATED: sort by totalRestantForClient (per client) ---
      case 'totalRemaining':
        aVal = a.totalRestantForClient || 0;
        bVal = b.totalRestantForClient || 0;
        break;
      default:
        aVal = a.mat.id; bVal = b.mat.id;
    }
    if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginated = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ==================== STATS (global, not per client) ====================
  const stats = {
    total: matricules?.length || 0,
    withCurrent: enriched.filter(e => e.isCurrent).length,
    withoutClient: enriched.filter(e => !e.client).length,
    totalDue: enriched.reduce((sum, e) => sum + getTotalRemainingAll(e.mat.id), 0) // still all clients
  };

  // ==================== ACTIONS ====================
  const handleOpenHistory = (mat) => setHistoryMatricule(mat);
  const handleCloseHistory = () => setHistoryMatricule(null);
  const handleGoToMatricule = () => navigate('/matricules');

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Chargement...</p>
    </div>
  );

  const historyReservations = historyMatricule
    ? [...getMatriculeReservations(historyMatricule.id)].sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
    : [];
  const historyCar = historyMatricule ? cars.find(c => c.id === historyMatricule.car_id) : null;

  return (
    <>
      {historyMatricule ? (
        /* ==================== HISTORY MODAL VIEW ==================== */
        <div className="modal-glass-container" style={{ maxWidth: '900px', margin: '1rem auto' }}>
          <div className="modal-header-hero info-hero">
            <div className="hero-left">
              <div className="hero-icon-wrapper info-glow"><History size={24} /></div>
              <div className="hero-text">
                <span className="hero-badge info-badge">Historique</span>
                <h2>{historyMatricule.matricule_code}</h2>
                <p>{historyCar ? `${historyCar.brand} ${historyCar.model}` : 'Véhicule non assigné'}</p>
              </div>
            </div>
            <button onClick={handleCloseHistory} className="hero-close-btn"><X size={20} /></button>
          </div>

          <div className="modal-body-details">
            <div className="details-overview-grid">
              <div className="overview-card">
                <div className="overview-icon"><Receipt size={18} /></div>
                <div className="overview-info">
                  <span className="overview-label">Réservations</span>
                  <span className="overview-value">{historyReservations.length}</span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon"><Wallet size={18} /></div>
                <div className="overview-info">
                  <span className="overview-label">Total dû (toutes réservations)</span>
                  <span className="overview-value">{formatMoney(getTotalRemainingAll(historyMatricule.id))}</span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon"><CheckCircle2 size={18} /></div>
                <div className="overview-info">
                  <span className="overview-label">Statut matricule</span>
                  <span className="overview-value">{historyMatricule.status}</span>
                </div>
              </div>
            </div>

            <div className="smaiti-table-container history-table-container">
              <table className="smaiti-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Période</th>
                    <th>Durée</th>
                    <th>Statut</th>
                    <th>Total</th>
                    <th>Payé</th>
                    <th>Restant</th>
                  </tr>
                </thead>
                <tbody>
                  {historyReservations.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-12">Aucune réservation pour ce matricule</td></tr>
                  ) : (
                    historyReservations.map(res => {
                      const client = clients.find(c => c.id === res.client_id);
                      const statusInfo = reservationStatusLabel[res.status] || { label: res.status, bg: 'badge-published' };
                      const duration = calcDurationDays(res.start_date, res.end_date);
                      return (
                        <tr key={res.id}>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{client ? `${client.prenom} ${client.nom}` : '—'}</td>
                          <td>{formatDate(res.start_date)} → {formatDate(res.end_date)}</td>
                          <td>{duration ? `${duration} jours` : '—'}</td>
                          <td><span className={`badge ${statusInfo.bg}`}>{statusInfo.label}</span></td>
                          <td style={{ fontWeight: 600 }}>{formatMoney(res.total_price)}</td>
                          <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatMoney(res.amount_paid)}</td>
                          <td style={{ color: '#dc2626', fontWeight: 600 }}>{formatMoney(res.remaining_amount)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-footer-actions">
              <button onClick={handleCloseHistory} className="btn btn-secondary">Fermer</button>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== MAIN LIST VIEW ==================== */
        <div className="admin-smaiti-page">
          <div>
            <div className="smaiti-topbar">
              <div className="smaiti-logo-area">
                <span className="smaiti-brand">SMAITI LUXE</span>
                <span className="smaiti-flotte">Clients par matricule</span>
              </div>
              <div className="smaiti-right-actions">
                <div className="smaiti-search-bar">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher plaque/voiture/client..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
                <div><p className="stat-label">Avec client actuel</p><p className="stat-number" style={{ color: '#16a34a' }}>{stats.withCurrent}</p></div>
                <Users size={28} className="stat-icon" style={{ color: '#16a34a' }} />
              </div>
              <div className="stat-card">
                <div><p className="stat-label">Sans aucun client</p><p className="stat-number" style={{ color: '#94a3b8' }}>{stats.withoutClient}</p></div>
                <UserX size={28} className="stat-icon" style={{ color: '#94a3b8' }} />
              </div>
              <div className="stat-card">
                <div><p className="stat-label">Total dû (tous clients)</p><p className="stat-number" style={{ color: '#dc2626' }}>{formatMoney(stats.totalDue)}</p></div>
                <Wallet size={28} className="stat-icon" style={{ color: '#dc2626' }} />
              </div>
            </div>

            <div className="smaiti-actions-wrapper">
              <span className="smaiti-count">{filteredList.length} matricule(s)</span>
              <div className="smaiti-actions-buttons">
                <select
                  className="status-select-filter"
                  value={clientFilter}
                  onChange={(e) => { setClientFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">Tous les clients</option>
                  <option value="current">Client actuel</option>
                  <option value="previous">Client précédent</option>
                  <option value="none">Sans client</option>
                </select>
              </div>
            </div>

            <div className="smaiti-table-container">
              <table className="smaiti-table fin-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("matricule")} className="sortable-header">Plaque {getSortIcon("matricule")}</th>
                    <th onClick={() => handleSort("car")} className="sortable-header">Véhicule associé {getSortIcon("car")}</th>
                    <th onClick={() => handleSort("client")} className="sortable-header">Client {getSortIcon("client")}</th>
                    <th onClick={() => handleSort("duration")} className="sortable-header">Durée {getSortIcon("duration")}</th>
                    <th onClick={() => handleSort("total")} className="sortable-header">Total {getSortIcon("total")}</th>
                    <th onClick={() => handleSort("paid")} className="sortable-header">Payé {getSortIcon("paid")}</th>
                    <th onClick={() => handleSort("remaining")} className="sortable-header">Restant {getSortIcon("remaining")}</th>
                    <th onClick={() => handleSort("totalRemaining")} className="sortable-header">Total dû {getSortIcon("totalRemaining")}</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan="9" className="text-center py-12">Aucun matricule trouvé</td></tr>
                  ) : (
                    paginated.map(({ mat, car, dispRes, isCurrent, client, duration, totalRestantForClient }) => (
                      <tr key={mat.id}>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{mat.matricule_code}</td>
                        <td>{car ? `${car.brand} ${car.model}` : 'Non assigné'}</td>
                        <td>
                          {client ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span className={`badge ${isCurrent ? 'badge-available' : 'badge-amber'}`}>
                                {isCurrent ? 'Actuel' : 'Précédent'}
                              </span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>
                                {client.prenom} {client.nom}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucun client</span>
                          )}
                        </td>
                        <td>{duration ? `${duration} jours` : '—'}</td>
                        <td>
                          {dispRes ? (
                            <div>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatMoney(dispRes.total_price)}</span>
                              {!isCurrent && (
                                <div style={{ fontSize: '0.62rem', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
                                  Client précédent
                                </div>
                              )}
                            </div>
                          ) : '—'}
                        </td>
                        <td>
                          {dispRes ? (
                            <span style={{ fontWeight: 600, color: '#16a34a' }}>{formatMoney(dispRes.amount_paid)}</span>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>—</span>
                          )}
                        </td>
                        <td>
                          {dispRes ? (
                            <span style={{ fontWeight: 600, color: '#dc2626' }}>{formatMoney(dispRes.remaining_amount)}</span>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>—</span>
                          )}
                        </td>
                        {/* --- UPDATED: show totalRestantForClient (per client) --- */}
                        <td>
                          <span style={{ fontWeight: 700, color: totalRestantForClient > 0 ? '#dc2626' : '#16a34a' }}>
                            {formatMoney(totalRestantForClient)}
                          </span>
                        </td>
                        <td>
                          <div className="fin-action-icons">
                            <button className="fin-action-btn view" onClick={() => handleOpenHistory(mat)} title="Historique des réservations">
                              <History size={13} /> Historique
                            </button>
                            <button className="fin-action-btn open" onClick={handleGoToMatricule} title="Ouvrir la fiche matricule">
                              <ExternalLink size={13} /> Fiche
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
                  totalItems={filteredList.length}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== STYLES (unchanged) ==================== */}
      <style>{`
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
        .smaiti-search-bar:focus-within { border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1); }
        .smaiti-search-bar input {
          border: none; outline: none; background: transparent;
          font-size: 0.875rem; width: 200px; color: #1a202c;
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
        .stat-number { font-size: 1.3rem; font-weight: 700; }
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
        .btn-primary { background: #1d4ed8; color: white; }
        .btn-primary:hover { background: #1e40af; transform: translateY(-1px); }
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
          min-width: 950px;
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
        .smaiti-table td { padding: 10px; vertical-align: middle; white-space: nowrap; }
        .sortable-header { cursor: pointer; user-select: none; }
        .sort-icon { opacity: 0.5; vertical-align: middle; margin-left: 4px; }
        .sort-icon.active { opacity: 1; color: #1d4ed8; }
        .badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 40px; font-weight: 500; font-size: 0.65rem;
          white-space: nowrap; width: fit-content;
        }
        .badge.compact { padding: 2px 6px; font-size: 0.6rem; }
        .badge-available { background: #e6f7ec; color: #0f973d; }
        .badge-rented { background: #fff3e6; color: #b45309; }
        .badge-published { background: #e0e7ff; color: #4338ca; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .text-center { text-align: center; }
        .py-12 { padding-top: 3rem; padding-bottom: 3rem; color: #94a3b8; }
        .fin-action-icons { display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
        .fin-action-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 20px; border: 1px solid transparent;
          font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
          white-space: nowrap;
        }
        .fin-action-btn.view { background: #eef2ff; color: #4338ca; }
        .fin-action-btn.view:hover { background: #e0e7ff; border-color: #c7d2fe; transform: translateY(-1px); }
        .fin-action-btn.open { background: #ecfdf5; color: #047857; }
        .fin-action-btn.open:hover { background: #d1fae5; border-color: #a7f3d0; transform: translateY(-1px); }
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
        .info-hero { background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); }
        .hero-left { display: flex; align-items: center; gap: 16px; }
        .hero-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .info-glow { background: #4338ca; color: white; box-shadow: 0 8px 16px rgba(67, 56, 202, 0.2); }
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
        .info-badge { background: #e0e7ff; color: #4338ca; }
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
        .modal-body-details { padding: 24px 32px; }
        .details-overview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .overview-card {
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 14px 16px; display: flex; align-items: center; gap: 14px;
        }
        .overview-icon {
          width: 40px; height: 40px; border-radius: 10px; background: white;
          border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center;
          color: #4338ca;
        }
        .overview-info { display: flex; flex-direction: column; }
        .overview-label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; color: #64748b; }
        .overview-value { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-top: 2px; }
        .modal-footer-actions {
          display: flex; justify-content: flex-end; gap: 12px;
          padding-top: 20px; margin-top: 8px;
        }
        .history-table-container {
          overflow-x: visible;
        }
        .history-table-container .smaiti-table {
          min-width: auto;
        }
        .history-table-container .smaiti-table td,
        .history-table-container .smaiti-table th {
          white-space: normal;
          word-break: break-word;
        }
        @media (max-width: 1024px) {
          .details-overview-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}