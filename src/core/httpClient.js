/**
 * HTTP Client with retry logic and observability
 */

import http from 'k6/http';
import { getBaseUrl, getDefaultHeaders } from '../config/environments.js';
import { logger } from './logger.js';
import { recordApiMetrics, recordEndpointMetrics } from './metrics.js';

export class HttpClient {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || getBaseUrl();
        this.defaultHeaders = { ...getDefaultHeaders(), ...options.headers };
        this.timeout = options.timeout || '30s';
        this.retries = options.retries || 0;
    }

    buildUrl(path) {
        return `${this.baseUrl}${path}`;
    }

    mergeHeaders(headers = {}) {
        return { ...this.defaultHeaders, ...headers };
    }

    processResponse(response, method, url, endpointType = 'api') {
        const duration = response.timings.duration;
        const success = response.status >= 200 && response.status < 400;

        logger.http(method, url, response.status, duration);
        recordApiMetrics(url, duration, success, response.status);
        recordEndpointMetrics(endpointType, duration);

        return {
            status: response.status,
            body: response.body,
            json: () => {
                try { return response.json(); }
                catch (e) { return null; }
            },
            headers: response.headers,
            timings: response.timings,
            success
        };
    }

    executeWithRetry(requestFn, method, url, endpointType) {
        let lastError;

        for (let attempt = 0; attempt <= this.retries; attempt++) {
            try {
                const response = requestFn();
                if (response.status < 500 || attempt === this.retries) {
                    return this.processResponse(response, method, url, endpointType);
                }
                logger.warn(`Retry ${attempt + 1}/${this.retries} for ${method} ${url}`);
            } catch (error) {
                lastError = error;
                logger.error(`Request failed: ${method} ${url}`, { error: error.message });
            }
        }
        throw lastError;
    }

    get(path, params = {}, options = {}) {
        const url = this.buildUrl(path);
        const requestParams = {
            headers: this.mergeHeaders(options.headers),
            tags: { type: options.endpointType || 'api', method: 'GET' },
            timeout: this.timeout
        };
        return this.executeWithRetry(() => http.get(url, requestParams), 'GET', url, options.endpointType || 'api');
    }

    post(path, body = {}, options = {}) {
        const url = this.buildUrl(path);
        const requestParams = {
            headers: this.mergeHeaders(options.headers),
            tags: { type: options.endpointType || 'api', method: 'POST' },
            timeout: this.timeout
        };
        return this.executeWithRetry(() => http.post(url, JSON.stringify(body), requestParams), 'POST', url, options.endpointType || 'api');
    }

    put(path, body = {}, options = {}) {
        const url = this.buildUrl(path);
        const requestParams = {
            headers: this.mergeHeaders(options.headers),
            tags: { type: options.endpointType || 'api', method: 'PUT' },
            timeout: this.timeout
        };
        return this.executeWithRetry(() => http.put(url, JSON.stringify(body), requestParams), 'PUT', url, options.endpointType || 'api');
    }

    patch(path, body = {}, options = {}) {
        const url = this.buildUrl(path);
        const requestParams = {
            headers: this.mergeHeaders(options.headers),
            tags: { type: options.endpointType || 'api', method: 'PATCH' },
            timeout: this.timeout
        };
        return this.executeWithRetry(() => http.patch(url, JSON.stringify(body), requestParams), 'PATCH', url, options.endpointType || 'api');
    }

    delete(path, options = {}) {
        const url = this.buildUrl(path);
        const requestParams = {
            headers: this.mergeHeaders(options.headers),
            tags: { type: options.endpointType || 'api', method: 'DELETE' },
            timeout: this.timeout
        };
        return this.executeWithRetry(() => http.del(url, null, requestParams), 'DELETE', url, options.endpointType || 'api');
    }
}

export const httpClient = new HttpClient();
export default HttpClient;
