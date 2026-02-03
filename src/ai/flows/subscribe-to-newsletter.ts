'use server';

/**
 * @fileOverview A newsletter subscription AI agent.
 *
 * - subscribeToNewsletter - A function that handles the newsletter subscription process.
 * - NewsletterSubscriptionInput - The input type for the subscribeToNewsletter function.
 * - NewsletterSubscriptionOutput - The return type for the subscribeToNewsletter function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewsletterSubscriptionInputSchema = z.object({
  email: z.string().email().describe('The email address of the subscriber.'),
});
export type NewsletterSubscriptionInput = z.infer<
  typeof NewsletterSubscriptionInputSchema
>;

const NewsletterSubscriptionOutputSchema = z.object({
  message: z.string().describe('The result of the subscription attempt.'),
});
export type NewsletterSubscriptionOutput = z.infer<
  typeof NewsletterSubscriptionOutputSchema
>;

export async function subscribeToNewsletter(
  input: NewsletterSubscriptionInput
): Promise<NewsletterSubscriptionOutput> {
  return subscribeToNewsletterFlow(input);
}

const subscribeToNewsletterFlow = ai.defineFlow(
  {
    name: 'subscribeToNewsletterFlow',
    inputSchema: NewsletterSubscriptionInputSchema,
    outputSchema: NewsletterSubscriptionOutputSchema,
  },
  async (input) => {
    // In a real app, you would add logic here to save the email to a
    // database or a mailing list service like Mailchimp.
    console.log(`New newsletter subscription from: ${input.email}`);
    
    // For now, we'll just return a success message.
    return {
      message: `Successfully subscribed ${input.email} to the newsletter.`,
    };
  }
);
