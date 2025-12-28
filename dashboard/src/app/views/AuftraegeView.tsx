
import { useState, useEffect } from 'react';
import { StatusChip } from '../components/StatusChip';
import { OrderTimeline } from '../components/OrderTimeline';
import { Button } from '../components/ui/button';
import { Car, MessageSquare, User, Truck, Clock, Download, AlertCircle } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { getOrderOffers, publishOffers, createInvoice, Offer, Order } from '../api/wws';
import { toast } from 'sonner';

export function AuftraegeView() {
  const { orders, loading, error, refresh } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  useEffect(() => {
    if (selectedOrder) {
      setSelectedOrderId(selectedOrder.id);
      loadOffers(selectedOrder.id);
    }
  }, [selectedOrder?.id]);

  const loadOffers = async (id: number) => {
    setOffersLoading(true);
    try {
      const data = await getOrderOffers(id);
      setOffers(data);
    } catch (err) {
      console.error('Failed to load offers', err);
    } finally {
      setOffersLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedOrderId) return;
    try {
      // For now, publish all draft offers or first 3
      const ids = offers.filter(o => o.status === 'draft').map(o => o.id);
      if (ids.length === 0) {
        toast.error('Keine neuen Angebote zum Veröffentlichen');
        return;
      }
      await publishOffers(selectedOrderId, ids);
      toast.success('Angebote an Kunden gesendet');
      loadOffers(selectedOrderId);
    } catch (err) {
      toast.error('Fehler beim Senden');
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrderId) return;
    try {
      await createInvoice(selectedOrderId);
      toast.success('Entwurf für Rechnung erstellt');
      refresh(); // update status
    } catch (err) {
      toast.error('Fehler beim Erstellen der Rechnung');
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground font-medium bg-card/30 rounded-2xl border border-dashed border-border py-20">Lade Aufträge...</div>;
  if (error) return <div className="p-8 text-center text-error bg-error/5 rounded-2xl border border-error/20 py-20 flex flex-col items-center gap-3"><AlertCircle className="w-8 h-8" /> <span>{error}</span></div>;

  const timelineSteps = (order: Order) => [
    { label: 'Anfrage empfangen', completed: true },
    { label: 'OEM geprüft', completed: !!order.oem },
    { label: 'Angebote eingeholt', completed: offers.length > 0 },
    { label: 'Kunde wartet', completed: order.status === 'collect_part', current: order.status === 'collect_part' },
    { label: 'Auftrag bestätigt', completed: order.status === 'done' },
    { label: 'Beleg erstellt', completed: order.status === 'invoiced' },
  ];

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      {/* Order List - Left Side */}
      <div className="col-span-5 space-y-6 overflow-y-auto pr-2">
        <div>
          <h1>Aufträge</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            Echte Daten aus dem WAWI-Backend (InvenTree)
          </p>
        </div>

        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className={`
                w-full p-5 rounded-xl border transition-all duration-200 text-left
                ${selectedOrderId === order.id
                  ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="font-medium">{order.contact?.name || 'Unbekannter Kunde'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Car className="w-3.5 h-3.5" />
                    <span>{order.vehicle_json?.make} {order.vehicle_json?.model}</span>
                  </div>
                </div>
                <StatusChip status={mapStatus(order.status).variant as any} label={mapStatus(order.status).label} size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <code className="px-2.5 py-1 bg-muted rounded-md text-xs font-mono font-medium">
                  {order.oem || 'Keine OEM'}
                </code>
                <span className="text-muted-foreground text-sm truncate">
                  {order.part_json?.rawText || 'Teil unbekannt'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Order Details - Right Side */}
      <div className="col-span-7 bg-card border border-border rounded-xl p-8 overflow-y-auto shadow-sm">
        {selectedOrder ? (
          <div className="space-y-10">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2>{selectedOrder.contact?.name || 'Auftragsdetails'}</h2>
                <StatusChip status={mapStatus(selectedOrder.status).variant as any} label={mapStatus(selectedOrder.status).label} />
              </div>
              <p className="text-muted-foreground">ID: {selectedOrder.external_ref || selectedOrder.id}</p>
            </div>

            <div className="space-y-5">
              <h3>Kontext</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">Ansprechpartner</div>
                    <div className="font-medium">{selectedOrder.contact?.name || '-'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">WhatsApp ID</div>
                    <div className="font-medium">{selectedOrder.contact?.wa_id || 'Keine'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Car className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">Fahrzeug</div>
                    <div className="font-medium">{selectedOrder.vehicle_json?.make} {selectedOrder.vehicle_json?.model} ({selectedOrder.vehicle_json?.year})</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <h3>Teile & OEM</h3>
              <div className="p-5 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-muted-foreground text-sm mb-2">OEM-Nummer</div>
                    <code className="px-3 py-1.5 bg-background border border-border rounded-md font-mono font-medium">
                      {selectedOrder.oem || 'NICHT GEFUNDEN'}
                    </code>
                  </div>
                  {selectedOrder.oem && (
                    <div className="px-3 py-1.5 bg-success/10 text-success rounded-md text-sm font-medium border border-success/20">
                      Geprüft
                    </div>
                  )}
                </div>
                <div className="mt-4 font-medium">{selectedOrder.part_json?.rawText}</div>
              </div>
            </div>

            <div className="space-y-5">
              <h3>Gefundene Angebote</h3>
              {offersLoading ? <div>Suche Angebote...</div> : (
                <div className="space-y-3">
                  {offers.length === 0 ? <div className="p-4 border border-dashed rounded-lg text-muted-foreground italic">Noch keine Angebote hinterlegt.</div> :
                    offers.map((offer) => (
                      <div key={offer.id} className="p-5 rounded-xl border border-border bg-background">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold">{offer.supplierName}</div>
                            <div className="text-sm text-muted-foreground">{offer.product_name}</div>
                          </div>
                          <StatusChip status={offer.status === 'published' ? 'success' : 'waiting'} label={offer.status === 'published' ? 'Gesendet' : 'Bereit'} size="sm" />
                        </div>
                        <div className="flex justify-between items-end mt-4">
                          <div className="text-sm text-muted-foreground">SKU: {offer.sku}</div>
                          <div className="text-2xl font-bold">€{parseFloat(offer.price).toFixed(2)}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            <div className="space-y-5">
              <h3>Fortschritt</h3>
              <OrderTimeline steps={timelineSteps(selectedOrder)} />
            </div>

            <div className="pt-6 border-t border-border flex gap-4">
              {selectedOrder.status === 'collect_part' ? (
                <Button size="lg" className="w-full" onClick={handlePublish}>
                  An Kunden senden
                </Button>
              ) : selectedOrder.status === 'done' ? (
                <Button size="lg" variant="outline" className="w-full" onClick={handleCreateInvoice}>
                  Beleg / Rechnung erstellen
                </Button>
              ) : (
                <Button size="lg" variant="ghost" className="w-full" disabled>
                  Keine Aktion möglich
                </Button>
              )}
            </div>
          </div>
        ) : <div className="h-full flex items-center justify-center text-muted-foreground italic">Wähle einen Auftrag aus</div>}
      </div>
    </div>
  );
}

function mapStatus(raw: string) {
  switch (raw) {
    case 'collect_part': return { variant: 'waiting', label: 'Wartet auf Teile' };
    case 'lookup_oem': return { variant: 'processing', label: 'OEM Suche' };
    case 'done': return { variant: 'success', label: 'Abgeschlossen' };
    case 'invoiced': return { variant: 'success', label: 'Fakturiert' };
    default: return { variant: 'neutral', label: raw };
  }
}