/**
 * K6 Options with Scenarios API and traditional Stages
 */

import { getThresholds } from './thresholds.js';

// Modern Scenarios format (recommended)
export const smokeScenariosOptions = {
    scenarios: {
        basic_validation: { executor: 'constant-vus', vus: 2, duration: '1m' },
        mini_spike: {
            executor: 'ramping-vus', startVUs: 0, startTime: '1m',
            stages: [{ duration: '30s', target: 5 }, { duration: '30s', target: 0 }]
        }
    },
    thresholds: getThresholds('smoke')
};

export const loadScenariosOptions = {
    scenarios: {
        steady_state: { executor: 'constant-vus', vus: 50, duration: '10m' },
        ramping_users: {
            executor: 'ramping-vus', startVUs: 0,
            stages: [
                { duration: '2m', target: 30 }, { duration: '5m', target: 50 },
                { duration: '2m', target: 30 }, { duration: '1m', target: 0 }
            ]
        },
        request_burst: {
            executor: 'constant-arrival-rate', rate: 100, timeUnit: '1s',
            duration: '2m', preAllocatedVUs: 20, maxVUs: 50, startTime: '5m'
        }
    },
    thresholds: getThresholds('load')
};

// Traditional Stages format (backwards compatible)
export const smokeOptions = {
    stages: [
        { duration: '30s', target: 3 }, { duration: '1m', target: 3 }, { duration: '30s', target: 0 }
    ],
    thresholds: getThresholds('smoke')
};

export const loadOptions = {
    stages: [
        { duration: '2m', target: 50 }, { duration: '5m', target: 100 },
        { duration: '5m', target: 100 }, { duration: '2m', target: 50 }, { duration: '1m', target: 0 }
    ],
    thresholds: getThresholds('load')
};

export const stressOptions = {
    stages: [
        { duration: '2m', target: 100 }, { duration: '3m', target: 200 },
        { duration: '3m', target: 300 }, { duration: '3m', target: 400 },
        { duration: '3m', target: 500 }, { duration: '2m', target: 0 }
    ],
    thresholds: getThresholds('stress')
};

export const spikeOptions = {
    stages: [
        { duration: '30s', target: 10 }, { duration: '10s', target: 300 },
        { duration: '1m', target: 300 }, { duration: '10s', target: 10 },
        { duration: '1m', target: 10 }, { duration: '30s', target: 0 }
    ],
    thresholds: getThresholds('spike')
};

export const soakOptions = {
    stages: [
        { duration: '2m', target: 50 }, { duration: '30m', target: 50 }, { duration: '2m', target: 0 }
    ],
    thresholds: getThresholds('soak')
};

export function getOptions(type, useScenarios = false) {
    if (useScenarios) {
        return { smoke: smokeScenariosOptions, load: loadScenariosOptions }[type] || smokeScenariosOptions;
    }
    return { smoke: smokeOptions, load: loadOptions, stress: stressOptions, spike: spikeOptions, soak: soakOptions }[type] || smokeOptions;
}

export default { smokeScenariosOptions, loadScenariosOptions, smokeOptions, loadOptions, stressOptions, spikeOptions, soakOptions, getOptions };
