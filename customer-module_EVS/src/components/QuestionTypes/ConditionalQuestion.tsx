import React from 'react';
import type { FollowUpQuestion } from '../../types';
import { useQuestionLogic } from '../../hooks/useQuestionLogic';

interface ConditionalQuestionProps {
  question: FollowUpQuestion;
  parentAnswer: any;
  renderQuestion: (question: FollowUpQuestion) => React.ReactNode;
}

export default function ConditionalQuestion({
  question,
  parentAnswer,
  renderQuestion,
}: ConditionalQuestionProps) {
  const { evaluateCondition } = useQuestionLogic();

  if (!question.showWhen) return null;

  const shouldShow = evaluateCondition(parentAnswer, question.showWhen.value);

  if (!shouldShow) return null;

  return (
    <div className="ml-4 mt-3 pl-4 border-l border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-left-2 duration-500">
      <div className="py-2">
        {renderQuestion(question)}
      </div>
    </div>
  );
}