import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Get survey analytics overview
 * Returns: response counts, completion rates, NPS scores
 */
export const getSurveyAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const user = req.user!;

    // Verify survey exists and user has access
    const survey = await db('surveys')
      .where({ id: surveyId })
      .first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Check access rights
    if (user.role !== 'super_admin' && survey.company_id !== user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get response statistics
    const responseStats = await db('responses')
      .where({ survey_id: surveyId })
      .select(
        db.raw('COUNT(*) as total_responses'),
        db.raw("COUNT(*) FILTER (WHERE status = 'completed') as completed_responses"),
        db.raw("COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_responses"),
        db.raw("COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned_responses"),
        db.raw('MIN(started_at) as first_response'),
        db.raw('MAX(completed_at) as last_response')
      )
      .first();

    // Get average completion time
    const avgCompletionTime = await db('responses')
      .where({ survey_id: surveyId, status: 'completed' })
      .whereNotNull('completed_at')
      .select(
        db.raw("AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_seconds")
      )
      .first();

    // Get questions for this survey
    const questions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index');

    // Calculate NPS if survey has NPS questions
    const npsQuestions = questions.filter((q: any) => q.type === 'nps');
    let npsData = null;

    if (npsQuestions.length > 0) {
      const npsAnswers = await db('answers')
        .join('responses', 'answers.response_id', 'responses.id')
        .whereIn('answers.question_id', npsQuestions.map((q: any) => q.id))
        .where('responses.status', 'completed')
        .select('answers.value');

      const scores = npsAnswers.map((a: any) => {
        const answer = typeof a.value === 'string' ? JSON.parse(a.value) : a.value;
        return parseInt(answer.value || answer, 10);
      }).filter((s: number) => !isNaN(s));

      if (scores.length > 0) {
        const promoters = scores.filter((s: number) => s >= 9).length;
        const passives = scores.filter((s: number) => s >= 7 && s <= 8).length;
        const detractors = scores.filter((s: number) => s <= 6).length;
        const total = scores.length;

        npsData = {
          score: Math.round(((promoters - detractors) / total) * 100),
          promoters: { count: promoters, percentage: Math.round((promoters / total) * 100) },
          passives: { count: passives, percentage: Math.round((passives / total) * 100) },
          detractors: { count: detractors, percentage: Math.round((detractors / total) * 100) },
          totalResponses: total
        };
      }
    }

    // Get response trend (daily counts for last 30 days)
    const responseTrend = await db('responses')
      .where({ survey_id: surveyId })
      .where('started_at', '>=', db.raw("NOW() - INTERVAL '30 days'"))
      .select(
        db.raw("DATE(started_at) as date"),
        db.raw("COUNT(*) as count"),
        db.raw("COUNT(*) FILTER (WHERE status = 'completed') as completed")
      )
      .groupBy(db.raw('DATE(started_at)'))
      .orderBy('date');

    // Calculate completion rate
    const totalResponses = parseInt(responseStats?.total_responses || '0', 10);
    const completedResponses = parseInt(responseStats?.completed_responses || '0', 10);
    const completionRate = totalResponses > 0 
      ? Math.round((completedResponses / totalResponses) * 100) 
      : 0;

    res.json({
      survey: {
        id: survey.id,
        title: survey.title,
        type: survey.type,
        status: survey.status,
        startsAt: survey.starts_at,
        endsAt: survey.ends_at
      },
      overview: {
        totalResponses,
        completedResponses,
        inProgressResponses: parseInt(responseStats?.in_progress_responses || '0', 10),
        abandonedResponses: parseInt(responseStats?.abandoned_responses || '0', 10),
        completionRate,
        avgCompletionTimeSeconds: Math.round(avgCompletionTime?.avg_seconds || 0),
        firstResponseAt: responseStats?.first_response,
        lastResponseAt: responseStats?.last_response
      },
      nps: npsData,
      trend: responseTrend,
      questionCount: questions.length
    });
  } catch (error) {
    console.error('Get survey analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch survey analytics' });
  }
};

/**
 * Get detailed question analytics
 * Returns: answer distribution for each question
 */
