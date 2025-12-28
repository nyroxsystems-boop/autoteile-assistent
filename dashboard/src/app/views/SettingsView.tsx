import { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Users,
  Bell,
  Shield,
  CreditCard,
  Key,
  Mail,
  Phone,
  MapPin,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Crown,
  Headphones,
  MessageCircle,
  Clock,
  ExternalLink,
  FileText,
  Upload,
} from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { useMe } from '../hooks/useMe';
import { useTenants } from '../hooks/useTenants';
import { useMerchantSettings } from '../hooks/useMerchantSettings';
import { useBillingSettings } from '../hooks/useBillingSettings';
import { getTeam } from '../api/wws';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type SettingsTab = 'profile' | 'company' | 'team' | 'notifications' | 'security' | 'billing' | 'support' | 'invoice' | 'shops';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
  joinedDate: string;
  lastActive: string;
  permissions?: {
    customers: boolean;
    orders: boolean;
    quotes: boolean;
    pricing: boolean;
    documents: boolean;
    suppliers: boolean;
    team: boolean;
    settings: boolean;
    billing: boolean;
  };
}



export function SettingsView() {
  const { me, loading: meLoading } = useMe();
  const { tenants: _tenants, currentTenant, loading: tenantsLoading } = useTenants();
  const { settings: merchantSettings, update: updateMerchantSettings } = useMerchantSettings();
  const { settings: billingSettings, update: updateBillingSettings } = useBillingSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [_newMemberName, _setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const [selectedShops, setSelectedShops] = useState<string[]>(['eBay Motors', 'Mobile.de']);
  const [margin, setMargin] = useState(15);

  useEffect(() => {
    if (merchantSettings) {
      setSelectedShops(merchantSettings.selectedShops || []);
      setMargin(merchantSettings.marginPercent || 0);
    }
  }, [merchantSettings]);

  useEffect(() => {
    if (billingSettings) {
      setInvoiceTemplate(billingSettings.invoice_template || 'clean');
      setInvoiceColor(billingSettings.invoice_color || '#2563eb');
      setInvoiceFont(billingSettings.invoice_font || 'inter');
      setInvoiceLogoPosition(billingSettings.logo_position || 'left');
      setInvoiceNumberPosition(billingSettings.number_position || 'right');
      setInvoiceAddressLayout(billingSettings.address_layout || 'two-column');
      setInvoiceTableStyle(billingSettings.table_style || 'grid');
      setInvoiceAccentColor(billingSettings.accent_color || '#f3f4f6');
    }
  }, [billingSettings]);

  useEffect(() => {
    async function loadTeam() {
      try {
        const data = await getTeam();
        const mapped = data.map(m => ({
          id: m.id.toString(),
          name: `${m.first_name} ${m.last_name}`.trim() || m.username,
          email: m.email,
          role: m.role.toLowerCase() as any,
          avatar: '',
          status: m.is_active ? 'active' : 'inactive' as any,
          joinedDate: '-',
          lastActive: '-',
        }));
        setTeamMembers(mapped);
      } catch (err: any) {
        toast.error('Team konnte nicht geladen werden');
      }
    }
    if (activeTab === 'team') {
      loadTeam();
    }
  }, [activeTab]);

  const handleSaveMerchantSettings = async () => {
    await updateMerchantSettings({
      marginPercent: margin,
      selectedShops: selectedShops
    });
  };

  const handleSaveInvoiceDesign = async () => {
    await updateBillingSettings({
      invoice_template: invoiceTemplate,
      invoice_color: invoiceColor,
      invoice_font: invoiceFont,
      logo_position: invoiceLogoPosition,
      number_position: invoiceNumberPosition,
      address_layout: invoiceAddressLayout,
      table_style: invoiceTableStyle,
      accent_color: invoiceAccentColor,
    });
  };
  console.log('Merchant Settings Save Handler ready', handleSaveMerchantSettings);

  // Invoice Design State
  const [invoiceTemplate, setInvoiceTemplate] = useState('clean');
  const [invoiceColor, setInvoiceColor] = useState('#2563eb');
  const [invoiceFont, setInvoiceFont] = useState('inter');
  const [invoiceLogoPosition, setInvoiceLogoPosition] = useState('left');
  const [invoiceNumberPosition, setInvoiceNumberPosition] = useState('right');
  const [invoiceAddressLayout, setInvoiceAddressLayout] = useState('two-column');
  const [invoiceTableStyle, setInvoiceTableStyle] = useState('grid');
  const [invoiceAccentColor, setInvoiceAccentColor] = useState('#f3f4f6');

  const tabs: { id: SettingsTab; label: string; shortLabel: string; icon: any }[] = [
    { id: 'profile', label: 'Mein Profil', shortLabel: 'Profil', icon: User },
    { id: 'company', label: 'Unternehmen', shortLabel: 'Firma', icon: Building2 },
    { id: 'team', label: 'Team-Mitglieder', shortLabel: 'Team', icon: Users },
    { id: 'notifications', label: 'Benachrichtigungen', shortLabel: 'Alerts', icon: Bell },
    { id: 'security', label: 'Sicherheit', shortLabel: 'Sicher-\nheit', icon: Shield },
    { id: 'billing', label: 'Abrechnung', shortLabel: 'Billing', icon: CreditCard },
    { id: 'support', label: 'Support', shortLabel: 'Support', icon: Headphones },
    { id: 'invoice', label: 'Rechnungen', shortLabel: 'Design', icon: FileText },
  ];

  const roleLabels = {
    owner: 'Inhaber',
    admin: 'Administrator',
    member: 'Mitarbeiter',
  };

  const roleBadgeColors = {
    owner: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
    admin: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
    member: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white',
  };

  const statusConfig = {
    active: { label: 'Aktiv', color: 'text-green-600', bg: 'bg-green-500/10', icon: CheckCircle2 },
    pending: { label: 'Ausstehend', color: 'text-amber-600', bg: 'bg-amber-500/10', icon: Bell },
    inactive: { label: 'Inaktiv', color: 'text-slate-600', bg: 'bg-slate-500/10', icon: XCircle },
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (meLoading || tenantsLoading) return (
    <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-2">Einstellungen</h1>
        <p className="text-muted-foreground">
          Verwalte dein Profil, Team und Unternehmenseinstellungen
        </p>
      </div>

      <div className="flex gap-6">
        {/* Compact Sidebar - Like Global Sidebar */}
        <div className="w-20 flex-shrink-0">
          <div className="bg-card border border-border rounded-xl p-2 sticky top-24">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex flex-col items-center gap-1.5 py-4 rounded-lg transition-all duration-150 w-full ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    title={tab.label}
                  >
                    <Icon
                      className="w-5 h-5 transition-transform duration-150 group-hover:scale-105"
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <span className={`text-[0.625rem] font-medium text-center leading-tight px-1 whitespace-pre-line ${isActive ? 'text-primary' : ''}`}>
                      {tab.shortLabel}
                    </span>
                    {isActive && (
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Persönliche Informationen</h3>

                {/* Avatar Upload */}
                <div className="mb-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-primary/20">
                      MM
                    </div>
                    <div>
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                        Foto hochladen
                      </button>
                      <p className="text-xs text-muted-foreground mt-2">
                        JPG, PNG oder GIF. Max. 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Vorname
                    </label>
                    <input
                      type="text"
                      defaultValue={me?.user.first_name || ''}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nachname
                    </label>
                    <input
                      type="text"
                      defaultValue={me?.user.last_name || ''}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      E-Mail
                    </label>
                    <input
                      type="email"
                      defaultValue={me?.user.email || ''}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Telefon
                    </label>
                    <input
                      type="tel"
                      defaultValue={"+49 " + (me?.user.id || '171')}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Änderungen speichern
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Unternehmensdaten</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Firmenname
                    </label>
                    <input
                      type="text"
                      defaultValue={currentTenant?.tenant_name || ''}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Steuernummer
                      </label>
                      <input
                        type="text"
                        defaultValue="DE123456789"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Umsatzsteuer-ID
                      </label>
                      <input
                        type="text"
                        defaultValue="DE987654321"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Adresse
                    </label>
                    <input
                      type="text"
                      defaultValue="Musterstraße 123"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all mb-3"
                      placeholder="Straße und Hausnummer"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        defaultValue="12345"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="PLZ"
                      />
                      <input
                        type="text"
                        defaultValue="Berlin"
                        className="col-span-2 w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="Stadt"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Änderungen speichern
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Team Header */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-foreground font-medium mb-1">Team-Mitglieder</h3>
                    <p className="text-sm text-muted-foreground">
                      {teamMembers.filter((m) => m.status === 'active').length} aktive Mitglieder
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Mitglied einladen
                  </button>
                </div>

                {/* Team Members List */}
                <div className="space-y-3">
                  {teamMembers.map((member) => {
                    const StatusIcon = statusConfig[member.status].icon;
                    return (
                      <div
                        key={member.id}
                        className="p-4 bg-background border border-border rounded-lg hover:border-border-strong transition-all"
                      >
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold flex-shrink-0 ring-2 ring-primary/20">
                            {getInitials(member.name)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium text-foreground">{member.name}</div>
                              {member.role === 'owner' && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium">
                                  <Crown className="w-3 h-3" />
                                  {roleLabels[member.role]}
                                </div>
                              )}
                              {member.role !== 'owner' && (
                                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColors[member.role]}`}>
                                  {roleLabels[member.role]}
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Beigetreten: {member.joinedDate}</span>
                              <span>·</span>
                              <div className="flex items-center gap-1.5">
                                <StatusIcon className={`w-3 h-3 ${statusConfig[member.status].color}`} />
                                <span>{member.lastActive}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          {member.role !== 'owner' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingMember(member)}
                                className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors group"
                              >
                                <Edit2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                              </button>
                              <button className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors group">
                                <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-600" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Permissions Info */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-4">Berechtigungen</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground">Inhaber</div>
                      <div className="text-sm text-muted-foreground">
                        Vollzugriff auf alle Funktionen, Team-Verwaltung und Abrechnung
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground">Administrator</div>
                      <div className="text-sm text-muted-foreground">
                        Zugriff auf alle Funktionen außer Abrechnung und Account-Verwaltung
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-foreground">Mitarbeiter</div>
                      <div className="text-sm text-muted-foreground">
                        Zugriff auf Anfragen, Angebote und Aufträge. Keine Admin-Funktionen
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Passwort ändern</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      Aktuelles Passwort
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Neues Passwort
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Passwort bestätigen
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Passwort aktualisieren
                  </button>
                </div>
              </div>

              {/* Two-Factor Auth */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-2">Zwei-Faktor-Authentifizierung</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Erhöhe die Sicherheit deines Accounts mit 2FA
                </p>
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  2FA aktivieren
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">E-Mail Benachrichtigungen</h3>
                <div className="space-y-4">
                  {[
                    { id: 'new_inquiry', label: 'Neue Kundenanfragen', description: 'Bei neuen WhatsApp-Nachrichten' },
                    { id: 'quote_accepted', label: 'Angebot angenommen', description: 'Wenn ein Kunde ein Angebot bestätigt' },
                    { id: 'order_shipped', label: 'Bestellung versendet', description: 'Bei Versand durch Lieferanten' },
                    { id: 'invoice_paid', label: 'Rechnung bezahlt', description: 'Bei Zahlungseingang' },
                    { id: 'team_updates', label: 'Team-Updates', description: 'Neue Mitglieder und Änderungen' },
                  ].map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                      <div>
                        <div className="font-medium text-foreground">{notification.label}</div>
                        <div className="text-sm text-muted-foreground">{notification.description}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Aktueller Plan</h3>
                <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold text-foreground">Professional</div>
                      <div className="text-muted-foreground">Vollzugriff auf alle Features</div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-foreground">€500</div>
                      <div className="text-sm text-muted-foreground">pro Monat</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Nächste Abrechnung am 01.01.2025
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-4">Zahlungsmethode</h3>
                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">•••• •••• •••• 4242</div>
                      <div className="text-sm text-muted-foreground">Läuft ab 12/2025</div>
                    </div>
                  </div>
                  <button className="text-sm text-primary hover:underline">Ändern</button>
                </div>
              </div>
            </div>
          )}

          {/* Support Tab */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              {/* Account Manager */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-foreground font-medium">Ihr persönlicher Ansprechpartner</h3>
                </div>

                <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl">
                  <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-blue-500/20 flex-shrink-0">
                      SK
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="mb-4">
                        <div className="text-xl font-semibold text-foreground mb-1">Sarah Klein</div>
                        <div className="text-sm text-muted-foreground">Account Manager · Enterprise Sales</div>
                      </div>

                      {/* Contact Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href="mailto:sarah.klein@autoteile-dashboard.de"
                          className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                          <div className="text-left">
                            <div className="text-xs text-muted-foreground">E-Mail</div>
                            <div className="text-sm font-medium text-foreground">Nachricht senden</div>
                          </div>
                        </a>

                        <a
                          href="tel:+4930123456789"
                          className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <Phone className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                          <div className="text-left">
                            <div className="text-xs text-muted-foreground">Telefon</div>
                            <div className="text-sm font-medium text-foreground">+49 30 123 456 789</div>
                          </div>
                        </a>
                      </div>

                      {/* Availability */}
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-muted-foreground">Verfügbar</span>
                        </div>
                        <span className="text-muted-foreground">·</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Mo-Fr 09:00-17:00 Uhr</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Resources */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Support-Ressourcen</h3>
                <div className="space-y-3">
                  <a
                    href="#"
                    className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-border-strong transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Headphones className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Technischer Support</div>
                        <div className="text-sm text-muted-foreground">24/7 Support bei technischen Problemen</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </a>

                  <a
                    href="#"
                    className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-border-strong transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Live Chat</div>
                        <div className="text-sm text-muted-foreground">Schnelle Antworten im Chat</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </a>

                  <a
                    href="#"
                    className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-border-strong transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Wissensdatenbank</div>
                        <div className="text-sm text-muted-foreground">Tutorials, FAQs und Anleitungen</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </a>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-foreground font-medium mb-6">Service Level</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="text-2xl font-bold text-foreground mb-1">&lt; 2h</div>
                    <div className="text-sm text-muted-foreground">Durchschn. Antwortzeit</div>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="text-2xl font-bold text-foreground mb-1">99.9%</div>
                    <div className="text-sm text-muted-foreground">Verfügbarkeit</div>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="text-2xl font-bold text-foreground mb-1">4.9/5</div>
                    <div className="text-sm text-muted-foreground">Kundenzufriedenheit</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Tab - Rechnungsdesign Builder */}
          {activeTab === 'invoice' && (
            <div className="grid grid-cols-5 gap-6">
              {/* Left: Controls */}
              <div className="col-span-2 space-y-6">
                {/* Template Selection */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-foreground font-medium mb-4">Rechnungsdesign</h3>

                  {/* Template */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-3">Vorlage</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['clean', 'classic', 'modern'].map((template) => (
                        <button
                          key={template}
                          onClick={() => setInvoiceTemplate(template)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${invoiceTemplate === template
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-border-strong'
                            }`}
                        >
                          <div className="text-xs font-medium text-foreground capitalize">{template}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-3">Logo</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <div className="text-sm text-foreground font-medium">Logo hochladen</div>
                      <div className="text-xs text-muted-foreground mt-1">PNG, JPG oder SVG • Max. 2MB</div>
                    </div>
                  </div>

                  {/* Logo Position */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-3">Logo Position</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['left', 'center', 'right'].map((position) => (
                        <button
                          key={position}
                          onClick={() => setInvoiceLogoPosition(position)}
                          className={`p-2 rounded-lg border-2 transition-all text-center ${invoiceLogoPosition === position
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-border-strong'
                            }`}
                        >
                          <div className="text-xs font-medium text-foreground capitalize">{position}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Color */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-3">Primärfarbe</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={invoiceColor}
                        onChange={(e) => setInvoiceColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={invoiceColor}
                        onChange={(e) => setInvoiceColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Font Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Schriftart</label>
                    <CustomSelect
                      value={invoiceFont}
                      onChange={setInvoiceFont}
                      options={[
                        { value: 'inter', label: 'Inter (Modern)' },
                        { value: 'helvetica', label: 'Helvetica (Classic)' },
                        { value: 'times', label: 'Times New Roman (Formal)' },
                        { value: 'roboto', label: 'Roboto (Clean)' },
                        { value: 'arial', label: 'Arial (Universal)' },
                      ]}
                    />
                  </div>
                </div>

                {/* Layout Options */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="text-foreground font-medium mb-4">Layout-Optionen</h3>

                  {/* Invoice Number Position */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Rechnungsnummer Position</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'right', label: 'Rechts oben' },
                        { value: 'left', label: 'Links oben' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setInvoiceNumberPosition(option.value)}
                          className={`p-2.5 rounded-lg border-2 transition-all text-center ${invoiceNumberPosition === option.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-border-strong'
                            }`}
                        >
                          <div className="text-xs font-medium text-foreground">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address Layout */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Adress-Layout</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'two-column', label: 'Zweispaltig' },
                        { value: 'stacked', label: 'Gestapelt' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setInvoiceAddressLayout(option.value)}
                          className={`p-2.5 rounded-lg border-2 transition-all text-center ${invoiceAddressLayout === option.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-border-strong'
                            }`}
                        >
                          <div className="text-xs font-medium text-foreground">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table Style */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Tabellen-Stil</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'minimal', label: 'Minimal' },
                        { value: 'grid', label: 'Grid' },
                        { value: 'striped', label: 'Gestreift' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setInvoiceTableStyle(option.value)}
                          className={`p-2.5 rounded-lg border-2 transition-all text-center ${invoiceTableStyle === option.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-border-strong'
                            }`}
                        >
                          <div className="text-xs font-medium text-foreground">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Akzentfarbe (Hintergrund)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={invoiceAccentColor}
                        onChange={(e) => setInvoiceAccentColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={invoiceAccentColor}
                        onChange={(e) => setInvoiceAccentColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveInvoiceDesign}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Design speichern
                </button>
              </div>

              {/* Right: Live Preview */}
              <div className="col-span-3">
                <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-foreground font-medium">Live-Vorschau</h3>
                    <button className="text-sm text-primary hover:underline">Als PDF exportieren</button>
                  </div>

                  {/* Invoice Preview */}
                  <div
                    className={`bg-white rounded-lg p-8 shadow-sm relative overflow-hidden ${invoiceTemplate === 'classic' ? 'border-2 border-gray-800' :
                      invoiceTemplate === 'modern' ? 'border-0 shadow-lg' :
                        'border border-border'
                      }`}
                    style={{
                      fontFamily: invoiceFont === 'inter' ? 'Inter' :
                        invoiceFont === 'helvetica' ? 'Helvetica' :
                          invoiceFont === 'times' ? 'Times New Roman' :
                            invoiceFont === 'roboto' ? 'Roboto' : 'Arial'
                    }}
                  >
                    {/* Modern Template - Color Header Bar */}
                    {invoiceTemplate === 'modern' && (
                      <div
                        className="absolute top-0 left-0 right-0 h-2"
                        style={{ backgroundColor: invoiceColor }}
                      />
                    )}
                    {/* Header */}
                    <div className={`mb-8 ${invoiceTemplate === 'modern' ? 'pt-4' : ''}`}>
                      {invoiceLogoPosition === 'center' ? (
                        /* Centered Logo Layout */
                        <>
                          <div className="flex flex-col items-center text-center mb-6">
                            <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-gray-400 text-xs mb-2 ${invoiceTemplate === 'classic' ? 'border-2 border-gray-800 bg-white' :
                              invoiceTemplate === 'modern' ? 'bg-gradient-to-br from-gray-100 to-gray-200' :
                                'bg-gray-200'
                              }`}>
                              Logo
                            </div>
                            <div className={`text-sm text-gray-900 ${invoiceTemplate === 'classic' ? 'font-bold' : 'font-semibold'}`}>
                              Autoteile Shop GmbH
                            </div>
                            <div className="text-xs text-gray-600">Musterstraße 123</div>
                            <div className="text-xs text-gray-600">12345 Berlin</div>
                          </div>
                          <div className="text-center">
                            <div
                              className={`${invoiceTemplate === 'modern' ? 'text-3xl' : 'text-2xl'} font-bold mb-2`}
                              style={{ color: invoiceColor }}
                            >
                              RECHNUNG
                            </div>
                            <div className="text-xs text-gray-600">
                              Rechnungsnr.: <span className="font-medium text-gray-900">RE-2024-001</span> ·
                              Datum: <span className="font-medium text-gray-900">24.12.2024</span> ·
                              Fällig: <span className="font-medium text-gray-900">07.01.2025</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Side-by-side Layout */
                        <div className="flex items-start justify-between">
                          {/* Logo & Company Info */}
                          <div className={`${invoiceLogoPosition === 'left' && invoiceNumberPosition === 'right' ? 'order-1' :
                            invoiceLogoPosition === 'left' && invoiceNumberPosition === 'left' ? 'order-2' :
                              invoiceLogoPosition === 'right' && invoiceNumberPosition === 'right' ? 'order-2' :
                                'order-1'
                            } ${invoiceLogoPosition === 'right' ? 'text-right' : 'text-left'}`}>
                            <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-gray-400 text-xs mb-2 ${invoiceTemplate === 'classic' ? 'border-2 border-gray-800 bg-white' :
                              invoiceTemplate === 'modern' ? 'bg-gradient-to-br from-gray-100 to-gray-200' :
                                'bg-gray-200'
                              } ${invoiceLogoPosition === 'right' ? 'ml-auto' : ''}`}>
                              Logo
                            </div>
                            <div className={`text-sm text-gray-900 ${invoiceTemplate === 'classic' ? 'font-bold' : 'font-semibold'}`}>
                              Autoteile Shop GmbH
                            </div>
                            <div className="text-xs text-gray-600">Musterstraße 123</div>
                            <div className="text-xs text-gray-600">12345 Berlin</div>
                          </div>

                          {/* Invoice Number */}
                          <div className={`${invoiceLogoPosition === 'left' && invoiceNumberPosition === 'right' ? 'order-2' :
                            invoiceLogoPosition === 'left' && invoiceNumberPosition === 'left' ? 'order-1' :
                              invoiceLogoPosition === 'right' && invoiceNumberPosition === 'right' ? 'order-1' :
                                'order-2'
                            } ${invoiceNumberPosition === 'right' ? 'text-right' : 'text-left'}`}>
                            <div
                              className={`${invoiceTemplate === 'modern' ? 'text-3xl' : 'text-2xl'} font-bold mb-2`}
                              style={{ color: invoiceColor }}
                            >
                              RECHNUNG
                            </div>
                            <div className="text-xs text-gray-600">
                              <div>Rechnungsnr.: <span className="font-medium text-gray-900">RE-2024-001</span></div>
                              <div>Datum: <span className="font-medium text-gray-900">24.12.2024</span></div>
                              <div>Fällig: <span className="font-medium text-gray-900">07.01.2025</span></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Classic Template - Divider */}
                    {invoiceTemplate === 'classic' && (
                      <div className="border-t-2 border-gray-800 mb-6" />
                    )}

                    {/* Invoice Info - Address Layout */}
                    <div className={`mb-8 ${invoiceTemplate === 'modern' ? 'p-4 rounded-lg' : ''}`}
                      style={{ backgroundColor: invoiceTemplate === 'modern' ? invoiceAccentColor : 'transparent' }}>
                      {invoiceAddressLayout === 'two-column' ? (
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <div className={`text-xs mb-1 ${invoiceTemplate === 'classic' ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                              Rechnung an
                            </div>
                            <div className="text-sm text-gray-900 font-medium">Musterfirma GmbH</div>
                            <div className="text-xs text-gray-600">Beispielstraße 456</div>
                            <div className="text-xs text-gray-600">54321 Hamburg</div>
                          </div>
                          <div>
                            <div className={`text-xs mb-1 ${invoiceTemplate === 'classic' ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                              Versandadresse
                            </div>
                            <div className="text-sm text-gray-900 font-medium">Musterfirma GmbH</div>
                            <div className="text-xs text-gray-600">Beispielstraße 456</div>
                            <div className="text-xs text-gray-600">54321 Hamburg</div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <div className={`text-xs mb-1 ${invoiceTemplate === 'classic' ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                              Rechnung an
                            </div>
                            <div className="text-sm text-gray-900 font-medium">Musterfirma GmbH</div>
                            <div className="text-xs text-gray-600">Beispielstraße 456</div>
                            <div className="text-xs text-gray-600">54321 Hamburg</div>
                          </div>
                          <div className="flex gap-8">
                            <div className="flex-1">
                              <div className={`text-xs mb-1 ${invoiceTemplate === 'classic' ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                Lieferdatum
                              </div>
                              <div className="text-sm text-gray-900 font-medium">27.12.2024</div>
                            </div>
                            <div className="flex-1">
                              <div className={`text-xs mb-1 ${invoiceTemplate === 'classic' ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                Zahlungsbedingungen
                              </div>
                              <div className="text-sm text-gray-900">14 Tage netto</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Items Table */}
                    <table className={`w-full mb-8 ${invoiceTableStyle === 'grid' ? 'border border-gray-200' :
                      invoiceTemplate === 'classic' ? 'border-2 border-gray-800' : ''
                      }`}>
                      <thead>
                        <tr
                          className={invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'border-b' : 'border-b-2'}
                          style={{
                            borderColor: invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? '#1f2937' : invoiceColor,
                            backgroundColor: invoiceTableStyle === 'grid' ? invoiceAccentColor : invoiceTemplate === 'classic' ? '#1f2937' : 'transparent',
                            color: invoiceTemplate === 'classic' ? 'white' : 'inherit'
                          }}
                        >
                          <th className={`text-left text-xs font-semibold ${invoiceTemplate === 'classic' ? 'text-white' : 'text-gray-700'} ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'pb-2'
                            }`}>Position</th>
                          <th className={`text-right text-xs font-semibold ${invoiceTemplate === 'classic' ? 'text-white' : 'text-gray-700'} ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'pb-2'
                            }`}>Menge</th>
                          <th className={`text-right text-xs font-semibold ${invoiceTemplate === 'classic' ? 'text-white' : 'text-gray-700'} ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'pb-2'
                            }`}>Einzelpreis</th>
                          <th className={`text-right text-xs font-semibold ${invoiceTemplate === 'classic' ? 'text-white' : 'text-gray-700'} ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'pb-2'
                            }`}>Gesamt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { item: 'Bremsbeläge vorne', qty: 2, price: '45,00 €', total: '90,00 €' },
                          { item: 'Ölfilter', qty: 1, price: '12,50 €', total: '12,50 €' },
                          { item: 'Luftfilter', qty: 1, price: '15,00 €', total: '15,00 €' },
                        ].map((row, idx) => (
                          <tr
                            key={idx}
                            className={`
                              ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'border-b border-gray-200' : invoiceTableStyle === 'minimal' ? 'border-b border-gray-100' : ''}
                              ${invoiceTableStyle === 'striped' && idx % 2 === 0 ? 'bg-gray-50' : ''}
                            `}
                          >
                            <td className={`text-sm text-gray-900 ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'py-3'}`}>{row.item}</td>
                            <td className={`text-sm text-gray-900 text-right ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'py-3'}`}>{row.qty}</td>
                            <td className={`text-sm text-gray-900 text-right ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'py-3'}`}>{row.price}</td>
                            <td className={`text-sm text-gray-900 text-right font-medium ${invoiceTableStyle === 'grid' || invoiceTemplate === 'classic' ? 'p-3' : 'py-3'}`}>{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                      <div className="w-64">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Zwischensumme</span>
                          <span className="font-medium text-gray-900">117,50 €</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-3">
                          <span>MwSt. (19%)</span>
                          <span className="font-medium text-gray-900">22,33 €</span>
                        </div>
                        <div
                          className="flex justify-between text-base font-bold pt-3 border-t-2"
                          style={{ borderColor: invoiceColor, color: invoiceColor }}
                        >
                          <span>Gesamt</span>
                          <span>139,83 €</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div
                      className={`text-center text-xs pt-6 ${invoiceTemplate === 'classic' ? 'border-t-2 border-gray-800 text-gray-700' :
                        invoiceTemplate === 'modern' ? 'text-gray-600' :
                          'border-t border-gray-200 text-gray-500'
                        }`}
                      style={{
                        backgroundColor: invoiceTemplate === 'modern' ? invoiceAccentColor : 'transparent',
                        marginLeft: invoiceTemplate === 'modern' ? '-2rem' : '0',
                        marginRight: invoiceTemplate === 'modern' ? '-2rem' : '0',
                        marginBottom: invoiceTemplate === 'modern' ? '-2rem' : '0',
                        paddingLeft: invoiceTemplate === 'modern' ? '2rem' : '0',
                        paddingRight: invoiceTemplate === 'modern' ? '2rem' : '0',
                        paddingBottom: invoiceTemplate === 'modern' ? '2rem' : '0',
                      }}
                    >
                      <div className={`mb-1 ${invoiceTemplate === 'classic' ? 'font-semibold' : ''}`}>
                        Autoteile Shop GmbH · Musterstraße 123 · 12345 Berlin
                      </div>
                      <div>Tel: +49 30 123 456 789 · E-Mail: info@autoteile-shop.de · USt-IdNr: DE987654321</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Team-Mitglied einladen</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sende eine Einladung per E-Mail
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  E-Mail Adresse
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="mitarbeiter@autoteile-shop.de"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Rolle</label>
                <CustomSelect
                  value={newMemberRole}
                  onChange={(value) => setNewMemberRole(value as 'admin' | 'member')}
                  options={[
                    {
                      value: 'member',
                      label: 'Mitarbeiter',
                      icon: <User className="w-4 h-4 text-slate-600" />
                    },
                    {
                      value: 'admin',
                      label: 'Administrator',
                      icon: <Shield className="w-4 h-4 text-blue-600" />
                    }
                  ]}
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Einladung senden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Mitarbeiter bearbeiten</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Rolle und Berechtigungen anpassen
              </p>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg ring-2 ring-primary/20">
                  {getInitials(editingMember.name)}
                </div>
                <div>
                  <div className="font-medium text-foreground">{editingMember.name}</div>
                  <div className="text-sm text-muted-foreground">{editingMember.email}</div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Rolle
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEditingMember({ ...editingMember, role: 'admin' })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${editingMember.role === 'admin'
                      ? 'border-blue-600 bg-blue-600/10'
                      : 'border-border hover:border-border-strong'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className={`w-4 h-4 ${editingMember.role === 'admin' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-foreground">Administrator</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Zugriff auf alle Funktionen außer Abrechnung
                    </p>
                  </button>
                  <button
                    onClick={() => setEditingMember({ ...editingMember, role: 'member' })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${editingMember.role === 'member'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border-strong'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <User className={`w-4 h-4 ${editingMember.role === 'member' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-foreground">Mitarbeiter</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Benutzerdefinierte Berechtigungen
                    </p>
                  </button>
                </div>
              </div>

              {/* Detailed Permissions (only for member role) */}
              {editingMember.role === 'member' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Detaillierte Berechtigungen
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'customers', label: 'Kunden verwalten', description: 'WhatsApp-Chats und Kundenprofile' },
                      { key: 'orders', label: 'Aufträge erstellen', description: 'Neue Aufträge anlegen und bearbeiten' },
                      { key: 'quotes', label: 'Angebote erstellen', description: 'Preisangebote erstellen und versenden' },
                      { key: 'pricing', label: 'Preise einsehen', description: 'Einkaufs- und Verkaufspreise sehen' },
                      { key: 'documents', label: 'Belege verwalten', description: 'Rechnungen und Lieferscheine' },
                      { key: 'suppliers', label: 'Lieferanten verwalten', description: 'Bestellungen bei Lieferanten' },
                      { key: 'team', label: 'Team verwalten', description: 'Mitarbeiter einladen und verwalten' },
                      { key: 'settings', label: 'Einstellungen ändern', description: 'Unternehmenseinstellungen anpassen' },
                      { key: 'billing', label: 'Abrechnung einsehen', description: 'Zahlungsinformationen und Rechnungen' },
                    ].map((permission) => (
                      <label
                        key={permission.key}
                        className="flex items-start justify-between p-3 bg-background border border-border rounded-lg hover:border-border-strong cursor-pointer transition-all group"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-sm">{permission.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{permission.description}</div>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer ml-4">
                          <input
                            type="checkbox"
                            defaultChecked={permission.key === 'customers' || permission.key === 'orders' || permission.key === 'quotes'}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Status
                </label>
                <CustomSelect
                  value={editingMember.status}
                  onChange={(value) => setEditingMember({ ...editingMember, status: value as any })}
                  options={[
                    {
                      value: 'active',
                      label: 'Aktiv',
                      icon: <CheckCircle2 className="w-4 h-4 text-green-600" />
                    },
                    {
                      value: 'inactive',
                      label: 'Inaktiv',
                      icon: <XCircle className="w-4 h-4 text-slate-600" />
                    }
                  ]}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-between">
              <button
                onClick={() => {
                  if (confirm('Möchtest du dieses Mitglied wirklich löschen?')) {
                    setTeamMembers(teamMembers.filter(m => m.id !== editingMember.id));
                    setEditingMember(null);
                  }
                }}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Mitglied löschen
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    // Save changes to teamMembers
                    setTeamMembers(teamMembers.map(m => m.id === editingMember.id ? editingMember : m));
                    setEditingMember(null);
                  }}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Änderungen speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}