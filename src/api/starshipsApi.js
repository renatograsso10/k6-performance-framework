/**
 * Starships API client (SWAPI)
 */

import { HttpClient } from '../core/httpClient.js';
import { logger } from '../core/logger.js';

const client = new HttpClient();

export const starshipsApi = {
    list(page = 1) {
        logger.debug('Fetching starships list', { page });
        return client.get(`/api/starships/?page=${page}`, {}, { endpointType: 'starships' });
    },

    get(id) {
        logger.debug('Fetching starship', { id });
        return client.get(`/api/starships/${id}/`, {}, { endpointType: 'starships' });
    },

    search(name) {
        logger.debug('Searching starships', { name });
        return client.get(`/api/starships/?search=${name}`, {}, { endpointType: 'starships' });
    }
};

export default starshipsApi;
