import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { useI18n, languageOptions } from './i18n';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { TimeframeProvider, useTimeframe } from './features/timeframe/TimeframeContext';
import DevInfo from './ui/DevInfo';

type NavGroup = {
  id: string;
  label: string;
  items: { path: string; label: string }[];
};

const navGroups: NavGroup[] = [
  {
    id: 'cockpit',
    label: 'Cockpit',
    items: [
      { path: '/overview', label: 'Übersicht' },
      { path: '/recommendations', label: 'Empfehlungen' }
    ]
  },
  {
    id: 'sales',
    label: 'Verkauf',
    items: [
      { path: '/orders', label: 'Bestellungen' },
      { path: '/insights/conversion', label: 'Konversion & Abbrüche' }
    ]
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { path: '/insights/forensics', label: 'Forensik' },
      { path: '/insights/returns', label: 'Retouren' }
    ]
  },
  {
    id: 'inventory',
    label: 'Lager & Einkauf',
    items: [
      { path: '/inventory', label: 'Lagerübersicht' },
      { path: '/inventory/capital', label: 'Gebundenes Kapital' }
    ]
  },
  {
    id: 'finance',
    label: 'Finanzen',
    items: [
      { path: '/orders', label: 'Orders' },
      { path: '/documents', label: 'Belege' },
      { path: '/documents/transmit', label: 'Behörden-Übermittlung' }
    ]
  },
  {
    id: 'wawi',
    label: 'WAWI',
    items: [
      { path: '/offers', label: 'Offers' },
      { path: '/suppliers', label: 'Suppliers' },
      { path: '/wws-connections', label: 'WWS Connections' }
    ]
  },
  {
    id: 'settings',
    label: 'Einstellungen',
    items: [
      { path: '/settings/pricing', label: 'Preisprofile' },
      { path: '/settings/integrations', label: 'Shops & Integrationen' }
    ]
  }
];

const App: React.FC = () => (
  <TimeframeProvider>
    <InnerApp />
  </TimeframeProvider>
);

const InnerApp: React.FC = () => {
  const location = useLocation();
  const auth = useAuth();
  const { t, lang, setLang } = useI18n();
  const { timeframe, setTimeframe } = useTimeframe();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof localStorage === 'undefined') return 'dark';
    const stored = localStorage.getItem('theme');
    return stored === 'light' ? 'light' : 'dark';
  });
  const [langSearch, setLangSearch] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof localStorage === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('nav_collapsed') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('nav_collapsed', JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/orders/')) return 'Bestelldetails';
    if (location.pathname.startsWith('/overview')) return 'Übersicht';
    if (location.pathname.startsWith('/recommendations')) return 'Empfehlungen';
    if (location.pathname.startsWith('/insights/forensics')) return 'Forensik';
    if (location.pathname.startsWith('/insights/conversion')) return 'Konversion & Abbrüche';
    if (location.pathname.startsWith('/inventory/capital')) return 'Gebundenes Kapital Radar';
    if (location.pathname.startsWith('/inventory')) return 'Lagerübersicht';
    if (location.pathname.startsWith('/orders') || location.pathname.startsWith('/invoices')) return 'Orders';
    if (location.pathname.startsWith('/documents')) return 'Belege';
    if (location.pathname.startsWith('/settings/pricing')) return 'Preisprofile';
    if (location.pathname.startsWith('/settings/integrations')) return 'Shops & Integrationen';
    return t('brandTitle');
  }, [location.pathname, t]);

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" />
          <div>
            <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>PartsBot Dashboard</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>{t('brandSubtitle')}</div>
          </div>
        </div>
        <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {navGroups.map((group) => (
            <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  fontWeight: 700,
                  textAlign: 'left',
                  padding: '6px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <span>{group.label}</span>
                <span style={{ opacity: 0.6 }}>{collapsedGroups[group.id] ? '▸' : '▾'}</span>
              </button>
              {!collapsedGroups[group.id] ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => ['sidebar-link', isActive ? 'active' : ''].join(' ')}
                    >
                      <span className="sidebar-link-label">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <div className="topbar">
          <div className="topbar-title">{pageTitle}</div>
          <div className="topbar-actions" style={{ gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['Heute', 'Diese Woche', 'Dieser Monat', 'Dieses Jahr'] as const).map((p) => (
                <Button
                  key={p}
                  variant={timeframe === p ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeframe(p)}
                  aria-label={`Zeitraum ${p}`}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" aria-label="Command Palette">⌘K</Button>
            <div style={{ position: 'relative' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLangMenu((v) => !v)}
                aria-label="Sprache wählen"
                style={{ minWidth: 120, justifyContent: 'space-between', display: 'inline-flex' }}
              >
                {languageOptions.find((l) => l.code === lang)?.label ?? 'Sprache'}
                <span style={{ marginLeft: 6, opacity: 0.7 }}>▾</span>
              </Button>
              {showLangMenu ? (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 42,
                    width: 220,
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                    padding: 10,
                    zIndex: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <input
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Sprache suchen..."
                    style={{
                      width: '100%',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--text)'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                    {languageOptions
                      .filter((l) =>
                        (l.label + l.code)
                          .toLowerCase()
                          .includes(langSearch.trim().toLowerCase())
                      )
                      .map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            setLang(l.code as any);
                            setShowLangMenu(false);
                            setLangSearch('');
                          }}
                          style={{
                            textAlign: 'left',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '8px 10px',
                            background: l.code === lang ? 'rgba(79,139,255,0.12)' : 'transparent',
                            color: 'var(--text)',
                            cursor: 'pointer'
                          }}
                        >
                          {l.label}
                        </button>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="Theme umschalten"
            >
              {theme === 'dark' ? 'Hell' : 'Dunkel'}
            </Button>
            {auth?.session ? (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu((v) => !v)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #334155, #1e293b)',
                    border: '1px solid var(--border)',
                    color: '#e2e8f0',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  aria-label="Profilmenü öffnen"
                >
                  {auth.session.merchantId?.slice(0, 2).toUpperCase()}
                </button>
                {showProfileMenu ? (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 46,
                      minWidth: 200,
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      boxShadow: '0 14px 40px rgba(0,0,0,0.3)',
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      zIndex: 15
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{auth.session.merchantId}</div>
                    <Badge variant="success">Plan aktiv</Badge>
                    <Button variant="ghost" size="sm" fullWidth>
                      Marge & Shops
                    </Button>
                    <Button variant="ghost" size="sm" fullWidth>
                      Billing & Konto
                    </Button>
                    <Button variant="ghost" size="sm" fullWidth>
                      Mitarbeiteraccounts
                    </Button>
                    <Button variant="ghost" size="sm" fullWidth onClick={() => auth.logout()}>
                      {t('logout')}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <main className="page">
          {import.meta.env.DEV ? <DevInfo /> : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default App;
