import { X, Phone, MapPin, Building2, FileText, MessageSquare, User } from 'lucide-react';
import { StatusChip } from './StatusChip';

interface Message {
  id: string;
  sender: 'customer' | 'bot' | 'agent';
  text: string;
  timestamp: string;
  oemNumbers?: string[];
}

interface Address {
  street: string;
  zip: string;
  city: string;
}

interface CustomerProfile {
  id: string;
  customerName: string;
  whatsappNumber: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  customerType?: 'werkstatt' | 'endkunde' | 'partner';
  shippingAddress?: Address;
  billingAddress?: Address;
  deliveryMethod?: 'lieferung' | 'abholung';
  invoiceRequired?: boolean;
  vatId?: string;
  poReference?: string;
  status: 'new' | 'in_progress' | 'quoted' | 'confirmed' | 'oem_pending';
  messages: Message[];
  totalOrders: number;
  totalRevenue: string;
}

interface CustomerDetailPanelProps {
  customer: CustomerProfile;
  onClose: () => void;
  onCreateQuote: () => void;
}

export function CustomerDetailPanel({ customer, onClose, onCreateQuote }: CustomerDetailPanelProps) {
  return (
    <div className="fixed right-0 top-0 h-screen w-[480px] bg-card border-l border-border shadow-2xl flex flex-col z-40">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-border">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-semibold text-foreground">{customer.customerName}</h2>
            <StatusChip status={customer.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
            <span>{customer.whatsappNumber}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Customer Profile */}
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <User className="w-4 h-4 text-primary" strokeWidth={2} />
            Kundenprofil
          </div>

          <div className="space-y-3">
            {customer.customerType && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1.5">Kundentyp</div>
                  <div className="flex gap-2">
                    {(['werkstatt', 'partner', 'endkunde'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => console.log('Update customer type:', type)}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          customer.customerType === type
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        }`}
                      >
                        {type === 'werkstatt' ? '🔧 Werkstatt' : type === 'partner' ? '🤝 Partner' : '👤 Endkunde'}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">
                    Bestimmt Preisgruppe und Konditionen
                  </div>
                </div>
              </div>
            )}

            {!customer.customerType && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600">⚠️</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-amber-900 mb-1">Kundentyp nicht gesetzt</div>
                    <div className="text-xs text-amber-700 mb-3">
                      Für korrekte Preise bitte Kundentyp auswählen
                    </div>
                    <div className="flex gap-2">
                      {(['werkstatt', 'partner', 'endkunde'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => console.log('Set customer type:', type)}
                          className="flex-1 px-3 py-2 rounded-lg border-2 border-amber-500/30 bg-white text-sm font-medium text-foreground hover:border-amber-500 hover:bg-amber-500/5 transition-all"
                        >
                          {type === 'werkstatt' ? '🔧 Werkstatt' : type === 'partner' ? '🤝 Partner' : '👤 Endkunde'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {customer.contactPerson && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">Ansprechpartner</div>
                  <div className="text-sm text-foreground">{customer.contactPerson}</div>
                </div>
              </div>
            )}

            {customer.phone && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">Telefon</div>
                  <div className="text-sm text-foreground">{customer.phone}</div>
                </div>
              </div>
            )}

            {customer.email && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">E-Mail</div>
                  <div className="text-sm text-foreground">{customer.email}</div>
                </div>
              </div>
            )}

            {customer.shippingAddress && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">
                    {customer.deliveryMethod === 'abholung' ? 'Adresse (Abholung)' : 'Lieferadresse'}
                  </div>
                  <div className="text-sm text-foreground">
                    {customer.shippingAddress.street}<br />
                    {customer.shippingAddress.zip} {customer.shippingAddress.city}
                  </div>
                  {customer.deliveryMethod === 'abholung' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 mt-1.5">
                      🚶 Abholung
                    </span>
                  )}
                </div>
              </div>
            )}

            {customer.billingAddress && customer.invoiceRequired && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">Rechnungsadresse</div>
                  <div className="text-sm text-foreground">
                    {customer.billingAddress.street}<br />
                    {customer.billingAddress.zip} {customer.billingAddress.city}
                  </div>
                </div>
              </div>
            )}

            {customer.vatId && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">USt-IdNr.</div>
                  <div className="text-sm text-foreground font-mono">{customer.vatId}</div>
                </div>
              </div>
            )}

            {customer.poReference && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">PO-Referenz</div>
                  <div className="text-sm text-foreground font-mono">{customer.poReference}</div>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Aufträge gesamt</div>
              <div className="font-semibold text-foreground tabular-nums">{customer.totalOrders}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Umsatz</div>
              <div className="font-semibold text-foreground tabular-nums">{customer.totalRevenue}</div>
            </div>
          </div>
        </div>

        {/* WhatsApp Chat History */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquare className="w-4 h-4 text-primary" strokeWidth={2} />
              WhatsApp-Verlauf
            </div>
            <button
              onClick={() => {
                const phoneNumber = customer.whatsappNumber.replace(/\s/g, '').replace(/\+/g, '');
                window.open(`https://wa.me/${phoneNumber}`, '_blank');
              }}
              className="text-xs text-[#25D366] hover:text-[#1fb855] font-medium flex items-center gap-1 transition-colors"
            >
              <MessageSquare className="w-3 h-3" strokeWidth={2} />
              Chat öffnen
            </button>
          </div>

          <div className="space-y-3">
            {customer.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.sender === 'customer'
                      ? 'bg-muted border border-border'
                      : message.sender === 'bot'
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-accent border border-border'
                  }`}
                >
                  <div className="text-sm text-foreground mb-1">{message.text}</div>
                  {message.oemNumbers && message.oemNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {message.oemNumbers.map((oem, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-background border border-border text-foreground"
                        >
                          {oem}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1.5">{message.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-border bg-muted/30 space-y-3">
        {customer.status === 'oem_pending' && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
            <div className="flex items-start gap-2">
              <span className="text-red-600 text-lg">⚠️</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-red-900 mb-1">OEM-Nummer prüfen erforderlich</div>
                <div className="text-xs text-red-700">
                  Der Kunde hat ein Foto gesendet oder die OEM-Nummer konnte nicht automatisch erkannt werden. Bitte prüfen Sie das Teil und erstellen Sie manuell ein Angebot.
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* WhatsApp Button - especially important for oem_pending */}
        <button
          onClick={() => {
            const phoneNumber = customer.whatsappNumber.replace(/\s/g, '').replace(/\+/g, '');
            const message = customer.status === 'oem_pending' 
              ? 'Hallo! Ich schaue mir gerade deine Anfrage an. Kannst du mir bitte die OEM-Nummer vom Teil nochmal schicken? Das geht am schnellsten.'
              : 'Hallo! Ich habe eine Frage zu deiner Anfrage.';
            window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] text-white hover:bg-[#1fb855] transition-colors font-medium"
        >
          <MessageSquare className="w-4 h-4" strokeWidth={2} />
          {customer.status === 'oem_pending' ? 'WhatsApp: OEM nachfragen' : 'WhatsApp öffnen'}
        </button>

        <button
          onClick={onCreateQuote}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium ${
            customer.status === 'oem_pending'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <FileText className="w-4 h-4" strokeWidth={2} />
          {customer.status === 'oem_pending' ? 'OEM prüfen & Angebot erstellen' : 'Angebot erstellen'}
        </button>
      </div>
    </div>
  );
}