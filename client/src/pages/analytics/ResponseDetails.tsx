import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import analyticsService, { ResponseDetails, RespondentMetadata } from '../../services/analytics.service';
import { DashboardLayout } from '../../components/layout';

const MetadataField: React.FC<{ label: string; value?: string | number | boolean | null }> = ({ label, value }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <dt className="text-sm font-medium text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm text-text-primary">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</dd>
    </div>
  );
};

const RespondentMetadataPanel: React.FC<{ metadata: RespondentMetadata }> = ({ metadata }) => {
  const m = metadata;
  const hasLocation = m.country || m.city || m.region;
  const hasDevice = m.deviceType || m.browserName || m.osName;
  const hasScreen = m.screenWidth || m.viewportWidth;
  const hasTraffic = m.referrer || m.utmSource || m.utmCampaign;

  return (
    <div className="card-soft p-0">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-medium text-text-primary flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Respondent Profile
        </h2>
      </div>
      <div className="p-6 space-y-6">
        {/* Location */}
        {hasLocation && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Location
            </h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetadataField label="Country" value={m.country} />
              <MetadataField label="Region" value={m.region} />
              <MetadataField label="City" value={m.city} />
              <MetadataField label="ISP" value={m.isp} />
              <MetadataField label="Timezone" value={m.timezone} />
              <MetadataField label="Language" value={m.language} />
              <MetadataField label="IP Address" value={m.ipAddress} />
            </dl>
          </div>
        )}

        {/* Device & Browser */}
        {hasDevice && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Device & Browser
            </h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetadataField label="Device Type" value={m.deviceType} />
              <MetadataField label="Device Vendor" value={m.deviceVendor} />
              <MetadataField label="Device Model" value={m.deviceModel} />
              <MetadataField label="Browser" value={m.browserName ? `${m.browserName} ${m.browserVersion || ''}`.trim() : undefined} />
              <MetadataField label="Operating System" value={m.osName ? `${m.osName} ${m.osVersion || ''}`.trim() : undefined} />
              <MetadataField label="Touch Support" value={m.touchSupport} />
              <MetadataField label="Connection" value={m.connectionType} />
            </dl>
          </div>
        )}

        {/* Screen */}
        {hasScreen && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              Screen & Display
            </h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetadataField label="Screen" value={m.screenWidth && m.screenHeight ? `${m.screenWidth} x ${m.screenHeight}` : undefined} />
              <MetadataField label="Viewport" value={m.viewportWidth && m.viewportHeight ? `${m.viewportWidth} x ${m.viewportHeight}` : undefined} />
            </dl>
          </div>
        )}

        {/* Traffic Source */}
        {hasTraffic && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Traffic Source
            </h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetadataField label="Referrer" value={m.referrer} />
              <MetadataField label="UTM Source" value={m.utmSource} />
              <MetadataField label="UTM Medium" value={m.utmMedium} />
              <MetadataField label="UTM Campaign" value={m.utmCampaign} />
              <MetadataField label="Entry URL" value={m.entryUrl} />
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};

const ResponseDetailsPage: React.FC = () => {
  const { responseId } = useParams<{ responseId: string }>();
  const [response, setResponse] = useState<ResponseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (responseId) {
      loadResponse();
    }
  }, [responseId]);

  const loadResponse = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getResponseDetails(responseId!);
      setResponse(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load response');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds} seconds`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const renderAnswer = (answer: any) => {
    if (answer === null || answer === undefined) {
      return <span className="text-gray-400 italic">No answer</span>;
    }

    const value = answer.value !== undefined ? answer.value : answer;

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((v, i) => (
            <span key={i} className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm">
              {v}
            </span>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      return (
        <pre className="text-sm bg-gray-50 p-2 rounded">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return <span className="text-gray-900">{String(value)}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="spinner spinner-lg text-primary-600 mx-auto"></div>
          <p className="mt-2 text-text-secondary">Loading response...</p>
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

  if (!response) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to={`/analytics/surveys/${response.surveyId}`}
              className="text-sm text-text-secondary hover:text-primary-600 mb-2 inline-flex items-center gap-1 transition-colors"
            >
              ← Back to Survey Analytics
            </Link>
            <h1 className="text-2xl font-bold text-text-primary">Response Details</h1>
            <p className="text-text-secondary">{response.surveyTitle}</p>
          </div>
          <span className={`badge ${
            response.status === 'completed' ? 'badge-success' :
            response.status === 'in_progress' ? 'badge-warning' :
            'badge-danger'
          }`}>
            {response.status.replace('_', ' ')}
          </span>
        </div>

        {/* Response Info */}
        <div className="card-soft">
          <div className="border-b border-border pb-4 mb-4">
            <h2 className="text-lg font-medium text-text-primary">Response Information</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm font-medium text-text-secondary">Respondent</dt>
              <dd className="mt-1 text-sm text-text-primary">
                {response.respondent?.anonymous ? 'Anonymous' : response.respondent?.email || 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-secondary">Started At</dt>
              <dd className="mt-1 text-sm text-text-primary">
                {new Date(response.startedAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-secondary">Completed At</dt>
              <dd className="mt-1 text-sm text-text-primary">
                {response.completedAt ? new Date(response.completedAt).toLocaleString() : 'Not completed'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-secondary">Duration</dt>
              <dd className="mt-1 text-sm text-text-primary">
                {formatDuration(response.durationSeconds)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Answers */}
        <div className="card-soft p-0">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-text-primary">Answers ({response.answers.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {response.answers.length === 0 ? (
              <div className="px-6 py-8 text-center text-text-secondary">
                No answers recorded
              </div>
            ) : (
              response.answers.map((answer, index) => (
                <div key={answer.answerId} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-sm font-medium mr-2">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-text-primary">{answer.questionText}</span>
                    </div>
                    <span className="badge badge-neutral">
                      {answer.questionType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="ml-8">
                    {renderAnswer(answer.answer)}
                  </div>
                  <div className="ml-8 mt-2">
                    <span className="text-xs text-text-muted">
                      Answered: {new Date(answer.answeredAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Respondent Metadata */}
        {response.respondentMetadata && (
          <RespondentMetadataPanel metadata={response.respondentMetadata} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResponseDetailsPage;
