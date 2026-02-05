/**
 * Planets API client (SWAPI)
 */

import { HttpClient } from '../core/httpClient.js';
import { logger } from '../core/logger.js';

const client = new HttpClient();

export const planetsApi = {
    list(page = 1) {
        logger.debug('Fetching planets list', { page });
        return client.get(`/api/planets/?page=${page}`, {}, { endpointType: 'planets' });
    },

    get(id) {
        logger.debug('Fetching planet', { id });
        return client.get(`/api/planets/${id}/`, {}, { endpointType: 'planets' });
    },

    search(name) {
        logger.debug('Searching planets', { name });
        return client.get(`/api/planets/?search=${name}`, {}, { endpointType: 'planets' });
    }
};

export default planetsApi;
