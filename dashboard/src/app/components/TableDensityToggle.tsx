import { List, AlignJustify, AlignLeft } from 'lucide-react';

export type TableDensity = 'compact' | 'normal' | 'comfortable';

interface TableDensityToggleProps {
  density: TableDensity;
  onDensityChange: (density: TableDensity) => void;
}

export function TableDensityToggle({ density, onDensityChange }: TableDensityToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <button
        onClick={() => onDensityChange('compact')}
        className={`px-3 py-1.5 rounded-md transition-all ${
          density === 'compact'
            ? 'bg-card shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Kompakt"
      >
        <List className="w-4 h-4" strokeWidth={1.5} />
      </button>
      <button
        onClick={() => onDensityChange('normal')}
        className={`px-3 py-1.5 rounded-md transition-all ${
          density === 'normal'
            ? 'bg-card shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Normal"
      >
        <AlignJustify className="w-4 h-4" strokeWidth={1.5} />
      </button>
      <button
        onClick={() => onDensityChange('comfortable')}
        className={`px-3 py-1.5 rounded-md transition-all ${
          density === 'comfortable'
            ? 'bg-card shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Komfortabel"
      >
        <AlignLeft className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

// Helper to get table row classes based on density
export function getTableDensityClasses(density: TableDensity) {
  switch (density) {
    case 'compact':
      return 'py-2';
    case 'comfortable':
      return 'py-4';
    default:
      return 'py-3';
  }
}
