// ==================== sidebar.jsx ====================
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PanelLeft, X } from 'lucide-react';

// ==================== Styles ====================
const sidebarStyles = `
  :root {
    --background: 40 30% 98%;
    --foreground: 220 25% 10%;
    --card: 0 0% 100%;
    --card-foreground: 220 25% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 25% 10%;
    --primary: 220 30% 12%;
    --primary-foreground: 40 30% 98%;
    --primary-glow: 220 25% 22%;
    --accent: 38 70% 52%;
    --accent-foreground: 220 30% 12%;
    --accent-soft: 38 80% 92%;
    --secondary: 220 15% 95%;
    --secondary-foreground: 220 30% 12%;
    --muted: 220 14% 96%;
    --muted-foreground: 220 10% 42%;
    --destructive: 0 75% 55%;
    --destructive-foreground: 0 0% 100%;
    --success: 145 55% 42%;
    --warning: 35 90% 55%;
    --border: 220 15% 90%;
    --input: 220 15% 90%;
    --ring: 220 30% 12%;
    --radius: 1rem;
    --gradient-hero: linear-gradient(135deg, hsl(40 30% 98%) 0%, hsl(38 60% 94%) 100%);
    --gradient-ink: linear-gradient(135deg, hsl(220 30% 12%) 0%, hsl(220 25% 22%) 100%);
    --gradient-gold: linear-gradient(135deg, hsl(38 70% 52%) 0%, hsl(38 85% 65%) 100%);
    --gradient-soft: radial-gradient(circle at 30% 20%, hsl(38 70% 52% / 0.12), transparent 60%);
    --shadow-soft: 0 2px 20px -8px hsl(220 30% 12% / 0.08);
    --shadow-elevated: 0 30px 60px -30px hsl(220 30% 12% / 0.25);
    --shadow-gold: 0 20px 50px -20px hsl(38 70% 52% / 0.45);
    --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
    --transition-base: all 0.4s var(--ease-smooth);
    --sidebar-background: 220 30% 12%;
    --sidebar-foreground: 40 30% 96%;
    --sidebar-primary: 38 70% 52%;
    --sidebar-primary-foreground: 220 30% 12%;
    --sidebar-accent: 220 25% 18%;
    --sidebar-accent-foreground: 40 30% 96%;
    --sidebar-border: 220 25% 18%;
    --sidebar-ring: 38 70% 52%;
    --sidebar-width: 16rem;
    --sidebar-width-icon: 4rem;
  }

  /* Provider */
  .sidebar-provider {
    display: flex;
    min-height: 100vh;
    width: 100%;
  }

  /* Trigger Button */
  .sidebar-trigger-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: var(--transition-base);
    height: 1.75rem;
    width: 1.75rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: hsl(var(--sidebar-foreground));
  }
  .sidebar-trigger-btn:hover {
    background-color: hsl(var(--sidebar-accent));
  }

  /* Desktop Sidebar - Smaiti Luxe style */
  .sidebar-desktop {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    display: none;
    width: var(--sidebar-width);
    background: linear-gradient(165deg, #0f172a 0%, #1a2332 40%, #0f172a 100%);
    border-right: 1px solid rgba(255,255,255,0.04);
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
    overflow: hidden;
    flex-direction: column;
    transition: width 0.2s var(--ease-smooth);
  }
  @media (min-width: 768px) {
    .sidebar-desktop {
      display: flex;
    }
  }
  .sidebar-desktop.collapsed {
    width: var(--sidebar-width-icon);
  }
  .sidebar-desktop.left {
    left: 0;
  }
  .sidebar-desktop.right {
    right: 0;
    left: auto;
    border-right: none;
    border-left: 1px solid rgba(255,255,255,0.04);
  }

  /* Sidebar Content */
  .sidebar-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  /* Scrollable area */
  .sidebar-content-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0 0.75rem 0.75rem 0.75rem;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
  }
  .sidebar-content-scroll::-webkit-scrollbar {
    width: 3px;
  }
  .sidebar-content-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .sidebar-content-scroll::-webkit-scrollbar-thumb {
    background: rgba(234, 179, 8, 0.3);
    border-radius: 10px;
  }

  /* Brand */
  .sidebar-brand {
    padding: 1.5rem 1.25rem 1rem 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .sidebar-brand .brand-name {
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #f5d77b 0%, #eab308 60%, #d97706 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: inline-block;
  }
  .sidebar-brand .brand-sub {
    font-size: 0.625rem;
    font-weight: 500;
    letter-spacing: 0.15em;
    color: rgba(255,255,255,0.35);
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* Section label */
  .sidebar-section-label {
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    padding: 1.25rem 0.5rem 0.5rem 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .sidebar-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.06);
  }

  /* Menu items */
  .sidebar-menu {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sidebar-menu-item {
    position: relative;
  }
  .sidebar-menu-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.5625rem 0.75rem;
    border-radius: 0.625rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255,255,255,0.55);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    position: relative;
  }
  .sidebar-menu-button:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.85);
  }
  .sidebar-menu-button.active {
    background: rgba(234, 179, 8, 0.12);
    color: #f5d77b;
  }
  .sidebar-menu-button.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 1.5rem;
    background: linear-gradient(to bottom, #eab308, #d97706);
    border-radius: 0 3px 3px 0;
  }
  .sidebar-menu-icon {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
    opacity: 0.6;
    transition: opacity 0.2s;
  }
  .sidebar-menu-button:hover .sidebar-menu-icon,
  .sidebar-menu-button.active .sidebar-menu-icon {
    opacity: 1;
  }
  .sidebar-menu-label {
    flex: 1;
  }

  /* Badge */
  .sidebar-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.25rem;
    border-radius: 9999px;
    font-size: 0.625rem;
    font-weight: 700;
    color: #0f172a;
    background: #eab308;
    flex-shrink: 0;
    transition: all 0.2s;
    cursor: pointer;
  }
  .sidebar-badge.critical {
    background: #ef4444;
    color: #fff;
  }
  .sidebar-badge.blue {
    background: #3b82f6;
    color: #fff;
  }
  .sidebar-badge.purple {
    background: #8b5cf6;
    color: #fff;
  }

  /* Submenu */
  .sidebar-menu-sub {
    margin-left: 0.875rem;
    padding-left: 0.625rem;
    border-left: 2px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .collapsed .sidebar-menu-sub {
    display: none;
  }
  .sidebar-menu-sub-button {
    position: relative;
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.75rem;
    overflow: hidden;
    border-radius: 0.75rem;
    padding: 0.5rem 1rem;
    text-align: left;
    font-size: 0.813rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: rgba(255,255,255,0.55);
    transition: var(--transition-base);
  }
  .sidebar-menu-sub-button:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.85);
  }
  .sidebar-menu-sub-button.active {
    background: rgba(234, 179, 8, 0.12);
    color: #f5d77b;
  }

  /* Separator */
  .sidebar-separator {
    margin: 0.75rem 0;
    border: none;
    border-top: 1px solid rgba(255,255,255,0.04);
  }

  /* Input */
  .sidebar-input {
    width: 100%;
    height: 2rem;
    padding: 0 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.8);
    font-size: 0.875rem;
    transition: var(--transition-base);
  }
  .sidebar-input:focus {
    outline: none;
    border-color: hsl(var(--sidebar-ring));
    box-shadow: 0 0 0 2px hsl(var(--sidebar-ring) / 0.2);
  }
  .sidebar-input::placeholder {
    color: rgba(255,255,255,0.35);
  }

  /* Skeleton */
  .sidebar-skeleton {
    display: flex;
    height: 2rem;
    align-items: center;
    gap: 0.75rem;
    border-radius: 0.75rem;
    padding: 0 0.75rem;
  }
  .sidebar-skeleton-icon {
    width: 1rem;
    height: 1rem;
    border-radius: 0.375rem;
    background: rgba(255,255,255,0.08);
    animation: pulse 1.5s ease-in-out infinite;
  }
  .sidebar-skeleton-text {
    height: 1rem;
    flex: 1;
    border-radius: 0.25rem;
    background: rgba(255,255,255,0.08);
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Main Content Inset */
  .sidebar-main {
    flex: 1;
    transition: margin 0.2s var(--ease-smooth);
    background: hsl(var(--background));
  }
  @media (min-width: 768px) {
    .sidebar-main.left {
      margin-left: var(--sidebar-width);
    }
    .sidebar-main.left.collapsed {
      margin-left: var(--sidebar-width-icon);
    }
    .sidebar-main.right {
      margin-right: var(--sidebar-width);
    }
    .sidebar-main.right.collapsed {
      margin-right: var(--sidebar-width-icon);
    }
  }

  /* Rail */
  .sidebar-rail {
    position: absolute;
    inset-y: 0;
    z-index: 20;
    display: none;
    width: 1rem;
    transform: translateX(-50%);
    cursor: ew-resize;
    background: transparent;
    border: none;
  }
  @media (min-width: 768px) {
    .sidebar-rail {
      display: flex;
    }
  }
  .sidebar-rail.left {
    right: -0.5rem;
  }
  .sidebar-rail.right {
    left: -0.5rem;
  }
  .sidebar-rail::after {
    content: '';
    position: absolute;
    inset-y: 0;
    left: 50%;
    width: 2px;
    background: transparent;
    transition: background 0.2s;
    border-radius: 2px;
  }
  .sidebar-rail:hover::after {
    background: hsl(var(--sidebar-primary));
  }

  /* Mobile Drawer */
  .sidebar-mobile-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0,0,0,0.5);
    z-index: 40;
    backdrop-filter: blur(4px);
  }
  .sidebar-mobile-drawer {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: 85%;
    max-width: 320px;
    background: linear-gradient(165deg, #0f172a 0%, #1a2332 40%, #0f172a 100%);
    border-right: 1px solid rgba(255,255,255,0.04);
    z-index: 50;
    display: flex;
    flex-direction: column;
    transform: translateX(-100%);
    transition: transform 0.3s var(--ease-smooth);
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
    overflow: hidden;
  }
  .sidebar-mobile-drawer.open {
    transform: translateX(0);
  }
  .sidebar-mobile-header {
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .sidebar-mobile-close {
    background: rgba(255,255,255,0.06);
    border: none;
    cursor: pointer;
    color: rgba(255,255,255,0.7);
    padding: 0.5rem;
    border-radius: 0.75rem;
    transition: var(--transition-base);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sidebar-mobile-close:hover {
    background: rgba(234, 179, 8, 0.15);
    color: #eab308;
    transform: scale(1.05);
  }

  /* User section */
  .sidebar-user {
    padding: 1rem 1.25rem 0.75rem 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .sidebar-user .user-email {
    font-size: 0.813rem;
    font-weight: 500;
    color: rgba(255,255,255,0.7);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sidebar-user .user-role {
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: rgba(234, 179, 8, 0.7);
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* Footer actions */
  .sidebar-footer-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem 1.25rem 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.04);
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .sidebar-footer-actions .lang-btn {
    font-size: 0.6875rem;
    font-weight: 600;
    color: rgba(255,255,255,0.35);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.625rem;
    border-radius: 6px;
    transition: all 0.2s;
    text-transform: uppercase;
  }
  .sidebar-footer-actions .lang-btn:hover,
  .sidebar-footer-actions .lang-btn.active {
    color: #f5d77b;
    background: rgba(234, 179, 8, 0.08);
  }
  .sidebar-footer-actions .divider {
    width: 1px;
    height: 1.125rem;
    background: rgba(255,255,255,0.08);
  }
  .sidebar-footer-actions .footer-link {
    font-size: 0.6875rem;
    font-weight: 500;
    color: rgba(255,255,255,0.35);
    text-decoration: none;
    padding: 0.25rem 0.625rem;
    border-radius: 6px;
    transition: all 0.2s;
    cursor: pointer;
    background: transparent;
    border: none;
  }
  .sidebar-footer-actions .footer-link:hover {
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.05);
  }
  .sidebar-footer-actions .logout-btn {
    font-size: 0.6875rem;
    font-weight: 600;
    color: #f87171;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.625rem;
    border-radius: 6px;
    transition: all 0.2s;
    margin-left: auto;
  }
  .sidebar-footer-actions .logout-btn:hover {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
  }

  /* Utility classes */
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .w-full { width: 100%; }
  .h-full { height: 100%; }
  .gap-1 { gap: 0.25rem; }
  .gap-2 { gap: 0.5rem; }
  .overflow-hidden { overflow: hidden; }
  .relative { position: relative; }
  .cursor-pointer { cursor: pointer; }
  .border-t { border-top: 1px solid rgba(255,255,255,0.05); }
  .mt-auto { margin-top: auto; }
`;

