import nodemailer from 'nodemailer';
import { sendSurveyInvitation, sendSurveyReminder } from '../../services/email.service';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  }),
}));

// Set environment variables for tests
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'testpass';
process.env.SMTP_FROM = 'noreply@test.com';

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
});
