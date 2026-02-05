/**
 * Films API client (SWAPI)
 */

import { HttpClient } from '../core/httpClient.js';
import { logger } from '../core/logger.js';

const client = new HttpClient();

export const filmsApi = {
    list() {
        logger.debug('Fetching films list');
        return client.get('/api/films/', {}, { endpointType: 'films' });
    },

    get(id) {
        logger.debug('Fetching film', { id });
        return client.get(`/api/films/${id}/`, {}, { endpointType: 'films' });
    },

    search(title) {
        logger.debug('Searching films', { title });
        return client.get(`/api/films/?search=${title}`, {}, { endpointType: 'films' });
    }
};

export default filmsApi;
