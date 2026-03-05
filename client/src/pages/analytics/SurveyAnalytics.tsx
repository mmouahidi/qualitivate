import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import analyticsService, { SurveyAnalytics, QuestionAnalytics, PaginatedResponses, TaxonomyReport, RespondentInsights } from '../../services/analytics.service';
import { DashboardLayout } from '../../components/layout';
import TaxonomyReportView from '../../components/analytics/TaxonomyReport';
import FoodSafetyCultureReport from '../../components/analytics/FoodSafetyCultureReport';

// Horizontal bar chart for insight breakdown
const InsightBarChart: React.FC<{ items: Array<{ name: string; count: number; percentage: number }>; color?: string }> = ({ items, color = 'bg-primary-500' }) => {
  if (items.length === 0) return <p className="text-sm text-text-muted py-2">No data</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <span className="w-28 text-sm text-text-secondary truncate flex-shrink-0" title={item.name}>{item.name}</span>
          <div className="flex-1 bg-background rounded-full h-5">
            <div
              className={`${color} h-5 rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
              style={{ width: `${Math.max(item.percentage, 3)}%` }}
            >
              {item.percentage >= 10 && <span className="text-xs text-white font-medium">{item.count}</span>}
            </div>
          </div>
          <span className="w-12 text-sm text-text-secondary text-right flex-shrink-0">{item.percentage}%</span>
        </div>
      ))}
    </div>
  );
};

const InsightCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="card-soft">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
    </div>
    {children}
  </div>
);

const RespondentInsightsView: React.FC<{ data: RespondentInsights }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Summary stat */}
      <div className="card-soft bg-gradient-to-r from-primary-50 to-primary-100/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary-700">{data.totalRespondents}</p>
            <p className="text-sm text-primary-600">Total Respondents with Metadata</p>
          </div>
        </div>
      </div>

      {/* Row 1: Devices, Browsers, OS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InsightCard
          title="Device Types"
          icon={<svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
        >
          {data.deviceTypes.length > 0 ? (
            <div className="space-y-3">
              {data.deviceTypes.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {d.name === 'mobile' ? '\uD83D\uDCF1' : d.name === 'tablet' ? '\uD83D\uDCBB' : '\uD83D\uDDA5\uFE0F'}
                    </span>
                    <span className="text-sm font-medium text-text-primary capitalize">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{d.count}</span>
                    <span className="text-xs text-text-muted">({d.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-text-muted">No data</p>}
        </InsightCard>

        <InsightCard
          title="Browsers"
          icon={<svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}
        >
          <InsightBarChart items={data.browsers} color="bg-orange-500" />
        </InsightCard>

        <InsightCard
          title="Operating Systems"
          icon={<svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        >
          <InsightBarChart items={data.operatingSystems} color="bg-green-500" />
        </InsightCard>
      </div>

      {/* Row 2: Countries & Languages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightCard
          title="Countries"
          icon={<svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        >
          <InsightBarChart items={data.countries} color="bg-indigo-500" />
        </InsightCard>

        <InsightCard
          title="Languages"
          icon={<svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>}
        >
          <InsightBarChart items={data.languages} color="bg-purple-500" />
        </InsightCard>
      </div>

      {/* Row 3: Screen Sizes & Touch/Connection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InsightCard
          title="Screen Sizes"
          icon={<svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>}
        >
          <InsightBarChart items={data.screenSizes} color="bg-cyan-500" />
        </InsightCard>

        <InsightCard
          title="Touch vs Non-Touch"
          icon={<svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>}
        >
          {data.touchBreakdown.length > 0 ? (
            <div className="space-y-3">
              {data.touchBreakdown.map((t) => (
                <div key={t.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{t.count}</span>
                    <span className="text-xs text-text-muted">({t.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-text-muted">No data</p>}
        </InsightCard>

        <InsightCard
          title="Connection Types"
          icon={<svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" /></svg>}
        >
          <InsightBarChart items={data.connectionTypes} color="bg-yellow-500" />
        </InsightCard>
      </div>

      {/* Row 4: Traffic Sources */}
      {(data.referrers.length > 0 || data.utmSources.length > 0 || data.utmCampaigns.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InsightCard
            title="Top Referrers"
            icon={<svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
          >
            <InsightBarChart items={data.referrers} color="bg-red-500" />
          </InsightCard>

          <InsightCard
            title="UTM Sources"
            icon={<svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>}
          >
            <InsightBarChart items={data.utmSources} color="bg-emerald-500" />
          </InsightCard>

          <InsightCard
            title="UTM Campaigns"
            icon={<svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
          >
            <InsightBarChart items={data.utmCampaigns} color="bg-amber-500" />
          </InsightCard>
        </div>
      )}

      {/* Row 5: Timezones */}
      {data.timezones.length > 0 && (
        <InsightCard
          title="Timezones"
          icon={<svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        >
          <InsightBarChart items={data.timezones} color="bg-slate-500" />
        </InsightCard>
      )}
    </div>
  );
};

const SurveyAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { surveyId } = useParams<{ surveyId: string }>();
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics | null>(null);
  const [responses, setResponses] = useState<PaginatedResponses | null>(null);
  const [taxonomyReport, setTaxonomyReport] = useState<TaxonomyReport | null>(null);
  const [taxonomyLoaded, setTaxonomyLoaded] = useState(false);
  const [respondentInsights, setRespondentInsights] = useState<RespondentInsights | null>(null);
  const [respondentInsightsLoaded, setRespondentInsightsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'overview' | 'questions' | 'responses' | 'quality' | 'respondents'>('report');
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
    } else if (activeTab === 'quality' && !taxonomyLoaded && surveyId) {
      loadTaxonomyReport();
    } else if (activeTab === 'report' && !taxonomyLoaded && surveyId) {
      loadTaxonomyReport();
    } else if (activeTab === 'respondents' && !respondentInsightsLoaded && surveyId) {
      loadRespondentInsights();
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

  const loadTaxonomyReport = async () => {
    try {
      const data = await analyticsService.getTaxonomyReport(surveyId!);
      setTaxonomyReport(data);
    } catch (err: any) {
      console.error('Failed to load taxonomy report:', err);
      setTaxonomyReport({ overall: { score: 0, grade: 'N/A', benchmark: null, previousGrade: null, change: null, respondentCount: 0 }, categories: [] });
    } finally {
      setTaxonomyLoaded(true);
    }
  };

  const loadRespondentInsights = async () => {
    try {
      const data = await analyticsService.getRespondentInsights(surveyId!);
      setRespondentInsights(data);
    } catch (err) {
      console.error('Failed to load respondent insights:', err);
    } finally {
      setRespondentInsightsLoaded(true);
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
          {activeTab !== 'report' && (
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
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            {(['report', 'overview', 'quality', 'questions', 'responses', 'respondents'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                {tab === 'report' ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Assessment Report
                  </span>
                ) : tab === 'respondents' ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Respondents
                  </span>
                ) : tab === 'quality' ? 'Quality Report' : t(`analytics.${tab}`)}
              </button>
            ))}
          </nav>
        </div>

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div>
            {!taxonomyLoaded ? (
              <div className="text-center py-8">
                <div className="spinner spinner-lg text-primary-600 mx-auto"></div>
              </div>
            ) : taxonomyReport && taxonomyReport.categories.length > 0 ? (
              <FoodSafetyCultureReport
                taxonomy={taxonomyReport}
                analytics={analytics}
                onExport={handleExport}
                exporting={exporting}
              />
            ) : (
              <div className="card-soft text-center py-12">
                <svg className="w-16 h-16 mx-auto text-text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Assessment Data Available</h3>
                <p className="text-text-secondary max-w-md mx-auto">
                  To generate a Food Safety Culture Assessment Report, classify your survey questions by assigning
                  a Category and Dimension in the survey builder's Configuration panel.
                </p>
              </div>
            )}
          </div>
        )}

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

        {/* Quality Report Tab */}
        {activeTab === 'quality' && (
          <div>
            {!taxonomyLoaded ? (
              <div className="text-center py-8">
                <div className="spinner spinner-lg text-primary-600 mx-auto"></div>
              </div>
            ) : taxonomyReport && taxonomyReport.categories.length > 0 ? (
              <TaxonomyReportView data={taxonomyReport} />
            ) : (
              <div className="card-soft text-center py-12">
                <svg className="w-16 h-16 mx-auto text-text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Classification Data</h3>
                <p className="text-text-secondary max-w-md mx-auto">
                  To generate a quality report, classify your survey questions by assigning a Category and Dimension
                  in the survey builder's Configuration panel.
                </p>
              </div>
            )}
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

        {/* Respondents Tab */}
        {activeTab === 'respondents' && (
          <div>
            {!respondentInsightsLoaded ? (
              <div className="text-center py-8">
                <div className="spinner spinner-lg text-primary-600 mx-auto"></div>
              </div>
            ) : respondentInsights && respondentInsights.totalRespondents > 0 ? (
              <RespondentInsightsView data={respondentInsights} />
            ) : (
              <div className="card-soft text-center py-12">
                <svg className="w-16 h-16 mx-auto text-text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Respondent Data Yet</h3>
                <p className="text-text-secondary max-w-md mx-auto">
                  Respondent metadata will appear here once people start taking your survey.
                  Data includes device type, browser, location, screen size, and more.
                </p>
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
