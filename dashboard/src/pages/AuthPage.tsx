import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [merchantId, setMerchantId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!merchantId) return setError('Bitte Merchant-ID angeben');
    if (!password) return setError('Bitte Passwort angeben');
    let ok = false;
    try {
      if (isRegister) ok = await auth.register(merchantId.trim(), password);
      else ok = await auth.login(merchantId.trim(), password);
    } catch (err: any) {
      setError(err?.message ?? 'Fehler');
      return;
    }
    if (!ok) return setError(isRegister ? 'Registrierung fehlgeschlagen (bereits vorhanden?)' : 'Login fehlgeschlagen');
    navigate('/');
  };

  return (
    <div style={{ maxWidth: 520, margin: '40px auto' }}>
      <h2>{isRegister ? 'Registrieren' : 'Login'}</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label>
          Merchant ID
          <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} />
        </label>
        <label>
          Passwort
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={{ padding: '8px 12px' }}>{isRegister ? 'Registrieren' : 'Login'}</button>
          <button type="button" onClick={() => setIsRegister((v) => !v)} style={{ padding: '8px 12px' }}>
            {isRegister ? 'Zum Login' : 'Zur Registrierung'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthPage;
