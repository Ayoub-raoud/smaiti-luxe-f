// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchUtilisateurs,
    updateUtilisateurStatus,
    deleteUtilisateur,
    selectUtilisateurs,
    createUtilisateur,
    updateUtilisateur,
    selectUser,
} from "../../Redux/store";
import PaginationControls from '../../components/PaginationControls';
import {
    fetchPages,
    fetchUserPermissions,
    assignPermission,
    revokePermission,
} from "../../Redux/permissionSlice";
import { toast } from "sonner";
import {
    Trash2,
    CheckCircle,
    XCircle,
    User,
    RefreshCw,
    Search,
    Shield,
    ShieldCheck,
    Plus,
    Edit2,
    X,
    TrashIcon,
    AlertTriangle,
    Users,
    Key,
    Lock,
    Unlock,
    UserCheck,
    UserX,
    Download,
    Crown,
    Briefcase,
    Activity,
    Sparkles,
    Star,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Bell,
    Eye,
    EyeOff,
} from "lucide-react";

// ----- Enhanced countdown with seconds & progress bar (unchanged) -----
const RemainingTime = ({ expiresAt }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [percentage, setPercentage] = useState(100);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!expiresAt) {
            setTimeLeft('Permanent');
            setPercentage(100);
            setIsExpired(false);
            return;
        }

        let interval;
        const updateTimer = () => {
            const now = new Date();
            const expiry = new Date(expiresAt);
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft('Expiré');
                setPercentage(0);
                setIsExpired(true);
                return;
            }

            setIsExpired(false);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (86400000)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (3600000)) / (1000 * 60));
            const seconds = Math.floor((diff % (60000)) / 1000);

            let formatted = '';
            if (days > 0) {
                formatted = `${days}j ${hours}h ${minutes}m ${seconds}s`;
            } else if (hours > 0) {
                formatted = `${hours}h ${minutes}m ${seconds}s`;
            } else {
                formatted = `${minutes}m ${seconds}s`;
            }
            setTimeLeft(formatted);

            const createdAt = new Date(expiry.getTime() - (1000 * 60 * 60 * 24 * 30));
            const total = expiry - createdAt;
            const remaining = diff;
            let percent = (remaining / total) * 100;
            percent = Math.min(100, Math.max(0, percent));
            setPercentage(percent);
        };

        updateTimer();
        interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!expiresAt) {
        return <span className="permanent-badge">Permanente</span>;
    }

    return (
        <div className="countdown-container">
            <div className="countdown-time">{timeLeft}</div>
            <div className="progress-bar-container">
                <div
                    className={`progress-bar-fill ${isExpired ? 'expired' : ''}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {isExpired && <span className="expired-badge">Expiré</span>}
        </div>
    );
};

export default function AdminUsers() {
    const dispatch = useDispatch();
    const users = useSelector(selectUtilisateurs);
    const pages = useSelector((state) => state.permissions.pages);
    const currentUser = useSelector(selectUser);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [showUserForm, setShowUserForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [resetFilter, setResetFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
    const [selectedPage, setSelectedPage] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [userPermissionsList, setUserPermissionsList] = useState([]);
    const [refreshingPermissions, setRefreshingPermissions] = useState(false);

    // Sorting state
    const [sortField, setSortField] = useState("id");
    const [sortDirection, setSortDirection] = useState("desc");
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Form state
    const [formData, setFormData] = useState({
        Fullname: "",
        role: "employee",
        status: "active",
        password: "",
        password_confirmation: "",
    });

    // Load users on mount
    useEffect(() => {
        const load = async () => {
            await dispatch(fetchUtilisateurs());
            setLoading(false);
        };
        load();
    }, [dispatch]);

    // Load pages and user permissions when permission modal opens
    useEffect(() => {
        if (permissionModalOpen && selectedUserForPermissions) {
            dispatch(fetchPages());
            refreshUserPermissions();
        }
    }, [permissionModalOpen, selectedUserForPermissions, dispatch]);

    const refreshUserPermissions = async () => {
        setRefreshingPermissions(true);
        const res = await dispatch(fetchUserPermissions(selectedUserForPermissions.id));
        setUserPermissionsList(res.payload.permissions);
        setRefreshingPermissions(false);
    };

    const toggleStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        const result = await dispatch(
            updateUtilisateurStatus({ utilisateurId: userId, status: newStatus })
        );
        if (result.error) {
            toast.error(result.payload);
        } else {
            toast.success(`Utilisateur ${newStatus === "active" ? "activé" : "désactivé"} avec succès`);
            await dispatch(fetchUtilisateurs(true));
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        const result = await dispatch(deleteUtilisateur(userToDelete.id));
        if (result.error) {
            toast.error(result.payload);
        } else {
            toast.success("Utilisateur supprimé avec succès");
            await dispatch(fetchUtilisateurs(true));
        }
        setDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const handleCreateUser = async (data) => {
        setSubmitting(true);
        try {
            const payload = {
                Fullname: data.Fullname,
                password: data.password,
                role: data.role,
                status: data.status,
            };
            await dispatch(createUtilisateur(payload)).unwrap();
            toast.success("Utilisateur créé avec succès!");
            setShowUserForm(false);
            setEditingUser(null);
            await dispatch(fetchUtilisateurs(true));
            resetForm();
        } catch (error) {
            toast.error(error.message || "Erreur lors de la création");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateUser = async (data) => {
        setSubmitting(true);
        try {
            const payload = {
                Fullname: data.Fullname,
                role: data.role,
                status: data.status,
            };
            if (data.password && data.password.trim() !== '') {
                payload.password = data.password;
            }
            await dispatch(updateUtilisateur({ id: editingUser.id, data: payload })).unwrap();
            toast.success("Utilisateur modifié avec succès!");
            setShowUserForm(false);
            setEditingUser(null);
            await dispatch(fetchUtilisateurs(true));
            resetForm();
        } catch (error) {
            toast.error(error.message || "Erreur lors de la modification");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            Fullname: user.Fullname || user.full_name || "",
            role: user.role || "employee",
            status: user.status || "active",
            password: "",
            password_confirmation: "",
        });
        setShowUserForm(true);
    };

    const handleAddNew = () => {
        setEditingUser(null);
        resetForm();
        setShowUserForm(true);
    };

    const resetForm = () => {
        setFormData({
            Fullname: "",
            role: "employee",
            status: "active",
            password: "",
            password_confirmation: "",
        });
    };

    const refreshData = async () => {
        await dispatch(fetchUtilisateurs(true));
        toast.success("Données actualisées");
    };

    const handleExport = () => {
        const headers = ["ID", "Nom complet", "Rôle", "Statut"];
        const csvData = filteredUsers.map((u) => [
            u.id,
            `"${u.Fullname || u.full_name || ""}"`,
            u.role === "superadmin" ? "Super Admin" : u.role === "admin" ? "Administrateur" : "Employé",
            u.status === "active" ? "Actif" : "Inactif",
        ].join(","));
        const blob = new Blob([headers.join(",") + "\n" + csvData.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `utilisateurs_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Export CSV effectué");
    };

    const handleAssignPermission = async () => {
        if (!selectedPage) {
            toast.error("Veuillez sélectionner une page.");
            return;
        }
        const duration = durationMinutes ? parseInt(durationMinutes) : null;
        await dispatch(
            assignPermission({
                userId: selectedUserForPermissions.id,
                pageSlug: selectedPage,
                durationMinutes: duration,
            })
        );
        toast.success("Permission attribuée.");
        await refreshUserPermissions();
        setSelectedPage("");
        setDurationMinutes("");
    };

    const handleRevokePermission = async (pageSlug) => {
        await dispatch(revokePermission({ userId: selectedUserForPermissions.id, pageSlug }));
        toast.success("Permission révoquée.");
        setUserPermissionsList((prev) => prev.filter((p) => p.page_slug !== pageSlug));
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

    // Filter and sort users
    const filteredUsers = users
        .filter((u) => {
            const fullName = (u.Fullname || u.full_name || "").toLowerCase();
            const matchesSearch =
                searchTerm === "" ||
                fullName.includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === "all" || u.role === roleFilter;
            const matchesStatus = statusFilter === "all" || u.status === statusFilter;
            const matchesReset = resetFilter === "all" || (resetFilter === "pending" && u.remember_token === 'reset_requested');
            return matchesSearch && matchesRole && matchesStatus && matchesReset;
        })
        .sort((a, b) => {
            let aVal, bVal;
            switch (sortField) {
                case "id":
                    aVal = a.id;
                    bVal = b.id;
                    break;
                case "name":
                    aVal = (a.Fullname || a.full_name || "").toLowerCase();
                    bVal = (b.Fullname || b.full_name || "").toLowerCase();
                    break;
                case "role":
                    aVal = a.role || "";
                    bVal = b.role || "";
                    break;
                case "status":
                    aVal = a.status || "";
                    bVal = b.status || "";
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
        });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginated = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Count pending reset requests
    const pendingResetCount = users.filter(u => u.remember_token === 'reset_requested').length;

    const stats = {
        total: users.length,
        active: users.filter((u) => u.status === "active").length,
        inactive: users.filter((u) => u.status === "inactive").length,
        admins: users.filter((u) => u.role === "admin" || u.role === "superadmin").length,
        employees: users.filter((u) => u.role === "employee").length,
        superadmins: users.filter((u) => u.role === "superadmin").length,
    };

    const getStatusBadge = (status) => {
        if (status === "active") {
            return (
                <span className="badge badge-success">
                    <CheckCircle size={12} className="badge-icon" />
                    Actif
                </span>
            );
        }
        return (
            <span className="badge badge-danger">
                <XCircle size={12} className="badge-icon" />
                Inactif
            </span>
        );
    };

    const getRoleBadge = (role) => {
        if (role === "superadmin") {
            return (
                <span className="badge badge-gold">
                    <Crown size={12} className="badge-icon" />
                    Super Admin
                </span>
            );
        }
        if (role === "admin") {
            return (
                <span className="badge badge-purple">
                    <Crown size={12} className="badge-icon" />
                    Administrateur
                </span>
            );
        }
        return (
            <span className="badge badge-blue">
                <Briefcase size={12} className="badge-icon" />
                Employé
            </span>
        );
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <p>Chargement des utilisateurs...</p>
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

                /* RESET BANNER */
                .reset-banner {
                    display: flex; align-items: center; gap: 12px;
                    background: #fef3c7; border: 1px solid #f59e0b;
                    border-radius: 12px; padding: 12px 20px;
                    margin: 1.5rem 0;
                    color: #92400e; font-size: 0.95rem;
                    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
                }
                .reset-banner svg { flex-shrink: 0; }
                .banner-filter-btn {
                    margin-left: 12px; padding: 4px 12px;
                    background: #f59e0b; color: white; border: none;
                    border-radius: 6px; cursor: pointer; font-weight: 500;
                    transition: 0.2s;
                }
                .banner-filter-btn:hover { background: #d97706; }
                .banner-dismiss-btn {
                    margin-left: 8px; background: transparent; border: none;
                    color: #92400e; text-decoration: underline; cursor: pointer;
                    font-size: 0.85rem;
                }
                .banner-dismiss-btn:hover { color: #78350f; }

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

                /* SEARCH & FILTERS */
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

                /* BADGES */
                .badge {
                    display: inline-flex; align-items: center; gap: 0.25rem;
                    padding: 0.25rem 0.625rem; border-radius: 9999px;
                    font-size: 0.7rem; font-weight: 500;
                }
                .badge-icon { width: 12px; height: 12px; }
                .badge-gold { background: #fef3c7; color: #92400e; }
                .badge-purple { background: #f3e8ff; color: #6b21a5; }
                .badge-blue { background: #dbeafe; color: #1e40af; }
                .badge-success { background: #dcfce7; color: #166534; }
                .badge-danger { background: #fee2e2; color: #991b1b; }
                .badge-warning { background: #fef3c7; color: #92400e; }

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
                .action-btn.primary { background: #fef3c7; color: #d97706; }
                .action-btn.permission { background: #f3e8ff; color: #8b5cf6; }
                .action-btn:hover { transform: scale(1.05); }
                .action-btn svg { width: 16px; height: 16px; }

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
                .inline-error-message {
                    background: #fef2f2; border: 1px solid #fecaca;
                    border-radius: 12px; padding: 12px 16px;
                    display: flex; align-items: center; gap: 10px;
                    font-size: 0.75rem; color: #dc2626; margin-top: 16px;
                }
                .inline-info-grid { display: flex; flex-direction: column; gap: 12px; }
                .inline-info-item {
                    display: flex; justify-content: space-between; padding: 8px 0;
                    border-bottom: 1px solid #e2e8f0;
                }
                .inline-info-item .info-label { font-size: 0.75rem; color: #64748b; }
                .inline-info-item .info-value { font-size: 0.875rem; font-weight: 500; color: #0f172a; }

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

                /* PERMISSION MODAL (adapted to green style) */
                .permission-modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px); display: flex; align-items: center;
                    justify-content: center; z-index: 1000;
                }
                .permission-modal {
                    background: white; border-radius: 24px; padding: 32px;
                    max-width: 500px; width: 100%; max-height: 90vh;
                    overflow-y: auto;
                }
                .permission-modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 1.5rem; padding-bottom: 1rem;
                    border-bottom: 2px solid #0d4734;
                }
                .permission-modal-header h3 {
                    font-size: 1.25rem; font-weight: 700; color: #0f172a;
                }
                .permission-modal-close {
                    background: #f1f5f9; border: none; border-radius: 50%;
                    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: 0.2s;
                }
                .permission-modal-close:hover { background: #e2e8f0; }
                .permission-form-group {
                    display: flex; flex-direction: column; gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .permission-form-group label {
                    font-size: 0.75rem; font-weight: 600; color: #475569;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .permission-form-select, .permission-form-input {
                    padding: 10px 14px; border: 1.5px solid #e2e8f0;
                    border-radius: 12px; font-size: 0.875rem;
                    background: white; transition: 0.2s;
                }
                .permission-form-select:focus, .permission-form-input:focus {
                    outline: none; border-color: #0d4734; box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.1);
                }
                .permission-list {
                    list-style: none; padding: 0; margin: 1rem 0 0 0;
                }
                .permission-item {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 0.75rem 0; border-bottom: 1px solid #e2e8f0;
                }
                .permission-item:last-child { border-bottom: none; }
                .permission-info { flex: 1; }
                .permission-info strong { display: block; margin-bottom: 0.25rem; color: #0f172a; }
                .permission-expiry-timer { margin-top: 0.5rem; }

                .countdown-container {
                    display: flex; flex-direction: column; gap: 0.25rem;
                    max-width: 220px;
                }
                .countdown-time {
                    font-size: 0.75rem; font-weight: 600; color: #0d4734;
                    background: #dcfce7; display: inline-block;
                    padding: 0.125rem 0.5rem; border-radius: 1rem;
                    width: fit-content; font-family: monospace;
                }
                .progress-bar-container {
                    background-color: #e2e8f0; border-radius: 9999px;
                    height: 4px; width: 100%; overflow: hidden;
                }
                .progress-bar-fill {
                    background-color: #0d4734; height: 100%;
                    border-radius: 9999px; transition: width 0.5s linear;
                }
                .progress-bar-fill.expired { background-color: #dc2626; }
                .permanent-badge {
                    background: #dcfce7; color: #166534;
                    padding: 0.125rem 0.5rem; border-radius: 1rem;
                    font-size: 0.7rem; font-weight: 500;
                }
                .expired-badge {
                    font-size: 0.65rem; color: #dc2626; margin-left: 0.5rem;
                }

                .loading { text-align: center; padding: 3rem; }
                .spinner { display: inline-block; width: 2rem; height: 2rem; border-radius: 50%; border: 2px solid #e2e8f0; border-top-color: #0f172a; animation: spin 0.6s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .flex { display: flex; } .items-center { align-items: center; } .gap-1 { gap: 0.25rem; }
                .text-right { text-align: right; } .font-medium { font-weight: 500; }
                .text-green { color: #16a34a; }
                .text-red { color: #dc2626; }
                .text-purple { color: #8b5cf6; }
                .text-blue { color: #3b82f6; }
                .text-gold { color: #eab308; }

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
                    .search-row { flex-direction: column; }
                    .filter-select { width: 100%; }
                    .permission-modal { padding: 20px; }
                }

                /* DARK MODE */
                @media (prefers-color-scheme: dark) {
                    .admin-smaiti-page { background: #0f172a; color: #f1f5f9; }
                    .smaiti-flotte { color: #f1f5f9; }
                    .smaiti-notif-btn { background: #1e293b; border-color: #334155; color: #e2e8f0; }
                    .smaiti-notif-btn:hover { background: #334155; }
                    .stat-card, .smaiti-table-container, .search-wrapper, .inline-form-container,
                    .delete-modal-card, .permission-modal {
                        background: #1e293b; border-color: #334155;
                    }
                    .stat-label, .smaiti-count, .inline-form-title p,
                    .inline-info-item .info-label, .delete-modal-card p,
                    .permission-form-group label { color: #94a3b8; }
                    .stat-number { color: #f1f5f9; }
                    .inline-form-header { background: #0f172a; border-bottom-color: #0d4734; }
                    .inline-form-header h2 { color: #f1f5f9; }
                    .inline-section { background: #1e293b; border-color: #334155; }
                    .inline-section-header h3 { color: #f1f5f9; }
                    .inline-section-header .section-icon { color: #0d4734; }
                    .inline-field label { color: #94a3b8; }
                    .inline-input, .inline-select, .search-input, .filter-select,
                    .permission-form-select, .permission-form-input {
                        background: #0f172a; border-color: #334155; color: #f1f5f9;
                    }
                    .inline-input:focus, .inline-select:focus, .search-input:focus,
                    .permission-form-select:focus, .permission-form-input:focus {
                        border-color: #0d4734; box-shadow: 0 0 0 3px rgba(13, 71, 52, 0.3);
                    }
                    .inline-info-message {
                        background: #0f172a; border-color: #0d4734; color: #86efac;
                    }
                    .inline-error-message {
                        background: #7f1d1d; border-color: #fca5a5; color: #fca5a5;
                    }
                    .inline-info-item .info-value { color: #f1f5f9; }
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
                    .badge-gold { background: #78350f; color: #fde68a; }
                    .badge-purple { background: #4c1d95; color: #c084fc; }
                    .badge-blue { background: #1e3a5f; color: #60a5fa; }
                    .badge-success { background: #14532d; color: #4ade80; }
                    .badge-danger { background: #7f1d1d; color: #fca5a5; }
                    .badge-warning { background: #78350f; color: #fde68a; }
                    .action-btn.edit { background: #334155; color: #cbd5e1; }
                    .action-btn.delete { background: #7f1d1d; color: #fca5a5; }
                    .action-btn.view { background: #1e3a5f; color: #60a5fa; }
                    .action-btn.primary { background: #78350f; color: #fde68a; }
                    .action-btn.permission { background: #4c1d95; color: #c084fc; }
                    .action-btn:hover { transform: scale(1.05); }
                    .smaiti-table thead { background: #0f172a; }
                    .smaiti-table th { color: #94a3b8; }
                    .smaiti-table tbody tr:hover { background: #334155; }
                    .smaiti-table td { color: #e2e8f0; }
                    .permission-modal-header { border-bottom-color: #0d4734; }
                    .permission-modal-header h3 { color: #f1f5f9; }
                    .permission-modal-close { background: #334155; color: #e2e8f0; }
                    .permission-modal-close:hover { background: #475569; }
                    .permission-info strong { color: #f1f5f9; }
                    .permission-item { border-bottom-color: #334155; }
                    .countdown-time {
                        background: #0f172a; color: #4ade80;
                    }
                    .progress-bar-container { background-color: #334155; }
                    .permanent-badge {
                        background: #0f172a; color: #4ade80;
                    }
                    .reset-banner {
                        background: #78350f; border-color: #b45309; color: #fde68a;
                    }
                    .banner-filter-btn { background: #b45309; }
                    .banner-filter-btn:hover { background: #92400e; }
                    .banner-dismiss-btn { color: #fde68a; }
                    .banner-dismiss-btn:hover { color: #fbbf24; }
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
                    <span className="smaiti-flotte">Utilisateurs</span>
                </div>
                <div className="smaiti-right-actions">
                    <button className="smaiti-notif-btn" onClick={refreshData} title="Actualiser">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* RESET BANNER */}
            {pendingResetCount > 0 && (
                <div className="reset-banner">
                    <Bell size={20} />
                    <span>
                        <strong>{pendingResetCount}</strong> utilisateur(s) ont demandé une réinitialisation de mot de passe.
                        <button className="banner-filter-btn" onClick={() => setResetFilter('pending')}>
                            Voir les demandes
                        </button>
                        <button className="banner-dismiss-btn" onClick={() => setResetFilter('all')}>
                            Masquer
                        </button>
                    </span>
                </div>
            )}

            {showUserForm ? (
                /* ====== USER FORM ====== */
                <div className="inline-form-container">
                    <div className="inline-form-header">
                        <div className="inline-form-icon">
                            {editingUser ? <Sparkles size={24} /> : <Plus size={24} />}
                        </div>
                        <div className="inline-form-title">
                            <h2>{editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h2>
                            <p>{editingUser ? "Modifiez les informations de l'utilisateur" : "Créez un nouvel utilisateur en quelques clics"}</p>
                        </div>
                        <button
                            onClick={() => {
                                setShowUserForm(false);
                                setEditingUser(null);
                                resetForm();
                            }}
                            className="inline-form-close"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (editingUser) {
                                handleUpdateUser(formData);
                            } else {
                                handleCreateUser(formData);
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
                                            <label>Nom complet *</label>
                                            <input
                                                type="text"
                                                className="inline-input"
                                                value={formData.Fullname}
                                                onChange={(e) => setFormData({ ...formData, Fullname: e.target.value })}
                                                required
                                                placeholder="Jean Dupont"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="inline-section">
                                    <div className="inline-section-header">
                                        <Shield size={18} className="section-icon" />
                                        <h3>Rôle et permissions</h3>
                                    </div>
                                    <div className="inline-grid-2">
                                        <div className="inline-field">
                                            <label>Rôle</label>
                                            <select
                                                className="inline-select"
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            >
                                                <option value="employee">Employé</option>
                                                <option value="admin">Administrateur</option>
                                                {currentUser?.role === 'superadmin' && (
                                                    <option value="superadmin">Super Admin</option>
                                                )}
                                            </select>
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
                                    {formData.role === "superadmin" && (
                                        <div className="inline-info-message">
                                            <ShieldCheck size={16} />
                                            <span>L'utilisateur aura tous les droits et pourra gérer les permissions des autres.</span>
                                        </div>
                                    )}
                                    {formData.role === "admin" && (
                                        <div className="inline-info-message">
                                            <ShieldCheck size={16} />
                                            <span>L'utilisateur verra toutes les pages mais ne pourra pas attribuer de permissions.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="inline-form-col">
                                <div className="inline-section">
                                    <div className="inline-section-header">
                                        <Key size={18} className="section-icon" />
                                        <h3>Sécurité</h3>
                                    </div>

                                    {editingUser ? (
                                        // EDIT MODE
                                        <>
                                            <div className="inline-info-message">
                                                <Lock size={16} />
                                                <span>Laissez vide pour conserver le mot de passe actuel. Remplissez pour le modifier.</span>
                                            </div>
                                            <div className="inline-grid-2">
                                                <div className="inline-field">
                                                    <label>Nouveau mot de passe</label>
                                                    <input
                                                        type="password"
                                                        className="inline-input"
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        placeholder="Nouveau mot de passe"
                                                    />
                                                </div>
                                                <div className="inline-field">
                                                    <label>Confirmer</label>
                                                    <input
                                                        type="password"
                                                        className="inline-input"
                                                        value={formData.password_confirmation}
                                                        onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                                        placeholder="Confirmer"
                                                    />
                                                </div>
                                            </div>
                                            {formData.password && formData.password_confirmation && formData.password !== formData.password_confirmation && (
                                                <div className="inline-error-message">
                                                    <AlertTriangle size={14} />
                                                    <span>Les mots de passe ne correspondent pas</span>
                                                </div>
                                            )}
                                            {editingUser.remember_token === 'reset_requested' && (
                                                <div className="inline-info-message" style={{ background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' }}>
                                                    <AlertTriangle size={16} />
                                                    <span>Cet utilisateur a demandé une réinitialisation. Veuillez entrer un nouveau mot de passe ci-dessus.</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        // CREATE MODE
                                        <>
                                            <div className="inline-grid-2">
                                                <div className="inline-field">
                                                    <label>Mot de passe *</label>
                                                    <input
                                                        type="password"
                                                        className="inline-input"
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        required
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                <div className="inline-field">
                                                    <label>Confirmer *</label>
                                                    <input
                                                        type="password"
                                                        className="inline-input"
                                                        value={formData.password_confirmation}
                                                        onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                                        required
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                            {formData.password && formData.password_confirmation && formData.password !== formData.password_confirmation && (
                                                <div className="inline-error-message">
                                                    <AlertTriangle size={14} />
                                                    <span>Les mots de passe ne correspondent pas</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="inline-section">
                                    <div className="inline-section-header">
                                        <Activity size={18} className="section-icon" />
                                        <h3>Informations système</h3>
                                    </div>
                                    <div className="inline-info-grid">
                                        <div className="inline-info-item">
                                            <span className="info-label">Date de création</span>
                                            <span className="info-value">
                                                {editingUser ? new Date(editingUser.created_at).toLocaleDateString("fr-FR") : "—"}
                                            </span>
                                        </div>
                                        <div className="inline-info-item">
                                            <span className="info-label">Dernière modification</span>
                                            <span className="info-value">
                                                {editingUser ? new Date(editingUser.updated_at).toLocaleDateString("fr-FR") : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="inline-form-footer">
                            <button
                                type="button"
                                className="inline-secondary-btn"
                                onClick={() => {
                                    setShowUserForm(false);
                                    setEditingUser(null);
                                    resetForm();
                                }}
                            >
                                Annuler
                            </button>
                            <button type="submit" className="inline-primary-btn" disabled={submitting}>
                                {submitting ? "Traitement..." : editingUser ? "Mettre à jour" : "Créer l'utilisateur"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* ====== MAIN LIST ====== */
                <>
                    {/* STATS */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div><p className="stat-label">Total</p><p className="stat-number">{stats.total}</p></div>
                            <Users size={28} className="stat-icon" />
                        </div>
                        <div className="stat-card">
                            <div><p className="stat-label">Actifs</p><p className="stat-number text-green">{stats.active}</p></div>
                            <UserCheck size={28} className="stat-icon" style={{ color: '#16a34a' }} />
                        </div>
                        <div className="stat-card">
                            <div><p className="stat-label">Inactifs</p><p className="stat-number text-red">{stats.inactive}</p></div>
                            <UserX size={28} className="stat-icon" style={{ color: '#dc2626' }} />
                        </div>
                        <div className="stat-card">
                            <div><p className="stat-label">Administrateurs</p><p className="stat-number text-purple">{stats.admins}</p></div>
                            <Crown size={28} className="stat-icon" style={{ color: '#8b5cf6' }} />
                        </div>
                        <div className="stat-card">
                            <div><p className="stat-label">Super Admins</p><p className="stat-number text-gold">{stats.superadmins}</p></div>
                            <Star size={28} className="stat-icon" style={{ color: '#eab308' }} />
                        </div>
                        <div className="stat-card">
                            <div><p className="stat-label">Employés</p><p className="stat-number text-blue">{stats.employees}</p></div>
                            <Briefcase size={28} className="stat-icon" style={{ color: '#3b82f6' }} />
                        </div>
                    </div>

                    {/* ACTION BAR */}
                    <div className="smaiti-actions-wrapper">
                        <span className="smaiti-count">{filteredUsers.length} enregistrement(s)</span>
                        <div className="smaiti-actions-buttons">
                            <button onClick={handleExport} className="btn btn-secondary">
                                <Download size={14} /> Exporter
                            </button>
                            <button onClick={handleAddNew} className="btn btn-primary">
                                <Plus size={14} /> Nouvel utilisateur
                            </button>
                        </div>
                    </div>

                    {/* SEARCH & FILTERS */}
                    <div className="search-wrapper">
                        <div className="search-row">
                            <div className="search-container">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Rechercher par nom..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="search-input"
                                />
                            </div>
                            <select
                                value={roleFilter}
                                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                                className="filter-select"
                            >
                                <option value="all">Tous rôles</option>
                                <option value="superadmin">Super Admins</option>
                                <option value="admin">Administrateurs</option>
                                <option value="employee">Employés</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="filter-select"
                            >
                                <option value="all">Tous statuts</option>
                                <option value="active">Actifs</option>
                                <option value="inactive">Inactifs</option>
                            </select>
                            <select
                                value={resetFilter}
                                onChange={(e) => { setResetFilter(e.target.value); setCurrentPage(1); }}
                                className="filter-select"
                            >
                                <option value="all">Tous</option>
                                <option value="pending">Demandes de réinitialisation</option>
                            </select>
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
                                    <th onClick={() => handleSort("role")} className="sortable-header">
                                        Rôle {getSortIcon("role")}
                                    </th>
                                    <th onClick={() => handleSort("status")} className="sortable-header">
                                        Statut {getSortIcon("status")}
                                    </th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12">Aucun utilisateur trouvé</td>
                                    </tr>
                                ) : (
                                    paginated.map((u) => (
                                        <tr key={u.id}>
                                            <td className="font-medium">#{u.id}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <User size={14} />
                                                    {u.Fullname || u.full_name || "—"}
                                                    {u.remember_token === 'reset_requested' && (
                                                        <span className="badge badge-warning" title="Demande de réinitialisation en attente">
                                                            <RefreshCw size={12} /> Réinitialisation
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{getRoleBadge(u.role)}</td>
                                            <td>{getStatusBadge(u.status)}</td>
                                            <td>
                                                <div className="action-icons">
                                                    <button
                                                        onClick={() => handleEdit(u)}
                                                        className="action-btn edit"
                                                        title="Modifier"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleStatus(u.id, u.status)}
                                                        className="action-btn primary"
                                                        title={u.status === "active" ? "Désactiver" : "Activer"}
                                                    >
                                                        {u.status === "active" ? <Lock size={14} /> : <Unlock size={14} />}
                                                    </button>
                                                    {currentUser?.role === 'superadmin' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUserForPermissions(u);
                                                                setPermissionModalOpen(true);
                                                            }}
                                                            className="action-btn permission"
                                                            title="Gérer les permissions"
                                                        >
                                                            <Key size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteClick(u)}
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
                                totalItems={filteredUsers.length}
                            />
                        )}
                    </div>
                </>
            )}

            {/* ====== DELETE MODAL ====== */}
            {deleteModalOpen && userToDelete && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal-card">
                        <div className="delete-icon-box"><TrashIcon size={24} /></div>
                        <h3>Confirmer la suppression</h3>
                        <p>
                            Êtes-vous sûr de vouloir supprimer l'utilisateur <br />
                            <strong>{userToDelete.Fullname || userToDelete.full_name || "?"}</strong> ?<br />
                            Cette action est irréversible.
                        </p>
                        {userToDelete.role === "superadmin" && (
                            <p style={{ fontSize: "0.75rem", color: "#dc2626" }}>
                                ⚠️ Cet utilisateur est un Super Admin. La suppression affectera les droits d'accès.
                            </p>
                        )}
                        <div className="delete-actions">
                            <button className="modal-btn-cancel" onClick={() => setDeleteModalOpen(false)}>Annuler</button>
                            <button className="modal-btn-delete" onClick={confirmDelete}>Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== PERMISSION MODAL ====== */}
            {permissionModalOpen && selectedUserForPermissions && currentUser?.role === 'superadmin' && (
                <div className="permission-modal-overlay" onClick={() => setPermissionModalOpen(false)}>
                    <div className="permission-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="permission-modal-header">
                            <h3>Permissions pour {selectedUserForPermissions.Fullname || selectedUserForPermissions.full_name}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={refreshUserPermissions}
                                    disabled={refreshingPermissions}
                                    className="action-btn edit"
                                    title="Actualiser"
                                    style={{ width: '36px', height: '36px' }}
                                >
                                    <RefreshCw size={16} className={refreshingPermissions ? "spin" : ""} />
                                </button>
                                <button className="permission-modal-close" onClick={() => setPermissionModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="permission-form-group">
                            <label>Ajouter une permission</label>
                            <select
                                value={selectedPage}
                                onChange={(e) => setSelectedPage(e.target.value)}
                                className="permission-form-select"
                            >
                                <option value="">-- Choisir une page --</option>
                                {Object.entries(pages).map(([slug, label]) => (
                                    <option key={slug} value={slug}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="permission-form-group">
                            <label>Durée (minutes) – laissez vide pour permanente</label>
                            <input
                                type="number"
                                min="1"
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(e.target.value)}
                                className="permission-form-input"
                                placeholder="ex: 30"
                            />
                        </div>
                        <button onClick={handleAssignPermission} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                            Attribuer
                        </button>

                        <hr style={{ margin: '1.5rem 0' }} />

                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
                            Permissions actuelles
                        </h4>
                        {userPermissionsList.length === 0 ? (
                            <p className="text-muted" style={{ color: '#64748b' }}>Aucune permission spéciale.</p>
                        ) : (
                            <ul className="permission-list">
                                {userPermissionsList.map((perm) => (
                                    <li key={perm.page_slug} className="permission-item">
                                        <div className="permission-info">
                                            <strong>{pages[perm.page_slug] || perm.page_slug}</strong>
                                            <div className="permission-expiry-timer">
                                                <RemainingTime expiresAt={perm.expires_at} />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRevokePermission(perm.page_slug)}
                                            className="action-btn delete"
                                            title="Révoquer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}