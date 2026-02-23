import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import {
  VALID_SURVEY_TYPES,
  SurveyType,
  isValidSurveyType,
  VALID_SURVEY_STATUSES,
  SurveyStatus,
  isValidSurveyStatus,
  isValidDateRange,
} from '../types/domain';


export const listSurveys = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { page = 1, limit = 20, search = '', type, status, companyId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('surveys')
      .select(
        'surveys.*',
        'users.first_name as creator_first_name',
        'users.last_name as creator_last_name',
        'companies.name as company_name'
      )
      .leftJoin('users', 'surveys.created_by', 'users.id')
      .leftJoin('companies', 'surveys.company_id', 'companies.id');

    if (user.role === 'super_admin') {
      if (companyId === 'general') {
        query = query.whereNull('surveys.company_id');
      } else if (companyId) {
        query = query.where('surveys.company_id', companyId);
      }
    } else if (user.role === 'company_admin') {
      query = query.where('surveys.company_id', user.companyId!);
    } else if (user.role === 'site_admin' || user.role === 'department_admin') {
      query = query.where('surveys.company_id', user.companyId!);
    } else if (user.role === 'user') {
      // Regular users can only see active surveys in their company
      query = query
        .where('surveys.company_id', user.companyId!)
        .where('surveys.status', 'active');
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where('surveys.title', 'ilike', `%${search}%`)
          .orWhere('surveys.description', 'ilike', `%${search}%`);
      });
    }

    if (type) query = query.where('surveys.type', type);
    if (status) query = query.where('surveys.status', status);

    const surveys = await query
      .orderBy('surveys.created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const [{ count }] = await db('surveys')
      .count('* as count')
      .modify((builder) => {
        if (user.role === 'company_admin' || user.role === 'site_admin' || user.role === 'department_admin') {
          builder.where('company_id', user.companyId!);
        } else if (user.role === 'user') {
          builder.where('company_id', user.companyId!).where('status', 'active');
        } else if (user.role === 'super_admin') {
          if (companyId === 'general') {
            builder.whereNull('company_id');
          } else if (companyId) {
            builder.where('company_id', companyId);
          }
        }
        // Include search filter in count query
        if (search) {
          builder.where((qb) => {
            qb.where('title', 'ilike', `%${search}%`)
              .orWhere('description', 'ilike', `%${search}%`);
          });
        }
        if (type) builder.where('type', type);
        if (status) builder.where('status', status);
      });

    res.json({
      data: surveys,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        totalPages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('', { error });
    res.status(500).json({ error: 'Failed to list surveys' });
  }
};

export const getSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const survey = await db('surveys')
      .select('surveys.*', 'users.first_name as creator_first_name', 'users.last_name as creator_last_name')
      .leftJoin('users', 'surveys.created_by', 'users.id')
      .where('surveys.id', id)
      .first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== survey.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const questions = await db('questions')
      .where({ survey_id: id })
      .orderBy('order_index', 'asc');

    const [responsesCount] = await db('responses')
      .where({ survey_id: id })
      .count('* as count');

    res.json({
      ...survey,
      questions,
      stats: {
        responses: Number(responsesCount.count)
      }
    });
  } catch (error) {
    logger.error('', { error });
    res.status(500).json({ error: 'Failed to get survey' });
  }
};

export const createSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      type,
      isPublic = false,
      isAnonymous,
      allowAnonymous,
      defaultLanguage = 'en',
      settings = {},
      startsAt,
      endsAt,
      status
    } = req.body;

    const user = req.user!;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate type enum
    if (!type || !isValidSurveyType(type)) {
      return res.status(400).json({ error: `Invalid survey type. Must be one of: ${VALID_SURVEY_TYPES.join(', ')}` });
    }

    // Validate boolean fields
    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ error: 'isPublic must be a boolean' });
    }
    const resolvedIsAnonymous = isAnonymous !== undefined ? isAnonymous : (allowAnonymous !== undefined ? allowAnonymous : false);
    if (typeof resolvedIsAnonymous !== 'boolean') {
      return res.status(400).json({ error: 'isAnonymous must be a boolean' });
    }

    // Validate date range
    if (!isValidDateRange(startsAt, endsAt)) {
      return res.status(400).json({ error: 'startsAt must be before or equal to endsAt' });
    }

    let companyId = user.companyId;
    if (user.role === 'super_admin') {
      // Super admin can specify a company or create a general survey (null company)
      companyId = req.body.companyId || null;
    }

    // Non-super_admin users must have a company
    if (user.role !== 'super_admin' && !companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const targetStatus = status && isValidSurveyStatus(status) ? status : 'draft';

    const [survey] = await db('surveys')
      .insert({
        id: uuidv4(),
        company_id: companyId,
        created_by: user.id,
        title,
        description: description || null,
        type,
        status: targetStatus,
        is_public: isPublic,
        is_anonymous: resolvedIsAnonymous,
        default_language: defaultLanguage,
        settings,
        starts_at: startsAt || null,
        ends_at: endsAt || null
      })
      .returning('*');

    res.status(201).json(survey);
  } catch (error) {
    logger.error('', { error });
    res.status(500).json({ error: 'Failed to create survey' });
  }
};

