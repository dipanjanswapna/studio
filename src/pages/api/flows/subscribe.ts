import type { NextApiRequest, NextApiResponse } from 'next';
import { subscribeToNewsletter, type NewsletterSubscriptionOutput } from '@/ai/flows/subscribe-to-newsletter';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<NewsletterSubscriptionOutput | { error: string }>
) {
    if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email } = req.body;

    if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
    }

    try {
    const result = await subscribeToNewsletter({ email });
    return res.status(200).json(result);
    } catch (error: any) {
    console.error('Error in subscribe API:', error);
    return res.status(500).json({ error: 'Failed to subscribe.' });
    }
}
