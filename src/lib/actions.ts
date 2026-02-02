'use server';

import { z } from 'zod';
import { answerPolicyQuestions } from '@/ai/flows/answer-policy-questions';

const policyContext = `Dr. Monisha Chakraborty is a doctor who left her government job to serve people directly, believing she couldn't remain neutral in that role. She is known as the "doctor of the poor" in Barishal and provided door-to-door care during the COVID-19 pandemic, disregarding her own safety. She is involved in left-wing politics, speaks for the people, and stays by their side. There are no allegations of theft, extortion, or deception against her. Her goal is to bring honest and effective representation to parliament for the benefit of her area and the country.`;

const questionSchema = z.object({
  question: z.string().min(10, 'Your question is too short.').max(500, 'Your question is too long.'),
});

export async function askQuestion(prevState: any, formData: FormData) {
  const validatedFields = questionSchema.safeParse({
    question: formData.get('question'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.question?.[0] || "Invalid question.",
    };
  }

  const question = validatedFields.data.question;

  try {
    const result = await answerPolicyQuestions({ question, context: policyContext });
    return {
      answer: result.answer,
    };
  } catch (error) {
    console.error(error);
    return {
      error: 'The AI is currently unavailable. Please try again later.',
    };
  }
}

const volunteerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(5, 'Please enter a valid phone number.').optional().or(z.literal('')),
});

export async function volunteerSignup(prevState: any, formData: FormData) {
  const validatedFields = volunteerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Please check your input and try again.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  // Here you would typically save the volunteer data to a database.
  // For this example, we'll just simulate a successful submission.
  console.log('New Volunteer:', validatedFields.data);

  return {
    status: 'success',
    message: 'Thank you for signing up! We will be in touch soon.',
  };
}
