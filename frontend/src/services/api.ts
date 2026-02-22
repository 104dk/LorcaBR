import axios from 'axios';

export interface LorcanaCard {
    id: string; // The API sometimes uses different IDs
    name: string;
    title: string;
    cost: number;
    inkwell: number;
    color: string;
    type: string;
    action_text: string;
    lore: number;
    strength: number;
    willpower: number;
    image_urls: {
        en?: string;
        pt?: string; // we will try to support pt-br if the API has it
    };
}

const LORCANA_API_BASE = 'https://api.lorcana-api.com/cards/fetch';

// Simple in-memory cache to prevent spamming the Lorcana API
const cache = new Map<string, any>();

export const lorcanaApi = {
    /**
     * Fetch all cards efficiently (with a simple client-side cache)
     */
    async fetchAllCards(): Promise<LorcanaCard[]> {
        if (cache.has('ALL_CARDS')) {
            return cache.get('ALL_CARDS');
        }

        try {
            const response = await axios.get(`${LORCANA_API_BASE}?search=all`);
            // The API returns an array or an object depending on the endpoint.
            // Usually fetch?search=all returns a large array of objects.
            const cards: LorcanaCard[] = response.data;

            cache.set('ALL_CARDS', cards);
            return cards;
        } catch (error) {
            console.error('Failed to fetch cards from Lorcana API', error);
            return [];
        }
    },

    /**
     * Search cards by name
     */
    async searchCards(query: string): Promise<LorcanaCard[]> {
        const allCards = await this.fetchAllCards();
        return allCards.filter(card =>
            card.name.toLowerCase().includes(query.toLowerCase()) ||
            (card.title && card.title.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 50); // limit to 50 results
    }
};