export const updateSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      isPublic,
      isAnonymous,
      allowAnonymous,
      defaultLanguage,
      settings,
      startsAt,
      endsAt
    } = req.body;

    const user = req.user!;

    const survey = await db('surveys').where({ id }).first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== survey.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      updateData.title = title;
    }
    if (description !== undefined) updateData.description = description;

    // Validate status enum and transitions
    if (status !== undefined) {
      if (!isValidSurveyStatus(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_SURVEY_STATUSES.join(', ')}` });
      }
      // Prevent reopening closed surveys with responses
      if (survey.status === 'closed' && status === 'active') {
        const [{ count }] = await db('responses')
          .where({ survey_id: id })
          .count('* as count');
        if (Number(count) > 0) {
          return res.status(400).json({ error: 'Cannot reactivate a closed survey with existing responses' });
        }
      }
      updateData.status = status;
    }

    if (isPublic !== undefined) {
      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ error: 'isPublic must be a boolean' });
      }
      updateData.is_public = isPublic;
    }
    const resolvedIsAnonymous = isAnonymous !== undefined ? isAnonymous : allowAnonymous;
    if (resolvedIsAnonymous !== undefined) {
      if (typeof resolvedIsAnonymous !== 'boolean') {
        return res.status(400).json({ error: 'isAnonymous must be a boolean' });
      }
      updateData.is_anonymous = resolvedIsAnonymous;
    }
    if (defaultLanguage !== undefined) updateData.default_language = defaultLanguage;
    if (settings !== undefined) updateData.settings = settings;

    // Validate date range with existing values
    const newStartsAt = startsAt !== undefined ? startsAt : survey.starts_at;
    const newEndsAt = endsAt !== undefined ? endsAt : survey.ends_at;
    if (!isValidDateRange(newStartsAt, newEndsAt)) {
      return res.status(400).json({ error: 'startsAt must be before or equal to endsAt' });
    }
    if (startsAt !== undefined) updateData.starts_at = startsAt;
    if (endsAt !== undefined) updateData.ends_at = endsAt;

    const [updatedSurvey] = await db('surveys')
      .where({ id })
      .update(updateData)
      .returning('*');

    res.json(updatedSurvey);
  } catch (error) {
    logger.error('', { error });
    res.status(500).json({ error: 'Failed to update survey' });
  }
};

export const deleteSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const survey = await db('surveys').where({ id }).first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== survey.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Use transaction to ensure cascade deletion is atomic
    // Even though DB has CASCADE, this provides application-level guarantee
    await db.transaction(async (trx) => {
      // Delete in correct order due to FK relationships
      // Get all question IDs first
      const questionIds = await trx('questions')
        .where({ survey_id: id })
        .pluck('id');

      if (questionIds.length > 0) {
        // Delete question translations
        await trx('question_translations')
          .whereIn('question_id', questionIds)
          .delete();

        // Delete answers
        await trx('answers')
          .whereIn('question_id', questionIds)
          .delete();
      }

      // Delete questions
      await trx('questions').where({ survey_id: id }).delete();

      // Delete responses
      await trx('responses').where({ survey_id: id }).delete();

      // Delete survey translations
      await trx('survey_translations').where({ survey_id: id }).delete();

      // Delete survey distributions
      await trx('survey_distributions').where({ survey_id: id }).delete();

      // Finally delete the survey
      await trx('surveys').where({ id }).delete();
    });

    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    logger.error('', { error });
    res.status(500).json({ error: 'Failed to delete survey' });
  }
};

export const duplicateSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const survey = await db('surveys').where({ id }).first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== survey.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const questions = await db('questions')
      .where({ survey_id: id })
      .orderBy('order_index', 'asc');

    // Fetch question translations for all questions
    const questionIds = questions.map(q => q.id);
    const questionTranslations = questionIds.length > 0
      ? await db('question_translations').whereIn('question_id', questionIds)
      : [];

    // Fetch survey translations
    const surveyTranslations = await db('survey_translations')
      .where({ survey_id: id });

    const newSurveyId = uuidv4();

    // Use transaction for atomic duplication
    const result = await db.transaction(async (trx) => {
      const [newSurvey] = await trx('surveys')
        .insert({
          id: newSurveyId,
          company_id: survey.company_id,
          created_by: user.id,
          title: `${survey.title} (Copy)`,
          description: survey.description,
          type: survey.type,
          status: 'draft',
          is_public: survey.is_public,
          is_anonymous: survey.is_anonymous,
          default_language: survey.default_language,
          settings: survey.settings
        })
        .returning('*');

      // Duplicate survey translations
      if (surveyTranslations.length > 0) {
        const newSurveyTranslations = surveyTranslations.map(st => ({
          id: uuidv4(),
          survey_id: newSurveyId,
          language_code: st.language_code,
          title: st.title,
          description: st.description
        }));
        await trx('survey_translations').insert(newSurveyTranslations);
      }

      // Duplicate questions and their translations
      if (questions.length > 0) {
        // Create mapping from old question ID to new question ID
        const questionIdMap = new Map<string, string>();

        const newQuestions = questions.map((q) => {
          const newId = uuidv4();
          questionIdMap.set(q.id, newId);
          return {
            id: newId,
            survey_id: newSurveyId,
            type: q.type,
            content: q.content,
            options: q.options,
            is_required: q.is_required,
            order_index: q.order_index
          };
        });

        await trx('questions').insert(newQuestions);

        // Duplicate question translations
        if (questionTranslations.length > 0) {
          const newQuestionTranslations = questionTranslations.map(qt => ({
            id: uuidv4(),
            question_id: questionIdMap.get(qt.question_id)!,
            language_code: qt.language_code,
            content: qt.content,
            options: qt.options
          }));
          await trx('question_translations').insert(newQuestionTranslations);
        }
      }

      return newSurvey;
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('', { error });
    res.status(500).json({ error: 'Failed to duplicate survey' });
  }
};
