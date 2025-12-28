
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, ProductService } from '../services/productService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import PageHeader from '../ui/PageHeader';

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        description: '',
        IPN: '',
        stock: 0,
        active: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isNew && id) {
            loadProduct(parseInt(id));
        }
    }, [id]);

    const loadProduct = async (productId: number) => {
        setLoading(true);
        try {
            const product = await ProductService.getProduct(productId);
            setFormData(product);
        } catch (err) {
            setError('Fehler beim Laden des Artikels.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isNew) {
                await ProductService.createProduct(formData);
            } else if (id) {
                await ProductService.updateProduct(parseInt(id), formData);
            }
            navigate('/products');
        } catch (err) {
            console.error(err);
            setError('Speichern fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof Product, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6 p-6">
            <PageHeader
                title={isNew ? "Neuer Artikel" : `Artikel: ${formData.name}`}
                description={isNew ? "Erstellen Sie einen neuen Artikel in Ihrem Bestand." : "Bearbeiten Sie die Artikeldetails."}
                actions={
                    <Button variant="ghost" onClick={() => navigate('/products')}>
                        Abbrechen
                    </Button>
                }
            />

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                    {error}
                </div>
            )}

            <div className="max-w-2xl">
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Stammdaten */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Stammdaten</h3>

                            <div>
                                <label className="block text-sm font-medium mb-1">Artikelname</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e: any) => handleChange('name', e.target.value)}
                                    placeholder="z.B. Bremsbelagsatz Vorderachse"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Interne Artikelnummer (IPN)</label>
                                <Input
                                    value={formData.IPN || ''}
                                    onChange={(e: any) => handleChange('IPN', e.target.value)}
                                    placeholder="z.B. 100-200-300"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                                <textarea
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    rows={4}
                                    value={formData.description || ''}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Premium Auto-Parts Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                            <div>
                                <label className="block text-sm font-medium mb-1">OE-Nummer (Original)</label>
                                <Input
                                    value={formData.oe_number || ''}
                                    onChange={(e: any) => handleChange('oe_number', e.target.value)}
                                    className="font-mono text-blue-600 font-medium"
                                    placeholder="z.B. 06A 145 713"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Hersteller</label>
                                <Input
                                    value={formData.manufacturer || ''}
                                    onChange={(e: any) => handleChange('manufacturer', e.target.value)}
                                    placeholder="z.B. BOSCH"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Lagerort</label>
                                <Input
                                    value={formData.location || ''}
                                    onChange={(e: any) => handleChange('location', e.target.value)}
                                    placeholder="A-01-02"
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        {/* Lager & Status */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2 pt-4">Lager & Status</h3>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">Aktueller Bestand</label>
                                    <Input
                                        type="number"
                                        value={formData.stock || 0}
                                        disabled
                                        className="bg-gray-100 cursor-not-allowed opacity-70"
                                    />
                                    <div className="text-xs text-muted mt-1">
                                        Bestandsänderungen bitte über "Lagerübersicht" buchen.
                                    </div>
                                </div>
                                <div className="flex-1 flex items-end">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => handleChange('active', e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm font-medium">Artikel ist aktiv</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end">
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Speichert...' : 'Speichern'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div >
    );
}
