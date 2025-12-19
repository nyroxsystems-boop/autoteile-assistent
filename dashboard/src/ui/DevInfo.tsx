import { useState } from 'react';
import { wawiService } from '../services/wawi';

const DevInfo = () => {
  const [status, setStatus] = useState<string | null>(null);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const tokenSet = Boolean(import.meta.env.VITE_WAWI_API_TOKEN);

  const test = async () => {
    try {
      const health = await wawiService.health();
      const me = await wawiService.getMe();
      setStatus(`OK · health: ${health?.status ?? 'ok'} · user: ${me?.username ?? 'unknown'}`);
    } catch (err) {
      setStatus('Fehler beim Test: ' + ((err as any)?.message ?? 'unknown'));
    }
  };

  return (
    <div
      style={{
        border: '1px dashed var(--border)',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
        background: 'rgba(255,255,255,0.02)',
        fontSize: 13
      }}
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>VITE_API_BASE_URL: {baseUrl || 'nicht gesetzt'}</div>
        <div>VITE_WAWI_API_TOKEN: {tokenSet ? 'gesetzt' : 'nicht gesetzt'}</div>
        <button
          onClick={test}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}
        >
          Test Connection
        </button>
        {status ? <div style={{ color: 'var(--muted)' }}>{status}</div> : null}
      </div>
    </div>
  );
};

export default DevInfo;
