import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

const LegacyInvoiceRedirect = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) navigate(`/orders/${id}`, { replace: true });
    else navigate('/orders', { replace: true });
  }, [id, navigate]);

  return <Navigate to={id ? `/orders/${id}` : '/orders'} replace />;
};

export default LegacyInvoiceRedirect;
