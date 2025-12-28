import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { CommandPalette } from './components/CommandPalette';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { ToastProvider } from './components/ToastProvider';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTenants } from './hooks/useTenants';
import { useMe } from './hooks/useMe';
import { HeuteView } from './views/HeuteView';
import { LoginView } from './views/LoginView';
import { AuftraegeView } from './views/AuftraegeView';
import { AngeboteView } from './views/AngeboteView';
import { PreisprofileView } from './views/PreisprofileView';
import { LieferantenView } from './views/LieferantenView';
import { StatusView } from './views/StatusView';
import { CustomersInquiriesView } from './views/CustomersInquiriesView';
import { DocumentsInvoicesView } from './views/DocumentsInvoicesView';
import { WarehouseView } from './views/WarehouseView';
import { SettingsView } from './views/SettingsView';
import { AdminDashboardView } from './views/AdminDashboardView';

export default function App() {
  const [activeView, setActiveView] = useState('heute');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedLanguage = localStorage.getItem('language') as 'de' | 'en' | null;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Welcome message
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setTimeout(() => {
        toast.success('Willkommen im Dashboard! Drücke ⌘K für schnellen Zugriff.', {
          duration: 6000,
        });
        localStorage.setItem('hasSeenWelcome', 'true');
      }, 500);
    }
  }, []);

  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Handle language change
  const handleLanguageChange = (newLang: 'de' | 'en') => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  // Handle view navigation
  const handleNavigate = (view: string) => {
    setActiveView(view);
    const viewNames: Record<string, string> = {
      heute: 'Heute',
      kunden: 'Kunden & Anfragen',
      angebote: 'Angebote',
      auftraege: 'Aufträge',
      preise: 'Preisprofile',
      belege: 'Belege & Rechnungen',
      lieferanten: 'Lieferanten',
      status: 'Status & Analytics',
      warenwirtschaft: 'Warenwirtschaft',
      admin: 'Admin Dashboard',
    };
    toast.success(`Zu ${viewNames[view] || view} gewechselt`);
  };

  // Settings modal handler
  const handleOpenSettings = () => {
    const event = new CustomEvent('open-settings');
    window.dispatchEvent(event);
  };

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onNavigate: handleNavigate,
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onOpenSettings: handleOpenSettings,
  });

  // Listen for custom events
  useEffect(() => {
    const handleShowShortcuts = () => setShortcutsOpen(true);
    const handleOpenSettingsEvent = () => {
      // Trigger settings modal in header
    };

    window.addEventListener('show-shortcuts', handleShowShortcuts);
    window.addEventListener('open-settings', handleOpenSettingsEvent);

    return () => {
      window.removeEventListener('show-shortcuts', handleShowShortcuts);
      window.removeEventListener('open-settings', handleOpenSettingsEvent);
    };
  }, []);

  const { tenants, currentTenant, switchTenant, loading: tenantsLoading } = useTenants();
  const { me } = useMe();

  if (!isAuthenticated) {
    return (
      <>
        <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />
        <ToastProvider theme={theme} />
      </>
    );
  }

  const renderView = () => {
    if (tenantsLoading) return <div className="p-20 text-center">Lade Accounts...</div>;

    switch (activeView) {
      case 'heute':
        return <HeuteView onNavigate={setActiveView} />;
      case 'kunden':
        return <CustomersInquiriesView onNavigate={setActiveView} />;
      case 'auftraege':
        return <AuftraegeView />;
      case 'angebote':
        return <AngeboteView />;
      case 'preise':
        return <PreisprofileView />;
      case 'belege':
        return <DocumentsInvoicesView />;
      case 'warenwirtschaft':
        return <WarehouseView />;
      case 'lieferanten':
        return <LieferantenView />;
      case 'status':
        return <StatusView />;
      case 'settings':
        return <SettingsView />;
      case 'admin':
        return <AdminDashboardView />;
      default:
        return <HeuteView onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isOwner={me?.user?.is_owner}
        botStatus="online"
        environment={currentTenant ? 'live' : 'demo'}
      />

      {/* Header */}
      <DashboardHeader
        theme={theme}
        onThemeChange={handleThemeChange}
        language={language}
        onLanguageChange={handleLanguageChange}
        userName={me?.user?.first_name ? `${me.user.first_name} ${me.user.last_name}` : me?.user?.username || "Admin"}
        userEmail={me?.user?.email || "admin@autoteile-assistent.com"}
        companyName={currentTenant?.tenant_name || "Autoteile ERP"}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onNavigate={setActiveView}
        // Custom props for multi-account
        tenants={tenants}
        currentTenant={currentTenant}
        onSwitchTenant={switchTenant}
      />

      {/* Main Content with Container */}
      <main className="ml-20 mt-16">
        <div className="max-w-[1440px] mx-auto px-12 py-12">
          {renderView()}
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNavigate={handleNavigate}
        theme={theme}
      />

      {/* Shortcuts Overlay */}
      <ShortcutsOverlay
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* Toast Provider */}
      <ToastProvider theme={theme} />
    </div>
  );
}