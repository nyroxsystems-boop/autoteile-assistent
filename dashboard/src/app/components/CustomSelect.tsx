import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export function CustomSelect({ value, onChange, options, placeholder, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all flex items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2 flex-1 text-left">
          {selectedOption?.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
          <span>{selectedOption?.label || placeholder || 'Auswählen...'}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden opacity-100 animate-fadeIn">
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  {option.icon && (
                    <span className="flex-shrink-0">{option.icon}</span>
                  )}
                  <span className="flex-1 text-sm">{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}