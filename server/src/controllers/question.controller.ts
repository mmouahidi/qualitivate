import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import {
  VALID_QUESTION_TYPES,
  EXTENDED_QUESTION_TYPES,
  QuestionType,
  isValidQuestionType,
  mapExtendedTypeToBase,
  VALID_LANGUAGE_CODES,
  isValidLanguageCode,
  validateQuestionOptions,
} from '../types/domain';


export const listQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const user = req.user!;

    const survey = await db('surveys').where({ id: surveyId }).first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== survey.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const questions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index', 'asc');

    res.json({ data: questions });
  } catch (error) {
    logger.error('List questions error:', { error });
    res.status(500).json({ error: 'Failed to list questions' });
  }
};

export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { type, content, options = {}, isRequired = false } = req.body;
    const user = req.user!;

    // Validate required fields
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Question content is required' });
    }

    // Validate type enum (now allows extended types)
    if (!type || !isValidQuestionType(type)) {
      return res.status(400).json({ error: `Invalid question type. Must be one of: ${EXTENDED_QUESTION_TYPES.join(', ')}` });
    }

    // Determine the base postgres ENUM type
    const baseType = mapExtendedTypeToBase(type);
    const extendedType = type !== baseType ? type : null;

    // Validate isRequired is boolean
    if (typeof isRequired !== 'boolean') {
      return res.status(400).json({ error: 'isRequired must be a boolean' });
    }

    // Validate options based on type
    const optionsValidation = validateQuestionOptions(type, options);
    if (!optionsValidation.valid) {
      return res.status(400).json({ error: optionsValidation.error });
    }

    const survey = await db('surveys').where({ id: surveyId }).first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== survey.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [{ max }] = await db('questions')
      .where({ survey_id: surveyId })
      .max('order_index as max');

    const orderIndex = (max || -1) + 1;

    const [question] = await db('questions')
      .insert({
        id: uuidv4(),
        survey_id: surveyId,
        type: baseType,
        extended_type: extendedType,
        content,
        options,
        is_required: isRequired,
        order_index: orderIndex
      })
      .returning('*');

    res.status(201).json({
      ...question,
      type: question.extended_type || question.type
    });
  } catch (error) {
    logger.error('Create question error:', { error });
    res.status(500).json({ error: 'Failed to create question' });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, content, options, isRequired } = req.body;
    const user = req.user!;

    const question = await db('questions')
      .select('questions.*', 'surveys.company_id')
      .join('surveys', 'questions.survey_id', 'surveys.id')
      .where('questions.id', id)
      .first();

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== question.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData: any = {
      updated_at: new Date()
    };

    // Validate type if provided
    if (type !== undefined) {
      if (!isValidQuestionType(type)) {
        return res.status(400).json({ error: `Invalid question type. Must be one of: ${EXTENDED_QUESTION_TYPES.join(', ')}` });
      }
      const baseType = mapExtendedTypeToBase(type);
      updateData.type = baseType;
      updateData.extended_type = type !== baseType ? type : null;
    }

    // Validate content if provided
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Question content cannot be empty' });
      }
      updateData.content = content;
    }

    // Validate isRequired if provided
    if (isRequired !== undefined) {
      if (typeof isRequired !== 'boolean') {
        return res.status(400).json({ error: 'isRequired must be a boolean' });
      }
      updateData.is_required = isRequired;
    }

    // Validate options based on final type
    if (options !== undefined) {
      const finalType = (type || question.extended_type || question.type) as QuestionType;
      const optionsValidation = validateQuestionOptions(finalType, options);
      if (!optionsValidation.valid) {
        return res.status(400).json({ error: optionsValidation.error });
      }
      updateData.options = options;
    }

    const [updatedQuestion] = await db('questions')
      .where({ id })
      .update(updateData)
      .returning('*');

    res.json({
      ...updatedQuestion,
      type: updatedQuestion.extended_type || updatedQuestion.type
    });
  } catch (error) {
    logger.error('Update question error:', { error });
    res.status(500).json({ error: 'Failed to update question' });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const question = await db('questions')
      .select('questions.*', 'surveys.company_id')
      .join('surveys', 'questions.survey_id', 'surveys.id')
      .where('questions.id', id)
      .first();

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== question.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db('questions').where({ id }).delete();

    await db('questions')
      .where('survey_id', question.survey_id)
      .where('order_index', '>', question.order_index)
      .decrement('order_index', 1);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    logger.error('Delete question error:', { error });
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

export const reorderQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { questionIds } = req.body;
    const user = req.user!;

    // Validate questionIds is an array
    if (!Array.isArray(questionIds)) {
      return res.status(400).json({ error: 'questionIds must be an array' });
    }

    // Check for duplicates
    const uniqueIds = new Set(questionIds);
    if (uniqueIds.size !== questionIds.length) {
      return res.status(400).json({ error: 'questionIds contains duplicates' });
    }

    const survey = await db('surveys').where({ id: surveyId }).first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== survey.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify all provided questionIds belong to this survey
    const existingQuestions = await db('questions')
      .where({ survey_id: surveyId })
      .pluck('id');

    const existingSet = new Set(existingQuestions);

    // Check all provided IDs exist in the survey
    for (const qid of questionIds) {
      if (!existingSet.has(qid)) {
        return res.status(400).json({ error: `Question ${qid} does not belong to this survey` });
      }
    }

    // Check all survey questions are included
    if (questionIds.length !== existingQuestions.length) {
      return res.status(400).json({
        error: `questionIds count (${questionIds.length}) does not match survey questions count (${existingQuestions.length})`
      });
    }

    // Use transaction to ensure atomic reordering
    await db.transaction(async (trx) => {
      for (let index = 0; index < questionIds.length; index++) {
        await trx('questions')
          .where({ id: questionIds[index], survey_id: surveyId })
          .update({ order_index: index, updated_at: new Date() });
      }
    });

    const questions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index', 'asc');

    res.json({ data: questions });
  } catch (error) {
    logger.error('Reorder questions error:', { error });
    res.status(500).json({ error: 'Failed to reorder questions' });
  }
};