// Inject styles once
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = sidebarStyles;
  document.head.appendChild(style);
}

// ==================== Context ====================
const SidebarContext = createContext(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider');
  return context;
}

// ==================== Helper ====================
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

// ==================== Provider ====================
export function SidebarProvider({ children, defaultOpen = true, open: controlledOpen, onOpenChange }) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = useCallback((value) => {
    const newOpen = typeof value === 'function' ? value(open) : value;
    if (onOpenChange) onOpenChange(newOpen);
    else setInternalOpen(newOpen);
    document.cookie = `sidebar:state=${newOpen}; path=/; max-age=604800`;
  }, [open, onOpenChange]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile(prev => !prev);
    else setOpen(prev => !prev);
  }, [isMobile, setOpen]);

  // Keyboard shortcut (Ctrl+B / Cmd+B)
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  const state = open ? 'expanded' : 'collapsed';
  const value = useMemo(() => ({
    state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar
  }), [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]);

  return (
    <SidebarContext.Provider value={value}>
      <div className="sidebar-provider">
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// ==================== Sidebar Component ====================
export function Sidebar({ side = 'left', variant = 'sidebar', collapsible = 'offcanvas', className = '', children, ...props }) {
  const { isMobile, open, openMobile, setOpenMobile, state } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div className={`sidebar-desktop ${side}`} style={{ width: 'var(--sidebar-width)' }} {...props}>
        <div className="sidebar-content">{children}</div>
      </div>
    );
  }

  // Mobile drawer
  if (isMobile) {
    return (
      <>
        {openMobile && <div className="sidebar-mobile-overlay" onClick={() => setOpenMobile(false)} />}
        <div className={`sidebar-mobile-drawer ${openMobile ? 'open' : ''}`}>
          <div className="sidebar-mobile-header">
            <button className="sidebar-mobile-close" onClick={() => setOpenMobile(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="sidebar-content-scroll">{children}</div>
        </div>
      </>
    );
  }

  // Desktop sidebar
  const isCollapsed = state === 'collapsed';
  return (
    <div className={`sidebar-desktop ${side} ${isCollapsed ? 'collapsed' : ''} ${className}`} {...props}>
      <div className="sidebar-content">{children}</div>
    </div>
  );
}

// ==================== SidebarTrigger ====================
export function SidebarTrigger({ className = '', onClick, ...props }) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      className={`sidebar-trigger-btn ${className}`}
      onClick={(e) => { onClick?.(e); toggleSidebar(); }}
      {...props}
    >
      <PanelLeft size={16} />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  );
}

