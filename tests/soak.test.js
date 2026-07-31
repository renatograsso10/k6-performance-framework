/**
 * Soak Test - Extended duration stability
 */

import { group, sleep } from 'k6';
import { getThresholds } from '../src/config/thresholds.js';
import { createRunProfile } from '../src/core/runProfile.js';
import { checkSwapiResponse, getSwapiResource, randomSwapiResource } from '../src/workloads/swapi.js';

const profile = createRunProfile({
    name: 'soak',
    options: {
        stages: [
            { duration: '2m', target: 50 },
            { duration: '30m', target: 50 },
            { duration: '2m', target: 0 }
        ],
        thresholds: getThresholds('soak')
    },
    metadata: { intent: 'detect degradation over sustained traffic', workload: 'people, planets and starships reads' }
});

export const options = profile.options;
export const setup = profile.setup;
export const teardown = profile.teardown;
export const handleSummary = profile.handleSummary;

export default function () {
    const resource = randomSwapiResource(['people', 'planets', 'starships']);

    group('Soak Operations', () => {
        const response = getSwapiResource(resource);
        checkSwapiResponse(response, `${resource}.get`);
    });

    sleep(0.5);
}
