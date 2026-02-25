import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import {
  VALID_TEMPLATE_TYPES,
  TemplateType,
  isValidTemplateType,
  VALID_QUESTION_TYPES,
  QuestionType,
  isValidQuestionType,
} from '../types/domain';

const normalizeJson = <T>(value: T | string | null | undefined, fallback: T): T => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
};


// List templates (global + company-specific)
export const listTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { category, includeGlobal = 'true' } = req.query;

    let query = db('survey_templates')
      .select(
        'survey_templates.*',
        'users.first_name as creator_first_name',
        'users.last_name as creator_last_name',
        db.raw('(SELECT COUNT(*) FROM template_questions WHERE template_id = survey_templates.id) as question_count')
      )
      .leftJoin('users', 'survey_templates.created_by', 'users.id');

    // Filter by access
    if (user.role === 'super_admin') {
      // Super admin sees all
    } else {
      // Others see global templates + their company's templates
      query = query.where((builder) => {
        builder.where('survey_templates.is_global', true);
        if (user.companyId) {
          builder.orWhere('survey_templates.company_id', user.companyId);
        }
      });
    }

    if (category) {
      query = query.where('survey_templates.category', category);
    }

    if (includeGlobal === 'false') {
      query = query.where('survey_templates.is_global', false);
    }

    const templates = await query.orderBy([
      { column: 'survey_templates.is_global', order: 'desc' },
      { column: 'survey_templates.use_count', order: 'desc' },
      { column: 'survey_templates.created_at', order: 'desc' }
    ]);

    res.json(templates);
  } catch (error: any) {
    logger.error('Error listing templates:', { error });
    res.status(500).json({ error: 'Failed to list templates' });
  }
};

// Get single template with questions
export const getTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const template = await db('survey_templates')
      .select(
        'survey_templates.*',
        'users.first_name as creator_first_name',
        'users.last_name as creator_last_name'
      )
      .leftJoin('users', 'survey_templates.created_by', 'users.id')
      .where('survey_templates.id', id)
      .first();

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check access
    if (!template.is_global && template.company_id !== user.companyId && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get questions
    const questions = await db('template_questions')
      .where('template_id', id)
      .orderBy('order_index', 'asc');

    res.json({ ...template, questions });
  } catch (error: any) {
    logger.error('Error getting template:', { error });
    res.status(500).json({ error: 'Failed to get template' });
  }
};

// Create template
export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { name, description, category, type = 'custom', isGlobal = false, isAnonymous = false, questions = [] } = req.body;

    // Validation
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    if (!isValidTemplateType(type)) {
      return res.status(400).json({ error: 'Invalid template type' });
    }

    // Only super_admin can create global templates
    if (isGlobal && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can create global templates' });
    }

    // Only company_admin+ can create company templates
    if (!['super_admin', 'company_admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to create templates' });
    }

    const trx = await db.transaction();

    try {
      const templateId = uuidv4();

      await trx('survey_templates').insert({
        id: templateId,
        company_id: isGlobal ? null : user.companyId,
        created_by: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        type,
        is_global: isGlobal,
        is_anonymous: isAnonymous,
        default_settings: {},
      });

      // Insert questions
      if (questions.length > 0) {
        const questionInserts = questions.map((q: any, index: number) => {
          if (!isValidQuestionType(q.type)) {
            throw new Error(`Invalid question type: ${q.type}`);
          }
          return {
            id: uuidv4(),
            template_id: templateId,
            type: q.type,
            content: q.content,
            options: normalizeJson(q.options ?? {}, {}),
            is_required: q.isRequired || false,
            order_index: index,
          };
        });

        await trx('template_questions').insert(questionInserts);
      }

      await trx.commit();

      const template = await db('survey_templates').where('id', templateId).first();
      const templateQuestions = await db('template_questions').where('template_id', templateId).orderBy('order_index');

      res.status(201).json({ ...template, questions: templateQuestions });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error creating template:', { error });
    res.status(500).json({ error: error.message || 'Failed to create template' });
  }
};

// Update template
export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { name, description, category, isAnonymous } = req.body;

    const template = await db('survey_templates').where('id', id).first();

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check permissions
    if (template.is_global && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can update global templates' });
    }

    if (!template.is_global && template.company_id !== user.companyId && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db('survey_templates').where('id', id).update({
      name: name?.trim() || template.name,
      description: description !== undefined ? description?.trim() : template.description,
      category: category !== undefined ? category?.trim() : template.category,
      is_anonymous: isAnonymous !== undefined ? isAnonymous : template.is_anonymous,
      updated_at: db.fn.now(),
    });

    const updated = await db('survey_templates').where('id', id).first();
    res.json(updated);
  } catch (error: any) {
    logger.error('Error updating template:', { error });
    res.status(500).json({ error: 'Failed to update template' });
  }
};

