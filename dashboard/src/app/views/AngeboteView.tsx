
import { useState, useMemo, useEffect } from 'react';
import { Search, Package, Clock, CheckCircle2, XCircle, FileText, Plus, Loader2 } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { getOrderOffers, Offer } from '../api/wws';

export function AngeboteView() {
  const { orders, loading, refresh } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [orderOffers, setOrderOffers] = useState<Record<string, Offer[]>>({});

  useEffect(() => {
    // Fetch offers for each order
    if (Array.isArray(orders)) {
      orders.forEach(async (order) => {
        if (order && order.id && !orderOffers[order.id]) {
          try {
            const offers = await getOrderOffers(order.id);
            setOrderOffers(prev => ({ ...prev, [order.id]: offers }));
          } catch (e) {
            console.error('Failed to fetch offers for order', order.id);
          }
        }
      });
    }
  }, [orders]); // orderOffers dependency removed to avoid loops, but logic is slightly fragile. 
  // Better: We should probably just let refresh() allow the effect to re-run if orders change?
  // Actually, if we call refresh(), `orders` will update. Then this effect runs again.
  // We need to ensure we don't fetch if we already have them? 
  // The current logic `!orderOffers[order.id]` handles that.

  // ... (keeping the rest as is, just need to target the top lines and the button click)

  const mappedQuotes = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.map(order => ({
      id: order.id,
      customerName: order.customerPhone || 'Unbekannt',
      whatsappNumber: order.customerPhone || '',
      oemNumber: order.oem_number || order.part?.oemNumber || '',
      partName: order.part?.partText || 'Kfz-Teil',
      timestamp: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
      status: (order.status === 'new' ? 'offers_ready' : order.status === 'collect_part' ? 'selected' : order.status === 'done' ? 'confirmed' : 'rejected') as any,
      options: (orderOffers[order.id] || []).map((off, idx) => ({
        id: off.id.toString(),
        label: String.fromCharCode(65 + idx) as 'A' | 'B' | 'C',
        supplier: off.shopName || off.supplierName || 'Lieferant',
        price: off.basePrice || 0,
        deliveryTime: off.deliveryTimeDays ? `${off.deliveryTimeDays} Tage` : '1-3 Tage',
        stock: 'Auf Lager',
        quality: 'Original/OEM'
      }))
    }));
  }, [orders, orderOffers]);
  const filteredQuotes = useMemo(() => {
    return mappedQuotes.filter(quote => {
      const matchesSearch = quote.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quote.oemNumber.includes(searchQuery) ||
        quote.partName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = !activeFilter || quote.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [mappedQuotes, searchQuery, activeFilter]);

  const stats = useMemo(() => ({
    offers_ready: mappedQuotes.filter(q => q.status === 'offers_ready').length,
    selected: mappedQuotes.filter(q => q.status === 'selected').length,
    confirmed: mappedQuotes.filter(q => q.status === 'confirmed').length,
    rejected: mappedQuotes.filter(q => q.status === 'rejected').length,
  }), [mappedQuotes]);

  if (loading) return (
    <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin" />
      Lade Angebote...
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground mb-2">Angebote</h1>
          <p className="text-muted-foreground">
            OEM-basierte Angebote erstellen und an Kunden senden
          </p>
        </div>
        <button
          onClick={async () => {
            // Quick test: Create offer for first order
            if (orders.length > 0) {
              const orderId = orders[0].id;
              try {
                const { createOffer } = await import('../api/wws');
                await createOffer(orderId, { price: '150.00', supplierName: 'Test Supplier' });
                alert('Test Offer Created for Order ' + orderId);
                // Trigger refresh or state update here if needed
                refresh();
              } catch (e) {
                alert('Failed to create offer');
              }
            } else {
              alert('No orders available to create offer for');
            }
          }}
          className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Neues Angebot
        </button>
      </div>

      {/* KPI Cards */}
      < div className="grid grid-cols-4 gap-6" >
        <div
          onClick={() => setActiveFilter(activeFilter === 'offers_ready' ? null : 'offers_ready')}
          className={`group p-4 rounded-xl border transition-all cursor-pointer ${activeFilter === 'offers_ready' ? 'border-amber-500 bg-amber-500/10' : 'border-border bg-card'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs font-bold text-green-600">+18%</div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase">Angebote bereit</div>
          <div className="text-3xl font-bold text-amber-600">{stats.offers_ready}</div>
        </div>

        <div
          onClick={() => setActiveFilter(activeFilter === 'selected' ? null : 'selected')}
          className={`group p-4 rounded-xl border transition-all cursor-pointer ${activeFilter === 'selected' ? 'border-blue-500 bg-blue-500/10' : 'border-border bg-card'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs font-bold text-green-600">+22%</div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase">Ausgewählt</div>
          <div className="text-3xl font-bold text-blue-600">{stats.selected}</div>
        </div>

        <div
          onClick={() => setActiveFilter(activeFilter === 'confirmed' ? null : 'confirmed')}
          className={`group p-4 rounded-xl border transition-all cursor-pointer ${activeFilter === 'confirmed' ? 'border-green-500 bg-green-500/10' : 'border-border bg-card'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs font-bold text-green-600">+15%</div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase">Bestätigt</div>
          <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
        </div>

        <div
          onClick={() => setActiveFilter(activeFilter === 'rejected' ? null : 'rejected')}
          className={`group p-4 rounded-xl border transition-all cursor-pointer ${activeFilter === 'rejected' ? 'border-slate-500 bg-slate-500/10' : 'border-border bg-card'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-500 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase">Abgelehnt</div>
          <div className="text-3xl font-bold text-slate-600">{stats.rejected}</div>
        </div>
      </div >

      {/* Toolbar */}
      < div className="flex items-center gap-3" >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Kunde, OEM oder Teil suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div >

      {/* List */}
      < div className="space-y-4" >
        {
          filteredQuotes.map((quote) => (
            <div key={quote.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{quote.customerName}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${quote.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                      quote.status === 'selected' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                        quote.status === 'offers_ready' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          'bg-slate-500/10 text-slate-600 border-slate-500/20'
                      }`}>
                      {quote.status === 'confirmed' ? '✓ Bestätigt' :
                        quote.status === 'selected' ? '⏱ Ausgewählt' :
                          quote.status === 'offers_ready' ? '📋 Angebote bereit' :
                            '✕ Abgelehnt'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono">{quote.oemNumber}</span>
                    <span>•</span>
                    <span>{quote.partName}</span>
                    <span>•</span>
                    <span>{quote.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {quote.options.map((option) => (
                  <div key={option.id} className="p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                        {option.label}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">{option.supplier}</div>
                      <div className="text-2xl font-semibold text-foreground">€ {option.price.toFixed(2)}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{option.deliveryTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {quote.options.length === 0 && (
                  <div className="col-span-3 py-4 text-center text-sm text-muted-foreground italic">
                    Keine Angebote hinterlegt
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div >
    </div >
  );
}