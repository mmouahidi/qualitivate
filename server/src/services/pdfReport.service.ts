import PDFDocument from 'pdfkit';
import { Response } from 'express';

// Brand colors
const COLORS = {
  primary: '#4f46e5',      // Indigo
  secondary: '#0d9488',    // Teal
  accent: '#e11d48',       // Coral
  success: '#16a34a',      // Green
  warning: '#ca8a04',      // Yellow
  danger: '#dc2626',       // Red
  textPrimary: '#1e293b',  // Slate 800
  textSecondary: '#64748b', // Slate 500
  textMuted: '#94a3b8',    // Slate 400
  border: '#e2e8f0',       // Slate 200
  background: '#f8fafc',   // Slate 50
  white: '#ffffff',
};

interface SurveyAnalyticsData {
  survey: {
    id: string;
    title: string;
    type: string;
    status: string;
    startsAt: string | null;
    endsAt: string | null;
  };
  overview: {
    totalResponses: number;
    completedResponses: number;
    inProgressResponses: number;
    abandonedResponses: number;
    completionRate: number;
    avgCompletionTimeSeconds: number;
    firstResponseAt: string | null;
    lastResponseAt: string | null;
  };
  nps: {
    score: number;
    promoters: { count: number; percentage: number };
    passives: { count: number; percentage: number };
    detractors: { count: number; percentage: number };
    totalResponses: number;
  } | null;
  trend: Array<{
    date: string;
    count: number;
    completed: number;
  }>;
  questionCount: number;
}

interface QuestionAnalyticsData {
  questionId: string;
  questionText: string;
  type: string;
  required: boolean;
  totalAnswers: number;
  distribution: Record<string, number | Record<string, number>>;
  stats: {
    average?: number;
    min?: number;
    max?: number;
    count?: number;
    avgLength?: number;
  };
  options: any;
}

interface CompanyInfo {
  name?: string;
  logo?: string;
}

/**
 * PDF Report Generator Service
 * Creates professional, visually appealing analytics reports
 */
