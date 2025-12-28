import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { StatusChip } from '../components/StatusChip';
import { Percent, DollarSign, TrendingUp, Edit2, Trash2, Plus, Loader2 } from 'lucide-react';
import { useMerchantSettings } from '../hooks/useMerchantSettings';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

export function PreisprofileView() {
  const { settings, loading, update: _update } = useMerchantSettings();
  const { summary, loading: _summaryLoading } = useDashboardSummary();
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (settings) {
      setProfiles(settings.priceProfiles || []);
    }
  }, [settings]);

  if (loading) return <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4"><Loader2 className="w-8 h-8 animate-spin" /> Lade Preisprofile...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1>Preise & Margen</h1>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              Preislogik steuern – Wirkung sehen, nicht Technik
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Preisgruppe anlegen
          </Button>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-foreground font-medium mb-1">Live-Wirkung auf WhatsApp-Preise</h4>
            <p className="text-muted-foreground leading-relaxed">
              Änderungen wirken sofort auf neue Angebote. Bestehende Angebote bleiben unverändert. Sie sehen hier die Wirkung, nicht die technische Formel.
            </p>
          </div>
        </div>
      </div>

      {/* Price Profiles Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Profilname
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Typ
                </th>
                <th className="text-right px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Wert
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Anwendung
                </th>
                <th className="text-left px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Zuletzt geändert
                </th>
                <th className="text-right px-6 py-4 text-muted-foreground uppercase tracking-wide" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map((profile) => (
                <tr
                  key={profile.id}
                  className="hover:bg-muted/30 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {profile.type === 'percentage' ? (
                          <Percent className="w-5 h-5 text-primary" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{profile.name}</div>
                        {profile.isDefault && (
                          <StatusChip
                            status="success"
                            label="Standard"
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="px-2.5 py-1 bg-muted rounded-md text-sm font-medium w-fit">
                      {profile.type === 'percentage' ? 'Prozentual' : 'Festpreis'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--status-success-bg)] text-[var(--status-success-fg)] rounded-lg border border-[var(--status-success-border)] font-semibold">
                      {profile.type === 'percentage' ? `${profile.value}%` : `€${profile.value}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground">{profile.appliesTo}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {profile.lastModified}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline">
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Bearbeiten
                      </Button>
                      {!profile.isDefault && (
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Margin Calculator */}
      <div>
        <h2 className="mb-5">Margen-Rechner</h2>
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block mb-3">Basispreis</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="pl-8 h-11"
                  defaultValue="100"
                />
              </div>
            </div>
            <div>
              <label className="block mb-3">Marge (%)</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0"
                  className="pr-8 h-11"
                  defaultValue="25"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
            </div>
            <div>
              <label className="block mb-3">Kundenpreis</label>
              <div className="h-11 px-4 bg-[var(--status-success-bg)] border border-[var(--status-success-border)] rounded-lg flex items-center">
                <span className="tabular-nums tracking-tight text-[var(--status-success-fg)]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  €125.00
                </span>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mt-5">
            Der Kundenpreis wird automatisch aus Basispreis und Marge berechnet und in WhatsApp-Angeboten verwendet.
          </p>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3>Durchschnittliche Marge</h3>
          </div>
          <div className="tabular-nums tracking-tight mb-2" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
            {summary?.avgMargin ? `${summary.avgMargin.toFixed(1)}%` : '---'}
          </div>
          <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
            Über alle veröffentlichten Angebote
          </p>
        </div>

        <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--status-success-bg)] flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[var(--status-success)]" />
            </div>
            <h3>Margen-Umsatz</h3>
          </div>
          <div className="tabular-nums tracking-tight mb-2" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
            €{summary?.marginRevenue ? summary.marginRevenue.toLocaleString('de-DE', { minimumFractionDigits: 0 }) : '---'}
          </div>
          <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
            Geschätzte Marge aus bezahlten Rechnungen
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
        <p className="text-muted-foreground leading-relaxed">
          Preisprofile werden in der Reihenfolge ihrer Spezifität angewendet. Spezifischere Profile (z.B. "OEM &gt; €200") haben Vorrang vor allgemeinen Profilen.
        </p>
      </div>
    </div>
  );
}