/**
 * Smoke Test - Quick validation with SWAPI
 */

import { group, sleep } from 'k6';
import { getThresholds } from '../src/config/thresholds.js';
import { createRunProfile } from '../src/core/runProfile.js';
import { checkSwapiResponse, getSwapiResource, listSwapiResource } from '../src/workloads/swapi.js';

const profile = createRunProfile({
    name: 'smoke',
    options: {
        stages: [
            { duration: '30s', target: 2 },
            { duration: '1m', target: 3 },
            { duration: '30s', target: 0 }
        ],
        thresholds: getThresholds('smoke')
    },
    metadata: { intent: 'validate target health', workload: 'SWAPI list and get' }
});

export const options = profile.options;
export const setup = profile.setup;
export const teardown = profile.teardown;
export const handleSummary = profile.handleSummary;

export default function () {
    group('People API', () => {
        const listResp = listSwapiResource('people');
        checkSwapiResponse(listResp, 'people.list');
        sleep(0.3);

        const getResp = getSwapiResource('people');
        checkSwapiResponse(getResp, 'people.get');
        sleep(0.3);
    });

    group('Planets API', () => {
        const listResp = listSwapiResource('planets');
        checkSwapiResponse(listResp, 'planets.list');
        sleep(0.3);
    });

    group('Starships API', () => {
        const listResp = listSwapiResource('starships');
        checkSwapiResponse(listResp, 'starships.list');
        sleep(0.3);
    });

    group('Films API', () => {
        const listResp = listSwapiResource('films');
        checkSwapiResponse(listResp, 'films.list');
    });

    sleep(0.5);
}
