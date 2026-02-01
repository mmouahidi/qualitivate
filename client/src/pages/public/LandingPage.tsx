import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    Activity, 
    BarChart3, 
    Ear, 
    LineChart, 
    MessageCircle, 
    Target, 
    Users, 
    Zap,
    ArrowRight,
    TrendingUp,
    ShieldAlert,
    Globe
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
                        <img src="/src/assets/images/logo.png" alt="Qualitivate" className="h-10 w-auto object-contain" />
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
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 md:mb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className={`order-2 lg:order-1 ${isRTL ? 'text-right' : ''}`}>
                            <span className="badge-primary mb-6 inline-flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                {t('hero.badge')}
                            </span>
                            <h1 className="text-5xl sm:text-6xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight">
                                {t('hero.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">{t('hero.titleHighlight')}</span>.
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
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
                        </div>
                        <div className="relative order-1 lg:order-2">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary-100/50 to-secondary-100/50 rounded-full blur-[100px] -z-10"></div>
                            <img
                                src="/src/assets/images/landing-hero.png"
                                alt="Analytics Dashboard"
                                className="w-full h-auto drop-shadow-2xl rounded-2xl border border-white/20"
                            />
                            {/* Floating Stats Card Mockup */}
                            <div className={`absolute -bottom-8 ${isRTL ? '-right-8' : '-left-8'} bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden md:block`}>
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

                {/* Agitation Section: The Cost of Silence */}
                <section className="bg-surface py-24 border-y border-border/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('agitation.title')}</h2>
                            <p className="text-gray-600 text-lg">{t('agitation.subtitle')}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { 
                                    icon: Activity, 
                                    titleKey: 'agitation.card1Title', 
                                    descKey: 'agitation.card1Desc' 
                                },
                                { 
                                    icon: ShieldAlert, 
                                    titleKey: 'agitation.card2Title', 
                                    descKey: 'agitation.card2Desc' 
                                },
                                { 
                                    icon: Users, 
                                    titleKey: 'agitation.card3Title', 
                                    descKey: 'agitation.card3Desc' 
                                }
                            ].map((card, i) => (
                                <div key={i} className="bg-background p-8 rounded-2xl border border-border hover:border-primary-200 hover:shadow-lg transition-all duration-300">
                                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-6 text-red-600">
                                        <card.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{t(card.titleKey)}</h3>
                                    <p className="text-gray-600 leading-relaxed">{t(card.descKey)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Methodology: A Smarter Way to Listen */}
                <section id="methodology" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <span className="text-primary-600 font-semibold tracking-wider text-sm uppercase mb-2 block">{t('methodology.label')}</span>
                        <h2 className="text-4xl font-bold text-gray-900">{t('methodology.title')}</h2>
                    </div>
                    
                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-gray-200 via-primary-200 to-gray-200"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {[
                                {
                                    step: '01',
                                    icon: Ear,
                                    titleKey: 'methodology.step1Title',
                                    descKey: 'methodology.step1Desc'
                                },
                                {
                                    step: '02',
                                    icon: BarChart3,
                                    titleKey: 'methodology.step2Title',
                                    descKey: 'methodology.step2Desc'
                                },
                                {
                                    step: '03',
                                    icon: Zap,
                                    titleKey: 'methodology.step3Title',
                                    descKey: 'methodology.step3Desc'
                                }
                            ].map((item, i) => (
                                <div key={i} className={`relative bg-white pt-8 md:pt-0 text-center group ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
                                    <div className="hidden md:flex absolute -top-6 left-0 md:left-1/2 md:-translate-x-1/2 w-12 h-12 bg-white border-4 border-primary-50 text-primary-600 rounded-full items-center justify-center font-bold z-10 group-hover:scale-110 transition-transform shadow-sm">
                                        {item.step}
                                    </div>
                                    <div className="md:mt-12 p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                                        <div className={`flex justify-center mb-6 ${isRTL ? 'md:justify-end' : 'md:justify-start'}`}>
                                            <div className="w-14 h-14 bg-primary-100/50 text-primary-600 rounded-xl flex items-center justify-center">
                                                <item.icon className="w-7 h-7" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{t(item.titleKey)}</h3>
                                        <p className="text-gray-600">{t(item.descKey)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features as Benefits */}
                <section id="benefits" className="bg-gray-900 text-white py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className={isRTL ? 'text-right' : ''}>
                                <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
                                    {t('benefits.title')} <br/>
                                    <span className="text-primary-400">{t('benefits.titleHighlight')}</span>.
                                </h2>
                                <div className="space-y-8">
                                    {[
                                        {
                                            icon: Target,
                                            titleKey: 'benefits.feat1Title',
                                            descKey: 'benefits.feat1Desc'
                                        },
                                        {
                                            icon: LineChart,
                                            titleKey: 'benefits.feat2Title',
                                            descKey: 'benefits.feat2Desc'
                                        },
                                        {
                                            icon: MessageCircle,
                                            titleKey: 'benefits.feat3Title',
                                            descKey: 'benefits.feat3Desc'
                                        }
                                    ].map((feat, i) => (
                                        <div key={i} className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <div className="flex-shrink-0 mt-1">
                                                <feat.icon className="w-6 h-6 text-primary-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold mb-2">{t(feat.titleKey)}</h4>
                                                <p className="text-gray-300 leading-relaxed">{t(feat.descKey)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                                {/* Abstract UI Representation */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between pb-6 border-b border-gray-700">
                                        <div>
                                            <div className="h-4 w-32 bg-gray-600 rounded mb-2"></div>
                                            <div className="h-3 w-24 bg-gray-700 rounded"></div>
                                        </div>
                                        <div className="h-8 w-24 bg-primary-600 rounded"></div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-24 bg-gray-700/50 rounded-xl p-4 flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-3/4 bg-gray-600 rounded"></div>
                                                <div className="h-3 w-1/2 bg-gray-600 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="h-24 bg-gray-700/50 rounded-xl p-4 flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-3/4 bg-gray-600 rounded"></div>
                                                <div className="h-3 w-1/2 bg-gray-600 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="h-24 bg-gray-700/50 rounded-xl p-4 flex gap-4 items-center border-l-4 border-primary-500 bg-gray-700">
                                            <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-3/4 bg-gray-400 rounded"></div>
                                                <div className="h-3 w-1/2 bg-gray-500 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Social Proof / Trust */}
                <section className="py-20 bg-surface">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-gray-600 font-medium tracking-wide uppercase mb-12">{t('trust.label')}</p>
                        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60">
                            {/* In a real scenario, these would be client logos */}
                            <span className="text-2xl font-bold font-serif text-gray-800">Acme Corp</span>
                            <span className="text-2xl font-bold font-mono text-gray-800">Globex</span>
                            <span className="text-2xl font-bold text-gray-800 italic">Soylent</span>
                            <span className="text-2xl font-bold text-gray-800 tracking-tighter">Umbrella Inc</span>
                            <span className="text-2xl font-bold font-serif text-gray-800">Initech</span>
                        </div>
                    </div>
                </section>

                {/* CTA / Footer Hook */}
                <section className="py-32 bg-background border-t border-border">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                            {t('cta.title')} <br className="hidden md:block" /> {t('cta.titleLine2')}
                        </h2>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                            {t('cta.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/book-demo" className="btn-primary text-xl px-10 py-5 shadow-xl shadow-primary-500/20 hover:shadow-primary-500/30">
                                {t('cta.button')}
                            </Link>
                        </div>
                        <p className="mt-8 text-sm text-gray-500">
                            {t('cta.note')}
                        </p>
                    </div>
                </section>
            </main>

            <footer className="bg-white border-t border-border py-12">
                <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-2">
                        <img src="/src/assets/images/logo.png" alt="Qualitivate" className="h-8 w-auto object-contain" />
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
