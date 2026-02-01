import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

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
        <h2 class="survey-title">${surveyTitle}</h2>
        ${surveyDescription ? `<p class="survey-description">${surveyDescription}</p>` : ''}
        ${message ? `<div class="custom-message">${message}</div>` : ''}
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
    from: process.env.SMTP_FROM || 'noreply@qualitivate.io',
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
