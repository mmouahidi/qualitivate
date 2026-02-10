import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import responseService, { PublicSurvey, Question } from '../../services/response.service';
import { evaluateLogic, getPreviousQuestionIndex } from '../../utils/surveyLogicEngine';

// LocalStorage key prefix for saving survey progress
const SURVEY_PROGRESS_KEY = 'survey_progress_';

interface SavedProgress {
  responseId: string;
  anonymousToken: string;
  answers: Record<string, any>;
  visitedPath: string[];
  currentQuestionIndex: number;
  savedAt: number;
}

const TakeSurvey: React.FC = () => {
  const { t } = useTranslation();
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const distributionId = searchParams.get('d') || undefined;
  const resumeResponseId = searchParams.get('resume') || undefined;

  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [responseId, setResponseId] = useState<string | null>(null);
  const [anonymousToken, setAnonymousToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [visitedPath, setVisitedPath] = useState<string[]>([]);

  // Language selector state
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [showResumeLink, setShowResumeLink] = useState(false);

  useEffect(() => {
    loadSurveyAndProgress();
  }, [surveyId]);

  const loadSurveyAndProgress = async () => {
    try {
      setLoading(true);

      // Load available languages
      try {
        const langResult = await responseService.getSurveyLanguages(surveyId!);
        setAvailableLanguages(langResult.languages || []);
      } catch (e) {
        // Languages endpoint may fail, continue without multi-language
      }

      // Check for saved progress in localStorage
      const savedProgress = getSavedProgress();
      const resumeId = resumeResponseId || savedProgress?.responseId;

      // Load survey
      const data = await responseService.getPublicSurvey(surveyId!, {
        dist: distributionId
      });
      setSurvey(data);
      setSelectedLanguage(data.survey.defaultLanguage || 'en');

      // Restore progress if available
      if (resumeId) {
        await restoreProgress(resumeId, savedProgress, data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'This survey is not available');
    } finally {
      setLoading(false);
    }
  };

  const getSavedProgress = (): SavedProgress | null => {
    try {
      const key = `${SURVEY_PROGRESS_KEY}${surveyId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const progress = JSON.parse(saved) as SavedProgress;
        // Only use if saved within last 7 days
        if (Date.now() - progress.savedAt < 7 * 24 * 60 * 60 * 1000) {
          return progress;
        }
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error('Error reading saved progress:', e);
    }
    return null;
  };

  const saveProgressToStorage = () => {
    if (!surveyId || !responseId) return;
    try {
      const progress: SavedProgress = {
        responseId,
        anonymousToken: anonymousToken || '',
        answers,
        visitedPath,
        currentQuestionIndex,
        savedAt: Date.now()
      };
      localStorage.setItem(`${SURVEY_PROGRESS_KEY}${surveyId}`, JSON.stringify(progress));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  };

  const clearSavedProgress = () => {
    if (surveyId) {
      try {
        localStorage.removeItem(`${SURVEY_PROGRESS_KEY}${surveyId}`);
      } catch (e) {
        console.warn('LocalStorage access denied', e);
      }
    }
  };

  const restoreProgress = async (resumeId: string, localProgress: SavedProgress | null, surveyData: PublicSurvey) => {
    try {
      const serverProgress = await responseService.getResponseProgress(resumeId);
      if (serverProgress && serverProgress.status === 'started') {
        setResponseId(serverProgress.responseId);
        setAnonymousToken(serverProgress.anonymousToken);
        setAnswers(serverProgress.answers || {});

        // Use local progress for navigation state if available
        if (localProgress && localProgress.responseId === resumeId) {
          setVisitedPath(localProgress.visitedPath.length ? localProgress.visitedPath : [surveyData.questions[0]?.id]);
          setCurrentQuestionIndex(localProgress.currentQuestionIndex || 0);
        } else {
          // Calculate position from answered questions
          const answeredIds = Object.keys(serverProgress.answers || {});
          if (answeredIds.length > 0) {
            const lastAnsweredIndex = surveyData.questions.findIndex(
              q => !answeredIds.includes(q.id)
            );
            const startIndex = lastAnsweredIndex >= 0 ? lastAnsweredIndex : surveyData.questions.length - 1;
            setVisitedPath([surveyData.questions[startIndex]?.id]);
            setCurrentQuestionIndex(startIndex);
          } else {
            setVisitedPath([surveyData.questions[0]?.id]);
            setCurrentQuestionIndex(0);
          }
        }
        setStarted(true);
      }
    } catch (e) {
      console.log('Could not restore progress from server');
      // Clear invalid local progress
      clearSavedProgress();
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    setSelectedLanguage(langCode);
    setLoading(true);
    try {
      const data = await responseService.getPublicSurvey(surveyId!, {
        dist: distributionId,
        lang: langCode
      });
      setSurvey(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load translations');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      const result = await responseService.startResponse(surveyId!, {
        distributionId,
        language: selectedLanguage
      });
      setResponseId(result.responseId);
      setAnonymousToken(result.anonymousToken);
      setStarted(true);
      if (survey?.questions.length) {
        setVisitedPath([survey.questions[0].id]);
      }
      // Save progress immediately after start
      setTimeout(() => saveProgressToStorage(), 100);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start survey');
    }
  };

  const currentQuestion = survey?.questions[currentQuestionIndex];
  // Calculate progress based on visited path for more accurate progress when using skip logic
  const progress = survey
    ? Math.min(100, ((visitedPath.length || 1) / survey.questions.length) * 100)
    : 0;

  const handleAnswer = (value: any) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = async () => {
    if (!currentQuestion || !responseId || !survey) {
      console.error('handleNext: Missing required data', {
        hasCurrentQuestion: !!currentQuestion,
        hasResponseId: !!responseId,
        hasSurvey: !!survey
      });
      return;
    }

    const answerValue = answers[currentQuestion.id];
    if (answerValue !== undefined) {
      try {
        await responseService.saveAnswer(responseId, currentQuestion.id, answerValue);
      } catch (err) {
        console.error('Failed to save answer:', err);
      }
    }

    // Save progress after each answer
    saveProgressToStorage();

    // Use logic engine to determine next question
    const questions = survey.questions;
    const currentIdx = questions.findIndex(q => q.id === currentQuestion.id);

    const result = evaluateLogic(
      {
        id: currentQuestion.id,
        type: currentQuestion.type,
        content: currentQuestion.content,
        options: currentQuestion.options as any,
      },
      answerValue,
      questions.map(q => ({
        id: q.id,
        type: q.type,
        content: q.content,
        options: q.options as any,
      })),
      answers
    );

    console.log('Navigation debug:', {
      currentIdx,
      currentQuestionId: currentQuestion.id,
      nextQuestionIndex: result.nextQuestionIndex,
      totalQuestions: questions.length,
      answerValue
    });

    if (result.nextQuestionIndex === 'end' || result.nextQuestionIndex >= questions.length) {
      handleSubmit();
    } else if (typeof result.nextQuestionIndex === 'number' && result.nextQuestionIndex >= 0 && result.nextQuestionIndex < questions.length) {
      const nextQuestion = questions[result.nextQuestionIndex];
      if (nextQuestion) {
        // Use functional updates to ensure state consistency
        setVisitedPath(prev => [...prev, nextQuestion.id]);
        setCurrentQuestionIndex(result.nextQuestionIndex);
        // Save updated progress
        setTimeout(() => saveProgressToStorage(), 100);
      } else {
        console.error('Next question not found at index:', result.nextQuestionIndex);
        // Fallback: try simple increment if logic evaluation failed
        const simpleNextIdx = currentIdx + 1;
        if (simpleNextIdx < questions.length) {
          setVisitedPath(prev => [...prev, questions[simpleNextIdx].id]);
          setCurrentQuestionIndex(simpleNextIdx);
        } else {
          handleSubmit();
        }
      }
    } else {
      console.error('Invalid next question index:', result.nextQuestionIndex);
      // Fallback: try simple increment
      const simpleNextIdx = currentIdx + 1;
      if (simpleNextIdx < questions.length) {
        setVisitedPath(prev => [...prev, questions[simpleNextIdx].id]);
        setCurrentQuestionIndex(simpleNextIdx);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (!survey || visitedPath.length <= 1) return;

    // Go back through the visited path
    const newPath = visitedPath.slice(0, -1);
    const previousQuestionId = newPath[newPath.length - 1];
    const previousIndex = survey.questions.findIndex(q => q.id === previousQuestionId);

    if (previousIndex !== -1) {
      setVisitedPath(newPath);
      setCurrentQuestionIndex(previousIndex);
    } else if (currentQuestionIndex > 0) {
      // Fallback to sequential
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!responseId) return;

    setSubmitting(true);
    try {
      await responseService.completeResponse(responseId);
      clearSavedProgress();
      // Navigate with surveyId to fetch custom thank you message
      navigate(`/survey/${surveyId}/thank-you`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  const getResumeLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/survey/${surveyId}/take?resume=${responseId}`;
  };

  const copyResumeLink = () => {
    navigator.clipboard.writeText(getResumeLink());
    alert(t('survey.resumeLinkCopied'));
  };

  // Helper function to get choices from options (handles both array and object formats)
  const getChoices = (options: any): string[] => {
    if (!options) return [];
    if (Array.isArray(options)) return options;
    if (typeof options === 'string') {
      try {
        const parsed = JSON.parse(options);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.choices && Array.isArray(parsed.choices)) return parsed.choices;
      } catch (e) {
        return [];
      }
    }
    if (typeof options === 'object' && options.choices) {
      return Array.isArray(options.choices) ? options.choices : [];
    }
    return [];
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
            placeholder={t('survey.inputPlaceholder')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
            autoFocus
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder={t('survey.inputPlaceholder')}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg resize-none"
            autoFocus
          />
        );

      case 'single_choice':
        const singleChoices = getChoices(question.options);
        return (
          <div className="space-y-3">
            {singleChoices.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                className={`w-full text-left p-4 border-2 rounded-xl transition-all ${value === option
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${value === option ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                    }`}>
                    {value === option && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-lg text-gray-800">{option}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'multiple_choice':
        const multiChoices = getChoices(question.options);
        return (
          <div className="space-y-3">
            {multiChoices.map((option, idx) => {
              const isSelected = (value || []).includes(option);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    const current = value || [];
                    if (isSelected) {
                      handleAnswer(current.filter((v: string) => v !== option));
                    } else {
                      handleAnswer([...current, option]);
                    }
                  }}
                  className={`w-full text-left p-4 border-2 rounded-xl transition-all ${isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-4 ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                      }`}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-lg text-gray-800">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'rating':
      case 'rating_scale':
        // Get max rating from options, default to 5
        const maxRating = typeof question.options === 'object' && question.options !== null && !Array.isArray(question.options)
          ? (question.options as any).max || 5
          : 5;
        const ratingLabels = typeof question.options === 'object' && question.options !== null && !Array.isArray(question.options)
          ? (question.options as any).labels || {}
          : {};

        const lowEmoji = '\u{1F61F}'; // 😟
        const highEmoji = '\u{1F60A}'; // 😊

        return (
          <div className="space-y-6">
            {/* Rating scale labels */}
            {Object.keys(ratingLabels).length > 0 && (
              <div className="flex justify-between text-sm font-medium text-gray-600 px-2">
                <span className="flex items-center gap-2">
                  <span className="text-red-500">{'😟'}</span>
                  {ratingLabels[1] || t('survey.ratingLow')}
                </span>
                <span className="flex items-center gap-2">
                  {ratingLabels[maxRating] || t('survey.ratingHigh')}
                  <span className="text-green-500">{'😊'}</span>
                </span>
              </div>
            )}

            {/* Enhanced rating buttons with gradient */}
            <div className="flex justify-center gap-2 sm:gap-3 py-6">
              {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => {
                const isSelected = value === rating;
                const percentage = (rating / maxRating) * 100;
                return (
                  <button
                    key={rating}
                    onClick={() => handleAnswer(rating)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-bold text-lg sm:text-xl transition-all duration-300 ${isSelected
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-2xl scale-125 ring-4 ring-primary-200'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:scale-110 shadow-sm'
                      }`}
                    title={ratingLabels[rating] || `Rating ${rating}`}
                  >
                    {rating}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Show selected rating label with animation */}
            {value && (
              <div className="text-center animate-fade-in">
                <p className="text-primary-600 font-semibold text-lg">
                  {ratingLabels[value] || `${value}/${maxRating}`}
                </p>
              </div>
            )}
          </div>
        );

      case 'nps':
        return (
          <div className="space-y-6">
            <div className="flex justify-between text-sm font-medium text-gray-600 px-2 mb-2">
              <span className="flex items-center gap-1">
                <span className="text-red-500">{'😞'}</span>
                <span className="hidden sm:inline">{t('survey.npsLow')}</span>
              </span>
              <span className="text-gray-400 text-xs">0-10</span>
              <span className="flex items-center gap-1">
                <span className="hidden sm:inline">{t('survey.npsHigh')}</span>
                <span className="text-green-500">{'🤩'}</span>
              </span>
            </div>

            {/* Color-coded NPS grid */}
            <div className="grid grid-cols-11 gap-1.5 sm:gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = value === num;
                const isDetractor = num <= 6;
                const isPassive = num === 7 || num === 8;
                const isPromoter = num >= 9;

                return (
                  <button
                    key={num}
                    onClick={() => handleAnswer(num)}
                    className={`aspect-square rounded-lg sm:rounded-xl font-bold text-sm sm:text-lg transition-all duration-300 relative ${isSelected
                        ? isDetractor
                          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-2xl scale-125 ring-4 ring-red-200'
                          : isPassive
                            ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-2xl scale-125 ring-4 ring-yellow-200'
                            : 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-2xl scale-125 ring-4 ring-green-200'
                        : isDetractor
                          ? 'bg-red-50 border-2 border-red-200 text-red-700 hover:bg-red-100 hover:scale-110'
                          : isPassive
                            ? 'bg-yellow-50 border-2 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:scale-110'
                            : 'bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100 hover:scale-110'
                      }`}
                  >
                    {num}
                    {isSelected && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-lg" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* NPS Category indicator */}
            {value !== undefined && (
              <div className="text-center animate-fade-in">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${value <= 6
                    ? 'bg-red-100 text-red-700'
                    : value <= 8
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                  {value <= 6 && '😞 Detractor'}
                  {value === 7 || value === 8 ? '😐 Passive' : ''}
                  {value >= 9 && '🤩 Promoter'}
                  <span className="text-sm opacity-75">({value}/10)</span>
                </div>
              </div>
            )}
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
            autoFocus
          />
        );

      case 'text_short':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder={t('survey.inputPlaceholder')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
            autoFocus
          />
        );

      case 'text_long':
        const textPlaceholder = typeof question.options === 'object' && question.options !== null && !Array.isArray(question.options)
          ? (question.options as any).placeholder || t('survey.inputPlaceholder')
          : t('survey.inputPlaceholder');
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder={textPlaceholder}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg resize-none"
            autoFocus
          />
        );

      case 'matrix':
        // Matrix questions - render as a table of radio buttons
        const matrixOptions = typeof question.options === 'object' && question.options !== null && !Array.isArray(question.options)
          ? question.options as { rows?: string[]; columns?: string[] }
          : { rows: [], columns: [] };
        const rows = matrixOptions.rows || [];
        const columns = matrixOptions.columns || [];
        const matrixValue = value || {};

        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left"></th>
                  {columns.map((col, idx) => (
                    <th key={idx} className="p-2 text-center text-sm font-medium text-gray-600">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="p-3 text-gray-800">{row}</td>
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="p-2 text-center">
                        <button
                          onClick={() => handleAnswer({ ...matrixValue, [row]: col })}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${matrixValue[row] === col
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300 hover:border-primary-300'
                            }`}
                        >
                          {matrixValue[row] === col && (
                            <svg className="w-3 h-3 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'dropdown':
        // Dropdown/select question type
        const dropdownOptions = Array.isArray(question.options) ? question.options : [];
        return (
          <select
            value={value || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg bg-white"
          >
            <option value="">{t('survey.selectPlaceholder')}</option>
            {dropdownOptions.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'boolean':
        // Yes/No question type
        return (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleAnswer(true)}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${value === true
                  ? 'bg-green-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`}
            >
              {t('common.yes') || 'Yes'}
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${value === false
                  ? 'bg-red-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
                }`}
            >
              {t('common.no') || 'No'}
            </button>
          </div>
        );

      default:
        // Fallback for unknown question types - show as text input
        console.warn(`Unknown question type: ${question.type}, falling back to text input`);
        return (
          <div>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder={t('survey.inputPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-2">Question type: {question.type}</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">{t('survey.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('survey.unavailable')}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">{t('survey.loading')}</p>
        </div>
      </div>
    );
  }

  // Welcome screen
  if (!started) {
    const welcomeMessage = survey.survey.settings?.welcomeMessage;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg text-center">
          {/* Language Selector */}
          {availableLanguages.length > 1 && (
            <div className="mb-6 flex justify-end">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {responseService.getLanguageDisplayName(lang)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{survey.survey.title}</h1>

          {/* Custom welcome message or default description */}
          {welcomeMessage ? (
            <div className="text-gray-600 mb-6 whitespace-pre-wrap">{welcomeMessage}</div>
          ) : survey.survey.description ? (
            <p className="text-gray-600 mb-6">{survey.survey.description}</p>
          ) : null}

          <div className="text-sm text-gray-500 mb-8">
            <p>{t('survey.questionsCount', { count: survey.questions.length })}</p>
            <p className="mt-1">{t('survey.estimatedTime', { minutes: Math.ceil(survey.questions.length * 0.5) })}</p>
          </div>
          <button
            onClick={handleStart}
            className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
          >
            {t('survey.start')}
          </button>
          {survey.survey.isAnonymous && (
            <p className="text-sm text-gray-500 mt-4">🔒 {t('survey.anonymous')}</p>
          )}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    console.error('currentQuestion is undefined', {
      currentQuestionIndex,
      surveyQuestionsLength: survey?.questions?.length,
      questions: survey?.questions?.map(q => ({ id: q.id, type: q.type }))
    });
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('survey.error')}</h2>
          <p className="text-gray-600 mb-6">{t('survey.questionNotFound')}</p>
          <p className="text-xs text-gray-400 mb-4">Debug: Index {currentQuestionIndex} of {survey?.questions?.length || 0} questions</p>
          <button
            onClick={() => {
              setCurrentQuestionIndex(0);
              setVisitedPath(survey?.questions[0] ? [survey.questions[0].id] : []);
            }}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
          >
            {t('survey.restart')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Enhanced Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-3 bg-gray-200 shadow-sm z-50">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Resume link button */}
      {responseId && (
        <div className="fixed top-4 right-4 z-10">
          <button
            onClick={() => setShowResumeLink(!showResumeLink)}
            className="px-3 py-1.5 bg-white text-gray-600 text-sm rounded-lg shadow-md hover:bg-gray-50 flex items-center gap-1"
            title={t('survey.resumeLink')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {t('survey.saveProgress')}
          </button>

          {showResumeLink && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl p-4 w-72">
              <p className="text-sm text-gray-600 mb-2">{t('survey.resumeLink')}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getResumeLink()}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-50"
                />
                <button
                  onClick={copyResumeLink}
                  className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        {/* Question number with progress */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-sm font-semibold shadow-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {t('survey.questionNumber', { number: visitedPath.length || currentQuestionIndex + 1 })}
            <span className="text-primary-500">/</span>
            <span className="text-primary-900">{survey?.questions.length}</span>
          </div>
        </div>

        {/* Question card with animation */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 transition-all duration-300 hover:shadow-3xl animate-slide-up">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            {currentQuestion.content}
            {currentQuestion.isRequired && <span className="text-red-500 ml-1">*</span>}
          </h2>

          <div className="mb-10">
            {renderQuestion(currentQuestion)}
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-100 gap-4">
            <button
              onClick={handlePrevious}
              disabled={visitedPath.length <= 1}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center rounded-xl transition-all duration-200 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('survey.back')}
            </button>
            <button
              onClick={handleNext}
              disabled={submitting || (currentQuestion.isRequired && answers[currentQuestion.id] === undefined)}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('survey.submitting')}
                </>
              ) : currentQuestionIndex === survey.questions.length - 1 ? (
                <>
                  {t('survey.submit')}
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  {t('survey.continue')}
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeSurvey;
