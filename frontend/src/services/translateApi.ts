import axios from 'axios';

const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';
const CACHE_KEY = 'LorcanaBR_Translation_Cache';

interface Cache {
    [text: string]: string;
}

const getCache = (): Cache => {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
};

const setCache = (cache: Cache) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

export const translateApi = {
    async translateToPtBr(text: string): Promise<string> {
        if (!text || text.trim() === '') return '';

        const cache = getCache();
        if (cache[text]) return cache[text];

        try {
            const { data } = await axios.get(MYMEMORY_API_URL, {
                params: {
                    q: text,
                    langpair: 'en|pt-BR',
                    de: 'lorcana-br@translated.net' // Identify the client
                }
            });

            const translated = data.responseData.translatedText;

            // Basic cleanup of common card terms if MyMemory struggles
            let cleaned = translated;
            if (cleaned.toLowerCase().includes('bodyguard')) cleaned = cleaned.replace(/bodyguard/gi, 'Guarda-costas');
            if (cleaned.toLowerCase().includes('evasive')) cleaned = cleaned.replace(/evasive/gi, 'Evasivo');
            if (cleaned.toLowerCase().includes('ward')) cleaned = cleaned.replace(/ward/gi, 'Proteção');
            if (cleaned.toLowerCase().includes('rush')) cleaned = cleaned.replace(/rush/gi, 'Investida');
            if (cleaned.toLowerCase().includes('reckless')) cleaned = cleaned.replace(/reckless/gi, 'Imprudente');

            cache[text] = cleaned;
            setCache(cache);
            return cleaned;
        } catch (e) {
            console.error('Translation failed', e);
            return text; // Fallback to original
        }
    }
};
