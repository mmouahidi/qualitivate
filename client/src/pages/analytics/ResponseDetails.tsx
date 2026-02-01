import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import analyticsService, { ResponseDetails } from '../../services/analytics.service';
import { DashboardLayout } from '../../components/layout';

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

        {/* Metadata */}
        {response.metadata && Object.keys(response.metadata).length > 0 && (
          <div className="card-soft p-0">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-text-primary">Additional Information</h2>
            </div>
            <div className="p-6">
              <pre className="text-sm text-text-secondary bg-background p-4 rounded-soft overflow-auto">
                {JSON.stringify(response.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResponseDetailsPage;
