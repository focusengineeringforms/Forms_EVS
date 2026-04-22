import type { FollowUpQuestion } from "../types";

export function useQuestionLogic() {
  const getOrderedVisibleQuestions = (
    questions: FollowUpQuestion[],
    answers: Record<string, any>
  ): FollowUpQuestion[] => {
    const orderedQuestions: FollowUpQuestion[] = [];
    const mainQuestions = questions.filter((q) => !q.showWhen);

    // Recursive function to process a question and all its nested follow-ups
    const processQuestionAndFollowUps = (questionId: string) => {
      // Find all direct follow-ups for this question
      const followUps = questions.filter(
        (q) => q.showWhen && q.showWhen.questionId === questionId
      );

      followUps.forEach((followUp) => {
        // Check if this follow-up should be shown based on the answer
        const parentAnswer = answers[questionId];
        const shouldShow = evaluateCondition(
          parentAnswer,
          followUp.showWhen?.value
        );

        if (shouldShow) {
          orderedQuestions.push(followUp);

          // Recursively process nested follow-ups if this follow-up has an answer
          if (answers[followUp.id]) {
            processQuestionAndFollowUps(followUp.id);
          }
        }
      });
    };

    // Process each main question and its follow-ups recursively
    mainQuestions.forEach((question) => {
      orderedQuestions.push(question);

      // If this question has an answer that might trigger follow-ups
      if (answers[question.id]) {
        processQuestionAndFollowUps(question.id);
      }
    });

    return orderedQuestions;
  };

  const evaluateCondition = (answer: any, condition: any): boolean => {
    if (!answer) return false;

    if (Array.isArray(answer)) {
      return answer.includes(condition);
    }

    if (typeof answer === "object") {
      return Object.values(answer).includes(condition);
    }

    return answer === condition;
  };

  const getFollowUpQuestions = (
    questions: FollowUpQuestion[],
    parentId: string
  ): FollowUpQuestion[] => {
    return questions.filter(
      (q) => q.showWhen && q.showWhen.questionId === parentId
    );
  };

  return {
    getOrderedVisibleQuestions,
    getFollowUpQuestions,
    evaluateCondition,
  };
}
