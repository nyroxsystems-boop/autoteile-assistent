import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

interface KPIStats {
    sales: {
        totalOrders: number;
        ordersToday: number;
        revenue: number;
        conversionRate: number;
    };
    team: {
        activeUsers: number;
        callsMade: number;
        messagesSent: number;
    };
    oem: {
        resolvedCount: number;
        successRate: number;
    };
}

const SalesTeamPage: React.FC = () => {
    const { session } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<KPIStats | null>(null);
    const [showAddUser, setShowAddUser] = useState(false);

    // Form state
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/admin/users');
            if (res.ok) setUsers(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/admin/kpis');
            if (res.ok) setStats(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, email: newEmail, role: 'sales_rep' })
            });
            if (res.ok) {
                setShowAddUser(false);
                setNewName('');
                setNewEmail('');
                fetchUsers();
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Vertrieb & Team</h1>
                <div style={{ color: 'var(--muted)' }}>Sales Performance und Mitarbeiter-Verwaltung</div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <KpiCard title="Umsatz (Simuliert)" value={`${stats?.sales.revenue ?? 0} €`} trend="+12%" />
                <KpiCard title="Bestellungen Heute" value={stats?.sales.ordersToday ?? 0} />
                <KpiCard title="Konversion" value={`${stats?.sales.conversionRate ?? 0}%`} trend="+2.4%" />
                <KpiCard title="OEM Matches" value={stats?.oem.resolvedCount ?? 0} />
            </div>

            {/* User Management */}
            <div className="panel" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-panel)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontWeight: 600 }}>Mitarbeiter / User</h3>
                    <Button size="sm" onClick={() => setShowAddUser(true)}>+ User anlegen</Button>
                </div>

                {showAddUser && (
                    <div style={{ padding: 20, background: 'rgba(79,139,255,0.05)', borderBottom: '1px solid var(--border)' }}>
                        <form onSubmit={handleAddUser} style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <label style={{ fontSize: 12, marginBottom: 4, fontWeight: 600 }}>Name</label>
                                <input
                                    style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-main)' }}
                                    value={newName} onChange={e => setNewName(e.target.value)} required
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <label style={{ fontSize: 12, marginBottom: 4, fontWeight: 600 }}>E-Mail</label>
                                <input
                                    style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-main)' }}
                                    type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                                />
                            </div>
                            <Button type="submit" variant="primary">Speichern</Button>
                            <Button type="button" variant="ghost" onClick={() => setShowAddUser(false)}>Abbrechen</Button>
                        </form>
                    </div>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 13, color: 'var(--muted)' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 13, color: 'var(--muted)' }}>Rolle</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 13, color: 'var(--muted)' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 13, color: 'var(--muted)' }}>Beigetreten</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '14px 20px' }}>
                                    <div style={{ fontWeight: 500 }}>{u.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email}</div>
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                    <Badge>{u.role}</Badge>
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginRight: 6 }}></span>
                                    Aktiv
                                </td>
                                <td style={{ padding: '14px 20px', color: 'var(--muted)', fontSize: 13 }}>
                                    {new Date(u.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                                    Keine Mitarbeiter gefunden.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

function KpiCard({ title, value, trend }: { title: string, value: string | number, trend?: string }) {
    return (
        <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{title}</div>
                {trend && <div style={{ fontSize: 12, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 4 }}>{trend}</div>}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>{value}</div>
        </div>
    );
}

export default SalesTeamPage;
