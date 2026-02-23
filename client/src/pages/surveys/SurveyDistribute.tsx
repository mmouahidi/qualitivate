import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { distributionService } from '../../services/distribution.service';
import { surveyService } from '../../services/survey.service';
import { DashboardLayout } from '../../components/layout';

const SurveyDistribute: React.FC = () => {
  const { id: surveyId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'email' | 'embed'>('link');
  const [copied, setCopied] = useState(false);
  const [emailList, setEmailList] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifySubject, setNotifySubject] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');

  const { data: survey } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => surveyService.get(surveyId!),
    enabled: !!surveyId
  });

  const { data: distributions } = useQuery({
    queryKey: ['distributions', surveyId],
    queryFn: () => distributionService.list(surveyId!),
    enabled: !!surveyId
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: (isPublic: boolean) => surveyService.update(surveyId!, { isPublic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
    }
  });

  const notifyCompanyMutation = useMutation({
    mutationFn: () => distributionService.sendToGroup(surveyId!, {
      companyId: survey?.companyId,
      subject: notifySubject || `You're invited: ${survey?.title}`,
      message: notifyMessage
    }),
    onSuccess: () => {
      setShowNotifyModal(false);
      setNotifySubject('');
      setNotifyMessage('');
      queryClient.invalidateQueries({ queryKey: ['distributions', surveyId] });
    }
  });

  const createLinkMutation = useMutation({
    mutationFn: () => distributionService.createLink(surveyId!)
  });

  const createQrMutation = useMutation({
    mutationFn: () => distributionService.createQR(surveyId!)
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => distributionService.sendEmails(surveyId!, {
      emails: emailList.split('\n').map(e => e.trim()).filter(Boolean),
      subject: emailSubject,
      message: emailMessage
    })
  });

  const surveyUrl = `${window.location.origin}/survey/${surveyId}/take`;
  const embedCode = `<iframe src="${window.location.origin}/survey/${surveyId}/embed" width="100%" height="600" frameborder="0"></iframe>`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const linkDistribution = distributions?.find((d: any) => d.channel === 'link');
  const qrDistribution = distributions?.find((d: any) => d.channel === 'qr_code');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between card-soft mb-6">
          <div>
            <Link to="/surveys" className="text-sm text-text-secondary hover:text-primary-600 mb-2 inline-flex items-center gap-1 transition-colors">
              ← Back to Surveys
            </Link>
            <h1 className="text-3xl font-bold text-text-primary">Distribute Survey</h1>
            <p className="text-text-secondary mt-1 max-w-2xl">
              Share <span className="font-semibold text-primary-600">"{survey?.title}"</span> with your audience via link, QR code, or email.
            </p>
          </div>
          <img
            src="/images/survey-distribute-illustration.png"
            alt="Distribute"
            className="hidden md:block w-48 h-auto object-contain"
          />
        </div>

        {survey?.status !== 'active' && (
          <div className="alert-warning">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>This survey is not active. Please activate it before distributing.</p>
          </div>
        )}

        {/* Visibility & Bulk Notify Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Public/Private Toggle Card */}
          <div className="card-soft">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  {survey?.isPublic ? (
                    <span className="text-green-500">🌐</span>
                  ) : (
                    <span className="text-amber-500">🔒</span>
                  )}
                  Survey Visibility
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {survey?.isPublic
                    ? 'Anyone with the link can access this survey.'
                    : 'Only invited users can access this survey.'}
                </p>
              </div>
              <button
                onClick={() => toggleVisibilityMutation.mutate(!survey?.isPublic)}
                disabled={toggleVisibilityMutation.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${survey?.isPublic ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${survey?.isPublic ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <span className={`badge-${survey?.isPublic ? 'success' : 'warning'}`}>
                {survey?.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>

          {/* Notify Company Employees Card */}
          <div className="card-soft">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <span>📣</span> Notify Company Employees
            </h3>
            <p className="text-sm text-text-secondary mt-1 mb-4">
              Send survey invitation to all active employees in your company.
            </p>
            <button
              onClick={() => setShowNotifyModal(true)}
              disabled={survey?.status !== 'active'}
              className="btn-primary w-full"
            >
              Send to All Employees
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="card-soft lg:col-span-1 p-0">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-text-primary">Share Options</h3>
            </div>
            <nav className="p-2 space-y-1">
              {[
                { key: 'link', label: 'Share Link', icon: '🔗' },
                { key: 'qr', label: 'QR Code', icon: '📱' },
                { key: 'email', label: 'Email Invite', icon: '📧' },
                { key: 'embed', label: 'Embed Survey', icon: '🖥️' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                    }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="card-soft lg:col-span-3">
            {activeTab === 'link' && (
              <div className="space-y-4">
                <p className="text-text-secondary">Share this link directly with respondents:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={surveyUrl}
                    className="flex-1 input-soft bg-background"
                  />
                  <button
                    onClick={() => copyToClipboard(surveyUrl)}
                    className="btn-primary"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {!linkDistribution && (
                  <button
                    onClick={() => createLinkMutation.mutate()}
                    disabled={createLinkMutation.isPending}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {createLinkMutation.isPending ? 'Creating...' : 'Track link clicks →'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="space-y-4">
                <p className="text-text-secondary">Generate a QR code for easy mobile access:</p>
                {qrDistribution?.qrCodeUrl ? (
                  <div className="flex flex-col items-center">
                    <img src={qrDistribution.qrCodeUrl} alt="QR Code" className="w-64 h-64 border border-border rounded-soft" />
                    <button
                      onClick={() => window.open(qrDistribution.qrCodeUrl, '_blank')}
                      className="mt-4 btn-ghost text-primary-600"
                    >
                      Download QR Code
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => createQrMutation.mutate()}
                    disabled={createQrMutation.isPending}
                    className="btn-primary"
                  >
                    {createQrMutation.isPending ? 'Generating...' : 'Generate QR Code'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-4">
                <p className="text-text-secondary">Send survey invitations via email:</p>
                <div>
                  <label className="label-soft">Email Addresses (one per line)</label>
                  <textarea
                    value={emailList}
                    onChange={(e) => setEmailList(e.target.value)}
                    rows={4}
                    placeholder="john@example.com&#10;jane@example.com"
                    className="textarea-soft"
                  />
                </div>
                <div>
                  <label className="label-soft">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="We'd love your feedback!"
                    className="input-soft"
                  />
                </div>
                <div>
                  <label className="label-soft">Message</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={4}
                    placeholder="Please take a moment to complete our survey..."
                    className="textarea-soft"
                  />
                </div>
                <button
                  onClick={() => sendEmailMutation.mutate()}
                  disabled={sendEmailMutation.isPending || !emailList.trim()}
                  className="btn-primary"
                >
                  {sendEmailMutation.isPending ? 'Sending...' : 'Send Invitations'}
                </button>
                {sendEmailMutation.isSuccess && (
                  <p className="text-green-600">Invitations sent successfully!</p>
                )}
              </div>
            )}

            {activeTab === 'embed' && (
              <div className="space-y-4">
                <p className="text-text-secondary">Embed the survey on your website:</p>
                <div className="relative">
                  <textarea
                    readOnly
                    value={embedCode}
                    rows={3}
                    className="textarea-soft bg-background font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(embedCode)}
                    className="absolute top-2 right-2 px-3 py-1 bg-surface border border-border text-text-secondary rounded-soft text-sm hover:bg-background transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="border border-border rounded-soft p-4 bg-background">
                  <p className="text-sm text-text-secondary mb-2">Preview:</p>
                  <div className="border border-border bg-surface rounded-soft" style={{ height: '300px' }}>
                    <iframe
                      src={`/survey/${surveyId}/embed`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title="Survey Preview"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {distributions && distributions.length > 0 && (
          <div className="card-soft overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">Distribution History</h2>
            </div>
            <table className="table-soft">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((dist: any) => (
                  <tr key={dist.id}>
                    <td className="capitalize">{dist.channel.replace('_', ' ')}</td>
                    <td className="text-text-secondary">{new Date(dist.createdAt).toLocaleString()}</td>
                    <td>
                      <span className="badge-success">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notify Company Modal */}
      {showNotifyModal && (
        <div className="modal-overlay" onClick={() => setShowNotifyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">📣 Notify Company Employees</h2>
            <p className="text-text-secondary mb-4">
              Send survey invitation to all active employees in your company.
            </p>
            <div className="space-y-4">
              <div>
                <label className="label-soft">Subject (optional)</label>
                <input
                  type="text"
                  value={notifySubject}
                  onChange={(e) => setNotifySubject(e.target.value)}
                  placeholder={`You're invited: ${survey?.title}`}
                  className="input-soft"
                />
              </div>
              <div>
                <label className="label-soft">Personal Message (optional)</label>
                <textarea
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  placeholder="Add a personal message to the invitation email..."
                  rows={4}
                  className="input-soft"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowNotifyModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => notifyCompanyMutation.mutate()}
                disabled={notifyCompanyMutation.isPending}
                className="btn-primary"
              >
                {notifyCompanyMutation.isPending ? 'Sending...' : 'Send to All Employees'}
              </button>
            </div>
            {notifyCompanyMutation.isError && (
              <p className="text-red-500 text-sm mt-3">
                Failed to send notifications. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SurveyDistribute;

