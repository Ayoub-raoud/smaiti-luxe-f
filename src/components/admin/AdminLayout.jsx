// ==================== AdminLayout.jsx ====================
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUtilisateur, selectUser, selectIsAuthenticated, selectReservations } from "../../Redux/store";
import { fetchMyPermissions } from "../../Redux/permissionSlice";
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarCheck,
  AlertTriangle,
  CreditCard,
  LogOut,
  UserCog,
  Gauge,
  Menu,
  X,
  Building2,
  Mail,
  UserCircle,
  Tag,
  Settings,
  Wrench
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
} from "../../components/ui/sidebar";
import { toast } from "sonner";
import NotificationBell from "../../pages/admin/NotificationBell";

// Default pages per role (no permission check required)
const DEFAULT_PAGES = {
  admin: ['cars', 'matricules', 'clients', 'reservations', 'accidents', 'contacts', 'users','garages','sous-locations'],
  employee: ['cars', 'matricules', 'reservations', 'contacts'],
};

export default function AdminLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const myPermissions = useSelector((state) => state.permissions?.myPermissions || []);
  const reservations = useSelector(selectReservations);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notifications = useSelector((state) => state.notifications?.notifications || {
    matricules: { total: 0, critical: 0 },
    reservations: { total: 0, critical: 0 },
    accidents: { total: 0, critical: 0 },
    payments: { total: 0, critical: 0 },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const contactedCount = reservations.filter(r => r.status === 'contacted').length;
  const lateCount = reservations.filter(r => r.status === 'retard').length;
  const endingSoonCount = reservations.filter(r => {
    if (r.status !== 'confirmed') return false;
    const end = new Date(r.end_date);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }).length;

  const getBadge = (pageSlug) => {
    if (!pageSlug) return null;
    const category = notifications[pageSlug];
    if (!category || category.total === 0) return null;
    return {
      count: category.total,
      isCritical: category.critical > 0,
    };
  };

  // Fetch permissions for both employees AND admins (but not superadmins)
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'superadmin') {
      dispatch(fetchMyPermissions());
      const interval = setInterval(() => {
        dispatch(fetchMyPermissions());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [dispatch, isAuthenticated, user]);

  const handleLogout = async () => {
    await dispatch(logoutUtilisateur());
    toast.success("Déconnecté");
    setIsMobileMenuOpen(false);
    navigate("/admin");
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  if (!isAuthenticated) {
    return null;
  }

  // Define all nav items with section grouping
  const navGroups = [
    {
      label: "Vue d'ensemble",
      items: [
        { path: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord", pageSlug: null },
      ]
    },
    {
      label: "Opérations",
      items: [
        { path: "/cars", icon: Car, label: "Flotte", pageSlug: "cars" },
        { path: "/matricules", icon: Gauge, label: "Matricules", pageSlug: "matricules" },
        { path: "/matricules-clients", icon: Users, label: "Clients par matricule", pageSlug: "matricules" }, // NEW
        { path: "/reservations", icon: CalendarCheck, label: "Réservations", pageSlug: "reservations" },
        { path: "/clients", icon: Users, label: "Clients", pageSlug: "clients" },
        { path: "/accidents", icon: AlertTriangle, label: "Accidents", pageSlug: "accidents" },
      ]
    },
    {
      label: "Finance & entretien",
      items: [
        { path: "/payments", icon: CreditCard, label: "Paiements", pageSlug: "payments" },
        { path: "/garages", icon: Building2, label: "Garages", pageSlug: "garages" },
      ]
    },
    {
      label: "Système",
      items: [
        { path: "/users", icon: UserCog, label: "Utilisateurs", pageSlug: "users" },
        { path: "/profile", icon: Settings, label: "Profile", pageSlug: null },
      ]
    }
  ];

  const allNavItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord", pageSlug: null },
    { path: "/cars", icon: Car, label: "Flotte", pageSlug: "cars" },
    { path: "/matricules", icon: Gauge, label: "Matricules", pageSlug: "matricules" },
    { path: "/matricules-clients", icon: Users, label: "Clients par matricule", pageSlug: "matricules" }, // NEW
    { path: "/clients", icon: Users, label: "Clients", pageSlug: "clients" },
    { path: "/reservations", icon: CalendarCheck, label: "Réservations", pageSlug: "reservations" },
    { path: "/reservations-status", icon: CalendarCheck, label: "Réservations (Statut)", pageSlug: "reservations" },
    { path: "/accidents", icon: AlertTriangle, label: "Accidents", pageSlug: "accidents" },
    { path: "/sous-locations", icon: Tag, label: "Sous-locations", pageSlug: "sous-locations" },
    { path: "/payments", icon: CreditCard, label: "Traites", pageSlug: "payments" },
    { path: "/garages", icon: Building2, label: "Garages", pageSlug: "garages" },
    { path: "/contacts", icon: Mail, label: "Contacts", pageSlug: "contacts" },
    { path: "/profile", icon: UserCircle, label: "Mon Profil", pageSlug: null },
  ];

  // Add Users page for admin and superadmin
  if (user?.role === 'admin' || user?.role === 'superadmin') {
    allNavItems.push({ path: "/users", icon: UserCog, label: "Utilisateurs", pageSlug: "users" });
  }

  // ---- FILTERING LOGIC ----
  const userRole = user?.role;
  const isSuperAdmin = userRole === 'superadmin';

  const filteredItems = allNavItems.filter(item => {
    const pageSlug = item.pageSlug;
    if (!pageSlug) {
      return ['/dashboard', '/profile'].includes(item.path);
    }
    if (isSuperAdmin) return true;
    if (DEFAULT_PAGES[userRole]?.includes(pageSlug)) return true;
    let hasPerm = false;
    if (Array.isArray(myPermissions)) {
      if (myPermissions.length > 0 && typeof myPermissions[0] === 'object') {
        hasPerm = myPermissions.some(p => p.page_slug === pageSlug);
      } else {
        hasPerm = myPermissions.includes(pageSlug);
      }
    }
    return hasPerm;
  });

  // Group filtered items
  const grouped = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => filteredItems.some(f => f.path === item.path))
  })).filter(group => group.items.length > 0);

  // Add any leftover items that might not be in groups
  const leftover = filteredItems.filter(item => !navGroups.some(g => g.items.some(i => i.path === item.path)));
  if (leftover.length > 0) {
    grouped.push({
      label: "Autre",
      items: leftover
    });
  }

  const getUserName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.Fullname) return user.Fullname;
    if (user?.name) return user.name;
    if (user?.prenom && user?.nom) return `${user.prenom} ${user.nom}`;
    return 'Administrateur';
  };

  const getUserRole = () => {
    if (user?.role === 'superadmin') return 'Super Admin';
    if (user?.role === 'admin') return 'Administrateur';
    if (user?.role === 'employee') return 'Employé';
    return user?.role || 'Utilisateur';
  };

  const handleBadgeClick = (e, path) => {
    e.preventDefault();
    e.stopPropagation();
    navigate({ pathname: path, search: '?filter=notifications' });
  };

  // Override styles for mobile and adjustments (includes new user section styles)
  const layoutOverrides = `
    /* Sidebar content scroll fix */
    .sidebar-content-scroll {
      margin-right: 0 !important;
    }
    :root {
      --sidebar-width: 16rem;
    }
    @media (min-width: 768px) {
      .sidebar-main {
        margin-left: var(--sidebar-width);
        margin-right: auto;
        width: auto;
        max-width: calc(100% - var(--sidebar-width) - 2rem);
      }
      .admin-main-content {
        max-width: 1280px;
        margin-left: auto;
        margin-right: auto;
        width: 100%;
      }
    }
    .mobile-menu-btn {
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 1001;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #0f172a, #1a2332);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 2rem;
      color: #eab308;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
      font-weight: 600;
      font-size: 0.875rem;
    }
    .mobile-menu-btn:hover {
      background: linear-gradient(135deg, #1a2332, #0f172a);
      transform: scale(1.02);
    }
    @media (min-width: 768px) {
      .mobile-menu-btn {
        display: none;
      }
    }
    .mobile-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .mobile-sidebar-panel {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 85%;
      max-width: 320px;
      background: linear-gradient(165deg, #0f172a 0%, #1a2332 40%, #0f172a 100%);
      z-index: 1001;
      display: flex;
      flex-direction: column;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      box-shadow: 2px 0 20px rgba(0,0,0,0.3);
      overflow-y: auto;
      border-radius: 0 24px 24px 0;
    }
    .mobile-sidebar-panel.open {
      transform: translateX(0);
    }
    .mobile-sidebar-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: relative;
    }
    .mobile-close-btn {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,0.06);
      border: none;
      border-radius: 0.5rem;
      padding: 0.5rem;
      cursor: pointer;
      color: rgba(255,255,255,0.7);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mobile-close-btn:hover {
      background: rgba(234, 179, 8, 0.15);
      color: #eab308;
    }
    .mobile-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .mobile-nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 0.875rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
      color: rgba(255,255,255,0.55);
      text-decoration: none;
      cursor: pointer;
    }
    .mobile-nav-item:hover {
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.85);
    }
    .mobile-nav-item.active {
      background: rgba(234, 179, 8, 0.12);
      color: #f5d77b;
    }
    .mobile-nav-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .mobile-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.25rem;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 700;
      color: #0f172a;
      background: #eab308;
    }
    .mobile-badge.critical {
      background: #ef4444;
      color: #fff;
    }
    .mobile-user-section {
      padding: 0.75rem;
      margin-top: auto;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .mobile-user-info {
      padding: 0.5rem 0.75rem;
      margin-bottom: 0.75rem;
      background: rgba(255,255,255,0.04);
      border-radius: 0.5rem;
    }
    .mobile-user-name {
      font-size: 0.875rem;
      color: white;
      font-weight: 600;
    }
    .mobile-user-role {
      font-size: 0.7rem;
      color: rgba(234,179,8,0.7);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 0.125rem;
    }
    .mobile-user-email {
      font-size: 0.65rem;
      color: rgba(255,255,255,0.5);
      margin-top: 0.25rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mobile-logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 0.875rem;
      font-size: 0.875rem;
      font-weight: 500;
      background: transparent;
      border: 1px solid rgba(239,68,68,0.2);
      color: #f87171;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .mobile-logout-btn:hover {
      background: rgba(239,68,68,0.1);
      border-color: #ef4444;
    }
    .admin-container {
      max-width: 1280px;
      margin-left: auto;
      margin-right: auto;
      width: 100%;
    }
    .sidebar-menu-button .flex-1 {
      flex: 1;
    }
    .reservation-badges {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-left: auto;
    }

    /* ---- NEW STYLES FOR DESKTOP USER SECTION ---- */
    .sidebar-user-section {
      padding: 0.75rem 1rem;
      border-top: 1px solid rgba(255,255,255,0.06);
      margin-top: 0.5rem;
    }
    .sidebar-user-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.5rem 0.5rem 0.75rem;
      border-radius: 0.75rem;
      transition: background 0.2s ease;
      cursor: default;
    }
    .sidebar-user-row:hover {
      background: rgba(255,255,255,0.04);
    }
    .sidebar-avatar {
      flex-shrink: 0;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 9999px;
      background: linear-gradient(135deg, #eab308, #f59e0b);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      color: #0f172a;
      text-transform: uppercase;
      user-select: none;
    }
    .sidebar-user-details {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .sidebar-user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-user-role {
      font-size: 0.65rem;
      font-weight: 500;
      color: rgba(234,179,8,0.7);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 0.05rem;
    }
    .sidebar-logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      margin-top: 0.4rem;
      margin-left: 0.25rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 500;
      color: #f87171;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .sidebar-logout-btn:hover {
      background: rgba(239,68,68,0.08);
      color: #ef4444;
    }
    .sidebar-logout-btn svg {
      width: 1rem;
      height: 1rem;
    }
  `;

  if (typeof document !== 'undefined') {
    const styleId = 'admin-layout-overrides';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = layoutOverrides;
      document.head.appendChild(style);
    }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        {/* Desktop Sidebar */}
        <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
          <SidebarHeader>
            <div className="brand-name">Smaiti Luxe</div>
            <div className="brand-sub">Console d'administration</div>
          </SidebarHeader>

          <SidebarContent>
            {grouped.map((group, idx) => (
              <SidebarGroup key={idx}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const badge = getBadge(item.pageSlug);
                      const isActive = location.pathname === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => navigate(item.path)}
                          >
                            <item.icon className="sidebar-menu-icon" />
                            <span className="sidebar-menu-label">{item.label}</span>

                            {item.path === "/reservations" ? (
                              <div className="reservation-badges">
                                {lateCount > 0 && (
                                  <span
                                    className="sidebar-badge critical"
                                    title={`${lateCount} en retard`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      navigate('/reservations?filter=retard');
                                    }}
                                  >
                                    {lateCount}
                                  </span>
                                )}
                                {endingSoonCount > 0 && (
                                  <span
                                    className="sidebar-badge blue"
                                    title={`${endingSoonCount} se terminent bientôt`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      navigate('/reservations?filter=ending-soon');
                                    }}
                                  >
                                    {endingSoonCount}
                                  </span>
                                )}
                              </div>
                            ) : item.path === "/reservations-status" ? (
                              <div className="reservation-badges">
                                {pendingCount > 0 && (
                                  <span
                                    className="sidebar-badge amber"
                                    title={`${pendingCount} en attente`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      navigate('/reservations-status?filter=pending');
                                    }}
                                  >
                                    {pendingCount}
                                  </span>
                                )}
                                {contactedCount > 0 && (
                                  <span
                                    className="sidebar-badge purple"
                                    title={`${contactedCount} contactés`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      navigate('/reservations-status?filter=contacted');
                                    }}
                                  >
                                    {contactedCount}
                                  </span>
                                )}
                              </div>
                            ) : (
                              badge && (
                                <span
                                  className={`sidebar-badge ${badge.isCritical ? 'critical' : ''}`}
                                  onClick={(e) => handleBadgeClick(e, item.path)}
                                >
                                  {badge.count}
                                </span>
                              )
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          {/* User & Footer - new design */}
          <div className="sidebar-user-section">
            <div className="sidebar-user-row">
              <div className="sidebar-avatar">
                {getUserName().charAt(0).toUpperCase()}
              </div>
              <div className="sidebar-user-details">
                <div className="sidebar-user-name">{getUserName()}</div>
                <div className="sidebar-user-role">{getUserRole()}</div>
              </div>
            </div>
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </Sidebar>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={20} />
          Menu
        </button>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="mobile-overlay" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar Panel */}
        <div className={`mobile-sidebar-panel ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-sidebar-header">
            <div className="sidebar-logo-icon" style={{
              height: '2.25rem',
              width: '2.25rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #eab308, #f59e0b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>Smaiti Luxe</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Admin</div>
            </div>
            <button 
              className="mobile-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="mobile-nav">
            {grouped.map((group, idx) => (
              <React.Fragment key={idx}>
                <div style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', padding: '0.75rem 0.5rem 0.25rem 0.5rem' }}>{group.label}</div>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const badge = getBadge(item.pageSlug);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <div className="mobile-nav-left">
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </div>

                      {item.path === "/reservations" ? (
                        <div className="flex gap-1">
                          {lateCount > 0 && (
                            <span
                              className="mobile-badge critical"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate('/reservations?filter=retard');
                                setIsMobileMenuOpen(false);
                              }}
                              style={{ backgroundColor: '#ef4444' }}
                            >
                              {lateCount}
                            </span>
                          )}
                          {endingSoonCount > 0 && (
                            <span
                              className="mobile-badge"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate('/reservations?filter=ending-soon');
                                setIsMobileMenuOpen(false);
                              }}
                              style={{ backgroundColor: '#3b82f6' }}
                            >
                              {endingSoonCount}
                            </span>
                          )}
                        </div>
                      ) : item.path === "/reservations-status" ? (
                        <div className="flex gap-1">
                          {pendingCount > 0 && (
                            <span
                              className="mobile-badge"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate('/reservations-status?filter=pending');
                                setIsMobileMenuOpen(false);
                              }}
                              style={{ backgroundColor: '#f59e0b' }}
                            >
                              {pendingCount}
                            </span>
                          )}
                          {contactedCount > 0 && (
                            <span
                              className="mobile-badge"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate('/reservations-status?filter=contacted');
                                setIsMobileMenuOpen(false);
                              }}
                              style={{ backgroundColor: '#8b5cf6' }}
                            >
                              {contactedCount}
                            </span>
                          )}
                        </div>
                      ) : (
                        badge && (
                          <span
                            className={`mobile-badge ${badge.isCritical ? 'critical' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate({ pathname: item.path, search: '?filter=notifications' });
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            {badge.count}
                          </span>
                        )
                      )}
                    </Link>
                  );
                })}
              </React.Fragment>
            ))}
          </nav>

          <div className="mobile-user-section">
            <div className="mobile-user-info">
              <div className="mobile-user-name">{getUserName()}</div>
              <div className="mobile-user-role">{getUserRole()}</div>
            </div>
            <button onClick={handleLogout} className="mobile-logout-btn">
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Main content area */}
        <SidebarInset className="flex-1">
          <div className="p-6 lg:p-8 admin-main-content">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}