// Delete template
export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const template = await db('survey_templates').where('id', id).first();

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check permissions
    if (template.is_global && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can delete global templates' });
    }

    if (!template.is_global && template.company_id !== user.companyId && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db('survey_templates').where('id', id).delete();
    res.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting template:', { error });
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

// Create survey from template
export const createSurveyFromTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { title, description, company_id } = req.body;

    logger.debug('Creating survey from template:', { templateId: id, title, company_id, userId: user.id, userCompanyId: user.companyId });

    // Get template with questions
    const template = await db('survey_templates').where('id', id).first();

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check access
    if (!template.is_global && template.company_id !== user.companyId && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Determine target company
    let targetCompanyId = user.companyId;
    if (user.role === 'super_admin') {
      targetCompanyId = company_id || null;
    }

    if (user.role !== 'super_admin' && !targetCompanyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    logger.debug('Target company ID:', { targetCompanyId });

    const templateQuestions = await db('template_questions')
      .where('template_id', id)
      .orderBy('order_index');

    const trx = await db.transaction();

    try {
      // Create survey
      const surveyId = uuidv4();

      const parsedSettings = normalizeJson(template.default_settings, {});

      await trx('surveys').insert({
        id: surveyId,
        company_id: targetCompanyId,
        created_by: user.id,
        title: title || template.name,
        description: description !== undefined ? description : template.description,
        type: template.type,
        status: 'draft',
        is_public: true,
        is_anonymous: template.is_anonymous,
        default_language: 'en',
        settings: parsedSettings,
      });

      // Copy questions
      if (templateQuestions.length > 0) {
        const questionInserts = templateQuestions.map((q: any) => ({
          id: uuidv4(),
          survey_id: surveyId,
          type: q.type,
          content: q.content,
          options: normalizeJson(q.options ?? {}, {}),
          is_required: q.is_required,
          order_index: q.order_index,
        }));

        await trx('questions').insert(questionInserts);
      }

      // Increment template use count
      await trx('survey_templates').where('id', id).increment('use_count', 1);

      await trx.commit();

      // Return the created survey
      const survey = await db('surveys').where('id', surveyId).first();
      const surveyQuestions = await db('questions').where('survey_id', surveyId).orderBy('order_index');

      res.status(201).json({ ...survey, questions: surveyQuestions });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error creating survey from template:', { error });
    res.status(500).json({ error: 'Failed to create survey from template' });
  }
};

// Save existing survey as template
export const saveAsTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params; // Survey ID
    const { name, description, category, isGlobal = false } = req.body;

    // Get survey with questions
    const survey = await db('surveys').where('id', id).first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Check access
    if (survey.company_id !== user.companyId && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only super_admin can create global templates
    if (isGlobal && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can create global templates' });
    }

    const surveyQuestions = await db('questions')
      .where('survey_id', id)
      .orderBy('order_index');

    const trx = await db.transaction();

    try {
      const templateId = uuidv4();

      await trx('survey_templates').insert({
        id: templateId,
        company_id: isGlobal ? null : user.companyId,
        created_by: user.id,
        name: name || `${survey.title} Template`,
        description: description || survey.description,
        category: category || null,
        type: survey.type,
        is_global: isGlobal,
        is_anonymous: survey.is_anonymous,
        default_settings: normalizeJson(survey.settings, {}),
      });

      // Copy questions
      if (surveyQuestions.length > 0) {
        const questionInserts = surveyQuestions.map((q: any, index: number) => ({
          id: uuidv4(),
          template_id: templateId,
          type: q.type,
          content: q.content,
          options: normalizeJson(q.options ?? {}, {}),
          is_required: q.is_required,
          order_index: index,
        }));

        await trx('template_questions').insert(questionInserts);
      }

      await trx.commit();

      const template = await db('survey_templates').where('id', templateId).first();
      const templateQuestions = await db('template_questions').where('template_id', templateId).orderBy('order_index');

      res.status(201).json({ ...template, questions: templateQuestions });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error saving survey as template:', { error });
    res.status(500).json({ error: 'Failed to save survey as template' });
  }
};

// Get template categories
export const getTemplateCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await db('survey_templates')
      .select('category')
      .whereNotNull('category')
      .groupBy('category')
      .orderBy('category');

    res.json(categories.map((c) => c.category));
  } catch (error: any) {
    logger.error('Error getting template categories:', { error });
    res.status(500).json({ error: 'Failed to get template categories' });
  }
};
