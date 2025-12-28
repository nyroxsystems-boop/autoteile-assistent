import { useState, useMemo } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import { downloadInvoicePdf } from '../api/wws';
import { Search, Filter, Plus, FileText, Send, AlertTriangle, CheckCircle, FileEdit, TrendingUp, Loader2 } from 'lucide-react';
import { DocumentStatusCard } from '../components/DocumentStatusCard';
import { toast } from 'sonner';

export function DocumentsInvoicesView() {
  const { invoices, loading, error } = useInvoices();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const mappedInvoices = useMemo(() => {
    return invoices.map(inv => {
      let status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' = 'draft';

      if (inv.status === 'paid') status = 'paid';
      else if (inv.status === 'canceled') status = 'cancelled';
      else if (inv.status === 'issued') {
        const dueDate = new Date(inv.due_date);
        if (dueDate < new Date()) status = 'overdue';
        else status = 'sent';
      }

      return {
        id: inv.id,
        documentType: 'invoice' as const,
        documentNumber: inv.invoice_number || `#${inv.id}`,
        customerName: inv.contact?.name || 'Unbekannter Kunde',
        amount: `${parseFloat(inv.total).toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${inv.currency}`,
        rawAmount: parseFloat(inv.total),
        status,
        date: new Date(inv.issue_date).toLocaleDateString('de-DE'),
      };
    });
  }, [invoices]);

  const filteredDocuments = useMemo(() => {
    return mappedInvoices.filter(doc => {
      const matchesSearch = doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.customerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = !activeFilter || doc.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [mappedInvoices, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    const s = {
      draft: mappedInvoices.filter(d => d.status === 'draft').length,
      sent: mappedInvoices.filter(d => d.status === 'sent').length,
      overdue: mappedInvoices.filter(d => d.status === 'overdue').length,
      paid: mappedInvoices.filter(d => d.status === 'paid').length,
      totalPaidAmount: mappedInvoices.filter(d => d.status === 'paid').reduce((acc, curr) => acc + curr.rawAmount, 0),
      totalOverdueAmount: mappedInvoices.filter(d => d.status === 'overdue').reduce((acc, curr) => acc + curr.rawAmount, 0),
    };
    return s;
  }, [mappedInvoices]);

  const handleDownload = async (id: number) => {
    toast.promise(downloadInvoicePdf(id), {
      loading: 'PDF wird generiert...',
      success: 'Download gestartet',
      error: 'Fehler beim PDF-Export',
    });
  };

  if (loading) return <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4"><Loader2 className="w-8 h-8 animate-spin" /> Lade Rechnungen...</div>;
  if (error) return <div className="p-20 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground mb-2">Belege & Rechnungen</h1>
          <p className="text-muted-foreground">
            Kaufmännische Dokumente verwalten und Rechnungen erstellen
          </p>
        </div>
        <button className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Rechnung erstellen
        </button>
      </div>

      {/* Stats - Kompakt */}
      <div className="grid grid-cols-4 gap-6">
        {/* Entwürfe */}
        <div
          onClick={() => setActiveFilter(activeFilter === 'draft' ? null : 'draft')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-slate-500/10 via-slate-400/5 to-transparent border hover:border-slate-500/40 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden ${activeFilter === 'draft' ? 'border-slate-500/60 ring-2 ring-slate-500/30 shadow-lg' : 'border-slate-500/20'}`}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <FileEdit className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">Entwürfe</div>
              <div className="text-3xl font-bold bg-gradient-to-br from-slate-700 to-slate-600 bg-clip-text text-transparent tabular-nums tracking-tight">
                {stats.draft}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Warte auf Versand
            </div>
          </div>
        </div>

        {/* Versendet */}
        <div
          onClick={() => setActiveFilter(activeFilter === 'sent' ? null : 'sent')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent border hover:border-blue-500/40 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden ${activeFilter === 'sent' ? 'border-blue-500/60 ring-2 ring-blue-500/30 shadow-lg' : 'border-blue-500/20'}`}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <Send className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <span className="text-xs font-bold text-blue-600">Offen</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">Versendet</div>
              <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent tabular-nums tracking-tight">
                {stats.sent}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Durchschnittlich 14 Tage
            </div>
          </div>
        </div>

        {/* Überfällig */}
        <div
          onClick={() => setActiveFilter(activeFilter === 'overdue' ? null : 'overdue')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-red-500/10 via-red-400/5 to-transparent border hover:border-red-500/40 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden ${activeFilter === 'overdue' ? 'border-red-500/60 ring-2 ring-red-500/30 shadow-lg' : 'border-red-500/20'}`}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="text-xs font-bold text-red-600">Aktion</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">Überfällig</div>
              <div className="text-3xl font-bold bg-gradient-to-br from-red-600 to-red-500 bg-clip-text text-transparent tabular-nums tracking-tight">
                {stats.overdue}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              €{stats.totalOverdueAmount.toLocaleString('de-DE')} ausstehend
            </div>
          </div>
        </div>

        {/* Bezahlt */}
        <div
          onClick={() => setActiveFilter(activeFilter === 'paid' ? null : 'paid')}
          className={`group relative p-4 rounded-xl bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent border hover:border-green-500/40 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden ${activeFilter === 'paid' ? 'border-green-500/60 ring-2 ring-green-500/30 shadow-lg' : 'border-green-500/20'}`}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                <TrendingUp className="w-3 h-3 text-green-600" strokeWidth={2.5} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">Bezahlt</div>
              <div className="text-3xl font-bold bg-gradient-to-br from-green-600 to-green-500 bg-clip-text text-transparent tabular-nums tracking-tight">
                {stats.paid}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              €{stats.totalPaidAmount.toLocaleString('de-DE')} Gesamt
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechnungsnummer oder Kunde suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            value={activeFilter || 'all'}
            onChange={(e) => setActiveFilter(e.target.value === 'all' ? null : e.target.value)}
            className="h-10 pl-10 pr-8 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
          >
            <option value="all">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="sent">Versendet</option>
            <option value="paid">Bezahlt</option>
            <option value="overdue">Überfällig</option>
            <option value="cancelled">Storniert</option>
          </select>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {filteredDocuments.map((doc) => (
          <DocumentStatusCard
            key={doc.id}
            documentType={doc.documentType}
            documentNumber={doc.documentNumber}
            customerName={doc.customerName}
            amount={doc.amount}
            status={doc.status}
            date={doc.date}
            onClick={() => handleDownload(doc.id)}
          />
        ))}
        {filteredDocuments.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="font-medium text-foreground mb-1">Keine Dokumente gefunden</div>
            <div className="text-sm text-muted-foreground">
              Versuchen Sie es mit anderen Suchbegriffen
            </div>
          </div>
        )}
      </div>

      {/* Finanzamt Notice */}
      <div className="mt-8 p-5 rounded-xl border border-[var(--status-success-border)] bg-[var(--status-success-bg)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--status-success)] flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-foreground mb-1">Finanzamt-Übermittlung</div>
            <div className="text-sm text-muted-foreground">
              Rechnungen werden automatisch an das Finanzamt übermittelt. Letzte Übermittlung: Heute, {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}