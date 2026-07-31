/**
 * Load Test - Normal expected traffic simulation
 */

import { group } from 'k6';
import { getThresholds } from '../src/config/thresholds.js';
import { createRunProfile } from '../src/core/runProfile.js';
import { checkSwapiResponse, getSwapiResource, randomSwapiResource } from '../src/workloads/swapi.js';

const profile = createRunProfile({
    name: 'load',
    options: {
        scenarios: {
            load: {
                executor: 'constant-arrival-rate',
                rate: 20,
                timeUnit: '1s',
                duration: '10m',
                preAllocatedVUs: 25,
                maxVUs: 100,
                gracefulStop: '30s'
            }
        },
        thresholds: getThresholds('load')
    },
    metadata: { intent: 'simulate expected traffic', workload: 'uniform SWAPI reads' }
});

export const options = profile.options;
export const setup = profile.setup;
export const teardown = profile.teardown;
export const handleSummary = profile.handleSummary;

export default function () {
    const endpoint = randomSwapiResource();

    group(`${endpoint} API`, () => {
        const response = getSwapiResource(endpoint);
        checkSwapiResponse(response, `${endpoint}.get`);
    });
}
