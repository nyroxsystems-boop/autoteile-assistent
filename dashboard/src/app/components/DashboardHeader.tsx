import { useState } from 'react';
import {
  Sun, Moon, Globe, Settings, User, LogOut, Bell, ChevronDown,
  ChevronsUpDown, Plus, Check, Building2, Users, Crown, Shield
} from 'lucide-react';

interface Account {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  company: string;
  isActive: boolean;
}

interface DashboardHeaderProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  language: 'de' | 'en';
  onLanguageChange: (lang: 'de' | 'en') => void;
  userName: string;
  userEmail: string;
  companyName: string;
  notificationCount?: number;
  onOpenCommandPalette: () => void;
  onNavigate?: (view: string) => void;
  // Multi-account props
  tenants?: any[];
  currentTenant?: any;
  onSwitchTenant?: (id: number) => void;
}

export function DashboardHeader({
  theme,
  onThemeChange,
  language,
  onLanguageChange,
  userName,
  userEmail,
  companyName,
  notificationCount,
  onOpenCommandPalette,
  onNavigate,
  tenants = [],
  currentTenant,
  onSwitchTenant,
}: DashboardHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const roleLabels: Record<string, string> = {
    owner: 'Inhaber',
    admin: 'Administrator',
    member: 'Mitarbeiter',
    superuser: 'Superuser',
  };

  const getInitials = (name: string) => {
    return name
      ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
      : 'AD';
  };

  const handleAccountSwitch = (tenantId: number) => {
    onSwitchTenant?.(tenantId);
    setShowUserMenu(false);
  };

  return (
    <>
      <header className="fixed top-0 right-0 left-20 h-16 bg-card border-b border-border z-30 flex items-center justify-between px-12">
        {/* Left: Keyboard Shortcut Hint */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <kbd className="px-2 py-1 bg-muted border border-border rounded font-mono">⌘K</kbd>
          <span>für Suche</span>
          <span className="mx-2">·</span>
          <kbd className="px-2 py-1 bg-muted border border-border rounded font-mono">?</kbd>
          <span>für Shortcuts</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            className="w-10 h-10 rounded-lg hover:bg-accent flex items-center justify-center transition-colors relative group"
            title="Benachrichtigungen"
            onClick={onOpenCommandPalette}
          >
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground" strokeWidth={1.5} />
            {notificationCount && notificationCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-border"></div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="h-10 px-3 rounded-lg hover:bg-accent flex items-center gap-2 transition-colors group"
            >
              <Globe className="w-4 h-4 text-muted-foreground group-hover:text-foreground" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground uppercase">{language}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                ></div>
                <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                  <button
                    onClick={() => {
                      onLanguageChange('de');
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-3 ${language === 'de' ? 'text-primary font-medium' : 'text-foreground'
                      }`}
                  >
                    <span className="text-lg">🇩🇪</span>
                    <span>Deutsch</span>
                    {language === 'de' && <span className="ml-auto text-primary">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      onLanguageChange('en');
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-3 ${language === 'en' ? 'text-primary font-medium' : 'text-foreground'
                      }`}
                  >
                    <span className="text-lg">🇬🇧</span>
                    <span>English</span>
                    {language === 'en' && <span className="ml-auto text-primary">✓</span>}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
            className="w-10 h-10 rounded-lg hover:bg-accent flex items-center justify-center transition-colors group"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-muted-foreground group-hover:text-foreground" strokeWidth={1.5} />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground group-hover:text-foreground" strokeWidth={1.5} />
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-border"></div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="h-10 pl-3 pr-2 rounded-lg hover:bg-accent flex items-center gap-3 transition-colors group"
            >
              <div className="text-right">
                <div className="text-sm font-medium text-foreground leading-none mb-1">{currentTenant?.tenant_name || userName}</div>
                <div className="text-xs text-muted-foreground leading-none">{currentTenant?.role ? roleLabels[currentTenant.role] : 'Gast'}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-primary/20">
                {getInitials(currentTenant?.tenant_name || userName)}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                ></div>
                <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl py-2 z-50 max-h-[600px] overflow-y-auto">
                  {/* Current User Header */}
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg ring-2 ring-primary/20">
                        {getInitials(currentTenant?.tenant_name || userName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {currentTenant?.tenant_name || userName}
                          {currentTenant?.role === 'owner' && (
                            <Crown className="w-3.5 h-3.5 text-amber-600" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">{userEmail}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentTenant?.role === 'owner'
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                              : currentTenant?.role === 'admin'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
                            }`}>
                            {currentTenant?.role ? roleLabels[currentTenant.role] : 'Benutzer'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Switcher Section */}
                  <div className="py-2">
                    <div className="px-4 py-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Meine Accounts
                      </div>
                    </div>

                    {tenants.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleAccountSwitch(t.tenant)}
                        className={`w-full px-4 py-2.5 text-left hover:bg-accent transition-colors flex items-center gap-3 group ${t.tenant === currentTenant?.tenant ? 'bg-primary/5' : ''
                          }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm flex-shrink-0">
                          {getInitials(t.tenant_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate flex items-center gap-2">
                            {t.tenant_name}
                            {t.tenant === currentTenant?.tenant && <Check className="w-3 h-3 text-primary" />}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {roleLabels[t.role]}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Settings Actions */}
                  <div className="border-t border-border py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate?.('settings');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                      <span>Einstellungen</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-border mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        localStorage.removeItem('selectedTenantId');
                        window.location.reload();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.5} />
                      <span className="font-medium">Abmelden</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}