import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
    TrendingUp, 
    TrendingDown, 
    ClipboardList, 
    BarChart3, 
    Building2, 
    CheckCircle2,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout';
import { surveyService } from '../services/survey.service';
import responseService from '../services/response.service';

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Check if user is an admin (not a regular user)
    const isAdmin = user?.role && user.role !== 'user';

    // Fetch surveys for regular users
    const { data: surveysData, isLoading: surveysLoading } = useQuery({
        queryKey: ['user-surveys'],
        queryFn: () => surveyService.list({ status: 'active', limit: 10 }),
        enabled: !isAdmin
    });

    // Fetch user's completed surveys
    const { data: completedData, isLoading: completedLoading } = useQuery({
        queryKey: ['user-completed-surveys'],
        queryFn: () => responseService.getUserCompletedSurveys(),
        enabled: !isAdmin
    });

    const completedSurveys = completedData?.data || [];
    const completedSurveyIds = completedSurveys.map((s: any) => s.id);

    // Filter out expired and already completed surveys
    const pendingSurveys = (surveysData?.data || []).filter((survey: any) => {
        if (completedSurveyIds.includes(survey.id)) return false; // Already completed
        if (!survey.endsAt && !survey.ends_at) return true; // No deadline
        const deadline = new Date(survey.endsAt || survey.ends_at);
        return deadline > new Date();
    });

    const stats = [
        { labelKey: 'dashboard.stats.totalSurveys', value: '12', change: '+2', positive: true },
        { labelKey: 'dashboard.stats.activeResponses', value: '248', change: '+18%', positive: true },
        { labelKey: 'dashboard.stats.npsScore', value: '67', change: '+5', positive: true },
        { labelKey: 'dashboard.stats.responseRate', value: '78%', change: '-2%', positive: false },
    ];

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {t('dashboard.welcome')}{user?.firstName ? `, ${user.firstName}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}
                </h1>
                <p className="text-gray-600 mt-1">
                    {isAdmin
                        ? t('dashboard.adminSubtitle')
                        : t('dashboard.userSubtitle')}
                </p>
            </div>

            {/* Admin Dashboard */}
            {isAdmin ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-card">
                                <span className="stat-card-label">{t(stat.labelKey)}</span>
                                <span className="stat-card-value">{stat.value}</span>
                                <span className={`stat-card-change ${stat.positive ? 'positive' : 'negative'}`}>
                                    {stat.positive ? (
                                        <TrendingUp className="w-4 h-4" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4" />
                                    )}
                                    {stat.change} {t('dashboard.fromLastMonth')}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                        <Link to="/surveys" className="card-soft group cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-soft flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                                    <ClipboardList className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{t('dashboard.manageSurveys')}</h3>
                                    <p className="text-sm text-gray-600">{t('dashboard.manageSurveysDesc')}</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/analytics" className="card-soft group cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-accent-100 rounded-soft flex items-center justify-center group-hover:bg-accent-200 transition-colors">
                                    <BarChart3 className="w-6 h-6 text-accent-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{t('dashboard.viewAnalytics')}</h3>
                                    <p className="text-sm text-gray-600">{t('dashboard.viewAnalyticsDesc')}</p>
                                </div>
                            </div>
                        </Link>

                        {(user?.role === 'super_admin' || user?.role === 'company_admin') && (
                            <Link to="/sites" className="card-soft group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-soft flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                        <Building2 className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{t('dashboard.manageSites')}</h3>
                                        <p className="text-sm text-gray-600">{t('dashboard.manageSitesDesc')}</p>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="card-soft">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h2>
                        <div className="text-center py-8 text-gray-600">
                            <img
                                src="/src/assets/images/dashboard-empty.png"
                                alt="Empty Dashboard"
                                className="w-64 h-auto mx-auto mb-6 opacity-80"
                            />
                            <h3 className="text-lg font-medium text-gray-900">{t('dashboard.noActivity')}</h3>
                            <p className="mt-1">{t('dashboard.emptyDashboard')}</p>
                            <p className="text-sm mt-1">{t('dashboard.startBySurvey')}</p>
                            <Link to="/surveys" className="btn-primary mt-4 inline-flex">
                                {t('dashboard.createSurvey')}
                            </Link>
                        </div>
                    </div>
                </>
            ) : (
                /* Regular User Dashboard */
                <div className="space-y-6">
                    {/* Pending Surveys Card */}
                    <div className="card-soft">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <ClipboardList className="w-6 h-6 text-blue-600" /> {t('dashboard.pendingSurveys')}
                        </h2>
                        {surveysLoading ? (
                            <div className="text-center py-8 text-gray-600">
                                <p>{t('dashboard.loadingSurveys')}</p>
                            </div>
                        ) : pendingSurveys.length > 0 ? (
                            <div className="space-y-3">
                                {pendingSurveys.map((survey: any) => (
                                    <Link
                                        key={survey.id}
                                        to={`/survey/${survey.id}/take`}
                                        className="block p-4 bg-background rounded-lg border border-border hover:border-primary-300 hover:bg-primary-50 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900 group-hover:text-primary-600">
                                                    {survey.title}
                                                </h3>
                                                {survey.description && (
                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                                        {survey.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="badge-primary text-xs">{survey.type?.toUpperCase()}</span>
                                                    {survey.questions?.length && (
                                                        <span className="text-xs text-text-muted">{survey.questions.length} questions</span>
                                                    )}
                                                    {survey.ends_at && (
                                                        <span className={`text-xs ${new Date(survey.ends_at) < new Date() ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                                                            ⏰ {new Date(survey.ends_at) < new Date()
                                                                ? 'Expired'
                                                                : `Due ${new Date(survey.ends_at).toLocaleDateString()}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-primary-600 group-hover:translate-x-1 transition-transform">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-600">
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ClipboardList className="w-8 h-8 text-primary-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">{t('dashboard.noPendingSurveys')}</h3>
                                <p className="mt-1">{t('dashboard.allCaughtUp')}</p>
                                <p className="text-sm mt-1">{t('dashboard.surveysWillAppear')}</p>
                            </div>
                        )}
                    </div>

                    {/* Completed Surveys */}
                    <div className="card-soft">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-green-600" /> {t('dashboard.recentlyCompleted')}
                        </h2>
                        {completedLoading ? (
                            <div className="text-center py-8 text-gray-500">{t('dashboard.loading')}</div>
                        ) : completedSurveys.length > 0 ? (
                            <div className="space-y-3">
                                {completedSurveys.slice(0, 5).map((survey: any) => (
                                    <div key={survey.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{survey.title}</h4>
                                            <p className="text-sm text-gray-500">
                                                Completed {new Date(survey.completedAt || survey.completed_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className="badge-success text-xs">✓ Done</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>{t('dashboard.noCompletedSurveys')}</p>
                                <p className="text-sm mt-1">{t('dashboard.completedWillAppear')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Dashboard;
