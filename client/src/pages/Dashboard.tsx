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
    ChevronRight,
    Users,
    Globe,
    Activity,
    Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout';
import { surveyService } from '../services/survey.service';
import responseService from '../services/response.service';
import analyticsService, { RoleDashboardData } from '../services/analytics.service';

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Check if user is an admin (not a regular user)
    const isAdmin = user?.role && user.role !== 'user';

    // Fetch role-specific dashboard data
    const { data: dashboardData, isLoading: dashboardLoading } = useQuery<RoleDashboardData>({
        queryKey: ['role-dashboard'],
        queryFn: () => analyticsService.getRoleDashboard(),
        enabled: isAdmin
    });

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

    // Build dynamic stats based on role
    const buildStats = () => {
        if (!dashboardData?.stats) return [];
        
        const s = dashboardData.stats;
        
        if (dashboardData.role === 'super_admin') {
            return [
                { label: 'Total Companies', value: s.totalCompanies?.toString() || '0', icon: Building2, color: 'bg-purple-100 text-purple-600' },
                { label: 'Total Users', value: s.totalUsers?.toString() || '0', icon: Users, color: 'bg-blue-100 text-blue-600' },
                { label: 'Active Surveys', value: s.activeSurveys?.toString() || '0', icon: ClipboardList, color: 'bg-green-100 text-green-600' },
                { label: 'Total Responses', value: s.totalResponses?.toString() || '0', icon: Activity, color: 'bg-amber-100 text-amber-600' },
                { label: 'Completion Rate', value: `${s.completionRate || 0}%`, icon: Target, color: 'bg-teal-100 text-teal-600' },
            ];
        }
        
        if (dashboardData.role === 'company_admin') {
            return [
                { label: 'Sites', value: s.totalSites?.toString() || '0', icon: Building2, color: 'bg-purple-100 text-purple-600' },
                { label: 'Users', value: `${s.activeUsers || 0}/${s.totalUsers || 0}`, icon: Users, color: 'bg-blue-100 text-blue-600' },
                { label: 'Active Surveys', value: s.activeSurveys?.toString() || '0', icon: ClipboardList, color: 'bg-green-100 text-green-600' },
                { label: 'Responses', value: s.completedResponses?.toString() || '0', icon: Activity, color: 'bg-amber-100 text-amber-600' },
                { label: 'Completion Rate', value: `${s.completionRate || 0}%`, icon: Target, color: 'bg-teal-100 text-teal-600' },
                { label: 'NPS Score', value: s.npsScore !== null ? s.npsScore?.toString() : '—', icon: TrendingUp, color: s.npsScore && s.npsScore > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600' },
            ];
        }
        
        if (dashboardData.role === 'site_admin') {
            return [
                { label: 'Site Users', value: `${s.activeUsers || 0}/${s.siteUsers || 0}`, icon: Users, color: 'bg-blue-100 text-blue-600' },
                { label: 'Active Surveys', value: s.activeSurveys?.toString() || '0', icon: ClipboardList, color: 'bg-green-100 text-green-600' },
                { label: 'Responses', value: s.completedResponses?.toString() || '0', icon: Activity, color: 'bg-amber-100 text-amber-600' },
                { label: 'Completion Rate', value: `${s.completionRate || 0}%`, icon: Target, color: 'bg-teal-100 text-teal-600' },
            ];
        }
        
        if (dashboardData.role === 'department_admin') {
            return [
                { label: 'Dept Users', value: `${s.activeUsers || 0}/${s.departmentUsers || 0}`, icon: Users, color: 'bg-blue-100 text-blue-600' },
                { label: 'Available Surveys', value: s.availableSurveys?.toString() || '0', icon: ClipboardList, color: 'bg-green-100 text-green-600' },
                { label: 'Responses', value: s.completedResponses?.toString() || '0', icon: Activity, color: 'bg-amber-100 text-amber-600' },
                { label: 'Completion Rate', value: `${s.completionRate || 0}%`, icon: Target, color: 'bg-teal-100 text-teal-600' },
            ];
        }
        
        return [];
    };

    const dynamicStats = buildStats();

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
                    {/* Dynamic Stats Grid */}
                    {dashboardLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="stat-card animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
                            {dynamicStats.map((stat, index) => (
                                <div key={index} className="stat-card">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="stat-card-label">{stat.label}</span>
                                        <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                                            <stat.icon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <span className="stat-card-value text-2xl">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Role-Specific Panels */}
                    {dashboardData?.role === 'super_admin' && dashboardData.companyLeaderboard && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Company Leaderboard */}
                            <div className="card-soft">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-primary-600" /> Top Companies
                                </h2>
                                <div className="space-y-3">
                                    {dashboardData.companyLeaderboard.slice(0, 5).map((company, i) => (
                                        <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                                                    {i + 1}
                                                </span>
                                                <span className="font-medium">{company.name}</span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {company.surveyCount} surveys · {company.responseCount} responses
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Platform Stats */}
                            <div className="card-soft">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-accent-600" /> Platform Overview
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-green-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-green-700">{dashboardData.stats.activeUsers || 0}</p>
                                        <p className="text-sm text-green-600">Active Users</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-blue-700">{dashboardData.stats.totalSurveys || 0}</p>
                                        <p className="text-sm text-blue-600">Total Surveys</p>
                                    </div>
                                    <div className="p-4 bg-amber-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-amber-700">{dashboardData.stats.completedResponses || 0}</p>
                                        <p className="text-sm text-amber-600">Completed</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-purple-700">{dashboardData.stats.completionRate || 0}%</p>
                                        <p className="text-sm text-purple-600">Completion Rate</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {dashboardData?.role === 'company_admin' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Top Surveys */}
                            {dashboardData.topSurveys && dashboardData.topSurveys.length > 0 && (
                                <div className="card-soft">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5 text-primary-600" /> Top Surveys
                                    </h2>
                                    <div className="space-y-3">
                                        {dashboardData.topSurveys.map((survey) => (
                                            <Link
                                                key={survey.id}
                                                to={`/analytics/survey/${survey.id}`}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors"
                                            >
                                                <div>
                                                    <span className="font-medium">{survey.title}</span>
                                                    {survey.type && (
                                                        <span className="ml-2 badge-primary text-xs">{survey.type.toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {survey.completedCount || survey.responseCount} responses
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Site Breakdown */}
                            {dashboardData.siteBreakdown && dashboardData.siteBreakdown.length > 0 && (
                                <div className="card-soft">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-accent-600" /> Sites
                                    </h2>
                                    <div className="space-y-3">
                                        {dashboardData.siteBreakdown.map((site) => (
                                            <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="font-medium">{site.name}</span>
                                                <span className="text-sm text-gray-600">{site.userCount} users</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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
