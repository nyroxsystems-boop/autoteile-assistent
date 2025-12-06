import { useEffect, type CSSProperties } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [{ path: '/orders', label: 'Orders' }];

const App = () => {
  const location = useLocation();

  useEffect(() => {
    console.log('[App] Mounted dashboard shell');
    return () => console.log('[App] Unmounted dashboard shell');
  }, []);

  useEffect(() => {
    console.log(`[App] Active route -> ${location.pathname}${location.search}${location.hash}`);
  }, [location]);

  return (
    <div style={styles.appShell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandAccent}>Auto</span>teile Admin
        </div>
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {})
              })}
              onClick={() =>
                console.log(`[App] Navigating to ${item.path} from ${location.pathname}`)
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.badge}>v0.0.1</div>
          <div>Orders assistant dashboard</div>
        </div>
      </aside>

      <div style={styles.mainContent}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Autoteile Orders</p>
            <h1 style={styles.pageTitle}>Dashboard</h1>
          </div>
          <div style={styles.activeRoute}>Current route: {location.pathname}</div>
        </header>
        <section style={styles.contentArea}>
          <Outlet />
        </section>
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  appShell: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    minHeight: '100vh',
    backgroundColor: '#eef2f7'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    padding: '24px 20px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0'
  },
  brand: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.2
  },
  brandAccent: {
    color: '#a5b4fc'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 8
  },
  navLink: {
    padding: '10px 12px',
    borderRadius: 8,
    color: '#cbd5e1',
    fontWeight: 600,
    border: '1px solid transparent',
    transition: 'all 0.15s ease-in-out'
  },
  navLinkActive: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderColor: '#334155'
  },
  sidebarFooter: {
    marginTop: 'auto',
    fontSize: 12,
    color: '#94a3b8',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  badge: {
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    padding: '6px 8px',
    borderRadius: 6,
    width: 'fit-content',
    fontWeight: 700,
    fontSize: 12
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: '28px 32px',
    gap: 20
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  eyebrow: {
    margin: 0,
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1.2,
    color: '#475569'
  },
  pageTitle: {
    margin: '4px 0 0',
    fontSize: 28,
    color: '#0f172a'
  },
  activeRoute: {
    padding: '8px 12px',
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    color: '#1e293b',
    fontWeight: 600,
    fontSize: 14,
    border: '1px solid #cbd5e1'
  },
  contentArea: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: '24px',
    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
    border: '1px solid #e2e8f0'
  }
};

export default App;
