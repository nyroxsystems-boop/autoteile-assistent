import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { onboardingApi } from '../../api/onboarding';

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [csvData, setCsvData] = useState('Part A, VW, OEM123, 10, 50.00\nPart B, BMW, OEM456, 5, 120.00');
    const navigate = useNavigate();

    const handleInit = async () => {
        if (!name || !email) return;
        try {
            const res = await onboardingApi.initialize(name, email);
            setSessionId(res.sessionId);
            setStep(1);
        } catch (e) {
            alert('Error initializing onboarding');
        }
    };

    const handleImport = async () => {
        try {
            await onboardingApi.importInventory(sessionId, csvData);
            setStep(2);
            triggerConfetti();
        } catch (e) {
            console.error(e);
        }
    };

    const handleFinish = () => {
        localStorage.setItem('wws_onboarding_completed', 'true');
        // Force reload to update sidebar
        window.location.href = '/overview';
    };

    const triggerConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#60A5FA', '#A78BFA', '#34D399']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#60A5FA', '#A78BFA', '#34D399']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    // Styles
    const cardStyle = "bg-black/40 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] max-w-xl w-full text-white relative overflow-hidden group";
    const inputStyle = "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 placeholder:text-gray-500";
    const labelStyle = "block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider text-xs";

    // Custom Button with Shine Effect
    const PremiumButton = ({ onClick, children, className }: any) => (
        <button
            onClick={onClick}
            className={`relative w-full py-4 rounded-xl font-bold text-lg overflow-hidden transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${className}`}
        >
            {/* Shine Element */}
            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transition-all duration-1000 group-hover:left-[100%]" />
            <span className="relative z-10">{children}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(29,78,216,0.15),transparent_50%)]" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[128px] animate-pulse" style={{ animationDuration: '10s' }} />

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -30 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cardStyle}
                    >
                        {/* Decor line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />

                        <div className="mb-8 text-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="inline-block mb-4 p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10"
                            >
                                <span className="text-4xl">🚀</span>
                            </motion.div>
                            <h1 className="text-4xl font-extrabold mb-3 tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                Willkommen.
                            </h1>
                            <p className="text-gray-400 text-lg">Konfigurieren wir dein digitales Autohaus.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Name des Unternehmens</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className={inputStyle}
                                    placeholder="z.B. Schmidt Performance Parts"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className={labelStyle}>Geschäfts-Email</label>
                                <input
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className={inputStyle}
                                    placeholder="hello@schmidt-parts.de"
                                />
                            </div>

                            <div className="pt-4">
                                <PremiumButton
                                    onClick={handleInit}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30 group"
                                >
                                    Account erstellen &rarr;
                                </PremiumButton>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className={cardStyle}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

                        <div className="mb-6">
                            <h1 className="text-3xl font-bold mb-2">Initialer Bestand</h1>
                            <p className="text-gray-400">Importiere deine ersten Artikel. CSV, Excel oder Copy-Paste.</p>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 blur"></div>
                            <textarea
                                value={csvData}
                                onChange={e => setCsvData(e.target.value)}
                                className="relative w-full h-48 bg-black border border-white/10 rounded-xl p-4 text-gray-300 font-mono text-sm focus:outline-none"
                                spellCheck={false}
                            />
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => setStep(2)} // Skip for demo
                                className="flex-1 py-4 rounded-xl font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                Überspringen
                            </button>
                            <PremiumButton
                                onClick={handleImport}
                                className="flex-[2] bg-white text-black hover:bg-gray-100 group"
                            >
                                Daten Importieren
                            </PremiumButton>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className={`${cardStyle} text-center py-16`}
                    >
                        <motion.div
                            initial={{ rotate: -180, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", duration: 1.5 }}
                            className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-900/50"
                        >
                            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>

                        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            Alles bereit!
                        </h1>
                        <p className="text-gray-400 text-lg mb-10 max-w-sm mx-auto">
                            Dein System wurde erfolgreich konfiguriert. Du kannst jetzt direkt loslegen.
                        </p>

                        <PremiumButton
                            onClick={handleFinish}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-900/30 group w-full"
                        >
                            Starten
                        </PremiumButton>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Elegant Progress Indicator */}
            <div className="absolute bottom-10 flex gap-3">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-500 ease-out ${step === i ? 'w-12 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' :
                            step > i ? 'w-4 bg-gray-500' : 'w-4 bg-gray-800'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
