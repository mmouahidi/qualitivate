import React from 'react';
import QuestionRenderer from '../QuestionRenderer';

interface LivePreviewProps {
    survey: {
        title: string;
        description?: string;
        questions?: any[];
    } | null;
    isMobile?: boolean;
}

const LivePreview: React.FC<LivePreviewProps> = ({ survey, isMobile = false }) => {
    if (!survey) {
        return (
            <div className="h-full flex items-center justify-center text-text-muted">
                <p>Loading preview...</p>
            </div>
        );
    }

    return (
        <div className={`h-full overflow-auto ${isMobile ? 'max-w-sm mx-auto' : ''}`}>
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                {/* Survey Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
                    <h1 className="text-xl font-bold">{survey.title || 'Untitled Survey'}</h1>
                    {survey.description && (
                        <p className="mt-2 text-primary-100">{survey.description}</p>
                    )}
                </div>

                <div className="p-6 space-y-6">
                    {survey.questions && survey.questions.length > 0 ? (
                        survey.questions.map((question, index) => {
                            const isInformational = ['html', 'panel', 'panel_dynamic'].includes(question.type);
                            return (
                                <div key={question.id} className="border-b border-border pb-6 last:border-0">
                                    <div className="flex items-start gap-2 mb-3">
                                        {!isInformational && (
                                            <span className="text-sm font-medium text-text-muted mt-0.5">{index + 1}.</span>
                                        )}
                                        <div className="flex-1">
                                            {isInformational ? (
                                                <div className="mb-2">
                                                    {question.content && <h2 className="text-lg font-bold text-text-primary mb-1">{question.content}</h2>}
                                                    {question.options?.description && <p className="text-text-secondary whitespace-pre-wrap">{question.options.description}</p>}
                                                </div>
                                            ) : (
                                                <p className="font-medium text-text-primary">
                                                    {question.content || 'Untitled question'}
                                                    {question.is_required && <span className="text-red-500 ml-1">*</span>}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {(!isInformational || (isInformational && question.type !== 'html')) && (
                                        <div className={isInformational ? "mt-2" : "ml-5"}>
                                            <QuestionRenderer
                                                question={question}
                                                value={null}
                                                onChange={() => { }}
                                                disabled
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-text-muted">
                            <p>No questions yet</p>
                            <p className="text-sm mt-1">Add questions to see them here</p>
                        </div>
                    )}
                </div>

                {/* Submit Button Preview */}
                {survey.questions && survey.questions.length > 0 && (
                    <div className="px-6 pb-6">
                        <button disabled className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg opacity-50 cursor-not-allowed">
                            Submit
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LivePreview;
