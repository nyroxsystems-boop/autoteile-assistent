import { useEffect, type CSSProperties } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

const navItems = [
  { path: '/', label: 'Übersicht' },
  { path: '/orders', label: 'Bestellungen' }
];

const App = () => {
  const location = useLocation();
  const auth = useAuth();

  useEffect(() => {
    console.log('[Layout] mounted');
    return () => console.log('[Layout] unmounted');
  }, []);

  useEffect(() => {
    console.log('[Layout] route changed to', location.pathname);
  }, [location]);

  return (
    <div style={styles.shell} className="container">
      <header style={styles.header}>
        <div style={styles.brandBlock}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={styles.logo}></div>
            <div>
              <div style={styles.brandTitle}>Autoteile-Dashboard</div>
              <p style={styles.brandSubtitle}>WhatsApp Assistent · Händleransicht</p>
            </div>
          </div>
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* merchant info + logout */}
          {auth?.session ? (
            <>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={styles.merchantInfo}>
                  <div style={styles.avatar}>{auth.session.merchantId?.slice(0,2).toUpperCase()}</div>
                  <div style={{ color: '#cbd5e1', fontWeight: 700 }}>{auth.session.merchantId}</div>
                </div>
                <button style={styles.logoutButton} onClick={() => auth.logout()}>
                  Logout
                </button>
              </div>
            </>
          ) : null}
        </div>
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
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: 'linear-gradient(135deg,#2563eb,#06b6d4)'
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
  merchantInfo: {
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: '#0f172a',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800
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
  ,
  logoutButton: {
    background: 'transparent',
    border: '1px solid rgba(226,232,240,0.08)',
    color: '#e2e8f0',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 700
  }
};

export default App;
