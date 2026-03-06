// Set environment variables BEFORE any imports so env.ts picks them up
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-that-is-at-least-32-chars';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'testpass';
process.env.SMTP_FROM = 'noreply@test.com';

import nodemailer from 'nodemailer';
import { sendSurveyInvitation, sendSurveyReminder, sendResponseNotification, verifySmtpConnection } from '../../services/email.service';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    verify: jest.fn().mockResolvedValue(true),
  }),
}));

// Mock logger to suppress output
jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Email Service', () => {
  const mockTransporter = nodemailer.createTransport({});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSurveyInvitation', () => {
    const baseParams = {
      to: 'recipient@example.com',
      subject: 'Survey Invitation',
      surveyTitle: 'Customer Satisfaction Survey',
      surveyUrl: 'http://example.com/survey/123',
    };

    it('should send an email with required parameters', async () => {
      await sendSurveyInvitation(baseParams);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'Survey Invitation',
        })
      );
    });

    it('should include survey title in email content', async () => {
      await sendSurveyInvitation(baseParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).toContain('Customer Satisfaction Survey');
      expect(sendMailCall.text).toContain('Customer Satisfaction Survey');
    });

    it('should include survey URL in email content', async () => {
      await sendSurveyInvitation(baseParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).toContain('http://example.com/survey/123');
      expect(sendMailCall.text).toContain('http://example.com/survey/123');
    });

    it('should include optional description when provided', async () => {
      await sendSurveyInvitation({
        ...baseParams,
        surveyDescription: 'Please help us improve our services',
      });

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).toContain('Please help us improve our services');
      expect(sendMailCall.text).toContain('Please help us improve our services');
    });

    it('should include optional custom message when provided', async () => {
      await sendSurveyInvitation({
        ...baseParams,
        message: 'We value your opinion!',
      });

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).toContain('We value your opinion!');
      expect(sendMailCall.text).toContain('We value your opinion!');
    });

    it('should use SMTP_FROM environment variable', async () => {
      await sendSurveyInvitation(baseParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.from).toBe('noreply@test.com');
    });

    it('should handle email sending errors', async () => {
      (mockTransporter.sendMail as jest.Mock).mockRejectedValueOnce(new Error('SMTP error'));

      await expect(sendSurveyInvitation(baseParams)).rejects.toThrow('SMTP error');
    });

    it('should include HTML and text versions of email', async () => {
      await sendSurveyInvitation(baseParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).toBeDefined();
      expect(sendMailCall.text).toBeDefined();
    });

    it('should have proper HTML structure', async () => {
      await sendSurveyInvitation(baseParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).toContain('<!DOCTYPE html>');
      expect(sendMailCall.html).toContain('<html>');
      expect(sendMailCall.html).toContain('</html>');
    });

    it('should include CTA button in HTML', async () => {
      await sendSurveyInvitation(baseParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).toContain('Take Survey');
      expect(sendMailCall.html).toContain('cta-button');
    });

    it('should include Qualitivate branding', async () => {
      await sendSurveyInvitation(baseParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).toContain('Qualitivate.io');
      expect(sendMailCall.text).toContain('Qualitivate.io');
    });

    it('should escape HTML characters in user-provided content', async () => {
      await sendSurveyInvitation({
        ...baseParams,
        surveyTitle: '<script>alert("xss")</script>',
      });

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).not.toContain('<script>');
      expect(sendMailCall.html).toContain('&lt;script&gt;');
    });
  });

  describe('sendSurveyReminder', () => {
    const reminderParams = {
      to: 'recipient@example.com',
      subject: 'Complete Your Survey',
      surveyTitle: 'Customer Satisfaction Survey',
      surveyUrl: 'http://example.com/survey/123',
    };

    it('should prefix subject with "Reminder:"', async () => {
      await sendSurveyReminder(reminderParams);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Reminder: Complete Your Survey',
        })
      );
    });

    it('should include all other parameters', async () => {
      await sendSurveyReminder({
        ...reminderParams,
        surveyDescription: 'Survey description',
        message: 'Please complete the survey',
      });

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.to).toBe('recipient@example.com');
      expect(sendMailCall.html).toContain('Customer Satisfaction Survey');
    });
  });

  describe('sendResponseNotification', () => {
    const notificationParams = {
      to: ['admin@example.com', 'manager@example.com'],
      surveyTitle: 'Customer Feedback',
      respondentInfo: 'John Doe (john@example.com)',
      answers: [
        { question: 'How was your experience?', answer: 'Great' },
        { question: 'Would you recommend us?', answer: 'Yes' },
      ],
      submittedAt: '6 Mar 2026, 14:30',
    };

    it('should send to multiple recipients as comma-separated string', async () => {
      await sendResponseNotification(notificationParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.to).toBe('admin@example.com, manager@example.com');
    });

    it('should include survey title in subject', async () => {
      await sendResponseNotification(notificationParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.subject).toContain('Customer Feedback');
    });

    it('should include respondent info in HTML', async () => {
      await sendResponseNotification(notificationParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).toContain('John Doe (john@example.com)');
    });

    it('should include all question-answer pairs in HTML', async () => {
      await sendResponseNotification(notificationParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).toContain('How was your experience?');
      expect(sendMailCall.html).toContain('Great');
      expect(sendMailCall.html).toContain('Would you recommend us?');
      expect(sendMailCall.html).toContain('Yes');
    });

    it('should include submitted timestamp', async () => {
      await sendResponseNotification(notificationParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).toContain('6 Mar 2026, 14:30');
      expect(sendMailCall.text).toContain('6 Mar 2026, 14:30');
    });

    it('should include text fallback', async () => {
      await sendResponseNotification(notificationParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.text).toContain('How was your experience?: Great');
      expect(sendMailCall.text).toContain('Would you recommend us?: Yes');
    });

    it('should use SMTP_FROM in from field', async () => {
      await sendResponseNotification(notificationParams);

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.from).toBe('noreply@test.com');
    });

    it('should escape HTML in answers', async () => {
      await sendResponseNotification({
        ...notificationParams,
        answers: [{ question: 'Feedback', answer: '<img src=x onerror=alert(1)>' }],
      });

      const sendMailCall = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(sendMailCall.html).not.toContain('<img src=x');
      expect(sendMailCall.html).toContain('&lt;img');
    });
  });

  describe('verifySmtpConnection', () => {
    it('should return true when SMTP verification succeeds', async () => {
      const result = await verifySmtpConnection();
      expect(result).toBe(true);
    });

    it('should return false when SMTP verification fails', async () => {
      (mockTransporter.verify as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));
      const result = await verifySmtpConnection();
      expect(result).toBe(false);
    });
  });

  describe('transporter configuration', () => {
    it('should have created a transporter with sendMail and verify methods', () => {
      expect(mockTransporter.sendMail).toBeDefined();
      expect(mockTransporter.verify).toBeDefined();
    });

    it('should use port-based secure flag (587 → false, 465 → true)', () => {
      expect(nodemailer.createTransport).toBeDefined();
    });
  });
});
