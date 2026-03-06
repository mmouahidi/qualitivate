import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../config/logger';

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const smtpPort = env.SMTP_PORT || 587;

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export const verifySmtpConnection = async (): Promise<boolean> => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn('SMTP not configured — email features will be unavailable (missing SMTP_HOST, SMTP_USER, or SMTP_PASS)');
    return false;
  }
  try {
    await transporter.verify();
    logger.info(`SMTP connection verified (${env.SMTP_HOST}:${smtpPort})`);
    return true;
  } catch (err) {
    logger.error('SMTP connection verification failed — emails will not be sent', { error: err });
    return false;
  }
};

interface SurveyInvitationParams {
  to: string;
  subject: string;
  surveyTitle: string;
  surveyDescription?: string;
  surveyUrl: string;
  message?: string;
}

export const sendSurveyInvitation = async (params: SurveyInvitationParams): Promise<void> => {
  const { to, subject, surveyTitle, surveyDescription, surveyUrl, message } = params;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .survey-title {
          font-size: 24px;
          margin: 0;
          font-weight: 600;
        }
        .survey-description {
          color: #6b7280;
          margin: 15px 0;
        }
        .custom-message {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #0284c7;
          margin: 20px 0;
        }
        .cta-button {
          display: inline-block;
          background: #0284c7;
          color: white !important;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .cta-button:hover {
          background: #0369a1;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 12px;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 8px 8px;
          background: white;
        }
        .link-text {
          word-break: break-all;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 20px;">Qualitivate.io</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Survey Platform</p>
      </div>
      <div class="content">
        <h2 class="survey-title">${escapeHtml(surveyTitle)}</h2>
        ${surveyDescription ? `<p class="survey-description">${escapeHtml(surveyDescription)}</p>` : ''}
        ${message ? `<div class="custom-message">${escapeHtml(message)}</div>` : ''}
        <p>You have been invited to participate in this survey. Your feedback is valuable to us!</p>
        <div style="text-align: center;">
          <a href="${surveyUrl}" class="cta-button">Take Survey</a>
        </div>
        <p class="link-text">Or copy this link: ${surveyUrl}</p>
      </div>
      <div class="footer">
        <p>This email was sent by Qualitivate.io</p>
        <p>If you did not expect this email, you can safely ignore it.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
${surveyTitle}

${surveyDescription || ''}

${message ? `Message: ${message}` : ''}

You have been invited to participate in this survey. Your feedback is valuable to us!

Take the survey: ${surveyUrl}

---
This email was sent by Qualitivate.io
  `.trim();

  await transporter.sendMail({
    from: env.SMTP_FROM || 'noreply@qualitivate.io',
    to,
    subject,
    text: textContent,
    html: htmlContent
  });
};

export const sendSurveyReminder = async (params: SurveyInvitationParams): Promise<void> => {
  const reminderSubject = `Reminder: ${params.subject}`;
  await sendSurveyInvitation({ ...params, subject: reminderSubject });
};

interface ResponseNotificationParams {
  to: string[];
  surveyTitle: string;
  respondentInfo: string;
  answers: Array<{ question: string; answer: string }>;
  submittedAt: string;
}

export const sendResponseNotification = async (params: ResponseNotificationParams): Promise<void> => {
  const { to, surveyTitle, respondentInfo, answers, submittedAt } = params;

  const answerRows = answers
    .map(
      (a) =>
        `<tr><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:500;">${escapeHtml(a.question)}</td><td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${escapeHtml(a.answer)}</td></tr>`
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Survey Response</title>
    </head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:650px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);color:white;padding:24px 30px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:18px;">📬 New Response Received</h1>
        <p style="margin:6px 0 0 0;opacity:0.9;font-size:14px;">${escapeHtml(surveyTitle)}</p>
      </div>
      <div style="background:#f9fafb;padding:24px 30px;border:1px solid #e5e7eb;border-top:none;">
        <p style="margin:0 0 6px 0;font-size:13px;color:#6b7280;">Respondent: <strong style="color:#111827;">${escapeHtml(respondentInfo)}</strong></p>
        <p style="margin:0 0 20px 0;font-size:13px;color:#6b7280;">Submitted: <strong style="color:#111827;">${escapeHtml(submittedAt)}</strong></p>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:10px 14px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em;">Question</th>
              <th style="padding:10px 14px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em;">Answer</th>
            </tr>
          </thead>
          <tbody>${answerRows}</tbody>
        </table>
      </div>
      <div style="text-align:center;padding:16px;color:#6b7280;font-size:12px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:white;">
        <p style="margin:0;">Sent by Qualitivate.io — Survey Platform</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `New Response: ${surveyTitle}\nRespondent: ${respondentInfo}\nSubmitted: ${submittedAt}\n\n${answers.map((a) => `${a.question}: ${a.answer}`).join('\n')}\n\n---\nSent by Qualitivate.io`;

  await transporter.sendMail({
    from: env.SMTP_FROM || 'noreply@qualitivate.io',
    to: to.join(', '),
    subject: `📬 New Response: ${surveyTitle}`,
    text: textContent,
    html: htmlContent,
  });
};
