import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import responseService from '../../services/response.service';

const ThankYou: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [loading, setLoading] = useState(true);
  const [thankYouTitle, setThankYouTitle] = useState('Thank You!');
  const [thankYouMessage, setThankYouMessage] = useState('Your response has been submitted successfully.');

  useEffect(() => {
    loadSurveySettings();
  }, [surveyId]);

  const loadSurveySettings = async () => {
    if (!surveyId) {
      setLoading(false);
      return;
    }
    
    try {
      const result = await responseService.getSurveySettings(surveyId);
      if (result.settings?.thankYouTitle) {
        setThankYouTitle(result.settings.thankYouTitle);
      }
      if (result.settings?.thankYouMessage) {
        setThankYouMessage(result.settings.thankYouMessage);
      }
    } catch (e) {
      // Use defaults if settings fetch fails
      console.log('Using default thank you message');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{thankYouTitle}</h1>
          <p className="text-gray-600 text-lg">{thankYouMessage}</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <p className="text-gray-600">
            We appreciate you taking the time to share your feedback. Your input helps us improve and make better decisions.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.close()}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
          >
            Close Window
          </button>
          <Link
            to="/"
            className="block w-full text-gray-600 py-3 rounded-xl font-medium hover:text-gray-900 transition-colors"
          >
            Return to Home
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Powered by Qualitivate.io
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
