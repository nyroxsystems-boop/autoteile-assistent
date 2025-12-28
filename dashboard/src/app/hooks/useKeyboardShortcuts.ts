import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onNavigate: (view: string) => void;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
}

export function useKeyboardShortcuts({
  onNavigate,
  onOpenCommandPalette,
  onOpenSettings,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Cmd+K even in inputs
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
          return;
        }
        return;
      }

      // Cmd/Ctrl + K - Command Palette (handled in CommandPalette)
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        return;
      }

      // Cmd/Ctrl + , - Settings
      if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenSettings();
        return;
      }

      // Number keys 1-8 for navigation
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            onNavigate('heute');
            break;
          case '2':
            e.preventDefault();
            onNavigate('kunden');
            break;
          case '3':
            e.preventDefault();
            onNavigate('angebote');
            break;
          case '4':
            e.preventDefault();
            onNavigate('auftraege');
            break;
          case '5':
            e.preventDefault();
            onNavigate('preise');
            break;
          case '6':
            e.preventDefault();
            onNavigate('belege');
            break;
          case '7':
            e.preventDefault();
            onNavigate('lieferanten');
            break;
          case '8':
            e.preventDefault();
            onNavigate('status');
            break;
          case '9':
            e.preventDefault();
            onNavigate('warenwirtschaft');
            break;
          case 'c':
            e.preventDefault();
            // Trigger create customer
            window.dispatchEvent(new CustomEvent('quick-action', { detail: 'create-customer' }));
            break;
          case 'a':
            e.preventDefault();
            // Trigger create quote
            window.dispatchEvent(new CustomEvent('quick-action', { detail: 'create-quote' }));
            break;
          case '?':
            e.preventDefault();
            // Show shortcuts overlay
            window.dispatchEvent(new CustomEvent('show-shortcuts'));
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, onOpenCommandPalette, onOpenSettings]);
}
