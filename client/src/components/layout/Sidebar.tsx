import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Menu, X, LogOut } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';

// User role type
export type UserRole = 'super_admin' | 'company_admin' | 'site_admin' | 'department_admin' | 'user';

// Navigation item type
export interface NavItem {
  name: string;
  path: string;
  icon: React.FC<{ className?: string }>;
  badge?: string | number;
  roles?: UserRole[]; // If defined, only these roles see this item
}

interface SidebarProps {
  navigation: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    isCollapsed,
    isHovered,
    isMobileOpen,
    toggleCollapsed,
    setHovered,
    closeMobile
  } = useSidebar();

  // Determine if sidebar should be expanded (not collapsed OR being hovered)
  const isExpanded = !isCollapsed || isHovered;

  // Check if a nav item is current
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Filter navigation for role-based items
  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true; // Show to everyone if no roles specified
    return item.roles.includes(user?.role as UserRole);
  });

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`
        sidebar-smart-brand flex-shrink-0
        ${isExpanded ? 'sidebar-smart-brand-expanded' : 'sidebar-smart-brand-collapsed'}
      `}>
        <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          {isExpanded ? (
            <img src="/logo.png" alt="Qualitivate" className="h-10 w-auto object-contain" />
          ) : (
            <img src="/icon.png" alt="Qualitivate" className="h-8 w-8 object-contain" />
          )}
        </Link>

        {/* Collapse toggle - Desktop only */}
        <button
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          aria-expanded={!isCollapsed}
          className={`
            hidden lg:flex
            absolute -right-3 top-8 
            w-6 h-6 bg-surface border border-border rounded-full 
            items-center justify-center 
            text-text-secondary hover:text-primary-600 hover:border-primary-300
            transition-all duration-200 shadow-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
          title={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Close button - Mobile only */}
        <button
          onClick={closeMobile}
          aria-label={t('sidebar.closeMenu')}
          className="lg:hidden absolute right-4 top-6 p-1 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-1">
        {filteredNavigation.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={closeMobile}
            className={`sidebar-smart-link ${isActive(item.path) ? 'active' : ''}`}
            title={!isExpanded ? item.name : undefined}
          >
            <item.icon className="sidebar-smart-link-icon" />
            <span className={`
              sidebar-smart-link-text
              ${isExpanded ? 'sidebar-smart-link-text-visible' : 'sidebar-smart-link-text-hidden'}
            `}>
              {item.name}
            </span>
            {item.badge !== undefined && isExpanded && (
              <span className="ml-auto badge-primary text-xs">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer - Profile & Sign Out - Fixed at bottom */}
      <div className={`
        flex-shrink-0 py-4 border-t border-border bg-surface
        ${isExpanded ? 'px-4' : 'px-2'}
      `}>
        {/* Profile Link */}
        <Link
          to="/profile"
          onClick={closeMobile}
          className={`
            flex items-center gap-3 mb-3 p-2 rounded-lg
            hover:bg-primary-50 transition-colors cursor-pointer
            ${isExpanded ? '' : 'justify-center'}
          `}
          title={!isExpanded ? user?.email : undefined}
        >
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-600 font-medium">
              {user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0 transition-all duration-300">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
              </p>
              <p className="text-xs text-text-secondary capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          )}
        </Link>
        
        <button
          onClick={logout}
          aria-label={t('sidebar.signOut')}
          className={`
            btn-ghost w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50
            flex items-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg
            ${isExpanded ? 'justify-start px-2' : 'justify-center'}
          `}
          title={!isExpanded ? t('sidebar.signOut') : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {isExpanded && <span className="ml-2">{t('sidebar.signOut')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`
          lg:hidden fixed inset-0 bg-black/50 z-40
          transition-opacity duration-300
          ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={closeMobile}
      />

      {/* Mobile sidebar */}
      <aside
        className={`
          lg:hidden fixed top-0 left-0 h-full w-72 bg-surface border-r border-border z-50
          flex flex-col
          transform transition-transform duration-300 ease-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col
          sidebar-smart group
          ${isCollapsed && !isHovered ? 'sidebar-smart-collapsed' : 'sidebar-smart-expanded'}
        `}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

// Mobile menu button component for header
export const MobileMenuButton: React.FC = () => {
  const { toggleMobile } = useSidebar();

  return (
    <button
      onClick={toggleMobile}
      className="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-soft transition-colors"
      aria-label="Toggle menu"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
};

export default Sidebar;
