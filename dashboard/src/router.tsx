import { Navigate, createBrowserRouter } from 'react-router-dom';
import App from './App';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersListPage from './pages/OrdersListPage';
import OverviewPage from './pages/OverviewPage';
import AuthPage from './pages/AuthPage';
import { AuthProvider, RequireAuth } from './auth/AuthContext';

const routes = [
  {
    path: '/auth',
    element: <AuthPage />
  },
  {
    path: '/',
    element: (
      <AuthProvider>
        <RequireAuth>
          <App />
        </RequireAuth>
      </AuthProvider>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'orders', element: <OrdersListPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
      { path: '*', element: <Navigate to='/' replace /> }
    ]
  }
];

console.log('[router] Creating router', routes);

const router = createBrowserRouter(routes);

export default router;
