import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import { UAParser } from 'ua-parser-js';

// Get public survey for responding
// Public surveys: no auth required
// Private surveys: require authentication
export const getPublicSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { dist, lang } = req.query;

    const survey = await db('surveys')
      .where({ id: surveyId, status: 'active' })
      .first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or not active' });
    }

    // Enforce access control: private surveys require authentication
    if (!survey.is_public && !req.user) {
      return res.status(401).json({ error: 'Authentication required for this survey' });
    }

    // Check if survey has date restrictions
    const now = new Date();
    if (survey.starts_at && new Date(survey.starts_at) > now) {
      return res.status(400).json({ error: 'Survey has not started yet' });
    }
    if (survey.ends_at && new Date(survey.ends_at) < now) {
      return res.status(400).json({ error: 'Survey has ended' });
    }

    // Get questions
    const questions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index', 'asc');

    // Get translations if language specified
    const language = (lang as string) || survey.default_language || 'en';

    // Get survey translation
    const surveyTranslation = await db('survey_translations')
      .where({ survey_id: surveyId, language_code: language })
      .first();

    // Get question translations
    const questionIds = questions.map(q => q.id);
    const questionTranslations = await db('question_translations')
      .whereIn('question_id', questionIds)
      .where({ language_code: language });

    const translationMap = new Map(
      questionTranslations.map(t => [t.question_id, t])
    );

    // Apply translations to questions
    const translatedQuestions = questions.map(q => {
      const translation = translationMap.get(q.id);

      // Parse options if it's a string
      let parsedOptions = q.options;
      if (typeof q.options === 'string') {
        try {
          parsedOptions = JSON.parse(q.options);
        } catch (e) {
          parsedOptions = {};
        }
      }

      // Parse translation options if available and is a string
      let translatedOptions = translation?.options || parsedOptions;
      if (typeof translatedOptions === 'string') {
        try {
          translatedOptions = JSON.parse(translatedOptions);
        } catch (e) {
          translatedOptions = parsedOptions;
        }
      }

      return {
        id: q.id,
        type: q.type,
        content: translation?.content || q.content,
        options: translatedOptions,
        isRequired: q.is_required,
        orderIndex: q.order_index
      };
    });

    res.json({
      survey: {
        id: survey.id,
        title: surveyTranslation?.title || survey.title,
        description: surveyTranslation?.description || survey.description,
        type: survey.type,
        isAnonymous: survey.is_anonymous,
        defaultLanguage: survey.default_language,
        settings: survey.settings
      },
      questions: translatedQuestions,
      distributionId: dist
    });
  } catch (error) {
    logger.error('Get public survey error:', { error });
    res.status(500).json({ error: 'Failed to get survey' });
  }
};

// Start a survey response
export const startResponse = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { distributionId, email } = req.body;

    const survey = await db('surveys')
      .where({ id: surveyId, status: 'active' })
      .first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or not active' });
    }

    // Enforce access control: private surveys require authentication
    if (!survey.is_public && !req.user) {
      return res.status(401).json({ error: 'Authentication required for this survey' });
    }

    // Generate anonymous token
    const anonymousToken = `${distributionId || 'direct'}_${uuidv4()}`;

    // Parse User-Agent
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const parsedUA = parser.getResult();

    // Prepare metadata
    const metadata = {
      ip: req.ip,
      userAgent: userAgent,
      browser: parsedUA.browser,
      os: parsedUA.os,
      device: parsedUA.device,
      engine: parsedUA.engine,
    };

    // Build response record with optional respondent_id if user is authenticated
    const responseData: Record<string, any> = {
      id: uuidv4(),
      survey_id: surveyId,
      anonymous_token: anonymousToken,
      ip_address: req.ip,
      language_used: req.body.language || survey.default_language,
      status: 'started',
      started_at: new Date(),
      metadata: metadata,
    };

    // If user is authenticated, track the respondent
    if (req.user?.id) {
      responseData.respondent_id = req.user.id;
    }

    const [response] = await db('responses')
      .insert(responseData)
      .returning('*');

    res.status(201).json({
      responseId: response.id,
      anonymousToken: response.anonymous_token
    });
  } catch (error) {
    logger.error('Start response error:', { error });
    res.status(500).json({ error: 'Failed to start response' });
  }
};

