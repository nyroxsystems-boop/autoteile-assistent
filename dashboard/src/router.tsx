import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import App from './AppRoot';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersListPage from './pages/OrdersListPage';
import OverviewPage from './pages/OverviewPage';
import AuthPage from './pages/AuthPage';
import { AuthProvider, RequireAuth } from './auth/AuthContext';
import WwsPage from './features/wws/WwsPage';
import DocumentsPage from './pages/DocumentsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ForensicsPage from './pages/ForensicsPage';
import CapitalPage from './pages/CapitalPage';
import InventoryPage from './pages/InventoryPage';
import TransmitPage from './pages/TransmitPage';
import PricingPage from './pages/PricingPage';
import IntegrationsPage from './pages/IntegrationsPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import ConversionPage from './pages/ConversionPage';
import ReturnsPage from './pages/ReturnsPage';
import { I18nProvider } from './i18n';
import LegacyInvoiceRedirect from './pages/LegacyInvoiceRedirect';
import OffersPage from './pages/OffersPage';
import SuppliersPage from './pages/SuppliersPage';
import WwsConnectionsPage from './pages/WwsConnectionsPage';
import SalesTeamPage from './pages/SalesTeamPage';

const Providers = () => (
  <I18nProvider>
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  </I18nProvider>
);

const routes = [
  {
    element: <Providers />,
    children: [
      { path: '/auth', element: <AuthPage /> },
      {
        path: '/',
        element: (
          <RequireAuth>
            <App />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Navigate to="/overview" replace /> },
          { path: 'overview', element: <OverviewPage /> },
          { path: 'recommendations', element: <RecommendationsPage /> },
          { path: 'insights/forensics', element: <ForensicsPage /> },
          { path: 'insights/conversion', element: <ConversionPage /> },
          { path: 'insights/returns', element: <ReturnsPage /> },
          { path: 'inventory', element: <InventoryPage /> },
          { path: 'inventory/capital', element: <CapitalPage /> },
          { path: 'orders', element: <OrdersListPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'offers', element: <OffersPage /> },
          { path: 'suppliers', element: <SuppliersPage /> },
          { path: 'wws-connections', element: <WwsConnectionsPage /> },
          // Sales / Team
          { path: 'sales/team', element: <SalesTeamPage /> },
          // Legacy redirects for invoices -> orders
          { path: 'invoices', element: <LegacyInvoiceRedirect /> },
          { path: 'invoices/:id', element: <LegacyInvoiceRedirect /> },
          // Orders detail via former invoices UI (kept as fallback)
          { path: 'orders-billing', element: <InvoicesPage /> },
          { path: 'orders-billing/:id', element: <InvoiceDetailPage /> },
          { path: 'wws', element: <WwsPage /> },
          { path: 'documents', element: <DocumentsPage /> },
          { path: 'documents/transmit', element: <TransmitPage /> },
          { path: 'settings/pricing', element: <PricingPage /> },
          { path: 'settings/integrations', element: <IntegrationsPage /> },
          { path: '*', element: <Navigate to='/' replace /> }
        ]
      },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
];

const router = createBrowserRouter(routes);

export default router;
