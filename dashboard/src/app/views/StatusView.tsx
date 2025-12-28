
import { useState, useEffect } from 'react';
import { MessageSquare, Activity, Check, FileText, Warehouse, Loader2, AlertCircle } from 'lucide-react';
import { getBotHealth, getDashboardSummary } from '../api/wws';

export function StatusView() {
  const [botOnline, setBotOnline] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('N/A');

  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      try {
        const bot = await getBotHealth();
        setBotOnline(bot.status === 'ok');

        const summary = await getDashboardSummary();
        setApiOnline(true);
        setLastSync(new Date(summary.lastSync).toLocaleString());
      } catch (err) {
        setBotOnline(false);
        setApiOnline(false);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  const components = [
    {
      id: 1,
      name: 'WhatsApp Bot',
      icon: MessageSquare,
      status: botOnline ? 'online' : 'offline',
      lastUpdate: botOnline ? 'Gerade eben' : 'Unbekannt',
      description: 'Empfängt und verarbeitet Kundenanfragen via Twilio/WhatsApp-API',
    },
    {
      id: 2,
      name: 'WWS-Backend (InvenTree)',
      icon: Warehouse,
      status: apiOnline ? 'online' : 'offline',
      lastUpdate: lastSync,
      description: 'Zentrale Datenbank für Teile, Bestände und Bestellungen',
    },
    {
      id: 3,
      name: 'Dashboard API',
      icon: Activity,
      status: apiOnline ? 'online' : 'offline',
      lastUpdate: 'Gerade eben',
      description: 'REST-Schnittstellen für das Front-End Dashboard',
    },
    {
      id: 4,
      name: 'Beleg-Service',
      icon: FileText,
      status: apiOnline ? 'online' : 'offline',
      lastUpdate: lastSync,
      description: 'Automatisierte PDF-Erzeugung für Angebote und Rechnungen',
    },
  ];

  if (loading) return (
    <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin" />
      Prüfe Systemstatus...
    </div>
  );

  const allOnline = botOnline && apiOnline;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground">System-Status</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Aktueller Zustand der Infrastruktur und Anbindungen
        </p>
      </div>

      {/* System Components */}
      <div className="grid grid-cols-1 gap-5">
        {components.map((system) => {
          const Icon = system.icon;
          const isOnline = system.status === 'online';

          return (
            <div
              key={system.id}
              className="bg-card border border-border rounded-xl p-6 hover:border-border-strong transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${isOnline
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                    }
                  `}>
                    <Icon className={`w-6 h-6 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground mb-1">{system.name}</div>
                    <p className="text-sm text-muted-foreground">
                      {system.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Letzte Aktualisierung: {system.lastUpdate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`
                    w-2.5 h-2.5 rounded-full
                    ${isOnline ? 'bg-green-500' : 'bg-red-500'}
                  `}
                    style={{
                      animation: isOnline ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                    }}
                  />
                  <span className={`text-xs font-bold uppercase ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                    {system.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health Summary */}
      <div className={`
        ${allOnline ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}
        border rounded-xl p-6
      `}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${allOnline ? 'bg-green-600' : 'bg-red-600'}`}>
            {allOnline ? <Check className="w-6 h-6 text-white" /> : <AlertCircle className="w-6 h-6 text-white" />}
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground mb-2">
              {allOnline ? 'Systeme laufen einwandfrei' : 'Eingeschränkte Funktionalität'}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {allOnline
                ? 'Alle kritischen Komponenten sind online. Der WhatsApp-Bot und das ERP-Backend sind synchronisiert.'
                : 'Ein oder mehrere Systeme sind zurzeit nicht erreichbar. Bitte prüfen Sie die Backend-Verbindung.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}