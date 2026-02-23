import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    Activity, 
    BarChart3, 
    Ear, 
    LineChart, 
    Zap,
    ArrowRight,
    TrendingUp,
    Globe,
    Check
} from 'lucide-react';

const LandingPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className={`min-h-screen bg-background font-sans ${isRTL ? 'font-arabic' : ''}`}>
            <header className="fixed w-full bg-white/90 backdrop-blur-md border-b border-border z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/images/logo.png" alt="Qualitivate" className="h-10 w-auto object-contain" />
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#methodology" className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">{t('nav.methodology')}</a>
                        <a href="#benefits" className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">{t('nav.benefits')}</a>
                        <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">{t('nav.pricing')}</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        {/* Language Switcher */}
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 border border-gray-300">
                            <Globe className="w-4 h-4 text-gray-600" />
                            <select
                                value={i18n.language}
                                onChange={(e) => changeLanguage(e.target.value)}
                                className="bg-transparent text-sm font-medium text-gray-700 cursor-pointer focus:outline-none"
                            >
                                <option value="en">EN</option>
                                <option value="fr">FR</option>
                                <option value="ar">عربي</option>
                            </select>
                        </div>
                        <Link to="/login" className="text-sm font-medium text-text-primary hover:text-primary-600 transition-colors">{t('nav.signIn')}</Link>
                        <Link to="/book-demo" className="btn-primary">{t('nav.bookDemo')}</Link>
                    </div>
                </div>
            </header>

            <main className="pt-32">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className={`order-2 lg:order-1 ${isRTL ? 'text-right' : ''}`}>
                            <span className="badge-primary mb-6 inline-flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                {t('hero.badge')}
                            </span>
                            <h1 className="text-5xl sm:text-6xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight">
                                {t('hero.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">{t('hero.titleHighlight')}</span>.
                            </h1>
                            <p className="text-xl text-text-secondary mb-8 leading-relaxed max-w-lg">
                                {t('hero.subtitle')}
                            </p>
                            <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                                <Link to="/book-demo" className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2 group">
                                    {t('hero.cta')}
                                    <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                                </Link>
                                <a href="#methodology" className="btn-secondary text-lg px-8 py-4 flex items-center justify-center">
                                    {t('hero.ctaSecondary')}
                                </a>
                            </div>
                            <div className="mt-8 flex items-center gap-4 text-sm text-text-muted">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-primary-200 border-2 border-white"></div>
                                    <div className="w-8 h-8 rounded-full bg-secondary-200 border-2 border-white"></div>
                                    <div className="w-8 h-8 rounded-full bg-accent-200 border-2 border-white"></div>
                                </div>
                                <span>{t('hero.trustLine', 'Trusted by 500+ organizations')}</span>
                            </div>
                        </div>
                        <div className="relative order-1 lg:order-2">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary-100/50 to-secondary-100/50 rounded-full blur-[100px] -z-10"></div>
                            <img
                                src="/images/landing-hero.png"
                                alt="Analytics Dashboard"
                                className="w-full h-auto drop-shadow-2xl rounded-2xl border border-white/40"
                            />
                            <div className={`absolute -bottom-8 ${isRTL ? '-right-6' : '-left-6'} bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden md:block`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-text-secondary font-medium">{t('hero.enps')}</p>
                                        <p className="text-lg font-bold text-text-primary">+24pts</p>
                                    </div>
                                </div>
                                <p className="text-xs text-green-600 font-medium">{t('hero.enpsChange')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Section */}
                <section className="py-12 bg-surface border-y border-border/60">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-text-secondary font-medium tracking-wide uppercase mb-8">{t('trust.label')}</p>
                        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70">
                            <span className="text-xl font-bold text-text-primary">Acme Corp</span>
                            <span className="text-xl font-bold text-text-primary">Globex</span>
                            <span className="text-xl font-bold text-text-primary">Umbrella</span>
                            <span className="text-xl font-bold text-text-primary">Massive</span>
                            <span className="text-xl font-bold text-text-primary">Initech</span>
                        </div>
                    </div>
                </section>

                {/* Data-Driven Precision */}
                <section id="benefits" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary">{t('benefits.title', 'Data-Driven Precision')}</h2>
                        <p className="text-text-secondary mt-2 max-w-2xl">
                            {t('benefits.subtitle', 'Make every survey response count with structured collection, smart analysis, and decision-ready visuals.')}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Ear, title: t('benefits.feat1Title', 'Collection'), desc: t('benefits.feat1Desc', 'Secure, multi-channel distribution with higher completion rates.') },
                            { icon: BarChart3, title: t('benefits.feat2Title', 'Analysis'), desc: t('benefits.feat2Desc', 'AI-powered insights that surface trends and risk quickly.') },
                            { icon: LineChart, title: t('benefits.feat3Title', 'Visualization'), desc: t('benefits.feat3Desc', 'Executive-ready dashboards and reports your teams trust.') }
                        ].map((item, i) => (
                            <div key={i} className="card-soft">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                                <p className="text-text-secondary">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Methodology Section */}
                <section id="methodology" className="py-24 bg-surface border-y border-border/60">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="relative">
                                <div className="rounded-2xl bg-gradient-to-br from-primary-100 via-white to-secondary-100 p-6 border border-white/70 shadow-soft">
                                    <img src="/images/landing-illustration.png" alt="Insights" className="rounded-xl w-full h-auto" />
                                </div>
                            </div>
                            <div className={isRTL ? 'text-right' : ''}>
                                <span className="badge-primary mb-4 inline-flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    {t('methodology.label', 'Real-time')}
                                </span>
                                <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                                    {t('methodology.title', 'Instant Insights, Not Delayed Reports')}
                                </h2>
                                <p className="text-text-secondary mb-6">
                                    {t('methodology.subtitle', 'Stop waiting for quarterly reviews. Capture and act on feedback while it is still fresh.')}
                                </p>
                                <div className="space-y-3">
                                    {[
                                        t('methodology.point1', 'Live sentiment heatmaps'),
                                        t('methodology.point2', 'Automated executive summaries'),
                                        t('methodology.point3', 'Department-level benchmarking')
                                    ].map((item, i) => (
                                        <div key={i} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <span className="text-text-secondary">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section id="pricing" className="py-28 bg-background">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-6">
                            {t('cta.title')} <br className="hidden md:block" /> {t('cta.titleLine2')}
                        </h2>
                        <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
                            {t('cta.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/book-demo" className="btn-primary text-xl px-10 py-5 shadow-xl shadow-primary-500/20 hover:shadow-primary-500/30">
                                {t('cta.button')}
                            </Link>
                            <a href="#benefits" className="btn-secondary text-xl px-10 py-5">
                                {t('cta.secondary', 'View Pricing')}
                            </a>
                        </div>
                        <p className="mt-8 text-sm text-text-muted">
                            {t('cta.note')}
                        </p>
                    </div>
                </section>
            </main>

            <footer className="bg-white border-t border-border py-12">
                <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-2">
                        <img src="/images/logo.png" alt="Qualitivate" className="h-8 w-auto object-contain" />
                    </div>
                    <p className="text-sm text-gray-500">{t('footer.copyright')}</p>
                    <div className={`flex gap-6 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <a href="#" className="hover:text-primary-600">{t('footer.privacy')}</a>
                        <a href="#" className="hover:text-primary-600">{t('footer.terms')}</a>
                        <a href="#" className="hover:text-primary-600">{t('footer.contact')}</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

