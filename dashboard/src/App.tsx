import { useEffect, type CSSProperties } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Übersicht' },
  { path: '/orders', label: 'Bestellungen' }
];

const App = () => {
  const location = useLocation();

  useEffect(() => {
    console.log('[Layout] mounted');
    return () => console.log('[Layout] unmounted');
  }, []);

  useEffect(() => {
    console.log('[Layout] route changed to', location.pathname);
  }, [location]);

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div style={styles.brandBlock}>
          <div style={styles.brandTitle}>Autoteile-Dashboard</div>
          <p style={styles.brandSubtitle}>WhatsApp Assistent · Händleransicht</p>
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
              onClick={() => console.log('[Layout] navigation click', { to: item.path })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main style={styles.main}>
        <div style={styles.pageWrapper}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: '100vh',
    backgroundColor: '#f6f8fb',
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 28px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
  },
  brandBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: 0.3
  },
  brandSubtitle: {
    margin: 0,
    color: '#cbd5e1',
    fontSize: 13
  },
  nav: {
    display: 'flex',
    gap: 10
  },
  navLink: {
    padding: '10px 14px',
    borderRadius: 10,
    color: '#e2e8f0',
    textDecoration: 'none',
    border: '1px solid transparent',
    fontWeight: 700,
    letterSpacing: 0.2,
    transition: 'all 0.15s ease'
  },
  navLinkActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#3b82f6',
    color: '#ffffff',
    boxShadow: '0 8px 18px rgba(59,130,246,0.35)'
  },
  main: {
    flex: 1,
    padding: '20px 28px'
  },
  pageWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    padding: 24,
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)'
  }
};

export default App;
