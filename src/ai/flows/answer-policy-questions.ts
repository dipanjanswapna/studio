'use server';

/**
 * @fileOverview This file defines a Genkit flow for answering questions about Dr. Chakraborty's policies.
 *
 * It includes:
 * - `answerPolicyQuestions`: An exported function to answer policy questions.
 * - `AnswerPolicyQuestionsInput`: The input type for the `answerPolicyQuestions` function.
 * - `AnswerPolicyQuestionsOutput`: The output type for the `answerPolicyQuestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerPolicyQuestionsInputSchema = z.object({
  question: z.string().describe('The question about Dr. Chakraborty’s policies.'),
  context: z.string().describe('The context containing Dr. Chakraborty’s provided statements.'),
});
export type AnswerPolicyQuestionsInput = z.infer<typeof AnswerPolicyQuestionsInputSchema>;

const AnswerPolicyQuestionsOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about Dr. Chakraborty’s policies.'),
});
export type AnswerPolicyQuestionsOutput = z.infer<typeof AnswerPolicyQuestionsOutputSchema>;

export async function answerPolicyQuestions(input: AnswerPolicyQuestionsInput): Promise<AnswerPolicyQuestionsOutput> {
  return answerPolicyQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerPolicyQuestionsPrompt',
  input: {schema: AnswerPolicyQuestionsInputSchema},
  output: {schema: AnswerPolicyQuestionsOutputSchema},
  prompt: `You are an AI assistant designed to answer questions about Dr. Chakraborty’s policies.
  Use the provided context to answer the question accurately and concisely.
  If the answer is not in the context, say you do not know.

  Context: {{{context}}}

  Question: {{{question}}}

  Answer:`,
});

const answerPolicyQuestionsFlow = ai.defineFlow(
  {
    name: 'answerPolicyQuestionsFlow',
    inputSchema: AnswerPolicyQuestionsInputSchema,
    outputSchema: AnswerPolicyQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
