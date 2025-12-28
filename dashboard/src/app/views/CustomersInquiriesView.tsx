
import { useState, useMemo } from 'react';
import { Search, Plus, MessageSquare, Clock, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { CustomerThreadRow } from '../components/CustomerThreadRow';
import { CustomerDetailPanel } from '../components/CustomerDetailPanel';
import { TableDensityToggle, getTableDensityClasses, type TableDensity } from '../components/TableDensityToggle';
import { useConversations } from '../hooks/useConversations';

interface CustomersInquiriesViewProps {
  onNavigate: (view: string) => void;
}

export function CustomersInquiriesView({ onNavigate: _onNavigate }: CustomersInquiriesViewProps) {
  const { conversations, loading } = useConversations();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const mappedCustomers = useMemo(() => {
    return conversations.map((conv: any) => ({
      id: conv.id,
      customerName: conv.contact?.name || conv.contact?.wa_id || 'Unbekannt',
      lastMessage: conv.state_json?.last_text || 'Keine Nachricht',
      oemNumbers: (conv.state_json?.oem_list || []) as string[],
      status: (conv.state_json?.status || 'new') as 'new' | 'in_progress' | 'quoted' | 'confirmed' | 'oem_pending',
      timestamp: conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : 'N/A',
      whatsappNumber: conv.contact?.wa_id || '',
      email: '',
      phone: '',
      contactPerson: conv.contact?.name || '',
      customerType: 'werkstatt' as const,
      messages: (conv.state_json?.history || []).map((h: any, i: number) => ({
        id: `m-${i}`,
        sender: h.sender === 'user' ? 'customer' : 'bot',
        text: h.text,
        timestamp: h.timestamp || ''
      })),
      totalOrders: 0,
      totalRevenue: '€ 0',
      shippingAddress: { street: '', zip: '', city: '' },
      billingAddress: { street: '', zip: '', city: '' },
      deliveryMethod: 'lieferung' as const,
      invoiceRequired: false
    }));
  }, [conversations]);

  const selectedCustomer = useMemo(() => mappedCustomers.find(c => c.id === selectedCustomerId), [mappedCustomers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    return mappedCustomers.filter(customer => {
      const matchesSearch = customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.oemNumbers.some(oem => oem.includes(searchTerm));

      const matchesFilter = !activeFilter || customer.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [mappedCustomers, searchTerm, activeFilter]);

  const stats = useMemo(() => ({
    new: mappedCustomers.filter(c => c.status === 'new').length,
    in_progress: mappedCustomers.filter(c => c.status === 'in_progress').length,
    quoted: mappedCustomers.filter(c => c.status === 'quoted').length,
    oem_pending: mappedCustomers.filter(c => c.status === 'oem_pending').length,
  }), [mappedCustomers]);

  const handleFilterClick = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  if (loading) {
    return (
      <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        Lade Anfragen...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground mb-2">Kunden & Anfragen</h1>
          <p className="text-muted-foreground">
            WhatsApp-Kundenthreads und OEM-Anfragen verwalten
          </p>
        </div>
        <button className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Neue Anfrage
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div
          onClick={() => handleFilterClick('new')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border hover:border-amber-500/40 backdrop-blur-xl transition-all cursor-pointer ${activeFilter === 'new' ? 'border-amber-500/60 ring-2 ring-amber-500/30' : 'border-amber-500/20'}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs font-bold text-green-600 px-2 py-0.5 rounded-full bg-green-500/10">+12%</div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground/80 uppercase">Neue Anfragen</div>
          <div className="text-3xl font-bold text-amber-600">{stats.new}</div>
        </div>

        <div
          onClick={() => handleFilterClick('in_progress')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent border hover:border-blue-500/40 backdrop-blur-xl transition-all cursor-pointer ${activeFilter === 'in_progress' ? 'border-blue-500/60 ring-2 ring-blue-500/30' : 'border-blue-500/20'}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs font-bold text-green-600 px-2 py-0.5 rounded-full bg-green-500/10">+8%</div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground/80 uppercase">In Bearbeitung</div>
          <div className="text-3xl font-bold text-blue-600">{stats.in_progress}</div>
        </div>

        <div
          onClick={() => handleFilterClick('quoted')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent border hover:border-green-500/40 backdrop-blur-xl transition-all cursor-pointer ${activeFilter === 'quoted' ? 'border-green-500/60 ring-2 ring-green-500/30' : 'border-green-500/20'}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs font-bold text-green-600 px-2 py-0.5 rounded-full bg-green-500/10">+15%</div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground/80 uppercase">Angebot gesendet</div>
          <div className="text-3xl font-bold text-green-600">{stats.quoted}</div>
        </div>

        <div
          onClick={() => handleFilterClick('oem_pending')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-red-500/10 via-red-400/5 to-transparent border hover:border-red-500/40 backdrop-blur-xl transition-all cursor-pointer ${activeFilter === 'oem_pending' ? 'border-red-500/60 ring-2 ring-red-500/30' : 'border-red-500/20'}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs font-bold text-red-600 px-2 py-0.5 rounded-full bg-red-500/10">⚠️</div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground/80 uppercase">OEM-Prüfung</div>
          <div className="text-3xl font-bold text-red-600">{stats.oem_pending}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Kunde, OEM oder Nachricht suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <TableDensityToggle
          density={density}
          onDensityChange={setDensity}
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredCustomers.map((customer) => (
          <CustomerThreadRow
            key={customer.id}
            customerName={customer.customerName}
            lastMessage={customer.lastMessage}
            oemNumbers={customer.oemNumbers}
            status={customer.status}
            timestamp={customer.timestamp}
            onClick={() => setSelectedCustomerId(customer.id)}
            className={getTableDensityClasses(density)}
          />
        ))}

        {filteredCustomers.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            Keine Anfragen gefunden
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedCustomerId && selectedCustomer && (
        <CustomerDetailPanel
          customer={selectedCustomer as any}
          onClose={() => setSelectedCustomerId(null)}
          onCreateQuote={() => {
            setSelectedCustomerId(null);
          }}
        />
      )}
    </div>
  );
}