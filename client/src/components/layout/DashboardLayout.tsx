import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Building
} from 'lucide-react';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { Sidebar, NavItem, MobileMenuButton } from './Sidebar';

// Navigation is now built dynamically using translation keys
function useNavigation(): NavItem[] {
  const { t } = useTranslation();

  return [
    { name: t('sidebar.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('sidebar.surveys'), path: '/surveys', icon: ClipboardList, roles: ['super_admin', 'company_admin', 'site_admin', 'department_admin'] },
    { name: t('sidebar.analytics'), path: '/analytics', icon: BarChart3, roles: ['super_admin', 'company_admin', 'site_admin', 'department_admin'] },
    { name: t('sidebar.companies'), path: '/companies', icon: Building, roles: ['super_admin'] },
  ];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navigation?: NavItem[];
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navigation,
  title,
  subtitle,
  headerActions,
}) => {
  const defaultNav = useNavigation();
  const nav = navigation || defaultNav;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex">
        <Sidebar navigation={nav} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header for mobile */}
          <header className="lg:hidden sticky top-0 z-30 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
            <MobileMenuButton />
            <span className="text-lg font-semibold text-text-primary">
              {title || 'Qualitivate'}
            </span>
            <div className="w-10" /> {/* Spacer for centering */}
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Page header */}
              {(title || headerActions) && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 lg:mb-8">
                  {title && (
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-text-primary">{title}</h1>
                      {subtitle && (
                        <p className="text-text-secondary mt-1">{subtitle}</p>
                      )}
                    </div>
                  )}
                  {headerActions && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {headerActions}
                    </div>
                  )}
                </div>
              )}

              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
