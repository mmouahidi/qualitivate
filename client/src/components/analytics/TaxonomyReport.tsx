import React from 'react';
import type { TaxonomyReport as TaxonomyReportData } from '../../services/analytics.service';

interface TaxonomyReportProps {
  data: TaxonomyReportData;
}

const CATEGORY_ICONS: Record<string, string> = {
  people: '👥',
  process: '⚙️',
  purpose: '🎯',
  proactivity: '⚡',
  hazard: '⚠️',
  risk: '⚠️',
  vision: '🎯',
  organization: '👥',
  consistency: '⚙️',
  adaptability: '⚡',
};

function pickIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '📋';
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-orange-500 dark:text-orange-400';
  return 'text-red-500 dark:text-red-400';
}

const ChangeArrow: React.FC<{ change: 'up' | 'down' | 'same' | null }> = ({ change }) => {
  if (change === 'up') {
    return (
      <svg className="w-7 h-7 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l5-5 5 5M7 11l5-5 5 5" />
      </svg>
    );
  }
  if (change === 'down') {
    return (
      <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 7l-5 5-5-5M17 13l-5 5-5-5" />
      </svg>
    );
  }
  return <span className="text-2xl font-bold text-text-muted">-</span>;
};

const TaxonomyReport: React.FC<TaxonomyReportProps> = ({ data }) => {
  const { overall, categories } = data;

  return (
    <div className="space-y-6">
      {/* Overall Summary Bar */}
      <div className="bg-orange-500 rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 text-center text-xs font-bold text-white/80 uppercase tracking-wider px-4 py-2 border-b border-orange-400">
          <span>Total</span>
          <span>Benchmark</span>
          <span>Change</span>
          <span>Grade</span>
          <span>Prev. Grade</span>
          <span>Change</span>
        </div>
        <div className="grid grid-cols-6 text-center items-center px-4 py-5 text-white">
          <span className="text-5xl font-bold">{overall.score}</span>
          <span className="text-5xl font-bold">{overall.benchmark ?? '-'}</span>
          <div className="flex justify-center">
            <ChangeArrow change={overall.change} />
          </div>
          <span className="text-5xl font-bold">{overall.grade}</span>
          <span className="text-5xl font-bold">{overall.previousGrade ?? '-'}</span>
          <div className="flex justify-center">
            {overall.grade !== overall.previousGrade && overall.previousGrade
              ? <ChangeArrow change={overall.grade < (overall.previousGrade ?? '') ? 'down' : overall.grade > (overall.previousGrade ?? '') ? 'up' : 'same'} />
              : <ChangeArrow change={null} />
            }
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="bg-orange-500 rounded-t-lg grid grid-cols-7 text-center text-xs font-bold text-white uppercase tracking-wider px-4 py-2.5">
        <span className="text-left col-span-1">Category</span>
        <span className="text-left">Dimension</span>
        <span>Score</span>
        <span>Total</span>
        <span>Benchmark</span>
        <span>Change</span>
        <span></span>
      </div>

      {/* Category Rows */}
      <div className="-mt-6">
        {categories.map((cat, catIdx) => (
          <div
            key={cat.id}
            className={`border-x border-b border-border ${catIdx === 0 ? 'border-t' : ''} ${catIdx === categories.length - 1 ? 'rounded-b-lg' : ''}`}
          >
            <div className="grid grid-cols-7 items-center">
              {/* Category name + icon */}
              <div className="row-span-1 flex flex-col items-center justify-center py-4 px-3 border-r border-border bg-surface">
                <span className="text-2xl mb-1">{pickIcon(cat.name)}</span>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase text-center leading-tight">
                  {cat.name.split(/[,&]/)[0].trim()}
                </span>
              </div>

              {/* Dimensions list */}
              <div className="col-span-2 py-3 px-4">
                {cat.dimensions.map(dim => (
                  <div key={dim.id} className="flex items-center justify-between py-1">
                    <span className="text-sm text-text-secondary uppercase tracking-wide">{dim.name.split(/[,&]/)[0].trim()}</span>
                    <span className={`text-sm font-semibold tabular-nums ${scoreColor(dim.score)}`}>{dim.score}</span>
                  </div>
                ))}
              </div>

              {/* Category Total */}
              <div className="flex items-center justify-center">
                <span className={`text-4xl font-bold tabular-nums ${scoreColor(cat.score)}`}>{cat.score}</span>
              </div>

              {/* Benchmark */}
              <div className="flex items-center justify-center">
                <span className="text-4xl font-bold tabular-nums text-text-secondary">{cat.benchmark ?? '-'}</span>
              </div>

              {/* Change Arrow */}
              <div className="flex items-center justify-center">
                <ChangeArrow change={cat.change} />
              </div>

              {/* Empty trailing cell */}
              <div />
            </div>
          </div>
        ))}
      </div>

      {/* Footer info */}
      <p className="text-xs text-text-muted text-right">
        Based on {overall.respondentCount} completed response{overall.respondentCount !== 1 ? 's' : ''}.
        Grade scale: A (&ge;90), B (&ge;75), C (&ge;60), D (&ge;45), F (&lt;45).
      </p>
    </div>
  );
};

export default TaxonomyReport;
