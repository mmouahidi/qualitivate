import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import analyticsService, { CompanyAnalytics } from '../../services/analytics.service';
import { DashboardLayout } from '../../components/layout';

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<CompanyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
      const data = await analyticsService.getCompanyAnalytics(startDate, endDate);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getNPSColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 50) return 'text-green-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNPSLabel = (score: number | null) => {
    if (score === null) return 'N/A';
    if (score >= 50) return 'Excellent';
    if (score >= 30) return 'Good';
    if (score >= 0) return 'Average';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <DashboardLayout title="Analytics">
        <div className="flex items-center justify-center py-12">
          <div className="spinner spinner-lg border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Analytics">
        <div className="alert-error">
          <p>{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) return null;

  return (
    <DashboardLayout
      title="Analytics Dashboard"
      subtitle="Overview of your surveys and responses"
      headerActions={
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="select-soft"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      }
    >
      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="card-soft hover-lift group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Surveys</p>
              <p className="text-3xl font-bold text-text-primary mt-1">{analytics.surveys.total}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {analytics.surveys.active} active
            </span>
            <span className="text-text-secondary">{analytics.surveys.draft} draft</span>
            <span className="text-text-muted">{analytics.surveys.closed} closed</span>
          </div>
        </div>

        <div className="card-soft hover-lift group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Total Responses</p>
              <p className="text-3xl font-bold text-text-primary mt-1">{analytics.responses.total}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {analytics.responses.completed} completed
            </span>
          </div>
        </div>

        <div className="card-soft hover-lift group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Completion Rate</p>
              <p className="text-3xl font-bold text-text-primary mt-1">{analytics.responses.completionRate}%</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${analytics.responses.completionRate}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        </div>

        <div className="card-soft hover-lift group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Overall NPS</p>
              <p className={`text-3xl font-bold mt-1 ${getNPSColor(analytics.overallNps)}`}>
                {analytics.overallNps !== null ? analytics.overallNps : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-text-secondary">{getNPSLabel(analytics.overallNps)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
        {/* Top Surveys */}
        <div className="card-soft p-0">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">Top Performing Surveys</h2>
          </div>
          <div className="p-6">
            {analytics.topSurveys.length === 0 ? (
              <p className="text-text-secondary text-center py-4">No surveys yet</p>
            ) : (
              <div className="space-y-4">
                {analytics.topSurveys.map((survey, index) => (
                  <Link
                    key={survey.id}
                    to={`/analytics/surveys/${survey.id}`}
                    className="flex items-center justify-between p-4 rounded-soft hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-semibold text-sm mr-4">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-text-primary">{survey.title}</p>
                        <p className="text-sm text-text-secondary capitalize">{survey.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-text-primary">{survey.responseCount}</p>
                      <p className="text-sm text-text-secondary">responses</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Response Trend */}
        {analytics.trend.length > 0 && (
          <div className="card-soft p-0">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">Response Trend</h2>
            </div>
            <div className="p-6">
              <div className="h-48 flex items-end gap-1">
                {analytics.trend.map((day, i) => {
                  const maxCount = Math.max(...analytics.trend.map(d => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary-500 rounded-t hover:bg-primary-600 cursor-pointer group relative"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        {new Date(day.date).toLocaleDateString()}: {day.count}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-text-secondary">
                <span>{analytics.trend.length > 0 && new Date(analytics.trend[0].date).toLocaleDateString()}</span>
                <span>{analytics.trend.length > 0 && new Date(analytics.trend[analytics.trend.length - 1].date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsDashboard;
