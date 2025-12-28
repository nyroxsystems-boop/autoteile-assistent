import { X } from 'lucide-react';

interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  if (!open) return null;

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { key: '1', description: 'Heute' },
        { key: '2', description: 'Kunden & Anfragen' },
        { key: '3', description: 'Angebote' },
        { key: '4', description: 'Aufträge' },
        { key: '5', description: 'Preisprofile' },
        { key: '6', description: 'Belege & Rechnungen' },
        { key: '7', description: 'Lieferanten' },
        { key: '8', description: 'Status & Analytics' },
        { key: '9', description: 'Warenwirtschaft' },
      ],
    },
    {
      category: 'Schnellaktionen',
      items: [
        { key: 'C', description: 'Neuen Kunden anlegen' },
        { key: 'A', description: 'Neues Angebot erstellen' },
        { key: '⌘K', description: 'Command Palette öffnen' },
        { key: '⌘,', description: 'Einstellungen öffnen' },
      ],
    },
    {
      category: 'Allgemein',
      items: [
        { key: 'ESC', description: 'Panel/Dialog schließen' },
        { key: '?', description: 'Diese Übersicht anzeigen' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground text-xl">Keyboard Shortcuts</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Nutze diese Shortcuts für maximale Effizienz
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="font-medium text-foreground mb-4">{section.category}</h3>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.description}</span>
                    <kbd className="px-3 py-1.5 text-sm font-medium text-foreground bg-muted rounded border border-border font-mono">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
}
