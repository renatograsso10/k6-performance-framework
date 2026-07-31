/**
 * Spike Test - Sudden traffic burst
 */

import { group, sleep } from 'k6';
import { getThresholds } from '../src/config/thresholds.js';
import { createRunProfile } from '../src/core/runProfile.js';
import { checkSwapiResponse, getSwapiResource, randomSwapiResource } from '../src/workloads/swapi.js';

const profile = createRunProfile({
    name: 'spike',
    options: {
        stages: [
            { duration: '30s', target: 10 },
            { duration: '10s', target: 300 },
            { duration: '1m', target: 300 },
            { duration: '10s', target: 10 },
            { duration: '1m', target: 10 },
            { duration: '30s', target: 0 }
        ],
        thresholds: getThresholds('spike')
    },
    metadata: { intent: 'measure sudden traffic recovery', workload: 'people and planets reads' }
});

export const options = profile.options;
export const setup = profile.setup;
export const teardown = profile.teardown;
export const handleSummary = profile.handleSummary;

export default function () {
    group('Spike Traffic', () => {
        const resource = randomSwapiResource(['people', 'planets']);
        const response = getSwapiResource(resource);
        checkSwapiResponse(response, `${resource}.get`);
    });

    sleep(0.1);
}
