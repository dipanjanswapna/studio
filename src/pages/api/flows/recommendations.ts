import type { NextApiRequest, NextApiResponse } from 'next';
import { getPersonalizedProductRecommendations, type PersonalizedProductRecommendationsInput, type PersonalizedProductRecommendationsOutput } from '@/ai/flows/personalized-product-recommendations';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<PersonalizedProductRecommendationsOutput | { error: string }>
) {
    if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { purchaseHistory, browsingHistory, numberOfRecommendations }: PersonalizedProductRecommendationsInput = req.body;

    try {
    const result = await getPersonalizedProductRecommendations({
        purchaseHistory,
        browsingHistory,
        numberOfRecommendations,
    });
    return res.status(200).json(result);
    } catch (error: any) {
    console.error('Error in recommendations API:', error);
    return res.status(500).json({ error: 'Failed to get recommendations.' });
    }
}