export const getTranslations = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const question = await db('questions')
      .select('questions.*', 'surveys.company_id')
      .join('surveys', 'questions.survey_id', 'surveys.id')
      .where('questions.id', id)
      .first();

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== question.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const translations = await db('question_translations')
      .where({ question_id: id });

    res.json({ data: translations });
  } catch (error) {
    logger.error('Get translations error:', { error });
    res.status(500).json({ error: 'Failed to get translations' });
  }
};

export const createTranslation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { languageCode, content, options = {} } = req.body;
    const user = req.user!;

    // Validate languageCode
    if (!languageCode || typeof languageCode !== 'string') {
      return res.status(400).json({ error: 'Language code is required' });
    }
    if (!isValidLanguageCode(languageCode)) {
      return res.status(400).json({ error: 'Invalid language code format. Use ISO 639-1 format (e.g., en, es, fr)' });
    }

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Translation content is required' });
    }

    const question = await db('questions')
      .select('questions.*', 'surveys.company_id')
      .join('surveys', 'questions.survey_id', 'surveys.id')
      .where('questions.id', id)
      .first();

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== question.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const existing = await db('question_translations')
      .where({ question_id: id, language_code: languageCode })
      .first();

    if (existing) {
      const [updated] = await db('question_translations')
        .where({ id: existing.id })
        .update({
          content,
          options,
          updated_at: new Date()
        })
        .returning('*');
      return res.json(updated);
    }

    const [translation] = await db('question_translations')
      .insert({
        id: uuidv4(),
        question_id: id,
        language_code: languageCode,
        content,
        options
      })
      .returning('*');

    res.status(201).json(translation);
  } catch (error) {
    logger.error('Create translation error:', { error });
    res.status(500).json({ error: 'Failed to create translation' });
  }
};
