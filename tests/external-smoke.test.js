/**
 * Low-volume, non-blocking public SWAPI availability probe.
 * This is not a load, stress, spike, soak, endurance, or breakpoint test.
 */

import { Rate } from 'k6/metrics';
import { checkSwapiResponse, getSwapiResource, randomSwapiResource } from '../src/workloads/swapi.js';
import { createRunProfile } from '../src/core/runProfile.js';

const externalAbortRate = new Rate('external_abort_rate');

const profile = createRunProfile({
    name: 'external-smoke',
    options: {
        scenarios: {
            external_smoke: {
                executor: 'constant-arrival-rate',
                rate: 1,
                timeUnit: '1s',
                duration: '60s',
                preAllocatedVUs: 1,
                maxVUs: 1
            }
        },
        thresholds: {
            external_abort_rate: [{ threshold: 'rate==0', abortOnFail: true, delayAbortEval: '1s' }],
            http_req_failed: ['rate<0.01'],
            checks: ['rate>0.99']
        }
    },
    metadata: { intent: 'observe public edge availability', workload: 'one capped SWAPI read per second' }
});

export const options = profile.options;
export const setup = profile.setup;
export const teardown = profile.teardown;
export const handleSummary = profile.handleSummary;

export default function () {
    const resource = randomSwapiResource();
    const response = getSwapiResource(resource);
    const mustAbort = response.status === 403 || response.status === 429 || response.status >= 500;

    externalAbortRate.add(mustAbort);
    checkSwapiResponse(response, `external.${resource}.get`);
}
