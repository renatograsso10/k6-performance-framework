/**
 * Stress Test - Push beyond normal load
 */

import { group, sleep } from 'k6';
import { getThresholds } from '../src/config/thresholds.js';
import { createRunProfile } from '../src/core/runProfile.js';
import { checkSwapiResponse, getSwapiResource, randomSwapiResource } from '../src/workloads/swapi.js';

const profile = createRunProfile({
    name: 'stress',
    options: {
        stages: [
            { duration: '2m', target: 100 },
            { duration: '3m', target: 200 },
            { duration: '3m', target: 300 },
            { duration: '3m', target: 400 },
            { duration: '3m', target: 500 },
            { duration: '2m', target: 0 }
        ],
        thresholds: getThresholds('stress')
    },
    metadata: { intent: 'measure degradation beyond expected traffic', workload: 'people and planets reads' }
});

export const options = profile.options;
export const setup = profile.setup;
export const teardown = profile.teardown;
export const handleSummary = profile.handleSummary;

export default function () {
    const resource = randomSwapiResource(['people', 'planets']);

    group(`${resource} API`, () => {
        const response = getSwapiResource(resource);
        checkSwapiResponse(response, `${resource}.get`);
    });

    sleep(0.2);
}