// ==================== SidebarInset ====================
export function SidebarInset({ className = '', children, ...props }) {
  const context = useContext(SidebarContext);
  if (!context) {
    return <main className={`sidebar-main ${className}`} {...props}>{children}</main>;
  }
  const { side = 'left', state = 'expanded' } = context;
  const collapsedClass = state === 'collapsed' ? 'collapsed' : '';
  return (
    <main className={`sidebar-main ${side} ${collapsedClass} ${className}`} {...props}>
      {children}
    </main>
  );
}

// ==================== SidebarRail ====================
export function SidebarRail({ className = '', ...props }) {
  const { toggleSidebar, side = 'left' } = useSidebar();
  return (
    <button
      className={`sidebar-rail ${side} ${className}`}
      onClick={toggleSidebar}
      {...props}
    />
  );
}

// ==================== Subcomponents ====================
export function SidebarHeader({ className = '', children, ...props }) {
  return (
    <div className={`sidebar-brand ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SidebarFooter({ className = '', children, ...props }) {
  return (
    <div className={`sidebar-user ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SidebarContent({ className = '', children, ...props }) {
  return (
    <div className={`sidebar-content-scroll ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SidebarGroup({ className = '', ...props }) {
  return <div className={`relative w-full ${className}`} {...props} />;
}

export function SidebarGroupLabel({ className = '', ...props }) {
  return <div className={`sidebar-section-label ${className}`} {...props} />;
}

export function SidebarGroupContent({ className = '', ...props }) {
  return <div className={className} {...props} />;
}

export function SidebarMenu({ className = '', ...props }) {
  return <ul className={`sidebar-menu ${className}`} {...props} />;
}

export function SidebarMenuItem({ className = '', ...props }) {
  return <li className={`sidebar-menu-item ${className}`} {...props} />;
}

export function SidebarMenuButton({ isActive = false, className = '', children, ...props }) {
  return (
    <button className={`sidebar-menu-button ${isActive ? 'active' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function SidebarMenuSub({ className = '', ...props }) {
  return <ul className={`sidebar-menu-sub ${className}`} {...props} />;
}

export function SidebarMenuSubItem({ className = '', ...props }) {
  return <li className={className} {...props} />;
}

export function SidebarMenuSubButton({ isActive = false, className = '', ...props }) {
  return <button className={`sidebar-menu-sub-button ${isActive ? 'active' : ''} ${className}`} {...props} />;
}

export function SidebarSeparator({ className = '', ...props }) {
  return <hr className={`sidebar-separator ${className}`} {...props} />;
}

export function SidebarInput({ className = '', ...props }) {
  return <input className={`sidebar-input ${className}`} {...props} />;
}

export function SidebarMenuSkeleton({ showIcon = false, className = '', ...props }) {
  return (
    <div className={`sidebar-skeleton ${className}`} {...props}>
      {showIcon && <div className="sidebar-skeleton-icon" />}
      <div className="sidebar-skeleton-text" />
    </div>
  );
}

// Placeholders
export const SidebarMenuAction = (props) => <button {...props} />;
export const SidebarMenuBadge = (props) => <span {...props} />;
export const SidebarGroupAction = (props) => <button {...props} />;