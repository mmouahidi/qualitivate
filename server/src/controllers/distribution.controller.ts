import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import db from '../config/database';
import { env } from '../config/env';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendSurveyInvitation } from '../services/email.service';
import logger from '../config/logger';

const FRONTEND_URL = env.FRONTEND_URL;

// List distributions for a survey
export const listDistributions = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;

    // Check survey access
    const survey = await db('surveys').where({ id: surveyId }).first();
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const distributions = await db('survey_distributions')
      .where({ survey_id: surveyId })
      .orderBy('created_at', 'desc');

    res.json({ data: distributions });
  } catch (error) {
    logger.error('List distributions error:', { error });
    res.status(500).json({ error: 'Failed to list distributions' });
  }
};

// Create a shareable link distribution
export const createLinkDistribution = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;

    const survey = await db('surveys').where({ id: surveyId }).first();
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const distributionId = uuidv4();
    const targetUrl = `${FRONTEND_URL}/survey/${surveyId}/respond?dist=${distributionId}`;

    const [distribution] = await db('survey_distributions')
      .insert({
        id: distributionId,
        survey_id: surveyId,
        channel: 'link',
        target_url: targetUrl
      })
      .returning('*');

    res.status(201).json({ data: distribution });
  } catch (error) {
    logger.error('Create link distribution error:', { error });
    res.status(500).json({ error: 'Failed to create link distribution' });
  }
};

// Create QR code distribution
export const createQRDistribution = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;

    const survey = await db('surveys').where({ id: surveyId }).first();
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const distributionId = uuidv4();
    const targetUrl = `${FRONTEND_URL}/survey/${surveyId}/respond?dist=${distributionId}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    const [distribution] = await db('survey_distributions')
      .insert({
        id: distributionId,
        survey_id: surveyId,
        channel: 'qr_code',
        target_url: targetUrl,
        qr_code_url: qrCodeDataUrl
      })
      .returning('*');

    res.status(201).json({ data: distribution });
  } catch (error) {
    logger.error('Create QR distribution error:', { error });
    res.status(500).json({ error: 'Failed to create QR distribution' });
  }
};

// Create embed code distribution
export const createEmbedDistribution = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { width = '100%', height = '600px' } = req.body;

    const survey = await db('surveys').where({ id: surveyId }).first();
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const distributionId = uuidv4();
    const targetUrl = `${FRONTEND_URL}/survey/${surveyId}/embed?dist=${distributionId}`;

    const embedCode = `<iframe src="${targetUrl}" width="${width}" height="${height}" frameborder="0" style="border: none;"></iframe>`;

    const [distribution] = await db('survey_distributions')
      .insert({
        id: distributionId,
        survey_id: surveyId,
        channel: 'embed',
        target_url: targetUrl,
        email_list: { embedCode, width, height }
      })
      .returning('*');

    res.status(201).json({
      data: {
        ...distribution,
        embedCode
      }
    });
  } catch (error) {
    logger.error('Create embed distribution error:', { error });
    res.status(500).json({ error: 'Failed to create embed distribution' });
  }
};

// Send email invitations
export const createEmailDistribution = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { emails, subject, message } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Email list is required' });
    }

    const survey = await db('surveys')
      .where({ id: surveyId })
      .first();

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const distributionId = uuidv4();
    const baseUrl = `${FRONTEND_URL}/survey/${surveyId}/respond?dist=${distributionId}`;

    // Send emails
    const results = [];
    for (const email of emails) {
      const personalizedUrl = `${baseUrl}&email=${encodeURIComponent(email)}`;
      try {
        await sendSurveyInvitation({
          to: email,
          subject: subject || `You're invited to take a survey: ${survey.title}`,
          surveyTitle: survey.title,
          surveyDescription: survey.description,
          surveyUrl: personalizedUrl,
          message
        });
        results.push({ email, status: 'sent' });
      } catch (err) {
        logger.warn(`Failed to send email to ${email}`, { error: err });
        results.push({ email, status: 'failed' });
      }
    }

    const [distribution] = await db('survey_distributions')
      .insert({
        id: distributionId,
        survey_id: surveyId,
        channel: 'email',
        target_url: baseUrl,
        email_list: results,
        sent_at: new Date()
      })
      .returning('*');

    res.status(201).json({
      data: distribution,
      results
    });
  } catch (error) {
    logger.error('Create email distribution error:', { error });
    res.status(500).json({ error: 'Failed to send email invitations' });
  }
};

// Send to department/site users
export const sendToGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { surveyId } = req.params;
    const { departmentId, siteId, companyId, subject, message } = req.body;

    const survey = await db('surveys').where({ id: surveyId }).first();
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Build query based on group type
    let query = db('users').where({ is_active: true });

    if (departmentId) {
      query = query.where({ department_id: departmentId });
    } else if (siteId) {
      query = query.where({ site_id: siteId });
    } else if (companyId) {
      query = query.where({ company_id: companyId });
    } else {
      return res.status(400).json({ error: 'Must specify departmentId, siteId, or companyId' });
    }

    const users = await query.select('email', 'first_name', 'last_name');

    if (users.length === 0) {
      return res.status(400).json({ error: 'No users found in the specified group' });
    }

    const emails = users.map(u => u.email);

    // Reuse email distribution logic
    req.body.emails = emails;
    return createEmailDistribution(req, res);
  } catch (error) {
    logger.error('Send to group error:', { error });
    res.status(500).json({ error: 'Failed to send to group' });
  }
};

// Get distribution stats
export const getDistributionStats = async (req: AuthRequest, res: Response) => {
  try {
    const { distributionId } = req.params;

    const distribution = await db('survey_distributions')
      .where({ id: distributionId })
      .first();

    if (!distribution) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    // Count responses from this distribution
    const [stats] = await db('responses')
      .where({ survey_id: distribution.survey_id })
      .whereRaw("anonymous_token LIKE ?", [`${distributionId}%`])
      .select(
        db.raw('COUNT(*) as total_responses'),
        db.raw("COUNT(*) FILTER (WHERE status = 'completed') as completed_responses"),
        db.raw("COUNT(*) FILTER (WHERE status = 'started') as started_responses")
      );

    res.json({
      data: {
        distribution,
        stats: {
          totalResponses: parseInt(stats.total_responses) || 0,
          completedResponses: parseInt(stats.completed_responses) || 0,
          startedResponses: parseInt(stats.started_responses) || 0
        }
      }
    });
  } catch (error) {
    logger.error('Get distribution stats error:', { error });
    res.status(500).json({ error: 'Failed to get distribution stats' });
  }
};

// Delete distribution
export const deleteDistribution = async (req: AuthRequest, res: Response) => {
  try {
    const { distributionId } = req.params;

    const deleted = await db('survey_distributions')
      .where({ id: distributionId })
      .delete();

    if (!deleted) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    res.json({ message: 'Distribution deleted successfully' });
  } catch (error) {
    logger.error('Delete distribution error:', { error });
    res.status(500).json({ error: 'Failed to delete distribution' });
  }
};
