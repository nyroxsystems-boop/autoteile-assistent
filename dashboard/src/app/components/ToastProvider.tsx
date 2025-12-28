import { Toaster } from 'sonner';

export function ToastProvider({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <Toaster
      theme={theme}
      position="top-right"
      expand={true}
      richColors
      closeButton
      toastOptions={{
        style: {
          background: theme === 'dark' ? '#111111' : '#ffffff',
          color: theme === 'dark' ? '#ededed' : '#111827',
          border: `1px solid ${theme === 'dark' ? '#262626' : '#e2e8f0'}`,
        },
        className: 'font-sans',
        duration: 4000,
      }}
    />
  );
}
