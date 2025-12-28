import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface StockAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (action: 'add' | 'remove', quantity: number) => Promise<void>;
    productName: string;
    currentStock: number;
}

export default function StockAdjustmentModal({ isOpen, onClose, onConfirm, productName, currentStock }: StockAdjustmentModalProps) {
    const [action, setAction] = useState<'add' | 'remove'>('add');
    const [quantity, setQuantity] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity <= 0) return;
        setLoading(true);
        try {
            await onConfirm(action, quantity);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
            <div style={{
                background: 'var(--bg-panel)', padding: 0, borderRadius: 16,
                width: 440, maxWidth: '90%', border: '1px solid var(--border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
            }}>
                <div style={{ padding: '20px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Lagerbewegung buchen</h3>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                        Artikel: <strong style={{ color: 'var(--text)' }}>{productName}</strong>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-card)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
                        <button
                            type="button"
                            onClick={() => setAction('add')}
                            style={{
                                border: 'none', background: action === 'add' ? '#10B981' : 'transparent',
                                color: action === 'add' ? 'white' : 'var(--muted)',
                                borderRadius: 7, padding: '8px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            + EINGANG
                        </button>
                        <button
                            type="button"
                            onClick={() => setAction('remove')}
                            style={{
                                border: 'none', background: action === 'remove' ? '#F43F5E' : 'transparent',
                                color: action === 'remove' ? 'white' : 'var(--muted)',
                                borderRadius: 7, padding: '8px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            - AUSGANG
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', color: 'var(--muted)' }}>Menge</label>
                            <Input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e: any) => setQuantity(parseInt(e.target.value))}
                                autoFocus
                                style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', height: 56 }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', color: 'var(--muted)' }}>Grund</label>
                            <select style={{ width: '100%', height: 56, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', fontSize: 14, fontWeight: 500, outline: 'none' }}>
                                <option>Regulär</option>
                                <option>Inventur Diff.</option>
                                <option>Defekt</option>
                                <option>Retoure</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Abbrechen
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading || quantity <= 0} style={{ minWidth: 120 }}>
                            {loading ? 'Buche...' : 'Buchen'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
