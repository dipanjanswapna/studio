'use server';

/**
 * @fileOverview A personalized product recommendation AI agent.
 *
 * - getPersonalizedProductRecommendations - A function that handles the product recommendation process.
 * - PersonalizedProductRecommendationsInput - The input type for the getPersonalizedProductRecommendations function.
 * - PersonalizedProductRecommendationsOutput - The return type for the getPersonalizedProductRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedProductRecommendationsInputSchema = z.object({
  purchaseHistory: z.array(z.string()).describe('List of product IDs the user has purchased.'),
  browsingHistory: z.array(z.string()).describe('List of product IDs the user has viewed.'),
  numberOfRecommendations: z.number().default(5).describe('The number of product recommendations to return.'),
});
export type PersonalizedProductRecommendationsInput = z.infer<typeof PersonalizedProductRecommendationsInputSchema>;

const PersonalizedProductRecommendationsOutputSchema = z.object({
  productRecommendations: z.array(z.string()).describe('List of product IDs recommended for the user.'),
});
export type PersonalizedProductRecommendationsOutput = z.infer<typeof PersonalizedProductRecommendationsOutputSchema>;

export async function getPersonalizedProductRecommendations(input: PersonalizedProductRecommendationsInput): Promise<PersonalizedProductRecommendationsOutput> {
  return personalizedProductRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedProductRecommendationsPrompt',
  input: {schema: PersonalizedProductRecommendationsInputSchema},
  output: {schema: PersonalizedProductRecommendationsOutputSchema},
  prompt: `You are a product recommendation expert for an e-commerce website.

Based on the user's purchase history and browsing history, you will recommend products that the user is likely to be interested in.

Only return a list of product IDs.  Do not include any other explanation.

Purchase History: {{purchaseHistory}}
Browsing History: {{browsingHistory}}

Number of Recommendations: {{numberOfRecommendations}}`,
});

const personalizedProductRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedProductRecommendationsFlow',
    inputSchema: PersonalizedProductRecommendationsInputSchema,
    outputSchema: PersonalizedProductRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
