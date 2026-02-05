/**
 * People API client (SWAPI)
 */

import { HttpClient } from '../core/httpClient.js';
import { logger } from '../core/logger.js';

const client = new HttpClient();

export const peopleApi = {
    list(page = 1) {
        logger.debug('Fetching people list', { page });
        return client.get(`/api/people/?page=${page}`, {}, { endpointType: 'people' });
    },

    get(id) {
        logger.debug('Fetching person', { id });
        return client.get(`/api/people/${id}/`, {}, { endpointType: 'people' });
    },

    search(name) {
        logger.debug('Searching people', { name });
        return client.get(`/api/people/?search=${name}`, {}, { endpointType: 'people' });
    }
};

export default peopleApi;
