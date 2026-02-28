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
    Check,
    Users,
    MessageSquare,
    Target,
    PieChart
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
                        <img src="/branding/logo1.webp" alt="Qualitivate" className="h-10 w-auto object-contain" />
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
                            <div className="w-full h-auto rounded-2xl border border-white/40 bg-white/60 backdrop-blur-3xl shadow-2xl overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary-100/20 to-transparent pointer-events-none"></div>
                                <div className="p-6 border-b border-gray-100/50 flex justify-between items-center bg-white/40">
                                    <div className="flex gap-2 items-center">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">Qualitivate Analytics</div>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <div className="col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-50 transform transition-transform group-hover:scale-[1.01] hover:shadow-md">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Overall Sentiment</p>
                                                <p className="text-3xl font-bold text-gray-800">84<span className="text-lg text-green-500 ml-1">▲ +5%</span></p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="h-16 w-full flex items-end gap-2">
                                            {[40, 55, 45, 70, 65, 80, 84, 90, 85].map((val, i) => (
                                                <div key={i} className="flex-1 bg-primary-100 rounded-t-sm hover:bg-primary-300 transition-colors relative group/bar cursor-pointer" style={{ height: `${val}%` }}>
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none">
                                                        {val}%
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 flex flex-col justify-between hover:border-secondary-200 transition-colors cursor-pointer hover:shadow-md">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-secondary-50 text-secondary-600 rounded-lg">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">Response Rate</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800">92%</p>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                                            <div className="bg-secondary-500 h-1.5 rounded-full w-[92%] relative">
                                                <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 flex flex-col justify-between hover:border-accent-200 transition-colors cursor-pointer hover:shadow-md">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-accent-50 text-accent-600 rounded-lg">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">Total Feedback</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800">1,204</p>
                                        <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> 24% vs last month
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                                <div className="rounded-2xl bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6 border border-white shadow-soft relative overflow-hidden group">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary-100 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-80"></div>
                                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary-100 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-80"></div>

                                    <div className="relative z-10 grid grid-cols-2 gap-4">
                                        <div className="bg-white/80 backdrop-blur border border-white p-4 rounded-xl shadow-sm transform hover:-translate-y-1 transition-transform">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                                <Target className="w-5 h-5" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-800 mb-1">Targeting</h4>
                                            <p className="text-xs text-gray-500">Reach the right audience instantly</p>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur border border-white p-4 rounded-xl shadow-sm transform hover:-translate-y-1 transition-transform translate-y-3">
                                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                                <LineChart className="w-5 h-5" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-800 mb-1">Live Tracking</h4>
                                            <p className="text-xs text-gray-500">Real-time metrics & KPIs</p>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur border border-white p-4 rounded-xl shadow-sm transform hover:-translate-y-1 transition-transform -translate-y-2">
                                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
                                                <PieChart className="w-5 h-5" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-800 mb-1">Sentiment</h4>
                                            <p className="text-xs text-gray-500">AI-driven language analysis</p>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur border border-white p-4 rounded-xl shadow-sm transform hover:-translate-y-1 transition-transform">
                                            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-3">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-800 mb-1">Automated</h4>
                                            <p className="text-xs text-gray-500">Triggers on key milestones</p>
                                        </div>
                                    </div>
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
                        <img src="/branding/logo1.webp" alt="Qualitivate" className="h-8 w-auto object-contain" />
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

