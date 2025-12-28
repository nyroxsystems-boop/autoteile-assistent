
import { useState } from 'react';
import { login } from '../api/wws';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { User, Lock, Building2, Loader2 } from 'lucide-react';

interface LoginViewProps {
    onLoginSuccess: () => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [tenant, setTenant] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier || !password) {
            toast.error('Bitte geben Sie Ihre Zugangsdaten ein');
            return;
        }

        setLoading(true);
        try {
            await login({
                email: identifier, // Use email field for backend
                password,
                tenant: tenant || undefined,
            });
            toast.success('Erfolgreich eingeloggt');
            onLoginSuccess();
        } catch (err: any) {
            console.error('Login failed:', err);
            toast.error(err.message || 'Login fehlgeschlagen');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
                        <User className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Willkommen zurück</h1>
                    <p className="text-muted-foreground mt-2">Bitte melden Sie sich an, um fortzufahren</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Benutzername oder Email
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="admin"
                                    className="pl-10"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Passwort
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Tenant (Optional)
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="demo"
                                    className="pl-10"
                                    value={tenant}
                                    onChange={(e) => setTenant(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Anmelden...
                                </>
                            ) : (
                                'Anmelden'
                            )}
                        </Button>
                    </form>
                </div>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Noch kein Konto? Kontaktieren Sie Ihren Administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}
