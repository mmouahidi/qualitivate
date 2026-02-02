import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import analyticsService, { SurveyAnalytics, QuestionAnalytics, PaginatedResponses } from '../../services/analytics.service';
import { DashboardLayout } from '../../components/layout';

const SurveyAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { surveyId } = useParams<{ surveyId: string }>();
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics | null>(null);
  const [responses, setResponses] = useState<PaginatedResponses | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'responses'>('overview');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (surveyId) {
      loadAnalytics();
    }
  }, [surveyId]);

  useEffect(() => {
    if (activeTab === 'questions' && !questionAnalytics && surveyId) {
      loadQuestionAnalytics();
    } else if (activeTab === 'responses' && surveyId) {
      loadResponses(currentPage);
    }
  }, [activeTab, surveyId, currentPage]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getSurveyAnalytics(surveyId!);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionAnalytics = async () => {
    try {
      const data = await analyticsService.getQuestionAnalytics(surveyId!);
      setQuestionAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load question analytics:', err);
    }
  };

  const loadResponses = async (page: number) => {
    try {
      const data = await analyticsService.getResponses(surveyId!, { page, limit: 20 });
      setResponses(data);
    } catch (err: any) {
      console.error('Failed to load responses:', err);
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    if (!surveyId) return;
    
    setExporting(true);
    try {
      if (format === 'pdf') {
        const blob = await analyticsService.exportPDFReport(surveyId);
        analyticsService.downloadPDF(blob, `${analytics?.survey.title || 'survey'}_Analytics_Report.pdf`);
      } else if (format === 'csv') {
        const blob = await analyticsService.exportResponses(surveyId, 'csv');
        analyticsService.downloadCSV(blob, `${analytics?.survey.title || 'survey'}_responses.csv`);
      } else {
        const data = await analyticsService.exportResponses(surveyId, 'json');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        analyticsService.downloadCSV(blob, `${analytics?.survey.title || 'survey'}_responses.json`);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getNPSColor = (score: number) => {
    if (score >= 50) return 'text-green-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="spinner spinner-lg text-primary-600 mx-auto"></div>
          <p className="mt-2 text-text-secondary">{t('common.loading')}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="alert-error">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/analytics" className="text-sm text-text-secondary hover:text-primary-600 mb-2 inline-flex items-center gap-1 transition-colors">
              ← {t('analytics.backToAnalytics')}
            </Link>
            <h1 className="text-2xl font-bold text-text-primary">{analytics.survey.title}</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className={`badge ${
                analytics.survey.status === 'active' ? 'badge-success' :
                analytics.survey.status === 'draft' ? 'badge-warning' :
                'badge-neutral'
              }`}>
                {analytics.survey.status}
              </span>
              <span className="text-sm text-text-secondary">{analytics.questionCount} {t('survey.questions')}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? t('analytics.generating') : t('analytics.exportPdf')}
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="btn-secondary"
            >
              {t('analytics.exportCsv')}
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="btn-secondary"
            >
              {t('analytics.exportJson')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            {(['overview', 'questions', 'responses'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                {t(`analytics.${tab}`)}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card">
                <span className="stat-card-label">{t('analytics.totalResponses')}</span>
                <span className="stat-card-value">{analytics.overview.totalResponses}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">{t('analytics.completedResponses')}</span>
                <span className="stat-card-value text-green-600">{analytics.overview.completedResponses}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">{t('analytics.completionRate')}</span>
                <span className="stat-card-value text-primary-600">{analytics.overview.completionRate}%</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">{t('analytics.avgCompletionTime')}</span>
                <span className="stat-card-value">{formatDuration(analytics.overview.avgCompletionTimeSeconds)}</span>
              </div>
            </div>

            {analytics.nps && (
              <div className="card-soft">
                <h3 className="text-lg font-medium text-text-primary mb-4">{t('analytics.npsScore')}</h3>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className={`text-5xl font-bold ${getNPSColor(analytics.nps.score)}`}>{analytics.nps.score}</p>
                    <p className="text-sm text-text-secondary mt-1">{t('analytics.overallNps')}</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-sm text-text-secondary">{t('analytics.promoters')}</span>
                      <div className="flex-1 bg-background rounded-full h-4">
                        <div className="bg-green-500 h-4 rounded-full" style={{ width: `${analytics.nps.promoters.percentage}%` }}></div>
                      </div>
                      <span className="w-12 text-sm text-text-secondary">{analytics.nps.promoters.percentage}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-sm text-text-secondary">{t('analytics.passives')}</span>
                      <div className="flex-1 bg-background rounded-full h-4">
                        <div className="bg-yellow-500 h-4 rounded-full" style={{ width: `${analytics.nps.passives.percentage}%` }}></div>
                      </div>
                      <span className="w-12 text-sm text-text-secondary">{analytics.nps.passives.percentage}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-sm text-text-secondary">{t('analytics.detractors')}</span>
                      <div className="flex-1 bg-background rounded-full h-4">
                        <div className="bg-red-500 h-4 rounded-full" style={{ width: `${analytics.nps.detractors.percentage}%` }}></div>
                      </div>
                      <span className="w-12 text-sm text-text-secondary">{analytics.nps.detractors.percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {analytics.trend.length > 0 && (
              <div className="card-soft">
                <h3 className="text-lg font-medium text-text-primary mb-4">{t('analytics.responseTrend')}</h3>
                <div className="h-48 flex items-end gap-1">
                  {analytics.trend.map((day, i) => {
                    const maxCount = Math.max(...analytics.trend.map(d => d.count));
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-primary-500 rounded-t hover:bg-primary-600 cursor-pointer group relative transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                          {new Date(day.date).toLocaleDateString()}: {day.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="card-soft">
              <h3 className="text-lg font-medium text-text-primary mb-4">{t('analytics.responses')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-soft">
                  <p className="text-2xl font-bold text-green-600">{analytics.overview.completedResponses}</p>
                  <p className="text-sm text-green-800">{t('analytics.completedResponses')}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-soft">
                  <p className="text-2xl font-bold text-yellow-600">{analytics.overview.inProgressResponses}</p>
                  <p className="text-sm text-yellow-800">{t('analytics.inProgress')}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-soft">
                  <p className="text-2xl font-bold text-red-600">{analytics.overview.abandonedResponses}</p>
                  <p className="text-sm text-red-800">{t('analytics.abandoned')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {questionAnalytics?.questions.map((q, index) => (
              <div key={q.questionId} className="card-soft">
                <div className="mb-4">
                  <p className="text-sm text-text-secondary">{t('survey.questionNumber', { number: index + 1 })}</p>
                  <h4 className="text-lg font-medium text-text-primary">{q.questionText}</h4>
                  <p className="text-sm text-text-muted">{q.type.replace('_', ' ')} • {q.totalAnswers} {t('surveys.responses')}</p>
                </div>

                {(q.type === 'multiple_choice' || q.type === 'nps' || q.type === 'rating_scale') && (
                  <div className="space-y-2">
                    {Object.entries(q.distribution).map(([key, value]) => {
                      const count = typeof value === 'number' ? value : 0;
                      const percentage = q.totalAnswers > 0 ? Math.round((count / q.totalAnswers) * 100) : 0;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="w-20 text-sm text-text-secondary truncate">{key}</span>
                          <div className="flex-1 bg-background rounded-full h-6">
                            <div
                              className="bg-primary-500 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            >
                              <span className="text-xs text-white font-medium">{count}</span>
                            </div>
                          </div>
                          <span className="w-12 text-sm text-text-secondary text-right">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.stats && (
                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                    {q.stats.average !== undefined && (
                      <div>
                        <p className="text-sm text-text-secondary">Average</p>
                        <p className="text-lg font-semibold text-text-primary">{q.stats.average}</p>
                      </div>
                    )}
                    {q.stats.min !== undefined && (
                      <div>
                        <p className="text-sm text-text-secondary">Min</p>
                        <p className="text-lg font-semibold text-text-primary">{q.stats.min}</p>
                      </div>
                    )}
                    {q.stats.max !== undefined && (
                      <div>
                        <p className="text-sm text-text-secondary">Max</p>
                        <p className="text-lg font-semibold text-text-primary">{q.stats.max}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {!questionAnalytics && (
              <div className="text-center py-8">
                <div className="spinner spinner-lg text-primary-600 mx-auto"></div>
              </div>
            )}
          </div>
        )}

        {/* Responses Tab */}
        {activeTab === 'responses' && (
          <div className="card-soft overflow-hidden p-0">
            <table className="table-soft">
              <thead>
                <tr>
                  <th>Respondent</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {responses?.responses.map((response) => (
                  <tr key={response.id}>
                    <td>{response.respondentEmail || 'Anonymous'}</td>
                    <td>
                      <span className={`badge ${
                        response.status === 'completed' ? 'badge-success' :
                        response.status === 'in_progress' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {response.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-text-secondary">
                      {response.answeredQuestions}/{response.totalQuestions} ({response.completionPercentage}%)
                    </td>
                    <td className="text-text-secondary">{new Date(response.startedAt).toLocaleString()}</td>
                    <td className="text-text-secondary">{response.completedAt ? new Date(response.completedAt).toLocaleString() : '-'}</td>
                    <td>
                      <Link to={`/analytics/responses/${response.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {responses && responses.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  Page {currentPage} of {responses.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(responses.pagination.totalPages, p + 1))}
                    disabled={currentPage === responses.pagination.totalPages}
                    className="btn-secondary text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SurveyAnalyticsPage;