export class PDFReportService {
  private doc: PDFKit.PDFDocument;
  private pageWidth: number = 595.28; // A4
  private pageHeight: number = 841.89; // A4
  private margin: number = 50;
  private contentWidth: number;
  private currentY: number = 0;

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
      info: {
        Title: 'Survey Analytics Report',
        Author: 'Qualitivate.io',
        Creator: 'Qualitivate.io Analytics',
      }
    });
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }

  /**
   * Generate complete PDF report
   */
  async generateReport(
    surveyAnalytics: SurveyAnalyticsData,
    questionAnalytics: QuestionAnalyticsData[],
    company?: CompanyInfo
  ): Promise<PDFKit.PDFDocument> {
    // Cover Page
    this.addCoverPage(surveyAnalytics, company);

    // Executive Summary
    this.addNewPage();
    this.addExecutiveSummary(surveyAnalytics);

    // NPS Analysis (if available)
    if (surveyAnalytics.nps) {
      this.addNPSSection(surveyAnalytics.nps);
    }

    // Response Trend
    if (surveyAnalytics.trend && surveyAnalytics.trend.length > 0) {
      this.checkPageBreak(250);
      this.addResponseTrendSection(surveyAnalytics.trend);
    }

    // Question Analysis
    this.addNewPage();
    this.addQuestionAnalysisSection(questionAnalytics);

    // Footer with page numbers
    this.addPageNumbers();

    return this.doc;
  }

  /**
   * Stream PDF to Express Response
   */
  streamToResponse(res: Response, filename: string): void {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    this.doc.pipe(res);
    this.doc.end();
  }

  /**
   * Cover Page
   */
  private addCoverPage(analytics: SurveyAnalyticsData, company?: CompanyInfo): void {
    const centerX = this.pageWidth / 2;
    
    // Background gradient effect (simulated with rectangles)
    this.doc
      .rect(0, 0, this.pageWidth, this.pageHeight)
      .fill(COLORS.primary);
    
    // White content area
    this.doc
      .roundedRect(30, 30, this.pageWidth - 60, this.pageHeight - 60, 20)
      .fill(COLORS.white);

    // Logo/Brand area
    this.currentY = 100;
    this.doc
      .fontSize(14)
      .fillColor(COLORS.textMuted)
      .text('QUALITIVATE.IO', this.margin, this.currentY, { align: 'center', width: this.contentWidth });

    // Survey Title
    this.currentY = 200;
    this.doc
      .fontSize(32)
      .fillColor(COLORS.textPrimary)
      .text(analytics.survey.title, this.margin, this.currentY, { 
        align: 'center', 
        width: this.contentWidth,
        lineGap: 10
      });

    // Subtitle
    this.currentY = this.doc.y + 30;
    this.doc
      .fontSize(18)
      .fillColor(COLORS.primary)
      .text('Analytics Report', this.margin, this.currentY, { align: 'center', width: this.contentWidth });

    // Decorative line
    this.currentY = this.doc.y + 40;
    this.doc
      .moveTo(centerX - 50, this.currentY)
      .lineTo(centerX + 50, this.currentY)
      .strokeColor(COLORS.primary)
      .lineWidth(3)
      .stroke();

    // Key stats preview
    this.currentY = 450;
    const statsBoxWidth = 150;
    const statsSpacing = 30;
    const totalStatsWidth = (statsBoxWidth * 3) + (statsSpacing * 2);
    const statsStartX = (this.pageWidth - totalStatsWidth) / 2;

    // Total Responses
    this.drawStatBox(
      statsStartX, 
      this.currentY, 
      statsBoxWidth, 
      analytics.overview.totalResponses.toString(),
      'Total Responses',
      COLORS.primary
    );

    // Completion Rate
    this.drawStatBox(
      statsStartX + statsBoxWidth + statsSpacing, 
      this.currentY, 
      statsBoxWidth, 
      `${analytics.overview.completionRate}%`,
      'Completion Rate',
      COLORS.secondary
    );

    // NPS Score or Questions
    if (analytics.nps) {
      this.drawStatBox(
        statsStartX + (statsBoxWidth + statsSpacing) * 2, 
        this.currentY, 
        statsBoxWidth, 
        analytics.nps.score.toString(),
        'NPS Score',
        analytics.nps.score >= 50 ? COLORS.success : analytics.nps.score >= 0 ? COLORS.warning : COLORS.danger
      );
    } else {
      this.drawStatBox(
        statsStartX + (statsBoxWidth + statsSpacing) * 2, 
        this.currentY, 
        statsBoxWidth, 
        analytics.questionCount.toString(),
        'Questions',
        COLORS.accent
      );
    }

    // Date info
    this.currentY = 650;
    const reportDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    this.doc
      .fontSize(12)
      .fillColor(COLORS.textSecondary)
      .text(`Report Generated: ${reportDate}`, this.margin, this.currentY, { align: 'center', width: this.contentWidth });

    if (analytics.overview.firstResponseAt) {
      const firstDate = new Date(analytics.overview.firstResponseAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const lastDate = analytics.overview.lastResponseAt 
        ? new Date(analytics.overview.lastResponseAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Present';
      
      this.currentY = this.doc.y + 10;
      this.doc
        .text(`Data Range: ${firstDate} - ${lastDate}`, this.margin, this.currentY, { align: 'center', width: this.contentWidth });
    }

    // Survey status badge
    this.currentY = 720;
    const statusColors: Record<string, string> = {
      'active': COLORS.success,
      'draft': COLORS.warning,
      'closed': COLORS.textMuted
    };
    const statusColor = statusColors[analytics.survey.status] || COLORS.textMuted;
    
    const statusText = analytics.survey.status.toUpperCase();
    const statusWidth = 80;
    const statusX = centerX - (statusWidth / 2);
    
    this.doc
      .roundedRect(statusX, this.currentY, statusWidth, 25, 12)
      .fill(statusColor);
    
    this.doc
      .fontSize(10)
      .fillColor(COLORS.white)
      .text(statusText, statusX, this.currentY + 7, { width: statusWidth, align: 'center' });

    // Company name if provided
    if (company?.name) {
      this.currentY = 780;
      this.doc
        .fontSize(11)
        .fillColor(COLORS.textMuted)
        .text(company.name, this.margin, this.currentY, { align: 'center', width: this.contentWidth });
    }
  }

  /**
   * Executive Summary Section
   */
  private addExecutiveSummary(analytics: SurveyAnalyticsData): void {
    this.currentY = this.margin;
    
    // Section title
    this.addSectionTitle('Executive Summary');

    // Stats grid
    this.currentY = this.doc.y + 20;
    const gridStartY = this.currentY;
    
    // Row 1: Response metrics
    const col1X = this.margin;
    const col2X = this.margin + (this.contentWidth / 2);
    
    this.drawMetricCard(col1X, this.currentY, (this.contentWidth / 2) - 10, 70,
      'Total Responses', analytics.overview.totalResponses.toString(), 
      `${analytics.overview.completedResponses} completed`, COLORS.primary);

    this.drawMetricCard(col2X, this.currentY, (this.contentWidth / 2) - 10, 70,
      'Completion Rate', `${analytics.overview.completionRate}%`,
      `${analytics.overview.inProgressResponses} in progress`, COLORS.secondary);

    // Row 2
    this.currentY = gridStartY + 80;
    
    const avgTime = this.formatDuration(analytics.overview.avgCompletionTimeSeconds);
    this.drawMetricCard(col1X, this.currentY, (this.contentWidth / 2) - 10, 70,
      'Avg. Completion Time', avgTime,
      'per response', COLORS.accent);

    this.drawMetricCard(col2X, this.currentY, (this.contentWidth / 2) - 10, 70,
      'Abandoned', analytics.overview.abandonedResponses.toString(),
      'responses', COLORS.danger);

    // Response breakdown bar
    this.currentY = gridStartY + 170;
    this.addResponseBreakdownBar(analytics.overview);

    this.currentY = this.doc.y + 30;
  }

  /**
   * NPS Analysis Section
   */
  private addNPSSection(nps: SurveyAnalyticsData['nps']): void {
    if (!nps) return;

    this.checkPageBreak(280);
    this.addSectionTitle('Net Promoter Score (NPS)');

    this.currentY = this.doc.y + 20;
    const sectionStartY = this.currentY;

    // NPS Gauge (simplified)
    const gaugeX = this.margin;
    const gaugeWidth = this.contentWidth * 0.4;
    
    this.drawNPSGauge(gaugeX, this.currentY, gaugeWidth, 120, nps.score);

    // NPS breakdown
    const breakdownX = this.margin + gaugeWidth + 40;
    const breakdownWidth = this.contentWidth - gaugeWidth - 40;
    
    // Promoters
    this.drawNPSCategory(breakdownX, sectionStartY, breakdownWidth, 
      'Promoters (9-10)', nps.promoters.count, nps.promoters.percentage, COLORS.success);
    
    // Passives
    this.drawNPSCategory(breakdownX, sectionStartY + 45, breakdownWidth,
      'Passives (7-8)', nps.passives.count, nps.passives.percentage, COLORS.warning);
    
    // Detractors
    this.drawNPSCategory(breakdownX, sectionStartY + 90, breakdownWidth,
      'Detractors (0-6)', nps.detractors.count, nps.detractors.percentage, COLORS.danger);

    // NPS interpretation
    this.currentY = sectionStartY + 150;
    const interpretation = this.getNPSInterpretation(nps.score);
    
    this.doc
      .roundedRect(this.margin, this.currentY, this.contentWidth, 50, 8)
      .fill(COLORS.background);
    
    this.doc
      .fontSize(11)
      .fillColor(COLORS.textSecondary)
      .text(interpretation, this.margin + 15, this.currentY + 15, { 
        width: this.contentWidth - 30,
        align: 'center'
      });

    this.currentY = this.currentY + 70;
  }

  /**
   * Response Trend Section
   */
  private addResponseTrendSection(trend: SurveyAnalyticsData['trend']): void {
    this.addSectionTitle('Response Trend (Last 30 Days)');

    this.currentY = this.doc.y + 20;
    const chartHeight = 150;
    const chartWidth = this.contentWidth;
    const chartX = this.margin;
    const chartY = this.currentY;

    // Background
    this.doc
      .roundedRect(chartX, chartY, chartWidth, chartHeight + 40, 8)
      .fill(COLORS.background);

    // Draw simple bar chart
    if (trend.length > 0) {
      const maxCount = Math.max(...trend.map(t => t.count), 1);
      const barWidth = Math.min(15, (chartWidth - 40) / trend.length - 2);
      const chartInnerWidth = chartWidth - 40;
      const spacing = (chartInnerWidth - (barWidth * trend.length)) / (trend.length + 1);

      trend.forEach((day, index) => {
        const barHeight = (day.count / maxCount) * (chartHeight - 30);
        const barX = chartX + 20 + spacing + (index * (barWidth + spacing));
        const barY = chartY + chartHeight - barHeight;

        // Bar
        this.doc
          .roundedRect(barX, barY, barWidth, barHeight, 2)
          .fill(COLORS.primary);

        // Completed portion
        if (day.completed > 0) {
          const completedHeight = (day.completed / maxCount) * (chartHeight - 30);
          this.doc
            .roundedRect(barX, chartY + chartHeight - completedHeight, barWidth, completedHeight, 2)
            .fill(COLORS.secondary);
        }
      });

      // Legend
      this.currentY = chartY + chartHeight + 10;
      this.doc
        .circle(chartX + 30, this.currentY + 5, 5)
        .fill(COLORS.primary);
      this.doc
        .fontSize(9)
        .fillColor(COLORS.textSecondary)
        .text('Total', chartX + 40, this.currentY);

      this.doc
        .circle(chartX + 100, this.currentY + 5, 5)
        .fill(COLORS.secondary);
      this.doc
        .text('Completed', chartX + 110, this.currentY);
    }

    this.currentY = chartY + chartHeight + 60;
  }

  /**
   * Question Analysis Section
   */
  private addQuestionAnalysisSection(questions: QuestionAnalyticsData[]): void {
    this.currentY = this.margin;
    this.addSectionTitle('Question-by-Question Analysis');

    questions.forEach((question, index) => {
      this.checkPageBreak(200);
      this.addQuestionCard(question, index + 1);
    });
  }

  /**
   * Add Question Card
   */
  private addQuestionCard(question: QuestionAnalyticsData, questionNumber: number): void {
    this.currentY = this.doc.y + 15;
    const cardY = this.currentY;
    const cardHeight = this.calculateQuestionCardHeight(question);

    // Card background
    this.doc
      .roundedRect(this.margin, cardY, this.contentWidth, cardHeight, 8)
      .fillAndStroke(COLORS.white, COLORS.border);

    // Question number badge
    this.doc
      .circle(this.margin + 20, cardY + 25, 15)
      .fill(COLORS.primary);
    this.doc
      .fontSize(12)
      .fillColor(COLORS.white)
      .text(questionNumber.toString(), this.margin + 12, cardY + 19);

    // Question text
    this.doc
      .fontSize(11)
      .fillColor(COLORS.textPrimary)
      .text(question.questionText, this.margin + 45, cardY + 15, {
        width: this.contentWidth - 70,
        lineGap: 3
      });

    // Question type badge
    const typeY = cardY + 15;
    const typeBadgeWidth = 80;
    const typeBadgeX = this.margin + this.contentWidth - typeBadgeWidth - 15;
    
    this.doc
      .roundedRect(typeBadgeX, typeY, typeBadgeWidth, 20, 10)
      .fill(COLORS.background);
    this.doc
      .fontSize(8)
      .fillColor(COLORS.textMuted)
      .text(this.formatQuestionType(question.type), typeBadgeX, typeY + 5, { width: typeBadgeWidth, align: 'center' });

    // Response count
    const detailsY = cardY + 50;
    this.doc
      .fontSize(10)
      .fillColor(COLORS.textSecondary)
      .text(`${question.totalAnswers} responses`, this.margin + 15, detailsY);

    // Stats or distribution based on type
    const contentY = detailsY + 25;
    
    if (question.type === 'rating_scale' || question.type === 'nps') {
      this.drawRatingDistribution(question, this.margin + 15, contentY, this.contentWidth - 30);
    } else if (question.type === 'multiple_choice') {
      this.drawChoiceDistribution(question, this.margin + 15, contentY, this.contentWidth - 30);
    } else if (question.type === 'text_short' || question.type === 'text_long') {
      this.drawTextStats(question, this.margin + 15, contentY);
    }

    this.currentY = cardY + cardHeight;
    this.doc.y = this.currentY;
  }

  /**
   * Draw Rating Distribution Bar
   */
  private drawRatingDistribution(question: QuestionAnalyticsData, x: number, y: number, width: number): void {
    const stats = question.stats;
    const distribution = question.distribution as Record<string, number>;
    
    // Average display
    if (stats?.average !== undefined) {
      this.doc
        .fontSize(24)
        .fillColor(COLORS.primary)
        .text(stats.average.toFixed(1), x, y);
      
      this.doc
        .fontSize(10)
        .fillColor(COLORS.textMuted)
        .text('average', x + 45, y + 10);
    }

    // Distribution bars
    const barY = y + 45;
    const barWidth = width - 60;
    const total = question.totalAnswers || 1;
    
    const max = question.type === 'nps' ? 10 : (question.options?.max || 5);
    const min = question.type === 'nps' ? 0 : (question.options?.min || 1);

    for (let i = min; i <= max; i++) {
      const count = distribution[i.toString()] || 0;
      const percentage = (count / total) * 100;
      const rowY = barY + ((i - min) * 22);

      // Label
      this.doc
        .fontSize(9)
        .fillColor(COLORS.textSecondary)
        .text(i.toString(), x, rowY + 2);

      // Bar background
      this.doc
        .roundedRect(x + 25, rowY, barWidth, 16, 4)
        .fill(COLORS.border);

      // Bar fill
      if (percentage > 0) {
        const fillWidth = Math.max(4, (percentage / 100) * barWidth);
        this.doc
          .roundedRect(x + 25, rowY, fillWidth, 16, 4)
          .fill(COLORS.primary);
      }

      // Count
      this.doc
        .fontSize(8)
        .fillColor(COLORS.textMuted)
        .text(`${count} (${Math.round(percentage)}%)`, x + barWidth + 30, rowY + 3);
    }
  }

  /**
   * Draw Choice Distribution
   */
  private drawChoiceDistribution(question: QuestionAnalyticsData, x: number, y: number, width: number): void {
    const distribution = question.distribution as Record<string, number>;
    const total = question.totalAnswers || 1;
    const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

    entries.slice(0, 6).forEach(([choice, count], index) => {
      const percentage = (count / total) * 100;
      const rowY = y + (index * 28);
      const barWidth = width - 100;

      // Choice label (truncated)
      const label = choice.length > 30 ? choice.substring(0, 30) + '...' : choice;
      this.doc
        .fontSize(9)
        .fillColor(COLORS.textPrimary)
        .text(label, x, rowY);

      // Bar background
      this.doc
        .roundedRect(x, rowY + 12, barWidth, 12, 3)
        .fill(COLORS.border);

      // Bar fill
      if (percentage > 0) {
        const fillWidth = Math.max(3, (percentage / 100) * barWidth);
        this.doc
          .roundedRect(x, rowY + 12, fillWidth, 12, 3)
          .fill(COLORS.secondary);
      }

      // Count
      this.doc
        .fontSize(8)
        .fillColor(COLORS.textMuted)
        .text(`${count} (${Math.round(percentage)}%)`, x + barWidth + 10, rowY + 13);
    });
  }

  /**
   * Draw Text Question Stats
   */
  private drawTextStats(question: QuestionAnalyticsData, x: number, y: number): void {
    const stats = question.stats;

    this.doc
      .fontSize(11)
      .fillColor(COLORS.textSecondary)
      .text(`${stats?.count || 0} text responses collected`, x, y);

    if (stats?.avgLength) {
      this.doc
        .fontSize(10)
        .fillColor(COLORS.textMuted)
        .text(`Average response length: ${stats.avgLength} characters`, x, y + 18);
    }
  }

  // ============ Helper Methods ============

  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.addNewPage();
    }
  }

  private addSectionTitle(title: string): void {
    this.doc
      .fontSize(18)
      .fillColor(COLORS.textPrimary)
      .text(title, this.margin, this.currentY);

    // Underline
    this.currentY = this.doc.y + 5;
    this.doc
      .moveTo(this.margin, this.currentY)
      .lineTo(this.margin + 100, this.currentY)
      .strokeColor(COLORS.primary)
      .lineWidth(3)
      .stroke();

    this.currentY = this.doc.y + 10;
    this.doc.y = this.currentY;
  }

  private drawStatBox(x: number, y: number, width: number, value: string, label: string, color: string): void {
    // Box
    this.doc
      .roundedRect(x, y, width, 80, 10)
      .fill(color);

    // Value
    this.doc
      .fontSize(28)
      .fillColor(COLORS.white)
      .text(value, x, y + 15, { width, align: 'center' });

    // Label
    this.doc
      .fontSize(10)
      .text(label, x, y + 52, { width, align: 'center' });
  }

  private drawMetricCard(x: number, y: number, width: number, height: number, 
    label: string, value: string, subtitle: string, color: string): void {
    // Card background
    this.doc
      .roundedRect(x, y, width, height, 8)
      .fillAndStroke(COLORS.white, COLORS.border);

    // Color accent bar
    this.doc
      .rect(x, y, 5, height)
      .fill(color);

    // Label
    this.doc
      .fontSize(10)
      .fillColor(COLORS.textMuted)
      .text(label, x + 15, y + 10);

    // Value
    this.doc
      .fontSize(24)
      .fillColor(COLORS.textPrimary)
      .text(value, x + 15, y + 25);

    // Subtitle
    this.doc
      .fontSize(9)
      .fillColor(COLORS.textSecondary)
      .text(subtitle, x + 15, y + 52);
  }

  private addResponseBreakdownBar(overview: SurveyAnalyticsData['overview']): void {
    const total = overview.totalResponses || 1;
    const completedWidth = (overview.completedResponses / total) * this.contentWidth;
    const inProgressWidth = (overview.inProgressResponses / total) * this.contentWidth;
    const abandonedWidth = (overview.abandonedResponses / total) * this.contentWidth;

    const barY = this.currentY;
    const barHeight = 20;

    // Background
    this.doc
      .roundedRect(this.margin, barY, this.contentWidth, barHeight, 4)
      .fill(COLORS.border);

    // Completed
    if (completedWidth > 0) {
      this.doc
        .rect(this.margin, barY, completedWidth, barHeight)
        .fill(COLORS.success);
    }

    // In Progress
    if (inProgressWidth > 0) {
      this.doc
        .rect(this.margin + completedWidth, barY, inProgressWidth, barHeight)
        .fill(COLORS.warning);
    }

    // Abandoned
    if (abandonedWidth > 0) {
      this.doc
        .rect(this.margin + completedWidth + inProgressWidth, barY, abandonedWidth, barHeight)
        .fill(COLORS.danger);
    }

    // Legend
    const legendY = barY + 30;
    
    this.doc.circle(this.margin + 5, legendY + 4, 4).fill(COLORS.success);
    this.doc.fontSize(9).fillColor(COLORS.textSecondary)
      .text(`Completed (${overview.completedResponses})`, this.margin + 15, legendY);

    this.doc.circle(this.margin + 130, legendY + 4, 4).fill(COLORS.warning);
    this.doc.text(`In Progress (${overview.inProgressResponses})`, this.margin + 140, legendY);

    this.doc.circle(this.margin + 280, legendY + 4, 4).fill(COLORS.danger);
    this.doc.text(`Abandoned (${overview.abandonedResponses})`, this.margin + 290, legendY);

    this.currentY = legendY + 20;
    this.doc.y = this.currentY;
  }

  private drawNPSGauge(x: number, y: number, width: number, height: number, score: number): void {
    const centerX = x + (width / 2);
    const centerY = y + height - 20;
    const radius = Math.min(width, height) / 2 - 10;

    // Background arc
    this.doc
      .path(`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`)
      .strokeColor(COLORS.border)
      .lineWidth(20)
      .stroke();

    // Score arc (simplified)
    const normalizedScore = (score + 100) / 200; // -100 to 100 -> 0 to 1
    const scoreAngle = Math.PI * normalizedScore;
    const scoreColor = score >= 50 ? COLORS.success : score >= 0 ? COLORS.warning : COLORS.danger;

    // Score display
    this.doc
      .fontSize(36)
      .fillColor(scoreColor)
      .text(score.toString(), x, y + 30, { width, align: 'center' });

    this.doc
      .fontSize(12)
      .fillColor(COLORS.textSecondary)
      .text('NPS Score', x, y + 75, { width, align: 'center' });

    // Scale labels
    this.doc.fontSize(8).fillColor(COLORS.textMuted);
    this.doc.text('-100', x, centerY + 5);
    this.doc.text('0', x + (width / 2) - 5, y + 5);
    this.doc.text('+100', x + width - 25, centerY + 5);
  }

  private drawNPSCategory(x: number, y: number, width: number, label: string, count: number, percentage: number, color: string): void {
    // Color indicator
    this.doc
      .circle(x + 8, y + 10, 6)
      .fill(color);

    // Label
    this.doc
      .fontSize(10)
      .fillColor(COLORS.textPrimary)
      .text(label, x + 20, y + 5);

    // Count and percentage
    this.doc
      .fontSize(14)
      .fillColor(COLORS.textPrimary)
      .text(`${count}`, x + 20, y + 20);

    this.doc
      .fontSize(10)
      .fillColor(COLORS.textMuted)
      .text(`(${percentage}%)`, x + 50, y + 22);

    // Mini bar
    const barWidth = width - 20;
    const barY = y + 38;
    
    this.doc
      .roundedRect(x, barY, barWidth, 4, 2)
      .fill(COLORS.border);
    
    if (percentage > 0) {
      this.doc
        .roundedRect(x, barY, (percentage / 100) * barWidth, 4, 2)
        .fill(color);
    }
  }

  private getNPSInterpretation(score: number): string {
    if (score >= 70) return '🎉 Excellent! Your NPS score indicates world-class customer loyalty and satisfaction.';
    if (score >= 50) return '👍 Great! Your customers are highly satisfied and likely to recommend your services.';
    if (score >= 30) return '✅ Good. There\'s room for improvement, but you have a solid base of satisfied customers.';
    if (score >= 0) return '⚠️ Needs attention. Focus on understanding and addressing customer concerns.';
    return '🔴 Critical. Immediate action is needed to improve customer satisfaction.';
  }

  private calculateQuestionCardHeight(question: QuestionAnalyticsData): number {
    let height = 80; // Base height for question text and metadata

    if (question.type === 'rating_scale') {
      const max = question.options?.max || 5;
      const min = question.options?.min || 1;
      height += 50 + ((max - min + 1) * 22);
    } else if (question.type === 'nps') {
      height += 50 + (11 * 22); // 0-10
    } else if (question.type === 'multiple_choice') {
      const choiceCount = Math.min(6, Object.keys(question.distribution).length);
      height += choiceCount * 28 + 10;
    } else if (question.type === 'text_short' || question.type === 'text_long') {
      height += 50;
    }

    return height;
  }

  private formatQuestionType(type: string): string {
    const types: Record<string, string> = {
      'rating_scale': 'RATING SCALE',
      'multiple_choice': 'MULTIPLE CHOICE',
      'text_short': 'SHORT TEXT',
      'text_long': 'LONG TEXT',
      'nps': 'NPS',
      'matrix': 'MATRIX'
    };
    return types[type] || type.toUpperCase();
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  }

  private addPageNumbers(): void {
    const pages = this.doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      this.doc.switchToPage(i);
      
      // Skip cover page
      if (i === 0) continue;

      // Page number
      this.doc
        .fontSize(9)
        .fillColor(COLORS.textMuted)
        .text(
          `Page ${i} of ${pages.count - 1}`,
          this.margin,
          this.pageHeight - 30,
          { align: 'center', width: this.contentWidth }
        );

      // Footer brand
      this.doc
        .fontSize(8)
        .text('Generated by Qualitivate.io', this.margin, this.pageHeight - 20, { 
          align: 'right', 
          width: this.contentWidth 
        });
    }
  }
}

export default PDFReportService;
