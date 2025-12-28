import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useBillingSettings } from '../hooks/useBillingSettings';

const SettingsPage = () => {
    const { settings, update, loading } = useBillingSettings();
    const [activeTab, setActiveTab] = useState('invoice');

    // Form State
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        await update(formData);
        alert('Einstellungen gespeichert!');
    };

    if (loading) return <div>Lade Einstellungen...</div>;

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 24, fontWeight: 'bold' }}>Einstellungen</h1>
                <p style={{ color: 'var(--muted)' }}>Verwalte dein Rechnungsdesign und Firmendaten.</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <Button variant={activeTab === 'invoice' ? 'primary' : 'ghost'} onClick={() => setActiveTab('invoice')}>
                    Rechnungsdesign
                </Button>
                <Button variant={activeTab === 'company' ? 'primary' : 'ghost'} onClick={() => setActiveTab('company')}>
                    Firmendaten
                </Button>
            </div>

            {/* Invoice Builder Tab */}
            {activeTab === 'invoice' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: 20 }}>
                    {/* Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <Card title="Grundeinstellungen">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Vorlage</label>
                                    <select
                                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
                                        value={formData.invoice_template || 'clean'}
                                        onChange={(e) => handleChange('invoice_template', e.target.value)}
                                    >
                                        <option value="clean">Clean (Modern)</option>
                                        <option value="classic">Classic (Traditionell)</option>
                                        <option value="bold">Bold (Kräftig)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Primärfarbe</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {['#2563eb', '#dc2626', '#16a34a', '#000000'].map(c => (
                                            <div
                                                key={c}
                                                onClick={() => handleChange('invoice_color', c)}
                                                style={{
                                                    width: 30, height: 30, borderRadius: '50%', background: c,
                                                    cursor: 'pointer', border: formData.invoice_color === c ? '2px solid white' : 'none',
                                                    boxShadow: formData.invoice_color === c ? '0 0 0 2px var(--primary)' : 'none'
                                                }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={formData.invoice_color || '#2563eb'}
                                            onChange={(e) => handleChange('invoice_color', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Layout Optionen">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Logo Position</label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {['left', 'center', 'right'].map(pos => (
                                            <Button
                                                key={pos}
                                                size="sm"
                                                variant={formData.logo_position === pos ? 'primary' : 'secondary'}
                                                onClick={() => handleChange('logo_position', pos)}
                                            >
                                                {pos.toUpperCase()}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Tabellenstil</label>
                                    <select
                                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
                                        value={formData.table_style || 'grid'}
                                        onChange={(e) => handleChange('table_style', e.target.value)}
                                    >
                                        <option value="grid">Gitter (Grid)</option>
                                        <option value="striped">Gestreift (Striped)</option>
                                        <option value="minimal">Minimalistisch</option>
                                    </select>
                                </div>
                            </div>
                        </Card>

                        <Button onClick={handleSave} fullWidth>Speichern</Button>
                    </div>

                    {/* Live Preview (Mockup) */}
                    <Card title="Vorschau" style={{ height: 'fit-content', minHeight: 600, background: '#555' }}>
                        <div style={{
                            background: 'white',
                            color: 'black',
                            padding: 40,
                            borderRadius: 2,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            minHeight: 500,
                            fontFamily: formData.invoice_font || 'sans-serif'
                        }}>
                            {/* Header Mockup */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                flexDirection: formData.logo_position === 'center' ? 'column' : (formData.logo_position === 'right' ? 'row-reverse' : 'row'),
                                alignItems: formData.logo_position === 'center' ? 'center' : 'flex-start',
                                borderBottom: `2px solid ${formData.invoice_color || '#2563eb'}`,
                                paddingBottom: 20,
                                marginBottom: 30
                            }}>
                                <div style={{
                                    width: 60, height: 60, background: '#eee', borderRadius: 8,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999',
                                    marginBottom: formData.logo_position === 'center' ? 20 : 0
                                }}>LOGO</div>
                                <div style={{ textAlign: 'right' }}>
                                    <h2 style={{ color: formData.invoice_color || '#2563eb', margin: 0 }}>RECHNUNG</h2>
                                    <p style={{ margin: 0, fontSize: 12 }}>RE-2025-0001</p>
                                </div>
                            </div>

                            {/* Body Mockup */}
                            <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#666' }}>Empfänger</p>
                                    <strong>Max Mustermann</strong><br />
                                    Musterstraße 1<br />
                                    12345 Berlin
                                </div>
                            </div>

                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                border: formData.table_style === 'grid' ? '1px solid #eee' : 'none'
                            }}>
                                <thead>
                                    <tr style={{ background: formData.table_style === 'grid' ? (formData.accent_color || '#f3f4f6') : 'white' }}>
                                        <th style={{ textAlign: 'left', padding: 8, borderBottom: `2px solid ${formData.invoice_color}` }}>Pos</th>
                                        <th style={{ textAlign: 'left', padding: 8, borderBottom: `2px solid ${formData.invoice_color}` }}>Beschreibung</th>
                                        <th style={{ textAlign: 'right', padding: 8, borderBottom: `2px solid ${formData.invoice_color}` }}>Preis</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2].map(i => (
                                        <tr key={i} style={{ background: (formData.table_style === 'striped' && i % 2 === 0) ? '#f9fafb' : 'transparent' }}>
                                            <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i}</td>
                                            <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>Bremsscheibe Vorderachse</td>
                                            <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>59.90 €</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Company Data Tab */}
            {activeTab === 'company' && (
                <Card title="Firmendaten">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Firmenname</label>
                            <Input value={formData.company_name || ''} onChange={(e) => handleChange('company_name', e.target.value)} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>E-Mail</label>
                            <Input value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Straße</label>
                            <Input value={formData.address_line1 || ''} onChange={(e) => handleChange('address_line1', e.target.value)} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>PLZ</label>
                            <Input value={formData.postal_code || ''} onChange={(e) => handleChange('postal_code', e.target.value)} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Stadt</label>
                            <Input value={formData.city || ''} onChange={(e) => handleChange('city', e.target.value)} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>IBAN</label>
                            <Input value={formData.iban || ''} onChange={(e) => handleChange('iban', e.target.value)} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>USt-ID</label>
                            <Input value={formData.tax_id || ''} onChange={(e) => handleChange('tax_id', e.target.value)} />
                        </div>
                    </div>
                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                        <Button onClick={handleSave}>Änderungen speichern</Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SettingsPage;
