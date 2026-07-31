/**
 * HTTP Client with retry logic and observability
 */

import http from 'k6/http';
import { getDefaultHeaders, getEnvironment } from '../config/environments.js';
import { logger } from './logger.js';
import { recordApiMetrics } from './metrics.js';
import { getRunId, getTargetKind } from './telemetry.js';

export class HttpClient {
    constructor(options = {}) {
        const environment = getEnvironment();
        this.baseUrl = options.baseUrl ?? environment.baseUrl;
        this.defaultHeaders = { ...getDefaultHeaders(), ...options.headers };
        this.timeout = options.timeout ?? environment.timeout;
        this.retries = options.retries ?? environment.maxRetries;
        this.runId = options.runId ?? getRunId();
        this.targetKind = options.targetKind ?? getTargetKind();
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
        recordApiMetrics(endpointType, duration, success, response.status, {
            run_id: this.runId,
            target_kind: this.targetKind
        });

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
                const processedResponse = this.processResponse(response, method, url, endpointType);
                if (response.status < 500 || attempt === this.retries) {
                    return processedResponse;
                }
                logger.warn(`Retry ${attempt + 1}/${this.retries} for ${method} ${url}`);
            } catch (error) {
                lastError = error;
                logger.error(`Request failed: ${method} ${url}`, { error: error.message });
            }
        }
        throw lastError;
    }

    get(path, options = {}) {
        const url = this.buildUrl(path);
        const requestParams = {
            headers: this.mergeHeaders(options.headers),
            tags: this.requestTags('GET', options.endpointType),
            timeout: this.timeout
        };
        return this.executeWithRetry(() => http.get(url, requestParams), 'GET', url, options.endpointType || 'api');
    }

    post(path, body = {}, options = {}) {
        const url = this.buildUrl(path);
        const requestParams = {
            headers: this.mergeHeaders(options.headers),
            tags: this.requestTags('POST', options.endpointType),
            timeout: this.timeout
        };
        return this.executeWithRetry(() => http.post(url, JSON.stringify(body), requestParams), 'POST', url, options.endpointType || 'api');
    }

    put(path, body = {}, options = {}) {
        const url = this.buildUrl(path);
        const requestParams = {
            headers: this.mergeHeaders(options.headers),
            tags: this.requestTags('PUT', options.endpointType),
            timeout: this.timeout
        };
        return this.executeWithRetry(() => http.put(url, JSON.stringify(body), requestParams), 'PUT', url, options.endpointType || 'api');
    }

    patch(path, body = {}, options = {}) {
        const url = this.buildUrl(path);
        const requestParams = {
            headers: this.mergeHeaders(options.headers),
            tags: this.requestTags('PATCH', options.endpointType),
            timeout: this.timeout
        };
        return this.executeWithRetry(() => http.patch(url, JSON.stringify(body), requestParams), 'PATCH', url, options.endpointType || 'api');
    }

    delete(path, options = {}) {
        const url = this.buildUrl(path);
        const requestParams = {
            headers: this.mergeHeaders(options.headers),
            tags: this.requestTags('DELETE', options.endpointType),
            timeout: this.timeout
        };
        return this.executeWithRetry(() => http.del(url, null, requestParams), 'DELETE', url, options.endpointType || 'api');
    }

    requestTags(method, endpointType = 'api') {
        return {
            type: endpointType,
            method,
            run_id: this.runId,
            target_kind: this.targetKind
        };
    }
}
