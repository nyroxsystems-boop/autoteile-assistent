import { Check, ChevronsUpDown, Plus, Building2, Users } from 'lucide-react';
import { useState } from 'react';

export interface Account {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  company: string;
  avatar?: string;
  isActive: boolean;
}

interface AccountSwitcherProps {
  accounts: Account[];
  currentAccount: Account;
  onAccountSwitch: (accountId: string) => void;
  onAddAccount: () => void;
}

export function AccountSwitcher({
  accounts,
  currentAccount,
  onAccountSwitch,
  onAddAccount,
}: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const roleLabels = {
    owner: 'Inhaber',
    admin: 'Administrator',
    member: 'Mitarbeiter',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-3 group"
      >
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ring-2 ring-primary/20">
            {getInitials(currentAccount.name)}
          </div>

          {/* Account Info */}
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-foreground truncate leading-none mb-1">
              {currentAccount.name}
            </div>
            <div className="text-xs text-muted-foreground truncate leading-none">
              {currentAccount.company}
            </div>
          </div>
        </div>

        {/* Indicator */}
        <ChevronsUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={2} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl py-2 z-50 max-h-[400px] overflow-y-auto">
            {/* Current Company Section */}
            <div className="px-3 py-1.5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Dein Team
              </div>
            </div>

            {/* Accounts List */}
            <div className="py-1">
              {accounts
                .filter((account) => account.company === currentAccount.company)
                .map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      onAccountSwitch(account.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-3 group ${
                      account.id === currentAccount.id ? 'bg-accent/50' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                        account.id === currentAccount.id
                          ? 'bg-gradient-to-br from-primary to-primary/70 text-white ring-2 ring-primary/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {getInitials(account.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-foreground truncate">
                          {account.name}
                        </div>
                        {account.id === currentAccount.id && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded text-xs font-medium text-primary flex-shrink-0">
                            <Check className="w-3 h-3" strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {account.email} · {roleLabels[account.role]}
                      </div>
                    </div>
                  </button>
                ))}
            </div>

            {/* Other Accounts */}
            {accounts.some((acc) => acc.company !== currentAccount.company) && (
              <>
                <div className="border-t border-border my-2"></div>
                <div className="px-3 py-1.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Andere Unternehmen
                  </div>
                </div>
                <div className="py-1">
                  {accounts
                    .filter((account) => account.company !== currentAccount.company)
                    .map((account) => (
                      <button
                        key={account.id}
                        onClick={() => {
                          onAccountSwitch(account.id);
                          setIsOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm flex-shrink-0">
                          {getInitials(account.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {account.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {account.company}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </>
            )}

            {/* Actions */}
            <div className="border-t border-border mt-2 pt-2">
              <button
                onClick={() => {
                  onAddAccount();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors flex-shrink-0">
                  <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary" strokeWidth={2} />
                </div>
                <div>
                  <div className="font-medium text-foreground">Account hinzufügen</div>
                  <div className="text-xs text-muted-foreground">
                    Weiteres Unternehmen verwalten
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
