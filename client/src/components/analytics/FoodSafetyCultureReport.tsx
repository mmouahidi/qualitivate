import React, { useRef } from 'react';
import type { TaxonomyReport, SurveyAnalytics } from '../../services/analytics.service';

interface FoodSafetyCultureReportProps {
  taxonomy: TaxonomyReport;
  analytics: SurveyAnalytics;
  onExport: (format: 'pdf' | 'csv' | 'json') => void;
  exporting: boolean;
}

const GRADE_SCALE = [
  { grade: 'A', label: 'Exceptional', min: 90, max: 100, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { grade: 'B', label: 'Good', min: 75, max: 89, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { grade: 'C', label: 'Developing', min: 60, max: 74, color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { grade: 'D', label: 'Weak', min: 45, max: 59, color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  { grade: 'F', label: 'Critical', min: 0, max: 44, color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
];

const CATEGORY_META: Record<string, { icon: string; shortName: string; description: string }> = {
  'PURPOSE, VISION & MISSION': {
    icon: '🎯',
    shortName: 'Purpose',
    description: 'Evaluates Facilities/Locals, Vision, Values, and Strategy.',
  },
  'PEOPLE & ORGANIZATION': {
    icon: '👥',
    shortName: 'Personnel',
    description: 'Evaluates Authority, Reward, Teamwork, Training, and Communication.',
  },
  'PROCESS & CONSISTENCY': {
    icon: '⚙️',
    shortName: 'Process',
    description: 'Evaluates Control, Coordination, Consistency, and Documentation Systems.',
  },
  'PROACTIVITY & ADAPTABILITY': {
    icon: '⚡',
    shortName: 'Proactivity',
    description: 'Evaluates Targets, Metrics, Awareness, Foresight, Innovation, and Investment.',
  },
  'HAZARD & RISK AWARENESS': {
    icon: '⚠️',
    shortName: 'Hazard & Risk',
    description: 'Analyzes employee awareness of specific food safety hazards.',
  },
};

const HAZARD_AREAS = [
  { name: 'Biological / Microbiological Hazards', icon: '🦠', description: 'Awareness of pathogen risks, cross-contamination, and biological controls.' },
  { name: 'Physical & Chemical Hazards', icon: '🧪', description: 'Understanding of physical contaminants and chemical safety protocols.' },
  { name: 'Allergen Management', icon: '⚕️', description: 'Knowledge of allergen identification, segregation, and labelling requirements.' },
  { name: 'Food Fraud & Deliberate Contamination', icon: '🛡️', description: 'Awareness of food defense, supply chain integrity, and vulnerability assessment.' },
];

function getGradeInfo(grade: string) {
  return GRADE_SCALE.find(g => g.grade === grade) || GRADE_SCALE[4];
}

function getScoreGrade(score: number): typeof GRADE_SCALE[0] {
  return GRADE_SCALE.find(g => score >= g.min && score <= g.max) || GRADE_SCALE[4];
}

function getCategoryMeta(name: string) {
  return CATEGORY_META[name] || { icon: '📋', shortName: name, description: '' };
}

const ScoreRing: React.FC<{ score: number; size?: number; strokeWidth?: number }> = ({
  score,
  size = 120,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const gradeInfo = getScoreGrade(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={
            score >= 90 ? 'text-emerald-500' :
            score >= 75 ? 'text-blue-500' :
            score >= 60 ? 'text-yellow-500' :
            score >= 45 ? 'text-orange-500' :
            'text-red-500'
          }
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-bold ${gradeInfo.text}`}>{score}%</span>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ number: string; title: string; subtitle?: string }> = ({ number, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-lg">
      {number}
    </div>
    <div>
      <h2 className="text-xl font-bold text-text-primary">{title}</h2>
      {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
    </div>
  </div>
);

const FoodSafetyCultureReport: React.FC<FoodSafetyCultureReportProps> = ({
  taxonomy,
  analytics,
  onExport,
  exporting,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const { overall, categories } = taxonomy;
  const gradeInfo = getGradeInfo(overall.grade);

  const assessmentDate = analytics.overview.lastResponseAt
    ? new Date(analytics.overview.lastResponseAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const strengths = categories
    .flatMap(cat => cat.dimensions.map(dim => ({ ...dim, category: cat.name })))
    .filter(d => d.score >= 80)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const weaknesses = categories
    .flatMap(cat => cat.dimensions.map(dim => ({ ...dim, category: cat.name })))
    .filter(d => d.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  const hazardCategory = categories.find(c => c.name.toLowerCase().includes('hazard'));

  return (
    <div ref={reportRef} className="space-y-8 max-w-5xl mx-auto">
      {/* Report Cover / Title */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-orange-100 text-sm font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              FOOD SAFETY CULTURE ASSESSMENT
            </div>
            <h1 className="text-3xl font-bold leading-tight">{analytics.survey.title}</h1>
            <p className="text-orange-100 text-sm">
              GFSI-Aligned Assessment Report &bull; {assessmentDate}
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="text-6xl font-black">{overall.grade}</div>
            <div className="text-orange-100 text-sm">Overall Grade</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{overall.score}%</div>
            <div className="text-orange-100 text-xs mt-1">Global Score</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{overall.respondentCount}</div>
            <div className="text-orange-100 text-xs mt-1">Participants</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{categories.length}</div>
            <div className="text-orange-100 text-xs mt-1">Categories Assessed</div>
          </div>
        </div>
      </div>

      {/* Export Bar */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-6 py-4">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export this report
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onExport('pdf')}
            disabled={exporting}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exporting ? 'Generating...' : 'PDF'}
          </button>
          <button onClick={() => onExport('csv')} disabled={exporting} className="btn-secondary text-sm">
            CSV
          </button>
          <button onClick={() => onExport('json')} disabled={exporting} className="btn-secondary text-sm">
            JSON
          </button>
        </div>
      </div>

      {/* Section 1: Project Overview */}
      <div className="card-soft p-6">
        <SectionHeader number="1" title="Project Overview" subtitle="Assessment scope and methodology" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase font-medium tracking-wider">Survey</p>
                <p className="text-sm font-semibold text-text-primary">{analytics.survey.title}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase font-medium tracking-wider">Assessment Date</p>
                <p className="text-sm font-semibold text-text-primary">{assessmentDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase font-medium tracking-wider">Methodology</p>
                <p className="text-sm text-text-secondary">
                  Evaluation based on {categories.length} categories and{' '}
                  {categories.reduce((sum, c) => sum + c.dimensions.length, 0)} dimensions aligned with GFSI position papers.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-background rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-text-primary">Sampling Plan</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-text-secondary">Anonymity: Employees provided with privacy to ensure honest feedback</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-text-secondary">
                    Duration: ~{analytics.overview.avgCompletionTimeSeconds > 0
                      ? Math.ceil(analytics.overview.avgCompletionTimeSeconds / 60)
                      : '15-20'} min per participant
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-text-secondary">
                    Participation: {overall.respondentCount} completed
                    {analytics.overview.inProgressResponses > 0 && ` (${analytics.overview.inProgressResponses} in progress)`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-text-secondary">
                    Completion Rate: {analytics.overview.completionRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Scoring System */}
      <div className="card-soft p-6">
        <SectionHeader number="2" title="Scoring System" subtitle="Grade scale aligned with GFSI benchmarks" />
        <div className="grid grid-cols-5 gap-3">
          {GRADE_SCALE.map((g) => {
            const isActive = overall.grade === g.grade;
            return (
              <div
                key={g.grade}
                className={`relative rounded-xl p-4 text-center border-2 transition-all ${
                  isActive
                    ? `${g.bg} ${g.border} ring-2 ring-offset-2 ${g.border.replace('border', 'ring')}`
                    : 'bg-background border-transparent'
                }`}
              >
                {isActive && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className={`text-3xl font-black ${isActive ? g.text : 'text-text-muted'}`}>{g.grade}</div>
                <div className={`text-sm font-semibold mt-1 ${isActive ? g.text : 'text-text-secondary'}`}>{g.label}</div>
                <div className={`text-xs mt-1 ${isActive ? g.text : 'text-text-muted'}`}>{g.min}–{g.max}%</div>
                <div className={`mt-2 h-1.5 rounded-full ${isActive ? g.color : 'bg-gray-200 dark:bg-gray-700'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Dimensions of Culture */}
      <div className="card-soft p-6">
        <SectionHeader number="3" title="Dimensions of Culture" subtitle="Detailed category and dimension analysis" />
        <div className="space-y-4">
          {categories.filter(c => !c.name.toLowerCase().includes('hazard')).map((cat) => {
            const meta = getCategoryMeta(cat.name);
            return (
              <div key={cat.id} className="border border-border rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <h3 className="font-bold text-text-primary">{cat.name}</h3>
                      <p className="text-xs text-text-secondary">{meta.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <ScoreRing score={cat.score} size={64} strokeWidth={6} />
                    {cat.benchmark !== null && (
                      <div className="text-center">
                        <p className="text-xs text-text-muted">Benchmark</p>
                        <p className="text-lg font-bold text-text-secondary">{cat.benchmark}%</p>
                      </div>
                    )}
                    {cat.change && cat.change !== 'same' && (
                      <div className={`flex items-center gap-1 text-sm font-semibold ${
                        cat.change === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {cat.change === 'up' ? '↑' : '↓'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {cat.dimensions.map((dim) => {
                    const dimGrade = getScoreGrade(dim.score);
                    return (
                      <div key={dim.id} className="px-5 py-3 flex items-center justify-between hover:bg-background/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${dimGrade.color}`} />
                          <span className="text-sm text-text-primary">{dim.name}</span>
                          <span className="text-xs text-text-muted">({dim.questionCount} questions)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${dimGrade.color} transition-all duration-700`}
                              style={{ width: `${dim.score}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold tabular-nums w-12 text-right ${dimGrade.text}`}>
                            {dim.score}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Perceived Risk Analysis */}
      <div className="card-soft p-6">
        <SectionHeader number="4" title="Perceived Risk Analysis" subtitle="Employee awareness of specific food safety hazards" />
        {hazardCategory ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10 rounded-xl p-5 border border-red-200 dark:border-red-800/30">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-text-primary">{hazardCategory.name}</h3>
                  <p className="text-sm text-text-secondary">Overall hazard awareness score across all dimensions</p>
                </div>
              </div>
              <ScoreRing score={hazardCategory.score} size={80} strokeWidth={7} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hazardCategory.dimensions.map((dim) => {
                const dimGrade = getScoreGrade(dim.score);
                return (
                  <div key={dim.id} className={`rounded-xl p-5 border ${dimGrade.border} ${dimGrade.bg}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-sm font-semibold ${dimGrade.text}`}>{dim.name}</h4>
                      <span className={`text-2xl font-bold ${dimGrade.text}`}>{dim.score}%</span>
                    </div>
                    <div className="w-full bg-white/60 dark:bg-gray-800/60 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${dimGrade.color}`} style={{ width: `${dim.score}%` }} />
                    </div>
                    <p className="text-xs text-text-muted mt-2">{dim.questionCount} questions assessed</p>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {HAZARD_AREAS.map((area) => (
                <div key={area.name} className="bg-background rounded-lg p-3 text-center">
                  <span className="text-2xl">{area.icon}</span>
                  <p className="text-xs font-medium text-text-primary mt-1">{area.name}</p>
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{area.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted">
            <span className="text-4xl block mb-2">⚠️</span>
            <p className="text-sm">No hazard & risk awareness data available for this assessment.</p>
            <p className="text-xs mt-1">Add questions classified under "Hazard & Risk Awareness" to enable this section.</p>
          </div>
        )}
      </div>

      {/* Section 5: Results & Conclusion */}
      <div className="card-soft p-6">
        <SectionHeader number="5" title="Results & Conclusion" subtitle="Overall assessment results and executive summary" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col items-center justify-center bg-background rounded-xl p-6">
            <ScoreRing score={overall.score} size={160} strokeWidth={12} />
            <div className="mt-4 text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold ${gradeInfo.bg} ${gradeInfo.text}`}>
                Grade: {overall.grade} &mdash; {gradeInfo.label}
              </div>
              {overall.previousGrade && (
                <p className="text-sm text-text-muted mt-2">
                  Previous Grade: {overall.previousGrade}
                  {overall.change === 'up' && <span className="text-green-600 ml-1">↑ Improved</span>}
                  {overall.change === 'down' && <span className="text-red-600 ml-1">↓ Declined</span>}
                  {overall.change === 'same' && <span className="text-gray-500 ml-1">→ Unchanged</span>}
                </p>
              )}
              {overall.benchmark !== null && (
                <p className="text-sm text-text-muted mt-1">Industry Benchmark: {overall.benchmark}%</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Areas of Strength (Exceptional Culture)
                </h4>
                <div className="space-y-1.5">
                  {strengths.map((s) => (
                    <div key={s.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-2">
                      <div>
                        <span className="text-sm font-medium text-text-primary">{s.name}</span>
                        <span className="text-xs text-text-muted ml-2">({getCategoryMeta(s.category).shortName})</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">{s.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {weaknesses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Points of Weakness (Requires Attention)
                </h4>
                <div className="space-y-1.5">
                  {weaknesses.map((w) => (
                    <div key={w.id} className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">
                      <div>
                        <span className="text-sm font-medium text-text-primary">{w.name}</span>
                        <span className="text-xs text-text-muted ml-2">({getCategoryMeta(w.category).shortName})</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">{w.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {strengths.length === 0 && weaknesses.length === 0 && (
              <div className="text-center py-6 text-text-muted text-sm">
                Detailed strength and weakness analysis will appear once scores are computed.
              </div>
            )}
          </div>
        </div>

        {/* Category Comparison */}
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-sm font-semibold text-text-primary mb-4">Category Comparison</h4>
          <div className="space-y-3">
            {categories.map((cat) => {
              const meta = getCategoryMeta(cat.name);
              const catGrade = getScoreGrade(cat.score);
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{meta.icon}</span>
                  <span className="text-sm text-text-secondary w-48 truncate">{meta.shortName}</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                    <div
                      className={`h-4 rounded-full ${catGrade.color} transition-all duration-700 flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(cat.score, 5)}%` }}
                    >
                      {cat.score >= 20 && (
                        <span className="text-xs font-bold text-white">{cat.score}%</span>
                      )}
                    </div>
                    {cat.benchmark !== null && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-gray-800 dark:bg-gray-200"
                        style={{ left: `${cat.benchmark}%` }}
                        title={`Benchmark: ${cat.benchmark}%`}
                      />
                    )}
                  </div>
                  {cat.score < 20 && (
                    <span className={`text-sm font-bold ${catGrade.text}`}>{cat.score}%</span>
                  )}
                </div>
              );
            })}
          </div>
          {categories.some(c => c.benchmark !== null) && (
            <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
              <div className="w-3 h-0.5 bg-gray-800 dark:bg-gray-200" />
              <span>Industry Benchmark</span>
            </div>
          )}
        </div>
      </div>

      {/* Section 6: Improvement Action Plan */}
      <div className="card-soft p-6">
        <SectionHeader number="6" title="Improvement Action Plan" subtitle="Recommended actions based on assessment findings" />
        {weaknesses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-orange-200 dark:border-orange-800">
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">#</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">Area / Dimension</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">Category</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-semibold">Current Score</th>
                  <th className="text-center py-3 px-4 text-text-secondary font-semibold">Priority</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">Suggested Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {weaknesses.map((w, idx) => {
                  const priority = w.score < 30 ? 'Critical' : w.score < 45 ? 'High' : 'Medium';
                  const priorityColor = w.score < 30 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : w.score < 45 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
                  const action = w.score < 30
                    ? 'Immediate intervention required. Conduct targeted training and management review.'
                    : w.score < 45
                    ? 'Develop corrective action plan with measurable objectives and timelines.'
                    : 'Schedule focused improvement workshops and monitor progress quarterly.';
                  return (
                    <tr key={w.id} className="hover:bg-background/50 transition-colors">
                      <td className="py-3 px-4 text-text-muted">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-text-primary">{w.name}</td>
                      <td className="py-3 px-4 text-text-secondary">{getCategoryMeta(w.category).shortName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${getScoreGrade(w.score).text}`}>{w.score}%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColor}`}>
                          {priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-xs leading-relaxed">{action}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl block mb-2">🎉</span>
            <p className="text-sm text-text-secondary font-medium">All dimensions scored above the threshold.</p>
            <p className="text-xs text-text-muted mt-1">Continue monitoring to maintain food safety culture excellence.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-text-muted border-t border-border">
        <p>Food Safety Culture Assessment Report &bull; Generated by Qualitivate.io &bull; {assessmentDate}</p>
        <p className="mt-1">Based on {overall.respondentCount} completed response{overall.respondentCount !== 1 ? 's' : ''} &bull; GFSI-aligned evaluation framework</p>
      </div>
    </div>
  );
};

export default FoodSafetyCultureReport;
