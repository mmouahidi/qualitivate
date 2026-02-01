import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import responseService, { PublicSurvey, Question, Answer } from '../../services/response.service';

const SurveyRespond: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const distributionId = searchParams.get('d') || undefined;

  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [responseId, setResponseId] = useState<string | null>(null);
  const [anonymousToken, setAnonymousToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      const data = await responseService.getPublicSurvey(surveyId!, { dist: distributionId });
      setSurvey(data);

      // Start the response
      const result = await responseService.startResponse(surveyId!, { distributionId });
      setResponseId(result.responseId);
      setAnonymousToken(result.anonymousToken);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = survey?.questions[currentQuestionIndex];
  const progress = survey ? ((currentQuestionIndex + 1) / survey.questions.length) * 100 : 0;

  const handleAnswer = (value: any) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = async () => {
    if (!currentQuestion || !responseId) return;

    // Save the answer
    const answerValue = answers[currentQuestion.id];
    if (answerValue !== undefined) {
      await responseService.saveAnswer(responseId, currentQuestion.id, answerValue);
    }

    if (currentQuestionIndex < (survey?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Submit the survey
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!responseId) return;

    setSubmitting(true);
    try {
      await responseService.completeResponse(responseId);
      navigate(`/survey/${surveyId}/thank-you`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg resize-none"
          />
        );

      case 'single_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, idx) => (
              <label
                key={idx}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${value === option ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={() => handleAnswer(option)}
                  className="w-5 h-5 text-primary-600"
                />
                <span className="ml-3 text-lg">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, idx) => (
              <label
                key={idx}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${(value || []).includes(option) ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
              >
                <input
                  type="checkbox"
                  value={option}
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const current = value || [];
                    if (e.target.checked) {
                      handleAnswer([...current, option]);
                    } else {
                      handleAnswer(current.filter((v: string) => v !== option));
                    }
                  }}
                  className="w-5 h-5 text-primary-600"
                />
                <span className="ml-3 text-lg">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        return (
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleAnswer(star)}
                className="p-2 transition-transform hover:scale-110"
              >
                <svg
                  className={`w-12 h-12 ${star <= (value || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        );

      case 'nps':
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => handleAnswer(num)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-colors ${value === num
                      ? num <= 6 ? 'bg-red-500 text-white' : num <= 8 ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Enter a number..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Survey</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!survey || !currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200">
        <div
          className="h-full bg-primary-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Survey header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{survey.survey.title}</h1>
          {survey.survey.description && (
            <p className="text-gray-600 mt-2">{survey.survey.description}</p>
          )}
        </div>

        {/* Question card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {survey.questions.length}
            </span>
            <h2 className="text-xl font-semibold text-gray-900 mt-2">
              {currentQuestion.content}
              {currentQuestion.isRequired && <span className="text-red-500 ml-1">*</span>}
            </h2>
          </div>

          <div className="mb-8">
            {renderQuestion(currentQuestion)}
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={submitting || (currentQuestion.isRequired && !answers[currentQuestion.id])}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : currentQuestionIndex === survey.questions.length - 1 ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>

        {/* Anonymous notice */}
        {survey.survey.isAnonymous && (
          <p className="text-center text-sm text-gray-500 mt-6">
            🔒 Your responses are anonymous
          </p>
        )}
      </div>
    </div>
  );
};

export default SurveyRespond;