export const getQuestionAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const user = req.user!;

    // Verify survey exists and user has access
    const survey = await db('surveys')
      .where({ id: surveyId })
      .first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (user.role !== 'super_admin' && survey.company_id !== user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get questions with answer counts
    const questions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index');

    const questionAnalytics = await Promise.all(questions.map(async (question: any) => {
      // Get all answers for this question from completed responses
      const answers = await db('answers')
        .join('responses', 'answers.response_id', 'responses.id')
        .where('answers.question_id', question.id)
        .where('responses.status', 'completed')
        .select('answers.value');

      const totalAnswers = answers.length;
      let distribution: any = {};
      let stats: any = {};

      switch (question.type) {
        case 'nps':
        case 'rating_scale':
          // Numeric distribution
          const numericValues = answers.map((a: any) => {
            const answer = typeof a.value === 'string' ? JSON.parse(a.value) : a.value;
            return parseInt(answer.value || answer, 10);
          }).filter((v: number) => !isNaN(v));

          if (numericValues.length > 0) {
            const sum = numericValues.reduce((a: number, b: number) => a + b, 0);
            stats = {
              average: Math.round((sum / numericValues.length) * 100) / 100,
              min: Math.min(...numericValues),
              max: Math.max(...numericValues),
              count: numericValues.length
            };

            // Create distribution
            numericValues.forEach((v: number) => {
              distribution[v] = (distribution[v] || 0) + 1;
            });
          }
          break;

        case 'multiple_choice':
          // Choice distribution
          answers.forEach((a: any) => {
            const answer = typeof a.value === 'string' ? JSON.parse(a.value) : a.value;
            const values = Array.isArray(answer.value) ? answer.value : [answer.value || answer];
            values.forEach((v: string) => {
              if (v) {
                distribution[v] = (distribution[v] || 0) + 1;
              }
            });
          });
          break;

        case 'text_short':
        case 'text_long':
          // Text responses - just count and sample
          stats = {
            count: totalAnswers,
            avgLength: Math.round(
              answers.reduce((sum: number, a: any) => {
                const answer = typeof a.value === 'string' ? JSON.parse(a.value) : a.value;
                const text = answer.value || answer || '';
                return sum + text.length;
              }, 0) / (totalAnswers || 1)
            )
          };
          break;

        case 'matrix':
          // Matrix distribution by row
          answers.forEach((a: any) => {
            const answer = typeof a.value === 'string' ? JSON.parse(a.value) : a.value;
            if (answer && typeof answer === 'object') {
              Object.entries(answer).forEach(([row, value]) => {
                if (!distribution[row]) distribution[row] = {};
                const v = String(value);
                distribution[row][v] = (distribution[row][v] || 0) + 1;
              });
            }
          });
          break;
      }

      return {
        questionId: question.id,
        questionText: question.content,
        type: question.type,
        required: question.is_required,
        totalAnswers,
        distribution,
        stats,
        options: question.options
      };
    }));

    res.json({
      surveyId,
      questions: questionAnalytics
    });
  } catch (error) {
    console.error('Get question analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch question analytics' });
  }
};

/**
 * Get individual responses list
 * Supports pagination and filtering
 */
