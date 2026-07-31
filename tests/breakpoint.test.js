/**
 * Breakpoint Test - Finds system's maximum capacity
 */

import { sleep, group } from 'k6';
import { createRunProfile } from '../src/core/runProfile.js';
import { analyzeBreakpoint } from '../src/core/scenarioAnalysis.js';
import { checkSwapiResponse, getSwapiResource, randomSwapiResource } from '../src/workloads/swapi.js';

export const BREAKPOINT_LEVELS = Object.freeze([50, 100, 200, 300, 500, 700, 1000]);

const scenarios = {};
const thresholds = {};
for (const [index, vus] of BREAKPOINT_LEVELS.entries()) {
    const scenario = `vus_${String(vus).padStart(4, '0')}`;
    scenarios[scenario] = {
        executor: 'constant-vus',
        vus,
        duration: '2m',
        startTime: `${index * 2}m`,
        gracefulStop: '0s',
        exec: 'breakpointRequest'
    };
    thresholds[`http_req_duration{scenario:${scenario}}`] = ['p(95)<3000'];
    thresholds[`http_req_failed{scenario:${scenario}}`] = ['rate<0.15'];
    thresholds[`checks{scenario:${scenario}}`] = ['rate>0.80'];
}

const profile = createRunProfile({
    name: 'breakpoint',
    options: {
        scenarios,
        thresholds
    },
    metadata: { intent: 'find maximum healthy capacity', workload: 'people and planets reads' },
    summaryExtension(data) {
        const breakpoint = analyzeBreakpoint(data, BREAKPOINT_LEVELS);
        console.log(`Breakpoint: max healthy VUs=${breakpoint.maxHealthyVus ?? 'not found'}, first failed=${breakpoint.firstFailedVus ?? 'none'}`);
        return { breakpoint };
    }
});

export const options = profile.options;
export const setup = profile.setup;
export const teardown = profile.teardown;

export function breakpointRequest() {
    const resource = randomSwapiResource(['people', 'planets']);

    group(`${resource} Operations`, () => {
        const response = getSwapiResource(resource);
        checkSwapiResponse(response, `${resource}.get`);
    });

    sleep(Math.random() * 0.5 + 0.2);
}

export default breakpointRequest;
export const handleSummary = profile.handleSummary;
