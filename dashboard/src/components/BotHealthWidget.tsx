import { useEffect, useState } from 'react';
import Card from '../ui/Card';
import apiClient from '../lib/apiClient';

const isHealthy = (data: any) => {
  if (!data) return false;
  const status = (data.status ?? '').toString().toLowerCase();
  if (data.healthy === true) return true;
  return status === 'ok' || status === 'healthy';
};

const BotHealthWidget = () => {
  const [status, setStatus] = useState<string>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiClient.get('/api/bot/health');
        setStatus(isHealthy(data) ? 'healthy' : data?.status ?? 'unknown');
      } catch (err: any) {
        setError(err?.message ?? 'Fehler');
        setStatus('unknown');
      }
    };
    load();
  }, []);

  const good = status === 'healthy' || status === 'ok';

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: good ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)'
          }}
        />
        <div style={{ fontWeight: 700 }}>Bot Health</div>
        <div style={{ color: 'var(--muted)' }}>{error ? `Fehler: ${error}` : status}</div>
      </div>
    </Card>
  );
};

export default BotHealthWidget;
