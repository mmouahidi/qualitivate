import React, { useState } from 'react';
import QuestionRenderer from './QuestionRenderer';
import { evaluateLogic } from '../../utils/surveyLogicEngine';

interface SurveyQuestion {
  id: string;
  type: string;
  content: string;
  options?: any;
  is_required?: boolean;
  isRequired?: boolean;
  order_index?: number;
  orderIndex?: number;
}

interface SurveyData {
  id: string;
  title: string;
  description?: string;
  isAnonymous?: boolean;
  is_anonymous?: boolean;
  questions?: SurveyQuestion[];
}

interface SurveyPreviewModalProps {
  survey: SurveyData;
  isOpen: boolean;
  onClose: () => void;
}

type DeviceSize = 'mobile' | 'tablet' | 'desktop';

const deviceSizes: Record<DeviceSize, string> = {
  mobile: 'max-w-[375px]',
  tablet: 'max-w-[768px]',
  desktop: 'max-w-[1024px]'
};

const SurveyPreviewModal: React.FC<SurveyPreviewModalProps> = ({ survey, isOpen, onClose }) => {
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop');
  const [completed, setCompleted] = useState(false);
  const [visitedPath, setVisitedPath] = useState<string[]>([]);

  if (!isOpen) return null;

  const questions = survey.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 
    ? Math.min(100, ((visitedPath.length || 1) / questions.length) * 100)
    : 0;
  const isAnonymous = survey.isAnonymous || survey.is_anonymous;

  const handleAnswer = (value: any) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    
    // Use logic engine to determine next question
    const result = evaluateLogic(
      {
        id: currentQuestion.id,
        type: currentQuestion.type,
        content: currentQuestion.content,
        options: currentQuestion.options,
      },
      answers[currentQuestion.id],
      questions.map(q => ({
        id: q.id,
        type: q.type,
        content: q.content,
        options: q.options,
      })),
      answers
    );

    if (result.nextQuestionIndex === 'end' || result.nextQuestionIndex >= questions.length) {
      setCompleted(true);
    } else {
      const nextQuestion = questions[result.nextQuestionIndex];
      setVisitedPath(prev => [...prev, nextQuestion.id]);
      setCurrentQuestionIndex(result.nextQuestionIndex);
    }
  };

  const handlePrevious = () => {
    if (visitedPath.length <= 1) return;
    
    const newPath = visitedPath.slice(0, -1);
    const previousQuestionId = newPath[newPath.length - 1];
    const previousIndex = questions.findIndex(q => q.id === previousQuestionId);
    
    if (previousIndex !== -1) {
      setVisitedPath(newPath);
      setCurrentQuestionIndex(previousIndex);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setCompleted(false);
    setVisitedPath([]);
  };

  const isRequired = currentQuestion?.is_required || currentQuestion?.isRequired;
  const canProceed = !isRequired || answers[currentQuestion?.id] !== undefined;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      {/* Header bar */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900 text-white px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">👁️ Preview Mode</span>
          <div className="flex gap-2">
            {(['mobile', 'tablet', 'desktop'] as DeviceSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setDeviceSize(size)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  deviceSize === size
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {size === 'mobile' && '📱'}
                {size === 'tablet' && '📱'}
                {size === 'desktop' && '🖥️'}
                {' '}{size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRestart}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
          >
            🔄 Restart
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            ✕ Exit Preview
          </button>
        </div>
      </div>

      {/* Preview container */}
      <div className={`mt-16 w-full ${deviceSizes[deviceSize]} mx-auto h-[calc(100vh-5rem)] overflow-hidden rounded-lg shadow-2xl`}>
        <div className="h-full overflow-y-auto bg-gradient-to-br from-primary-50 to-white">
          
          {/* Welcome Screen */}
          {!started && !completed && (
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{survey.title}</h1>
                {survey.description && (
                  <p className="text-gray-600 mb-6">{survey.description}</p>
                )}
                <div className="text-sm text-gray-500 mb-8">
                  <p>{questions.length} questions</p>
                  <p className="mt-1">Takes about {Math.ceil(questions.length * 0.5)} minutes</p>
                </div>
                {questions.length > 0 ? (
                  <button
                    onClick={() => {
                      setStarted(true);
                      if (questions.length > 0) {
                        setVisitedPath([questions[0].id]);
                      }
                    }}
                    className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Start Survey
                  </button>
                ) : (
                  <div className="text-amber-600 bg-amber-50 p-4 rounded-lg">
                    ⚠️ No questions added yet. Add questions to preview the survey.
                  </div>
                )}
                {isAnonymous && (
                  <p className="text-sm text-gray-500 mt-4">🔒 Your responses are anonymous</p>
                )}
              </div>
            </div>
          )}

          {/* Question Screen */}
          {started && !completed && currentQuestion && (
            <>
              {/* Progress bar */}
              <div className="sticky top-0 left-0 right-0 h-2 bg-gray-200 z-10">
                <div
                  className="h-full bg-primary-600 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="max-w-2xl mx-auto px-4 py-12">
                {/* Question number */}
                <div className="text-center mb-8">
                  <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    Question {visitedPath.length || currentQuestionIndex + 1}
                  </span>
                </div>

                {/* Question */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
                    {currentQuestion.content}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                  </h2>

                  <div className="mb-10">
                    <QuestionRenderer
                      question={{
                        ...currentQuestion,
                        isRequired: isRequired
                      }}
                      value={answers[currentQuestion.id]}
                      onChange={handleAnswer}
                    />
                  </div>

                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={handlePrevious}
                      disabled={visitedPath.length <= 1}
                      className="px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed}
                      className="px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
                    >
                      {currentQuestionIndex === questions.length - 1 ? (
                        <>
                          Submit
                          <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          Continue
                          <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Completion Screen */}
          {completed && (
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
                <p className="text-gray-600 mb-8">
                  Your responses have been submitted successfully.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                  <strong>Preview Mode:</strong> No data was actually saved. This is just a preview of how the survey completion will look.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SurveyPreviewModal;