// Save answer (can be called multiple times for progress saving)
export const saveAnswer = async (req: Request, res: Response) => {
  try {
    const { responseId } = req.params;
    // Accept both camelCase and snake_case
    const questionId = req.body.questionId || req.body.question_id;
    const { value } = req.body;

    if (!questionId) {
      return res.status(400).json({ error: 'Question ID is required' });
    }

    // Verify response exists and is not completed
    const response = await db('responses')
      .where({ id: responseId })
      .whereIn('status', ['started'])
      .first();

    if (!response) {
      return res.status(404).json({ error: 'Response not found or already completed' });
    }

    // Upsert answer
    await db('answers')
      .insert({
        id: uuidv4(),
        response_id: responseId,
        question_id: questionId,
        value: JSON.stringify(value),
        updated_at: new Date()
      })
      .onConflict(['response_id', 'question_id'])
      .merge({
        value: JSON.stringify(value),
        updated_at: new Date()
      });

    res.json({ message: 'Answer saved' });
  } catch (error) {
    logger.error('Save answer error:', { error });
    res.status(500).json({ error: 'Failed to save answer' });
  }
};

// Submit all answers at once
export const submitAnswers = async (req: Request, res: Response) => {
  try {
    const { responseId } = req.params;
    const { answers } = req.body; // Array of { questionId, value }

    // Verify response exists
    const response = await db('responses')
      .where({ id: responseId })
      .whereIn('status', ['started'])
      .first();

    if (!response) {
      return res.status(404).json({ error: 'Response not found or already completed' });
    }

    // Get required questions for validation
    const questions = await db('questions')
      .where({ survey_id: response.survey_id })
      .select('id', 'is_required');

    const requiredQuestionIds = questions
      .filter(q => q.is_required)
      .map(q => q.id);

    // Support both camelCase and snake_case
    const answeredQuestionIds = answers.map((a: any) => a.questionId || a.question_id);

    // Check if all required questions are answered
    const missingRequired = requiredQuestionIds.filter(
      id => !answeredQuestionIds.includes(id)
    );

    if (missingRequired.length > 0) {
      return res.status(400).json({
        error: 'Missing required questions',
        missingQuestionIds: missingRequired
      });
    }

    // Save all answers in transaction
    await db.transaction(async (trx) => {
      for (const answer of answers) {
        const questionId = answer.questionId || answer.question_id;
        await trx('answers')
          .insert({
            id: uuidv4(),
            response_id: responseId,
            question_id: questionId,
            value: JSON.stringify(answer.value),
            updated_at: new Date()
          })
          .onConflict(['response_id', 'question_id'])
          .merge({
            value: JSON.stringify(answer.value),
            updated_at: new Date()
          });
      }

      // Mark response as completed
      await trx('responses')
        .where({ id: responseId })
        .update({
          status: 'completed',
          completed_at: new Date()
        });
    });

    res.json({ message: 'Survey submitted successfully' });
  } catch (error) {
    logger.error('Submit answers error:', { error });
    res.status(500).json({ error: 'Failed to submit survey' });
  }
};

