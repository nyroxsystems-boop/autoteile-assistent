import { Navigate, createBrowserRouter } from 'react-router-dom';
import App from './App';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersListPage from './pages/OrdersListPage';

const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/orders" replace /> },
      { path: 'orders', element: <OrdersListPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
      { path: '*', element: <Navigate to="/orders" replace /> }
    ]
  }
];

console.log('[router] Creating router', routes);

const router = createBrowserRouter(routes);

export default router;