export const getResponses = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const user = req.user!;

    // Verify survey exists and user has access
    const survey = await db('surveys')
      .where({ id: surveyId })
      .first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (user.role !== 'super_admin' && survey.company_id !== user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build query
    let query = db('responses')
      .where({ survey_id: surveyId });

    if (status) {
      query = query.where({ status });
    }

    if (startDate) {
      query = query.where('started_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('started_at', '<=', endDate);
    }

    // Get total count
    const countResult = await query.clone().count('* as count').first();
    const total = parseInt(countResult?.count as string || '0', 10);

    // Get paginated responses
    const offset = (Number(page) - 1) * Number(limit);
    const responses = await query
      .select(
        'responses.id',
        'responses.status',
        'responses.started_at',
        'responses.completed_at',
        'responses.anonymous_token'
      )
      .orderBy('responses.started_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    // Get answer counts for each response
    const responseIds = responses.map((r: any) => r.id);
    const answerCounts = await db('answers')
      .whereIn('response_id', responseIds)
      .select('response_id')
      .count('* as count')
      .groupBy('response_id');

    const answerCountMap = answerCounts.reduce((map: any, item: any) => {
      map[item.response_id] = parseInt(item.count, 10);
      return map;
    }, {});

    // Get total questions
    const questionCount = await db('questions')
      .where({ survey_id: surveyId })
      .count('* as count')
      .first();

    const totalQuestions = parseInt(questionCount?.count as string || '0', 10);

    const formattedResponses = responses.map((r: any) => ({
      id: r.id,
      status: r.status,
      respondentEmail: r.respondent_email || (survey.is_anonymous ? 'Anonymous' : 'Unknown'),
      startedAt: r.started_at,
      completedAt: r.completed_at,
      answeredQuestions: answerCountMap[r.id] || 0,
      totalQuestions,
      completionPercentage: Math.round(((answerCountMap[r.id] || 0) / totalQuestions) * 100),
      metadata: r.metadata
    }));

    res.json({
      responses: formattedResponses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
};

/**
 * Get single response details with all answers
 */
export const getResponseDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { responseId } = req.params;
    const user = req.user!;

    // Get response with survey info
    const response = await db('responses')
      .join('surveys', 'responses.survey_id', 'surveys.id')
      .where('responses.id', responseId)
      .select(
        'responses.*',
        'surveys.title as survey_title',
        'surveys.company_id',
        'surveys.is_anonymous'
      )
      .first();

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    if (user.role !== 'super_admin' && response.company_id !== user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Response info
    const respondentInfo = response.is_anonymous 
      ? { anonymous: true }
      : { token: response.anonymous_token };

    // Get all answers with questions
    const answers = await db('answers')
      .join('questions', 'answers.question_id', 'questions.id')
      .where('answers.response_id', responseId)
      .select(
        'answers.id as answer_id',
        'answers.value',
        'answers.updated_at',
        'questions.id as question_id',
        'questions.content as question_text',
        'questions.type as question_type',
        'questions.options as question_options',
        'questions.order_index'
      )
      .orderBy('questions.order_index');

    // Calculate duration
    let durationSeconds = null;
    if (response.completed_at && response.started_at) {
      durationSeconds = Math.round(
        (new Date(response.completed_at).getTime() - new Date(response.started_at).getTime()) / 1000
      );
    }

    res.json({
      id: response.id,
      surveyId: response.survey_id,
      surveyTitle: response.survey_title,
      status: response.status,
      startedAt: response.started_at,
      completedAt: response.completed_at,
      durationSeconds,
      respondent: respondentInfo,
      answers: answers.map((a: any) => ({
        answerId: a.answer_id,
        questionId: a.question_id,
        questionText: a.question_text,
        questionType: a.question_type,
        questionOptions: a.question_options,
        answer: typeof a.value === 'string' ? JSON.parse(a.value) : a.value,
        answeredAt: a.updated_at
      }))
    });
  } catch (error) {
    console.error('Get response details error:', error);
    res.status(500).json({ error: 'Failed to fetch response details' });
  }
};

/**
 * Export responses to CSV format
 */
export const exportResponses = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { format = 'csv' } = req.query;
    const user = req.user!;

    // Verify survey exists and user has access
    const survey = await db('surveys')
      .where({ id: surveyId })
      .first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (user.role !== 'super_admin' && survey.company_id !== user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get questions
    const questions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index');

    // Get all completed responses with answers
    const responses = await db('responses')
      .where({ survey_id: surveyId, status: 'completed' })
      .select(
        'responses.id',
        'responses.started_at',
        'responses.completed_at',
        'responses.anonymous_token'
      )
      .orderBy('responses.completed_at', 'desc');

    // Get all answers for these responses
    const responseIds = responses.map((r: any) => r.id);
    const allAnswers = await db('answers')
      .whereIn('response_id', responseIds)
      .select('response_id', 'question_id', 'value');

    // Build answer map
    const answerMap: Record<string, Record<string, any>> = {};
    allAnswers.forEach((a: any) => {
      if (!answerMap[a.response_id]) answerMap[a.response_id] = {};
      const answer = typeof a.value === 'string' ? JSON.parse(a.value) : a.value;
      answerMap[a.response_id][a.question_id] = answer.value || answer;
    });

    if (format === 'json') {
      // Return JSON format
      const data = responses.map((r: any) => {
        const row: any = {
          responseId: r.id,
          respondent: survey.is_anonymous ? 'Anonymous' : (r.anonymous_token || 'Unknown'),
          startedAt: r.started_at,
          completedAt: r.completed_at
        };
        questions.forEach((q: any) => {
          row[`Q${q.order_index + 1}: ${q.content.substring(0, 50)}`] = 
            answerMap[r.id]?.[q.id] ?? '';
        });
        return row;
      });

      return res.json({ data, total: data.length });
    }

    // Build CSV
    const headers = [
      'Response ID',
      'Respondent',
      'Started At',
      'Completed At',
      ...questions.map((q: any) => `Q${q.order_index + 1}: ${q.content.substring(0, 50)}`)
    ];

    const rows = responses.map((r: any) => {
      const row = [
        r.id,
        survey.is_anonymous ? 'Anonymous' : (r.anonymous_token || 'Unknown'),
        r.started_at,
        r.completed_at,
        ...questions.map((q: any) => {
          const answer = answerMap[r.id]?.[q.id];
          if (answer === undefined || answer === null) return '';
          if (Array.isArray(answer)) return answer.join('; ');
          if (typeof answer === 'object') return JSON.stringify(answer);
          return String(answer);
        })
      ];
      return row;
    });

    // Generate CSV string
    const escapeCSV = (value: any) => {
      const str = String(value ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${survey.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export responses error:', error);
    res.status(500).json({ error: 'Failed to export responses' });
  }
};

/**
 * Get company-wide analytics dashboard
 */
export const getCompanyAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { startDate, endDate } = req.query;

    let companyFilter = {};
    if (user.role !== 'super_admin') {
      companyFilter = { company_id: user.companyId };
    }

    // Get survey counts by status
    const surveyCounts = await db('surveys')
      .where(companyFilter)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw("COUNT(*) FILTER (WHERE status = 'draft') as draft"),
        db.raw("COUNT(*) FILTER (WHERE status = 'active') as active"),
        db.raw("COUNT(*) FILTER (WHERE status = 'closed') as closed")
      )
      .first();

    // Get total responses
    let responseQuery = db('responses')
      .join('surveys', 'responses.survey_id', 'surveys.id');
    
    if (user.role !== 'super_admin') {
      responseQuery = responseQuery.where('surveys.company_id', user.companyId);
    }

    if (startDate) {
      responseQuery = responseQuery.where('responses.started_at', '>=', startDate);
    }
    if (endDate) {
      responseQuery = responseQuery.where('responses.started_at', '<=', endDate);
    }

    const responseStats = await responseQuery
      .select(
        db.raw('COUNT(*) as total'),
        db.raw("COUNT(*) FILTER (WHERE responses.status = 'completed') as completed")
      )
      .first();

    // Get top surveys by response count
    let topSurveysQuery = db('surveys')
      .leftJoin('responses', 'surveys.id', 'responses.survey_id')
      .where('surveys.status', 'active');

    if (user.role !== 'super_admin') {
      topSurveysQuery = topSurveysQuery.where('surveys.company_id', user.companyId);
    }

    const topSurveys = await topSurveysQuery
      .select(
        'surveys.id',
        'surveys.title',
        'surveys.type',
        db.raw('COUNT(responses.id) as response_count'),
        db.raw("COUNT(responses.id) FILTER (WHERE responses.status = 'completed') as completed_count")
      )
      .groupBy('surveys.id')
      .orderBy('response_count', 'desc')
      .limit(5);

    // Get recent responses trend
    let trendQuery = db('responses')
      .join('surveys', 'responses.survey_id', 'surveys.id')
      .where('responses.started_at', '>=', db.raw("NOW() - INTERVAL '30 days'"));

    if (user.role !== 'super_admin') {
      trendQuery = trendQuery.where('surveys.company_id', user.companyId);
    }

    const responseTrend = await trendQuery
      .select(
        db.raw("DATE(responses.started_at) as date"),
        db.raw('COUNT(*) as count')
      )
      .groupBy(db.raw("DATE(responses.started_at)"))
      .orderBy('date');

    // Calculate overall NPS if applicable
    let npsQuery = db('answers')
      .join('questions', 'answers.question_id', 'questions.id')
      .join('responses', 'answers.response_id', 'responses.id')
      .join('surveys', 'responses.survey_id', 'surveys.id')
      .where('questions.type', 'nps')
      .where('responses.status', 'completed');

    if (user.role !== 'super_admin') {
      npsQuery = npsQuery.where('surveys.company_id', user.companyId);
    }

    const npsAnswers = await npsQuery.select('answers.value');

    let overallNps = null;
    if (npsAnswers.length > 0) {
      const scores = npsAnswers.map((a: any) => {
        const answer = typeof a.value === 'string' ? JSON.parse(a.value) : a.value;
        return parseInt(answer.value || answer, 10);
      }).filter((s: number) => !isNaN(s));

      if (scores.length > 0) {
        const promoters = scores.filter((s: number) => s >= 9).length;
        const detractors = scores.filter((s: number) => s <= 6).length;
        overallNps = Math.round(((promoters - detractors) / scores.length) * 100);
      }
    }

    res.json({
      surveys: {
        total: parseInt(surveyCounts?.total || '0', 10),
        draft: parseInt(surveyCounts?.draft || '0', 10),
        active: parseInt(surveyCounts?.active || '0', 10),
        closed: parseInt(surveyCounts?.closed || '0', 10)
      },
      responses: {
        total: parseInt(responseStats?.total || '0', 10),
        completed: parseInt(responseStats?.completed || '0', 10),
        completionRate: responseStats?.total > 0 
          ? Math.round((responseStats.completed / responseStats.total) * 100) 
          : 0
      },
      overallNps,
      topSurveys: topSurveys.map((s: any) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        responseCount: parseInt(s.response_count, 10),
        completedCount: parseInt(s.completed_count, 10)
      })),
      trend: responseTrend
    });
  } catch (error) {
    console.error('Get company analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch company analytics' });
  }
};