// Complete response
export const completeResponse = async (req: Request, res: Response) => {
  try {
    const { responseId } = req.params;

    const response = await db('responses')
      .where({ id: responseId, status: 'started' })
      .first();

    if (!response) {
      return res.status(404).json({ error: 'Response not found or already completed' });
    }

    // Check required questions
    const questions = await db('questions')
      .where({ survey_id: response.survey_id, is_required: true })
      .select('id');

    const requiredIds = questions.map(q => q.id);

    const answeredIds = await db('answers')
      .where({ response_id: responseId })
      .whereIn('question_id', requiredIds)
      .pluck('question_id');

    const missing = requiredIds.filter(id => !answeredIds.includes(id));

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Please answer all required questions',
        missingQuestionIds: missing
      });
    }

    await db('responses')
      .where({ id: responseId })
      .update({
        status: 'completed',
        completed_at: new Date()
      });

    res.json({ message: 'Survey completed successfully' });
  } catch (error) {
    logger.error('Complete response error:', { error });
    res.status(500).json({ error: 'Failed to complete response' });
  }
};

// Get available languages for a survey
export const getSurveyLanguages = async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;

    const survey = await db('surveys')
      .where({ id: surveyId })
      .select('default_language')
      .first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const translations = await db('survey_translations')
      .where({ survey_id: surveyId })
      .select('language_code');

    const languages = [
      survey.default_language,
      ...translations.map(t => t.language_code)
    ].filter((v, i, a) => a.indexOf(v) === i); // unique

    res.json({ languages });
  } catch (error) {
    logger.error('Get survey languages error:', { error });
    res.status(500).json({ error: 'Failed to get languages' });
  }
};

// Get response progress (for resuming surveys)
export const getResponseProgress = async (req: Request, res: Response) => {
  try {
    const { responseId } = req.params;

    const response = await db('responses')
      .where({ id: responseId })
      .first();

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Get all saved answers for this response
    const savedAnswers = await db('answers')
      .where({ response_id: responseId })
      .select('question_id', 'value');

    const answers: Record<string, any> = {};
    savedAnswers.forEach(a => {
      try {
        answers[a.question_id] = JSON.parse(a.value);
      } catch {
        answers[a.question_id] = a.value;
      }
    });

    res.json({
      responseId: response.id,
      surveyId: response.survey_id,
      status: response.status,
      anonymousToken: response.anonymous_token,
      answers,
      startedAt: response.started_at
    });
  } catch (error) {
    logger.error('Get response progress error:', { error });
    res.status(500).json({ error: 'Failed to get response progress' });
  }
};

// Get survey settings (for thank you page)
export const getSurveySettings = async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;

    const survey = await db('surveys')
      .where({ id: surveyId })
      .select('id', 'title', 'settings')
      .first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.json({
      surveyId: survey.id,
      title: survey.title,
      settings: survey.settings || {}
    });
  } catch (error) {
    logger.error('Get survey settings error:', { error });
    res.status(500).json({ error: 'Failed to get survey settings' });
  }
};

// Get user's survey completion status (which surveys they've completed)
export const getUserSurveyStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all responses for this user (by email match or respondent_id)
    const completedResponses = await db('responses')
      .where({ respondent_id: userId, status: 'completed' })
      .select('survey_id', 'completed_at');

    const completedSurveyIds = completedResponses.map(r => r.survey_id);

    res.json({
      completedSurveyIds,
      completions: completedResponses.map(r => ({
        surveyId: r.survey_id,
        completedAt: r.completed_at
      }))
    });
  } catch (error) {
    logger.error('Get user survey status error:', { error });
    res.status(500).json({ error: 'Failed to get survey status' });
  }
};

// Get user's completed surveys with details
export const getUserCompletedSurveys = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const companyId = req.user!.companyId;

    // Get completed responses with survey details
    const completedSurveys = await db('responses')
      .join('surveys', 'responses.survey_id', 'surveys.id')
      .where({ 'responses.respondent_id': userId, 'responses.status': 'completed' })
      .where('surveys.company_id', companyId)
      .select(
        'surveys.id',
        'surveys.title',
        'surveys.description',
        'surveys.type',
        'responses.completed_at'
      )
      .orderBy('responses.completed_at', 'desc');

    res.json({
      data: completedSurveys,
      total: completedSurveys.length
    });
  } catch (error) {
    logger.error('Get user completed surveys error:', { error });
    res.status(500).json({ error: 'Failed to get completed surveys' });
  }
};
