
import React, { useEffect, useState } from 'react';
import { Package, Search, Plus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, ProductService } from '../services/productService';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function ProductsPage() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProducts();
    }, [search]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await ProductService.listProducts(search);
            setProducts(data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Fehler beim Laden der Artikel. Bitte versuchen Sie es erneut.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Artikelverwaltung</h1>
                    <p className="text-slate-500">
                        Verwalten Sie Ihren lokalen Artikelstamm und Preise.
                    </p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Artikel
                </Button>
            </div>

            {/* ERROR BANNER */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 mr-3" />
                    {error}
                </div>
            )}

            {/* FILTERS */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Suchen nach Name, Art-Nr. oder EAN..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* PRODUCT LIST */}
            <div className="bg-white rounded-lg border shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                        <tr>
                            <th className="px-6 py-3">Produkt</th>
                            <th className="px-6 py-3">Art-Nr. (IPN)</th>
                            <th className="px-6 py-3">Bestand</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    Lade Artikel...
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    Keine Artikel gefunden.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.pk} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold">{product.name}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {product.IPN || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${(product.stock || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                                                }`} />
                                            <span>{product.stock || 0} Stk.</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.active ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                Aktiv
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                Archiviert
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.location.href = `/products/${product.pk}`}
                                        >
                                            Bearbeiten
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
