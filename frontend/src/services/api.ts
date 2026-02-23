import axios from 'axios';
import { CardAbilities } from '../store/useStore';

/** Matches the structure of public/lorcana-database.json */
export interface LorcanaCard {
    id: string;
    name: string;
    title: string;
    type: string;      // Character | Action | Item | Location | Song
    color: string;
    cost: number;
    inkable: boolean;
    strength: number;
    willpower: number;
    lore: number;      // Lore value per quest
    abilities: CardAbilities;
    body_text: string;
    image_urls: {
        en?: string;
        pt?: string;
    };
}

const LOCAL_DATABASE_URL = '/lorcana-database.json';

// In-memory cache to avoid re-fetching on every search
const cache = new Map<string, LorcanaCard[]>();

export const lorcanaApi = {
    async fetchAllCards(): Promise<LorcanaCard[]> {
        if (cache.has('ALL_CARDS')) return cache.get('ALL_CARDS')!;

        try {
            const { data } = await axios.get<LorcanaCard[]>(LOCAL_DATABASE_URL);
            const cards = Array.isArray(data) ? data : [];
            cache.set('ALL_CARDS', cards);
            return cards;
        } catch (e) {
            console.error('Failed to load local lorcana-database.json', e);
            return [];
        }
    },

    async searchCards(query: string): Promise<LorcanaCard[]> {
        const all = await this.fetchAllCards();
        const q = query.toLowerCase();
        return all
            .filter(c => c?.name && c.name.toLowerCase().includes(q))
            .slice(0, 50);
    },
};
